// api/searchProductByName.ts — Vercel serverless function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initAdmin, FIRESTORE_DB_ID } from '../lib/adminInit';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  callGemini, withTimeout, setCors,
  VALID_CATEGORIES, buildFinalIngredients, buildResult, dedup,
  ragLookup, saveProductToCache, sanitiseCachedVerdict
} from '../lib/shared';

// Write a scan event via Admin SDK — bypasses Firestore client rules
async function writeScanEvent(result: any, userId: string, source: string) {
  try {
    const db = getFirestore(FIRESTORE_DB_ID);
    await db.collection('scan_events').add({
      product_name: result.product_name || '',
      brand: result.brand || '',
      category: result.category || 'FOOD',
      overall_score: result.overall_score ?? 0,
      user_id: userId || 'guest',
      source,
      scanned_at: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('[scan_event] write failed (non-blocking):', e);
  }
}

// No Google Search grounding — too slow for Vercel Hobby 60s limit.
// Gemini's training data covers all major Indian & global brands accurately.
const searchPrompt = (productName: string) =>
  `You are a product safety analyst for Indian consumers — think FitTuber meets a food scientist. Uncover what's really inside the product, in plain language any Indian consumer can understand.

TASK: Provide a complete safety analysis for "${productName}" sold in India.

INSTRUCTIONS:
1. Resolve brand names to the flagship India product (e.g. "Maggi" → "Maggi 2-Minute Masala Noodles").
2. Use your training knowledge of the product's official India label ingredients list.
3. ALL ingredient names in ENGLISH only.
4. Nutrition values per 100g/100ml from India label. Use null if unknown — never use 0 as placeholder.
5. safety_tier: SAFE | CAUTION | AVOID | BANNED_IN_INDIA — use FSSAI/WHO/EFSA evidence only.
6. plain_explanation: one factual sentence citing source (FSSAI, WHO, ICMR-NIN etc.).
7. flag_for: conditions with confirmed clinical evidence only.
8. summary: 2-3 punchy sentences like a consumer champion — name specific concerning ingredients, be direct.
9. india_context: one sentence citing a real FSSAI/CDSCO regulation.
10. suggestions: product TYPES only — never specific brand names.
11. is_upf: true only if Nova Group 4 criteria met.
12. If you genuinely have no information about this product, set not_found: true.

DETECT these specific Indian consumer concerns:
a) HIDDEN SUGAR: List ALL sugar-type ingredients (sugar, glucose, dextrose, maltodextrin, corn syrup, fructose, sucrose, jaggery, honey, etc.). If 2+ are present, set hidden_sugar_count and hidden_sugar_names — companies split sugar into multiple names to push it down the list.
b) MAIDA ALERT: If "Wheat Flour" (not "Whole Wheat Flour"/"Atta") is in the top 3 ingredients, set maida_alert: true. "Wheat Flour" in India = refined maida, not atta.
c) TOP INGREDIENT WARNING: If the #1 or #2 ingredient by weight is sugar, maida/wheat flour, or palm oil — set top_ingredient_warning to a plain sentence like "Sugar is the #1 ingredient by weight."
d) INGREDIENT POSITIONS: Set position (1-based) for each ingredient — 1 = highest by weight.

Return ONLY valid JSON:
{
  "product_name": "string",
  "brand": "string",
  "category": "FOOD|COSMETIC|PERSONAL_CARE|SUPPLEMENT|HOUSEHOLD|PET_FOOD",
  "nutrition": { "energy_kcal": number|null, "sugar_g": number|null, "sodium_mg": number|null, "protein_g": number|null, "fat_g": number|null, "saturated_fat_g": number|null, "trans_fat_g": number|null, "fibre_g": number|null },
  "raw_ingredients": ["string"],
  "ingredients_analysis": [
    { "name": "string", "plain_name": "string", "function": "string", "safety_tier": "SAFE|CAUTION|AVOID|BANNED_IN_INDIA", "plain_explanation": "string", "flag_for": ["string"], "position": number }
  ],
  "hidden_sugar_count": number,
  "hidden_sugar_names": ["string"],
  "maida_alert": boolean,
  "top_ingredient_warning": "string|null",
  "summary": "string",
  "india_context": "string",
  "is_upf": boolean,
  "hfss_status": "GREEN|HFSS",
  "suggestions": [{ "type": "SWAP", "name": "string", "reason": "string" }],
  "not_found": false
}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { productName, userId } = req.body ?? {};
  if (!productName || typeof productName !== 'string') {
    return res.status(400).json({ error: 'productName is required.' });
  }
  const userIdStr = typeof userId === 'string' && userId ? userId : 'guest';

  try {
    initAdmin();

    // STEP 1: RAG cache check — instant return if previously searched/scanned
    const ragCacheResult = await ragLookup({ productName });
    if (ragCacheResult.layer === 1) {
      const sanitised = sanitiseCachedVerdict(ragCacheResult.cached_verdict);
      // Fire-and-forget scan_event (Admin SDK, bypasses Firestore rules)
      writeScanEvent(sanitised, userIdStr, 'search_cache');
      return res.status(200).json(sanitised);
    }

    // STEP 2: Gemini call using training knowledge (no Google Search = much faster)
    const searchResult = await withTimeout(callGemini((ai) => ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: [{ parts: [{ text: searchPrompt(productName) }] }],
      config: { responseMimeType: 'application/json' },
    })));

    if (!searchResult.text) {
      return res.status(500).json({ error: `Could not retrieve data for "${productName}".` });
    }

    let geminiData: any;
    try {
      const raw = searchResult.text ?? '';
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON in response');
      geminiData = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    } catch {
      console.error('[searchProductByName] Parse error:', searchResult.text?.slice(0, 300));
      return res.status(500).json({ error: 'Failed to parse product data. Please try scanning the label instead.' });
    }

    if (geminiData.not_found || !geminiData.raw_ingredients?.length) {
      return res.status(404).json({
        error: `We couldn't find reliable ingredient data for "${productName}". Try scanning the product label for accurate results.`
      });
    }

    const product_name: string = geminiData.product_name || productName;
    const brand: string = geminiData.brand || '';
    const category: string = VALID_CATEGORIES.includes(geminiData.category) ? geminiData.category : 'FOOD';
    const nutrition = geminiData.nutrition || null;

    const rawIngredients: string[] = dedup(
      Array.isArray(geminiData.raw_ingredients) ? geminiData.raw_ingredients : [],
      (r: string) => r
    );
    const ingredientsAnalysis: any[] = dedup(
      Array.isArray(geminiData.ingredients_analysis) ? geminiData.ingredients_analysis : [],
      (ing: any) => ing.name || ing.plain_name || ''
    );

    // STEP 3: Merge DB + Gemini
    const finalVerified = buildFinalIngredients(rawIngredients, ingredientsAnalysis);

    // STEP 4: Score + build result
    const result = buildResult(product_name, brand, category, nutrition, finalVerified, rawIngredients, geminiData);

    // STEP 5: Cache and log scan event (both via Admin SDK)
    await Promise.all([
      saveProductToCache(result),
      writeScanEvent(result, userIdStr, 'search'),
    ]);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('[searchProductByName] Error:', error?.message || error);
    const msg = String(error?.message || error);
    const isQuota = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
    if (isQuota) {
      return res.status(429).json({ error: 'QUOTA_EXCEEDED', friendly: 'Our AI is temporarily busy due to high demand. Please try again in a minute.' });
    }
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
