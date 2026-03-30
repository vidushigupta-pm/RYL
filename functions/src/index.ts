import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase-admin/app";
import { ragLookup, saveProductToCache } from "./ragService";
import { batchLookupIngredients, IngredientEntry, BatchLookupResult } from "./data";
import { calculateScore, NutritionData } from "./scoringEngine";

// Initialize Firebase Admin
initializeApp();

// Define the secret for the Gemini API Key
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

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

  const model = "gemini-3.1-pro-preview";
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
    return JSON.parse(result.text);
  } catch (e) {
    console.error("Failed to parse ingredient details:", e);
    return {};
  }
}

/**
 * Cloud Function to analyze product labels using Gemini API with RAG.
 */
export const analyseLabel = onCall({ secrets: [GEMINI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const { backImageBase64, backMimeType, frontImageBase64, frontMimeType } = request.data;

  if (!backImageBase64 || !backMimeType) {
    throw new HttpsError("invalid-argument", "Back image data and mime type are required.");
  }

  try {
    const apiKey = GEMINI_API_KEY.value();
    const ai = new GoogleGenAI({ apiKey });
    
    // STEP 1: Extraction Pass
    const extractionModel = "gemini-3.1-pro-preview";
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

    const extractionResult = await ai.models.generateContent({
      model: extractionModel,
      contents: [{ parts: [...extractionParts, { text: extractionPrompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const extractedData = JSON.parse(extractionResult.text);
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
    
    Return ONLY JSON matching the AnalysisResult structure.`;

    const summaryResult = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: summaryPrompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const finalAnalysis = JSON.parse(summaryResult.text);

    const result = {
      ...finalAnalysis,
      overall_score: scoreResult.overall_score,
      score_breakdown: scoreResult.score_breakdown,
      ingredients: finalVerified.map(v => ({
        name: v.rawName,
        plain_name: v.entry.common_names[0] || v.rawName,
        function: v.entry.function,
        safety_tier: v.entry.safety_tier,
        plain_explanation: v.entry.plain_explanation,
        flag_for: v.entry.condition_flags.map(f => f.condition),
        source: v.entry.data_quality === 'VERIFIED' ? 'DB_VERIFIED' : 'LLM_GENERATED'
      }))
    };

    // Cache the result
    await saveProductToCache(result);

    return result;

  } catch (error) {
    console.error("Error in analyseLabel function:", error);
    throw new HttpsError("internal", "Failed to analyze label.");
  }
});

/**
 * Cloud Function to search for products by name using Gemini API with RAG.
 */
export const searchProductByName = onCall({ secrets: [GEMINI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

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
    const searchModel = "gemini-3-flash-preview";
    const searchPrompt = `Search for the product "${productName}" in India.
    Extract:
    1. Product Name and Brand.
    2. Category (FOOD, COSMETIC, PERSONAL_CARE, SUPPLEMENT, HOUSEHOLD, PET_FOOD).
    3. Full Ingredients List (as an array of strings).
    4. Nutritional Information (Energy, Sugar, Sodium, Protein, Fat, Saturated Fat, Trans Fat, Fibre).
    
    Use the googleSearch tool to find accurate data. Return ONLY JSON.`;

    const searchResult = await ai.models.generateContent({
      model: searchModel,
      contents: [{ parts: [{ text: searchPrompt }] }],
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      },
    });

    const extractedData = JSON.parse(searchResult.text);
    const { ingredients: rawIngredients, nutrition, category, product_name, brand } = extractedData;

    // STEP 3: RAG Lookup (Layer 2/3)
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

    const summaryResult = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: summaryPrompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const finalAnalysis = JSON.parse(summaryResult.text);

    const result = {
      ...finalAnalysis,
      overall_score: scoreResult.overall_score,
      score_breakdown: scoreResult.score_breakdown,
      ingredients: finalVerified.map(v => ({
        name: v.rawName,
        plain_name: v.entry.common_names[0] || v.rawName,
        function: v.entry.function,
        safety_tier: v.entry.safety_tier,
        plain_explanation: v.entry.plain_explanation,
        flag_for: v.entry.condition_flags.map(f => f.condition),
        source: v.entry.data_quality === 'VERIFIED' ? 'DB_VERIFIED' : 'LLM_GENERATED'
      }))
    };

    // Cache the result
    await saveProductToCache(result);

    return result;

  } catch (error) {
    console.error("Error in searchProductByName function:", error);
    throw new HttpsError("internal", "Failed to search product.");
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

    const result = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
      },
    });

    return result.text;
  } catch (error) {
    console.error("Error in chatAboutProduct function:", error);
    throw new HttpsError("internal", "Failed to chat about product.");
  }
});
