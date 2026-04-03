// src/services/scoringEngine.ts
// ─────────────────────────────────────────────────────────────────────────────
// Deterministic scoring engine. Calculates product score from structured data.
// LLM never calculates scores. This code does.
// ─────────────────────────────────────────────────────────────────────────────

import { BatchLookupResult, IngredientEntry } from '../data/ingredientIntelligence';

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
  isUpf: boolean = false,
  hfssStatus: string = 'NONE'
): ScoreResult {
  const breakdown: ScoreBreakdownItem[] = [];
  let score = 100; // Starting from 100 as per screenshot

  // ── SUPPRESS if too many unknowns ──────────────────────────────────────────
  if (ingredientLookup.coveragePercent < 70) {
    return {
      overall_score: 0,
      score_breakdown: [],
      is_suppressed: true,
      suppression_reason: `Only ${ingredientLookup.coveragePercent}% of ingredients could be verified. Score suppressed to prevent misleading results.`
    };
  }

  // ── UPF PENALTY ──────────────────────────────────────────────────────────
  if (isUpf) {
    const d = -25; score += d;
    breakdown.push({ label: 'Ultra-Processed Food', impact: d, explanation: 'This product is classified as UPF, containing industrial additives and minimal whole food ingredients.' });
  }

  // ── HFSS PENALTY ──────────────────────────────────────────────────────────
  if (hfssStatus === 'HFSS' || hfssStatus === 'HIGH_FAT_SALT_SUGAR') {
    const d = -15; score += d;
    breakdown.push({ label: 'HFSS Product', impact: d, explanation: 'High in Fat, Salt, or Sugar. Consuming this regularly is linked to lifestyle diseases.' });
  }

  // ── FOOD NUTRITION SCORING ─────────────────────────────────────────────────
  if ((productCategory === 'FOOD' || productCategory === 'SUPPLEMENT') && nutrition) {

    // Sugar
    const sugar = nutrition.sugar_g ?? 0;
    if (sugar > 40) {
      const d = -20; score += d;
      breakdown.push({ label: 'Very High Sugar', impact: d, explanation: `${sugar}g sugar per 100g — that's ${(sugar/4).toFixed(1)} teaspoons. Extremely high.` });
    } else if (sugar > 20) {
      const d = -12; score += d;
      breakdown.push({ label: 'High Sugar', impact: d, explanation: `${sugar}g sugar per 100g — ${(sugar/4).toFixed(1)} teaspoons. Above safe daily limits for regular consumption.` });
    } else if (sugar > 10) {
      const d = -6; score += d;
      breakdown.push({ label: 'Moderate Sugar', impact: d, explanation: `${sugar}g sugar per 100g — moderate amount. Monitor daily intake.` });
    }

    // Sodium
    const sodium = nutrition.sodium_mg ?? 0;
    if (sodium > 800) {
      const d = -15; score += d;
      breakdown.push({ label: 'Very High Sodium', impact: d, explanation: `${sodium}mg sodium per 100g — dangerously high. ICMR recommends <2000mg per day total.` });
    } else if (sodium > 500) {
      const d = -8; score += d;
      breakdown.push({ label: 'High Sodium', impact: d, explanation: `${sodium}mg sodium per 100g — high. A large portion could use up a significant share of your daily allowance.` });
    }

    // Trans fat
    const transFat = nutrition.trans_fat_g ?? 0;
    if (transFat > 0.5) {
      const d = -15; score += d;
      breakdown.push({ label: 'Trans Fat Present', impact: d, explanation: `${transFat}g trans fat per 100g. WHO recommends zero trans fat. Raises bad cholesterol and lowers good cholesterol.` });
    } else if (transFat > 0.2) {
      const d = -8; score += d;
      breakdown.push({ label: 'Trace Trans Fat', impact: d, explanation: `${transFat}g trans fat — product claims "0g" but FSSAI allows this if below 0.2g/serving. Worth noting.` });
    }

    // Protein bonus
    const protein = nutrition.protein_g ?? 0;
    if (protein > 20) {
      const d = 10; score += d;
      breakdown.push({ label: 'High Protein', impact: d, explanation: `${protein}g protein per 100g — excellent protein content.` });
    } else if (protein > 10) {
      const d = 5; score += d;
      breakdown.push({ label: 'Good Protein', impact: d, explanation: `${protein}g protein per 100g — good protein content.` });
    }

    // Fibre bonus
    const fibre = nutrition.fibre_g ?? 0;
    if (fibre > 6) {
      const d = 8; score += d;
      breakdown.push({ label: 'High Fibre', impact: d, explanation: `${fibre}g fibre per 100g — excellent. Most Indians are fibre deficient.` });
    } else if (fibre > 3) {
      const d = 4; score += d;
      breakdown.push({ label: 'Good Fibre', impact: d, explanation: `${fibre}g fibre per 100g — decent fibre content.` });
    }
  }

  // ── INGREDIENT SAFETY SCORING (all categories) ────────────────────────────
  for (const { rawName, entry } of ingredientLookup.verified) {
    if (entry.score_impact === 0) continue;
    if (entry.score_impact < 0) {
      score += entry.score_impact;
      breakdown.push({
        label: entry.function,
        impact: entry.score_impact,
        explanation: `${rawName} (${entry.function}) — ${entry.safety_tier === 'AVOID' || entry.safety_tier === 'BANNED_IN_INDIA' ? 'HIGH CONCERN. ' : ''}${entry.plain_explanation.substring(0, 100)}...`
      });
    } else if (entry.score_impact > 0) {
      score += entry.score_impact;
      breakdown.push({
        label: `Beneficial: ${entry.function}`,
        impact: entry.score_impact,
        explanation: `${rawName} — ${entry.plain_explanation.substring(0, 100)}...`
      });
    }
  }

  // ── COSMETIC/PERSONAL CARE ADJUSTMENTS ────────────────────────────────────
  if (productCategory === 'COSMETIC' || productCategory === 'PERSONAL_CARE') {
    const bannedCount = ingredientLookup.verified.filter(v => v.entry.safety_tier === 'BANNED_IN_INDIA').length;
    const avoidCount  = ingredientLookup.verified.filter(v => v.entry.safety_tier === 'AVOID').length;
    if (bannedCount > 0) {
      const d = bannedCount * -30; score += d;
      breakdown.push({ label: 'Banned Ingredients', impact: d, explanation: `${bannedCount} ingredient(s) banned by CDSCO found in this product.` });
    }
    if (avoidCount > 0) {
      const d = avoidCount * -10; score += d;
      breakdown.push({ label: 'Ingredients to Avoid', impact: d, explanation: `${avoidCount} ingredient(s) flagged as AVOID.` });
    }
  }

  // ── UNVERIFIED PENALTY ────────────────────────────────────────────────────
  if (ingredientLookup.unverified.length > 0) {
    breakdown.push({
      label: 'Unverified Ingredients',
      impact: 0,
      explanation: `${ingredientLookup.unverified.length} ingredient(s) excluded from score as they could not be verified: ${ingredientLookup.unverified.slice(0,3).join(', ')}${ingredientLookup.unverified.length > 3 ? '...' : ''}`
    });
  }

  return {
    overall_score: Math.max(0, Math.min(100, Math.round(score))),
    score_breakdown: breakdown,
    is_suppressed: false,
    suppression_reason: null
  };
}

// ── Profile-specific score adjustment ────────────────────────────────────────

export interface ProfileAdjustment {
  profile_score: number;
  concerns: Array<{ label: string; detail: string; impact: number }>;
}

export function applyProfileAdjustment(
  baseScore: number,
  nutrition: NutritionData | null,
  verifiedIngredients: Array<{ rawName: string; entry: IngredientEntry }>,
  profile: { age: string; gender: string; lifestyle: string; conditions: string }
): ProfileAdjustment {
  let score = baseScore;
  const concerns: Array<{ label: string; detail: string; impact: number }> = [];
  const cond = (profile.conditions || '').toLowerCase();
  const age = parseInt(profile.age || '30');

  // Diabetes
  if (cond.includes('diabetes') || cond.includes('pre-diabetes') || cond.includes('pre diabetes')) {
    const sugar = nutrition?.sugar_g ?? 0;
    if (sugar > 10) {
      const d = -Math.min(20, Math.round((sugar - 10) * 1.2));
      score += d;
      concerns.push({ label: 'Diabetes — High Sugar', detail: `${sugar}g sugar per 100g significantly impacts blood glucose. Diabetics should limit sugar to <10g per 100g.`, impact: d });
    }
    const highGiIngredients = verifiedIngredients.filter(v =>
      v.entry.condition_flags.some(f => f.condition === 'diabetes' && f.impact === 'HIGH')
    );
    if (highGiIngredients.length > 0) {
      const d = -8; score += d;
      concerns.push({ label: 'High-GI Ingredients', detail: `${highGiIngredients.map(v => v.rawName).join(', ')} can spike blood glucose rapidly.`, impact: d });
    }
  }

  // Hypertension
  if (cond.includes('hypertension') || cond.includes('high blood pressure') || cond.includes('bp')) {
    const sodium = nutrition?.sodium_mg ?? 0;
    if (sodium > 400) {
      const d = -Math.min(15, Math.round((sodium - 400) / 60));
      score += d;
      concerns.push({ label: 'Hypertension — High Sodium', detail: `${sodium}mg sodium per 100g. ICMR recommends hypertensive patients limit total sodium to 1500mg/day.`, impact: d });
    }
  }

  // Child
  if (age < 13 || profile.gender === 'Kid') {
    const highConcernForKids = verifiedIngredients.filter(v =>
      v.entry.condition_flags.some(f => f.condition === 'children' && (f.impact === 'HIGH' || f.impact === 'MODERATE'))
    );
    if (highConcernForKids.length > 0) {
      const d = -(highConcernForKids.length * 8);
      score += d;
      concerns.push({ label: `Child Safety — ${highConcernForKids.length} flagged ingredients`, detail: `${highConcernForKids.map(v => v.rawName).join(', ')} flagged specifically for children by FSSAI/EFSA.`, impact: d });
    }
  }

  // Thyroid
  if (cond.includes('thyroid') || cond.includes('hypothyroid') || cond.includes('hyperthyroid')) {
    const thyroidConcerns = verifiedIngredients.filter(v =>
      v.entry.condition_flags.some(f => f.condition === 'thyroid' && f.impact !== 'POSITIVE')
    );
    if (thyroidConcerns.length > 0) {
      const d = -(thyroidConcerns.length * 6);
      score += d;
      concerns.push({ label: 'Thyroid — Flagged Ingredients', detail: `${thyroidConcerns.map(v => v.rawName).join(', ')} may interfere with thyroid function.`, impact: d });
    }
  }

  // Pregnancy
  if (cond.includes('pregnan') || cond.includes('expecting')) {
    const pregnancyConcerns = verifiedIngredients.filter(v =>
      v.entry.condition_flags.some(f => f.condition === 'pregnancy' && f.impact === 'HIGH')
    );
    if (pregnancyConcerns.length > 0) {
      score -= 30;
      concerns.push({ label: '⚠ Pregnancy — High Concern Ingredients', detail: `${pregnancyConcerns.map(v => v.rawName).join(', ')} are flagged HIGH concern during pregnancy.`, impact: -30 });
    }
  }

  // Activity Level - Sedentary
  if (profile.lifestyle === 'SEDENTARY') {
    const energy = nutrition?.energy_kcal ?? 0;
    if (energy > 300) {
      const d = -8; score += d;
      concerns.push({ label: 'Calorie Density — Sedentary Note', detail: `High calorie density (${energy} kcal/100g) is less ideal for a sedentary lifestyle.`, impact: d });
    }
  }

  return {
    profile_score: Math.max(0, Math.min(100, Math.round(score))),
    concerns
  };
}
