// src/services/profileScoringEngine.ts
// ─────────────────────────────────────────────────────────────────────────────
// Profile-aware scoring engine.
// Handles: allergen hard stops, age rules, condition rules,
//          gender rules, activity rules — all wired together correctly.
// ─────────────────────────────────────────────────────────────────────────────

import {
  FamilyProfile,
  HealthCondition,
  HealthGoal,
  AgeGroup,
  ActivityLevel,
  Gender,
  DietaryPreference
} from '../data/familyProfiles';

// ── Types ─────────────────────────────────────────────────────────────────────

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

export interface IngredientEntry {
  name: string;
  safety_tier: string;
  function: string;
  plain_explanation: string;
  flag_for: string[];
  condition_flags?: Array<{
    condition: string;
    impact: string;
    reason: string;
    source: string;
  }>;
}

export interface ProfileConcern {
  label: string;
  detail: string;
  severity: 'HIGH' | 'MODERATE' | 'LOW' | 'BENEFICIAL';
  impact: number;
  source: string;
}

export interface ProfileVerdict {
  profile: FamilyProfile;
  profile_score: number;
  grade: string;
  colour: 'GREEN' | 'YELLOW' | 'RED' | 'BLOCKED';
  allergen_blocked: boolean;
  allergen_found: string[];
  one_line_verdict: string;
  concerns: ProfileConcern[];
  positives: string[];
  safe_consumption_note: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toGrade(s: number): string {
  if (s >= 85) return 'A+';
  if (s >= 70) return 'A';
  if (s >= 55) return 'B';
  if (s >= 40) return 'C';
  if (s >= 25) return 'D';
  return 'E';
}

function toColour(s: number): 'GREEN' | 'YELLOW' | 'RED' {
  if (s >= 70) return 'GREEN';
  if (s >= 40) return 'YELLOW';
  return 'RED';
}

function cap(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function has(conditions: HealthCondition[], c: HealthCondition): boolean {
  return conditions.includes(c);
}

// ── SECTION 1: Allergen Hard Stop ─────────────────────────────────────────────
// Allergens override all scoring. Always RED regardless of score.

function checkAllergens(
  profile: FamilyProfile,
  declaredAllergens: string[],
  ingredientNames: string[]
): { blocked: boolean; found: string[] } {

  const allergenKeywords: Record<string, string[]> = {
    GLUTEN:          ['wheat', 'gluten', 'barley', 'rye', 'oats', 'maida', 'atta', 'semolina', 'suji', 'bran'],
    DAIRY_MILK:      ['milk', 'dairy', 'lactose', 'whey', 'casein', 'butter', 'ghee', 'cream', 'paneer', 'curd', 'cheese'],
    EGGS:            ['egg', 'albumin', 'ovum', 'mayonnaise', 'lecithin (egg)'],
    TREE_NUTS:       ['almond', 'cashew', 'walnut', 'pistachio', 'pecan', 'hazelnut', 'macadamia', 'kaju', 'badam', 'pista'],
    PEANUTS:         ['peanut', 'groundnut', 'monkey nut', 'arachis', 'mungfali'],
    SOY:             ['soy', 'soya', 'soybean', 'tofu', 'edamame', 'miso', 'tempeh'],
    SHELLFISH:       ['shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'shellfish'],
    FISH:            ['fish', 'cod', 'salmon', 'tuna', 'sardine', 'anchovy', 'mackerel', 'omega-3 (fish)'],
    SESAME:          ['sesame', 'til', 'tahini', 'gingelly', 'benne'],
    MUSTARD:         ['mustard', 'sarson', 'mustard oil', 'mustard seed'],
    SULPHITES:            ['ins 220', 'ins 221', 'ins 222', 'ins 223', 'ins 224', 'sulphite', 'sulfite', 'sulphur dioxide'],
    TARTRAZINE_DYE:       ['ins 102', 'tartrazine', 'yellow 5'],
    // Skin / topical allergens
    FRAGRANCE_ALLERGY:    ['fragrance', 'parfum', 'perfume', 'limonene', 'linalool', 'eugenol', 'geraniol', 'cinnamal', 'citronellol'],
    NICKEL_ALLERGY:       ['nickel sulfate', 'nickel sulphate', 'nickel'],
    LATEX_ALLERGY:        ['latex', 'natural rubber', 'rubber latex'],
    LANOLIN_ALLERGY:      ['lanolin', 'wool wax', 'wool fat', 'adeps lanae', 'lanolin alcohol'],
    PARABENS_SENSITIVITY: ['methylparaben', 'ethylparaben', 'propylparaben', 'butylparaben', 'isobutylparaben', 'isopropylparaben', 'paraben'],
  };

  const found: string[] = [];
  const allText = [...declaredAllergens, ...ingredientNames]
    .map(s => s.toLowerCase())
    .join(' ');

  for (const allergen of profile.allergens) {
    const keywords = allergenKeywords[allergen] || [];
    if (keywords.some(kw => allText.includes(kw))) {
      found.push(allergen);
    }
  }

  return { blocked: found.length > 0, found };
}

// ── SECTION 2: Age Group Rules ────────────────────────────────────────────────

function applyAgeRules(
  score: number,
  ageGroup: AgeGroup,
  ingredients: IngredientEntry[],
  nutrition: NutritionData | null,
  concerns: ProfileConcern[],
  positives: string[]
): number {

  // INFANT (0–2) — strictest rules of any age group
  if (ageGroup === 'INFANT_0_2') {
    const sodium = nutrition?.sodium_mg ?? 0;
    if (sodium > 100) {
      score -= 25;
      concerns.push({
        label: 'Salt Unsafe for Infants',
        detail: `${sodium}mg sodium per 100g. WHO recommends under 100mg for infants. Underdeveloped kidneys cannot process excess sodium.`,
        severity: 'HIGH',
        impact: -25,
        source: 'WHO Infant Feeding Guidelines 2023'
      });
    }

    const sugar = nutrition?.sugar_g ?? 0;
    if (sugar > 2) {
      score -= 25;
      concerns.push({
        label: 'Added Sugar Unsafe for Infants',
        detail: `${sugar}g sugar per 100g. WHO recommends zero added sugar for children under 2 years.`,
        severity: 'HIGH',
        impact: -25,
        source: 'WHO 2015 / ICMR-NIN 2024'
      });
    }

    const unsafeForInfants = ingredients.filter(i =>
      ['Preservative', 'Artificial Colour', 'Artificial Sweetener', 'Flavour Enhancer']
        .includes(i.function)
    );
    if (unsafeForInfants.length > 0) {
      score -= 20;
      concerns.push({
        label: 'Additives Unsafe for Infants',
        detail: `Contains ${unsafeForInfants.map(i => i.name).join(', ')}. Infants should not consume any artificial additives.`,
        severity: 'HIGH',
        impact: -20,
        source: 'ICMR-NIN 2024'
      });
    }
  }

  // YOUNG CHILD (3–7)
  if (ageGroup === 'CHILD_3_7') {
    const southamptonSix = ['ins 102', 'ins 104', 'ins 110', 'ins 122', 'ins 124', 'ins 129'];
    const found = ingredients.filter(i =>
      southamptonSix.some(code =>
        i.name.toLowerCase().replace(/\s/g, '').includes(code.replace(/\s/g, ''))
      )
    );
    if (found.length > 0) {
      score -= 18;
      concerns.push({
        label: '"Southampton Six" Colours Found',
        detail: `${found.map(i => i.name).join(', ')} — EU/UK mandate warning labels for these colours in children's products. Linked to hyperactivity.`,
        severity: 'HIGH',
        impact: -18,
        source: 'EFSA 2009 / UK FSA Southampton Study'
      });
    }

    const sugar = nutrition?.sugar_g ?? 0;
    if (sugar > 15) {
      score -= 15;
      concerns.push({
        label: 'Very High Sugar for Young Child',
        detail: `${sugar}g per 100g is very high for ages 3–7. WHO recommends children's sugar intake stay under 10% of daily calories.`,
        severity: 'HIGH',
        impact: -15,
        source: 'WHO 2015'
      });
    }
  }

  // CHILD (8–12)
  if (ageGroup === 'CHILD_8_12') {
    const artificialColours = ingredients.filter(i =>
      i.function === 'Artificial Colour'
    );
    if (artificialColours.length > 0) {
      score -= 10;
      concerns.push({
        label: 'Artificial Colours — Child Caution',
        detail: `${artificialColours.map(i => i.name).join(', ')} flagged for child consumption. European regulators require warning labels.`,
        severity: 'MODERATE',
        impact: -10,
        source: 'EFSA 2009'
      });
    }

    const hasCaffeine = ingredients.some(i =>
      ['coffee', 'caffeine', 'guarana'].some(c => i.name.toLowerCase().includes(c))
    );
    if (hasCaffeine) {
      score -= 15;
      concerns.push({
        label: 'Caffeine Not Recommended for Children',
        detail: 'Caffeine is not recommended for children under 12. Affects sleep and developing nervous system.',
        severity: 'HIGH',
        impact: -15,
        source: 'FSSAI / WHO'
      });
    }
  }

  // TEEN (13–17)
  if (ageGroup === 'TEEN_13_17') {
    const energy = nutrition?.energy_kcal ?? 0;
    const sugar = nutrition?.sugar_g ?? 0;
    if (sugar > 20) {
      score -= 8;
      concerns.push({
        label: 'High Sugar — Teen Health',
        detail: `${sugar}g sugar per 100g. High sugar intake in teens is linked to early onset insulin resistance in India.`,
        severity: 'MODERATE',
        impact: -8,
        source: 'ICMR-NIN 2024'
      });
    }
  }

  return score;
}

// ── SECTION 3: Health Condition Rules ────────────────────────────────────────

function applyConditionRules(
  score: number,
  conditions: HealthCondition[],
  ingredients: IngredientEntry[],
  nutrition: NutritionData | null,
  concerns: ProfileConcern[],
  positives: string[]
): number {

  // ── DIABETES ───────────────────────────────────────────────
  if (has(conditions, 'DIABETES_T1') || has(conditions, 'DIABETES_T2') ||
      has(conditions, 'PRE_DIABETES') || has(conditions, 'INSULIN_RESISTANCE')) {

    const sugar = nutrition?.sugar_g ?? 0;
    if (sugar > 10) {
      const d = -Math.min(20, Math.round((sugar - 10) * 1.5));
      score += d;
      concerns.push({
        label: 'High Sugar — Diabetes Risk',
        detail: `${sugar}g sugar per 100g (${(sugar / 4).toFixed(1)} teaspoons). ICMR-NIN recommends under 10g per 100g for diabetic-friendly products.`,
        severity: sugar > 20 ? 'HIGH' : 'MODERATE',
        impact: d,
        source: 'ICMR-NIN 2024'
      });
    } else if (sugar <= 5) {
      const d = 5;
      score += d;
      concerns.push({
        label: 'Low Sugar — Diabetes Match',
        detail: `Low sugar (${sugar}g/100g) — suitable for blood sugar management.`,
        severity: 'BENEFICIAL',
        impact: d,
        source: 'ICMR-NIN 2024'
      });
      positives.push(`Low sugar (${sugar}g/100g) — suitable for blood sugar management`);
    }

    // Hidden high-GI ingredients
    const hiddenGI = ingredients.filter(i =>
      ['maltodextrin', 'maltitol', 'glucose syrup', 'corn syrup', 'dextrose', 'sorbitol']
        .some(s => i.name.toLowerCase().includes(s))
    );
    if (hiddenGI.length > 0) {
      score -= 10;
      concerns.push({
        label: 'Hidden High-GI Sweeteners',
        detail: `${hiddenGI.map(i => i.name).join(', ')} spike blood sugar as fast as regular sugar — common in products labelled "diabetic-friendly".`,
        severity: 'HIGH',
        impact: -10,
        source: 'ICMR-NIN 2024'
      });
    }

    // Fibre is a positive for diabetics
    const fibre = nutrition?.fibre_g ?? 0;
    if (fibre > 5) {
      const d = 5;
      score += d;
      concerns.push({
        label: 'High Fibre — Diabetes Benefit',
        detail: `High fibre (${fibre}g/100g) — slows glucose absorption, beneficial for blood sugar management.`,
        severity: 'BENEFICIAL',
        impact: d,
        source: 'ICMR-NIN 2024'
      });
      positives.push(`High fibre (${fibre}g/100g) — slows glucose absorption, beneficial for blood sugar management`);
    }
  }

  // ── HYPERTENSION & HEART ───────────────────────────────────
  if (has(conditions, 'HYPERTENSION') || has(conditions, 'HEART_DISEASE') ||
      has(conditions, 'HEART_ATTACK_HISTORY') || has(conditions, 'HIGH_CHOLESTEROL')) {

    const sodium = nutrition?.sodium_mg ?? 0;
    const strictLimit = has(conditions, 'HEART_ATTACK_HISTORY') ? 400
      : has(conditions, 'HEART_DISEASE') ? 450 : 500;

    if (sodium > strictLimit) {
      const d = -Math.min(20, Math.round((sodium - strictLimit) / 50));
      score += d;
      concerns.push({
        label: 'High Sodium — Blood Pressure Risk',
        detail: `${sodium}mg sodium per 100g. ICMR-NIN recommends hypertensive patients limit total daily sodium to 1500mg. This product alone uses ${Math.round((sodium / 1500) * 100)}% of that.`,
        severity: sodium > 800 ? 'HIGH' : 'MODERATE',
        impact: d,
        source: 'ICMR-NIN 2024 / WHO'
      });
    } else if (sodium < 100) {
      const d = 6;
      score += d;
      concerns.push({
        label: 'Low Sodium — Heart Friendly',
        detail: `Low sodium (${sodium}mg) is excellent for managing blood pressure.`,
        severity: 'BENEFICIAL',
        impact: d,
        source: 'ICMR-NIN 2024'
      });
      positives.push(`Low sodium (${sodium}mg) — excellent for managing blood pressure`);
    }

    const transFat = nutrition?.trans_fat_g ?? 0;
    if (transFat > 0.2) {
      const d = has(conditions, 'HEART_DISEASE') || has(conditions, 'HEART_ATTACK_HISTORY') ? -20 : -12;
      score += d;
      concerns.push({
        label: 'Trans Fat — Heart Risk',
        detail: `${transFat}g trans fat. WHO recommends zero trans fat. Raises bad cholesterol (LDL) and lowers good cholesterol (HDL).`,
        severity: 'HIGH',
        impact: d,
        source: 'WHO REPLACE Initiative / ICMR-NIN 2024'
      });
    }

    const saturatedFat = nutrition?.saturated_fat_g ?? 0;
    if (saturatedFat > 5 &&
        (has(conditions, 'HEART_DISEASE') || has(conditions, 'HEART_ATTACK_HISTORY'))) {
      score -= 10;
      concerns.push({
        label: 'High Saturated Fat — Heart Concern',
        detail: `${saturatedFat}g saturated fat per 100g. Increases LDL cholesterol — particularly risky with heart disease history.`,
        severity: 'HIGH',
        impact: -10,
        source: 'ICMR-NIN 2024'
      });
    }
  }

  // ── THYROID ────────────────────────────────────────────────
  if (has(conditions, 'THYROID_HYPO') || has(conditions, 'THYROID_HYPER')) {
    const soyPresent = ingredients.some(i =>
      ['soy', 'soya', 'soybean', 'tofu', 'soy lecithin', 'soy protein']
        .some(s => i.name.toLowerCase().includes(s))
    );
    if (soyPresent) {
      score -= 8;
      concerns.push({
        label: 'Soy — Thyroid Medication Interaction',
        detail: 'Soy can interfere with thyroid medication (levothyroxine) absorption. Take medication at least 4 hours away from soy-containing foods.',
        severity: 'MODERATE',
        impact: -8,
        source: 'ICMR-NIN 2024 / Endocrine Society'
      });
    }
  }

  // ── PCOD / PCOS ────────────────────────────────────────────
  if (has(conditions, 'PCOD_PCOS')) {
    const sugar = nutrition?.sugar_g ?? 0;
    if (sugar > 10) {
      score -= 10;
      concerns.push({
        label: 'High Sugar — PCOS Concern',
        detail: 'High sugar worsens insulin resistance in PCOS, amplifying hormonal imbalance. Low-glycaemic diet strongly recommended.',
        severity: 'HIGH',
        impact: -10,
        source: 'ICMR-NIN 2024'
      });
    }
    const refinedCarbs = ingredients.some(i =>
      ['maida', 'refined wheat flour', 'cornstarch', 'white rice flour']
        .some(c => i.name.toLowerCase().includes(c))
    );
    if (refinedCarbs) {
      score -= 6;
      concerns.push({
        label: 'Refined Carbs — PCOS Note',
        detail: 'Refined carbs spike insulin rapidly — key driver of PCOS symptoms. Whole grain alternatives are preferable.',
        severity: 'LOW',
        impact: -6,
        source: 'ICMR-NIN 2024'
      });
    }
  }

  // ── PREGNANCY ──────────────────────────────────────────────
  if (has(conditions, 'PREGNANCY_T1') || has(conditions, 'PREGNANCY_T2') ||
      has(conditions, 'PREGNANCY_T3')) {

    const trimester = has(conditions, 'PREGNANCY_T1') ? 1
      : has(conditions, 'PREGNANCY_T2') ? 2 : 3;

    const hasAspartame = ingredients.some(i =>
      ['ins 951', 'aspartame', 'nutrasweet'].some(s => i.name.toLowerCase().includes(s))
    );
    if (hasAspartame) {
      score -= 20;
      concerns.push({
        label: '⚠ Aspartame — Pregnancy Caution',
        detail: 'WHO IARC classified aspartame as "possibly carcinogenic" in 2023. Precautionary avoidance during pregnancy is advised.',
        severity: 'HIGH',
        impact: -20,
        source: 'IARC/WHO 2023'
      });
    }

    const hasNitrites = ingredients.some(i =>
      ['ins 250', 'ins 251', 'sodium nitrite', 'potassium nitrite']
        .some(s => i.name.toLowerCase().includes(s))
    );
    if (hasNitrites) {
      score -= 30;
      concerns.push({
        label: '⚠ Nitrites — Pregnancy Danger',
        detail: 'Sodium nitrite forms nitrosamines (known carcinogens) and can cross the placenta. Avoid processed meats during pregnancy.',
        severity: 'HIGH',
        impact: -30,
        source: 'ICMR-NIN 2024'
      });
    }

    if (trimester === 3) {
      const sodium = nutrition?.sodium_mg ?? 0;
      if (sodium > 600) {
        score -= 10;
        concerns.push({
          label: 'High Sodium — Third Trimester',
          detail: 'High sodium in third trimester can worsen pregnancy-induced hypertension and swelling.',
          severity: 'MODERATE',
          impact: -10,
          source: 'ICMR-NIN 2024'
        });
      }
    }
  }

  // ── KIDNEY DISEASE ─────────────────────────────────────────
  if (has(conditions, 'KIDNEY_DISEASE_CKD')) {
    const sodium = nutrition?.sodium_mg ?? 0;
    if (sodium > 300) {
      const d = -Math.min(25, Math.round((sodium - 300) / 40));
      score += d;
      concerns.push({
        label: 'Sodium — Kidney Disease Risk',
        detail: `${sodium}mg sodium per 100g. Damaged kidneys cannot efficiently excrete sodium. Strict restriction required.`,
        severity: 'HIGH',
        impact: d,
        source: 'ICMR-NIN 2024'
      });
    }

    const hasPhosphates = ingredients.some(i =>
      ['phosphate', 'ins 450', 'ins 451', 'ins 452', 'diphosphate', 'polyphosphate']
        .some(s => i.name.toLowerCase().includes(s))
    );
    if (hasPhosphates) {
      score -= 15;
      concerns.push({
        label: 'Phosphate Additives — Kidney Danger',
        detail: 'Phosphates are poorly filtered by damaged kidneys and cause bone disease in CKD patients.',
        severity: 'HIGH',
        impact: -15,
        source: 'ICMR-NIN 2024'
      });
    }

    const protein = nutrition?.protein_g ?? 0;
    if (protein > 15) {
      score -= 10;
      concerns.push({
        label: 'High Protein — Kidney Strain',
        detail: `${protein}g protein per 100g increases kidney workload. CKD patients typically need protein restriction.`,
        severity: 'MODERATE',
        impact: -10,
        source: 'ICMR-NIN 2024'
      });
    }
  }

  // ── ASTHMA ─────────────────────────────────────────────────
  if (has(conditions, 'ASTHMA')) {
    const hasSulphites = ingredients.some(i =>
      ['ins 220', 'ins 221', 'ins 222', 'ins 223', 'ins 224', 'sulphite', 'sulphur dioxide']
        .some(s => i.name.toLowerCase().includes(s))
    );
    if (hasSulphites) {
      score -= 20;
      concerns.push({
        label: '⚠ Sulphites — Asthma Trigger',
        detail: 'Sulphites are known asthma triggers. FSSAI mandates declaration on labels. Avoid if asthmatic.',
        severity: 'HIGH',
        impact: -20,
        source: 'FSSAI Food Safety Regulations 2011'
      });
    }

    const hasBenzoate = ingredients.some(i =>
      ['ins 211', 'sodium benzoate', 'benzoic acid', 'ins 210']
        .some(s => i.name.toLowerCase().includes(s))
    );
    if (hasBenzoate) {
      score -= 10;
      concerns.push({
        label: 'Benzoate — Asthma Note',
        detail: 'Sodium benzoate may trigger or worsen asthma and urticaria in sensitive individuals.',
        severity: 'MODERATE',
        impact: -10,
        source: 'ICMR-NIN 2024'
      });
    }
  }

  // ── GOUT / URIC ACID ───────────────────────────────────────
  if (has(conditions, 'URIC_ACID_GOUT')) {
    const hasPurines = ingredients.some(i =>
      ['ins 627', 'ins 631', 'disodium guanylate', 'disodium inosinate', 'yeast extract']
        .some(s => i.name.toLowerCase().includes(s))
    );
    if (hasPurines) {
      score -= 15;
      concerns.push({
        label: 'Purines — Gout Risk',
        detail: 'INS 627 and 631 are purine-based flavour enhancers that can trigger gout attacks. Hidden in most Indian chips and instant snacks.',
        severity: 'HIGH',
        impact: -15,
        source: 'ICMR-NIN 2024'
      });
    }
  }

  // ── ADHD ───────────────────────────────────────────────────
  if (has(conditions, 'ADHD')) {
    const southamptonSix = ['ins 102', 'ins 104', 'ins 110', 'ins 122', 'ins 124', 'ins 129'];
    const found = ingredients.filter(i =>
      southamptonSix.some(s =>
        i.name.toLowerCase().replace(/\s/g, '').includes(s.replace(/\s/g, ''))
      )
    );
    if (found.length > 0) {
      score -= 20;
      concerns.push({
        label: '⚠ ADHD — Hyperactivity Colours Found',
        detail: `${found.map(i => i.name).join(', ')} — directly linked to worsening ADHD symptoms. EU mandates warning labels. Strictly avoid.`,
        severity: 'HIGH',
        impact: -20,
        source: 'EFSA 2009 / Lancet 2007 Southampton Study'
      });
    }
  }

  // ── IBS / GUT ──────────────────────────────────────────────
  if (has(conditions, 'GUT_IBS')) {
    const hasCarrageenan = ingredients.some(i =>
      ['ins 407', 'carrageenan'].some(s => i.name.toLowerCase().includes(s))
    );
    if (hasCarrageenan) {
      score -= 10;
      concerns.push({
        label: 'Carrageenan — IBS Concern',
        detail: 'Animal studies link carrageenan to intestinal inflammation. People with IBS should be cautious.',
        severity: 'MODERATE',
        impact: -10,
        source: 'ICMR-NIN 2024'
      });
    }
  }

  // ── FATTY LIVER ────────────────────────────────────────────
  if (has(conditions, 'FATTY_LIVER')) {
    const sugar = nutrition?.sugar_g ?? 0;
    const hasHFCS = ingredients.some(i =>
      ['high fructose corn syrup', 'hfcs', 'corn syrup', 'fructose syrup']
        .some(s => i.name.toLowerCase().includes(s))
    );
    if (hasHFCS) {
      score -= 15;
      concerns.push({
        label: 'High Fructose — Fatty Liver Risk',
        detail: 'High fructose corn syrup goes directly to the liver for processing and is a leading driver of fatty liver disease.',
        severity: 'HIGH',
        impact: -15,
        source: 'ICMR-NIN 2024'
      });
    }
    if (sugar > 15) {
      score -= 8;
      concerns.push({
        label: 'High Sugar — Fatty Liver Concern',
        detail: `${sugar}g sugar per 100g. Excess sugar consumption is a primary cause of non-alcoholic fatty liver disease.`,
        severity: 'MODERATE',
        impact: -8,
        source: 'ICMR-NIN 2024'
      });
    }
  }

  // ── MUSCLE GAIN ────────────────────────────────────────────
  if (has(conditions, 'MUSCLE_GAIN')) {
    const protein = nutrition?.protein_g ?? 0;
    if (protein >= 20) {
      const d = 10; score += d;
      concerns.push({
        label: 'High Protein — Muscle Gain',
        detail: `Excellent protein source (${protein}g/100g) for your muscle building goal.`,
        severity: 'BENEFICIAL',
        impact: d,
        source: 'ICMR-NIN 2024'
      });
      positives.push(`High protein (${protein}g/100g) — excellent for muscle building`);
    } else if (protein >= 12) {
      const d = 5; score += d;
      concerns.push({
        label: 'Good Protein — Muscle Gain',
        detail: `Good protein content (${protein}g/100g) supporting muscle maintenance.`,
        severity: 'BENEFICIAL',
        impact: d,
        source: 'ICMR-NIN 2024'
      });
      positives.push(`Good protein content (${protein}g/100g)`);
    } else if (protein < 5) {
      score -= 5;
      concerns.push({
        label: 'Low Protein',
        detail: `Only ${protein}g protein per 100g. Low for muscle building goals.`,
        severity: 'LOW',
        impact: -5,
        source: 'ICMR-NIN 2024'
      });
    }
    const transFat = nutrition?.trans_fat_g ?? 0;
    if (transFat > 0.5) {
      score -= 10;
      concerns.push({
        label: 'Trans Fat — Fitness Concern',
        detail: 'Trans fat interferes with muscle recovery and increases systemic inflammation.',
        severity: 'HIGH',
        impact: -10,
        source: 'ICMR-NIN 2024'
      });
    }
  }

  // ── WEIGHT LOSS ────────────────────────────────────────────
  if (has(conditions, 'WEIGHT_LOSS')) {
    const energy = nutrition?.energy_kcal ?? 0;
    const sugar = nutrition?.sugar_g ?? 0;
    const fibre = nutrition?.fibre_g ?? 0;

    if (energy > 400) {
      score -= 6;
      concerns.push({
        label: 'High Calorie Density',
        detail: `${energy} kcal per 100g — calorie-dense products make portion control harder.`,
        severity: 'MODERATE',
        impact: -6,
        source: 'ICMR-NIN 2024'
      });
    }
    if (sugar > 15) {
      score -= 8;
      concerns.push({
        label: 'High Sugar — Weight Loss Note',
        detail: `${sugar}g sugar spikes insulin, promotes fat storage, and increases hunger soon after.`,
        severity: 'MODERATE',
        impact: -8,
        source: 'ICMR-NIN 2024'
      });
    }
    if (fibre > 5) {
      const d = 5; score += d;
      concerns.push({
        label: 'High Fibre — Weight Loss',
        detail: `High fibre (${fibre}g/100g) promotes satiety and helps with weight management.`,
        severity: 'BENEFICIAL',
        impact: d,
        source: 'ICMR-NIN 2024'
      });
      positives.push(`High fibre (${fibre}g/100g) — promotes satiety, helps weight management`);
    }
  }

  return score;
}

function applyHealthGoalRules(
  score: number,
  goals: HealthGoal[],
  ingredients: IngredientEntry[],
  nutrition: NutritionData | null,
  concerns: ProfileConcern[],
  positives: string[]
): number {
  if (!goals || goals.length === 0) return score;

  goals.forEach(goal => {
    if (!goal || goal === 'NONE') return;

    const sugar = nutrition?.sugar_g ?? 0;
    const protein = nutrition?.protein_g ?? 0;
    const sodium = nutrition?.sodium_mg ?? 0;
    const energy = nutrition?.energy_kcal ?? 0;
    const fibre = nutrition?.fibre_g ?? 0;
    const transFat = nutrition?.trans_fat_g ?? 0;

    switch (goal) {
      case 'LOW_SUGAR':
        if (sugar > 10) {
          score -= 20; // Double penalty
          concerns.push({
            label: 'High Sugar — Goal Conflict',
            detail: `${sugar}g sugar is very high for your Low Sugar goal.`,
            severity: 'HIGH',
            impact: -20,
            source: 'User Goal'
          });
        } else if (sugar <= 5) {
          const d = 5;
          score += d;
          concerns.push({
            label: 'Low Sugar — Goal Match',
            detail: 'Low sugar content aligns perfectly with your health goal.',
            severity: 'BENEFICIAL',
            impact: d,
            source: 'User Goal'
          });
          positives.push('Low sugar content — matches your goal');
        }
        const hiddenGI = ingredients.filter(i =>
          ['maltodextrin', 'corn syrup', 'glucose syrup', 'dextrose'].some(s => i.name.toLowerCase().includes(s))
        );
        if (hiddenGI.length > 0) {
          score -= 10;
          concerns.push({
            label: 'High GI Additives',
            detail: `Contains ${hiddenGI.map(i => i.name).join(', ')} which spike blood sugar rapidly.`,
            severity: 'HIGH',
            impact: -10,
            source: 'User Goal'
          });
        }
        break;

      case 'HIGH_PROTEIN':
        if (protein > 25) {
          const d = 12; score += d;
          concerns.push({
            label: 'Excellent Protein — Goal Match',
            detail: `Excellent protein source (${protein}g) for your high protein goal.`,
            severity: 'BENEFICIAL',
            impact: d,
            source: 'User Goal'
          });
          positives.push(`Excellent protein source (${protein}g)`);
        } else if (protein > 15) {
          const d = 8; score += d;
          concerns.push({
            label: 'Good Protein — Goal Match',
            detail: `Good protein source (${protein}g) for your high protein goal.`,
            severity: 'BENEFICIAL',
            impact: d,
            source: 'User Goal'
          });
          positives.push(`Good protein source (${protein}g)`);
        }
        break;

      case 'WEIGHT_LOSS':
        if (energy > 350) {
          score -= 8;
          concerns.push({
            label: 'High Calorie Density',
            detail: `${energy} kcal is high for weight loss goals.`,
            severity: 'MODERATE',
            impact: -8,
            source: 'User Goal'
          });
        }
        if (fibre > 5) {
          const d = 8; score += d;
          concerns.push({
            label: 'High Fibre — Goal Match',
            detail: 'High fibre content aids satiety, supporting your weight loss goal.',
            severity: 'BENEFICIAL',
            impact: d,
            source: 'User Goal'
          });
          positives.push('High fibre content — aids satiety for weight loss');
        }
        break;

      case 'MUSCLE_GAIN':
        if (protein > 20) {
          const d = 10; score += d;
          concerns.push({
            label: 'High Protein — Goal Match',
            detail: 'High protein content is ideal for your muscle gain goal.',
            severity: 'BENEFICIAL',
            impact: d,
            source: 'User Goal'
          });
          positives.push('High protein — ideal for muscle gain');
        }
        if (transFat > 0.5) {
          score -= 12;
          concerns.push({
            label: 'Trans Fat — Muscle Gain Conflict',
            detail: 'Trans fats increase inflammation and hinder muscle recovery.',
            severity: 'HIGH',
            impact: -12,
            source: 'User Goal'
          });
        }
        break;

      case 'LOW_SODIUM':
        if (sodium > 400) {
          score -= 10;
          concerns.push({
            label: 'High Sodium — Goal Conflict',
            detail: `${sodium}mg sodium is high for your Low Sodium goal.`,
            severity: 'HIGH',
            impact: -10,
            source: 'User Goal'
          });
        }
        break;

      case 'HIGH_FIBRE':
        if (fibre > 6) {
          const d = 10;
          score += d;
          concerns.push({
            label: 'Excellent Fibre — Goal Match',
            detail: `Excellent fibre source (${fibre}g) matches your high fibre goal.`,
            severity: 'BENEFICIAL',
            impact: d,
            source: 'User Goal'
          });
          positives.push('Excellent fibre source — matches your goal');
        } else if (fibre < 2) {
          score -= 5;
          concerns.push({
            label: 'Low Fibre',
            detail: 'This product is low in fibre.',
            severity: 'LOW',
            impact: -5,
            source: 'User Goal'
          });
        }
        const maidaInTop = ingredients.slice(0, 3).some(i => i?.name && (i.name.toLowerCase().includes('maida') || i.name.toLowerCase().includes('refined wheat')));
        if (maidaInTop) {
          score -= 8;
          concerns.push({
            label: 'Refined Flour Base',
            detail: 'Main ingredient is refined flour, which is low in natural fibre.',
            severity: 'MODERATE',
            impact: -8,
            source: 'User Goal'
          });
        }
        break;

      case 'ENDURANCE':
        if (sodium > 200) {
          const d = 3;
          score += d;
          concerns.push({
            label: 'Electrolytes — Endurance Match',
            detail: 'Contains electrolytes (sodium) — beneficial for endurance.',
            severity: 'BENEFICIAL',
            impact: d,
            source: 'User Goal'
          });
          positives.push('Contains electrolytes (sodium) — beneficial for endurance');
        }
        break;
    }
  });

  return score;
}

// ── SECTION 4: Gender Rules ───────────────────────────────────────────────────
// Gender + age + activity interact. All three considered together.

function applyGenderRules(
  score: number,
  gender: Gender,
  ageGroup: AgeGroup,
  activityLevel: ActivityLevel,
  conditions: HealthCondition[],
  ingredients: IngredientEntry[],       // ← correctly passed in now
  nutrition: NutritionData | null,
  concerns: ProfileConcern[],
  positives: string[]
): number {

  const protein = nutrition?.protein_g ?? 0;
  const energy = nutrition?.energy_kcal ?? 0;
  const sugar = nutrition?.sugar_g ?? 0;
  const saturatedFat = nutrition?.saturated_fat_g ?? 0;

  const reproductiveAge = ['TEEN_13_17', 'YOUNG_ADULT_18_25', 'ADULT_26_45']
    .includes(ageGroup);
  const isVeryActive = activityLevel === 'VERY_ACTIVE' || activityLevel === 'ATHLETE';
  const isYoungActive = ['YOUNG_ADULT_18_25', 'ADULT_26_45'].includes(ageGroup) && isVeryActive;

  // ── FEMALE ──────────────────────────────────────────────────
  if (gender === 'FEMALE') {

    // Reproductive age + very active = higher iron need
    if (reproductiveAge && isVeryActive) {
      const ironInhibitors = ingredients.filter(i =>
        ['tannin', 'phytic acid', 'calcium carbonate', 'ins 170', 'calcium phosphate']
          .some(s => i.name.toLowerCase().includes(s))
      );
      if (ironInhibitors.length > 0) {
        concerns.push({
          label: 'Iron Absorption — Active Women',
          detail: `${ironInhibitors.map(i => i.name).join(', ')} can reduce iron absorption. Active women aged 13–45 have higher iron needs due to menstruation.`,
          severity: 'LOW',
          impact: 0,
          source: 'ICMR-NIN 2024'
        });
      }
      // High protein is more impactful for active females
      if (protein > 15) {
        const d = 3;
        score += d;
        concerns.push({
          label: 'High Protein — Active Female',
          detail: `High protein (${protein}g/100g) — supports muscle recovery for active women.`,
          severity: 'BENEFICIAL',
          impact: d,
          source: 'ICMR-NIN 2024'
        });
        positives.push(
          `High protein (${protein}g/100g) — supports muscle recovery for active women`
        );
      }
    }

    // PCOD + active = protein is a bigger positive
    if (has(conditions, 'PCOD_PCOS') && isVeryActive && protein > 12) {
      const d = 4;
      score += d;
      concerns.push({
        label: 'Protein — PCOD Management',
        detail: 'Protein supports muscle building — beneficial for PCOD management with active lifestyle.',
        severity: 'BENEFICIAL',
        impact: d,
        source: 'ICMR-NIN 2024'
      });
      positives.push(
        `Protein supports muscle building — beneficial for PCOD management with active lifestyle`
      );
    }

    // Post-menopausal or osteoporosis — calcium matters
    if (ageGroup === 'SENIOR_61_PLUS' ||
        has(conditions, 'MENOPAUSE') ||
        has(conditions, 'OSTEOPOROSIS')) {
      const hasCalcium = ingredients.some(i =>
        ['calcium', 'milk', 'dairy', 'paneer', 'curd', 'yogurt', 'cheese']
          .some(s => i.name.toLowerCase().includes(s))
      );
      if (hasCalcium) {
        const d = 3;
        score += d;
        concerns.push({
          label: 'Calcium — Bone Health',
          detail: 'Contains calcium — important for bone health in women 50+.',
          severity: 'BENEFICIAL',
          impact: d,
          source: 'ICMR-NIN 2024'
        });
        positives.push('Contains calcium — important for bone health in women 50+');
      }
    }

    // Senior sedentary female — high calorie density is a concern
    if (ageGroup === 'SENIOR_61_PLUS' && activityLevel === 'SEDENTARY') {
      if (energy > 350) {
        score -= 5;
        concerns.push({
          label: 'Calorie Density — Senior Women Note',
          detail: `${energy} kcal/100g is high for a sedentary senior woman. Metabolic rate decreases significantly after 60.`,
          severity: 'LOW',
          impact: -5,
          source: 'ICMR-NIN 2024'
        });
      }
    }
  }

  // ── MALE ────────────────────────────────────────────────────
  if (gender === 'MALE') {

    // Young active male — higher calorie and protein tolerance
    if (isYoungActive) {
      if (energy > 400) {
        const d = 4;
        score += d; // offset sedentary penalty — active males need calories
        concerns.push({
          label: 'Energy Density — Active Male',
          detail: `High energy density (${energy} kcal/100g) — suits your active lifestyle.`,
          severity: 'BENEFICIAL',
          impact: d,
          source: 'ICMR-NIN 2024'
        });
        positives.push(
          `High energy density (${energy} kcal/100g) — suits your active lifestyle`
        );
      }
      if (protein > 20) {
        const d = 8;
        score += d;
        concerns.push({
          label: 'High Protein — Active Male',
          detail: `High protein (${protein}g/100g) — excellent for muscle building.`,
          severity: 'BENEFICIAL',
          impact: d,
          source: 'ICMR-NIN 2024'
        });
        positives.push(
          `High protein (${protein}g/100g) — excellent for muscle building`
        );
      } else if (protein > 15) {
        const d = 4;
        score += d;
        concerns.push({
          label: 'Good Protein — Active Male',
          detail: `Good protein (${protein}g/100g) for your activity level.`,
          severity: 'BENEFICIAL',
          impact: d,
          source: 'ICMR-NIN 2024'
        });
        positives.push(`Good protein (${protein}g/100g) for your activity level`);
      }
    }

    // Middle-aged sedentary male — highest cardiovascular risk group in India
    if (ageGroup === 'ADULT_46_60' && activityLevel === 'SEDENTARY') {
      if (saturatedFat > 5) {
        score -= 8;
        concerns.push({
          label: 'Saturated Fat — High Risk Profile',
          detail: `Sedentary men aged 46–60 are the highest risk group for cardiovascular disease in India. ${saturatedFat}g saturated fat per 100g warrants caution.`,
          severity: 'HIGH',
          impact: -8,
          source: 'ICMR-NIN 2024'
        });
      }
      if (sugar > 15) {
        score -= 6;
        concerns.push({
          label: 'High Sugar — Metabolic Syndrome Risk',
          detail: `High sugar + sedentary lifestyle + middle age is the primary pattern for Type 2 diabetes onset in Indian men.`,
          severity: 'MODERATE',
          impact: -6,
          source: 'ICMR-NIN 2024'
        });
      }
    }

    // Senior male — prostate and kidney considerations
    if (ageGroup === 'SENIOR_61_PLUS') {
      const sodium = nutrition?.sodium_mg ?? 0;
      if (sodium > 600) {
        score -= 6;
        concerns.push({
          label: 'Sodium — Senior Male Concern',
          detail: `${sodium}mg sodium. Senior men are at higher risk for hypertension and kidney strain from high sodium intake.`,
          severity: 'MODERATE',
          impact: -6,
          source: 'ICMR-NIN 2024'
        });
      }
    }
  }

  return score;
}

// ── SECTION 5: Activity Rules ─────────────────────────────────────────────────

function applyActivityRules(
  score: number,
  activityLevel: ActivityLevel,
  gender: Gender,
  nutrition: NutritionData | null,
  concerns: ProfileConcern[],
  positives: string[]
): number {

  const energy = nutrition?.energy_kcal ?? 0;
  const sugar = nutrition?.sugar_g ?? 0;
  const protein = nutrition?.protein_g ?? 0;

  if (activityLevel === 'SEDENTARY') {
    if (energy > 300) {
      score -= 8;
      concerns.push({
        label: 'Calorie Density — Sedentary Note',
        detail: `${energy} kcal/100g is high for a sedentary lifestyle. Excess calories with low activity leads to fat accumulation.`,
        severity: 'LOW',
        impact: -8,
        source: 'ICMR-NIN 2024'
      });
    }
    if (sugar > 20) {
      score -= 5;
      concerns.push({
        label: 'High Sugar + Sedentary Lifestyle',
        detail: 'High sugar with low activity significantly elevates risk of insulin resistance over time.',
        severity: 'MODERATE',
        impact: -5,
        source: 'ICMR-NIN 2024'
      });
    }
  }

  if (activityLevel === 'VERY_ACTIVE' || activityLevel === 'ATHLETE') {
    if (protein > 15) {
      const d = 4;
      score += d;
      concerns.push({
        label: 'Good Protein — Active Lifestyle',
        detail: `Good protein (${protein}g/100g) supports your active lifestyle.`,
        severity: 'BENEFICIAL',
        impact: d,
        source: 'ICMR-NIN 2024'
      });
      positives.push(`Good protein (${protein}g/100g) supports your active lifestyle`);
    }
    // Moderate sugar is a positive for athletes (energy)
    if (sugar >= 8 && sugar <= 20) {
      const d = 3;
      score += d;
      concerns.push({
        label: 'Moderate Carbs — Energy Support',
        detail: 'Moderate carbs can support pre/post-workout energy.',
        severity: 'BENEFICIAL',
        impact: d,
        source: 'ICMR-NIN 2024'
      });
      positives.push(`Moderate carbs can support pre/post-workout energy`);
    }
  }

  if (activityLevel === 'ATHLETE') {
    if (protein > 25) {
      const d = 5;
      score += d;
      concerns.push({
        label: 'Very High Protein — Athlete',
        detail: `Very high protein (${protein}g/100g) — excellent for high-performance training.`,
        severity: 'BENEFICIAL',
        impact: d,
        source: 'ICMR-NIN 2024'
      });
      positives.push(`Very high protein (${protein}g/100g) — excellent for high-performance training`);
    }
    // Electrolytes matter for athletes
    const hasSodium = (nutrition?.sodium_mg ?? 0) > 200;
    if (hasSodium) {
      const d = 2;
      score += d;
      concerns.push({
        label: 'Electrolytes — Athlete Support',
        detail: 'Contains sodium — useful for electrolyte replenishment post-training.',
        severity: 'BENEFICIAL',
        impact: d,
        source: 'ICMR-NIN 2024'
      });
      positives.push('Contains sodium — useful for electrolyte replenishment post-training');
    }
  }

  return score;
}

// ── SECTION 6: Position-Aware Ingredient Rules ───────────────────────────────
// Ingredients are listed in descending order by weight on every Indian pack.
// If sugar, palm oil, maida or salt is in the top 3 positions, it's a MAJOR
// component of the product — amplify deductions for relevant profiles.

function applyPositionAwareRules(
  conditions: HealthCondition[],
  ingredients: IngredientEntry[],
  concerns: ProfileConcern[]
): void {
  const top3 = ingredients.slice(0, 3);
  const ordinals = ['#1', '#2', '#3'];

  top3.forEach((ing, idx) => {
    const name = (ing.name || '').toLowerCase();
    const ord = ordinals[idx];

    // ── SUGAR as major ingredient ──────────────────────────
    const isSugar = ['sugar', 'sucrose', 'glucose syrup', 'corn syrup',
                     'fructose', 'invert sugar syrup', 'invert sugar'].some(kw => name.includes(kw));
    if (isSugar) {
      if (has(conditions, 'DIABETES_T1') || has(conditions, 'DIABETES_T2') ||
          has(conditions, 'PRE_DIABETES') || has(conditions, 'INSULIN_RESISTANCE')) {
        concerns.push({
          label: `⚠ Sugar is ${ord} Ingredient — Diabetes`,
          detail: `Sugar is the ${ord} ingredient by weight — a large proportion of this product IS sugar. This is incompatible with blood sugar management. Avoid.`,
          severity: 'HIGH',
          impact: -10,
          source: 'ICMR-NIN 2024'
        });
      } else if (has(conditions, 'OBESITY') || has(conditions, 'WEIGHT_LOSS') ||
                 has(conditions, 'PCOD_PCOS') || has(conditions, 'FATTY_LIVER')) {
        concerns.push({
          label: `Sugar is ${ord} Ingredient — Your Goal`,
          detail: `Sugar is the ${ord} ingredient by weight. The majority of this product is sugar — not compatible with your health goals.`,
          severity: 'HIGH',
          impact: -8,
          source: 'ICMR-NIN 2024'
        });
      }
    }

    // ── PALM OIL as major ingredient ───────────────────────
    const isPalmOil = ['palm oil', 'palm fat', 'palm kernel', 'vegetable oil (palm)',
                       'edible vegetable oil (palm)'].some(kw => name.includes(kw));
    if (isPalmOil && (has(conditions, 'HEART_DISEASE') || has(conditions, 'HEART_ATTACK_HISTORY') ||
                      has(conditions, 'HIGH_CHOLESTEROL'))) {
      concerns.push({
        label: `⚠ Palm Oil is ${ord} Ingredient — Heart Risk`,
        detail: `Palm oil is the ${ord} ingredient — a massive source of saturated fat. A serious concern for your cardiovascular condition. Limit or avoid.`,
        severity: 'HIGH',
        impact: -10,
        source: 'ICMR-NIN 2024 / WHO'
      });
    }

    // ── MAIDA / REFINED FLOUR as major ingredient ──────────
    const isMaida = ['maida', 'refined wheat flour', 'refined flour',
                     'all purpose flour'].some(kw => name.includes(kw));
    if (isMaida && (has(conditions, 'DIABETES_T1') || has(conditions, 'DIABETES_T2') ||
                    has(conditions, 'PRE_DIABETES') || has(conditions, 'INSULIN_RESISTANCE'))) {
      concerns.push({
        label: `Maida is ${ord} Ingredient — Blood Sugar`,
        detail: `Refined flour (maida) is the ${ord} ingredient — acts like sugar in the body, causing rapid blood glucose spikes. Equivalent to eating refined sugar for diabetics.`,
        severity: 'HIGH',
        impact: -8,
        source: 'ICMR-NIN 2024'
      });
    }

    // ── SALT as major ingredient ────────────────────────────
    const isSalt = ['iodised salt', 'sodium chloride', 'salt'].some(kw => name.includes(kw));
    if (isSalt && (has(conditions, 'HYPERTENSION') || has(conditions, 'HEART_DISEASE') ||
                   has(conditions, 'HEART_ATTACK_HISTORY') || has(conditions, 'KIDNEY_DISEASE_CKD'))) {
      concerns.push({
        label: `⚠ Salt is ${ord} Ingredient — Critical`,
        detail: `Salt appears in the top ingredients by weight — meaning extremely high sodium. For your condition, this product should be strictly avoided.`,
        severity: 'HIGH',
        impact: -12,
        source: 'ICMR-NIN 2024'
      });
    }

    // ── MALTODEXTRIN as major ingredient ───────────────────
    const isMaltodextrin = name.includes('maltodextrin') || name.includes('modified starch');
    if (isMaltodextrin && (has(conditions, 'DIABETES_T1') || has(conditions, 'DIABETES_T2') ||
                           has(conditions, 'PRE_DIABETES') || has(conditions, 'INSULIN_RESISTANCE'))) {
      concerns.push({
        label: `Maltodextrin is ${ord} Ingredient — High GI Concern`,
        detail: `Maltodextrin is the ${ord} ingredient — it has a higher glycaemic index than table sugar. A primary filler in this product that directly spikes blood glucose.`,
        severity: 'HIGH',
        impact: -8,
        source: 'ICMR-NIN 2024'
      });
    }
  });
}

// ── SECTION 7: Skin Condition Rules (COSMETIC / PERSONAL_CARE only) ───────────

function applySkinConditionRules(
  score: number,
  conditions: HealthCondition[],
  ingredients: IngredientEntry[],
  concerns: ProfileConcern[],
  positives: string[]
): number {

  const ingNames = ingredients.map(i => i.name.toLowerCase());
  const hasAny = (keywords: string[]) => ingNames.some(n => keywords.some(kw => n.includes(kw)));

  // ── ACNE-PRONE ────────────────────────────────────────────────
  if (has(conditions, 'ACNE_PRONE')) {
    const comedogenic = ingredients.filter(i => {
      const n = i.name.toLowerCase();
      return ['coconut oil', 'isopropyl myristate', 'isopropyl palmitate', 'wheat germ oil',
              'cocoa butter', 'flaxseed oil', 'linseed oil'].some(kw => n.includes(kw));
    });
    if (comedogenic.length > 0) {
      const d = -10; score += d;
      concerns.push({
        label: 'Comedogenic Ingredients — Acne Risk',
        detail: `${comedogenic.map(i => i.name).join(', ')} can clog pores and trigger breakouts for acne-prone skin. Best avoided.`,
        severity: 'HIGH',
        impact: d,
        source: 'Dermatology Research & Practice / IJDVL'
      });
    }

    // Silicones — film-forming, can trap bacteria
    const heavySilicones = ingredients.filter(i => {
      const n = i.name.toLowerCase();
      return ['dimethicone', 'cyclopentasiloxane', 'cyclohexasiloxane', 'trimethicone'].some(kw => n.includes(kw));
    });
    if (heavySilicones.length > 0) {
      score -= 5;
      concerns.push({
        label: 'Heavy Silicones — Pore Clogging Note',
        detail: `${heavySilicones.map(i => i.name).join(', ')} can form an occlusive film that traps sebum and bacteria. Worth monitoring for acne-prone skin.`,
        severity: 'MODERATE',
        impact: -5,
        source: 'IJDVL'
      });
    }

    // Beneficial for acne
    const acneBeneficial = ingredients.filter(i => {
      const n = i.name.toLowerCase();
      return ['niacinamide', 'salicylic acid', 'zinc', 'tea tree', 'benzoyl peroxide',
              'glycolic acid', 'azelaic acid'].some(kw => n.includes(kw));
    });
    if (acneBeneficial.length > 0) {
      const d = acneBeneficial.length * 4; score += d;
      concerns.push({
        label: 'Acne-Fighting Actives ✓',
        detail: `${acneBeneficial.map(i => i.name).join(', ')} — proven to reduce acne, control sebum, and improve skin texture.`,
        severity: 'BENEFICIAL',
        impact: d,
        source: 'British Journal of Dermatology'
      });
      positives.push(`Contains acne-fighting actives: ${acneBeneficial.map(i => i.name).join(', ')}`);
    }
  }

  // ── SENSITIVE SKIN / ROSACEA ──────────────────────────────────
  if (has(conditions, 'SENSITIVE_SKIN_TOPICAL') || has(conditions, 'ROSACEA') || has(conditions, 'CONTACT_DERMATITIS')) {

    const hasFragrance = hasAny(['fragrance', 'parfum', 'perfume', 'limonene', 'linalool', 'eugenol', 'geraniol', 'cinnamal']);
    if (hasFragrance) {
      const d = has(conditions, 'CONTACT_DERMATITIS') ? -15 : -10;
      score += d;
      concerns.push({
        label: 'Fragrance / Parfum — Irritation Risk',
        detail: 'Fragrance is the #1 cause of contact dermatitis and skin sensitisation. EU Cosmetics Regulation lists 26 fragrance allergens. Best avoided for sensitive skin.',
        severity: 'HIGH',
        impact: d,
        source: 'EU Cosmetics Regulation 1223/2009 / ICMR'
      });
    }

    const hasAlcohol = hasAny(['alcohol denat', 'denatured alcohol', 'sd alcohol', 'ethanol (denat)', 'isopropanol']);
    if (hasAlcohol) {
      const d = -8; score += d;
      concerns.push({
        label: 'Drying Alcohol — Skin Barrier Concern',
        detail: 'Denatured alcohol strips the skin barrier, triggers inflammation, and worsens rosacea and sensitive skin. Avoid repeatedly.',
        severity: has(conditions, 'ROSACEA') ? 'HIGH' : 'MODERATE',
        impact: d,
        source: 'Journal of Clinical and Aesthetic Dermatology'
      });
    }

    const hasMIorMCI = hasAny(['methylisothiazolinone', 'methylchloroisothiazolinone', 'mi/mci', 'kathon']);
    if (hasMIorMCI) {
      const d = -12; score += d;
      concerns.push({
        label: '⚠ MI/MCI — Sensitiser',
        detail: 'Methylisothiazolinone (MI) and Methylchloroisothiazolinone (MCI) are potent skin sensitisers. EU banned MI in leave-on products. High risk for contact dermatitis.',
        severity: 'HIGH',
        impact: d,
        source: 'EU Cosmetics Regulation / SCCS'
      });
    }

    const hasSLS = hasAny(['sodium lauryl sulfate', 'sls', 'sodium lauryl sulphate']);
    if (hasSLS) {
      const d = -8; score += d;
      concerns.push({
        label: 'SLS — Skin Barrier Disruption',
        detail: 'Sodium Lauryl Sulfate (SLS) strips natural oils and disrupts the skin barrier. Particularly problematic for sensitive, reactive, or eczema-prone skin.',
        severity: 'MODERATE',
        impact: d,
        source: 'Contact Dermatitis Journal'
      });
    }

    // Gentle/soothing actives are a positive
    const soothing = ingredients.filter(i => {
      const n = i.name.toLowerCase();
      return ['centella asiatica', 'cica', 'allantoin', 'bisabolol', 'aloe vera', 'panthenol',
              'ceramide', 'hyaluronic acid', 'glycerin', 'beta-glucan'].some(kw => n.includes(kw));
    });
    if (soothing.length > 0) {
      const d = Math.min(soothing.length * 3, 12); score += d;
      concerns.push({
        label: 'Soothing / Barrier Ingredients ✓',
        detail: `${soothing.map(i => i.name).join(', ')} — clinically proven to calm inflammation and strengthen the skin barrier.`,
        severity: 'BENEFICIAL',
        impact: d,
        source: 'British Journal of Dermatology'
      });
      positives.push(`Soothing actives present: ${soothing.map(i => i.name).join(', ')}`);
    }
  }

  // ── DRY SKIN ─────────────────────────────────────────────────
  if (has(conditions, 'DRY_SKIN')) {
    const hasHarshSurfactants = hasAny(['sodium lauryl sulfate', 'sls', 'sodium lauryl sulphate', 'ammonium lauryl sulfate']);
    if (hasHarshSurfactants) {
      const d = -8; score += d;
      concerns.push({
        label: 'Harsh Surfactants — Dryness Risk',
        detail: 'SLS and ALS strip the skin of natural oils, worsening dryness and tightness. Look for SLES or amino-acid surfactants instead.',
        severity: 'MODERATE',
        impact: d,
        source: 'IJDVL'
      });
    }

    const humectants = ingredients.filter(i => {
      const n = i.name.toLowerCase();
      return ['glycerin', 'hyaluronic acid', 'sodium hyaluronate', 'urea', 'sorbitol',
              'panthenol', 'aloe vera', 'honey extract'].some(kw => n.includes(kw));
    });
    if (humectants.length > 0) {
      const d = humectants.length * 3; score += Math.min(d, 10);
      concerns.push({
        label: 'Humectants — Dry Skin Benefit ✓',
        detail: `${humectants.map(i => i.name).join(', ')} — attract and retain moisture. Great for dry skin.`,
        severity: 'BENEFICIAL',
        impact: Math.min(d, 10),
        source: 'British Journal of Dermatology'
      });
      positives.push(`Humectants present: ${humectants.map(i => i.name).join(', ')}`);
    }
  }

  // ── OILY SKIN ─────────────────────────────────────────────────
  if (has(conditions, 'OILY_SKIN')) {
    const heavyOcclusive = ingredients.filter(i => {
      const n = i.name.toLowerCase();
      return ['mineral oil', 'petrolatum', 'paraffin oil', 'coconut oil', 'cocoa butter',
              'shea butter (heavy formula)'].some(kw => n.includes(kw));
    });
    if (heavyOcclusive.length > 0) {
      const d = -6; score += d;
      concerns.push({
        label: 'Heavy Occlusive Oils — Oily Skin Note',
        detail: `${heavyOcclusive.map(i => i.name).join(', ')} can feel greasy and contribute to congestion for oily or combination skin types.`,
        severity: 'LOW',
        impact: d,
        source: 'IJDVL'
      });
    }

    const oilControlIngredients = ingredients.filter(i => {
      const n = i.name.toLowerCase();
      return ['niacinamide', 'salicylic acid', 'zinc', 'kaolin', 'bentonite', 'clay'].some(kw => n.includes(kw));
    });
    if (oilControlIngredients.length > 0) {
      const d = 6; score += d;
      concerns.push({
        label: 'Oil-Control Actives ✓',
        detail: `${oilControlIngredients.map(i => i.name).join(', ')} help regulate sebum production and mattify the skin.`,
        severity: 'BENEFICIAL',
        impact: d,
        source: 'Journal of Clinical and Aesthetic Dermatology'
      });
      positives.push(`Oil-control ingredients found: ${oilControlIngredients.map(i => i.name).join(', ')}`);
    }
  }

  // ── PSORIASIS / ECZEMA ────────────────────────────────────────
  if (has(conditions, 'PSORIASIS') || has(conditions, 'ECZEMA_SENSITIVE_SKIN')) {
    const hasFragrance = hasAny(['fragrance', 'parfum', 'perfume']);
    if (hasFragrance) {
      const d = -12; score += d;
      concerns.push({
        label: 'Fragrance — Psoriasis / Eczema Trigger',
        detail: 'Fragrance is one of the most common triggers for eczema and psoriasis flares. NHS and AAD both recommend fragrance-free products for these conditions.',
        severity: 'HIGH',
        impact: d,
        source: 'NHS / American Academy of Dermatology'
      });
    }

    const hasHarshPreservatives = hasAny(['methylisothiazolinone', 'methylchloroisothiazolinone',
                                           'formaldehyde', 'imidazolidinyl urea', 'dmdm hydantoin']);
    if (hasHarshPreservatives) {
      const d = -10; score += d;
      concerns.push({
        label: 'Harsh Preservatives — Skin Barrier Risk',
        detail: 'Formaldehyde-releasing preservatives and isothiazolinones can aggravate psoriasis and eczema by triggering contact sensitisation.',
        severity: 'HIGH',
        impact: d,
        source: 'British Journal of Dermatology'
      });
    }

    const skinBarrier = ingredients.filter(i => {
      const n = i.name.toLowerCase();
      return ['ceramide', 'cholesterol', 'fatty acid', 'niacinamide', 'colloidal oatmeal',
              'allantoin', 'panthenol'].some(kw => n.includes(kw));
    });
    if (skinBarrier.length > 0) {
      const d = skinBarrier.length * 4; score += Math.min(d, 12);
      concerns.push({
        label: 'Skin Barrier Repair Ingredients ✓',
        detail: `${skinBarrier.map(i => i.name).join(', ')} — help repair the compromised skin barrier in eczema and psoriasis.`,
        severity: 'BENEFICIAL',
        impact: Math.min(d, 12),
        source: 'British Journal of Dermatology'
      });
      positives.push(`Barrier-repair ingredients: ${skinBarrier.map(i => i.name).join(', ')}`);
    }
  }

  return score;
}

// ── Consumption Note ──────────────────────────────────────────────────────────

function getConsumptionNote(
  score: number,
  conditions: HealthCondition[],
  ageGroup: AgeGroup
): string | null {
  const personaWarning = " Note: These thresholds are general population averages; individual medical needs vary.";
  
  if (score >= 70) return null;
  if (ageGroup === 'INFANT_0_2') return 'Not suitable for infants.' + personaWarning;
  if (['CHILD_3_7', 'CHILD_8_12'].includes(ageGroup) && score < 50) return 'Occasional treat only — not for daily consumption.' + personaWarning;
  
  if ((has(conditions, 'DIABETES_T1') || has(conditions, 'DIABETES_T2'))) {
    if (score < 40) return 'Avoid — significant blood sugar impact.' + personaWarning;
    if (score < 60) return 'Consume occasionally in small portions only.' + personaWarning;
  }
  if (has(conditions, 'HYPERTENSION') && score < 45) return 'Limit — high sodium impact';
  if (has(conditions, 'PREGNANCY_T1') || has(conditions, 'PREGNANCY_T2') || has(conditions, 'PREGNANCY_T3')) {
    if (score < 50) return 'Avoid during pregnancy';
  }
  if (has(conditions, 'KIDNEY_DISEASE_CKD') && score < 40) return 'Consult your doctor before consuming';
  if (score < 40) return 'Consume rarely';
  if (score < 55) return 'Occasional consumption only';
  return null;
}

// ── One Line Verdict ──────────────────────────────────────────────────────────

function getOneLineVerdict(
  score: number,
  profile: FamilyProfile,
  concerns: ProfileConcern[]
): string {
  const name = profile.display_name;
  if (score >= 70) return `Good choice for ${name}`;
  if (score >= 55) return `Fine occasionally for ${name}, not daily`;
  if (score >= 40) return `Limit this for ${name}`;
  const topConcern = concerns.find(c => c.severity === 'HIGH');
  if (topConcern) return `Not recommended for ${name} — ${topConcern.label.toLowerCase()}`;
  if (score < 25) return `Avoid for ${name}`;
  return `Not recommended for ${name}`;
}

// ── MAIN: Calculate verdict for one profile ───────────────────────────────────
// This is the function that wires ALL sections together correctly.

export function calculateProfileVerdict(
  profile: FamilyProfile,
  baseProductScore: number,
  ingredients: IngredientEntry[],
  nutrition: NutritionData | null,
  declaredAllergens: string[],
  productCategory: string = 'FOOD'
): ProfileVerdict {

  // ── Step 0: Dietary Preference Flagging ──────────────────────
  const dietaryPref = profile.dietary_preference;
  const modifiedIngredients = ingredients.filter(ing => ing && ing.name).map(ing => {
    const name = (ing.name || '').toLowerCase();
    const flags = [...(ing.flag_for || [])];
    let tier = ing.safety_tier;

    if (dietaryPref === 'VEGETARIAN') {
      const nonVeg = ['chicken', 'meat', 'beef', 'pork', 'fish', 'shrimp', 'prawn', 'egg', 'gelatin', 'lard', 'tallow'];
      if (nonVeg.some(kw => name.includes(kw))) {
        flags.push('Non-Vegetarian');
        tier = 'AVOID';
      }
    } else if (dietaryPref === 'VEGAN') {
      const nonVegan = ['milk', 'dairy', 'cheese', 'butter', 'ghee', 'honey', 'egg', 'gelatin', 'meat', 'chicken', 'beef', 'pork', 'fish', 'whey', 'casein', 'lactose'];
      if (nonVegan.some(kw => name.includes(kw))) {
        flags.push('Non-Vegan');
        tier = 'AVOID';
      }
    } else if (dietaryPref === 'JAIN') {
      const jainAvoid = ['onion', 'garlic', 'potato', 'beetroot', 'carrot', 'radish', 'sweet potato', 'ginger', 'turmeric (fresh)', 'meat', 'egg'];
      if (jainAvoid.some(kw => name.includes(kw))) {
        flags.push('Not Jain-friendly');
        tier = 'CAUTION';
      }
    } else if (dietaryPref === 'SATTVIC') {
      const sattvicAvoid = ['onion', 'garlic', 'meat', 'egg', 'fish', 'alcohol', 'caffeine'];
      if (sattvicAvoid.some(kw => name.includes(kw))) {
        flags.push('Not Sattvic');
        tier = 'AVOID';
      }
    }

    return { ...ing, flag_for: flags, safety_tier: tier };
  });

  const ingredientNames = modifiedIngredients.map(i => i.name);

  // ── Step 1: Allergen check — always first, hard stop ─────────
  const allergenCheck = checkAllergens(profile, declaredAllergens, ingredientNames);
  if (allergenCheck.blocked) {
    const found = allergenCheck.found
      .map(a => a.replace(/_/g, ' ').toLowerCase())
      .join(', ');
    return {
      profile,
      profile_score: 0,
      grade: 'E',
      colour: 'BLOCKED',
      allergen_blocked: true,
      allergen_found: allergenCheck.found,
      one_line_verdict: `⚠️ ALLERGEN ALERT for ${profile.display_name}`,
      concerns: [{
        label: `Contains ${found}`,
        detail: `This product contains ${found} — listed as an allergen for ${profile.display_name}. Do not consume without medical advice.`,
        severity: 'HIGH',
        impact: -100,
        source: 'FSSAI Allergen Declaration Rules'
      }],
      positives: [],
      safe_consumption_note: `Do not give to ${profile.display_name}`
    };
  }

  // ── Step 2: Start from base score ────────────────────────────
  const concerns: ProfileConcern[] = [];
  const positives: string[] = [];

  // ── Step 3: Apply age rules ───────────────────────────────────
  applyAgeRules(
    baseProductScore, profile.age_group, modifiedIngredients, nutrition, concerns, positives
  );

  // ── Step 4: Apply condition rules ────────────────────────────
  applyConditionRules(
    baseProductScore, profile.health_conditions, modifiedIngredients, nutrition, concerns, positives
  );

  // ── Step 4.5: Apply position-aware ingredient rules (FOOD only) ──
  if (productCategory === 'FOOD' || productCategory === 'SUPPLEMENT') {
    applyPositionAwareRules(profile.health_conditions, modifiedIngredients, concerns);
  }

  // ── Step 4.6: Apply health goal rules ────────────────────────
  applyHealthGoalRules(
    baseProductScore, profile.health_goals, modifiedIngredients, nutrition, concerns, positives
  );

  // ── Step 5: Apply gender rules (with ingredients passed in) ──
  applyGenderRules(
    baseProductScore,
    profile.gender,
    profile.age_group,
    profile.activity_level,
    profile.health_conditions,
    modifiedIngredients,               // ← fixed: correctly passed here
    nutrition,
    concerns,
    positives
  );

  // ── Step 6: Apply activity rules ─────────────────────────────
  applyActivityRules(
    baseProductScore, profile.activity_level, profile.gender, nutrition, concerns, positives
  );

  // ── Step 6.5: Apply skin condition rules (cosmetics only) ─────
  if (productCategory === 'COSMETIC' || productCategory === 'PERSONAL_CARE') {
    const hasSkinCondition = profile.health_conditions.some(c =>
      ['ACNE_PRONE', 'SENSITIVE_SKIN_TOPICAL', 'ROSACEA', 'PSORIASIS',
       'DRY_SKIN', 'OILY_SKIN', 'CONTACT_DERMATITIS', 'ECZEMA_SENSITIVE_SKIN'].includes(c)
    );
    if (hasSkinCondition) {
      applySkinConditionRules(baseProductScore, profile.health_conditions, modifiedIngredients, concerns, positives);
    }
  }

  // ── Step 7: Sort concerns by severity ────────────────────────
  const order = { HIGH: 0, MODERATE: 1, LOW: 2, BENEFICIAL: 3 };
  concerns.sort((a, b) => order[a.severity] - order[b.severity]);

  // ── Step 8: Remove duplicate positives ───────────────────────
  const uniquePositives = [...new Set(positives)];

  // Calculate final score from impacts
  const totalImpact = concerns.reduce((acc, c) => acc + c.impact, 0);
  const finalScore = cap(baseProductScore + totalImpact);

  return {
    profile,
    profile_score: finalScore,
    grade: toGrade(finalScore),
    colour: toColour(finalScore),
    allergen_blocked: false,
    allergen_found: [],
    one_line_verdict: getOneLineVerdict(finalScore, profile, concerns),
    concerns,
    positives: uniquePositives,
    safe_consumption_note: getConsumptionNote(
      finalScore, profile.health_conditions, profile.age_group
    )
  };
}

// ── Calculate verdicts for all profiles at once ───────────────────────────────

export function calculateAllFamilyVerdicts(
  profiles: FamilyProfile[],
  baseProductScore: number,
  ingredients: IngredientEntry[],
  nutrition: NutritionData | null,
  declaredAllergens: string[],
  productCategory: string = 'FOOD'
): ProfileVerdict[] {
  return profiles.map(profile =>
    calculateProfileVerdict(
      profile,
      baseProductScore,
      ingredients,
      nutrition,
      declaredAllergens,
      productCategory
    )
  );
}

// ── Derive anonymised profile type for scan_events ───────────────────────────
// Used by swapService — no personal data, just a bucket label

export function getProfileType(profile: FamilyProfile): string {
  const age = profile.age_group;
  const conds = profile.health_conditions;

  if (['INFANT_0_2', 'CHILD_3_7', 'CHILD_8_12'].includes(age)) return 'CHILD';
  if (conds.includes('DIABETES_T2') || conds.includes('DIABETES_T1')) return 'DIABETIC';
  if (conds.includes('HYPERTENSION')) return 'HYPERTENSIVE';
  if (conds.includes('PREGNANCY_T1') || conds.includes('PREGNANCY_T2') || conds.includes('PREGNANCY_T3')) return 'PREGNANT';
  if (age === 'SENIOR_61_PLUS') return 'SENIOR';
  if (profile.activity_level === 'VERY_ACTIVE' || profile.activity_level === 'ATHLETE') return 'ACTIVE';
  return 'GENERAL';
}