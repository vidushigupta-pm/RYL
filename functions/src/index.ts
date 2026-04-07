import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from 'firebase-admin/firestore';
import { ragLookup, saveProductToCache } from "./ragService";
import { batchLookupIngredients, IngredientEntry, BatchLookupResult } from "./data";
import { calculateScore, NutritionData } from "./scoringEngine";

// Initialize Firebase Admin
initializeApp();

// Define the secret for the Gemini API Key
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

function withTimeout<T>(promise: Promise<T>, ms = 300_000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini call timed out after ${ms}ms`)), ms)
    )
  ]);
}

const userCallLog = new Map<string, number[]>();
const RATE_LIMIT_PER_MIN = 10;

function checkRateLimit(uid: string): void {
  const now = Date.now();
  const calls = (userCallLog.get(uid) || []).filter(t => now - t < 60_000);
  if (calls.length >= RATE_LIMIT_PER_MIN) {
    throw new HttpsError('resource-exhausted', 'Too many requests. Please wait a moment and try again.');
  }
  userCallLog.set(uid, [...calls, now]);
}

interface AnalysisResult {
  product_name: string;
  brand: string;
  category: string;
  ingredients: Array<{
    name: string;
    plain_name: string;
    function: string;
    safety_tier: string;
    plain_explanation: string;
    flag_for: string[];
    source?: string;
  }>;
  nutrition: NutritionData;
  summary: string;
  india_context: string;
  is_upf: boolean;
  hfss_status: string;
  suggestions: any[];
  overall_score: number;
  score_breakdown: any[];
}

/**
 * Helper to get ingredient details from Gemini for unknown ingredients
 */
async function getIngredientDetails(
  ai: GoogleGenAI,
  unknownIngredients: string[],
  category: string
): Promise<Record<string, IngredientEntry>> {
  if (unknownIngredients.length === 0) return {};

  const model = "gemini-2.5-flash";
  const prompt = `Provide safety analysis for these Indian food/cosmetic ingredients: ${unknownIngredients.join(", ")}.
  Category: ${category}

  Return a JSON object where keys are the ingredient names and values match this structure:
  {
    "ins_number": string | null,
    "common_names": string[],
    "function": string,
    "safety_tier": "SAFE" | "CAUTION" | "AVOID" | "BANNED_IN_INDIA" | "UNVERIFIED",
    "fssai_status": "PERMITTED" | "RESTRICTED" | "PROHIBITED" | "NOT_APPLICABLE" | "UNKNOWN",
    "condition_flags": [{"condition": string, "impact": "HIGH"|"MODERATE"|"LOW"|"POSITIVE", "reason": string, "source": string}],
    "plain_explanation": string,
    "india_specific_note": string | null,
    "score_impact": number,
    "data_quality": "LLM_GENERATED"
  }

  Focus on Indian standards (FSSAI/CDSCO). Be objective.`;

  const result = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" },
  });

  try {
    return JSON.parse(result.text ?? '{}');
  } catch (e) {
    console.error("Failed to parse ingredient details:", e);
    return {};
  }
}

/**
 * Cloud Function to analyze product labels using Gemini API with RAG.
 */
export const analyseLabel = onCall({ secrets: [GEMINI_API_KEY] }, async (request) => {
  const { backImageBase64, backMimeType, frontImageBase64, frontMimeType } = request.data;

  if (!backImageBase64 || !backMimeType) {
    throw new HttpsError("invalid-argument", "Back image data and mime type are required.");
  }

  try {
    const apiKey = GEMINI_API_KEY.value();
    const ai = new GoogleGenAI({ apiKey });

    // STEP 1: Extraction Pass
    const extractionModel = "gemini-2.5-flash";
    const extractionPrompt = `Extract the following from this product label:
    1. Product Name and Brand.
    2. Category (FOOD, COSMETIC, PERSONAL_CARE, SUPPLEMENT, HOUSEHOLD, PET_FOOD).
    3. Full Ingredients List (as an array of strings).
    4. Nutritional Information (Energy, Sugar, Sodium, Protein, Fat, Saturated Fat, Trans Fat, Fibre).

    Return ONLY JSON.`;

    const extractionParts = [
      { inlineData: { data: backImageBase64, mimeType: backMimeType } }
    ];
    if (frontImageBase64 && frontMimeType) {
      extractionParts.push({ inlineData: { data: frontImageBase64, mimeType: frontMimeType } });
    }

    const extractionResult = await withTimeout(ai.models.generateContent({
      model: extractionModel,
      contents: [{ parts: [...extractionParts, { text: extractionPrompt }] }],
      config: { responseMimeType: "application/json" },
    }));

    if (!extractionResult.text) {
      console.error("Gemini extractionResult.text is empty:", JSON.stringify(extractionResult));
      throw new HttpsError("internal", "Gemini failed to extract data from label.");
    }

    let extractedData;
    try {
      const cleanText = extractionResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
      extractedData = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini extraction results:", extractionResult.text);
      throw new HttpsError("internal", "Failed to parse label data.");
    }

    const { ingredients: rawIngredients, nutrition, category, product_name, brand } = extractedData;

    // STEP 2: RAG Lookup (Layer 1: Cache)
    const ragResult = await ragLookup({
      productName: product_name,
      extractedIngredients: rawIngredients,
      nutrition,
      productCategory: category
    });

    if (ragResult.layer === 1) {
      return ragResult.cached_verdict;
    }

    // Layer 2: DB coverage ≥ 80% — score computed, only need summary
    if (ragResult.layer === 2 && ragResult.partial_result) {
      console.log('[analyseLabel] Layer 2 hit — requesting summary only');
      const partial = ragResult.partial_result;
      const summaryPrompt = `You are a food and cosmetic safety expert in India.
The ingredients have already been verified and scored from our database.
Your ONLY task is to write the narrative fields.

PRODUCT: ${product_name} (${brand})
CATEGORY: ${category}
NUTRITION: ${JSON.stringify(nutrition)}
VERIFIED INGREDIENTS: ${JSON.stringify(partial.ingredients)}

Return ONLY JSON with exactly these fields:
{
  "summary": "2-3 sentence plain English verdict for an Indian consumer",
  "india_context": "Any India-specific note (FSSAI, common usage, regional relevance)",
  "is_upf": boolean,
  "hfss_status": "GREEN | HFSS",
  "suggestions": [{ "type": "GENERIC", "name": "...", "reason": "..." }]
}`;

      const summaryResult = await withTimeout(ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: summaryPrompt }] }],
        config: { responseMimeType: 'application/json' },
      }));

      let summaryData: any = {};
      try {
        const clean = (summaryResult.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
        summaryData = JSON.parse(clean);
      } catch (e) {
        console.error('[analyseLabel] Layer 2 summary parse failed:', e);
      }

      const result = {
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

    let groundTruthBundle: string | undefined;
    if (ragResult.layer === 3 && ragResult.ground_truth_bundle) {
      console.log('[analyseLabel] Layer 3 hit — injecting ground truth into prompt');
      groundTruthBundle = ragResult.ground_truth_bundle;
    }

    // STEP 3: Enrich Unknowns (if needed)
    const lookup = batchLookupIngredients(rawIngredients);
    const enrichedDetails = await getIngredientDetails(ai, lookup.unverified, category);

    // Combine RAG + Gemini enriched data
    const finalVerified = [...lookup.verified];
    for (const [name, entry] of Object.entries(enrichedDetails)) {
      finalVerified.push({ rawName: name, entry });
    }

    const finalLookupResult: BatchLookupResult = {
      verified: finalVerified,
      unverified: lookup.unverified.filter(u => !enrichedDetails[u]),
      coveragePercent: Math.round((finalVerified.length / rawIngredients.length) * 100)
    };

    // STEP 4: Deterministic Scoring
    const scoreResult = calculateScore(finalLookupResult, nutrition, category);

    // STEP 5: Final Summary & Context (Pass 2)
    const summaryPrompt = `Based on this data, provide a summary, india_context, is_upf, hfss_status, and suggestions.
    DATA: ${JSON.stringify({ product_name, brand, category, nutrition, scoreResult, finalLookupResult })}
    ${groundTruthBundle ? `\nVERIFIED INGREDIENT CONTEXT (USE AS GROUND TRUTH):\n${groundTruthBundle}` : ''}

    Return ONLY JSON matching the AnalysisResult structure.`;

    const summaryResult = await withTimeout(ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: summaryPrompt }] }],
      config: { responseMimeType: "application/json" },
    }));

    if (!summaryResult.text) {
      console.error("Gemini summaryResult.text is empty:", JSON.stringify(summaryResult));
      throw new HttpsError("internal", "Gemini failed to return analysis summary.");
    }

    let finalAnalysis;
    try {
      const cleanSummary = summaryResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
      finalAnalysis = JSON.parse(cleanSummary);
    } catch (parseErr) {
      console.error("Failed to parse Gemini summary results:", summaryResult.text);
      throw new HttpsError("internal", "Failed to parse analysis summary.");
    }

    const result = {
      ...finalAnalysis,
      overall_score: scoreResult.overall_score,
      score_breakdown: scoreResult.score_breakdown,
      ingredients: finalVerified.map(v => ({
        name: v.rawName,
        plain_name: (v.entry.common_names || [])[0] || v.rawName,
        function: v.entry.function || 'Unknown',
        safety_tier: v.entry.safety_tier || 'UNVERIFIED',
        plain_explanation: v.entry.plain_explanation || '',
        flag_for: (v.entry.condition_flags || []).map((f: any) => f.condition),
        source: v.entry.data_quality === 'VERIFIED' ? 'DB_VERIFIED' : 'LLM_GENERATED'
      }))
    };

    // Cache the result
    await saveProductToCache(result);

    return result;

  } catch (error: any) {
    console.error("Error in analyseLabel function:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", `Failed to analyze label: ${error.message || 'Unknown error'}`);
  }
});

/**
 * Cloud Function to search for products by name using Gemini API with RAG.
 */
export const searchProductByName = onCall({ secrets: [GEMINI_API_KEY] }, async (request) => {
  const { productName } = request.data;

  if (!productName) {
    throw new HttpsError("invalid-argument", "Product name is required.");
  }

  try {
    const apiKey = GEMINI_API_KEY.value();
    const ai = new GoogleGenAI({ apiKey });

    // STEP 1: RAG Lookup (Layer 1: Cache)
    const ragCacheResult = await ragLookup({ productName });
    if (ragCacheResult.layer === 1) {
      return ragCacheResult.cached_verdict;
    }

    // STEP 2: Search & Extraction Pass
    const searchModel = "gemini-2.5-flash";
    const searchPrompt = `Search for the product "${productName}" in India.
    If "${productName}" is a brand name (like Maggi, Parle, etc.), find the most popular product of that brand (e.g., Maggi 2-Minute Noodles).

    Find the exact ingredients list and nutritional information for this product.
    Look for data on official brand websites or major Indian grocery platforms like BigBasket, Blinkit, or Zepto.

    You MUST return a valid JSON object with these fields:
    - product_name: Full name of the specific product found.
    - brand: Brand name.
    - category: One of (FOOD, COSMETIC, PERSONAL_CARE, SUPPLEMENT, HOUSEHOLD, PET_FOOD).
    - ingredients: Array of strings (the full ingredients list).
    - nutrition: Object with keys (energy, sugar, sodium, protein, fat, saturated_fat, trans_fat, fibre).

    Use the googleSearch tool to find the most recent and accurate data.`;

    const searchSchema = {
      type: Type.OBJECT,
      properties: {
        product_name: { type: Type.STRING },
        brand: { type: Type.STRING },
        category: { type: Type.STRING },
        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        nutrition: {
          type: Type.OBJECT,
          properties: {
            energy: { type: Type.STRING },
            sugar: { type: Type.STRING },
            sodium: { type: Type.STRING },
            protein: { type: Type.STRING },
            fat: { type: Type.STRING },
            saturated_fat: { type: Type.STRING },
            trans_fat: { type: Type.STRING },
            fibre: { type: Type.STRING }
          }
        }
      },
      required: ["product_name", "brand", "category", "ingredients"]
    };

    const searchResult = await withTimeout(ai.models.generateContent({
      model: searchModel,
      contents: [{ parts: [{ text: searchPrompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: searchSchema,
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true }
      },
    }));

    if (!searchResult.text) {
      const grounding = searchResult.candidates?.[0]?.groundingMetadata;
      console.error("Gemini searchResult.text is empty. Grounding:", JSON.stringify(grounding));
      throw new HttpsError("internal", `Gemini failed to return search results for "${productName}". Grounding: ${JSON.stringify(grounding)}`);
    }

    let extractedData;
    try {
      const cleanText = searchResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
      extractedData = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini search results:", searchResult.text);
      throw new HttpsError("internal", "Failed to parse product data.");
    }

    const { ingredients: rawIngredients, nutrition, category, product_name, brand } = extractedData;

    if (!rawIngredients || rawIngredients.length === 0) {
      console.error("Gemini extracted zero ingredients for:", productName, extractedData);
      throw new HttpsError("internal", `Could not find ingredient data for "${productName}". Please try scanning the label instead.`);
    }
    const lookup = batchLookupIngredients(rawIngredients || []);
    const enrichedDetails = await getIngredientDetails(ai, lookup.unverified, category);

    // Combine RAG + Gemini enriched data
    const finalVerified = [...lookup.verified];
    for (const [name, entry] of Object.entries(enrichedDetails)) {
      finalVerified.push({ rawName: name, entry });
    }

    const finalLookupResult: BatchLookupResult = {
      verified: finalVerified,
      unverified: lookup.unverified.filter(u => !enrichedDetails[u]),
      coveragePercent: rawIngredients?.length > 0
        ? Math.round((finalVerified.length / rawIngredients.length) * 100)
        : 0
    };

    // STEP 4: Deterministic Scoring
    const scoreResult = calculateScore(finalLookupResult, nutrition, category);

    // STEP 5: Final Summary & Context
    const summaryPrompt = `Based on this data, provide a summary, india_context, is_upf, hfss_status, and suggestions.
    DATA: ${JSON.stringify({ product_name, brand, category, nutrition, scoreResult, finalLookupResult })}

    Return ONLY JSON matching the AnalysisResult structure.`;

    const summaryResult = await withTimeout(ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: summaryPrompt }] }],
      config: { responseMimeType: "application/json" },
    }));

    if (!summaryResult.text) {
      console.error("Gemini summaryResult.text is empty:", JSON.stringify(summaryResult));
      throw new HttpsError("internal", "Gemini failed to return search summary.");
    }

    let finalAnalysis;
    try {
      const cleanSummary = summaryResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
      finalAnalysis = JSON.parse(cleanSummary);
    } catch (parseErr) {
      console.error("Failed to parse Gemini summary results:", summaryResult.text);
      throw new HttpsError("internal", "Failed to parse search summary.");
    }

    const result = {
      ...finalAnalysis,
      overall_score: scoreResult.overall_score,
      score_breakdown: scoreResult.score_breakdown,
      ingredients: finalVerified.map(v => ({
        name: v.rawName,
        plain_name: (v.entry.common_names || [])[0] || v.rawName,
        function: v.entry.function || 'Unknown',
        safety_tier: v.entry.safety_tier || 'UNVERIFIED',
        plain_explanation: v.entry.plain_explanation || '',
        flag_for: (v.entry.condition_flags || []).map((f: any) => f.condition),
        source: v.entry.data_quality === 'VERIFIED' ? 'DB_VERIFIED' : 'LLM_GENERATED'
      }))
    };

    // Cache the result
    await saveProductToCache(result);

    return result;

  } catch (error: any) {
    console.error("Error in searchProductByName function:", error);
    // If it's already an HttpsError, rethrow it
    if (error instanceof HttpsError) throw error;

    // Otherwise throw a generic internal error with more context if possible
    const errorDetails = error.stack || error.message || 'Unknown error';
    throw new HttpsError("internal", `Failed to search product "${productName}": ${errorDetails}`);
  }
});

/**
 * Cloud Function to chat about a product using Gemini API.
 */
export const chatAboutProduct = onCall({ secrets: [GEMINI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const { productAnalysis, userMessage, profile, history } = request.data;

  if (!productAnalysis || !userMessage || !profile) {
    throw new HttpsError("invalid-argument", "Product analysis, user message, and profile are required.");
  }

  try {
    const apiKey = GEMINI_API_KEY.value();
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash";

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

    const result = await withTimeout(ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
      },
    }));

    return result.text;
  } catch (error) {
    console.error("Error in chatAboutProduct function:", error);
    throw new HttpsError("internal", "Failed to chat about product.");
  }
});

/**
 * Quarterly review: flags products older than 90 days for re-verification.
 * Runs on the 1st of January, April, July, and October at midnight UTC.
 */
export const quarterlyProductReview = onSchedule(
  { schedule: '0 0 1 1,4,7,10 *', timeZone: 'Asia/Kolkata' },
  async () => {
    const db = getFirestore();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    console.log(`[QuarterlyReview] Flagging products older than ${cutoff.toISOString()}`);

    const staleSnap = await db.collection('products')
      .where('verdict_computed_at', '<', cutoff)
      .where('needs_reverification', '==', false)
      .get();

    if (staleSnap.empty) {
      console.log('[QuarterlyReview] No stale products found.');
      return;
    }

    // Firestore batch limit is 500
    const batches = [];
    let batch = db.batch();
    let count = 0;

    for (const docSnap of staleSnap.docs) {
      batch.update(docSnap.ref, { needs_reverification: true });
      count++;
      if (count % 500 === 0) {
        batches.push(batch.commit());
        batch = db.batch();
      }
    }
    batches.push(batch.commit());
    await Promise.all(batches);

    console.log(`[QuarterlyReview] Flagged ${staleSnap.size} products for re-verification.`);
  }
);
