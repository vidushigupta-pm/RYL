/**
 * evals.ts — Automated eval suite for INGREDIENT_DB, lookupIngredient(), and calculateScore().
 *
 * Run with:  npm run eval   (from functions/ directory)
 *
 * Exit code 0 = all critical tests passed
 * Exit code 1 = one or more FAIL results
 */

import {
  INGREDIENT_DB,
  lookupIngredient,
  batchLookupIngredients,
  normaliseIngredientName,
  IngredientEntry,
  BatchLookupResult,
} from './data';
import { calculateScore, NutritionData } from './scoringEngine';

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let warned = 0;

function ok(label: string) {
  console.log(`  ✅  ${label}`);
  passed++;
}

function fail(label: string, detail?: string) {
  console.error(`  ❌  ${label}${detail ? ` — ${detail}` : ''}`);
  failed++;
}

function warn(label: string, detail?: string) {
  console.warn(`  ⚠️   ${label}${detail ? ` — ${detail}` : ''}`);
  warned++;
}

function section(title: string) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'─'.repeat(60)}`);
}

/** Resolve which DB key an entry belongs to */
function getKey(entry: IngredientEntry): string | undefined {
  return Object.entries(INGREDIENT_DB).find(([, v]) => v === entry)?.[0];
}

function assertLookupKey(rawName: string, expectedKey: string | null, desc?: string) {
  const result = lookupIngredient(rawName);
  const label = desc || `lookup("${rawName}")`;
  if (expectedKey === null) {
    if (result === null) ok(`${label} → correctly null`);
    else fail(`${label} → expected null but matched "${getKey(result)}"`);
  } else {
    if (result === null) fail(`${label} → expected "${expectedKey}" but got null`);
    else {
      const foundKey = getKey(result);
      if (foundKey === expectedKey) ok(`${label} → "${expectedKey}"`);
      else fail(`${label} → expected "${expectedKey}" but matched "${foundKey}" (${result.common_names[0]})`);
    }
  }
}

function assertScoreRange(label: string, score: number, min: number, max: number) {
  if (score >= min && score <= max) ok(`${label} → score ${score} (expected ${min}–${max})`);
  else fail(`${label} → score ${score} is OUTSIDE expected range ${min}–${max}`);
}

/** Mock a fully-covered ingredient set for nutrition-only scoring tests */
const FULL_COVERAGE: BatchLookupResult = { verified: [], unverified: [], coveragePercent: 100 };

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: DB Integrity
// ─────────────────────────────────────────────────────────────────────────────

section('SUITE 1: DB Integrity Checks');

const VALID_TIERS   = ['SAFE', 'CAUTION', 'AVOID', 'BANNED_IN_INDIA', 'UNVERIFIED'];
const VALID_FSSAI   = ['PERMITTED', 'RESTRICTED', 'PROHIBITED', 'NOT_APPLICABLE', 'UNKNOWN'];
const VALID_QUALITY = ['VERIFIED', 'PARTIAL', 'LLM_GENERATED'];

let integrityFails = 0;
let totalAliases = 0;
const allAliasesSeen = new Map<string, string>(); // normAlias → key

for (const [key, entry] of Object.entries(INGREDIENT_DB)) {
  // Required fields
  if (!entry.common_names || entry.common_names.length === 0) { fail(`[${key}] empty common_names`); integrityFails++; }
  if (!entry.function)                                          { fail(`[${key}] missing "function"`); integrityFails++; }
  if (!VALID_TIERS.includes(entry.safety_tier))                { fail(`[${key}] invalid safety_tier "${entry.safety_tier}"`); integrityFails++; }
  if (!VALID_FSSAI.includes(entry.fssai_status))               { fail(`[${key}] invalid fssai_status "${entry.fssai_status}"`); integrityFails++; }
  if (!VALID_QUALITY.includes(entry.data_quality))             { fail(`[${key}] invalid data_quality "${entry.data_quality}"`); integrityFails++; }
  if (typeof entry.score_impact !== 'number')                  { fail(`[${key}] score_impact not a number`); integrityFails++; }
  if (!entry.plain_explanation || entry.plain_explanation.length < 20) { fail(`[${key}] plain_explanation missing/too short`); integrityFails++; }

  // Safety tier ↔ score_impact consistency
  if (entry.safety_tier === 'BANNED_IN_INDIA' && entry.score_impact > -10)
    warn(`[${key}] BANNED_IN_INDIA but score_impact is ${entry.score_impact} (expected ≤ -10)`);
  if (entry.safety_tier === 'AVOID' && entry.score_impact > -5)
    warn(`[${key}] AVOID but score_impact is ${entry.score_impact} (expected ≤ -5)`);
  if (entry.safety_tier === 'SAFE' && entry.score_impact < 0)
    warn(`[${key}] SAFE but score_impact is ${entry.score_impact} — should be ≥ 0`);

  // Alias checks
  for (const alias of entry.common_names) {
    totalAliases++;
    const normAlias = normaliseIngredientName(alias);
    // Short aliases (<4 chars after normalisation) are ignored in substring matching —
    // fine for exact-match lookups like "msg", "sls", "bha", but flag so we're aware.
    if (normAlias.length < 4) {
      warn(`[${key}] alias "${alias}" normalises to "${normAlias}" (<4 chars) — substring-match disabled, exact-match only`);
    }
    // Cross-entry duplicate detection
    if (allAliasesSeen.has(normAlias) && allAliasesSeen.get(normAlias) !== key) {
      warn(`[${key}] normalised alias "${normAlias}" DUPLICATED — also in entry "${allAliasesSeen.get(normAlias)}" — first match wins`);
    } else {
      allAliasesSeen.set(normAlias, key);
    }
  }

  // Condition flags
  for (const flag of entry.condition_flags || []) {
    if (!flag.condition) { fail(`[${key}] condition_flag missing "condition"`); integrityFails++; }
    if (!flag.source)    warn(`[${key}] condition_flag "${flag.condition}" has no source citation`);
  }
}

console.log(`  DB has ${Object.keys(INGREDIENT_DB).length} entries, ${totalAliases} total aliases`);
if (integrityFails === 0) ok(`All DB entries pass integrity checks`);

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: Self-Lookup — every alias must find itself
// ─────────────────────────────────────────────────────────────────────────────

section('SUITE 2: Self-Lookup (every alias must resolve back to its own entry)');

let selfFails = 0;
for (const [key, entry] of Object.entries(INGREDIENT_DB)) {
  for (const alias of entry.common_names) {
    const normAlias = normaliseIngredientName(alias);
    if (normAlias.length < 4) continue; // short aliases: exact-match only, skip substring test

    const found = lookupIngredient(alias);
    if (!found) {
      fail(`[${key}] alias "${alias}" → null`);
      selfFails++;
    } else {
      const foundKey = getKey(found);
      if (foundKey !== key) {
        // Only fail if another entry is stealing this alias — this is a data bug.
        fail(`[${key}] alias "${alias}" matched "${foundKey}" instead — check for duplicate aliases`);
        selfFails++;
      }
    }
  }
}
if (selfFails === 0) ok(`All aliases resolve back to their own entry`);

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: False-Positive Prevention
// Strings that must NOT incorrectly match a specific entry.
// ─────────────────────────────────────────────────────────────────────────────

section('SUITE 3: False-Positive Prevention');

// [input, mustNotMatchThisKey, description]
const FP_CASES: [string, string, string][] = [
  ['sodium triphosphate',   'hyaluronic_acid',  '"triphosphate" must not match hyaluronic acid'],
  ['pyrophosphate',         'hyaluronic_acid',  '"pyrophosphate" must not match hyaluronic acid'],
  ['calcium carbonate',     'hyaluronic_acid',  '"calcium carbonate" must not match hyaluronic acid'],
  ['cacao powder',          'hyaluronic_acid',  '"cacao" must not match hyaluronic acid'],
  ['water',                 'ins_102',          '"water" must not match tartrazine'],
  ['wheat flour',           'ins_621',          '"wheat flour" must not match MSG'],
  ['natural flavour',       'ins_621',          '"natural flavour" must not match MSG'],
  ['caramel colour',        'ins_102',          '"caramel colour" must not match tartrazine'],
  ['soy protein',           'ins_322',          '"soy protein" should not match soy lecithin'],
  ['palm oil',              'ins_621',          '"palm oil" must not match MSG'],
  ['citric acid',           'ins_621',          '"citric acid" must not match MSG'],
];

for (const [input, badKey, desc] of FP_CASES) {
  const result = lookupIngredient(input);
  if (result === null) {
    ok(`"${input}" → null (not "${badKey}") — ${desc}`);
  } else {
    const matchedKey = getKey(result);
    if (matchedKey === badKey) {
      fail(`"${input}" → FALSE POSITIVE matched "${badKey}" — ${desc}`);
    } else {
      ok(`"${input}" → matched "${matchedKey}" (not "${badKey}") — ${desc}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: Real-World Ingredient Lookups
// Every row must resolve to the correct DB key.
// ─────────────────────────────────────────────────────────────────────────────

section('SUITE 4: Real-World Ingredient Lookup Accuracy');

// [rawIngredient, expectedDbKey, description]
const LOOKUP_CASES: [string, string | null, string][] = [
  // ── Artificial Colours ──────────────────────────────────────────────────────
  ['Tartrazine',                        'ins_102',             'Tartrazine (yellow dye)'],
  ['INS 102',                           'ins_102',             'INS 102 numeric'],
  ['FD&C Yellow 5',                     'ins_102',             'FD&C Yellow 5 US name'],
  ['Sunset Yellow',                     'ins_110',             'Sunset Yellow FCF'],
  ['INS 110',                           'ins_110',             'INS 110 numeric'],
  ['FD&C Yellow 6',                     'ins_110',             'FD&C Yellow 6'],
  ['Allura Red',                        'ins_129',             'Allura Red / Red 40'],
  ['INS 129',                           'ins_129',             'INS 129 numeric'],
  ['Carmoisine',                        'ins_122',             'Carmoisine (red dye)'],
  ['INS 133',                           'ins_133',             'INS 133 Brilliant Blue'],
  // ── Preservatives ────────────────────────────────────────────────────────────
  ['Sodium Benzoate',                   'ins_211',             'Sodium Benzoate'],
  ['INS 211',                           'ins_211',             'INS 211 numeric'],
  ['Potassium Sorbate',                 'ins_202',             'Potassium Sorbate'],
  ['INS 202',                           'ins_202',             'INS 202 numeric'],
  ['Sodium Nitrite',                    'ins_250',             'Sodium Nitrite (meats)'],
  ['INS 250',                           'ins_250',             'INS 250 numeric'],
  // ── Sweeteners ───────────────────────────────────────────────────────────────
  ['Aspartame',                         'ins_951',             'Aspartame'],
  ['INS 951',                           'ins_951',             'INS 951 numeric'],
  ['Sucralose',                         'ins_955',             'Sucralose'],
  ['Acesulfame Potassium',              'ins_950',             'Ace-K'],
  ['Saccharin',                         'ins_954',             'Saccharin'],
  ['Stevia',                            'ins_960',             'Stevia'],
  // ── Emulsifiers ──────────────────────────────────────────────────────────────
  ['Soy Lecithin',                      'ins_322',             'Soy Lecithin'],
  ['Lecithin',                          'ins_322',             'Lecithin (generic)'],
  ['INS 322',                           'ins_322',             'INS 322 numeric'],
  ['INS 471',                           'ins_471',             'Mono & Diglycerides'],
  ['Mono and Diglycerides of Fatty Acids', 'ins_471',          'Full name on label'],
  ['Carrageenan',                       'ins_407',             'Carrageenan'],
  ['INS 407',                           'ins_407',             'INS 407 numeric'],
  // ── Flavour Enhancers ─────────────────────────────────────────────────────────
  ['Monosodium Glutamate',              'ins_621',             'MSG full name'],
  ['MSG',                               'ins_621',             'MSG acronym'],
  ['INS 621',                           'ins_621',             'INS 621 numeric'],
  ['Disodium Inosinate',                'ins_631',             'INS 631'],
  ['INS 631',                           'ins_631',             'INS 631 numeric'],
  ['Disodium Ribonucleotides',          'ins_635',             'INS 635'],
  ['INS 635',                           'ins_635',             'INS 635 numeric'],
  // ── Antioxidants ─────────────────────────────────────────────────────────────
  ['TBHQ',                              'ins_319',             'TBHQ'],
  ['Tertiary Butylhydroquinone',        'ins_319',             'TBHQ full name'],
  ['BHA',                               'ins_320',             'BHA (butylated hydroxyanisole)'],
  ['Butylated Hydroxyanisole',          'ins_320',             'BHA full name'],
  // ── Leavening / Acidity ──────────────────────────────────────────────────────
  ['Sodium Bicarbonate',                'ins_500',             'Baking soda'],
  ['INS 500',                           'ins_500',             'INS 500 numeric'],
  ['Citric Acid',                       'ins_330',             'Citric Acid'],
  ['INS 330',                           'ins_330',             'INS 330 numeric'],
  // ── Phosphates ───────────────────────────────────────────────────────────────
  ['Sodium Triphosphate',               'ins_451',             'INS 451'],
  ['INS 451',                           'ins_451',             'INS 451 numeric'],
  // ── Thickeners / Gums ────────────────────────────────────────────────────────
  ['Xanthan Gum',                       'ins_415',             'Xanthan Gum'],
  ['Guar Gum',                          'ins_412',             'Guar Gum'],
  // ── Food Base Ingredients (now in DB) ────────────────────────────────────────
  ['Sugar',                             'sugar',               'Sugar'],
  ['Salt',                              'salt',                'Salt'],
  ['Palm Oil',                          'palm_oil',            'Palm oil'],
  ['Wheat Flour',                       'wheat_flour',         'Wheat flour'],
  ['Maltodextrin',                      'maltodextrin',        'Maltodextrin'],
  // ── Cosmetic Ingredients ─────────────────────────────────────────────────────
  ['Methylparaben',                     'methylparaben',       'Methylparaben'],
  ['Propylparaben',                     'propylparaben',       'Propylparaben'],
  ['Sodium Lauryl Sulfate',             'sodium_lauryl_sulfate','SLS full name'],
  ['SLS',                               'sodium_lauryl_sulfate','SLS acronym (exact match)'],
  ['Fragrance',                         'fragrance',           'Fragrance'],
  ['Parfum',                            'fragrance',           'Parfum (EU name)'],
  ['Niacinamide',                       'niacinamide',         'Niacinamide'],
  ['Vitamin B3',                        'niacinamide',         'Vitamin B3 = Niacinamide'],
  ['Hyaluronic Acid',                   'hyaluronic_acid',     'Hyaluronic Acid'],
  ['Sodium Hyaluronate',                'hyaluronic_acid',     'Sodium Hyaluronate'],
  ['Salicylic Acid',                    'salicylic_acid',      'Salicylic Acid'],
  ['Titanium Dioxide',                  'titanium_dioxide_cosmetic', 'Titanium Dioxide (cosmetic)'],
  // ── Household ────────────────────────────────────────────────────────────────
  ['Sodium Hypochlorite',               'sodium_hypochlorite', 'Bleach'],
  ['Bleach',                            'sodium_hypochlorite', 'Bleach generic'],
  // ── Should return null (no DB entry) ─────────────────────────────────────────
  ['Water',                             null,                  'Water — not in DB'],
  ['Milk Solids',                       null,                  'Milk Solids — not in DB'],
  ['Cocoa Butter',                      null,                  'Cocoa Butter — not in DB'],
  ['Sunflower Oil',                     null,                  'Sunflower Oil — not in DB'],
  ['Peanuts',                           null,                  'Peanuts — not in DB'],
];

let lookupFails = 0;
for (const [input, expectedKey, desc] of LOOKUP_CASES) {
  const result = lookupIngredient(input);
  if (expectedKey === null) {
    if (result === null) ok(`"${input}" → null (${desc})`);
    else { warn(`"${input}" → matched "${getKey(result)}" — expected null — ${desc} — verify if correct`); }
  } else {
    if (result === null) { fail(`"${input}" → null, expected "${expectedKey}" — ${desc}`); lookupFails++; }
    else {
      const foundKey = getKey(result);
      if (foundKey === expectedKey) ok(`"${input}" → "${expectedKey}" (${desc})`);
      else { fail(`"${input}" → "${foundKey}", expected "${expectedKey}" — ${desc}`); lookupFails++; }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: batchLookupIngredients coverage
// ─────────────────────────────────────────────────────────────────────────────

section('SUITE 5: batchLookupIngredients() — Coverage Calculation');

const BATCH_CASES: [string[], number, string][] = [
  [
    ['Tartrazine', 'Sodium Benzoate', 'Water', 'Sunflower Oil'],
    50,
    '2 known (Tartrazine, Sodium Benzoate) + 2 unknown → 50%'
  ],
  [
    ['INS 102', 'INS 621', 'Sodium Bicarbonate', 'Aspartame'],
    100,
    'All 4 known → 100%'
  ],
  [
    ['unknown xyz', 'another unknown'],
    0,
    'All unknown → 0%'
  ],
  [
    [],
    100,
    'Empty list → 100% (no unknowns = full coverage)'
  ],
  [
    ['Sugar', 'Salt', 'Palm Oil', 'Water'],
    75,
    'Sugar/Salt/Palm Oil known (3), Water unknown (1) → 75%'
  ],
];

for (const [ingredients, expectedPct, desc] of BATCH_CASES) {
  const result = batchLookupIngredients(ingredients);
  if (result.coveragePercent === expectedPct) ok(`${desc} → ${result.coveragePercent}%`);
  else fail(`${desc} → expected ${expectedPct}% but got ${result.coveragePercent}%`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 6: calculateScore() — Nutrition tier validation
// Uses FULL_COVERAGE mock so suppression never fires.
// ─────────────────────────────────────────────────────────────────────────────

section('SUITE 6: calculateScore() — Nutrition Tiers & Logic');

function scoreBreakdown(score: ReturnType<typeof calculateScore>, label: string) {
  return score.score_breakdown.find(b => b.label.includes(label));
}

// Sugar tiers
{
  const s = calculateScore(FULL_COVERAGE, { sugar_g: 50 }, 'FOOD');
  const b = scoreBreakdown(s, 'Sugar');
  if (b?.impact === -10) ok(`Very High Sugar (50g) → impact -10`);
  else fail(`Very High Sugar (50g) → expected -10, got ${b?.impact}`);
}
{
  const s = calculateScore(FULL_COVERAGE, { sugar_g: 25 }, 'FOOD');
  const b = scoreBreakdown(s, 'Sugar');
  if (b?.impact === -6) ok(`High Sugar (25g) → impact -6`);
  else fail(`High Sugar (25g) → expected -6, got ${b?.impact}`);
}
{
  const s = calculateScore(FULL_COVERAGE, { sugar_g: 15 }, 'FOOD');
  const b = scoreBreakdown(s, 'Sugar');
  if (b?.impact === -3) ok(`Moderate Sugar (15g) → impact -3`);
  else fail(`Moderate Sugar (15g) → expected -3, got ${b?.impact}`);
}
{
  const s = calculateScore(FULL_COVERAGE, { sugar_g: 5 }, 'FOOD');
  const b = scoreBreakdown(s, 'Sugar');
  if (!b) ok(`Low Sugar (5g) → no sugar deduction`);
  else fail(`Low Sugar (5g) → unexpected deduction: ${b.impact}`);
}

// Sodium tiers
{
  const s = calculateScore(FULL_COVERAGE, { sodium_mg: 1200 }, 'FOOD');
  const b = scoreBreakdown(s, 'Sodium');
  if (b?.impact === -18) ok(`Extremely High Sodium (1200mg) → impact -18`);
  else fail(`Extremely High Sodium → expected -18, got ${b?.impact}`);
}
{
  const s = calculateScore(FULL_COVERAGE, { sodium_mg: 900 }, 'FOOD');
  const b = scoreBreakdown(s, 'Sodium');
  if (b?.impact === -13) ok(`Very High Sodium (900mg) → impact -13`);
  else fail(`Very High Sodium → expected -13, got ${b?.impact}`);
}
{
  const s = calculateScore(FULL_COVERAGE, { sodium_mg: 600 }, 'FOOD');
  const b = scoreBreakdown(s, 'Sodium');
  if (b?.impact === -7) ok(`High Sodium (600mg) → impact -7`);
  else fail(`High Sodium → expected -7, got ${b?.impact}`);
}
{
  const s = calculateScore(FULL_COVERAGE, { sodium_mg: 200 }, 'FOOD');
  const b = scoreBreakdown(s, 'Sodium');
  if (!b) ok(`Low Sodium (200mg) → no deduction`);
  else fail(`Low Sodium (200mg) → unexpected deduction: ${b.impact}`);
}

// Trans fat
{
  const s = calculateScore(FULL_COVERAGE, { trans_fat_g: 0.8 }, 'FOOD');
  const b = scoreBreakdown(s, 'Trans Fat');
  if (b?.impact === -10) ok(`Trans Fat >0.5g → impact -10`);
  else fail(`Trans Fat >0.5g → expected -10, got ${b?.impact}`);
}
{
  const s = calculateScore(FULL_COVERAGE, { trans_fat_g: 0.3 }, 'FOOD');
  const b = scoreBreakdown(s, 'Trans Fat');
  if (b?.impact === -4) ok(`Trace Trans Fat (0.3g) → impact -4`);
  else fail(`Trace Trans Fat → expected -4, got ${b?.impact}`);
}

// Protein & fibre bonuses
{
  const s = calculateScore(FULL_COVERAGE, { protein_g: 25 }, 'FOOD');
  const b = scoreBreakdown(s, 'Protein');
  if (b?.impact === 8) ok(`High Protein (25g) → +8`);
  else fail(`High Protein → expected +8, got ${b?.impact}`);
}
{
  const s = calculateScore(FULL_COVERAGE, { fibre_g: 8 }, 'FOOD');
  const b = scoreBreakdown(s, 'Fibre');
  if (b?.impact === 6) ok(`High Fibre (8g) → +6`);
  else fail(`High Fibre → expected +6, got ${b?.impact}`);
}
{
  const s = calculateScore(FULL_COVERAGE, { fibre_g: 4 }, 'FOOD');
  const b = scoreBreakdown(s, 'Fibre');
  if (b?.impact === 3) ok(`Good Fibre (4g) → +3`);
  else fail(`Good Fibre → expected +3, got ${b?.impact}`);
}

// UPF penalty
{
  const s = calculateScore(FULL_COVERAGE, {}, 'FOOD', true);
  const b = scoreBreakdown(s, 'Ultra-Processed');
  if (b?.impact === -10) ok(`UPF (FOOD) → -10 penalty`);
  else fail(`UPF FOOD → expected -10, got ${b?.impact}`);
}
{
  const s = calculateScore(FULL_COVERAGE, {}, 'COSMETIC', true);
  const b = scoreBreakdown(s, 'Ultra-Processed');
  if (!b) ok(`UPF on COSMETIC → no penalty (correct)`);
  else fail(`UPF COSMETIC → should not apply, got ${b?.impact}`);
}

// Suppression at low coverage
{
  const low: BatchLookupResult = { verified: [], unverified: ['a', 'b', 'c', 'd', 'e'], coveragePercent: 0 };
  const s = calculateScore(low, null, 'FOOD');
  if (s.is_suppressed) ok(`0% coverage → score suppressed`);
  else fail(`0% coverage → NOT suppressed, got score ${s.overall_score}`);
}

// Score clamped 0–100
{
  const terrible = batchLookupIngredients(['Tartrazine', 'Sunset Yellow', 'Sodium Benzoate', 'TBHQ', 'Aspartame']);
  const s = calculateScore(terrible, { sugar_g: 60, sodium_mg: 1500, trans_fat_g: 2 }, 'FOOD', true);
  if (s.overall_score >= 0 && s.overall_score <= 100) ok(`Score clamped: ${s.overall_score}`);
  else fail(`Score out of bounds: ${s.overall_score}`);
}

// Nutrition ignored for COSMETIC
{
  const s = calculateScore(FULL_COVERAGE, { sugar_g: 60, sodium_mg: 1500 }, 'COSMETIC');
  const sugarBlock = scoreBreakdown(s, 'Sugar');
  const sodiumBlock = scoreBreakdown(s, 'Sodium');
  if (!sugarBlock && !sodiumBlock) ok(`Nutrition scoring correctly skipped for COSMETIC`);
  else fail(`COSMETIC incorrectly applied nutrition scoring`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 7: Known Product Score Profiles
// ─────────────────────────────────────────────────────────────────────────────

section('SUITE 7: Known Product Score Profiles (real-world sanity check)');

// Maggi 2-Minute Noodles: high sodium, UPF, MSG, TBHQ
{
  const ingredients = batchLookupIngredients(['Monosodium Glutamate', 'TBHQ', 'Sodium Triphosphate', 'Tartrazine']);
  const s = calculateScore(ingredients, { sodium_mg: 890, sugar_g: 3, protein_g: 8 }, 'FOOD', true);
  assertScoreRange('Maggi Noodles (approx)', s.overall_score, 40, 68);
  console.log(`    Breakdown: ${s.score_breakdown.map(b => `${b.label}(${b.impact>0?'+':''}${b.impact})`).join(', ')}`);
}

// Parle-G Biscuits: moderate sugar, low sodium, light additives
{
  const ingredients = batchLookupIngredients(['INS 500', 'INS 471']);
  const s = calculateScore(ingredients, { sugar_g: 22, sodium_mg: 180, protein_g: 7, fibre_g: 1 }, 'FOOD', false);
  assertScoreRange('Parle-G Biscuits (approx)', s.overall_score, 75, 95);
  console.log(`    Breakdown: ${s.score_breakdown.map(b => `${b.label}(${b.impact>0?'+':''}${b.impact})`).join(', ')}`);
}

// Nutella: very high sugar, UPF
{
  const s = calculateScore(FULL_COVERAGE, { sugar_g: 57, sodium_mg: 40, protein_g: 6, fibre_g: 3 }, 'FOOD', true);
  assertScoreRange('Nutella (approx)', s.overall_score, 62, 82);
  console.log(`    Breakdown: ${s.score_breakdown.map(b => `${b.label}(${b.impact>0?'+':''}${b.impact})`).join(', ')}`);
}

// High-protein supplement: should score well
{
  const s = calculateScore(FULL_COVERAGE, { sugar_g: 3, sodium_mg: 150, protein_g: 30, fibre_g: 2 }, 'SUPPLEMENT', false);
  assertScoreRange('Protein Supplement (clean)', s.overall_score, 100, 100);
  console.log(`    Score: ${s.overall_score}`);
}

// Face wash with parabens + SLS
{
  const ingredients = batchLookupIngredients(['Methylparaben', 'Sodium Lauryl Sulfate']);
  const s = calculateScore(ingredients, null, 'COSMETIC', false);
  assertScoreRange('Face Wash (parabens + SLS)', s.overall_score, 90, 100);
  console.log(`    Breakdown: ${s.score_breakdown.map(b => `${b.label}(${b.impact>0?'+':''}${b.impact})`).join(', ')}`);
}

// Cosmetic with banned ingredient
{
  const ingredients = batchLookupIngredients(['Mercury', 'Lead Acetate']);
  const s = calculateScore(ingredients, null, 'COSMETIC', false);
  assertScoreRange('Cosmetic with banned ingredients', s.overall_score, 0, 30);
  console.log(`    Score: ${s.overall_score} — ${s.score_breakdown.map(b => `${b.label}(${b.impact>0?'+':''}${b.impact})`).join(', ')}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 8: normaliseIngredientName edge cases
// ─────────────────────────────────────────────────────────────────────────────

section('SUITE 8: normaliseIngredientName() edge cases');

const NORM_CASES: [string, string][] = [
  ['  Sodium Benzoate  ',          'sodium benzoate'],
  ['INS-211',                      'ins 211'],
  ['INS.211',                      'ins 211'],
  ['FD&C Yellow #5',               'fd c yellow 5'],
  ['Mono & Di-Glycerides',         'mono di glycerides'],
  ['E102',                         'e102'],
  ['TBHQ',                         'tbhq'],
  ['Water (Aqua)',                  'water aqua'],
  ['4-hydroxybenzoic acid',        '4 hydroxybenzoic acid'],
];

for (const [input, expected] of NORM_CASES) {
  const actual = normaliseIngredientName(input).replace(/\s+/g, ' ').trim();
  const exp    = expected.replace(/\s+/g, ' ').trim();
  if (actual === exp) ok(`normalise("${input}") → "${actual}"`);
  else warn(`normalise("${input}") → "${actual}" (expected "${exp}")`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Final report
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(60));
console.log('  EVAL RESULTS');
console.log('═'.repeat(60));
console.log(`  ✅  Passed:   ${passed}`);
console.log(`  ⚠️   Warnings: ${warned}`);
console.log(`  ❌  Failed:   ${failed}`);
console.log('═'.repeat(60));

if (failed > 0) {
  console.error(`\n  ${failed} critical test(s) FAILED — see ❌ above.\n`);
  process.exit(1);
} else if (warned > 0) {
  console.warn(`\n  All critical tests passed. ${warned} warning(s) to review above.\n`);
  process.exit(0);
} else {
  console.log('\n  All tests passed. DB is clean. ✓\n');
  process.exit(0);
}
