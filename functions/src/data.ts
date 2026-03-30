// functions/src/data.ts
export type SafetyTier = 'SAFE' | 'CAUTION' | 'AVOID' | 'BANNED_IN_INDIA' | 'UNVERIFIED';

export interface ConditionFlag {
  condition: string;
  impact: 'HIGH' | 'MODERATE' | 'LOW' | 'POSITIVE';
  reason: string;
  source: string;
}

export interface IngredientEntry {
  ins_number: string | null;
  common_names: string[];
  function: string;
  safety_tier: SafetyTier;
  fssai_status: 'PERMITTED' | 'RESTRICTED' | 'PROHIBITED' | 'NOT_APPLICABLE' | 'UNKNOWN';
  condition_flags: ConditionFlag[];
  plain_explanation: string;
  india_specific_note: string | null;
  score_impact: number;
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
  }
};

export function normaliseIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function lookupIngredient(rawName: string): IngredientEntry | null {
  const normalised = normaliseIngredientName(rawName);
  for (const entry of Object.values(INGREDIENT_DB)) {
    if (entry.common_names.includes(normalised)) return entry;
  }
  for (const [key, entry] of Object.entries(INGREDIENT_DB)) {
    if (normalised.includes(key) || key.includes(normalised)) return entry;
    for (const alias of entry.common_names) {
      if (normalised.includes(alias) || alias.includes(normalised)) return entry;
    }
  }
  return null;
}

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
    if (entry) verified.push({ rawName: name, entry });
    else unverified.push(name);
  }
  return {
    verified,
    unverified,
    coveragePercent: ingredientNames.length > 0
      ? Math.round((verified.length / ingredientNames.length) * 100)
      : 0
  };
}
