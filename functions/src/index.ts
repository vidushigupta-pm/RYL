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

async function callGemini(fn: () => Promise<any>, retries = 4, delay = 3000): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    const msg = JSON.stringify(error);
    const isRetryable = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') ||
                        msg.includes('503') || msg.includes('UNAVAILABLE');
    if (isRetryable && retries > 0) {
      console.warn(`[Gemini] Retryable error, retrying in ${delay}ms... (${retries} left)`);
      await new Promise(r => setTimeout(r, delay));
      return callGemini(fn, retries - 1, delay * 2);
    }
    throw error;
  }
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

  const result = await callGemini(() => ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" },
  }));

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

    // ── SINGLE GEMINI CALL: Extract + Analyse + Summarise ────────────────────
    // (Merges 3 previous calls into 1 to conserve API quota)
    const VALID_CATEGORIES = ['FOOD', 'COSMETIC', 'PERSONAL_CARE', 'SUPPLEMENT', 'HOUSEHOLD', 'PET_FOOD'];

    const singlePassPrompt = `You are a product safety analyst for Indian consumers. Your output is displayed directly to users — accuracy is critical. Never guess or hallucinate.

━━━ ANTI-HALLUCINATION RULES (non-negotiable) ━━━
1. EXTRACT ONLY what is explicitly printed on the label image. Do not infer, assume, or add anything not visibly written.
2. If text is unclear or cut off, extract what you can read with certainty. Skip what you cannot read — do not guess.
3. ALL ingredient names must be in ENGLISH exactly as printed. Never translate to Hindi or any other language.
4. Nutrition values: extract ONLY from the visible nutrition facts panel. If the panel is not in the image, use null for all nutrition fields. Never use 0 as a placeholder.
5. safety_tier assignment rules — use ONLY these criteria:
   • SAFE: Permitted by FSSAI/CDSCO with no significant concern at food-grade concentrations
   • CAUTION: Has documented restrictions or advisories from FSSAI, WHO, EFSA, or peer-reviewed science
   • AVOID: Specifically flagged as harmful by FSSAI/CDSCO/WHO or linked to serious adverse effects in published clinical research
   • BANNED_IN_INDIA: Explicitly prohibited under FSSAI Food Safety & Standards Act or CDSCO order — ONLY use when you are certain of the specific ban
   • When in doubt between tiers, always choose the LOWER concern tier (e.g. SAFE over CAUTION). Never overstate risk.
6. plain_explanation: State only established facts. Reference the specific standard or body (e.g. "FSSAI permits up to 200mg/kg", "WHO recommends limiting to...", "ICMR-NIN 2024 notes..."). Do not speculate or exaggerate.
7. flag_for: Only include health conditions where peer-reviewed clinical evidence or government guidelines confirm a specific concern.
8. summary: Only state what the data above shows. Do not add new claims, risks, or benefits not supported by the extracted data.
9. india_context: Only cite FSSAI regulations, CDSCO orders, or BIS standards that you are certain exist. Do not fabricate regulation numbers or policy names.
10. claim_checks: Only flag a front-of-pack claim as misleading if it violates a specific, named FSSAI/BIS standard. Do not flag valid claims.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK — do all of the following in one response:

1. EXTRACT from the label (only what is visibly printed):
   - Product name and brand exactly as shown
   - Category: FOOD | COSMETIC | PERSONAL_CARE | SUPPLEMENT | HOUSEHOLD | PET_FOOD
   - Full ingredients list in the exact order printed (include sub-ingredients in parentheses)
   - Nutrition per 100g/100ml from the visible panel only (null if panel not visible)

2. ANALYSE each ingredient using only established regulatory and scientific evidence:
   - plain_name: the common English name consumers will recognise
   - function: its role in the product (e.g. "Preservative", "Emulsifier", "Artificial Colour")
   - safety_tier: per the strict rules above
   - plain_explanation: one factual sentence citing the relevant standard or body
   - flag_for: conditions with confirmed clinical concern only, or empty array []

3. WRITE a verdict based strictly on what was extracted:
   - summary: 2-3 sentences citing only the specific ingredients found and their established concerns/benefits
   - india_context: one sentence citing a real FSSAI/CDSCO regulation relevant to this product
   - is_upf: true only if the product meets Nova Group 4 ultra-processed food criteria
   - hfss_status: "HFSS" only if the product exceeds FSSAI/WHO thresholds for fat, sugar, or salt
   - suggestions: 1-2 product TYPE alternatives (never a specific brand name)

Return ONLY this JSON (no markdown, no explanation outside the JSON):
{
  "product_name": "string",
  "brand": "string",
  "category": "FOOD|COSMETIC|PERSONAL_CARE|SUPPLEMENT|HOUSEHOLD|PET_FOOD",
  "nutrition": { "energy_kcal": number|null, "sugar_g": number|null, "sodium_mg": number|null, "protein_g": number|null, "fat_g": number|null, "saturated_fat_g": number|null, "trans_fat_g": number|null, "fibre_g": number|null },
  "raw_ingredients": ["string", ...],
  "ingredients_analysis": [
    { "name": "string", "plain_name": "string", "function": "string", "safety_tier": "SAFE|CAUTION|AVOID|BANNED_IN_INDIA", "plain_explanation": "string citing source", "flag_for": ["string"] }
  ],
  "summary": "string",
  "india_context": "string",
  "is_upf": boolean,
  "hfss_status": "GREEN|HFSS",
  "suggestions": [{ "type": "SWAP", "name": "product type only — never a brand name", "reason": "string" }]
}`;

    const imageParts: any[] = [
      { inlineData: { data: backImageBase64, mimeType: backMimeType } }
    ];
    if (frontImageBase64 && frontMimeType) {
      imageParts.push({ inlineData: { data: frontImageBase64, mimeType: frontMimeType } });
    }
    imageParts.push({ text: singlePassPrompt });

    const singlePassResult = await withTimeout(callGemini(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: imageParts }],
      config: { responseMimeType: "application/json" },
    })));

    if (!singlePassResult.text) {
      console.error("Gemini singlePassResult.text is empty:", JSON.stringify(singlePassResult));
      throw new HttpsError("internal", "Gemini failed to analyse the label.");
    }

    let geminiData: any;
    try {
      const raw = singlePassResult.text ?? '';
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        console.error("No JSON object found in scan response:", raw);
        throw new Error("No JSON in response");
      }
      const clean = raw.slice(jsonStart, jsonEnd + 1);
      geminiData = JSON.parse(clean);
    } catch (parseErr) {
      console.error("Failed to parse Gemini single-pass results:", singlePassResult.text);
      throw new HttpsError("internal", "Failed to parse label analysis. Please try again with a clearer image.");
    }

    const product_name: string = geminiData.product_name || 'Unknown Product';
    const brand: string = geminiData.brand || '';
    const category: string = VALID_CATEGORIES.includes(geminiData.category) ? geminiData.category : 'FOOD';
    const nutrition = geminiData.nutrition || null;

    // Deduplicate raw ingredients — keep first occurrence (labels can repeat same oil across sub-ingredients)
    const seenRaw = new Set<string>();
    const rawIngredients: string[] = (Array.isArray(geminiData.raw_ingredients) ? geminiData.raw_ingredients : [])
      .filter((r: string) => { const k = (r||'').toLowerCase().trim(); if (seenRaw.has(k)) return false; seenRaw.add(k); return true; });

    // Deduplicate ingredients_analysis by name — keep first occurrence
    const seenAnal = new Set<string>();
    const ingredientsAnalysis: any[] = (Array.isArray(geminiData.ingredients_analysis) ? geminiData.ingredients_analysis : [])
      .filter((ing: any) => { const k = (ing.name||ing.plain_name||'').toLowerCase().trim(); if (seenAnal.has(k)) return false; seenAnal.add(k); return true; });

    if (!VALID_CATEGORIES.includes(geminiData.category)) {
      console.warn(`[analyseLabel] Unrecognised category "${geminiData.category}" — defaulted to FOOD`);
    }

    // STEP 2: RAG Cache Check — return immediately if exact product is cached
    const ragResult = await ragLookup({
      productName: product_name,
      extractedIngredients: rawIngredients,
      nutrition,
      productCategory: category
    });
    if (ragResult.layer === 1) {
      return ragResult.cached_verdict;
    }

    // STEP 3: Merge Gemini ingredient analysis with our verified DB
    // DB entries override Gemini if available (more accurate)
    const lookup = batchLookupIngredients(rawIngredients);
    const finalVerified: Array<{ rawName: string; entry: any }> = [...lookup.verified];

    // For ingredients NOT in our DB, use Gemini's analysis
    const dbVerifiedNames = new Set(lookup.verified.map(v => v.rawName.toLowerCase()));
    for (const ing of ingredientsAnalysis) {
      if (!dbVerifiedNames.has((ing.name || '').toLowerCase())) {
        finalVerified.push({
          rawName: ing.name,
          entry: {
            common_names: [ing.plain_name || ing.name],
            function: ing.function || 'Unknown',
            safety_tier: ing.safety_tier || 'UNVERIFIED',
            plain_explanation: ing.plain_explanation || '',
            condition_flags: (ing.flag_for || []).map((c: string) => ({ condition: c, impact: 'MODERATE', reason: '', source: 'Gemini AI (unverified — not from regulatory DB)' })),
            score_impact: ing.safety_tier === 'AVOID' ? -10 : ing.safety_tier === 'BANNED_IN_INDIA' ? -30 : ing.safety_tier === 'CAUTION' ? -3 : 0,
            data_quality: 'LLM_GENERATED',
            fssai_status: 'UNKNOWN',
            ins_number: null,
            india_specific_note: null,
          }
        });
      }
    }

    const finalLookupResult: BatchLookupResult = {
      verified: finalVerified,
      unverified: rawIngredients.filter(r => !finalVerified.some(v => v.rawName === r)),
      coveragePercent: rawIngredients.length > 0 ? Math.round((finalVerified.length / rawIngredients.length) * 100) : 100
    };

    // STEP 4: Deterministic Scoring
    const scoreResult = calculateScore(finalLookupResult, nutrition, category, geminiData.is_upf ?? false);

    const result = {
      product_name,
      brand,
      category,
      nutrition,
      overall_score: scoreResult.overall_score,
      score_breakdown: scoreResult.score_breakdown,
      summary: geminiData.summary || 'Analysis complete.',
      india_context: geminiData.india_context || '',
      is_upf: geminiData.is_upf ?? false,
      hfss_status: geminiData.hfss_status || 'GREEN',
      suggestions: Array.isArray(geminiData.suggestions) ? geminiData.suggestions : [],
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

    // STEP 2: Single Gemini call — search + analyse + summarise in one shot
    const VALID_CATS = ['FOOD', 'COSMETIC', 'PERSONAL_CARE', 'SUPPLEMENT', 'HOUSEHOLD', 'PET_FOOD'];

    const searchAnalysePrompt = `You are a product safety analyst for Indian consumers. Your output is displayed directly to users in a health app — accuracy is critical. Never guess or hallucinate.

━━━ ANTI-HALLUCINATION RULES (non-negotiable) ━━━
1. Use Google Search to find the OFFICIAL ingredient list for "${productName}" from: the brand's official website, FSSAI label database, or verified retailers (BigBasket, Amazon India, Nykaa) that show the actual label. Do NOT use unofficial sources.
2. ONLY include ingredients that appear on the official product label. Never invent, infer, or add any ingredient not confirmed on the label.
3. ALL ingredient names must be in ENGLISH only — exactly as printed on the label. Never translate to Hindi or any other language.
4. Nutrition values: only from the official nutrition panel on the label. Use null for any value not found — never use 0 as a placeholder.
5. If "${productName}" is a brand name, resolve to the flagship product (e.g. "Maggi" → "Maggi 2-Minute Masala Noodles", "Nutella" → "Nutella Hazelnut Spread with Cocoa").
6. safety_tier assignment — use ONLY these criteria:
   • SAFE: Permitted by FSSAI/CDSCO with no significant concern at label concentrations
   • CAUTION: Has documented restrictions or advisories from FSSAI, WHO, EFSA, or peer-reviewed science
   • AVOID: Specifically flagged as harmful by FSSAI/CDSCO/WHO or linked to serious adverse effects in published clinical research
   • BANNED_IN_INDIA: Explicitly prohibited under FSSAI or CDSCO — ONLY use when certain of the specific ban
   • When uncertain between tiers, always use the LOWER concern tier. Never overstate risk.
7. plain_explanation: State only established facts, citing the specific regulatory body or standard (e.g. "FSSAI permits up to...", "WHO recommends limiting...", "ICMR-NIN 2024 states..."). Do not speculate.
8. flag_for: Only conditions with confirmed clinical or regulatory evidence.
9. summary and india_context: Only state what the verified data supports. Cite real FSSAI/CDSCO regulations. Do not fabricate regulation names or numbers.
10. suggestions: Product TYPES only — never specific brand names.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY this JSON (no markdown, no explanation outside the JSON):
{
  "product_name": "full product name in English",
  "brand": "brand name",
  "category": "FOOD|COSMETIC|PERSONAL_CARE|SUPPLEMENT|HOUSEHOLD|PET_FOOD",
  "nutrition": { "energy_kcal": number|null, "sugar_g": number|null, "sodium_mg": number|null, "protein_g": number|null, "fat_g": number|null, "saturated_fat_g": number|null, "trans_fat_g": number|null, "fibre_g": number|null },
  "raw_ingredients": ["ingredient in English", ...],
  "ingredients_analysis": [
    { "name": "exact English name from label", "plain_name": "common English name", "function": "string", "safety_tier": "SAFE|CAUTION|AVOID|BANNED_IN_INDIA", "plain_explanation": "1 factual sentence citing source", "flag_for": ["condition"] }
  ],
  "summary": "2-3 sentences based only on verified ingredients and their established concerns or benefits",
  "india_context": "1 sentence citing a real FSSAI/CDSCO regulation relevant to this product",
  "is_upf": boolean,
  "hfss_status": "GREEN|HFSS",
  "suggestions": [{ "type": "SWAP", "name": "product type only — never a brand name", "reason": "why it is better" }],
  "not_found": false
}

If the product cannot be found on any verified source after searching, return: { "not_found": true, "product_name": "${productName}" }`;

    const searchResult = await withTimeout(callGemini(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: searchAnalysePrompt }] }],
      config: {
        // NOTE: responseMimeType cannot be used together with tools (googleSearch).
        // The prompt instructs JSON output — we parse text directly below.
        tools: [{ googleSearch: {} }],
      },
    })));

    if (!searchResult.text) {
      throw new HttpsError("internal", `Gemini returned no data for "${productName}".`);
    }

    let geminiData: any;
    try {
      // Google Search grounding often adds citation text before/after the JSON.
      // Extract the outermost { ... } to get just the JSON object.
      const raw = searchResult.text ?? '';
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        console.error("No JSON object found in search response:", raw);
        throw new Error("No JSON in response");
      }
      const clean = raw.slice(jsonStart, jsonEnd + 1);
      geminiData = JSON.parse(clean);
    } catch (parseErr) {
      console.error("Failed to parse search results:", searchResult.text);
      throw new HttpsError("internal", "Failed to parse product data. Please try scanning the label instead.");
    }

    if (geminiData.not_found) {
      throw new HttpsError("not-found", `Could not find "${productName}". Try scanning the label instead.`);
    }

    const product_name: string = geminiData.product_name || productName;
    const brand: string = geminiData.brand || '';
    const category: string = VALID_CATS.includes(geminiData.category) ? geminiData.category : 'FOOD';
    const nutrition = geminiData.nutrition || null;

    // Deduplicate raw ingredients — keep first occurrence
    const seenRawS = new Set<string>();
    const rawIngredients: string[] = (Array.isArray(geminiData.raw_ingredients) ? geminiData.raw_ingredients : [])
      .filter((r: string) => { const k = (r||'').toLowerCase().trim(); if (seenRawS.has(k)) return false; seenRawS.add(k); return true; });

    // Deduplicate ingredients_analysis by name — keep first occurrence
    const seenAnalS = new Set<string>();
    const ingredientsAnalysis: any[] = (Array.isArray(geminiData.ingredients_analysis) ? geminiData.ingredients_analysis : [])
      .filter((ing: any) => { const k = (ing.name||ing.plain_name||'').toLowerCase().trim(); if (seenAnalS.has(k)) return false; seenAnalS.add(k); return true; });

    if (rawIngredients.length === 0) {
      throw new HttpsError("internal", `Could not find ingredient data for "${productName}". Please try scanning the label instead.`);
    }

    // Merge DB lookup with Gemini's analysis
    const lookup = batchLookupIngredients(rawIngredients);
    const finalVerified: Array<{ rawName: string; entry: any }> = [...lookup.verified];
    const dbVerifiedNames = new Set(lookup.verified.map(v => v.rawName.toLowerCase()));
    for (const ing of ingredientsAnalysis) {
      if (!dbVerifiedNames.has((ing.name || '').toLowerCase())) {
        finalVerified.push({
          rawName: ing.name,
          entry: {
            common_names: [ing.plain_name || ing.name],
            function: ing.function || 'Unknown',
            safety_tier: ing.safety_tier || 'UNVERIFIED',
            plain_explanation: ing.plain_explanation || '',
            condition_flags: (ing.flag_for || []).map((c: string) => ({ condition: c, impact: 'MODERATE', reason: '', source: 'Gemini AI (unverified — not from regulatory DB)' })),
            score_impact: ing.safety_tier === 'AVOID' ? -10 : ing.safety_tier === 'BANNED_IN_INDIA' ? -30 : ing.safety_tier === 'CAUTION' ? -3 : 0,
            data_quality: 'LLM_GENERATED',
            fssai_status: 'UNKNOWN',
            ins_number: null,
            india_specific_note: null,
          }
        });
      }
    }

    const finalLookupResult: BatchLookupResult = {
      verified: finalVerified,
      unverified: rawIngredients.filter(r => !finalVerified.some(v => v.rawName === r)),
      coveragePercent: rawIngredients.length > 0 ? Math.round((finalVerified.length / rawIngredients.length) * 100) : 100
    };

    const scoreResult = calculateScore(finalLookupResult, nutrition, category, geminiData.is_upf ?? false);

    const result = {
      product_name,
      brand,
      category,
      nutrition,
      overall_score: scoreResult.overall_score,
      score_breakdown: scoreResult.score_breakdown,
      summary: geminiData.summary || 'Analysis complete.',
      india_context: geminiData.india_context || '',
      is_upf: geminiData.is_upf ?? false,
      hfss_status: geminiData.hfss_status || 'GREEN',
      suggestions: Array.isArray(geminiData.suggestions) ? geminiData.suggestions : [],
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

    const result = await withTimeout(callGemini(() => ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
      },
    })));

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
