// functions/src/scoringEngine.ts
import { BatchLookupResult, IngredientEntry } from './data';

export interface NutritionData {
  energy_kcal?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  protein_g?: number | null;
  fat_g?: number | null;
  saturated_fat_g?: number | null;
  trans_fat_g?: number | null;
  fibre_g?: number | null;
}

export interface ScoreBreakdownItem {
  label: string;
  impact: number;
  explanation: string;
  source?: string;     // e.g. "WHO 2015 · ICMR-NIN 2024"
  threshold?: string;  // e.g. "37g/100g (flagged above 20g/100g)"
  category?: 'NUTRITION' | 'INGREDIENT' | 'UPF' | 'COSMETIC' | 'HOUSEHOLD';
}

export interface ScoreResult {
  overall_score: number;
  score_breakdown: ScoreBreakdownItem[];
  is_suppressed: boolean;
  suppression_reason: string | null;
}

export function calculateScore(
  ingredientLookup: BatchLookupResult,
  nutrition: NutritionData | null,
  productCategory: string,
  isUpf: boolean = false
): ScoreResult {
  const breakdown: ScoreBreakdownItem[] = [];
  let score = 100; // start at 100 — deductions applied only for actual issues found

  // ── SUPPRESS if too many unknowns ──────────────────────────────────────────
  const coveragePct = isNaN(ingredientLookup.coveragePercent)
    ? (ingredientLookup.verified.length === 0 && ingredientLookup.unverified.length === 0 ? 100 : 0)
    : ingredientLookup.coveragePercent;
  if (coveragePct < 70) {
    return {
      overall_score: 0,
      score_breakdown: [],
      is_suppressed: true,
      suppression_reason: `Only ${coveragePct}% of ingredients could be verified. Score suppressed to prevent misleading results.`
    };
  }

  // ── FOOD NUTRITION SCORING ─────────────────────────────────────────────────
  // Deductions are intentionally conservative — only flag genuinely problematic levels.
  if ((productCategory === 'FOOD' || productCategory === 'SUPPLEMENT') && nutrition) {

    // Sugar — WHO daily free sugar limit is ~50g for an adult
    const sugar = nutrition.sugar_g ?? 0;
    if (sugar > 40) {
      const d = -10; score += d;
      breakdown.push({ label: 'Very High Sugar', impact: d, explanation: `${sugar}g sugar per 100g — that's ${(sugar/4).toFixed(1)} teaspoons. Significantly above WHO's recommended daily free sugar limit of ~50g total.`, source: 'WHO Free Sugars Guideline 2015 · ICMR-NIN 2024', threshold: `${sugar}g/100g (flagged above 40g/100g)`, category: 'NUTRITION' });
    } else if (sugar > 20) {
      const d = -6; score += d;
      breakdown.push({ label: 'High Sugar', impact: d, explanation: `${sugar}g sugar per 100g — ${(sugar/4).toFixed(1)} teaspoons. A large serving could contribute meaningfully to your daily sugar limit.`, source: 'WHO Free Sugars Guideline 2015 · ICMR-NIN 2024', threshold: `${sugar}g/100g (flagged above 20g/100g)`, category: 'NUTRITION' });
    } else if (sugar > 12) {
      const d = -3; score += d;
      breakdown.push({ label: 'Moderate Sugar', impact: d, explanation: `${sugar}g sugar per 100g — moderate. Fine occasionally but worth watching if consumed daily.`, source: 'WHO Free Sugars Guideline 2015', threshold: `${sugar}g/100g (flagged above 12g/100g)`, category: 'NUTRITION' });
    }

    // Sodium — ICMR recommends <2000mg/day total
    const sodium = nutrition.sodium_mg ?? 0;
    if (sodium > 1000) {
      const d = -18; score += d;
      breakdown.push({ label: 'Extremely High Sodium', impact: d, explanation: `${sodium}mg sodium per 100g — a single serving can cover 50–75%+ of ICMR's 2000mg daily limit. Strongly linked to hypertension with regular use.`, source: 'ICMR-NIN Dietary Guidelines 2024 · WHO CVD Prevention', threshold: `${sodium}mg/100g (flagged above 1000mg/100g)`, category: 'NUTRITION' });
    } else if (sodium > 800) {
      const d = -13; score += d;
      breakdown.push({ label: 'Very High Sodium', impact: d, explanation: `${sodium}mg sodium per 100g — a large portion covers 40%+ of the ICMR daily limit of 2000mg.`, source: 'ICMR-NIN Dietary Guidelines 2024', threshold: `${sodium}mg/100g (flagged above 800mg/100g)`, category: 'NUTRITION' });
    } else if (sodium > 500) {
      const d = -7; score += d;
      breakdown.push({ label: 'High Sodium', impact: d, explanation: `${sodium}mg sodium per 100g — notable. Keep an eye on total daily sodium if consuming regularly.`, source: 'ICMR-NIN Dietary Guidelines 2024', threshold: `${sodium}mg/100g (flagged above 500mg/100g)`, category: 'NUTRITION' });
    }

    // Trans fat — WHO recommends zero; any amount is a concern
    const transFat = nutrition.trans_fat_g ?? 0;
    if (transFat > 0.5) {
      const d = -10; score += d;
      breakdown.push({ label: 'Trans Fat Present', impact: d, explanation: `${transFat}g trans fat per 100g. WHO recommends zero trans fat in the diet. Linked to raised LDL cholesterol.`, source: 'WHO REPLACE Initiative 2018 · FSSAI FSS Regulations', threshold: `${transFat}g/100g (any amount above 0.2g is flagged)`, category: 'NUTRITION' });
    } else if (transFat > 0.2) {
      const d = -4; score += d;
      breakdown.push({ label: 'Trace Trans Fat', impact: d, explanation: `${transFat}g trans fat detected. FSSAI allows products to claim "0g" if below 0.2g per serving — this is trace but worth noting.`, source: 'FSSAI Food Safety & Standards (Labelling) Regulations', threshold: `${transFat}g/100g (trace level 0.2–0.5g)`, category: 'NUTRITION' });
    }

    // Protein bonus
    const protein = nutrition.protein_g ?? 0;
    if (protein > 20) {
      const d = 8; score += d;
      breakdown.push({ label: 'High Protein', impact: d, explanation: `${protein}g protein per 100g — excellent. Most Indians don't get enough protein from packaged food.`, source: 'ICMR-NIN RDA 2020 (0.8–1g/kg body weight)', threshold: `${protein}g/100g (bonus above 20g/100g)`, category: 'NUTRITION' });
    } else if (protein > 10) {
      const d = 4; score += d;
      breakdown.push({ label: 'Good Protein', impact: d, explanation: `${protein}g protein per 100g — good protein content.`, source: 'ICMR-NIN RDA 2020', threshold: `${protein}g/100g (bonus above 10g/100g)`, category: 'NUTRITION' });
    }

    // Fibre bonus
    const fibre = nutrition.fibre_g ?? 0;
    if (fibre > 6) {
      const d = 6; score += d;
      breakdown.push({ label: 'High Fibre', impact: d, explanation: `${fibre}g fibre per 100g — excellent. High fibre supports digestion and helps manage blood sugar levels.`, source: 'ICMR-NIN 2024 · WHO Diet & Chronic Disease Report', threshold: `${fibre}g/100g (bonus above 6g/100g)`, category: 'NUTRITION' });
    } else if (fibre > 3) {
      const d = 3; score += d;
      breakdown.push({ label: 'Good Fibre', impact: d, explanation: `${fibre}g fibre per 100g — decent fibre content.`, source: 'ICMR-NIN 2024', threshold: `${fibre}g/100g (bonus above 3g/100g)`, category: 'NUTRITION' });
    }
  }

  // ── ULTRA-PROCESSED FOOD (UPF) PENALTY ───────────────────────────────────
  // Nova Group 4 classification: heavily processed, stripped of nutrition, linked to
  // chronic disease in multiple large-cohort studies (INSERM, Harvard, BMJ 2019).
  if (isUpf && (productCategory === 'FOOD' || productCategory === 'SUPPLEMENT')) {
    const d = -10; score += d;
    breakdown.push({
      label: '⚠ Ultra-Processed Food (Nova Group 4)',
      impact: d,
      explanation: 'This product is classified as ultra-processed (Nova Group 4) — industrially formulated with additives, flavours, or texturisers not found in home cooking. Large-cohort studies link regular UPF consumption to obesity, cardiovascular disease, and Type 2 diabetes.',
      source: 'NOVA Classification (Monteiro et al.) · BMJ 2019 · INSERM Cohort Study',
      threshold: 'Nova Group 4: contains industrial additives/emulsifiers not used in home cooking',
      category: 'UPF'
    });
  }

  // ── INGREDIENT SAFETY SCORING (all categories) ────────────────────────────
  for (const { rawName, entry } of ingredientLookup.verified) {
    if (entry.score_impact === 0) continue;
    if (entry.score_impact < 0) {
      score += entry.score_impact;
      breakdown.push({
        label: `${rawName} — ${entry.function}`,
        impact: entry.score_impact,
        explanation: `${entry.safety_tier === 'AVOID' || entry.safety_tier === 'BANNED_IN_INDIA' ? '⚠ HIGH CONCERN: ' : ''}${entry.plain_explanation}`,
        source: entry.safety_tier === 'BANNED_IN_INDIA' ? 'FSSAI / CDSCO India — Prohibited Substance' : entry.safety_tier === 'AVOID' ? 'FSSAI / EFSA / WHO — High Concern' : 'FSSAI / EFSA — Caution Advisory',
        threshold: `Safety tier: ${entry.safety_tier}`,
        category: 'INGREDIENT'
      });
    } else if (entry.score_impact > 0) {
      score += entry.score_impact;
      breakdown.push({
        label: `✓ ${rawName} — ${entry.function}`,
        impact: entry.score_impact,
        explanation: entry.plain_explanation,
        source: 'Verified ingredient database',
        threshold: `Safety tier: ${entry.safety_tier}`,
        category: 'INGREDIENT'
      });
    }
  }

  // ── COSMETIC / PERSONAL CARE ADJUSTMENTS ─────────────────────────────────
  if (productCategory === 'COSMETIC' || productCategory === 'PERSONAL_CARE') {
    const bannedCount = ingredientLookup.verified.filter(v => v.entry.safety_tier === 'BANNED_IN_INDIA').length;
    const avoidCount  = ingredientLookup.verified.filter(v => v.entry.safety_tier === 'AVOID').length;
    const cautionCount = ingredientLookup.verified.filter(v => v.entry.safety_tier === 'CAUTION').length;
    if (bannedCount > 0) {
      const d = bannedCount * -20; score += d;
      breakdown.push({ label: '⚠️ Banned Ingredients (CDSCO)', impact: d, explanation: `${bannedCount} ingredient(s) banned by CDSCO India found. This is a serious safety concern — avoid this product.`, source: 'CDSCO India — Drugs & Cosmetics Act', threshold: `${bannedCount} prohibited substance(s) found`, category: 'COSMETIC' });
    }
    if (avoidCount > 0) {
      const d = avoidCount * -8; score += d;
      breakdown.push({ label: 'High-Concern Ingredients', impact: d, explanation: `${avoidCount} ingredient(s) flagged as high concern (e.g. formaldehyde releasers, triclosan, hydroquinone). Worth avoiding especially for sensitive skin or pregnancy.`, source: 'EFSA / EU Cosmetics Regulation 1223/2009 · CDSCO', threshold: `${avoidCount} AVOID-tier ingredient(s) found`, category: 'COSMETIC' });
    }
    if (cautionCount > 4) {
      const d = -5; score += d;
      breakdown.push({ label: 'Multiple Caution Ingredients', impact: d, explanation: `${cautionCount} ingredients flagged for caution (e.g. parabens, SLS, fragrance). Each is acceptable at low concentrations, but a high count together may not suit sensitive skin.`, source: 'EFSA / EU Cosmetics Regulation 1223/2009', threshold: `${cautionCount} CAUTION-tier ingredients (flagged above 4)`, category: 'COSMETIC' });
    }
    const beneficialCount = ingredientLookup.verified.filter(v => v.entry.score_impact > 0).length;
    if (beneficialCount > 0) {
      breakdown.push({ label: 'Beneficial Actives Present', impact: 0, explanation: `${beneficialCount} ingredient(s) with proven skin benefits found (e.g. niacinamide, hyaluronic acid, zinc oxide).`, source: 'Verified ingredient database', category: 'COSMETIC' });
    }
  }

  // ── HOUSEHOLD PRODUCT ADJUSTMENTS ─────────────────────────────────────────
  if (productCategory === 'HOUSEHOLD') {
    const bannedCount = ingredientLookup.verified.filter(v => v.entry.safety_tier === 'BANNED_IN_INDIA').length;
    const avoidCount  = ingredientLookup.verified.filter(v => v.entry.safety_tier === 'AVOID').length;
    if (bannedCount > 0) {
      const d = bannedCount * -20; score += d;
      breakdown.push({ label: 'Prohibited Substances', impact: d, explanation: `${bannedCount} prohibited substance(s) found. Do not use this product.`, source: 'BIS / MoEFCC India — Banned Chemicals', threshold: `${bannedCount} prohibited substance(s)`, category: 'HOUSEHOLD' });
    }
    if (avoidCount > 0) {
      const d = avoidCount * -8; score += d;
      breakdown.push({ label: 'Hazardous Chemicals', impact: d, explanation: `${avoidCount} chemical(s) flagged as high concern. Use with protective gloves and good ventilation.`, source: 'BIS / WHO Chemical Safety Database', threshold: `${avoidCount} AVOID-tier chemical(s)`, category: 'HOUSEHOLD' });
    }
  }

  // ── UNVERIFIED PENALTY ────────────────────────────────────────────────────
  if (ingredientLookup.unverified.length > 0) {
    breakdown.push({
      label: 'Unverified Ingredients',
      impact: 0,
      explanation: `${ingredientLookup.unverified.length} ingredient(s) could not be verified against our database — they were analysed by AI instead: ${ingredientLookup.unverified.slice(0,3).join(', ')}${ingredientLookup.unverified.length > 3 ? '...' : ''}`
    });
  }

  return {
    overall_score: Math.max(0, Math.min(100, Math.round(score))),
    score_breakdown: breakdown,
    is_suppressed: false,
    suppression_reason: null
  };
}
