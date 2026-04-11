// api/analyseLabel.ts — Vercel serverless function replacing Firebase analyseLabel
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

const singlePassPrompt = `You are a product safety analyst for Indian consumers — think FitTuber meets a food scientist. Your job is to uncover what's really inside a product, in plain language that any Indian consumer can understand. Your output is shown directly to users — be accurate, be honest, never guess.

━━━ ANTI-HALLUCINATION RULES (non-negotiable) ━━━
1. EXTRACT ONLY what is explicitly printed on the label image. Do not infer, assume, or add anything not visibly written.
2. If text is unclear or cut off, extract what you can read with certainty. Skip what you cannot read — do not guess.
3. ALL ingredient names must be in ENGLISH exactly as printed. Never translate to Hindi or any other language.
4. Nutrition values: extract ONLY from the visible nutrition facts panel. If the panel is not in the image, use null for all nutrition fields. Never use 0 as a placeholder.
5. safety_tier rules — use ONLY these criteria:
   • SAFE: Permitted by FSSAI/CDSCO with no significant concern at food-grade concentrations
   • CAUTION: Has documented restrictions or advisories from FSSAI, WHO, EFSA, or peer-reviewed science
   • AVOID: Specifically flagged as harmful by FSSAI/CDSCO/WHO or linked to serious adverse effects in published clinical research
   • BANNED_IN_INDIA: Explicitly prohibited under FSSAI Food Safety & Standards Act or CDSCO order — ONLY use when you are certain of the specific ban
   • When in doubt between tiers, always choose the LOWER concern tier. Never overstate risk.
6. plain_explanation: State only established facts. Reference the specific standard or body. Do not speculate.
7. flag_for: Only include health conditions where peer-reviewed clinical evidence or government guidelines confirm a specific concern.
8. summary: Only state what the data above shows. Do not add new claims, risks, or benefits not supported by the extracted data.
9. india_context: Only cite FSSAI regulations, CDSCO orders, or BIS standards that you are certain exist.
10. claim_checks: Only flag a front-of-pack claim as misleading if it violates a specific, named FSSAI/BIS standard.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK — do all of the following in one response:

1. EXTRACT from the label (only what is visibly printed):
   - Product name and brand exactly as shown
   - Category: FOOD | COSMETIC | PERSONAL_CARE | SUPPLEMENT | HOUSEHOLD | PET_FOOD
   - Full ingredients list in the EXACT ORDER printed — this is critical, ingredients are listed by weight descending
   - Nutrition per 100g/100ml from the visible panel only (null if panel not visible)
   - serving_size_g: the serving size in grams as printed (null if not shown)

2. ANALYSE each ingredient:
   - plain_name: the common name consumers recognise (e.g. "Sugar" not "Sucrose", "Maida" not "Wheat Flour")
   - function: its role (e.g. "Sweetener", "Refined Flour", "Preservative", "Artificial Colour")
   - safety_tier: per the strict rules above
   - plain_explanation: one factual sentence citing the relevant standard or body
   - flag_for: conditions with confirmed clinical concern only, or []
   - position: the 1-based position of this ingredient in the ingredients list (1 = most by weight)

3. DETECT these specific Indian consumer concerns:
   a) HIDDEN SUGAR: List ALL sugar-type ingredients found (sugar, glucose, dextrose, maltodextrin, corn syrup, fructose, sucrose, jaggery, honey, etc.). If 2 or more are present, set hidden_sugar_count to their count and hidden_sugar_names to their names — this is a major red flag because companies split sugar into multiple names to push it down the list.
   b) MAIDA ALERT: If "Wheat Flour" (not "Whole Wheat Flour" or "Atta") appears in the top 3 ingredients, set maida_alert to true. "Wheat Flour" in India = refined maida, not atta.
   c) TOP INGREDIENT WARNING: If the #1 or #2 ingredient (by weight) is sugar, maida/wheat flour, or palm oil, set top_ingredient_warning to a plain-English sentence like "Sugar is the #1 ingredient by weight — this product is more sugar than anything else."
   d) SERVING SIZE TRICK: If a serving_size is printed AND it is less than 30g for a solid food, set serving_size_trick to true — companies use tiny serving sizes to make nutrition numbers look better.
   e) NO MSG DECEPTION: If the product contains INS 627, INS 631, or INS 635 (with or without MSG/INS 621), set no_msg_deception to true. These are excitotoxins used as MSG replacements — often combined on a product that proudly says "No MSG" on the front.
   f) FRONT CLAIM CHECKS: If a front label image is provided, check each marketing claim against the actual ingredients. Flag if "multigrain" product has maida as #1, "no added sugar" has artificial sweeteners or maltodextrin, "natural" has artificial flavours, "No MSG" but contains INS 627/631/635, "healthy" or "nutritious" but is HFSS, etc.

4. WRITE a verdict:
   - summary: 2-3 punchy sentences like a consumer champion would write — name the specific concerning ingredients, be direct. E.g. "Sugar is the first ingredient. It contains 3 different forms of sugar totalling X% of the product. The 'multigrain' claim is misleading as refined wheat flour (maida) makes up most of the product."
   - india_context: one sentence citing a real FSSAI/CDSCO regulation relevant to this product
   - is_upf: true only if the product meets Nova Group 4 ultra-processed food criteria
   - hfss_status: "HFSS" only if it exceeds FSSAI/WHO thresholds for fat, sugar, or salt
   - suggestions: 1-2 product TYPE alternatives (never a specific brand name)

Return ONLY this JSON (no markdown, no explanation outside the JSON):
{
  "product_name": "string",
  "brand": "string",
  "category": "FOOD|COSMETIC|PERSONAL_CARE|SUPPLEMENT|HOUSEHOLD|PET_FOOD",
  "nutrition": { "energy_kcal": number|null, "sugar_g": number|null, "sodium_mg": number|null, "protein_g": number|null, "fat_g": number|null, "saturated_fat_g": number|null, "trans_fat_g": number|null, "fibre_g": number|null },
  "serving_size_g": number|null,
  "raw_ingredients": ["string", ...],
  "ingredients_analysis": [
    { "name": "string", "plain_name": "string", "function": "string", "safety_tier": "SAFE|CAUTION|AVOID|BANNED_IN_INDIA", "plain_explanation": "string", "flag_for": ["string"], "position": number }
  ],
  "hidden_sugar_count": number,
  "hidden_sugar_names": ["string"],
  "maida_alert": boolean,
  "top_ingredient_warning": "string|null",
  "serving_size_trick": boolean,
  "no_msg_deception": boolean,
  "summary": "string",
  "india_context": "string",
  "is_upf": boolean,
  "hfss_status": "GREEN|HFSS",
  "suggestions": [{ "type": "SWAP", "name": "product type only", "reason": "string" }]
}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { backImageBase64, backMimeType, frontImageBase64, frontMimeType, userId } = req.body || {};
  if (!backImageBase64 || !backMimeType) {
    return res.status(400).json({ error: 'backImageBase64 and backMimeType are required.' });
  }
  const userIdStr = typeof userId === 'string' && userId ? userId : 'guest';

  try {
    initAdmin();

    // ── STEP 1: Gemini single-pass extract + analyse ──────────────────────────
    const imageParts: any[] = [
      { inlineData: { data: backImageBase64, mimeType: backMimeType } }
    ];
    if (frontImageBase64 && frontMimeType) {
      imageParts.push({ inlineData: { data: frontImageBase64, mimeType: frontMimeType } });
    }
    imageParts.push({ text: singlePassPrompt });

    const singlePassResult = await withTimeout(callGemini((ai) => ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
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
    if (ragResult.layer === 1) {
      const sanitised = sanitiseCachedVerdict(ragResult.cached_verdict);
      writeScanEvent(sanitised, userIdStr, 'scan_cache');
      return res.status(200).json(sanitised);
    }

    // ── STEP 3: Merge DB + Gemini analysis ───────────────────────────────────
    const finalVerified = buildFinalIngredients(rawIngredients, ingredientsAnalysis);

    // ── STEP 4: Score + build result ─────────────────────────────────────────
    const result = buildResult(product_name, brand, category, nutrition, finalVerified, rawIngredients, geminiData);

    // ── STEP 5: Cache and log scan event (both via Admin SDK)
    await Promise.all([
      saveProductToCache(result),
      writeScanEvent(result, userIdStr, 'scan'),
    ]);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('[analyseLabel] Error:', error);
    const msg = String(error?.message || error);
    const isQuota = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
    if (isQuota) {
      return res.status(429).json({ error: 'QUOTA_EXCEEDED', friendly: 'Our AI is temporarily busy due to high demand. Please try again in a minute.' });
    }
    return res.status(500).json({ error: error.message || 'Failed to analyse label.' });
  }
}
