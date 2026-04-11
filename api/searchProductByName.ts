// api/searchProductByName.ts — Vercel serverless function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initAdmin } from '../lib/adminInit';
import {
  callGemini, withTimeout, setCors,
  VALID_CATEGORIES, buildFinalIngredients, buildResult, dedup,
  ragLookup, saveProductToCache
} from '../lib/shared';

// No Google Search grounding — too slow for Vercel Hobby 60s limit.
// Gemini's training data covers all major Indian & global brands accurately.
const searchPrompt = (productName: string) =>
  `You are a product safety analyst for Indian consumers.

TASK: Provide a complete safety analysis for the product "${productName}" sold in India.

INSTRUCTIONS:
1. If "${productName}" is a brand name, resolve to the flagship product (e.g. "Maggi" → "Maggi 2-Minute Masala Noodles", "Nutella" → "Nutella Hazelnut Spread with Cocoa").
2. Use your training knowledge of the product's official label. If you don't know the exact ingredients, use the most commonly listed formulation for India.
3. ALL ingredient names in ENGLISH only.
4. Nutrition values from official India label per 100g/100ml. Use null if unknown — never use 0 as placeholder.
5. safety_tier: SAFE | CAUTION | AVOID | BANNED_IN_INDIA — use established FSSAI/WHO/EFSA evidence only.
6. plain_explanation: one factual sentence citing source (FSSAI, WHO, ICMR-NIN etc.).
7. flag_for: conditions with confirmed clinical evidence only.
8. summary: 2-3 sentences on what the data shows.
9. india_context: one sentence citing a real FSSAI/CDSCO regulation.
10. suggestions: product TYPES only — never specific brand names.
11. is_upf: true only if Nova Group 4 criteria met.
12. If you genuinely have no information about this product, set not_found: true.

Return ONLY valid JSON matching this exact structure:
{
  "product_name": "full product name",
  "brand": "brand name",
  "category": "FOOD|COSMETIC|PERSONAL_CARE|SUPPLEMENT|HOUSEHOLD|PET_FOOD",
  "nutrition": { "energy_kcal": number|null, "sugar_g": number|null, "sodium_mg": number|null, "protein_g": number|null, "fat_g": number|null, "saturated_fat_g": number|null, "trans_fat_g": number|null, "fibre_g": number|null },
  "raw_ingredients": ["string"],
  "ingredients_analysis": [
    { "name": "string", "plain_name": "string", "function": "string", "safety_tier": "SAFE|CAUTION|AVOID|BANNED_IN_INDIA", "plain_explanation": "string", "flag_for": ["string"] }
  ],
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

  const { productName } = req.body ?? {};
  if (!productName || typeof productName !== 'string') {
    return res.status(400).json({ error: 'productName is required.' });
  }

  try {
    initAdmin();

    // STEP 1: RAG cache check — instant return if previously searched/scanned
    const ragCacheResult = await ragLookup({ productName });
    if (ragCacheResult.layer === 1) {
      return res.status(200).json(ragCacheResult.cached_verdict);
    }

    // STEP 2: Gemini call using training knowledge (no Google Search = much faster)
    const searchResult = await withTimeout(callGemini((ai) => ai.models.generateContent({
      model: 'gemini-2.0-flash',
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

    // STEP 5: Cache for future requests
    await saveProductToCache(result);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('[searchProductByName] Error:', error?.message || error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
