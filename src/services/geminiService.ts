import { GoogleGenAI, Type } from "@google/genai";
import { ragLookup, saveProductToCache } from "./ragService";
import { batchLookupIngredients, IngredientEntry, BatchLookupResult } from "../data/ingredientIntelligence";
import { calculateScore, NutritionData } from "./scoringEngine";
import { getIngredientsFromDB, saveIngredientToDB } from "./firestoreService";

// Helper to get a fresh Gemini instance
const getAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('[Gemini] GEMINI_API_KEY is missing. Create a .env.local file with GEMINI_API_KEY=your_key. Get a key at https://aistudio.google.com/app/apikey');
  }
  return new GoogleGenAI({ apiKey: key || "" });
};

/**
 * Helper to call Gemini with exponential backoff for 429 errors
 */
async function callGemini(fn: () => Promise<any>, retries = 3, delay = 2000): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    const errorString = JSON.stringify(error);
    if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED")) {
      if (retries > 0) {
        console.warn(`[Gemini] Quota hit, retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callGemini(fn, retries - 1, delay * 2);
      }
    }
    throw error;
  }
}

function withTimeout<T>(promise: Promise<T>, ms = 120_000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini call timed out after ${ms}ms`)), ms)
    )
  ]);
}

export const PRODUCT_CATEGORIES = [
  { id: "FOOD", label: "Food & Drink", emoji: "🥗" },
  { id: "COSMETIC", label: "Cosmetics", emoji: "💄" },
  { id: "PERSONAL_CARE", label: "Personal Care", emoji: "🧴" },
  { id: "SUPPLEMENT", label: "Supplement", emoji: "💊" },
  { id: "HOUSEHOLD", label: "Household", emoji: "🧹" },
  { id: "PET_FOOD", label: "Pet Food", emoji: "🐾" },
];

const DEFAULT_RESULT = {
  product_name: "Unknown Product",
  brand: "Unknown Brand",
  category: "FOOD",
  ingredients: [],
  nutrition: {
    energy_kcal: 0,
    sugar_g: 0,
    sodium_mg: 0,
    protein_g: 0,
    fat_g: 0,
    saturated_fat_g: 0,
    trans_fat_g: 0,
    fibre_g: 0
  },
  overall_score: 0,
  score_breakdown: [],
  summary: "Analysis failed. Please try again.",
  india_context: "",
  claim_checks: [],
  front_claims_detected: [],
  unverified_ingredients: [],
  is_upf: false,
  hfss_status: "GREEN",
  suggestions: []
};

function buildMasterPrompt(
  product_name: string,
  brand: string,
  category: string,
  nutrition: any,
  rawIngredients: string[],
  stillUnknown: string[],
  groundTruthBundle?: string
): string {
  return `You are a food and cosmetic safety expert in India.
    Analyze this product data and provide a complete health verdict.

    PRODUCT: ${product_name} (${brand})
    CATEGORY: ${category}
    NUTRITION: ${JSON.stringify(nutrition)}
    INGREDIENTS TO ANALYZE: ${JSON.stringify(rawIngredients)}
    UNKNOWN INGREDIENTS (Need details): ${JSON.stringify(stillUnknown)}
    ${groundTruthBundle ? `\nVERIFIED INGREDIENT CONTEXT (USE AS GROUND TRUTH):\n${groundTruthBundle}` : ''}

    TASK:
    1. For each UNKNOWN INGREDIENT, provide: common_names, function, safety_tier (GREEN/YELLOW/ORANGE/RED), plain_explanation, and condition_flags.
    2. Provide a summary, india_context, is_upf, hfss_status, and suggestions.

    CRITICAL: Suggestions MUST be generic categories or types of products (e.g., "Whole Wheat Biscuits", "Cold Pressed Oils") and NOT specific brands.

    Return ONLY JSON matching this structure:
    {
      "enriched_ingredients": { "ingredient_name": { "common_names": [], "function": "", "safety_tier": "", "plain_explanation": "", "condition_flags": [] } },
      "summary": "",
      "india_context": "",
      "is_upf": boolean,
      "hfss_status": "",
      "suggestions": [
        { "type": "GENERIC", "name": "Generic Alternative Name", "reason": "Short explanation why it is better" }
      ]
    }`;
}

function buildSummaryOnlyPrompt(
  product_name: string,
  brand: string,
  category: string,
  nutrition: any,
  ingredients: any[]
): string {
  return `You are a food and cosmetic safety expert in India.
    The ingredients have already been verified and scored from our database.
    Your ONLY task is to write the narrative fields.

    PRODUCT: ${product_name} (${brand})
    CATEGORY: ${category}
    NUTRITION: ${JSON.stringify(nutrition)}
    VERIFIED INGREDIENTS: ${JSON.stringify(ingredients)}

    Return ONLY JSON with exactly these fields:
    {
      "summary": "2-3 sentence plain English verdict for an Indian consumer",
      "india_context": "Any India-specific note (FSSAI, common usage, regional relevance)",
      "is_upf": boolean,
      "hfss_status": "GREEN | HFSS",
      "suggestions": [{ "type": "GENERIC", "name": "...", "reason": "..." }]
    }`;
}

/**
 * Analyses product labels using Gemini API with RAG and Search fallback.
 */
export async function analyseLabel(
  backImageBase64: string,
  backMimeType: string,
  frontImageBase64?: string,
  frontMimeType?: string
) {
  const ai = getAI();
  try {
    // STEP 1: Extraction Pass
    const extractionModel = "gemini-3.1-pro-preview";
    const extractionPrompt = `Extract the following from this product label:
    1. Product Name and Brand.
    2. Category (FOOD, COSMETIC, PERSONAL_CARE, SUPPLEMENT, HOUSEHOLD, PET_FOOD).
    3. Full Ingredients List (as an array of strings).
    4. Nutritional Information per 100g/100ml. Use exactly these keys in the nutrition object:
       - energy_kcal (number)
       - sugar_g (number)
       - sodium_mg (number)
       - protein_g (number)
       - fat_g (number)
       - saturated_fat_g (number)
       - trans_fat_g (number)
       - fibre_g (number)

    Return ONLY JSON.`;

    const extractionParts: any[] = [
      { inlineData: { data: backImageBase64, mimeType: backMimeType } }
    ];
    if (frontImageBase64 && frontMimeType) {
      extractionParts.push({ inlineData: { data: frontImageBase64, mimeType: frontMimeType } });
    }

    const extractionResult = await withTimeout(callGemini(() => ai.models.generateContent({
      model: extractionModel,
      contents: [{ parts: [...extractionParts, { text: extractionPrompt }] }],
      config: { responseMimeType: "application/json" },
    })));

    if (!extractionResult.text) {
      throw new Error("Gemini failed to extract data from label.");
    }

    let extractedData;
    try {
      // When responseMimeType is application/json, text should be raw JSON
      extractedData = JSON.parse(extractionResult.text.trim());
    } catch (parseErr) {
      console.error("Failed to parse Gemini extraction results — text omitted for security");
      // Fallback for markdown-wrapped JSON
      const match = extractionResult.text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          extractedData = JSON.parse(match[0]);
        } catch (e) {
          throw new Error("Failed to parse label data.");
        }
      } else {
        throw new Error("Failed to parse label data.");
      }
    }

    let { ingredients: rawIngredients, nutrition, category, product_name, brand } = extractedData;

    // STEP 2: RAG Lookup
    const ragResult = await ragLookup({
      productName: product_name,
      extractedIngredients: rawIngredients,
      nutrition,
      productCategory: category
    });

    if (ragResult.layer === 1) {
      console.log('[Gemini] Layer 1 hit — returning cached verdict');
      return ragResult.cached_verdict;
    }

    // Layer 2: DB coverage ≥ 80% — score already computed, only need summary
    if (ragResult.layer === 2 && ragResult.partial_result) {
      console.log('[Gemini] Layer 2 hit — requesting summary only');
      const partial = ragResult.partial_result;
      const summaryPrompt = buildSummaryOnlyPrompt(
        product_name, brand, category, nutrition, partial.ingredients || []
      );
      const summaryResult = await withTimeout(callGemini(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: summaryPrompt }] }],
        config: { responseMimeType: 'application/json' },
      })));
      let summaryData: any = {};
      try {
        summaryData = JSON.parse(summaryResult.text?.trim() || '{}');
      } catch (e) {
        console.error('[Gemini] Layer 2 summary parse failed:', e);
      }
      const result = {
        ...DEFAULT_RESULT,
        product_name,
        brand,
        category,
        nutrition,
        ingredients: partial.ingredients || [],
        overall_score: partial.overall_score ?? 0,
        score_breakdown: partial.score_breakdown ?? [],
        summary: summaryData.summary || 'Analysis complete.',
        india_context: summaryData.india_context || '',
        is_upf: summaryData.is_upf ?? false,
        hfss_status: summaryData.hfss_status || 'GREEN',
        suggestions: summaryData.suggestions || [],
      };
      await saveProductToCache(result);
      return result;
    }

    // Layer 3: capture ground_truth_bundle to inject into master prompt
    let groundTruthBundle: string | undefined;
    if (ragResult.layer === 3 && ragResult.ground_truth_bundle) {
      console.log('[Gemini] Layer 3 hit — injecting ground truth into prompt');
      groundTruthBundle = ragResult.ground_truth_bundle;
    }

    // STEP 3: Search Fallback if extraction is poor
    if ((!rawIngredients || rawIngredients.length < 3) && product_name && product_name !== "Unknown Product") {
      console.log("[Gemini] Extraction poor, falling back to internet search for:", product_name);
      const searchData = await searchProductByName(product_name);
      if (searchData && searchData.product_name !== "Unknown Product") {
        return searchData;
      }
    }

    // STEP 4: Master Analysis (Enrichment + Summary)
    let scoreResult;
    let finalLookupResult: BatchLookupResult;

    const lookup = batchLookupIngredients(rawIngredients || []);

    // Check DB for unknown ingredients before asking Gemini
    const dbIngredients = await getIngredientsFromDB(lookup.unverified);
    const stillUnknown = lookup.unverified.filter(u => !dbIngredients[u]);

    // We pass the unverified ingredients to the final summary call
    // so Gemini can enrich them and provide the summary in ONE go.
    const masterPrompt = buildMasterPrompt(product_name, brand, category, nutrition, rawIngredients, stillUnknown, groundTruthBundle);

    const masterResult = await withTimeout(callGemini(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: masterPrompt }] }],
      config: { responseMimeType: "application/json" },
    })));

    if (!masterResult.text) {
      throw new Error("Gemini failed to return master analysis.");
    }

    let masterData;
    try {
      masterData = JSON.parse(masterResult.text.trim());
    } catch (e) {
      const match = masterResult.text.match(/\{[\s\S]*\}/);
      masterData = JSON.parse(match ? match[0] : "{}");
    }

    // Integrate enriched data into final lookup
    const finalVerified = [...lookup.verified];

    // Add ingredients from DB
    for (const [name, entry] of Object.entries(dbIngredients)) {
      finalVerified.push({ rawName: name, entry: { ...entry, data_quality: 'VERIFIED' } });
    }

    // Add ingredients from Gemini and save to DB for future
    if (masterData.enriched_ingredients) {
      const enrichedEntries = Object.entries(masterData.enriched_ingredients).map(([name, entry]) => ({
        name,
        entry: { ...(entry as any), data_quality: 'LLM_GENERATED' }
      }));
      for (const { name, entry } of enrichedEntries) {
        finalVerified.push({ rawName: name, entry });
      }
      await Promise.all(enrichedEntries.map(({ name, entry }) => saveIngredientToDB(name, entry)));
    }

    finalLookupResult = {
      verified: finalVerified,
      unverified: stillUnknown.filter(u => !masterData.enriched_ingredients?.[u]),
      coveragePercent: rawIngredients?.length > 0
        ? Math.round((finalVerified.length / rawIngredients.length) * 100)
        : 0
    };

    // Calculate score deterministically using our logic
    scoreResult = calculateScore(finalLookupResult, nutrition, category, masterData.is_upf, masterData.hfss_status);

    const result = {
      ...DEFAULT_RESULT,
      product_name,
      brand,
      category,
      nutrition,
      summary: masterData.summary,
      india_context: masterData.india_context,
      is_upf: masterData.is_upf,
      hfss_status: masterData.hfss_status,
      suggestions: masterData.suggestions,
      overall_score: scoreResult.overall_score,
      score_breakdown: scoreResult.score_breakdown,
      ingredients: finalLookupResult.verified.map(v => ({
        name: v.rawName,
        plain_name: v.entry.common_names[0] || v.rawName,
        function: v.entry.function,
        safety_tier: v.entry.safety_tier,
        plain_explanation: v.entry.plain_explanation,
        flag_for: v.entry.condition_flags.map(f => f.condition),
        source: v.entry.data_quality === 'VERIFIED' ? 'DB_VERIFIED' : 'LLM_GENERATED'
      })),
    };

    // Cache the result locally
    await saveProductToCache(result);

    return result;

  } catch (error) {
    console.error("Error in analyseLabel:", error);
    return DEFAULT_RESULT;
  }
}

/**
 * Searches for products by name using Gemini API with Google Search.
 */
export async function searchProductByName(productName: string) {
  const ai = getAI();
  try {
    // STEP 1: RAG Lookup (Layer 1: Cache)
    const ragCacheResult = await ragLookup({ productName });
    if (ragCacheResult.layer === 1) {
      return ragCacheResult.cached_verdict;
    }

    // STEP 2: Search & Extraction Pass
    const searchModel = "gemini-3.1-pro-preview";
    const searchPrompt = `You are a product researcher. Search for the product "${productName}" in India.

    GOAL: Find the EXACT ingredients list and nutritional information (per 100g/100ml).

    SOURCES: Official brand websites, BigBasket, Blinkit, Zepto, Amazon India, or grocery review sites.

    If "${productName}" is just a brand, find their flagship product.

    INSTRUCTIONS:
    1. Use the googleSearch tool to find the product's back-of-pack information.
    2. Extract the ingredients list as an array of strings.
    3. Extract nutrition facts (energy, sugar, sodium, protein, fat, etc.).
    4. Return a JSON object with: product_name, brand, category, ingredients (array), and nutrition (object).

    If you find the product but ingredients are hard to find, look for "ingredients" or "composition" in the product description on e-commerce sites.

    Return ONLY JSON.`;

    console.log(`[Search] Searching for "${productName}" using ${searchModel}...`);
    const searchResult = await withTimeout(callGemini(() => ai.models.generateContent({
      model: searchModel,
      contents: [{ parts: [{ text: searchPrompt }] }],
      config: {
        tools: [{ googleSearch: {} }]
      },
    })));

    let extractedData: any = null;
    if (searchResult.text) {
      try {
        const match = searchResult.text.match(/\{[\s\S]*\}/);
        extractedData = JSON.parse(match ? match[0] : searchResult.text.trim());
      } catch (e) {
        console.error("Initial search parse failed:", e);
      }
    }

    let rawIngredients = extractedData?.ingredients;
    let nutrition = extractedData?.nutrition;
    let category = extractedData?.category || "FOOD";
    let product_name = extractedData?.product_name || productName;
    let brand = extractedData?.brand || "Unknown";

    // FALLBACK 1: If no ingredients found, try a very specific search for ingredients
    if (!rawIngredients || rawIngredients.length === 0) {
      console.log(`[Search] No ingredients found for "${productName}". Trying deep search...`);
      const deepSearchPrompt = `Find the FULL ingredients list for "${productName}" sold in India.
      Search specifically on BigBasket, Amazon.in, or Blinkit.
      Look for the "Ingredients" section in the product details.

      Return ONLY a JSON array of strings.`;

      const deepResult = await withTimeout(callGemini(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: deepSearchPrompt }] }],
        config: {
          tools: [{ googleSearch: {} }]
        },
      })));

      if (deepResult.text) {
        try {
          const match = deepResult.text.match(/\[[\s\S]*\]/);
          const parsed = JSON.parse(match ? match[0] : deepResult.text.trim());
          if (Array.isArray(parsed)) {
            rawIngredients = parsed;
          }
        } catch (e) {
          console.error("Deep search parse failed:", e);
        }
      }
    }

    // FALLBACK 2: If still no ingredients, try to get them from a general description
    if (!rawIngredients || rawIngredients.length === 0) {
      console.log(`[Search] Still no ingredients. Attempting final extraction from general search...`);
      const finalPrompt = `Search for "${productName}" and describe its ingredients list based on available web data.
      Even if you can't find a perfect list, list the main components you find in descriptions.
      Return as a JSON array of strings.`;

      const finalResult = await withTimeout(callGemini(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: finalPrompt }] }],
        config: { tools: [{ googleSearch: {} }] },
      })));

      if (finalResult.text) {
        try {
          const match = finalResult.text.match(/\[[\s\S]*\]/);
          const parsed = JSON.parse(match ? match[0] : finalResult.text.trim());
          if (Array.isArray(parsed)) {
            rawIngredients = parsed;
          }
        } catch (e) {
          console.error("Final fallback failed:", e);
        }
      }
    }

    // FALLBACK 3: Last Resort - Search for the brand's most popular product
    if (!rawIngredients || rawIngredients.length === 0) {
      console.log(`[Search] Exhausted specific searches. Trying to find any popular product for brand "${productName}"...`);
      const brandPrompt = `Search for the most popular product of the brand "${productName}" in India.
      Find its ingredients and return as a JSON object with: product_name, brand, ingredients (array).`;

      const brandResult = await withTimeout(callGemini(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: brandPrompt }] }],
        config: { tools: [{ googleSearch: {} }] },
      })));

      if (brandResult.text) {
        try {
          const match = brandResult.text.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(match ? match[0] : brandResult.text.trim());
          if (parsed.ingredients && Array.isArray(parsed.ingredients)) {
            rawIngredients = parsed.ingredients;
            product_name = parsed.product_name;
            brand = parsed.brand;
          }
        } catch (e) {
          console.error("Brand fallback failed:", e);
        }
      }
    }

    // FALLBACK 4: Knowledge Fallback - Use Gemini's internal knowledge if search fails
    if (!rawIngredients || rawIngredients.length === 0) {
      console.log(`[Search] All search fallbacks failed. Using internal knowledge for "${productName}"...`);
      const knowledgePrompt = `You are a food expert. Even though you couldn't find recent search data, use your internal knowledge to provide the ingredients list for the most popular version of "${productName}" in India.

      Return ONLY a JSON object with:
      {
        "product_name": "Full name",
        "brand": "Brand name",
        "ingredients": ["ingredient 1", "ingredient 2", ...],
        "nutrition": { "energy_kcal": 0, ... }
      }`;

      const knowledgeResult = await withTimeout(callGemini(() => ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ parts: [{ text: knowledgePrompt }] }],
      })));

      if (knowledgeResult.text) {
        try {
          const match = knowledgeResult.text.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(match ? match[0] : knowledgeResult.text.trim());
          if (parsed.ingredients && Array.isArray(parsed.ingredients)) {
            rawIngredients = parsed.ingredients;
            product_name = parsed.product_name;
            brand = parsed.brand;
            nutrition = parsed.nutrition;
          }
        } catch (e) {
          console.error("Knowledge fallback failed:", e);
        }
      }
    }

    if (!rawIngredients || rawIngredients.length === 0) {
      console.error(`[Search] Exhausted all search and knowledge options for "${productName}".`);
      throw new Error(`Could not find ingredient data for "${productName}".`);
    }

    // STEP 3: Master Analysis (Enrichment + Summary)
    let finalLookupResult: BatchLookupResult;
    const lookup = batchLookupIngredients(rawIngredients || []);

    // Check DB for unknown ingredients before asking Gemini
    const dbIngredients = await getIngredientsFromDB(lookup.unverified);
    const stillUnknown = lookup.unverified.filter(u => !dbIngredients[u]);

    const masterPrompt = buildMasterPrompt(product_name, brand, category, nutrition, rawIngredients, stillUnknown, undefined);

    const masterResult = await withTimeout(callGemini(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: masterPrompt }] }],
      config: { responseMimeType: "application/json" },
    })));

    if (!masterResult.text) {
      throw new Error("Gemini failed to return search analysis.");
    }

    let masterData;
    try {
      masterData = JSON.parse(masterResult.text.trim());
    } catch (e) {
      const match = masterResult.text.match(/\{[\s\S]*\}/);
      masterData = JSON.parse(match ? match[0] : "{}");
    }

    // Integrate enriched data into final lookup
    const finalVerified = [...lookup.verified];

    // Add ingredients from DB
    for (const [name, entry] of Object.entries(dbIngredients)) {
      finalVerified.push({ rawName: name, entry: { ...entry, data_quality: 'VERIFIED' } });
    }

    // Add ingredients from Gemini and save to DB for future
    if (masterData.enriched_ingredients) {
      const enrichedEntries = Object.entries(masterData.enriched_ingredients).map(([name, entry]) => ({
        name,
        entry: { ...(entry as any), data_quality: 'LLM_GENERATED' }
      }));
      for (const { name, entry } of enrichedEntries) {
        finalVerified.push({ rawName: name, entry });
      }
      await Promise.all(enrichedEntries.map(({ name, entry }) => saveIngredientToDB(name, entry)));
    }

    finalLookupResult = {
      verified: finalVerified,
      unverified: stillUnknown.filter(u => !masterData.enriched_ingredients?.[u]),
      coveragePercent: rawIngredients?.length > 0
        ? Math.round((finalVerified.length / rawIngredients.length) * 100)
        : 0
    };

    // STEP 4: Deterministic Scoring
    const scoreResult = calculateScore(finalLookupResult, nutrition, category, masterData.is_upf, masterData.hfss_status);

    const result = {
      ...DEFAULT_RESULT,
      product_name,
      brand,
      category,
      nutrition,
      summary: masterData.summary,
      india_context: masterData.india_context,
      is_upf: masterData.is_upf,
      hfss_status: masterData.hfss_status,
      suggestions: masterData.suggestions,
      overall_score: scoreResult.overall_score,
      score_breakdown: scoreResult.score_breakdown,
      ingredients: finalLookupResult.verified.map(v => ({
        name: v.rawName,
        plain_name: v.entry.common_names[0] || v.rawName,
        function: v.entry.function,
        safety_tier: v.entry.safety_tier,
        plain_explanation: v.entry.plain_explanation,
        flag_for: v.entry.condition_flags.map(f => f.condition),
        source: v.entry.data_quality === 'VERIFIED' ? 'DB_VERIFIED' : 'LLM_GENERATED'
      })),
    };

    // Cache the result locally
    await saveProductToCache(result);

    return result;

  } catch (error) {
    console.error("Error in searchProductByName:", error);
    return DEFAULT_RESULT;
  }
}

/**
 * Chats about a product using Gemini API.
 */
export async function chatAboutProduct(productAnalysis: any, userMessage: string, profile: any, history: any[]) {
  const ai = getAI();
  try {
    const model = "gemini-3.1-pro-preview";

    const systemInstruction = `You are the "Knowledgeable Friend" for ReadYourLabels — a health-aware, warm, honest companion who explains food and cosmetic safety to Indian consumers in plain language.

YOUR VOICE:
- Like a friend who happens to be a nutritionist or dermatologist.
- Direct and honest, never vague or diplomatic.
- India-aware: understand Indian cooking, habits, and health context.
- Non-preachy: explain, don't lecture.

TONE & LEGAL SAFETY:
- Be objective and factual. Stick to scientific standards (FSSAI, ICMR-NIN, etc.).
- NEVER use demeaning, inflammatory, or hyperbolic language (e.g., "toxic", "poison", "scam", "evil").
- Critique the *ingredients* and *nutritional profile*, NOT the *company* or *brand* itself.
- Avoid making legal accusations or calling marketing "fraudulent"; use "misleading" or "inconsistent with data" instead.

WHAT YOU HAVE ACCESS TO:
- PRODUCT_CONTEXT: the full analysis from this session.
- ACTIVE_PROFILE: the current family member's profile.
- CONVERSATION_HISTORY: prior questions this session.

HARD RULES:
1. For THIS PRODUCT'S specific safety claims: use ONLY provided context.
2. For general education: your training knowledge is fine.
3. NEVER diagnose, never suggest treatment, never advise stopping medication.
4. If asked about a different product: say "Scan it and I'll tell you."
5. Quantify: "18g sugar = 4.5 teaspoons" is more useful than "high sugar."
6. For medical condition questions: "This is general information — your specific situation may differ. Please check with your doctor."
7. Keep answers under 200 words.`;

    const prompt = `
PRODUCT_CONTEXT: ${JSON.stringify(productAnalysis)}
ACTIVE_PROFILE: ${JSON.stringify(profile)}
CONVERSATION_HISTORY: ${JSON.stringify(history)}

USER QUESTION: ${userMessage}`;

    const result = await callGemini(() => ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
      },
    }));

    return result.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Error in chatAboutProduct:", error);
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.";
  }
}
