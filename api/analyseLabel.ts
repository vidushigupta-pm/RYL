// api/analyseLabel.ts — Vercel serverless function replacing Firebase analyseLabel
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initAdmin } from '../lib/adminInit';
import {
  getAI, callGemini, withTimeout, setCors,
  VALID_CATEGORIES, buildFinalIngredients, buildResult, dedup,
  ragLookup, saveProductToCache
} from '../lib/shared';

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
   • When in doubt between tiers, always choose the LOWER concern tier. Never overstate risk.
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { backImageBase64, backMimeType, frontImageBase64, frontMimeType } = req.body || {};
  if (!backImageBase64 || !backMimeType) {
    return res.status(400).json({ error: 'backImageBase64 and backMimeType are required.' });
  }

  try {
    initAdmin();
    const ai = getAI();

    // ── STEP 1: Gemini single-pass extract + analyse ──────────────────────────
    const imageParts: any[] = [
      { inlineData: { data: backImageBase64, mimeType: backMimeType } }
    ];
    if (frontImageBase64 && frontMimeType) {
      imageParts.push({ inlineData: { data: frontImageBase64, mimeType: frontMimeType } });
    }
    imageParts.push({ text: singlePassPrompt });

    const singlePassResult = await withTimeout(callGemini(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ parts: imageParts }],
      config: { responseMimeType: 'application/json' },
    })));

    if (!singlePassResult.text) {
      return res.status(500).json({ error: 'Gemini returned no data.' });
    }

    let geminiData: any;
    try {
      const raw = singlePassResult.text ?? '';
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON in response');
      geminiData = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    } catch {
      return res.status(500).json({ error: 'Failed to parse label analysis. Please try again with a clearer image.' });
    }

    const product_name: string = geminiData.product_name || 'Unknown Product';
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

    // ── STEP 2: RAG cache check ───────────────────────────────────────────────
    const ragResult = await ragLookup({ productName: product_name, extractedIngredients: rawIngredients, nutrition, productCategory: category });
    if (ragResult.layer === 1) return res.status(200).json(ragResult.cached_verdict);

    // ── STEP 3: Merge DB + Gemini analysis ───────────────────────────────────
    const finalVerified = buildFinalIngredients(rawIngredients, ingredientsAnalysis);

    // ── STEP 4: Score + build result ─────────────────────────────────────────
    const result = buildResult(product_name, brand, category, nutrition, finalVerified, rawIngredients, geminiData);

    // ── STEP 5: Cache for future requests ────────────────────────────────────
    await saveProductToCache(result);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('[analyseLabel] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyse label.' });
  }
}
