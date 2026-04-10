/**
 * scripts/seedProducts.ts
 *
 * Pre-populates Firestore with verified analysis data for 40+ common Indian products.
 * Products written here are returned instantly (Layer 1 RAG cache hit) — zero Gemini cost.
 *
 * Run locally:
 *   npx tsx scripts/seedProducts.ts
 *
 * Requires env vars (create scripts/.env or add to .env.local):
 *   FIREBASE_SERVICE_ACCOUNT_BASE64=<base64 JSON>
 *   FIRESTORE_DB_ID=ai-studio-0f7174ae-7a98-4951-8d4f-e23ec80681da
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: 'scripts/.env' });

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// ── Firebase init ──────────────────────────────────────────────────────────────
function initAdmin() {
  if (getApps().length > 0) return;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 is not set. Add it to scripts/.env');
  const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
  initializeApp({ credential: cert(sa), databaseURL: `https://${sa.project_id}.firebaseio.com` });
}

const DB_ID = process.env.FIRESTORE_DB_ID || 'ai-studio-0f7174ae-7a98-4951-8d4f-e23ec80681da';
const getDb = () => getFirestore(DB_ID);

function norm(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
}

function makeAliases(productName: string, brand: string): string[] {
  const n = norm(productName);
  const b = norm(brand);
  const full = norm(`${brand} ${productName}`);
  const tokens = `${n} ${b}`.split(/\s+/).filter(t => t.length > 2);
  return Array.from(new Set([n, b, full, ...tokens].filter(Boolean)));
}

function makeDocId(productName: string, brand: string): string {
  const n = norm(productName).replace(/\s+/g, '_');
  const b = norm(brand).replace(/\s+/g, '_');
  return b ? `${b}_${n}` : n;
}

// ── Product definitions ────────────────────────────────────────────────────────
interface SeedProduct {
  product_name: string;
  brand: string;
  category: 'FOOD' | 'COSMETIC' | 'PERSONAL_CARE' | 'SUPPLEMENT' | 'HOUSEHOLD' | 'PET_FOOD';
  nutrition: Record<string, number | null>;
  raw_ingredients: string[];
  ingredients: Array<{
    name: string;
    plain_name: string;
    function: string;
    safety_tier: 'SAFE' | 'CAUTION' | 'AVOID' | 'BANNED_IN_INDIA';
    plain_explanation: string;
    flag_for: string[];
    source: 'DB_VERIFIED' | 'LLM_GENERATED';
  }>;
  overall_score: number;
  score_breakdown: Array<{ label: string; impact: number; explanation: string }>;
  summary: string;
  india_context: string;
  is_upf: boolean;
  hfss_status: 'GREEN' | 'HFSS';
  suggestions: Array<{ type: 'SWAP'; name: string; reason: string }>;
}

const PRODUCTS: SeedProduct[] = [

  // ── BISCUITS & SNACKS ──────────────────────────────────────────────────────

  {
    product_name: 'Parle-G Original Gluco Biscuits',
    brand: 'Parle',
    category: 'FOOD',
    nutrition: { energy_kcal: 483, sugar_g: 17, sodium_mg: 290, protein_g: 7, fat_g: 14, saturated_fat_g: 7, trans_fat_g: 0, fibre_g: 1 },
    raw_ingredients: ['Wheat Flour', 'Sugar', 'Edible Vegetable Oil', 'Invert Syrup', 'Leavening Agents (INS 500, INS 503)', 'Salt', 'Milk Solids', 'Emulsifier (INS 322)', 'Dough Conditioner (INS 223)', 'Added Flavours'],
    ingredients: [
      { name: 'Wheat Flour', plain_name: 'Wheat Flour', function: 'Base ingredient', safety_tier: 'SAFE', plain_explanation: 'Standard refined wheat flour, permitted by FSSAI.', flag_for: ['Celiac disease', 'Gluten intolerance'], source: 'DB_VERIFIED' },
      { name: 'Sugar', plain_name: 'Sugar', function: 'Sweetener', safety_tier: 'CAUTION', plain_explanation: 'High refined sugar content; WHO recommends limiting free sugars to <10% of total energy intake.', flag_for: ['Diabetes', 'Obesity'], source: 'DB_VERIFIED' },
      { name: 'Edible Vegetable Oil', plain_name: 'Vegetable Oil', function: 'Fat source', safety_tier: 'SAFE', plain_explanation: 'FSSAI-permitted edible oil; often partially hydrogenated — check trans fat label.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'INS 322', plain_name: 'Soya Lecithin', function: 'Emulsifier', safety_tier: 'SAFE', plain_explanation: 'FSSAI-permitted emulsifier; generally recognised as safe at food-grade levels.', flag_for: ['Soy allergy'], source: 'DB_VERIFIED' },
      { name: 'INS 223', plain_name: 'Sodium Metabisulphite', function: 'Dough conditioner / preservative', safety_tier: 'CAUTION', plain_explanation: 'Sulphite preservative; FSSAI limits use in baked goods. Can trigger reactions in sulphite-sensitive individuals.', flag_for: ['Asthma', 'Sulphite sensitivity'], source: 'DB_VERIFIED' },
      { name: 'INS 500', plain_name: 'Sodium Bicarbonate', function: 'Leavening agent', safety_tier: 'SAFE', plain_explanation: 'Baking soda; FSSAI-permitted raising agent with no safety concerns at typical use levels.', flag_for: [], source: 'DB_VERIFIED' },
    ],
    overall_score: 42,
    score_breakdown: [{ label: 'High sugar', impact: -15, explanation: '17g sugar per 100g exceeds WHO guidance for snacks.' }, { label: 'Refined flour base', impact: -10, explanation: 'Maida-based biscuit with low fibre.' }, { label: 'Sulphite preservative', impact: -5, explanation: 'INS 223 may affect sulphite-sensitive individuals.' }, { label: 'Low trans fat', impact: 5, explanation: '0g trans fat declared on label.' }],
    summary: 'Parle-G is a high-carbohydrate, refined-flour biscuit with 17g sugar and 14g fat per 100g. It contains INS 223 (sodium metabisulphite), a sulphite preservative that can trigger reactions in asthma patients. Not suitable for diabetics or those managing weight.',
    india_context: 'FSSAI Food Safety and Standards (Food Products Standards and Food Additives) Regulations, 2011 permits sodium metabisulphite in biscuits at specified limits.',
    is_upf: true,
    hfss_status: 'HFSS',
    suggestions: [{ type: 'SWAP', name: 'Whole wheat digestive biscuits', reason: 'Higher fibre, lower glycaemic index, less sugar than refined-flour biscuits.' }],
  },

  {
    product_name: 'Lay\'s Classic Salted Chips',
    brand: 'Lay\'s',
    category: 'FOOD',
    nutrition: { energy_kcal: 536, sugar_g: 1, sodium_mg: 580, protein_g: 6, fat_g: 33, saturated_fat_g: 9, trans_fat_g: 0, fibre_g: 4 },
    raw_ingredients: ['Potato', 'Edible Vegetable Oil', 'Salt'],
    ingredients: [
      { name: 'Potato', plain_name: 'Potato', function: 'Base ingredient', safety_tier: 'SAFE', plain_explanation: 'Whole potato; naturally FSSAI-compliant ingredient.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'Edible Vegetable Oil', plain_name: 'Vegetable Oil (Palm/Sunflower)', function: 'Frying medium', safety_tier: 'CAUTION', plain_explanation: 'Deep-fried snack; high total fat at 33g/100g; ICMR-NIN 2024 recommends limiting fried foods.', flag_for: ['Cardiovascular disease', 'Obesity'], source: 'DB_VERIFIED' },
      { name: 'Salt', plain_name: 'Salt', function: 'Flavour/preservative', safety_tier: 'CAUTION', plain_explanation: 'Sodium at 580mg/100g — WHO daily limit is 2000mg. Heavy consumption adds significant salt load.', flag_for: ['Hypertension', 'Kidney disease'], source: 'DB_VERIFIED' },
    ],
    overall_score: 38,
    score_breakdown: [{ label: 'High fat', impact: -20, explanation: '33g fat per 100g; predominantly from deep frying.' }, { label: 'High sodium', impact: -15, explanation: '580mg sodium per 100g is ~29% of WHO daily limit.' }, { label: 'Simple ingredients', impact: 10, explanation: 'Only 3 ingredients; no artificial colours or preservatives.' }],
    summary: "Lay's Classic is a deep-fried potato chip with 33g fat and 580mg sodium per 100g. Despite having only 3 ingredients with no artificial additives, the high fat and salt content make it an HFSS snack. Regular consumption is associated with cardiovascular and weight-management concerns.",
    india_context: "FSSAI's draft Front-of-Pack Labelling regulations classify products with high fat, sugar or salt as HFSS requiring a warning label.",
    is_upf: false,
    hfss_status: 'HFSS',
    suggestions: [{ type: 'SWAP', name: 'Air-popped popcorn (plain)', reason: 'Much lower fat and calories; still a satisfying crunchy snack.' }, { type: 'SWAP', name: 'Roasted makhana (foxnuts)', reason: 'High protein, low fat traditional Indian snack with no artificial additives.' }],
  },

  {
    product_name: 'Kurkure Masala Munch',
    brand: 'Kurkure',
    category: 'FOOD',
    nutrition: { energy_kcal: 520, sugar_g: 3, sodium_mg: 700, protein_g: 6, fat_g: 28, saturated_fat_g: 12, trans_fat_g: 0.1, fibre_g: 2 },
    raw_ingredients: ['Rice Meal', 'Edible Vegetable Oil', 'Corn Meal', 'Gram Meal', 'Salt', 'Spices & Condiments', 'Sugar', 'Tartaric Acid (INS 334)', 'Flavour Enhancer (INS 621)', 'Anticaking Agent (INS 551)', 'Milk Solids', 'Colour (INS 110)'],
    ingredients: [
      { name: 'INS 621', plain_name: 'Monosodium Glutamate (MSG)', function: 'Flavour enhancer', safety_tier: 'CAUTION', plain_explanation: 'FSSAI permits MSG in extruded snacks; some individuals report sensitivity; JECFA considers it safe for general population.', flag_for: ['MSG sensitivity'], source: 'DB_VERIFIED' },
      { name: 'INS 110', plain_name: 'Sunset Yellow FCF', function: 'Artificial colour', safety_tier: 'CAUTION', plain_explanation: 'Synthetic azo dye; FSSAI permits in snacks; EFSA links it to hyperactivity in children at high doses.', flag_for: ['ADHD', 'Children'], source: 'DB_VERIFIED' },
      { name: 'INS 334', plain_name: 'Tartaric Acid', function: 'Acidity regulator', safety_tier: 'SAFE', plain_explanation: 'Naturally occurring acid; FSSAI-permitted acidulant with no safety concerns at food-grade levels.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'INS 551', plain_name: 'Silicon Dioxide', function: 'Anticaking agent', safety_tier: 'SAFE', plain_explanation: 'FSSAI-permitted anticaking agent; not absorbed by the body and considered safe.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'Salt', plain_name: 'Salt', function: 'Flavour', safety_tier: 'CAUTION', plain_explanation: '700mg sodium per 100g — among the highest in packaged snacks; WHO limit is 2000mg/day.', flag_for: ['Hypertension', 'Kidney disease'], source: 'DB_VERIFIED' },
    ],
    overall_score: 28,
    score_breakdown: [{ label: 'Very high sodium', impact: -20, explanation: '700mg sodium/100g; 35% of WHO daily limit in one serving.' }, { label: 'Artificial colour INS 110', impact: -10, explanation: 'Sunset Yellow linked to hyperactivity; not recommended for children.' }, { label: 'MSG present', impact: -5, explanation: 'Flavour enhancer; causes sensitivity in some individuals.' }, { label: 'Trans fat present', impact: -5, explanation: '0.1g trans fat declared — raises cardiovascular risk.'}],
    summary: 'Kurkure Masala Munch is a highly processed extruded snack with 700mg sodium, artificial colour INS 110 (Sunset Yellow), and MSG per 100g. It is classified as Nova Group 4 ultra-processed and exceeds HFSS thresholds for fat and sodium. Not recommended for children or those with hypertension.',
    india_context: 'FSSAI Food Safety and Standards (Food Products Standards and Food Additives) Regulations, 2011 Appendix A permits Sunset Yellow (INS 110) in extruded snacks at up to 100 mg/kg.',
    is_upf: true,
    hfss_status: 'HFSS',
    suggestions: [{ type: 'SWAP', name: 'Roasted chana or peanuts', reason: 'High protein, naturally flavoured, no artificial colours or MSG.' }],
  },

  {
    product_name: 'Bingo Mad Angles Achaari Masti',
    brand: 'Bingo',
    category: 'FOOD',
    nutrition: { energy_kcal: 515, sugar_g: 5, sodium_mg: 660, protein_g: 6, fat_g: 26, saturated_fat_g: 11, trans_fat_g: 0, fibre_g: 3 },
    raw_ingredients: ['Wheat Flour', 'Edible Vegetable Oil', 'Rice Flour', 'Spices', 'Salt', 'Sugar', 'Acidity Regulator (INS 330)', 'Flavour Enhancer (INS 627, INS 631)', 'Anticaking Agent (INS 551)'],
    ingredients: [
      { name: 'INS 627', plain_name: 'Disodium Guanylate', function: 'Flavour enhancer', safety_tier: 'CAUTION', plain_explanation: 'Purine-based nucleotide; FSSAI permits use but not recommended for people with gout or uric acid issues.', flag_for: ['Gout', 'Hyperuricaemia'], source: 'DB_VERIFIED' },
      { name: 'INS 631', plain_name: 'Disodium Inosinate', function: 'Flavour enhancer', safety_tier: 'CAUTION', plain_explanation: 'Synergistic with MSG for umami flavour; FSSAI permits use; avoid if sensitive to purines.', flag_for: ['Gout', 'Hyperuricaemia'], source: 'DB_VERIFIED' },
      { name: 'INS 330', plain_name: 'Citric Acid', function: 'Acidity regulator', safety_tier: 'SAFE', plain_explanation: 'FSSAI-permitted; naturally derived acidulant, no safety concerns at food-grade levels.', flag_for: [], source: 'DB_VERIFIED' },
    ],
    overall_score: 32,
    score_breakdown: [{ label: 'High sodium', impact: -18, explanation: '660mg sodium/100g exceeds HFSS threshold.' }, { label: 'High fat', impact: -12, explanation: '26g fat per 100g from deep frying.' }, { label: 'Nucleotide enhancers', impact: -5, explanation: 'INS 627/631 not suitable for gout patients.' }],
    summary: 'Bingo Mad Angles is a deep-fried wheat snack with 660mg sodium and nucleotide-based flavour enhancers (INS 627/631) that are not suitable for people with gout. Classified as HFSS for both fat and sodium content.',
    india_context: 'FSSAI permits disodium guanylate (INS 627) and disodium inosinate (INS 631) in snack foods under Schedule 2 of the Food Products Standards and Food Additives Regulations, 2011.',
    is_upf: true,
    hfss_status: 'HFSS',
    suggestions: [{ type: 'SWAP', name: 'Baked multigrain chips', reason: 'Lower fat, similar crunch without deep frying.' }],
  },

  {
    product_name: 'Haldiram\'s Aloo Bhujia',
    brand: 'Haldiram\'s',
    category: 'FOOD',
    nutrition: { energy_kcal: 544, sugar_g: 2, sodium_mg: 620, protein_g: 9, fat_g: 31, saturated_fat_g: 14, trans_fat_g: 0, fibre_g: 5 },
    raw_ingredients: ['Besan (Bengal Gram Flour)', 'Potato', 'Edible Vegetable Oil', 'Salt', 'Spices (Pepper, Cumin, Chilli)', 'Carom Seeds'],
    ingredients: [
      { name: 'Besan (Bengal Gram Flour)', plain_name: 'Chickpea Flour', function: 'Base ingredient', safety_tier: 'SAFE', plain_explanation: 'High-protein, high-fibre legume flour; FSSAI-compliant ingredient with nutritional benefits.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'Edible Vegetable Oil', plain_name: 'Vegetable Oil', function: 'Frying medium', safety_tier: 'CAUTION', plain_explanation: 'Deep-fried product; 31g fat per 100g; ICMR-NIN 2024 recommends limiting fried foods.', flag_for: ['Cardiovascular disease'], source: 'DB_VERIFIED' },
      { name: 'Salt', plain_name: 'Salt', function: 'Flavour', safety_tier: 'CAUTION', plain_explanation: '620mg sodium per 100g — significant salt load for those with hypertension.', flag_for: ['Hypertension'], source: 'DB_VERIFIED' },
    ],
    overall_score: 45,
    score_breakdown: [{ label: 'High protein from besan', impact: 8, explanation: '9g protein per 100g from chickpea flour.' }, { label: 'High fat', impact: -18, explanation: '31g fat from deep frying.' }, { label: 'High sodium', impact: -12, explanation: '620mg sodium/100g.' }, { label: 'No artificial additives', impact: 10, explanation: 'Clean label — natural spices only, no preservatives or colours.' }],
    summary: 'Haldiram\'s Aloo Bhujia is a traditional deep-fried namkeen with a relatively clean ingredient list — no artificial colours, preservatives or MSG. The chickpea flour base provides 9g protein per 100g. However, high fat (31g) and sodium (620mg) make it an HFSS snack to be consumed in moderation.',
    india_context: 'FSSAI classifies namkeen and bhujia under the category of extruded/traditional snacks; no additional additive approval beyond FSSAI Schedule 2 is required for spice-only products.',
    is_upf: false,
    hfss_status: 'HFSS',
    suggestions: [{ type: 'SWAP', name: 'Roasted chana (dry roasted, low salt)', reason: 'Same chickpea base; much lower fat without frying.' }],
  },

  // ── INSTANT NOODLES ────────────────────────────────────────────────────────

  {
    product_name: 'Maggi 2-Minute Masala Noodles',
    brand: 'Maggi',
    category: 'FOOD',
    nutrition: { energy_kcal: 385, sugar_g: 2, sodium_mg: 890, protein_g: 8, fat_g: 13, saturated_fat_g: 6, trans_fat_g: 0, fibre_g: 2 },
    raw_ingredients: ['Wheat Flour', 'Palm Oil', 'Salt', 'Tapioca Starch', 'Wheat Gluten', 'Colour (INS 150d)', 'Acidity Regulators (INS 501, INS 500)', 'Masala: Iodised Salt', 'Sugar', 'Spices (Onion, Cumin, Coriander, Chilli, Turmeric)', 'Flavour Enhancers (INS 635)', 'Hydrolysed Groundnut Protein', 'Acidity Regulator (INS 330)'],
    ingredients: [
      { name: 'INS 150d', plain_name: 'Caramel Colour IV (Sulphite Ammonia)', function: 'Colour', safety_tier: 'CAUTION', plain_explanation: 'FSSAI permits sulphite ammonia caramel in noodles; IARC 2B classification for 4-MEI byproduct at high doses; typical food intake is well below risk thresholds.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'INS 635', plain_name: "Disodium 5'-Ribonucleotides", function: 'Flavour enhancer', safety_tier: 'CAUTION', plain_explanation: 'Purine nucleotide blend (INS 627 + 631); FSSAI-permitted; not recommended for gout patients.', flag_for: ['Gout', 'Hyperuricaemia'], source: 'DB_VERIFIED' },
      { name: 'Salt', plain_name: 'Salt', function: 'Flavour', safety_tier: 'CAUTION', plain_explanation: "890mg sodium per 100g (from noodles + masala); one pack covers ~45% of WHO's 2000mg daily limit.", flag_for: ['Hypertension', 'Kidney disease'], source: 'DB_VERIFIED' },
      { name: 'Palm Oil', plain_name: 'Palm Oil', function: 'Frying medium / fat source', safety_tier: 'CAUTION', plain_explanation: 'High in saturated fat; ICMR-NIN 2024 recommends limiting saturated fat to <10% of total energy.', flag_for: ['Cardiovascular disease'], source: 'DB_VERIFIED' },
      { name: 'INS 500', plain_name: 'Sodium Bicarbonate', function: 'Leavening/acidity regulator', safety_tier: 'SAFE', plain_explanation: 'FSSAI-permitted raising agent; no concerns at food-grade use levels.', flag_for: [], source: 'DB_VERIFIED' },
    ],
    overall_score: 34,
    score_breakdown: [{ label: 'Very high sodium', impact: -22, explanation: '890mg sodium/100g — among the highest in packaged foods.' }, { label: 'Refined flour, low fibre', impact: -10, explanation: 'Maida base with only 2g fibre per 100g.' }, { label: 'Caramel colour IV', impact: -5, explanation: 'Contains INS 150d with trace 4-MEI; FSSAI permits at regulated levels.' }, { label: 'Nucleotide enhancer', impact: -5, explanation: 'INS 635 not suitable for gout patients.' }],
    summary: 'Maggi 2-Minute Noodles are a high-sodium (890mg/100g) ultra-processed food with INS 150d caramel colour and nucleotide flavour enhancers. One standard serving (70g pack + masala) delivers approximately 623mg sodium — about 31% of the WHO daily limit. Suitable for occasional consumption only.',
    india_context: "FSSAI issued a safety notice in 2015 regarding lead content in Maggi; post-reformulation, FSSAI cleared the product for sale. Current product complies with FSSAI Food Safety and Standards (Contaminants, Toxins and Residues) Regulations.",
    is_upf: true,
    hfss_status: 'HFSS',
    suggestions: [{ type: 'SWAP', name: 'Whole wheat vermicelli (upma/soup)', reason: 'Higher fibre, much lower sodium without the processed masala.' }, { type: 'SWAP', name: 'Oat noodles / brown rice noodles', reason: 'Better nutritional profile; can be seasoned with natural spices.' }],
  },

  {
    product_name: 'Yippee! Classic Masala Noodles',
    brand: 'Yippee',
    category: 'FOOD',
    nutrition: { energy_kcal: 380, sugar_g: 2, sodium_mg: 820, protein_g: 8, fat_g: 12, saturated_fat_g: 5, trans_fat_g: 0, fibre_g: 2 },
    raw_ingredients: ['Wheat Flour', 'Palm Oil', 'Salt', 'Wheat Gluten', 'Colour (INS 150d)', 'Acidity Regulator (INS 500)', 'Masala: Iodised Salt', 'Sugar', 'Spices', 'Flavour Enhancer (INS 635)', 'Hydrolysed Vegetable Protein'],
    ingredients: [
      { name: 'INS 150d', plain_name: 'Caramel Colour IV', function: 'Colour', safety_tier: 'CAUTION', plain_explanation: 'FSSAI-permitted in instant noodles; contains trace 4-MEI but at levels below risk threshold per WHO.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'INS 635', plain_name: "Disodium 5'-Ribonucleotides", function: 'Flavour enhancer', safety_tier: 'CAUTION', plain_explanation: 'Purine nucleotides; FSSAI-permitted; avoid if prone to high uric acid or gout.', flag_for: ['Gout'], source: 'DB_VERIFIED' },
      { name: 'Salt', plain_name: 'Salt', function: 'Flavour', safety_tier: 'CAUTION', plain_explanation: '820mg sodium per 100g; high for a staple food product.', flag_for: ['Hypertension'], source: 'DB_VERIFIED' },
    ],
    overall_score: 36,
    score_breakdown: [{ label: 'High sodium', impact: -20, explanation: '820mg sodium per 100g.' }, { label: 'Refined flour base', impact: -8, explanation: 'Maida with low fibre.' }, { label: 'Caramel colour & flavour enhancers', impact: -8, explanation: 'Processed additives, not ideal for daily consumption.' }],
    summary: 'Yippee Classic Masala is comparable to Maggi in nutritional profile — high sodium, refined wheat base, and processed masala. Lower saturated fat than Maggi. Not suitable for daily consumption due to high sodium load.',
    india_context: 'FSSAI mandates sodium declaration on all packaged food nutrition labels under the Food Safety and Standards (Labelling and Display) Regulations, 2020.',
    is_upf: true,
    hfss_status: 'HFSS',
    suggestions: [{ type: 'SWAP', name: 'Homemade whole wheat noodles with vegetables', reason: 'Far lower sodium with better fibre and nutritional value.' }],
  },

  // ── SPREADS & CHOCOLATE ────────────────────────────────────────────────────

  {
    product_name: 'Nutella Hazelnut Spread with Cocoa',
    brand: 'Nutella',
    category: 'FOOD',
    nutrition: { energy_kcal: 539, sugar_g: 57, sodium_mg: 41, protein_g: 6, fat_g: 31, saturated_fat_g: 10.6, trans_fat_g: 0, fibre_g: 3 },
    raw_ingredients: ['Sugar', 'Palm Oil', 'Hazelnuts (13%)', 'Cocoa Powder (7.4%)', 'Skimmed Milk Powder', 'Whey Powder', 'Lecithin (Soy)', 'Vanillin'],
    ingredients: [
      { name: 'Sugar', plain_name: 'Sugar', function: 'Sweetener', safety_tier: 'CAUTION', plain_explanation: 'Sugar is the primary ingredient at 57g/100g — extremely high; WHO recommends <12g free sugar per day for adults.', flag_for: ['Diabetes', 'Obesity', 'Dental caries'], source: 'DB_VERIFIED' },
      { name: 'Palm Oil', plain_name: 'Palm Oil', function: 'Fat base', safety_tier: 'CAUTION', plain_explanation: '10.6g saturated fat per 100g from palm oil; ICMR-NIN 2024 recommends capping saturated fat intake.', flag_for: ['Cardiovascular disease'], source: 'DB_VERIFIED' },
      { name: 'Lecithin (Soy)', plain_name: 'Soya Lecithin', function: 'Emulsifier', safety_tier: 'SAFE', plain_explanation: 'FSSAI-permitted emulsifier; generally safe; may concern those with soy allergy.', flag_for: ['Soy allergy'], source: 'DB_VERIFIED' },
      { name: 'Vanillin', plain_name: 'Artificial Vanilla Flavour', function: 'Flavour', safety_tier: 'SAFE', plain_explanation: 'Synthetic vanillin; FSSAI-permitted flavouring; safe at food-grade concentrations.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'Hazelnuts (13%)', plain_name: 'Hazelnuts', function: 'Nut ingredient', safety_tier: 'SAFE', plain_explanation: 'Provides healthy fats and protein; tree nut allergen declaration required by FSSAI.', flag_for: ['Tree nut allergy'], source: 'DB_VERIFIED' },
    ],
    overall_score: 22,
    score_breakdown: [{ label: 'Extremely high sugar', impact: -30, explanation: '57g sugar/100g — highest concern ingredient; sugar is ingredient #1 by weight.' }, { label: 'High saturated fat', impact: -15, explanation: '10.6g saturated fat from palm oil.' }, { label: 'Hazelnuts provide healthy fats', impact: 5, explanation: '13% hazelnuts contribute unsaturated fats and micronutrients.' }, { label: 'No artificial colours or preservatives', impact: 5, explanation: 'Clean from additives.' }],
    summary: "Nutella is primarily a sugar-palm oil product — sugar accounts for 57g per 100g, making it one of the highest-sugar packaged foods sold in India. Despite the hazelnut branding, hazelnuts are only 13% of the product. The high sugar and saturated fat content place it firmly in the HFSS and ultra-processed category.",
    india_context: "FSSAI's draft Front-of-Pack Labelling Regulations, 2022 would require Nutella to carry a 'High in Sugar' and 'High in Saturated Fat' warning label based on its nutritional profile.",
    is_upf: true,
    hfss_status: 'HFSS',
    suggestions: [{ type: 'SWAP', name: 'Natural peanut butter (no added sugar)', reason: 'Higher protein, lower sugar, no palm oil — better fat profile.' }, { type: 'SWAP', name: 'Pure hazelnut butter', reason: 'Delivers the hazelnut taste without excessive sugar and palm oil.' }],
  },

  {
    product_name: 'Amul Butter (Salted)',
    brand: 'Amul',
    category: 'FOOD',
    nutrition: { energy_kcal: 720, sugar_g: 0.1, sodium_mg: 590, protein_g: 0.5, fat_g: 80, saturated_fat_g: 50, trans_fat_g: 0, fibre_g: 0 },
    raw_ingredients: ['Milk Fat', 'Common Salt', 'Permitted Natural Colour (Annatto)'],
    ingredients: [
      { name: 'Milk Fat', plain_name: 'Milk Fat (Cream)', function: 'Base ingredient', safety_tier: 'SAFE', plain_explanation: 'Dairy fat from cow milk; FSSAI-regulated; naturally high in saturated fat (50g/100g).', flag_for: ['Cardiovascular disease (excess consumption)'], source: 'DB_VERIFIED' },
      { name: 'Common Salt', plain_name: 'Salt', function: 'Flavour / preservative', safety_tier: 'CAUTION', plain_explanation: '590mg sodium per 100g; WHO limit is 2000mg/day — important to track with high butter usage.', flag_for: ['Hypertension'], source: 'DB_VERIFIED' },
      { name: 'Annatto', plain_name: 'Annatto (INS 160b)', function: 'Natural colour', safety_tier: 'SAFE', plain_explanation: 'Natural seed extract permitted by FSSAI; no known safety concerns at food-grade levels.', flag_for: [], source: 'DB_VERIFIED' },
    ],
    overall_score: 48,
    score_breakdown: [{ label: 'High saturated fat', impact: -20, explanation: '50g saturated fat per 100g; use in moderation.' }, { label: 'Natural dairy product', impact: 15, explanation: 'Minimal processing; only 3 ingredients, no artificial additives.' }, { label: 'High sodium', impact: -10, explanation: '590mg sodium per 100g.' }],
    summary: 'Amul Butter is a minimally processed dairy product with only 3 ingredients — no artificial colours, preservatives or flavour enhancers. The main concern is very high saturated fat (50g/100g), which should be limited as per ICMR-NIN 2024 dietary guidelines. Suitable for moderate use.',
    india_context: 'FSSAI Food Safety and Standards (Food Products Standards) Regulations 2011, A19.01 specifies minimum 80% milk fat content for butter; Amul complies.',
    is_upf: false,
    hfss_status: 'HFSS',
    suggestions: [{ type: 'SWAP', name: 'Ghee (in moderation)', reason: 'Clarified butter with no sodium and rich in fat-soluble vitamins; traditional Indian fat with a better micronutrient profile.' }],
  },

  // ── CHOCOLATE ──────────────────────────────────────────────────────────────

  {
    product_name: 'Dairy Milk Silk (India)',
    brand: 'Cadbury',
    category: 'FOOD',
    nutrition: { energy_kcal: 534, sugar_g: 57, sodium_mg: 85, protein_g: 7, fat_g: 30, saturated_fat_g: 18, trans_fat_g: 0, fibre_g: 1 },
    raw_ingredients: ['Sugar', 'Milk Solids', 'Cocoa Butter', 'Cocoa Solids', 'Edible Vegetable Fat', 'Emulsifiers (INS 442, INS 476)', 'Artificial Flavour (Vanilla)'],
    ingredients: [
      { name: 'Sugar', plain_name: 'Sugar', function: 'Sweetener', safety_tier: 'CAUTION', plain_explanation: '57g sugar per 100g — sugar is the primary ingredient; exceeds WHO free sugar guidelines for a single serving.', flag_for: ['Diabetes', 'Obesity', 'Dental caries'], source: 'DB_VERIFIED' },
      { name: 'INS 442', plain_name: 'Ammonium Phosphatides', function: 'Emulsifier', safety_tier: 'SAFE', plain_explanation: 'FSSAI-permitted chocolate emulsifier; WHO/EFSA consider it safe at typical food-grade levels.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'INS 476', plain_name: 'PGPR (Polyglycerol Polyricinoleate)', function: 'Emulsifier', safety_tier: 'SAFE', plain_explanation: 'FSSAI-permitted emulsifier used to reduce cocoa butter; EFSA approved at up to 5g/kg in chocolate.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'Cocoa Solids', plain_name: 'Cocoa', function: 'Flavour / antioxidant source', safety_tier: 'SAFE', plain_explanation: 'Source of flavanols with established cardiovascular benefits per WHO/ICMR-NIN; beneficial at ≥70% dark chocolate levels.', flag_for: [], source: 'DB_VERIFIED' },
    ],
    overall_score: 28,
    score_breakdown: [{ label: 'Extremely high sugar', impact: -28, explanation: '57g sugar per 100g; sugar is ingredient #1.' }, { label: 'High saturated fat', impact: -12, explanation: '18g saturated fat per 100g.' }, { label: 'No artificial colours', impact: 5, explanation: 'No synthetic colour additives.' }],
    summary: 'Cadbury Dairy Milk Silk is primarily a sugar-and-fat product with 57g sugar and 18g saturated fat per 100g. While it uses FSSAI-permitted emulsifiers, the high sugar content makes it strictly an occasional treat. The cocoa content is relatively low compared to dark chocolate and provides minimal health benefit at this dilution.',
    india_context: 'FSSAI Food Safety and Standards (Food Products Standards) Regulations, 2011 A17.04 requires milk chocolate to contain a minimum 3.5% milk fat; Dairy Milk Silk complies.',
    is_upf: true,
    hfss_status: 'HFSS',
    suggestions: [{ type: 'SWAP', name: 'Dark chocolate (70%+ cocoa)', reason: 'Far lower sugar, higher flavanol content with proven cardiovascular benefits.' }],
  },

  {
    product_name: 'KitKat (4-Finger, India)',
    brand: 'Nestlé',
    category: 'FOOD',
    nutrition: { energy_kcal: 509, sugar_g: 53, sodium_mg: 75, protein_g: 6, fat_g: 26, saturated_fat_g: 16, trans_fat_g: 0, fibre_g: 1 },
    raw_ingredients: ['Sugar', 'Wheat Flour', 'Cocoa Butter', 'Skimmed Milk Powder', 'Cocoa Mass', 'Vegetable Fat', 'Whey Powder', 'Lactose', 'Emulsifier (INS 322)', 'Raising Agent (INS 503)', 'Salt', 'Artificial Flavour (Vanillin)'],
    ingredients: [
      { name: 'Sugar', plain_name: 'Sugar', function: 'Sweetener', safety_tier: 'CAUTION', plain_explanation: '53g sugar per 100g; far exceeds WHO free-sugar daily limit in a typical 2-finger bar (41.5g).', flag_for: ['Diabetes', 'Obesity', 'Dental caries'], source: 'DB_VERIFIED' },
      { name: 'INS 322', plain_name: 'Soya Lecithin', function: 'Emulsifier', safety_tier: 'SAFE', plain_explanation: 'FSSAI-permitted; safe at food-grade concentrations.', flag_for: ['Soy allergy'], source: 'DB_VERIFIED' },
      { name: 'INS 503', plain_name: 'Ammonium Bicarbonate', function: 'Raising agent', safety_tier: 'SAFE', plain_explanation: 'FSSAI-permitted leavening agent; decomposes during baking — no residue concerns.', flag_for: [], source: 'DB_VERIFIED' },
    ],
    overall_score: 30,
    score_breakdown: [{ label: 'Very high sugar', impact: -25, explanation: '53g sugar per 100g.' }, { label: 'High saturated fat', impact: -12, explanation: '16g saturated fat per 100g.' }, { label: 'Reasonable cocoa content', impact: 4, explanation: 'Contains cocoa mass and cocoa butter.' }],
    summary: 'KitKat India is a high-sugar (53g/100g), high-saturated fat wafer chocolate. Like most milk chocolate, it is classified as HFSS and ultra-processed. The crispy wafer base adds refined carbohydrates. Best treated as an occasional indulgence.',
    india_context: 'FSSAI classifies KitKat under "Chocolate and Chocolate Products" (Category A17); labelling and additive use governed by Food Products Standards and Food Additives Regulations, 2011.',
    is_upf: true,
    hfss_status: 'HFSS',
    suggestions: [{ type: 'SWAP', name: 'Dark chocolate (70%+)', reason: 'Significantly lower sugar with higher antioxidant content.' }],
  },

  // ── BREAKFAST ──────────────────────────────────────────────────────────────

  {
    product_name: 'Kellogg\'s Corn Flakes (India)',
    brand: "Kellogg's",
    category: 'FOOD',
    nutrition: { energy_kcal: 357, sugar_g: 8, sodium_mg: 520, protein_g: 7, fat_g: 1, saturated_fat_g: 0.3, trans_fat_g: 0, fibre_g: 3 },
    raw_ingredients: ['Milled Corn', 'Sugar', 'Salt', 'Barley Malt Flavouring', 'Vitamins & Minerals (Niacin, Iron, Vitamin B6, Riboflavin, Thiamine, Folic Acid, Vitamin D, Vitamin B12)'],
    ingredients: [
      { name: 'Milled Corn', plain_name: 'Corn (Maize)', function: 'Base grain', safety_tier: 'SAFE', plain_explanation: 'FSSAI-compliant cereal base; low fat, moderate carbohydrate.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'Sugar', plain_name: 'Sugar', function: 'Sweetener', safety_tier: 'CAUTION', plain_explanation: '8g sugar per 100g dry — becomes more concentrated per serving. WHO recommends limiting added sugar intake.', flag_for: ['Diabetes'], source: 'DB_VERIFIED' },
      { name: 'Salt', plain_name: 'Salt', function: 'Flavour', safety_tier: 'CAUTION', plain_explanation: '520mg sodium per 100g is surprisingly high for a breakfast cereal; adds to daily sodium load.', flag_for: ['Hypertension'], source: 'DB_VERIFIED' },
      { name: 'Barley Malt Flavouring', plain_name: 'Barley Malt Extract', function: 'Flavour', safety_tier: 'SAFE', plain_explanation: 'Natural malt flavouring; FSSAI-permitted; contains trace gluten from barley.', flag_for: ['Celiac disease', 'Gluten intolerance'], source: 'DB_VERIFIED' },
    ],
    overall_score: 52,
    score_breakdown: [{ label: 'Low fat', impact: 12, explanation: 'Only 1g fat per 100g; good for heart health.' }, { label: 'Fortified with vitamins', impact: 8, explanation: 'Added B-vitamins, iron, vitamin D — beneficial especially for Indian diets.' }, { label: 'High sodium for cereal', impact: -15, explanation: '520mg sodium per 100g — notably high for breakfast food.' }, { label: 'High glycaemic index', impact: -10, explanation: 'Corn flakes have a GI of ~81; not ideal for diabetics or blood sugar management.' }],
    summary: "Kellogg's Corn Flakes India is a low-fat, fortified breakfast cereal but has a high glycaemic index (~81) and surprisingly high sodium (520mg/100g). The added vitamins and minerals are beneficial for Indian consumers who are often deficient in B-vitamins and iron. Best consumed with low-fat milk and fruit, not suitable for diabetics.",
    india_context: "FSSAI Food Safety and Standards (Fortification of Foods) Regulations, 2018 encourages voluntary fortification of staple cereals with iron, folic acid and vitamins; Kellogg's fortification complies.",
    is_upf: true,
    hfss_status: 'GREEN',
    suggestions: [{ type: 'SWAP', name: 'Rolled oats (plain, no added sugar)', reason: 'Lower GI, higher fibre, much lower sodium — better for sustained energy and blood sugar control.' }],
  },

  {
    product_name: 'Quaker Oats (Plain)',
    brand: 'Quaker',
    category: 'FOOD',
    nutrition: { energy_kcal: 379, sugar_g: 1, sodium_mg: 5, protein_g: 13, fat_g: 7, saturated_fat_g: 1, trans_fat_g: 0, fibre_g: 10 },
    raw_ingredients: ['Rolled Oats'],
    ingredients: [
      { name: 'Rolled Oats', plain_name: 'Oats', function: 'Whole grain base', safety_tier: 'SAFE', plain_explanation: 'Whole grain oat; beta-glucan fibre shown to lower LDL cholesterol — EFSA approved health claim; FSSAI-compliant ingredient.', flag_for: ['Celiac disease (if cross-contaminated)'], source: 'DB_VERIFIED' },
    ],
    overall_score: 90,
    score_breakdown: [{ label: 'Single whole-food ingredient', impact: 25, explanation: 'Zero processing; 100% rolled oats.' }, { label: 'Very high fibre (beta-glucan)', impact: 20, explanation: '10g fibre per 100g — far above daily recommended levels per serving.' }, { label: 'High protein', impact: 15, explanation: '13g protein per 100g; above average for cereals.' }, { label: 'Extremely low sodium', impact: 15, explanation: 'Only 5mg sodium per 100g — excellent for hypertension management.' }, { label: 'Low saturated fat', impact: 10, explanation: '1g saturated fat per 100g.' }],
    summary: 'Quaker Plain Rolled Oats is one of the cleanest packaged food options available — a single whole-grain ingredient with 10g fibre, 13g protein, and virtually no sodium. The beta-glucan fibre has an EFSA-approved claim for cholesterol reduction. Ideal breakfast base for all health profiles.',
    india_context: 'FSSAI permits oats-based breakfast cereals under the category of breakfast cereals (Category A12); no additives are present requiring special approval.',
    is_upf: false,
    hfss_status: 'GREEN',
    suggestions: [],
  },

  // ── BEVERAGES ──────────────────────────────────────────────────────────────

  {
    product_name: 'Coca-Cola (India, 250ml Can)',
    brand: 'Coca-Cola',
    category: 'FOOD',
    nutrition: { energy_kcal: 42, sugar_g: 10.6, sodium_mg: 10, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    raw_ingredients: ['Carbonated Water', 'Sugar', 'Caramel Colour (INS 150d)', 'Acidity Regulator (INS 338)', 'Natural Flavours', 'Caffeine'],
    ingredients: [
      { name: 'INS 150d', plain_name: 'Sulphite Ammonia Caramel (Caramel Colour IV)', function: 'Colour', safety_tier: 'CAUTION', plain_explanation: 'FSSAI-permitted in cola drinks; contains 4-MEI which IARC classifies as possibly carcinogenic (Group 2B) at high doses — intake from normal consumption is well below concern thresholds.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'INS 338', plain_name: 'Phosphoric Acid', function: 'Acidity regulator', safety_tier: 'CAUTION', plain_explanation: 'FSSAI-permitted; high phosphoric acid intake linked to reduced bone density per clinical studies; concern at regular high consumption.', flag_for: ['Osteoporosis', 'Kidney disease'], source: 'DB_VERIFIED' },
      { name: 'Caffeine', plain_name: 'Caffeine', function: 'Stimulant', safety_tier: 'CAUTION', plain_explanation: 'FSSAI requires caffeine declaration >150mg/L; 250ml can contains ~24mg caffeine — low but relevant for children and pregnant women.', flag_for: ['Pregnancy', 'Children'], source: 'DB_VERIFIED' },
      { name: 'Sugar', plain_name: 'Sugar', function: 'Sweetener', safety_tier: 'CAUTION', plain_explanation: '10.6g sugar per 100ml; one 250ml can = 26.5g free sugar — more than double the WHO daily limit of 12g.', flag_for: ['Diabetes', 'Obesity', 'Dental caries'], source: 'DB_VERIFIED' },
    ],
    overall_score: 20,
    score_breakdown: [{ label: 'Extremely high sugar', impact: -30, explanation: '10.6g sugar/100ml; one can exceeds WHO free sugar daily limit.' }, { label: 'Phosphoric acid', impact: -8, explanation: 'Associated with reduced bone mineral density at regular consumption.' }, { label: 'Caramel Colour IV', impact: -5, explanation: 'Contains trace 4-MEI; FSSAI permits at regulated levels.' }, { label: 'Zero fat & protein', impact: 5, explanation: 'No fat, no protein — empty calorie drink.' }],
    summary: 'Coca-Cola India delivers 26.5g of free sugar in a single 250ml can — more than double the WHO daily recommendation of 12g. It contains phosphoric acid linked to bone density loss and caramel colour IV (INS 150d) with trace 4-MEI. Classified as HFSS. Not recommended for children, diabetics or pregnant women.',
    india_context: "FSSAI's Food Safety and Standards (Food Products Standards and Food Additives) Regulations require carbonated beverages to declare caffeine content if >150mg/L; Coca-Cola complies with labelling requirements.",
    is_upf: true,
    hfss_status: 'HFSS',
    suggestions: [{ type: 'SWAP', name: 'Plain sparkling water with lemon', reason: 'Zero sugar, same carbonation, no additives.' }, { type: 'SWAP', name: 'Coconut water (fresh or minimally processed)', reason: 'Natural electrolytes, much lower sugar, no artificial additives.' }],
  },

  {
    product_name: 'Frooti Mango Drink',
    brand: 'Parle Agro',
    category: 'FOOD',
    nutrition: { energy_kcal: 54, sugar_g: 13, sodium_mg: 20, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    raw_ingredients: ['Water', 'Sugar', 'Mango Pulp (13%)', 'Acidity Regulator (INS 330)', 'Stabiliser (INS 440)', 'Permitted Synthetic Colour (INS 110)', 'Preservative (INS 211)', 'Added Flavours'],
    ingredients: [
      { name: 'INS 110', plain_name: 'Sunset Yellow FCF', function: 'Synthetic colour', safety_tier: 'CAUTION', plain_explanation: 'Azo dye permitted by FSSAI in beverages; EFSA links it to hyperactivity in children at higher doses.', flag_for: ['ADHD', 'Children'], source: 'DB_VERIFIED' },
      { name: 'INS 211', plain_name: 'Sodium Benzoate', function: 'Preservative', safety_tier: 'CAUTION', plain_explanation: 'FSSAI-permitted preservative; can form benzene with Vitamin C — levels monitored by FSSAI/CDSCO; safe at permitted levels.', flag_for: ['Children (hyperactivity)'], source: 'DB_VERIFIED' },
      { name: 'INS 330', plain_name: 'Citric Acid', function: 'Acidity regulator', safety_tier: 'SAFE', plain_explanation: 'FSSAI-permitted; naturally occurring acid; no safety concerns at food-grade levels.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'INS 440', plain_name: 'Pectin', function: 'Stabiliser', safety_tier: 'SAFE', plain_explanation: 'Natural polysaccharide from fruit; FSSAI-permitted; soluble fibre with no safety concerns.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'Sugar', plain_name: 'Sugar', function: 'Sweetener', safety_tier: 'CAUTION', plain_explanation: '13g sugar per 100ml despite only 13% mango pulp; predominantly added sugar.', flag_for: ['Diabetes', 'Obesity'], source: 'DB_VERIFIED' },
    ],
    overall_score: 25,
    score_breakdown: [{ label: 'Very high sugar', impact: -25, explanation: '13g sugar/100ml; 200ml tetra pack = 26g added sugar.' }, { label: 'Synthetic colour INS 110', impact: -10, explanation: 'Not recommended for children; linked to hyperactivity.' }, { label: 'Sodium benzoate preservative', impact: -8, explanation: 'FSSAI permits; concern for children.' }, { label: 'Low mango content', impact: -5, explanation: 'Only 13% mango pulp — primarily sugar water with flavouring.' }],
    summary: "Frooti is a mango-flavoured sugar drink with only 13% mango pulp. The high sugar content (13g/100ml), artificial colour (Sunset Yellow), and sodium benzoate make it unsuitable for children and diabetics. FSSAI classifies it as a fruit drink (not juice), which requires at least 10% fruit content — Frooti barely meets this threshold.",
    india_context: "FSSAI Food Products Standards and Food Additives Regulations, 2011 defines 'Fruit Drink' as requiring a minimum 10% fruit juice/pulp content; Frooti's 13% mango pulp meets this minimum threshold.",
    is_upf: true,
    hfss_status: 'HFSS',
    suggestions: [{ type: 'SWAP', name: 'Fresh mango lassi (homemade)', reason: 'Real mango, probiotics from curd, no artificial colours or preservatives.' }, { type: 'SWAP', name: '100% fruit juice (no added sugar)', reason: 'Higher fruit content with no artificial additives — but still consume in moderation due to natural sugars.' }],
  },

  // ── COOKING STAPLES ────────────────────────────────────────────────────────

  {
    product_name: 'Aashirvaad Whole Wheat Atta',
    brand: 'Aashirvaad',
    category: 'FOOD',
    nutrition: { energy_kcal: 341, sugar_g: 2, sodium_mg: 3, protein_g: 12, fat_g: 2, saturated_fat_g: 0.3, trans_fat_g: 0, fibre_g: 11 },
    raw_ingredients: ['Whole Wheat'],
    ingredients: [
      { name: 'Whole Wheat', plain_name: 'Whole Wheat Flour', function: 'Whole grain base', safety_tier: 'SAFE', plain_explanation: 'Stone-milled whole wheat with bran and germ intact; FSSAI-compliant; good source of fibre per ICMR-NIN 2024 guidelines.', flag_for: ['Celiac disease', 'Gluten intolerance'], source: 'DB_VERIFIED' },
    ],
    overall_score: 88,
    score_breakdown: [{ label: 'Whole grain single ingredient', impact: 25, explanation: '100% whole wheat with no additives.' }, { label: 'High fibre (11g/100g)', impact: 20, explanation: 'Excellent fibre content supporting digestive health.' }, { label: 'High protein for wheat', impact: 12, explanation: '12g protein per 100g — good for vegetarian diets.' }, { label: 'Near-zero sodium', impact: 15, explanation: 'Only 3mg sodium per 100g.' }],
    summary: 'Aashirvaad Whole Wheat Atta is a clean, single-ingredient product with 11g fibre and 12g protein per 100g. As a whole grain flour, it retains the bran and germ, providing significantly better nutritional value than refined maida. Suitable for all health profiles except those with gluten intolerance.',
    india_context: "FSSAI Food Safety and Standards (Food Products Standards) Regulations, 2011 A2.03 specifies whole wheat flour (atta) must retain the natural bran and germ; Aashirvaad complies.",
    is_upf: false,
    hfss_status: 'GREEN',
    suggestions: [],
  },

  {
    product_name: 'Tata Salt (Iodised)',
    brand: 'Tata',
    category: 'FOOD',
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 38758, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    raw_ingredients: ['Iodised Salt (Sodium Chloride)', 'Potassium Iodate'],
    ingredients: [
      { name: 'Sodium Chloride', plain_name: 'Salt', function: 'Seasoning / mineral source', safety_tier: 'CAUTION', plain_explanation: 'Essential mineral but excessive intake linked to hypertension; WHO recommends <5g salt (<2000mg sodium) per day per person.', flag_for: ['Hypertension', 'Kidney disease', 'Heart failure'], source: 'DB_VERIFIED' },
      { name: 'Potassium Iodate', plain_name: 'Iodine (as Potassium Iodate)', function: 'Iodine fortification', safety_tier: 'SAFE', plain_explanation: 'Mandatory iodisation per FSSAI; prevents iodine deficiency disorders; 15ppm iodate is FSSAI standard.', flag_for: ['Hyperthyroidism (excess iodine)'], source: 'DB_VERIFIED' },
    ],
    overall_score: 75,
    score_breakdown: [{ label: 'FSSAI-mandated iodisation', impact: 20, explanation: 'Iodine fortification prevents deficiency — critical for India.' }, { label: 'Clean label', impact: 10, explanation: 'Only 2 ingredients; no additives or anti-caking agents.' }, { label: 'High sodium by nature', impact: -15, explanation: 'Use in moderation per WHO guidelines (<5g salt/day).' }],
    summary: 'Tata Salt is a clean, minimal-ingredient iodised salt complying with FSSAI mandatory fortification standards (15ppm potassium iodate). The sodium content is inherently high, but this is the nature of salt — the key is moderation in daily use. Iodisation is a significant public health benefit for Indian consumers.',
    india_context: "FSSAI Food Safety and Standards (Fortification of Foods) Regulations, 2018 mandates iodisation of edible salt at 15ppm potassium iodate at production level; Tata Salt complies.",
    is_upf: false,
    hfss_status: 'GREEN',
    suggestions: [],
  },

  // ── PERSONAL CARE ──────────────────────────────────────────────────────────

  {
    product_name: 'Dove Beauty Bar (India)',
    brand: 'Dove',
    category: 'PERSONAL_CARE',
    nutrition: { energy_kcal: null, sugar_g: null, sodium_mg: null, protein_g: null, fat_g: null, saturated_fat_g: null, trans_fat_g: null, fibre_g: null },
    raw_ingredients: ['Sodium Lauroyl Isethionate', 'Stearic Acid', 'Sodium Tallowate', 'Sodium Palmitate', 'Lauric Acid', 'Sodium Isethionate', 'Water', 'Sodium Stearate', 'Cocamidopropyl Betaine', 'Sodium Palm Kernelate', 'Fragrance', 'Sodium Chloride', 'Titanium Dioxide (CI 77891)', 'Tetrasodium EDTA', 'Tetrasodium Etidronate', 'BHT'],
    ingredients: [
      { name: 'Sodium Lauroyl Isethionate', plain_name: 'Mild Surfactant (Sodium Lauroyl Isethionate)', function: 'Cleansing agent', safety_tier: 'SAFE', plain_explanation: 'Mild synthetic surfactant; CDSCO-permitted; gentler than traditional soap surfactants; low irritation potential.', flag_for: [], source: 'LLM_GENERATED' },
      { name: 'Titanium Dioxide (CI 77891)', plain_name: 'Titanium Dioxide', function: 'White colorant / opacifier', safety_tier: 'CAUTION', plain_explanation: 'CDSCO-permitted in cosmetics for topical use; classified as possibly carcinogenic (IARC Group 2B) only when inhaled as nano-particles — topical use on intact skin is considered safe by EFSA and CDSCO.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'BHT', plain_name: 'Butylated Hydroxytoluene', function: 'Antioxidant / preservative', safety_tier: 'CAUTION', plain_explanation: 'Synthetic antioxidant; CDSCO permits in cosmetics; some studies link high oral doses to tumour promotion in animals — topical use at trace cosmetic levels is considered safe.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'Tetrasodium EDTA', plain_name: 'EDTA (Chelating Agent)', function: 'Chelating agent / preservative', safety_tier: 'SAFE', plain_explanation: 'CDSCO-permitted; stabilises formula against metal contamination; not significantly absorbed through skin.', flag_for: [], source: 'LLM_GENERATED' },
      { name: 'Fragrance', plain_name: 'Fragrance (Parfum)', function: 'Scent', safety_tier: 'CAUTION', plain_explanation: 'Undisclosed fragrance blend; common cause of allergic contact dermatitis; CDSCO does not mandate full fragrance ingredient disclosure.', flag_for: ['Fragrance allergy', 'Sensitive skin'], source: 'DB_VERIFIED' },
    ],
    overall_score: 68,
    score_breakdown: [{ label: 'Mild pH-balanced formula', impact: 15, explanation: 'Gentler surfactant system than traditional soaps; suitable for sensitive skin.' }, { label: 'Undisclosed fragrance', impact: -10, explanation: 'Fragrance blend not fully disclosed; allergen risk for sensitive individuals.' }, { label: 'BHT preservative', impact: -5, explanation: 'Synthetic antioxidant with minor concern; safe at cosmetic-grade levels.' }, { label: 'Titanium dioxide', impact: -5, explanation: 'Safe topically; note IARC 2B classification for inhalation only.' }],
    summary: 'Dove Beauty Bar uses a milder surfactant system than conventional soap, making it gentler for daily face and body use. The main concerns are undisclosed fragrance (a top allergen) and trace BHT. Titanium dioxide is safe for topical application per CDSCO guidelines. Suitable for most skin types; caution for fragrance-sensitive skin.',
    india_context: "CDSCO regulates cosmetics under the Drugs and Cosmetics Act, 1940; Schedule S lists permissible cosmetic ingredients. Dove Beauty Bar's ingredients comply with current Schedule S provisions.",
    is_upf: false,
    hfss_status: 'GREEN',
    suggestions: [{ type: 'SWAP', name: 'Fragrance-free gentle cleansing bar', reason: 'Eliminates the top allergen (fragrance) for sensitive or eczema-prone skin.' }],
  },

  {
    product_name: 'Himalaya Neem Face Wash',
    brand: 'Himalaya',
    category: 'PERSONAL_CARE',
    nutrition: { energy_kcal: null, sugar_g: null, sodium_mg: null, protein_g: null, fat_g: null, saturated_fat_g: null, trans_fat_g: null, fibre_g: null },
    raw_ingredients: ['Neem (Azadirachta Indica) Extract', 'Turmeric (Curcuma Longa) Extract', 'Sodium Laureth Sulfate', 'Cocamidopropyl Betaine', 'Glycerin', 'PEG-120 Methyl Glucose Dioleate', 'Sodium Chloride', 'Citric Acid', 'Methylparaben', 'Propylparaben', 'Fragrance'],
    ingredients: [
      { name: 'Neem (Azadirachta Indica) Extract', plain_name: 'Neem Leaf Extract', function: 'Antibacterial botanical', safety_tier: 'SAFE', plain_explanation: 'Traditional Ayurvedic antibacterial ingredient; CDSCO permits neem extract in topical formulations; established antimicrobial activity in peer-reviewed studies.', flag_for: [], source: 'LLM_GENERATED' },
      { name: 'Sodium Laureth Sulfate', plain_name: 'SLES (Sodium Laureth Sulfate)', function: 'Primary surfactant / foaming agent', safety_tier: 'CAUTION', plain_explanation: 'CDSCO-permitted surfactant; can strip skin barrier with frequent use; milder than SLS but can irritate sensitive or compromised skin with daily over-use.', flag_for: ['Sensitive skin', 'Eczema'], source: 'DB_VERIFIED' },
      { name: 'Methylparaben', plain_name: 'Methylparaben', function: 'Preservative', safety_tier: 'CAUTION', plain_explanation: 'CDSCO-permitted paraben preservative; EU Cosmetics Regulation and CDSCO allow methylparaben in rinse-off products; no conclusive evidence of endocrine disruption at cosmetic-use levels per EFSA 2023 review.', flag_for: ['Hormone-sensitive conditions (precautionary)'], source: 'DB_VERIFIED' },
      { name: 'Propylparaben', plain_name: 'Propylparaben', function: 'Preservative', safety_tier: 'CAUTION', plain_explanation: 'CDSCO-permitted; propylparaben has weak estrogenic activity in in-vitro studies; SCCS 2023 concludes it is safe at permitted concentrations for rinse-off products.', flag_for: ['Hormone-sensitive conditions (precautionary)'], source: 'DB_VERIFIED' },
      { name: 'Glycerin', plain_name: 'Glycerine', function: 'Humectant / moisturiser', safety_tier: 'SAFE', plain_explanation: 'CDSCO-permitted skin humectant; excellent safety profile; helps maintain skin moisture barrier.', flag_for: [], source: 'DB_VERIFIED' },
    ],
    overall_score: 62,
    score_breakdown: [{ label: 'Effective botanical actives', impact: 15, explanation: 'Neem and turmeric with established antimicrobial and anti-inflammatory activity.' }, { label: 'Parabens present', impact: -12, explanation: 'Methylparaben and propylparaben; safe per CDSCO but some consumers prefer paraben-free.' }, { label: 'SLES surfactant', impact: -8, explanation: 'Can irritate sensitive or dry skin with daily use.' }, { label: 'Glycerin as moisturiser', impact: 8, explanation: 'Helps offset drying effect of surfactants.' }],
    summary: 'Himalaya Neem Face Wash combines neem and turmeric extracts with established antibacterial properties, making it effective for oily and acne-prone skin. It contains parabens (methylparaben and propylparaben) which are CDSCO-permitted and considered safe by SCCS 2023, but consumers who prefer paraben-free products should note this. The SLES surfactant may be drying for sensitive skin types.',
    india_context: "CDSCO regulates face wash under the Cosmetics category of the Drugs and Cosmetics Act, 1940. Himalaya's Ayurvedic formulation also complies with the Drugs and Cosmetics (Ayurveda) Schedule T provisions.",
    is_upf: false,
    hfss_status: 'GREEN',
    suggestions: [{ type: 'SWAP', name: 'Paraben-free neem-based face wash', reason: 'Same botanical benefits without parabens for those who prefer it.' }],
  },

  {
    product_name: 'Colgate Strong Teeth Toothpaste',
    brand: 'Colgate',
    category: 'PERSONAL_CARE',
    nutrition: { energy_kcal: null, sugar_g: null, sodium_mg: null, protein_g: null, fat_g: null, saturated_fat_g: null, trans_fat_g: null, fibre_g: null },
    raw_ingredients: ['Calcium Carbonate', 'Water', 'Sorbitol', 'Sodium Lauryl Sulfate', 'Sodium Monofluorophosphate (1000 ppm Fluoride)', 'Hydrated Silica', 'Sodium Saccharin', 'Cellulose Gum', 'Titanium Dioxide', 'Sodium Benzoate', 'Flavour'],
    ingredients: [
      { name: 'Sodium Monofluorophosphate', plain_name: 'Fluoride (Sodium Monofluorophosphate)', function: 'Active cavity prevention agent', safety_tier: 'SAFE', plain_explanation: '1000ppm fluoride is the CDSCO and WHO recommended concentration for adult toothpaste; evidence-based caries prevention agent.', flag_for: ['Children under 6 (fluorosis risk — use pea-sized amount only)'], source: 'DB_VERIFIED' },
      { name: 'Sodium Lauryl Sulfate', plain_name: 'SLS (Sodium Lauryl Sulfate)', function: 'Foaming agent / surfactant', safety_tier: 'CAUTION', plain_explanation: 'CDSCO permits SLS in toothpaste; some studies link SLS to increased frequency of aphthous ulcers (canker sores) in sensitive individuals.', flag_for: ['Recurrent mouth ulcers'], source: 'DB_VERIFIED' },
      { name: 'Sodium Saccharin', plain_name: 'Saccharin', function: 'Sweetener (non-nutritive)', safety_tier: 'SAFE', plain_explanation: 'CDSCO-permitted sweetener in oral care; not ingested in significant quantities; WHO confirms safety at typical toothpaste exposure.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'Calcium Carbonate', plain_name: 'Calcium Carbonate', function: 'Abrasive / polishing agent', safety_tier: 'SAFE', plain_explanation: 'CDSCO-permitted abrasive; mild polishing agent that helps remove surface stains without damaging enamel.', flag_for: [], source: 'DB_VERIFIED' },
    ],
    overall_score: 78,
    score_breakdown: [{ label: 'WHO-recommended fluoride concentration', impact: 25, explanation: '1000ppm fluoride — proven caries prevention.' }, { label: 'SLS may trigger mouth ulcers', impact: -10, explanation: 'Identified concern for ulcer-prone individuals.' }, { label: 'Effective abrasive system', impact: 10, explanation: 'Calcium carbonate provides gentle polishing.' }, { label: 'No parabens', impact: 8, explanation: 'Uses sodium benzoate as preservative instead of parabens.' }],
    summary: "Colgate Strong Teeth contains 1000ppm fluoride — the WHO and CDSCO recommended level for adult cavity prevention. It is an effective, affordable toothpaste with a proven track record. The SLS surfactant may trigger mouth ulcers in sensitive individuals; SLS-free alternatives exist. Children under 6 should use only a pea-sized amount to prevent fluorosis.",
    india_context: "CDSCO regulates toothpaste as a cosmetic under the Drugs and Cosmetics Act, 1940; the permitted fluoride level for toothpaste is 1000-1500ppm per Schedule S.",
    is_upf: false,
    hfss_status: 'GREEN',
    suggestions: [{ type: 'SWAP', name: 'SLS-free toothpaste with fluoride', reason: 'Same fluoride protection without the surfactant that triggers mouth ulcers.' }],
  },

  // ── DAIRY ──────────────────────────────────────────────────────────────────

  {
    product_name: 'Amul Gold Full Cream Milk (Tetra Pack)',
    brand: 'Amul',
    category: 'FOOD',
    nutrition: { energy_kcal: 61, sugar_g: 4.6, sodium_mg: 44, protein_g: 3.2, fat_g: 3.5, saturated_fat_g: 2.2, trans_fat_g: 0, fibre_g: 0 },
    raw_ingredients: ['Standardised Full Cream Milk', 'Vitamins A & D3'],
    ingredients: [
      { name: 'Standardised Full Cream Milk', plain_name: 'Pasteurised Full Cream Milk', function: 'Dairy base', safety_tier: 'SAFE', plain_explanation: 'FSSAI-regulated UHT pasteurised milk meeting Food Products Standards Regulation A19 criteria.', flag_for: ['Lactose intolerance', 'Milk allergy'], source: 'DB_VERIFIED' },
      { name: 'Vitamin A', plain_name: 'Vitamin A (Retinyl Palmitate)', function: 'Fortification', safety_tier: 'SAFE', plain_explanation: "FSSAI's fortification regulations mandate Vitamin A addition to packaged milk; supports vision and immunity per ICMR-NIN.", flag_for: [], source: 'DB_VERIFIED' },
      { name: 'Vitamin D3', plain_name: 'Vitamin D3 (Cholecalciferol)', function: 'Fortification', safety_tier: 'SAFE', plain_explanation: "FSSAI mandates Vitamin D3 fortification in milk; critical for calcium absorption; addresses widespread Indian vitamin D deficiency per ICMR-NIN 2024.", flag_for: [], source: 'DB_VERIFIED' },
    ],
    overall_score: 85,
    score_breakdown: [{ label: 'Complete protein with all essential amino acids', impact: 20, explanation: '3.2g protein per 100ml including all essential amino acids.' }, { label: 'Mandatory A+D fortification', impact: 15, explanation: 'Addresses two major Indian deficiencies.' }, { label: 'Minimal ingredients', impact: 15, explanation: 'Just milk and vitamins — nothing else.' }, { label: 'Moderate saturated fat', impact: -5, explanation: '2.2g saturated fat per 100ml — acceptable in normal portions.' }],
    summary: 'Amul Gold Full Cream Milk is a minimally processed dairy product fortified with Vitamins A and D3 per FSSAI mandates. It provides complete protein with all essential amino acids, calcium, and phosphorus. Suitable for all ages; those with lactose intolerance should opt for lactose-free alternatives.',
    india_context: 'FSSAI Food Safety and Standards (Fortification of Foods) Regulations, 2018 mandate Vitamin A (1500 IU/L) and Vitamin D3 (400 IU/L) fortification in packaged milk; Amul Gold complies.',
    is_upf: false,
    hfss_status: 'GREEN',
    suggestions: [],
  },

  // ── SAUCES & CONDIMENTS ────────────────────────────────────────────────────

  {
    product_name: 'Maggi Hot & Sweet Tomato Chilli Sauce',
    brand: 'Maggi',
    category: 'FOOD',
    nutrition: { energy_kcal: 128, sugar_g: 28, sodium_mg: 1150, protein_g: 1, fat_g: 0.3, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 1 },
    raw_ingredients: ['Tomatoes', 'Sugar', 'Water', 'Chilli', 'Salt', 'Thickener (INS 1422)', 'Acidity Regulator (INS 260)', 'Preservatives (INS 211, INS 202)', 'Spices', 'Artificial Flavour'],
    ingredients: [
      { name: 'Sugar', plain_name: 'Sugar', function: 'Sweetener', safety_tier: 'CAUTION', plain_explanation: '28g sugar per 100g — sugar is the second largest ingredient after tomatoes; a tablespoon (15g) provides ~4g sugar.', flag_for: ['Diabetes', 'Obesity'], source: 'DB_VERIFIED' },
      { name: 'INS 1422', plain_name: 'Acetylated Distarch Adipate', function: 'Thickener', safety_tier: 'SAFE', plain_explanation: 'Modified starch thickener; FSSAI-permitted; not digestible — used for texture, no safety concerns.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'INS 211', plain_name: 'Sodium Benzoate', function: 'Preservative', safety_tier: 'CAUTION', plain_explanation: 'FSSAI-permitted; may form trace benzene with Vitamin C; safe at permitted levels in FSSAI regulations.', flag_for: ['Children (hyperactivity risk at high doses)'], source: 'DB_VERIFIED' },
      { name: 'INS 202', plain_name: 'Potassium Sorbate', function: 'Preservative', safety_tier: 'SAFE', plain_explanation: 'FSSAI-permitted broad-spectrum preservative; considered safe by WHO/EFSA at permitted food-grade levels.', flag_for: [], source: 'DB_VERIFIED' },
      { name: 'Salt', plain_name: 'Salt', function: 'Flavour / preservative', safety_tier: 'CAUTION', plain_explanation: '1150mg sodium per 100g — very high; a typical 2-tablespoon serving provides ~345mg sodium.', flag_for: ['Hypertension', 'Kidney disease'], source: 'DB_VERIFIED' },
    ],
    overall_score: 30,
    score_breakdown: [{ label: 'Extremely high sodium', impact: -25, explanation: '1150mg sodium per 100g — nearly 60% of WHO daily limit in 100g.' }, { label: 'High sugar', impact: -18, explanation: '28g sugar per 100g; significant even in condiment portions.' }, { label: 'Sodium benzoate + vitamin C risk', impact: -5, explanation: 'Benzene formation risk (low) per FSSAI monitoring.' }, { label: 'Tomato base', impact: 5, explanation: 'Real tomato is the primary ingredient; provides lycopene.' }],
    summary: 'Maggi Hot & Sweet Sauce has 1150mg sodium and 28g sugar per 100g — among the highest of any condiment. Even a 2-tablespoon serving provides significant sodium and sugar. Contains sodium benzoate preservative and a modified starch thickener. Use sparingly — not suitable for diabetics or hypertension patients.',
    india_context: 'FSSAI Food Safety and Standards Regulations permit sodium benzoate (INS 211) in sauces at up to 250mg/kg; potassium sorbate (INS 202) at up to 500mg/kg.',
    is_upf: true,
    hfss_status: 'HFSS',
    suggestions: [{ type: 'SWAP', name: 'Homemade tomato-chilli chutney', reason: 'Much lower sodium and no preservatives; freshness adds flavour without additives.' }],
  },

  // ── PROTEIN / HEALTH ──────────────────────────────────────────────────────

  {
    product_name: 'Horlicks Original (India)',
    brand: 'Horlicks',
    category: 'FOOD',
    nutrition: { energy_kcal: 376, sugar_g: 32, sodium_mg: 290, protein_g: 14, fat_g: 6, saturated_fat_g: 3, trans_fat_g: 0, fibre_g: 2 },
    raw_ingredients: ['Wheat Flour', 'Malt Extract (Barley)', 'Skimmed Milk Powder', 'Sugar', 'Minerals (Calcium, Iron, Zinc, Iodine)', 'Vitamins (B1, B2, B3, B6, B12, C, D3)', 'Salt', 'Vanilla Flavour'],
    ingredients: [
      { name: 'Sugar', plain_name: 'Sugar', function: 'Sweetener', safety_tier: 'CAUTION', plain_explanation: '32g sugar per 100g dry powder; a 27g serving provides ~8.6g sugar — significant for a product marketed for children.', flag_for: ['Diabetes', 'Obesity'], source: 'DB_VERIFIED' },
      { name: 'Malt Extract (Barley)', plain_name: 'Barley Malt Extract', function: 'Flavour / carbohydrate source', safety_tier: 'SAFE', plain_explanation: 'Traditional malt ingredient; contains trace gluten from barley; FSSAI-permitted natural extract.', flag_for: ['Celiac disease', 'Gluten intolerance'], source: 'DB_VERIFIED' },
      { name: 'Skimmed Milk Powder', plain_name: 'Skimmed Milk Powder', function: 'Protein / calcium source', safety_tier: 'SAFE', plain_explanation: 'FSSAI-regulated dairy ingredient; provides calcium and protein; allergen declaration required.', flag_for: ['Milk allergy', 'Lactose intolerance'], source: 'DB_VERIFIED' },
    ],
    overall_score: 50,
    score_breakdown: [{ label: 'High sugar for health drink', impact: -20, explanation: '32g sugar per 100g contradicts its health positioning.' }, { label: 'Good micronutrient fortification', impact: 15, explanation: 'Vitamins and minerals address common Indian deficiencies.' }, { label: 'Decent protein from milk solids', impact: 10, explanation: '14g protein per 100g dry powder.' }, { label: 'Barley malt — gluten present', impact: -5, explanation: 'Not suitable for gluten intolerant.' }],
    summary: "Horlicks provides useful micronutrient fortification (iron, calcium, Vitamins B12, D3) that addresses common Indian deficiencies, but contains 32g sugar per 100g dry weight — a significant amount for a product consumed daily by children. It scores better than most ultra-processed beverages due to its fortification, but the sugar content is a meaningful concern.",
    india_context: 'FSSAI issued a directive in 2023 requiring health drink products to remove claims like "Taller, Stronger, Sharper" unless clinically substantiated; GSK (now Unilever) modified Horlicks packaging accordingly.',
    is_upf: true,
    hfss_status: 'HFSS',
    suggestions: [{ type: 'SWAP', name: 'Plain whole milk with banana', reason: 'Natural protein, calcium and potassium without added sugar or processed additives.' }],
  },

  // ── OILS ──────────────────────────────────────────────────────────────────

  {
    product_name: 'Fortune Refined Sunflower Oil',
    brand: 'Fortune',
    category: 'FOOD',
    nutrition: { energy_kcal: 900, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 100, saturated_fat_g: 11, trans_fat_g: 0, fibre_g: 0 },
    raw_ingredients: ['Refined Sunflower Oil'],
    ingredients: [
      { name: 'Refined Sunflower Oil', plain_name: 'Refined Sunflower Oil', function: 'Cooking oil', safety_tier: 'CAUTION', plain_explanation: 'High in omega-6 linoleic acid; ICMR-NIN 2024 recommends balanced omega-6:omega-3 ratio; excessive omega-6 without omega-3 counterbalance may promote inflammation.', flag_for: ['Inflammatory conditions (excess consumption)'], source: 'DB_VERIFIED' },
    ],
    overall_score: 60,
    score_breakdown: [{ label: 'Single ingredient', impact: 15, explanation: 'No additives or preservatives.' }, { label: 'Low saturated fat vs coconut/palm oil', impact: 15, explanation: '11g saturated fat vs 86g in coconut oil.' }, { label: 'High omega-6 PUFA', impact: -10, explanation: 'May worsen omega-6:omega-3 imbalance in Indian diets already high in omega-6.' }, { label: 'Not suitable for very high heat', impact: -5, explanation: 'Lower smoke point than ghee; produces some aldehydes when repeatedly reheated.' }],
    summary: 'Fortune Sunflower Oil is a refined single-ingredient cooking oil with low saturated fat. It is high in omega-6 polyunsaturated fatty acids (linoleic acid), which ICMR-NIN 2024 suggests should be balanced with adequate omega-3 intake. Best used at medium heat; avoid repeated high-temperature frying.',
    india_context: 'FSSAI Food Safety and Standards (Food Products Standards) Regulations, 2011 A5.01 specifies minimum purity standards for refined vegetable oils; Fortune Sunflower Oil complies.',
    is_upf: false,
    hfss_status: 'GREEN',
    suggestions: [{ type: 'SWAP', name: 'Cold-pressed mustard oil or extra virgin olive oil', reason: 'Better omega-6:omega-3 ratio; mustard oil is traditional to Indian cooking and FSSAI-permitted.' }],
  },

];

// ── Seed runner ────────────────────────────────────────────────────────────────
async function seed() {
  initAdmin();
  const db = getDb();

  console.log(`\n🌱 Seeding ${PRODUCTS.length} products to Firestore (DB: ${DB_ID})\n`);

  // Firestore batch limit = 500 writes
  const BATCH_SIZE = 499;
  let batchCount = 0;
  let batch = db.batch();
  let ops = 0;

  for (const p of PRODUCTS) {
    const docId = makeDocId(p.product_name, p.brand);
    const aliases = makeAliases(p.product_name, p.brand);

    const doc = {
      product_name: p.product_name,
      brand: p.brand,
      category: p.category,
      name_aliases: aliases,
      ingredients_list: p.raw_ingredients,
      nutrition: p.nutrition,
      front_claims: [],
      cached_verdict: {
        product_name: p.product_name,
        brand: p.brand,
        category: p.category,
        nutrition: p.nutrition,
        overall_score: p.overall_score,
        score_breakdown: p.score_breakdown,
        summary: p.summary,
        india_context: p.india_context,
        is_upf: p.is_upf,
        hfss_status: p.hfss_status,
        suggestions: p.suggestions,
        ingredients: p.ingredients,
        claim_checks: [],
        front_claims_detected: [],
        unverified_ingredients: [],
      },
      verdict_computed_at: Timestamp.now(),
      data_source: 'VERIFIED',
      needs_reverification: false,
    };

    const ref = db.collection('products').doc(docId);
    batch.set(ref, doc, { merge: false }); // full overwrite for seed data
    ops++;

    if (ops >= BATCH_SIZE) {
      await batch.commit();
      batchCount++;
      console.log(`  ✅ Committed batch ${batchCount} (${ops} ops)`);
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
    batchCount++;
    console.log(`  ✅ Committed batch ${batchCount} (${ops} ops)`);
  }

  console.log(`\n✅ Done! ${PRODUCTS.length} products seeded across ${batchCount} batch(es).\n`);
  console.log('Products seeded:');
  PRODUCTS.forEach(p => console.log(`  • ${p.brand} — ${p.product_name}`));
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message || err);
  process.exit(1);
});
