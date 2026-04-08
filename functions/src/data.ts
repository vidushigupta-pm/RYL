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
    score_impact: -3,
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
    score_impact: -3,
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
    score_impact: -3,
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
    score_impact: -3,
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
    score_impact: -3,
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
    score_impact: -2,
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
    score_impact: -3,
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
    score_impact: -3,
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
    score_impact: 0,
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
    score_impact: -3,
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
    score_impact: -2,
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

  // ── EMULSIFIERS / PHOSPHATES ─────────────────────────────────────────────────

  "ins_451": {
    ins_number: "451",
    common_names: ["ins 451", "ins 451(i)", "sodium triphosphate", "sodium tripolyphosphate", "stpp", "e451", "pentasodium triphosphate", "polyphosphate", "triphosphate"],
    function: "Emulsifier / Preservative",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "kidney_disease", impact: "HIGH", reason: "Phosphate additives are poorly excreted by damaged kidneys — linked to accelerated CKD progression", source: "ICMR-NIN 2024 / American Journal of Kidney Diseases" }
    ],
    plain_explanation: "A phosphate-based emulsifier used to retain moisture and improve texture in instant noodles and processed meats. FSSAI permits it but at restricted levels. High dietary phosphate intake from additives is a concern for kidney health — different from naturally-occurring phosphorus in food.",
    india_specific_note: "Commonly found in Maggi and other instant noodles. FSSAI permits phosphates in processed foods under Schedule IV.",
    score_impact: -3,
    data_quality: "VERIFIED"
  },

  "ins_635": {
    ins_number: "635",
    common_names: ["ins 635", "disodium 5'-ribonucleotides", "disodium ribonucleotides", "ribonucleotides", "e635", "sodium 5'-ribonucleotides"],
    function: "Flavour Enhancer",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "gout", impact: "HIGH", reason: "Contains purines — can trigger gout attacks in susceptible individuals", source: "ICMR-NIN 2024" },
      { condition: "aspirin_sensitivity", impact: "MODERATE", reason: "May cause urticaria in aspirin-sensitive individuals", source: "EFSA 2010" }
    ],
    plain_explanation: "A flavour enhancer that combines INS 627 and INS 631. Used to boost savoury/umami taste in instant noodles and snacks. Typically derived from yeast extract or fish. Those with gout should avoid it.",
    india_specific_note: "Widely used in Indian instant noodles and namkeen. Often paired with INS 621 (MSG). FSSAI permits it in processed foods.",
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
    score_impact: -3,
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
    score_impact: -10,
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
    score_impact: -2,
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

  "ins_950": {
    ins_number: "950",
    common_names: ["ins 950", "acesulfame potassium", "acesulfame k", "ace k", "acesulfame-k", "e950", "sunett", "sweet one"],
    function: "Artificial Sweetener",
    safety_tier: "CAUTION",
    fssai_status: "PERMITTED",
    condition_flags: [
      { condition: "diabetes", impact: "MODERATE", reason: "Though calorie-free, may still trigger an insulin response in some individuals; long-term metabolic effects still being studied", source: "ICMR-NIN 2024" }
    ],
    plain_explanation: "An artificial sweetener ~200x sweeter than sugar with zero calories. Considered safe by FSSAI and FDA. Commonly blended with other sweeteners (aspartame, sucralose) in Indian diet drinks and low-sugar products.",
    india_specific_note: "Very common in Indian diet sodas, 'sugar-free' snacks, and low-calorie dairy products. Often listed as Acesulfame-K.",
    score_impact: -2,
    data_quality: "VERIFIED"
  },

  "ins_960": {
    ins_number: "960",
    common_names: ["ins 960", "steviol glycosides", "stevia", "stevia extract", "reb a", "rebaudioside a", "e960", "stevia leaf extract"],
    function: "Natural Sweetener",
    safety_tier: "SAFE",
    fssai_status: "PERMITTED",
    condition_flags: [],
    plain_explanation: "A natural sweetener extracted from the Stevia plant, 200–300x sweeter than sugar with negligible calories. One of the better-studied natural sweeteners — JECFA, EFSA, and FSSAI all approve it at normal use levels.",
    india_specific_note: "Increasingly used in Indian 'natural' and diabetic-friendly products. Sold under brand names like Truvia and PureVia. A genuinely safer alternative to synthetic sweeteners.",
    score_impact: 0,
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
    score_impact: -4,
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
    score_impact: -6,
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
    score_impact: -3,
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
    score_impact: -2,
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
    score_impact: -8,
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
    score_impact: -4,
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
    score_impact: -3,
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
    score_impact: -8,
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
    score_impact: -15,
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

  // ── COSMETIC / PERSONAL CARE INGREDIENTS ────────────────────────────────────

  "methylparaben": {
    ins_number: null,
    common_names: ["methylparaben", "methyl paraben", "e218", "4-hydroxybenzoic acid methyl ester", "methyl 4-hydroxybenzoate"],
    function: "Preservative",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "pregnancy", impact: "MODERATE", reason: "Parabens are weak endocrine disruptors; some studies suggest caution during pregnancy", source: "EU Scientific Committee on Consumer Safety (SCCS) 2010" },
      { condition: "sensitive_skin", impact: "MODERATE", reason: "Can cause contact dermatitis in people with sensitive skin", source: "CDSCO Cosmetic Guidelines 2020" }
    ],
    plain_explanation: "A very common preservative that keeps cosmetics from growing bacteria and mould. Considered safe at approved levels by CDSCO. Some controversy around hormone-disrupting effects — EU has banned some longer-chain parabens. Methylparaben is still permitted.",
    india_specific_note: "Permitted by CDSCO at up to 0.4% (single) or 0.8% (mixed parabens). Regulated under Drugs & Cosmetics Act.",
    score_impact: -3,
    data_quality: "VERIFIED"
  },

  "propylparaben": {
    ins_number: null,
    common_names: ["propylparaben", "propyl paraben", "e216", "4-hydroxybenzoic acid propyl ester", "propyl 4-hydroxybenzoate"],
    function: "Preservative",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "pregnancy", impact: "HIGH", reason: "Propylparaben has stronger endocrine-disrupting activity than methylparaben; EU has restricted use in leave-on products", source: "EU SCCS Opinion 2013" },
      { condition: "children", impact: "MODERATE", reason: "Endocrine concern for children under 3; EU restricts in nappy creams", source: "EU SCCS 2013" }
    ],
    plain_explanation: "A paraben preservative with slightly stronger hormone-disrupting potential than methylparaben. The EU has restricted it in baby products and some leave-on cosmetics. Still permitted in India at low concentrations.",
    india_specific_note: "CDSCO permits but EU restrictions signal growing concern. Choose propylparaben-free products for infants and pregnant women.",
    score_impact: -3,
    data_quality: "VERIFIED"
  },

  "butylparaben": {
    ins_number: null,
    common_names: ["butylparaben", "butyl paraben", "e209", "butyl 4-hydroxybenzoate"],
    function: "Preservative",
    safety_tier: "AVOID",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "pregnancy", impact: "HIGH", reason: "Strongest endocrine disruption among common parabens; EU restricts in all cosmetics", source: "EU SCCS 2013" },
      { condition: "breast_cancer", impact: "MODERATE", reason: "Detected in breast tumour tissue in multiple studies; causal link not proven but association noted", source: "Darbre et al., 2004, Journal of Applied Toxicology" }
    ],
    plain_explanation: "One of the stronger parabens. The EU restricts it in all cosmetics. Found in some Indian products. Pregnant women and those with hormone-sensitive conditions should avoid.",
    india_specific_note: "Still permitted in India but EU restrictions indicate safety concern. Avoid in leave-on products, especially for vulnerable groups.",
    score_impact: -6,
    data_quality: "VERIFIED"
  },

  "sodium_lauryl_sulfate": {
    ins_number: null,
    common_names: ["sodium lauryl sulfate", "sls", "sodium dodecyl sulfate", "sodium laurilsulfate"],
    function: "Surfactant / Foaming Agent",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "sensitive_skin", impact: "HIGH", reason: "SLS is a known skin irritant; strips natural oils and disrupts skin barrier function", source: "Journal of American Academy of Dermatology 1995" },
      { condition: "eczema", impact: "HIGH", reason: "Can trigger or worsen eczema flare-ups by compromising skin barrier", source: "Contact Dermatitis Journal 2010" }
    ],
    plain_explanation: "A foaming agent used in shampoos, face washes, and toothpastes. Creates lather but can be harsh on skin and scalp, stripping natural oils. People with dry or sensitive skin should look for SLS-free alternatives.",
    india_specific_note: "Extremely common in Indian FMCG personal care. Most budget shampoos and face washes contain SLS. Premium and Ayurvedic brands increasingly offer SLS-free options.",
    score_impact: -3,
    data_quality: "VERIFIED"
  },

  "sodium_laureth_sulfate": {
    ins_number: null,
    common_names: ["sodium laureth sulfate", "sles", "sodium lauryl ether sulfate", "sodium laureth-2 sulfate"],
    function: "Surfactant / Foaming Agent",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "sensitive_skin", impact: "MODERATE", reason: "Milder than SLS but can still cause irritation in sensitive individuals", source: "Cosmetic Ingredient Review 2010" }
    ],
    plain_explanation: "A gentler version of SLS, still widely used as a foaming agent. Less irritating than SLS but can still dry out skin with frequent use. Considered safe in rinse-off products.",
    india_specific_note: "Very common in Indian personal care products. Safer than SLS but milder sulfate-free alternatives (cocamidopropyl betaine) are increasingly available.",
    score_impact: -3,
    data_quality: "VERIFIED"
  },

  "dimethicone": {
    ins_number: null,
    common_names: ["dimethicone", "simethicone", "dimethyl silicone", "polydimethylsiloxane", "pdms", "cyclomethicone", "cyclopentasiloxane", "d5"],
    function: "Silicone / Emollient",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "acne_prone", impact: "MODERATE", reason: "Heavy silicones can occlude pores and worsen comedonal acne in acne-prone skin", source: "American Academy of Dermatology 2019" }
    ],
    plain_explanation: "A silicone used to make hair silky and skin smooth. Creates a coating effect — feels great but does not nourish hair or skin. Non-toxic but can cause build-up on hair and clog pores for acne-prone people. The EU has restricted cyclopentasiloxane (D5) in rinse-off products due to environmental concerns.",
    india_specific_note: "Found in almost all Indian hair serums and conditioners. Not harmful but creates dependency ('silicone smoothness'); hair feels worse without it once used regularly.",
    score_impact: -2,
    data_quality: "VERIFIED"
  },

  "fragrance": {
    ins_number: null,
    common_names: ["fragrance", "parfum", "perfume", "fragrance mix", "aroma", "linalool", "limonene", "eugenol", "geraniol", "citronellol", "benzyl alcohol", "coumarin"],
    function: "Fragrance",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "sensitive_skin", impact: "HIGH", reason: "Fragrance is the #1 cause of allergic contact dermatitis in cosmetics globally", source: "EU Scientific Committee on Consumer Safety 2012" },
      { condition: "asthma", impact: "MODERATE", reason: "Volatile fragrance compounds can trigger asthma attacks in sensitive individuals", source: "ICMR Allergy Guidelines 2019" }
    ],
    plain_explanation: "The word 'fragrance' or 'parfum' on a label can hide hundreds of undisclosed chemicals under trade secret protection. It is the leading cause of cosmetic-related allergic reactions. If you have sensitive skin, fragrance-free is always safer.",
    india_specific_note: "India does not require full fragrance ingredient disclosure. CDSCO is behind EU/US in fragrance transparency regulations.",
    score_impact: -2,
    data_quality: "VERIFIED"
  },

  "formaldehyde": {
    ins_number: null,
    common_names: ["formaldehyde", "formalin", "methanol", "dmdm hydantoin", "imidazolidinyl urea", "diazolidinyl urea", "quaternium-15", "bronopol", "2-bromo-2-nitropropane-1-3-diol"],
    function: "Preservative (Formaldehyde Releaser)",
    safety_tier: "AVOID",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "cancer_risk", impact: "HIGH", reason: "Formaldehyde is classified as a Group 1 carcinogen by IARC when inhaled; concerns for high-frequency cosmetic use", source: "IARC Monograph Vol 88, 2006" },
      { condition: "sensitive_skin", impact: "HIGH", reason: "Strong contact sensitiser and allergen", source: "Contact Dermatitis, 2016" }
    ],
    plain_explanation: "Formaldehyde and its releasers (DMDM Hydantoin, Quaternium-15, etc.) are preservatives that slowly release formaldehyde in cosmetics. Formaldehyde is a known carcinogen when inhaled. High-risk in hair straightening/keratin treatments where it is heated. The EU has strict limits; India's regulation is less stringent.",
    india_specific_note: "Found in some Indian hair straightening products and nail polishes. The 'Brazilian blowout' style treatments in Indian salons often contain formaldehyde.",
    score_impact: -8,
    data_quality: "VERIFIED"
  },

  "triclosan": {
    ins_number: null,
    common_names: ["triclosan", "cloxifenolum", "irgasan", "5-chloro-2-(2,4-dichlorophenoxy)phenol"],
    function: "Antimicrobial / Preservative",
    safety_tier: "AVOID",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "hormone_disruption", impact: "HIGH", reason: "Triclosan has been shown to disrupt thyroid hormone signaling in animal studies", source: "FDA 2016 Ban, Environmental Health Perspectives 2014" },
      { condition: "children", impact: "HIGH", reason: "Associated with antibiotic resistance; banned in consumer antiseptic washes in the US", source: "US FDA 2016" }
    ],
    plain_explanation: "An antimicrobial agent banned from hand soaps in the USA and restricted in the EU due to antibiotic resistance concerns and hormone disruption. Still found in some Indian toothpastes and soaps. No benefit over plain soap for most consumers.",
    india_specific_note: "US FDA banned triclosan in consumer soaps in 2016. India has not yet issued an equivalent ban. Check toothpaste labels — Colgate Total (older formulations) contained it.",
    score_impact: -8,
    data_quality: "VERIFIED"
  },

  "hydroquinone": {
    ins_number: null,
    common_names: ["hydroquinone", "benzene-1,4-diol", "1,4-benzenediol", "1,4-dihydroxybenzene"],
    function: "Skin Lightening Agent",
    safety_tier: "AVOID",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "cancer_risk", impact: "MODERATE", reason: "Classified as possibly carcinogenic (Group 3) by IARC; banned from OTC cosmetics in EU", source: "IARC 1999; EU Cosmetics Regulation 1223/2009" },
      { condition: "pregnancy", impact: "HIGH", reason: "Should be avoided during pregnancy; systemic absorption possible with large area use", source: "CDSCO Cosmetic Ingredient Safety 2019" }
    ],
    plain_explanation: "A skin-lightening chemical banned from over-the-counter cosmetics in the EU, Japan, and Australia. Widely misused in Indian fairness creams and skin lightening products. Can cause ochronosis (permanent blue-black discolouration) with prolonged use. Only legal as a prescription drug in India.",
    india_specific_note: "Technically only legal as a prescription drug in India (Schedule H), but still found in many OTC fairness creams. A major consumer protection issue in India.",
    score_impact: -10,
    data_quality: "VERIFIED"
  },

  "mercury": {
    ins_number: null,
    common_names: ["mercury", "mercurous chloride", "calomel", "mercuric", "thimerosal", "thiomersal"],
    function: "Skin Lightening / Preservative",
    safety_tier: "BANNED_IN_INDIA",
    fssai_status: "PROHIBITED",
    condition_flags: [
      { condition: "all", impact: "HIGH", reason: "Mercury is a potent neurotoxin; banned in all cosmetics by CDSCO", source: "CDSCO Cosmetic Rules 2020" }
    ],
    plain_explanation: "Mercury compounds are banned in all cosmetics in India by CDSCO. Historically used in skin-lightening creams. Causes severe kidney damage, neurological damage, and is especially dangerous for pregnant women and children.",
    india_specific_note: "Banned by CDSCO. Found in some smuggled/counterfeit fairness creams. If a product is illegally sold, this is a serious safety emergency.",
    score_impact: -25,
    data_quality: "VERIFIED"
  },

  "lead_acetate": {
    ins_number: null,
    common_names: ["lead acetate", "lead", "plumbum", "sugar of lead"],
    function: "Banned Colourant",
    safety_tier: "BANNED_IN_INDIA",
    fssai_status: "PROHIBITED",
    condition_flags: [
      { condition: "all", impact: "HIGH", reason: "Lead is a neurotoxin with no safe level of exposure; banned in all cosmetics", source: "CDSCO / WHO" }
    ],
    plain_explanation: "Lead and lead compounds are banned in all cosmetics in India. Historically used in surma/kohl eye products. Even tiny amounts cause neurotoxicity, especially in children.",
    india_specific_note: "Traditional surma and kohl products from informal markets have tested positive for lead. Always choose CDSCO-approved brands for eye products.",
    score_impact: -25,
    data_quality: "VERIFIED"
  },

  "mineral_oil": {
    ins_number: null,
    common_names: ["mineral oil", "paraffinum liquidum", "liquid paraffin", "white mineral oil", "petrolatum", "vaseline", "petroleum jelly"],
    function: "Emollient / Occlusive",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "acne_prone", impact: "MODERATE", reason: "Heavy petroleum derivatives can occlude pores; comedogenicity varies by grade", source: "Journal of Cosmetic Dermatology 2012" }
    ],
    plain_explanation: "Petroleum-derived oil used as a moisturiser and skin protectant. When highly refined (pharmaceutical grade), it is safe. When cosmetic grade, it creates a barrier that locks in moisture but does not actively nourish skin. Not harmful but controversial for acne-prone skin.",
    india_specific_note: "Found in most Indian baby oils and many moisturisers. Pharmaceutical-grade (USP/BP) is safe. Concerns arise with lower purity grades.",
    score_impact: -2,
    data_quality: "VERIFIED"
  },

  "retinol": {
    ins_number: null,
    common_names: ["retinol", "vitamin a", "retinyl palmitate", "retinyl acetate", "retinoic acid", "tretinoin", "retinaldehyde"],
    function: "Anti-Aging Active / Vitamin A",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "pregnancy", impact: "HIGH", reason: "Vitamin A derivatives are teratogenic (cause birth defects) at high doses; must be avoided during pregnancy", source: "CDSCO / WHO; Teratology Society 1987" },
      { condition: "sun_sensitivity", impact: "MODERATE", reason: "Retinoids increase sun sensitivity; always use sunscreen with retinol products", source: "AAD Guidelines 2019" }
    ],
    plain_explanation: "A Vitamin A derivative that genuinely reduces fine lines and improves skin texture. Effective but requires care — it increases sun sensitivity and must be avoided during pregnancy due to birth defect risk at high doses. One of the few cosmetic ingredients with strong clinical evidence.",
    india_specific_note: "Tretinoin (prescription-strength retinoid) is available OTC in some Indian pharmacies — a regulatory gap. Cosmetic retinol concentrations (0.1–1%) are generally safe.",
    score_impact: 3,
    data_quality: "VERIFIED"
  },

  "niacinamide": {
    ins_number: null,
    common_names: ["niacinamide", "nicotinamide", "vitamin b3", "niacin amide"],
    function: "Skin Active / Vitamin B3",
    safety_tier: "SAFE",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [],
    plain_explanation: "One of the best-studied and safest cosmetic actives. Niacinamide reduces pores, evens skin tone, strengthens barrier, and reduces hyperpigmentation. Well-tolerated by most skin types including sensitive skin. Backed by extensive clinical evidence.",
    india_specific_note: "Increasingly found in Indian skincare products. A scientifically validated alternative to hydroquinone for skin brightening.",
    score_impact: 5,
    data_quality: "VERIFIED"
  },

  "hyaluronic_acid": {
    ins_number: null,
    common_names: ["hyaluronic acid", "sodium hyaluronate", "hyaluronan"],
    // NOTE: "ha" removed — too short, causes false matches on words like "triphosphate"
    function: "Humectant / Skin Active",
    safety_tier: "SAFE",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [],
    plain_explanation: "A naturally-occurring molecule in skin that holds up to 1000x its weight in water. As a cosmetic ingredient it is an excellent humectant (draws moisture into skin). Safe for all skin types including sensitive and acne-prone skin. One of the most beneficial cosmetic ingredients available.",
    india_specific_note: "Now widely available in Indian skincare. Look for it in serums and moisturisers for dry and dehydrated skin.",
    score_impact: 5,
    data_quality: "VERIFIED"
  },

  "alcohol_denat": {
    ins_number: null,
    common_names: ["alcohol denat", "denatured alcohol", "sd alcohol", "alcohol", "ethanol", "isopropyl alcohol", "isopropanol"],
    function: "Solvent / Astringent",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "sensitive_skin", impact: "MODERATE", reason: "High concentrations of alcohol dry and irritate the skin barrier, especially in leave-on products", source: "Contact Dermatitis 2014" },
      { condition: "dry_skin", impact: "HIGH", reason: "Alcohol disrupts the lipid barrier, worsening dryness", source: "Journal of Investigative Dermatology 2012" }
    ],
    plain_explanation: "Denatured alcohol in cosmetics serves as a solvent, astringent, or preservative. In toners and some serums it gives a 'clean' feel but can strip the skin's natural oils. High on the ingredient list in a leave-on product is a red flag for dry or sensitive skin. Fine in rinse-off products.",
    india_specific_note: "Very common in Indian astringent toners and anti-acne products. Many Indian brands target oily skin with alcohol-heavy formulas — can cause rebound oiliness.",
    score_impact: -2,
    data_quality: "VERIFIED"
  },

  "salicylic_acid": {
    ins_number: null,
    common_names: ["salicylic acid", "beta hydroxy acid", "2-hydroxybenzoic acid"],
    function: "Exfoliant / Anti-Acne",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "pregnancy", impact: "HIGH", reason: "High concentrations of salicylic acid should be avoided during pregnancy; OTC topical levels (0.5–2%) are likely fine but caution is advised", source: "American College of Obstetricians and Gynecologists" },
      { condition: "aspirin_allergy", impact: "MODERATE", reason: "Structurally related to aspirin; may cross-react in highly sensitive individuals", source: "Allergology International 2015" }
    ],
    plain_explanation: "A beta-hydroxy acid that exfoliates inside pores — ideal for acne-prone and oily skin. Effective at unclogging pores and reducing blackheads. Safe at OTC concentrations (0.5–2%). Avoid high-strength peels during pregnancy.",
    india_specific_note: "Available OTC in India in face washes and toners. Highly effective for the acne-prone skin type common in India's humid climate.",
    score_impact: 3,
    data_quality: "VERIFIED"
  },

  "titanium_dioxide_cosmetic": {
    ins_number: null,
    common_names: ["titanium dioxide", "ci 77891", "titanium white"],
    function: "UV Filter / White Pigment",
    safety_tier: "SAFE",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [],
    plain_explanation: "A physical sunscreen agent and white pigment. Safe and effective as a UV filter in sunscreens and cosmetics. Does not absorb into skin. Considered one of the safest sunscreen actives. Also used as a whitening agent in foundations and powders.",
    india_specific_note: "Present in most Indian sunscreens and fairness products. A safe ingredient — however, some cheap powders use it as the only 'fairness' agent with no real SPF protection.",
    score_impact: 2,
    data_quality: "VERIFIED"
  },

  "zinc_oxide_cosmetic": {
    ins_number: null,
    common_names: ["zinc oxide", "ci 77947", "zinc white"],
    function: "UV Filter / Skin Protectant",
    safety_tier: "SAFE",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [],
    plain_explanation: "A broad-spectrum physical UV filter that blocks both UVA and UVB rays. Also has anti-inflammatory and skin-soothing properties. Safe for all skin types including sensitive and baby skin. One of the best sunscreen ingredients available.",
    india_specific_note: "Recommended by Indian dermatologists for sensitive skin and for children. More photostable than chemical sunscreen filters.",
    score_impact: 3,
    data_quality: "VERIFIED"
  },

  "oxybenzone": {
    ins_number: null,
    common_names: ["oxybenzone", "benzophenone-3", "bp-3", "2-hydroxy-4-methoxybenzophenone"],
    function: "Chemical UV Filter",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "hormone_disruption", impact: "MODERATE", reason: "FDA 2019 found oxybenzone absorbs into bloodstream; potential endocrine disruption at high exposures", source: "FDA Sunscreen Study, JAMA 2019" },
      { condition: "sensitive_skin", impact: "MODERATE", reason: "Among the more allergenic chemical sunscreen filters", source: "Contact Dermatitis 2017" }
    ],
    plain_explanation: "A chemical sunscreen filter absorbed into the bloodstream with daily use. The FDA proposed in 2019 that it may not be 'generally recognized as safe' — a significant concern. Hawaii banned it in sunscreens due to coral reef damage. Physical alternatives (zinc oxide, titanium dioxide) are safer choices.",
    india_specific_note: "Common in Indian sunscreens. Indian dermatologists are increasingly recommending physical filters over oxybenzone-heavy formulas.",
    score_impact: -4,
    data_quality: "VERIFIED"
  },

  // ── HOUSEHOLD PRODUCT INGREDIENTS ──────────────────────────────────────────

  "sodium_hypochlorite": {
    ins_number: null,
    common_names: ["sodium hypochlorite", "bleach", "chlorine bleach", "household bleach", "active chlorine"],
    function: "Disinfectant / Bleaching Agent",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "asthma", impact: "HIGH", reason: "Chlorine fumes released during use can trigger asthma attacks", source: "ICMR Occupational Health Guidelines 2018" },
      { condition: "children", impact: "HIGH", reason: "Accidental ingestion risk; should be stored away from children", source: "National Poison Control" }
    ],
    plain_explanation: "The active ingredient in household bleach. Effective disinfectant and stain remover. Dangerous if mixed with ammonia (releases toxic chloramine gas) or acids (releases chlorine gas). Requires ventilation when used.",
    india_specific_note: "Sold as Harpic, Colin, Lizol variants in India. Never mix with other cleaners. Keep away from children.",
    score_impact: -5,
    data_quality: "VERIFIED"
  },

  "quaternary_ammonium": {
    ins_number: null,
    common_names: ["benzalkonium chloride", "quaternary ammonium", "quat", "didecyldimethylammonium chloride", "cetrimonium chloride", "cetrimide"],
    function: "Disinfectant / Preservative",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "asthma", impact: "MODERATE", reason: "Quaternary ammonium compounds are respiratory irritants with repeated occupational exposure", source: "American Journal of Respiratory and Critical Care Medicine 2020" }
    ],
    plain_explanation: "A class of disinfectants found in surface cleaners, hand sanitisers, and some personal care products. Effective against bacteria and viruses. Associated with antibiotic resistance with regular use. Can be a skin irritant at high concentrations.",
    india_specific_note: "Common in Dettol-type products and post-COVID surface disinfectants in India. Safe when used as directed; avoid frequent skin contact.",
    score_impact: -4,
    data_quality: "VERIFIED"
  },

  "phosphates_household": {
    ins_number: null,
    common_names: ["phosphates", "sodium phosphate", "trisodium phosphate", "polyphosphates"],
    function: "Builder / Water Softener",
    safety_tier: "CAUTION",
    fssai_status: "NOT_APPLICABLE",
    condition_flags: [
      { condition: "environment", impact: "HIGH", reason: "Phosphates cause eutrophication in water bodies; banned in laundry detergents in EU, US, and many countries", source: "EU Regulation 648/2004" }
    ],
    plain_explanation: "Phosphate builders are used in detergents to soften water and improve cleaning. Highly effective but cause algae blooms in rivers and lakes, destroying aquatic ecosystems. Many Indian detergents still contain phosphates — a major environmental concern.",
    india_specific_note: "India has not yet banned phosphates in detergents unlike EU/US. Surf Excel, Ariel India still contain phosphates. An environmental concern for Indian rivers.",
    score_impact: -5,
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

  // Pass 1: exact normalised match on any alias.
  // Aliases are normalised at compare-time so "fd&c yellow 6" stored in DB
  // correctly matches input "fd&c yellow 6" after both are normalised.
  for (const entry of Object.values(INGREDIENT_DB)) {
    for (const alias of entry.common_names) {
      if (normaliseIngredientName(alias) === normalised) return entry;
    }
  }

  // Pass 2: substring match — only for aliases/keys ≥ 4 chars after normalisation.
  // The ≥ 4 char floor prevents dangerously short tokens (e.g. "ha", "ca", "e5")
  // from matching inside unrelated ingredient names via substring.
  for (const [key, entry] of Object.entries(INGREDIENT_DB)) {
    const normKey = normaliseIngredientName(key.replace(/_/g, ' '));
    if (normKey.length >= 4 && (normalised.includes(normKey) || normKey.includes(normalised))) return entry;
    for (const alias of entry.common_names) {
      const normAlias = normaliseIngredientName(alias);
      if (normAlias.length >= 4 && (normalised.includes(normAlias) || normAlias.includes(normalised))) return entry;
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
      : 100  // empty list = no unverified ingredients = 100% coverage
  };
}
