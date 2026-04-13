// src/data/ingredientIntelligence.ts
// ─────────────────────────────────────────────────────────────────────────────
// VERIFIED ingredient intelligence database.
// Sources: FSSAI Schedule I, ICMR-NIN 2024, CDSCO Cosmetics Rules 2020,
//          EFSA Opinions, EWG Skin Deep.
// Safety tiers: SAFE | CAUTION | AVOID | BANNED_IN_INDIA | UNVERIFIED
// ─────────────────────────────────────────────────────────────────────────────

export type SafetyTier = 'SAFE' | 'CAUTION' | 'AVOID' | 'BANNED_IN_INDIA' | 'UNVERIFIED';

export interface ConditionFlag {
  condition: string;       // 'diabetes' | 'children' | 'thyroid' | 'pregnancy' | 'hypertension'
  impact: 'HIGH' | 'MODERATE' | 'LOW' | 'POSITIVE';
  reason: string;          // one plain sentence
  source: string;          // e.g. "EFSA 2009", "ICMR-NIN 2024"
}

export interface IngredientEntry {
  ins_number: string | null;
  common_names: string[];          // all aliases, lowercase
  function: string;
  safety_tier: SafetyTier;
  fssai_status: 'PERMITTED' | 'RESTRICTED' | 'PROHIBITED' | 'NOT_APPLICABLE' | 'UNKNOWN';
  condition_flags: ConditionFlag[];
  plain_explanation: string;       // pre-written, used directly in UI
  india_specific_note: string | null;
  score_impact: number;            // negative = deduction, positive = addition
  data_quality: 'VERIFIED' | 'PARTIAL' | 'LLM_GENERATED';
}

export const INGREDIENT_DB: Record<string, IngredientEntry> = {

  // ── ARTIFICIAL COLOURS ──────────────────────────────────────────────────────

  "ins_102": {
    ins_number: "102",
    common_names: ["ins 102", "tartrazine", "yellow 5", "food yellow 4", "fd&c yellow 5", "e102"],
    function: "Artificial Colour",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "children", impact: "HIGH", reason: "EFSA 2009 linked to hyperactivity in children when consumed above 1mg/kg body weight", source: "EFSA Opinion EFSA-Q-2007-306" },
      { condition: "asthma", impact: "MODERATE", reason: "May trigger asthma symptoms in sensitive individuals", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "A synthetic yellow dye made from petroleum. Permitted by FSSAI but European regulators require a warning label for children's products. Common in Indian namkeens, soft drinks, and children's snacks.",
    india_specific_note: "Extremely common in Indian snacks, mithai, and soft drinks. Parents of children under 12 should check for this.",
    score_impact: -6,
    data_quality: "VERIFIED"
  },

  "ins_110": {
    ins_number: "110",
    common_names: ["ins 110", "sunset yellow", "orange yellow s", "fd&c yellow 6", "e110"],
    function: "Artificial Colour",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "children", impact: "HIGH", reason: "Part of the 'Southampton Six' artificial colours linked to hyperactivity in children", source: "FSA UK 2007 Southampton Study" },
      { condition: "asthma", impact: "MODERATE", reason: "Cross-reactivity with aspirin sensitivity reported", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "A synthetic orange-yellow dye. One of six colours the UK Food Standards Agency recommends parents avoid for children under 12.",
    india_specific_note: "Found in many Indian packaged sweets, drinks, and confectionery.",
    score_impact: -6,
    data_quality: "VERIFIED"
  },

  "ins_129": {
    ins_number: "129",
    common_names: ["ins 129", "allura red", "red 40", "fd&c red 40", "e129"],
    function: "Artificial Colour",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "children", impact: "HIGH", reason: "Part of Southampton Six — linked to hyperactivity; EU requires warning label", source: "EFSA 2009" }
    ],
    plain_explanation: "A red synthetic dye. One of the most common artificial colours in packaged food. EU requires products containing it to carry a warning for children.",
    india_specific_note: "Very common in Indian fruit drinks, jellies, and confectionery. No warning label required in India currently.",
    score_impact: -6,
    data_quality: "VERIFIED"
  },

  "ins_122": {
    ins_number: "122",
    common_names: ["ins 122", "azorubine", "carmoisine", "red 3", "e122"],
    function: "Artificial Colour",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "children", impact: "HIGH", reason: "Southampton Six colour — linked to hyperactivity in children", source: "EFSA 2009" }
    ],
    plain_explanation: "A red synthetic azo dye. Part of the Southampton Six group of colours that EU regulators flag for child hyperactivity.",
    india_specific_note: null,
    score_impact: -6,
    data_quality: "VERIFIED"
  },

  "ins_124": {
    ins_number: "124",
    common_names: ["ins 124", "ponceau 4r", "cochineal red a", "e124"],
    function: "Artificial Colour",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "children", impact: "HIGH", reason: "Southampton Six — EU mandatory warning for hyperactivity in children", source: "EFSA 2009" }
    ],
    plain_explanation: "Synthetic red dye. One of the six colours that prompted EU mandatory child warnings after the Southampton study.",
    india_specific_note: null,
    score_impact: -6,
    data_quality: "VERIFIED"
  },

  "ins_133": {
    ins_number: "133",
    common_names: ["ins 133", "brilliant blue", "fd&c blue 1", "e133"],
    function: "Artificial Colour",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "children", impact: "MODERATE", reason: "Synthetic dye; limited long-term safety data for children", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "A synthetic blue dye used in confectionery, soft drinks, and snacks. Limited safety research compared to natural alternatives.",
    india_specific_note: null,
    score_impact: -4,
    data_quality: "VERIFIED"
  },

  // ── PRESERVATIVES ───────────────────────────────────────────────────────────

  "ins_211": {
    ins_number: "211",
    common_names: ["ins 211", "sodium benzoate", "e211", "benzoic acid sodium salt"],
    function: "Preservative",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "children", impact: "HIGH", reason: "When combined with Vitamin C (ascorbic acid), can form benzene — a known carcinogen. Common combination in soft drinks.", source: "WHO 2000 Benzene in Beverages" },
      { condition: "asthma", impact: "MODERATE", reason: "May trigger or worsen asthma and urticaria in sensitive individuals", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "A very common preservative. Generally safe in small amounts, but reacts with Vitamin C to produce benzene. Check if this product also contains ascorbic acid.",
    india_specific_note: "Present in most Indian packaged drinks, sauces, and pickles. Often appears alongside Vitamin C — that combination should be avoided.",
    score_impact: -5,
    data_quality: "VERIFIED"
  },

  "ins_220": {
    ins_number: "220",
    common_names: ["ins 220", "sulphur dioxide", "sulfur dioxide", "e220"],
    function: "Preservative / Antioxidant",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "asthma", impact: "HIGH", reason: "Known asthma trigger — FSSAI mandates declaration on label", source: "FSSAI Food Safety and Standards Regulations 2011" },
      { condition: "children", impact: "MODERATE", reason: "Can destroy Vitamin B1 (thiamine) — important for children's development", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "A preservative used in dried fruits, wine, and fruit juices. A known asthma trigger — FSSAI requires it to be declared on labels.",
    india_specific_note: "Common in dried fruits, fruit juices, and Indian mithai. People with asthma should avoid products containing this.",
    score_impact: -6,
    data_quality: "VERIFIED"
  },

  "ins_202": {
    ins_number: "202",
    common_names: ["ins 202", "potassium sorbate", "e202"],
    function: "Preservative",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [],
    plain_explanation: "A widely used preservative considered safe at normal food levels. Inhibits mould and yeast growth. One of the better-tolerated preservatives.",
    india_specific_note: null,
    score_impact: -2,
    data_quality: "VERIFIED"
  },

  "ins_210": {
    ins_number: "210",
    common_names: ["ins 210", "benzoic acid", "e210"],
    function: "Preservative",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "children", impact: "HIGH", reason: "Converted to sodium benzoate in body; reacts with Vitamin C to form benzene", source: "WHO 2000" },
      { condition: "asthma", impact: "MODERATE", reason: "May trigger asthma and allergic reactions", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "A preservative closely related to sodium benzoate. Same concerns apply — especially when combined with Vitamin C.",
    india_specific_note: null,
    score_impact: -5,
    data_quality: "VERIFIED"
  },

  "ins_282": {
    ins_number: "282",
    common_names: ["ins 282", "calcium propionate", "e282"],
    function: "Preservative",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "children", impact: "MODERATE", reason: "Animal studies link high doses to behaviour changes; used in most commercial breads", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "A mould inhibitor used in bread and bakery products. Generally regarded as safe, but some research suggests possible behavioural effects in children at high doses.",
    india_specific_note: "Present in most commercial bread sold in India.",
    score_impact: -3,
    data_quality: "VERIFIED"
  },

  // ── FLAVOUR ENHANCERS ───────────────────────────────────────────────────────

  "ins_621": {
    ins_number: "621",
    common_names: ["ins 621", "msg", "monosodium glutamate", "ajinomoto", "e621", "sodium glutamate"],
    function: "Flavour Enhancer",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "hypertension", impact: "MODERATE", reason: "High sodium content contributes to total daily sodium intake", source: "ICMR-NIN 2024" },
      { condition: "children", impact: "LOW", reason: "High doses may cause transient symptoms in sensitive individuals; safe at normal food levels per FSSAI", source: "FSSAI" }
    ],
    plain_explanation: "Monosodium glutamate — a flavour enhancer that makes food taste savoury. Considered safe by FSSAI and WHO at normal food levels, though some people report sensitivity. Adds to total sodium load.",
    india_specific_note: "Extremely common in Indian instant noodles, chips, and restaurant food. Marketed as 'Ajinomoto' in India.",
    score_impact: -4,
    data_quality: "VERIFIED"
  },

  "ins_627": {
    ins_number: "627",
    common_names: ["ins 627", "disodium guanylate", "sodium guanylate", "e627"],
    function: "Flavour Enhancer",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "gout", impact: "HIGH", reason: "Purine-based compound — can trigger gout attacks", source: "ICMR-NIN 2024" },
      { condition: "children", impact: "LOW", reason: "Not recommended for infants under 12 weeks", source: "FSSAI" }
    ],
    plain_explanation: "A flavour enhancer often used with MSG. Made from fish or yeast. People with gout should avoid this as it's purine-based.",
    india_specific_note: "Common in chips and instant snacks. Usually appears alongside INS 621.",
    score_impact: -3,
    data_quality: "VERIFIED"
  },

  "ins_631": {
    ins_number: "631",
    common_names: ["ins 631", "disodium inosinate", "sodium inosinate", "e631"],
    function: "Flavour Enhancer",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "gout", impact: "HIGH", reason: "Purine-based — same concern as INS 627 for gout sufferers", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "A flavour enhancer typically paired with INS 621 and 627. Often derived from meat or fish. People with gout or uric acid issues should avoid.",
    india_specific_note: null,
    score_impact: -3,
    data_quality: "VERIFIED"
  },

  // ── SWEETENERS ──────────────────────────────────────────────────────────────

  "ins_951": {
    ins_number: "951",
    common_names: ["ins 951", "aspartame", "e951", "nutrasweet", "equal"],
    function: "Artificial Sweetener",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "phenylketonuria", impact: "HIGH", reason: "Contains phenylalanine — dangerous for people with PKU. FSSAI mandates label warning.", source: "FSSAI Schedule II" },
      { condition: "pregnancy", impact: "MODERATE", reason: "WHO IARC classified as 'possibly carcinogenic' (Group 2B) in 2023 — precautionary avoidance during pregnancy advised", source: "IARC/WHO 2023" }
    ],
    plain_explanation: "A common artificial sweetener, ~200x sweeter than sugar. FSSAI requires a warning for people with phenylketonuria. WHO classified it as 'possibly carcinogenic' in 2023 — the science is still evolving.",
    india_specific_note: "Widely used in Indian diet cola drinks, sugar-free products, and 'healthy' snacks.",
    score_impact: -5,
    data_quality: "VERIFIED"
  },

  "ins_952": {
    ins_number: "952",
    common_names: ["ins 952", "cyclamate", "sodium cyclamate", "e952"],
    function: "Artificial Sweetener",
    safety_tier: "AVOID",
    fssai_status: "PROHIBITED",
    condition_flags: [
      { condition: "diabetes", impact: "MODERATE", reason: "Prohibited in many countries due to cancer concerns in animal studies", source: "FSSAI Schedule II" }
    ],
    plain_explanation: "An artificial sweetener BANNED in many countries including the USA due to cancer concerns from animal studies. Prohibited in India for most applications.",
    india_specific_note: "Should not appear in Indian food products. If found, flag immediately.",
    score_impact: -20,
    data_quality: "VERIFIED"
  },

  "ins_954": {
    ins_number: "954",
    common_names: ["ins 954", "saccharin", "sodium saccharin", "e954"],
    function: "Artificial Sweetener",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "pregnancy", impact: "MODERATE", reason: "Crosses the placenta; precautionary avoidance recommended during pregnancy", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "One of the oldest artificial sweeteners. Previously linked to bladder cancer in rats but human studies haven't confirmed this. FSSAI permits limited use.",
    india_specific_note: "Common in Indian soft drinks and tabletop sweeteners.",
    score_impact: -4,
    data_quality: "VERIFIED"
  },

  "ins_955": {
    ins_number: "955",
    common_names: ["ins 955", "sucralose", "splenda", "e955"],
    function: "Artificial Sweetener",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "gut_ibs", impact: "MODERATE", reason: "May alter gut microbiome composition at high doses", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "A chlorinated sugar derivative, ~600x sweeter than sugar. Generally considered safe at food levels but recent research suggests possible effects on gut bacteria.",
    india_specific_note: "Increasingly used in 'sugar-free' Indian products.",
    score_impact: -3,
    data_quality: "VERIFIED"
  },

  // ── EMULSIFIERS ─────────────────────────────────────────────────────────────

  "ins_322": {
    ins_number: "322",
    common_names: ["ins 322", "lecithin", "soy lecithin", "sunflower lecithin", "e322"],
    function: "Emulsifier",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "soy_allergy", impact: "HIGH", reason: "Soy lecithin may trigger reactions in soy-allergic individuals", source: "FSSAI Allergen Declaration Rules" }
    ],
    plain_explanation: "A naturally occurring emulsifier derived from soy or sunflower. One of the safest food additives. Check source if you have a soy allergy.",
    india_specific_note: null,
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  "ins_471": {
    ins_number: "471",
    common_names: ["ins 471", "mono and diglycerides", "mono- and diglycerides of fatty acids", "e471"],
    function: "Emulsifier",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "heart_disease", impact: "MODERATE", reason: "May contain trans fatty acids not declared on the nutrition label", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "A very common emulsifier used to improve texture. Usually safe, but can be a hidden source of trans fats not reflected in the nutrition panel.",
    india_specific_note: "Ubiquitous in Indian biscuits, breads, and dairy products.",
    score_impact: -3,
    data_quality: "VERIFIED"
  },

  "ins_407": {
    ins_number: "407",
    common_names: ["ins 407", "carrageenan", "e407"],
    function: "Thickener / Stabiliser",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "gut_ibs", impact: "HIGH", reason: "Animal studies link degraded carrageenan to intestinal inflammation; precaution recommended for IBS sufferers", source: "ICMR-NIN 2024" },
      { condition: "children", impact: "MODERATE", reason: "Not recommended for infant formula by some health authorities", source: "FAO/WHO JECFA" }
    ],
    plain_explanation: "A thickener derived from red seaweed. Used in dairy and plant-based drinks. Some research links it to gut inflammation — people with IBS should be cautious.",
    india_specific_note: "Common in flavoured milk, ice cream, and plant-based drinks.",
    score_impact: -4,
    data_quality: "VERIFIED"
  },

  // ── ANTIOXIDANTS ────────────────────────────────────────────────────────────

  "ins_319": {
    ins_number: "319",
    common_names: ["ins 319", "tbhq", "tertiary butylhydroquinone", "e319"],
    function: "Antioxidant / Preservative",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "children", impact: "HIGH", reason: "Animal studies suggest possible carcinogenic effects at high doses; US FDA sets strict limits", source: "US FDA 21 CFR 172.185" }
    ],
    plain_explanation: "A petroleum-derived antioxidant that keeps oils from going rancid. Permitted in small amounts, but animal studies at high doses show concerning results. Banned in Japan.",
    india_specific_note: "Found in many Indian cooking oils and fried packaged snacks.",
    score_impact: -8,
    data_quality: "VERIFIED"
  },

  "ins_320": {
    ins_number: "320",
    common_names: ["ins 320", "bha", "butylated hydroxyanisole", "e320"],
    function: "Antioxidant / Preservative",
    safety_tier: "AVOID",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "children", impact: "HIGH", reason: "IARC classifies BHA as possibly carcinogenic (Group 2B); endocrine disrupting properties reported", source: "IARC Monograph Vol 40" }
    ],
    plain_explanation: "A synthetic antioxidant that prevents oils from spoiling. Classified as a possible human carcinogen by WHO's cancer agency. Banned in Japan and restricted in Europe.",
    india_specific_note: "Still permitted in India. Common in packaged snacks and cooking oils.",
    score_impact: -12,
    data_quality: "VERIFIED"
  },

  "ins_321": {
    ins_number: "321",
    common_names: ["ins 321", "bht", "butylated hydroxytoluene", "e321"],
    function: "Antioxidant / Preservative",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "children", impact: "MODERATE", reason: "Some animal studies suggest hormonal disruption; human safety data limited", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "Similar to BHA — a synthetic antioxidant used to prevent rancidity. Less concerning than BHA but still warrants caution, especially for children.",
    india_specific_note: null,
    score_impact: -6,
    data_quality: "VERIFIED"
  },

  // ── ACIDS / ACIDITY REGULATORS ──────────────────────────────────────────────

  "ins_330": {
    ins_number: "330",
    common_names: ["ins 330", "citric acid", "e330"],
    function: "Acidity Regulator / Preservative",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "enamel_erosion", impact: "LOW", reason: "Frequent consumption of highly acidic foods may contribute to tooth enamel erosion", source: "WHO Oral Health" }
    ],
    plain_explanation: "Naturally found in citrus fruits. One of the safest food additives. Used to add tartness and preserve food. No significant health concerns at normal food levels.",
    india_specific_note: null,
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  "ins_296": {
    ins_number: "296",
    common_names: ["ins 296", "malic acid", "e296"],
    function: "Acidity Regulator",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [],
    plain_explanation: "A naturally occurring acid found in fruits like apples. Used to add tartness to food and drinks. Considered very safe.",
    india_specific_note: null,
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  // ── THICKENERS / STABILISERS ────────────────────────────────────────────────

  "ins_415": {
    ins_number: "415",
    common_names: ["ins 415", "xanthan gum", "e415"],
    function: "Thickener / Stabiliser",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [],
    plain_explanation: "A natural thickener produced by fermentation. Very widely used and considered safe. May cause gas in very high quantities.",
    india_specific_note: null,
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  "ins_412": {
    ins_number: "412",
    common_names: ["ins 412", "guar gum", "e412"],
    function: "Thickener / Stabiliser",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "diabetes", impact: "POSITIVE", reason: "Soluble fibre that slows glucose absorption — can help with blood sugar management", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "A natural thickener from guar beans grown extensively in India. Actually beneficial — acts as soluble fibre and can help regulate blood sugar.",
    india_specific_note: "India is the world's largest producer of guar. Widely used in Indian food products.",
    score_impact: 2,
    data_quality: "VERIFIED"
  },

  // ── RAISING AGENTS ──────────────────────────────────────────────────────────

  "ins_500": {
    ins_number: "500",
    common_names: ["ins 500", "sodium carbonate", "sodium bicarbonate", "baking soda", "soda bicarbonate", "e500"],
    function: "Raising Agent",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "hypertension", impact: "LOW", reason: "Adds to total sodium intake — worth noting for those tracking sodium", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "Baking soda — a very common and safe raising agent. Used in biscuits, cakes, and bread. Minimal concerns except a small sodium contribution.",
    india_specific_note: null,
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  // ── FATS ────────────────────────────────────────────────────────────────────

  "palm_oil": {
    ins_number: null,
    common_names: ["palm oil", "refined palm oil", "palm olein", "rbd palm oil", "vegetable oil (palm)"],
    function: "Fat / Oil",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "heart_disease", impact: "MODERATE", reason: "High in saturated fat (50%) — linked to elevated LDL cholesterol with excessive consumption", source: "ICMR-NIN 2024" },
      { condition: "heart_disease", impact: "MODERATE", reason: "Contains glycidyl fatty acid esters (contaminants) when highly refined", source: "EFSA 2016" }
    ],
    plain_explanation: "A widely used vegetable oil high in saturated fat. In moderation it is not harmful, but many Indian products use it as the primary fat in large quantities. Check if it's the first or second ingredient — that means it's present in high amounts.",
    india_specific_note: "India is one of the world's largest importers of palm oil. Present in the majority of Indian biscuits, instant noodles, chips, and fried snacks. 71% of Indian consumers actively try to avoid it.",
    score_impact: -4,
    data_quality: "VERIFIED"
  },

  "trans_fat": {
    ins_number: null,
    common_names: ["trans fat", "partially hydrogenated oil", "hydrogenated vegetable fat", "vanaspati", "dalda"],
    function: "Fat",
    safety_tier: "AVOID",
    fssai_status: "RESTRICTED",
    condition_flags: [
      { condition: "heart_disease", impact: "HIGH", reason: "WHO recommends complete elimination — increases LDL and decreases HDL cholesterol", source: "WHO REPLACE Initiative 2018" },
      { condition: "diabetes", impact: "HIGH", reason: "Linked to insulin resistance and increased Type 2 diabetes risk", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "Partially hydrogenated oils — the worst type of fat. WHO recommends eliminating them completely. They raise bad cholesterol and lower good cholesterol simultaneously. FSSAI has set limits but not a complete ban.",
    india_specific_note: "Vanaspati (Dalda) is a traditional Indian trans fat still used in some commercial foods and restaurants. FSSAI limit is 2g/100g but WHO recommends zero.",
    score_impact: -15,
    data_quality: "VERIFIED"
  },

  // ── SUGARS ──────────────────────────────────────────────────────────────────

  "high_fructose_corn_syrup": {
    ins_number: null,
    common_names: ["high fructose corn syrup", "hfcs", "corn syrup", "glucose-fructose syrup", "isoglucose"],
    function: "Sweetener",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "diabetes", impact: "HIGH", reason: "Rapidly absorbed fructose bypasses normal appetite regulation and can worsen insulin resistance", source: "ICMR-NIN 2024" },
      { condition: "obesity", impact: "HIGH", reason: "High fructose intake linked to increased liver fat and metabolic syndrome", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "A cheap sweetener made from corn starch. Metabolised differently from regular sugar — the fructose component goes directly to the liver and is associated with fatty liver disease at high intake.",
    india_specific_note: "Increasingly used in Indian packaged drinks and sweets as a cost-effective sugar substitute.",
    score_impact: -8,
    data_quality: "VERIFIED"
  },

  "maltodextrin": {
    ins_number: null,
    common_names: ["maltodextrin", "corn maltodextrin", "modified starch"],
    function: "Bulking Agent / Filler",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "diabetes", impact: "MODERATE", reason: "Very high glycaemic index (GI 85-105) — spikes blood sugar faster than table sugar", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "A highly processed starch used as a filler. Has a higher glycaemic index than table sugar — meaning it raises blood sugar faster. Often hides in products that claim to be low in sugar.",
    india_specific_note: "Common in Indian health drinks, protein powders, and instant foods.",
    score_impact: -5,
    data_quality: "VERIFIED"
  },

  // ── NITRATES / NITRITES (meat preservatives) ────────────────────────────────

  "ins_250": {
    ins_number: "250",
    common_names: ["ins 250", "sodium nitrite", "e250"],
    function: "Preservative / Colour Fixative",
    safety_tier: "AVOID",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "children", impact: "HIGH", reason: "Can form nitrosamines — classified as Group 1 carcinogens by IARC", source: "IARC Monograph Vol 94" },
      { condition: "pregnancy", impact: "HIGH", reason: "Nitrosamines can cross the placenta; precautionary avoidance recommended", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "Used to preserve processed meats (ham, sausages, hot dogs). Can form nitrosamines during cooking at high temperatures — these are known carcinogens. WHO/IARC classifies processed meats containing nitrites as Group 1 carcinogens.",
    india_specific_note: "Increasingly present in Indian packaged processed meats as they grow in popularity.",
    score_impact: -15,
    data_quality: "VERIFIED"
  },

  // ── FLOUR TREATMENT ─────────────────────────────────────────────────────────

  "ins_924": {
    ins_number: "924",
    common_names: ["ins 924", "potassium bromate", "e924"],
    function: "Flour Treatment Agent",
    safety_tier: "BANNED_IN_INDIA",
    fssai_status: "PROHIBITED",
    condition_flags: [
      { condition: "general", impact: "HIGH", reason: "Classified as possibly carcinogenic (Group 2B) by IARC. Banned in India, EU, UK, Canada.", source: "FSSAI Order 2016 / IARC" }
    ],
    plain_explanation: "BANNED IN INDIA. A flour improver classified as a possible carcinogen. FSSAI prohibited it in 2016. Its presence in any product is a serious violation.",
    india_specific_note: "Officially banned in India since 2016. If found in a product, this is a regulatory violation.",
    score_impact: -30,
    data_quality: "VERIFIED"
  },

  // ── COMMONLY SAFE BASE INGREDIENTS ─────────────────────────────────────────

  "salt": {
    ins_number: null,
    common_names: ["salt", "sodium chloride", "common salt", "iodised salt", "rock salt"],
    function: "Seasoning / Preservative",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "hypertension", impact: "HIGH", reason: "High sodium intake directly linked to elevated blood pressure; ICMR-NIN recommends <5g salt/day", source: "ICMR-NIN 2024" },
      { condition: "kidney_disease", impact: "HIGH", reason: "Damaged kidneys cannot efficiently excrete sodium; restriction required", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "Table salt. Essential in small amounts but excess is the leading cause of hypertension. Check sodium per 100g in the nutrition table — ICMR recommends total daily sodium under 2000mg.",
    india_specific_note: "Indian diets typically contain 8-10g of salt daily — nearly double the WHO recommendation of 5g.",
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  "sugar": {
    ins_number: null,
    common_names: ["sugar", "cane sugar", "refined sugar", "white sugar", "sucrose", "beet sugar"],
    function: "Sweetener",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "diabetes", impact: "HIGH", reason: "Directly raises blood glucose; diabetics must track total sugar intake carefully", source: "ICMR-NIN 2024" },
      { condition: "obesity", impact: "HIGH", reason: "Excess free sugars are the primary dietary driver of obesity", source: "WHO Free Sugars Guideline 2015" },
      { condition: "children", impact: "MODERATE", reason: "WHO recommends children's sugar intake stay below 10% of daily energy", source: "WHO 2015" }
    ],
    plain_explanation: "Regular white sugar. Safe in moderation — but most packaged products use far more than most people realise. WHO recommends limiting free sugars to less than 10% of daily calories (about 50g for an adult).",
    india_specific_note: "India has among the highest rates of diabetes globally. Sugar monitoring is especially important for Indian consumers.",
    score_impact: 0,  // score impact calculated from nutrition values, not presence
    data_quality: "VERIFIED"
  },

  "wheat_flour": {
    ins_number: null,
    common_names: ["wheat flour", "refined wheat flour", "maida", "atta", "whole wheat flour", "enriched wheat flour"],
    function: "Base Ingredient",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "gluten_intolerance", impact: "HIGH", reason: "Contains gluten — must be avoided by people with coeliac disease or gluten sensitivity", source: "FSSAI Allergen Declaration Rules" }
    ],
    plain_explanation: "Wheat flour. 'Maida' is refined white flour (low fibre); 'atta' is wholemeal (higher fibre). Maida has a higher glycaemic index than atta.",
    india_specific_note: "Maida (refined flour) is the base of most Indian biscuits, bread, and instant snacks. Atta-based products are nutritionally superior.",
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  "vegetable_oil": {
    ins_number: null,
    common_names: ["vegetable oil", "edible vegetable oil", "refined vegetable oil"],
    function: "Fat / Oil",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [],
    plain_explanation: "Generic 'vegetable oil' without a named source is usually palm oil or a blend of palm with other oils. This labelling practice obscures the actual oil used. If palm oil is your concern, this generic label is a red flag.",
    india_specific_note: "FSSAI requires the type of oil to be declared, but 'vegetable oil' still appears on many labels — a compliance issue.",
    score_impact: -3,
    data_quality: "VERIFIED"
  },

  // ── COSMETIC INGREDIENTS ─────────────────────────────────────────────────────

  "fragrance": {
    ins_number: null,
    common_names: ["fragrance", "parfum", "perfume", "aroma", "fragrance (parfum)", "parfum (fragrance)"],
    function: "Fragrance / Masking Agent",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "sensitive_skin", impact: "HIGH", reason: "Fragrance is the leading cause of contact allergy in cosmetics — EU Scientific Committee on Consumer Safety 2012", source: "SCCS Opinion SCCS/1459/11" },
      { condition: "asthma", impact: "MODERATE", reason: "Volatile fragrance compounds can trigger respiratory symptoms in sensitive individuals", source: "EFSA 2009" },
      { condition: "eczema", impact: "HIGH", reason: "Fragrance is the #1 trigger for eczema flare-ups in adults and children", source: "CDSCO Cosmetics Rules 2020" },
      { condition: "pregnancy", impact: "MODERATE", reason: "Some fragrance compounds (musks, phthalates) are endocrine disruptors — dermatologists recommend fragrance-free products during pregnancy", source: "EWG Skin Deep" }
    ],
    plain_explanation: "A single word that can hide a blend of hundreds of undisclosed chemicals. Cosmetic companies are not required to list individual fragrance compounds. It is the #1 cause of cosmetic contact allergy. People with sensitive skin, eczema, or rosacea should choose fragrance-free products.",
    india_specific_note: "CDSCO Cosmetics Rules 2020 require allergen disclosure for 26 specific fragrance allergens, but most Indian products do not yet comply. EWG rates fragrance as a high-concern ingredient.",
    score_impact: -10,
    data_quality: "VERIFIED"
  },

  "sodium_laureth_sulfate": {
    ins_number: null,
    common_names: ["sodium laureth sulfate", "sodium laureth sulphate", "sles", "sodium lauryl ether sulfate", "sodium lauryl ether sulphate", "sodium laureth sulfate (sles)", "ammonium laureth sulfate"],
    function: "Surfactant, Cleansing Agent",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "sensitive_skin", impact: "HIGH", reason: "SLES strips the skin's natural lipid barrier, leading to dryness and increased sensitivity with repeated use", source: "CDSCO Cosmetics Rules 2020" },
      { condition: "eczema", impact: "HIGH", reason: "Compromises the skin barrier — significantly worsens eczema and dermatitis with daily use", source: "British Journal of Dermatology 2003" },
      { condition: "dry_skin", impact: "MODERATE", reason: "Removes natural moisturising factors from skin surface, accelerating water loss", source: "EFSA Cosmetic Ingredient Safety" }
    ],
    plain_explanation: "A foaming agent used in shampoos, face washes, and body washes. While milder than SLS (Sodium Lauryl Sulphate), SLES still disrupts the skin's natural moisture barrier with regular use. Dermatologists recommend avoiding it for sensitive, dry, or eczema-prone skin. The 'ethoxylation' process used to make SLES can introduce 1,4-dioxane — a potential carcinogen.",
    india_specific_note: "Present in the majority of Indian shampoos, face washes, and body washes. Look for sulfate-free alternatives if you have sensitive or dry scalp/skin.",
    score_impact: -8,
    data_quality: "VERIFIED"
  },

  // ── SNACK INGREDIENTS ────────────────────────────────────────────────────────

  "maida": {
    ins_number: null,
    common_names: ["maida", "refined wheat flour", "refined flour", "white flour", "wheat flour (refined)", "all purpose flour"],
    function: "Base / Flour",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "diabetes", impact: "HIGH", reason: "Glycaemic Index of 70–85 — spikes blood glucose almost as fast as pure sugar", source: "ICMR-NIN 2024" },
      { condition: "gluten_intolerance", impact: "HIGH", reason: "Contains gluten — unsafe for coeliac disease and NCGS", source: "FSSAI Allergen Rules 2021" },
      { condition: "weight_management", impact: "MODERATE", reason: "Highly refined with minimal fibre — low satiety, easy to overeat", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "Maida is refined wheat flour with the bran and germ stripped out — leaving mostly starch. It has very little fibre or nutrition and a very high glycaemic index (it behaves like sugar in your body). When maida is the #1 ingredient, the product is essentially a starch delivery vehicle.",
    india_specific_note: "Maida is the base of most Indian biscuits, namkeens, and bakery products. FSSAI has no restriction on its use but ICMR-NIN advises choosing whole grain alternatives whenever possible.",
    score_impact: -5,
    data_quality: "VERIFIED"
  },

  "glucose_syrup": {
    ins_number: null,
    common_names: ["glucose syrup", "corn syrup", "liquid glucose", "glucose-fructose syrup", "dextrose syrup"],
    function: "Sweetener / Binder",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "diabetes", impact: "HIGH", reason: "Rapidly absorbed glucose — high GI, causes sharp blood sugar spike", source: "Diabetes Care 2020" },
      { condition: "dental_health", impact: "MODERATE", reason: "Fermentable sugar that feeds oral bacteria and promotes tooth decay", source: "WHO Oral Health Guidelines" }
    ],
    plain_explanation: "A liquid sugar derived from starch (usually corn or wheat). It has a very high glycaemic index and is used in confectionery, biscuits, and snacks to add sweetness and a chewy texture. When listed early in ingredients, the product has a high sugar load.",
    india_specific_note: "Common in Indian sweets, biscuits, and glucose-fortified products. Often unlabelled as 'sugar' making it easy to miss.",
    score_impact: -5,
    data_quality: "VERIFIED"
  },

  "invert_sugar": {
    ins_number: null,
    common_names: ["invert sugar", "invert syrup", "inverted sugar syrup", "trimoline"],
    function: "Sweetener",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "diabetes", impact: "HIGH", reason: "Contains free fructose and glucose — rapidly absorbed, high GI", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "Inverted sugar is table sugar broken down into its components (glucose + fructose). It's sweeter than regular sugar, stays moist longer, and is widely used in biscuits and confectionery. Nutritionally identical to sugar — if it's high in the ingredient list, the product has a high sugar content.",
    india_specific_note: "Used extensively in Indian biscuits like Parle-G. Often listed separately from 'sugar' which artificially pushes both lower on the ingredient list.",
    score_impact: -4,
    data_quality: "VERIFIED"
  },

  "dextrose": {
    ins_number: null,
    common_names: ["dextrose", "dextrose monohydrate", "d-glucose", "corn sugar"],
    function: "Sweetener",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "diabetes", impact: "HIGH", reason: "Dextrose is pure glucose — GI of 100, the highest possible. Causes the fastest blood sugar spike of any sugar", source: "Glycaemic Index Foundation" }
    ],
    plain_explanation: "Dextrose is pure glucose — the simplest form of sugar with a glycaemic index of 100 (the maximum). It's used to add bulk, browning, and sweetness. For diabetics or those managing blood sugar, products with dextrose high in the ingredient list are particularly concerning.",
    india_specific_note: "Common in Indian sports drinks, biscuits, and packaged namkeens as a cheap sweetener.",
    score_impact: -4,
    data_quality: "VERIFIED"
  },

  "sunflower_oil": {
    ins_number: null,
    common_names: ["sunflower oil", "refined sunflower oil", "sunflower seed oil", "high oleic sunflower oil"],
    function: "Fat / Oil",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [],
    plain_explanation: "A neutral-tasting vegetable oil higher in unsaturated fats than palm oil. Preferable to palm oil or hydrogenated fats. High oleic variants (used in premium snacks) are particularly stable and heart-friendly.",
    india_specific_note: "Increasingly used as a healthier alternative to palm oil in premium Indian snacks. Still calorie-dense — 9 kcal per gram.",
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  "groundnut_oil": {
    ins_number: null,
    common_names: ["groundnut oil", "peanut oil", "arachis oil", "refined groundnut oil"],
    function: "Fat / Oil",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "peanut_allergy", impact: "HIGH", reason: "Refined groundnut oil typically has no detectable protein but cold-pressed versions can trigger reactions", source: "FSSAI Allergen Rules 2021" }
    ],
    plain_explanation: "A traditional Indian cooking oil with a good balance of mono- and polyunsaturated fats. Widely used in authentic Indian namkeens and snacks. Generally a healthier choice than palm oil.",
    india_specific_note: "The traditional frying medium for Indian namkeens like sev and chakli. Rajasthan and Gujarat use groundnut oil extensively.",
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  "hydrogenated_vegetable_oil": {
    ins_number: null,
    common_names: ["hydrogenated vegetable oil", "partially hydrogenated oil", "hydrogenated fat", "vanaspati", "dalda", "vegetable shortening"],
    function: "Fat",
    safety_tier: "AVOID",
    fssai_status: "RESTRICTED",
    condition_flags: [
      { condition: "heart_disease", impact: "HIGH", reason: "Contains industrial trans fats — WHO recommends complete elimination. Raises LDL and lowers HDL simultaneously", source: "WHO REPLACE 2018" },
      { condition: "diabetes", impact: "HIGH", reason: "Industrial trans fats linked to insulin resistance and increased T2DM risk", source: "Diabetes Care Journal 2001" }
    ],
    plain_explanation: "When vegetable oil is partially hydrogenated, it creates artificial trans fats — the worst type of dietary fat. WHO recommends eliminating them completely from the food supply. If you see 'hydrogenated' or 'vanaspati' in the ingredients, this product likely contains trans fat even if labelled 0g (FSSAI allows rounding down).",
    india_specific_note: "Vanaspati (Dalda) is still used in cheap Indian biscuits, street food, and some restaurant cooking. FSSAI restricts it to 2g/100g but the WHO limit is zero.",
    score_impact: -15,
    data_quality: "VERIFIED"
  },

  "rice_flour": {
    ins_number: null,
    common_names: ["rice flour", "rice powder", "white rice flour", "fine rice flour"],
    function: "Base / Flour",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "diabetes", impact: "MODERATE", reason: "White rice flour has a high GI (70–80) — moderate blood sugar impact", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "A gluten-free flour made from ground rice. Lighter and crispier than wheat flour, making it popular in Indian rice-based snacks (murukku, chakli). Naturally gluten-free but not particularly high in fibre or nutrition.",
    india_specific_note: "The base of South Indian snacks like murukku and rice papads. A safer option for gluten-sensitive individuals.",
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  "corn_flour": {
    ins_number: null,
    common_names: ["corn flour", "cornmeal", "maize flour", "corn starch", "cornstarch", "corn powder"],
    function: "Base / Thickener",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "diabetes", impact: "MODERATE", reason: "Refined corn flour has moderate-high GI (70–90) depending on processing", source: "Glycaemic Index Foundation" }
    ],
    plain_explanation: "A starch derived from corn, used as a base in chips, coatings, and snacks. Lighter than wheat flour and naturally gluten-free. The base ingredient in most corn-based chips (Kurkure, Bingo rings). Moderate nutritional value.",
    india_specific_note: "The main ingredient in most Indian corn-based extruded snacks. Often mixed with pulses or rice flour.",
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  "potato_starch": {
    ins_number: null,
    common_names: ["potato starch", "potato flour", "dehydrated potato", "potato flakes", "potato granules", "dried potato"],
    function: "Base / Thickener",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "diabetes", impact: "MODERATE", reason: "High GI when processed — dehydrated potato can spike blood sugar faster than fresh potato", source: "ICMR-NIN" }
    ],
    plain_explanation: "Processed potato used as the base ingredient in potato chips and stacked chip products. Nutritionally similar to potato but with most fibre removed during processing. High in carbohydrates.",
    india_specific_note: "Used in Pringles-style stacked chips and many Indian potato snacks. Indian potato chips from real sliced potatoes are slightly less processed.",
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  "cheese_powder": {
    ins_number: null,
    common_names: ["cheese powder", "cheddar cheese powder", "processed cheese powder", "dairy solids (cheese)", "cheese flavour (real cheese)"],
    function: "Flavour / Dairy",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "hypertension", impact: "MODERATE", reason: "Cheese powder is typically very high in sodium (2000–5000mg/100g)", source: "ICMR-NIN 2024" },
      { condition: "dairy_allergy", impact: "HIGH", reason: "Derived from milk — contains milk proteins and lactose", source: "FSSAI Allergen Rules" }
    ],
    plain_explanation: "Dehydrated cheese used in snacks for its strong cheesy flavour. Very concentrated — extremely high in sodium and saturated fat. Products claiming 'real cheese' use this; products using artificial cheese flavour skip it entirely.",
    india_specific_note: "Found in premium Indian cheese-flavoured chips. Contributes significantly to the high sodium content of cheese snacks.",
    score_impact: -3,
    data_quality: "VERIFIED"
  },

  "yeast_extract": {
    ins_number: null,
    common_names: ["yeast extract", "autolysed yeast extract", "hydrolysed yeast", "yeast extract powder"],
    function: "Flavour Enhancer",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "migraine", impact: "MODERATE", reason: "Contains glutamates — a known migraine trigger in sensitive individuals", source: "Cephalalgia Journal 2016" },
      { condition: "hypertension", impact: "MODERATE", reason: "High in naturally occurring sodium and glutamates", source: "ICMR-NIN" }
    ],
    plain_explanation: "A concentrated flavour from yeast cells. It's a natural source of MSG-like glutamates and is used as a 'clean label' alternative to MSG. Gives snacks a deep savoury taste. Not harmful for most people but can trigger migraines in sensitive individuals.",
    india_specific_note: "Used in premium Indian snacks as a 'no added MSG' flavour enhancer. Functionally similar to MSG but from a natural source.",
    score_impact: -2,
    data_quality: "VERIFIED"
  },

  "skimmed_milk_powder": {
    ins_number: null,
    common_names: ["skimmed milk powder", "skim milk powder", "non-fat dry milk", "milk solids (non-fat)", "smp"],
    function: "Dairy / Protein Source",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "dairy_allergy", impact: "HIGH", reason: "Contains milk proteins (casein, whey) — a major allergen", source: "FSSAI Allergen Rules 2021" },
      { condition: "lactose_intolerance", impact: "MODERATE", reason: "Contains lactose — may cause digestive issues", source: "ICMR-NIN" }
    ],
    plain_explanation: "Dried skim milk — fat removed, protein and calcium retained. Used in biscuits and snacks to add protein, improve texture, and provide dairy flavour. A nutritionally useful ingredient that also acts as an allergen.",
    india_specific_note: "Common in Indian cream biscuits and dairy-based snacks. Adds mild nutritional value compared to pure starches.",
    score_impact: 2,
    data_quality: "VERIFIED"
  },

  "ins_150d": {
    ins_number: "INS 150d",
    common_names: ["ins 150d", "caramel colour iv", "caramel colour class iv", "sulphite ammonia caramel", "caramel color iv", "150d"],
    function: "Colour",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "cancer_risk", impact: "MODERATE", reason: "Contains 4-methylimidazole (4-MEI), a probable carcinogen — classified Group 2B by IARC", source: "IARC Monographs 2012 · California Prop 65" },
      { condition: "children", impact: "HIGH", reason: "California requires cancer warning labels on products with >29mcg 4-MEI per day", source: "California Prop 65 · CSPI" }
    ],
    plain_explanation: "The darkest caramel colour used in colas, sauces, and dark-coloured snacks. Contains trace amounts of 4-methylimidazole (4-MEI), a chemical classified as a possible carcinogen by WHO's IARC. California requires products with significant amounts to carry cancer warning labels. FSSAI permits it but limits are under review.",
    india_specific_note: "Found in dark colas (Pepsi, Coca-Cola), soy sauce, Worcestershire sauce, and some Indian snacks with dark coatings. FSSAI has not set a 4-MEI limit despite WHO concerns.",
    score_impact: -4,
    data_quality: "VERIFIED"
  },

  "ins_160c": {
    ins_number: "INS 160c",
    common_names: ["ins 160c", "paprika extract", "capsanthin", "capsorubin", "paprika colour", "160c"],
    function: "Natural Colour",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [],
    plain_explanation: "A natural orange-red colour extracted from paprika (red pepper). One of the safest food colours — derived from a spice rather than synthesised from petroleum. Used in chips, snacks, and spiced products to give a rich red-orange appearance.",
    india_specific_note: "Common in Indian masala chips and flavoured snacks. A far safer alternative to artificial red and orange colours like INS 110.",
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  "ins_635": {
    ins_number: "INS 635",
    common_names: ["ins 635", "disodium ribonucleotides", "5'-ribonucleotides", "disodium 5'-ribonucleotides", "635"],
    function: "Flavour Enhancer",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "gout", impact: "HIGH", reason: "Ribonucleotides metabolise to purines — significantly raises uric acid, dangerous for gout sufferers", source: "Arthritis & Rheumatology Journal" },
      { condition: "asthma", impact: "MODERATE", reason: "Can trigger asthma attacks in aspirin-sensitive individuals", source: "EFSA 2010" },
      { condition: "children", impact: "MODERATE", reason: "Not recommended for infants and young children under 12 weeks", source: "EFSA Scientific Opinion 2010" }
    ],
    plain_explanation: "A powerful flavour enhancer — up to 10× stronger than MSG. It's often used in combination with MSG (INS 621) to dramatically amplify savoury taste. Found in Maggi, instant noodles, and many masala chips. A major concern for gout sufferers as it metabolises to purines that raise uric acid levels.",
    india_specific_note: "Present in Maggi Masala and many Indian instant noodles and masala chips. Often not highlighted on labels despite its potency. Gout is prevalent in 1–2% of Indian adults.",
    score_impact: -5,
    data_quality: "VERIFIED"
  },

  "ins_476": {
    ins_number: "INS 476",
    common_names: ["ins 476", "pgpr", "polyglycerol polyricinoleate", "476"],
    function: "Emulsifier",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [],
    plain_explanation: "PGPR is an emulsifier derived from castor oil used in chocolate products. It was introduced by confectionery companies as a cheap substitute for cocoa butter — it reduces the amount of cocoa butter needed, lowering costs. While not harmful at approved doses, its presence indicates cost-cutting in the recipe.",
    india_specific_note: "Present in most Indian mass-market chocolates. Absent in premium European chocolate. Its use is one way to identify cheaper chocolate formulations.",
    score_impact: -2,
    data_quality: "VERIFIED"
  },

  "ins_450": {
    ins_number: "INS 450",
    common_names: ["ins 450", "sodium pyrophosphate", "disodium diphosphate", "diphosphates", "pyrophosphate", "450"],
    function: "Raising Agent / Leavening",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "kidney_disease", impact: "HIGH", reason: "Phosphate additives are poorly filtered by damaged kidneys — accumulate and cause cardiovascular complications", source: "KDIGO Guidelines 2017" },
      { condition: "bone_health", impact: "MODERATE", reason: "High phosphate intake can interfere with calcium absorption and bone density over time", source: "EFSA 2012" }
    ],
    plain_explanation: "A leavening agent used to make baked snacks and biscuits rise. Safe for healthy people in normal snack quantities, but a concern for anyone with kidney disease since damaged kidneys struggle to excrete excess phosphate.",
    india_specific_note: "Common in Indian biscuits and bakery products. One of several phosphate additives — the cumulative effect from multiple processed foods is worth watching.",
    score_impact: -2,
    data_quality: "VERIFIED"
  },

  "ins_472e": {
    ins_number: "INS 472e",
    common_names: ["ins 472e", "datem", "diacetyl tartaric acid esters", "diacetyl tartaric acid ester of mono and diglycerides", "472e"],
    function: "Emulsifier",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [],
    plain_explanation: "DATEM is an emulsifier used in bread, biscuits, and snacks to improve dough strength and shelf life. It's derived from fats and tartaric acid. Generally considered safe by regulators, but is an indicator of heavily processed food (UPF marker).",
    india_specific_note: "Found in Indian packaged breads, biscuits, and some snacks. Harmless in isolation but contributes to the overall ultra-processed nature of the product.",
    score_impact: -2,
    data_quality: "VERIFIED"
  },

  "ins_551": {
    ins_number: "INS 551",
    common_names: ["ins 551", "silicon dioxide", "silica", "amorphous silica", "551"],
    function: "Anti-Caking Agent",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [],
    plain_explanation: "Silicon dioxide (silica) is the same compound as sand, used in powdered snacks and spice mixes to prevent clumping. In the tiny amounts used in food it is completely safe and passes through the body unabsorbed.",
    india_specific_note: "Common in Indian masala powders, chips seasonings, and powdered snack mixes. No known health concerns.",
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  "artificial_flavour": {
    ins_number: null,
    common_names: ["artificial flavour", "artificial flavoring", "artificial flavouring", "nature identical flavour", "nature-identical flavouring", "synthetic flavour"],
    function: "Artificial Flavour",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "children", impact: "MODERATE", reason: "Artificial flavours are generally not recommended for young children — cumulative exposure unknown", source: "ICMR-NIN Paediatric Guidelines" }
    ],
    plain_explanation: "A catch-all term for synthetic chemical compounds that mimic natural flavours. 'Artificial flavour' can represent hundreds of different chemicals — companies are not required to disclose which ones. Generally safe in regulated quantities but provides no nutritional value and is a UPF marker.",
    india_specific_note: "Extremely common in Indian chips, instant noodles, biscuits, and confectionery. The vagueness of the label means you cannot know exactly what chemical is being used.",
    score_impact: -2,
    data_quality: "VERIFIED"
  },

  "natural_flavour": {
    ins_number: null,
    common_names: ["natural flavour", "natural flavouring", "natural flavoring", "natural flavours", "nature flavour"],
    function: "Natural Flavour",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [],
    plain_explanation: "Flavouring compounds derived from natural sources (plants, animals, fermentation). Safer than artificial flavours but the term is loosely defined — a 'natural flavour' can still be highly processed. Better than artificial but not equivalent to real food ingredients.",
    india_specific_note: "Increasingly used by Indian snack brands moving away from artificial flavours as consumers become more ingredient-aware.",
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  "spice_extract": {
    ins_number: null,
    common_names: ["spice extract", "spice extractives", "oleoresin", "oleoresin paprika", "oleoresin turmeric", "oleoresin chilli", "natural spice extract"],
    function: "Natural Colour / Flavour",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [],
    plain_explanation: "Concentrated extracts from natural spices used for colour and flavour. Far safer than synthetic dyes — these are just concentrated spice compounds. Turmeric extract, paprika extract, and chilli extract are all beneficial in small amounts.",
    india_specific_note: "Common in authentic Indian masala snacks. Their presence indicates the product is using natural rather than artificial colourings — a positive sign.",
    score_impact: 0,
    data_quality: "VERIFIED"
  },

  "cocoa_powder": {
    ins_number: null,
    common_names: ["cocoa powder", "cocoa solids", "cocoa mass", "natural cocoa", "dutch processed cocoa", "alkalized cocoa"],
    function: "Flavour / Natural Ingredient",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [],
    plain_explanation: "Cocoa powder is made from cocoa beans and contains flavonoids — plant compounds linked to cardiovascular benefits. However, its benefits in biscuits and snacks are largely offset by the large amounts of sugar and fat surrounding it. More cocoa percentage generally means more beneficial compounds.",
    india_specific_note: "Present in Indian chocolate biscuits and spreads. Dark chocolate with high cocoa content (>70%) retains the most benefits; milk chocolate biscuits have negligible amounts.",
    score_impact: 2,
    data_quality: "VERIFIED"
  },

  "hazelnuts": {
    ins_number: null,
    common_names: ["hazelnuts", "hazelnut", "hazel nut", "hazelnut paste", "hazelnut pieces", "chopped hazelnuts"],
    function: "Nut Ingredient",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "tree_nut_allergy", impact: "HIGH", reason: "Hazelnuts are a top tree nut allergen — can cause severe anaphylaxis", source: "FSSAI Allergen Declaration Rules 2021" }
    ],
    plain_explanation: "Hazelnuts are a whole food ingredient providing healthy monounsaturated fats, vitamin E, and fibre. A genuinely beneficial ingredient in spreads and confectionery. However, even products like Nutella contain only 13% hazelnuts — the rest is sugar and palm oil.",
    india_specific_note: "Imported and expensive in India. Products containing real hazelnuts (not just hazelnut flavour) provide meaningful nutritional benefit.",
    score_impact: 4,
    data_quality: "VERIFIED"
  },

  "whey_powder": {
    ins_number: null,
    common_names: ["whey powder", "whey solids", "sweet whey powder", "dried whey", "whey protein"],
    function: "Protein / Dairy",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "dairy_allergy", impact: "HIGH", reason: "Whey is a milk protein — a major allergen for milk-allergic individuals", source: "FSSAI Allergen Rules 2021" },
      { condition: "lactose_intolerance", impact: "MODERATE", reason: "Contains lactose — may cause digestive issues", source: "ICMR-NIN" }
    ],
    plain_explanation: "A byproduct of cheese-making, dried into a powder. Rich in high-quality protein and all essential amino acids. Used in biscuits and snacks to boost protein content and improve texture. Nutritionally beneficial for most people.",
    india_specific_note: "Common in protein biscuits and premium snacks marketed as protein-enriched. A genuine protein source unlike many 'protein' marketing claims.",
    score_impact: 3,
    data_quality: "VERIFIED"
  },

  // ── COSMETIC / PERSONAL CARE (continued) ─────────────────────────────────────

  "sodium_lauryl_sulfate": {
    ins_number: null,
    common_names: ["sodium lauryl sulfate", "sodium lauryl sulphate", "sls", "sodium dodecyl sulfate", "sodium dodecyl sulphate"],
    function: "Surfactant, Cleansing Agent",
    safety_tier: "AVOID",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "sensitive_skin", impact: "HIGH", reason: "SLS is significantly more irritating than SLES — causes measurable skin barrier disruption even at low concentrations", source: "Contact Dermatitis Journal 2005" },
      { condition: "eczema", impact: "HIGH", reason: "Clinical studies show SLS exacerbates eczema — dermatologists universally advise avoidance", source: "British Journal of Dermatology 2003" },
      { condition: "oral_sensitivity", impact: "MODERATE", reason: "SLS in toothpaste linked to increased frequency of mouth ulcers (aphthous stomatitis)", source: "Journal of Clinical Periodontology 1996" }
    ],
    plain_explanation: "A harsh surfactant that creates lather in shampoos, toothpastes, and body washes. More irritating than SLES — causes measurable skin barrier damage even in a single wash. Dermatologists recommend avoiding SLS for anyone with sensitive, dry, or compromised skin.",
    india_specific_note: "Still found in many budget Indian personal care products. Sulfate-free alternatives are widely available and significantly gentler.",
    score_impact: -12,
    data_quality: "VERIFIED"
  }
};

// ── Helper: normalise ingredient name for lookup ─────────────────────────────

export function normaliseIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, ' ')   // remove special chars
    .replace(/\s+/g, ' ')            // collapse whitespace
    .trim();
}

// ── Helper: look up one ingredient across all aliases ────────────────────────

export function lookupIngredient(rawName: string): IngredientEntry | null {
  const normalised = normaliseIngredientName(rawName);

  // 1. Check all common_names arrays for an exact match
  for (const entry of Object.values(INGREDIENT_DB)) {
    if (entry.common_names.includes(normalised)) {
      return entry;
    }
  }

  // 2. Check if any key partially matches (e.g. "ins 102" in "colour ins 102")
  for (const [key, entry] of Object.entries(INGREDIENT_DB)) {
    if (normalised.includes(key) || key.includes(normalised)) {
      return entry;
    }
    for (const alias of entry.common_names) {
      if (normalised.includes(alias) || alias.includes(normalised)) {
        return entry;
      }
    }
  }

  return null;
}

// ── Helper: look up a batch of ingredients ───────────────────────────────────

export interface BatchLookupResult {
  verified: Array<{ rawName: string; entry: IngredientEntry }>;
  unverified: string[];
  coveragePercent: number;
}

export function batchLookupIngredients(ingredientNames: string[]): BatchLookupResult {
  const verified: Array<{ rawName: string; entry: IngredientEntry }> = [];
  const unverified: string[] = [];

  for (const name of ingredientNames) {
    const entry = lookupIngredient(name);
    if (entry) {
      verified.push({ rawName: name, entry });
    } else {
      unverified.push(name);
    }
  }

  return {
    verified,
    unverified,
    coveragePercent: ingredientNames.length > 0
      ? Math.round((verified.length / ingredientNames.length) * 100)
      : 0
  };
}
