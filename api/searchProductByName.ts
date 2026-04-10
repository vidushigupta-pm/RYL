// api/searchProductByName.ts — Vercel serverless function replacing Firebase searchProductByName
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initAdmin } from '../lib/adminInit';
import {
  getAI, callGemini, withTimeout, setCors,
  VALID_CATEGORIES, buildFinalIngredients, buildResult, dedup,
  ragLookup, saveProductToCache
} from '../lib/shared';

const searchAnalysePrompt = (productName: string) =>
  `You are a product safety analyst for Indian consumers. Your output is displayed directly to users in a health app — accuracy is critical. Never guess or hallucinate.

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
    const ai = getAI();

    // STEP 1: RAG cache check
    const ragCacheResult = await ragLookup({ productName });
    if (ragCacheResult.layer === 1) {
      return res.status(200).json(ragCacheResult.cached_verdict);
    }

    // STEP 2: Single Gemini call — search + analyse + summarise
    const searchResult = await withTimeout(callGemini(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: searchAnalysePrompt(productName) }] }],
      config: {
        // NOTE: responseMimeType cannot be used together with tools (googleSearch).
        tools: [{ googleSearch: {} }],
      },
    })));

    if (!searchResult.text) {
      return res.status(500).json({ error: `Gemini returned no data for "${productName}".` });
    }

    // Google Search grounding often adds citation text — extract just the JSON object
    let geminiData: any;
    try {
      const raw = searchResult.text ?? '';
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON in response');
      geminiData = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    } catch {
      console.error('[searchProductByName] Parse error:', searchResult.text?.slice(0, 500));
      return res.status(500).json({ error: 'Failed to parse product data. Please try scanning the label instead.' });
    }

    if (geminiData.not_found) {
      return res.status(404).json({ error: `Could not find "${productName}". Try scanning the label instead.` });
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

    if (rawIngredients.length === 0) {
      return res.status(500).json({
        error: `Could not find ingredient data for "${productName}". Please try scanning the label instead.`
      });
    }

    // STEP 3: Merge DB + Gemini
    const finalVerified = buildFinalIngredients(rawIngredients, ingredientsAnalysis);

    // STEP 4: Score + build result
    const result = buildResult(product_name, brand, category, nutrition, finalVerified, rawIngredients, geminiData);

    // STEP 5: Cache
    await saveProductToCache(result);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('[searchProductByName] Error:', error?.message || error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
