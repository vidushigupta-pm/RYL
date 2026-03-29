// src/data/familyProfiles.ts
// ─────────────────────────────────────────────────────────────────────────────
// Indian family profile system.
// Designed around how Indian households actually buy and share food.
// ─────────────────────────────────────────────────────────────────────────────

// ── Core enums ───────────────────────────────────────────────────────────────

export type AgeGroup =
  | 'INFANT_0_2'          // 0–2 years: no added salt/sugar/preservatives
  | 'CHILD_3_7'           // 3–7 years: colouring agents, high sugar flagged
  | 'CHILD_8_12'          // 8–12 years: Southampton Six, additives, caffeine
  | 'TEEN_13_17'          // 13–17 years: caffeine, high sodium, junk food
  | 'YOUNG_ADULT_18_25'   // 18–25 years: mostly healthy baseline
  | 'ADULT_26_45'         // 26–45 years: lifestyle diseases beginning
  | 'ADULT_46_60'         // 46–60 years: elevated cardiovascular risk
  | 'SENIOR_61_PLUS';     // 61+: diabetes, BP, kidney, digestion

export type Gender = 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY';

export type ActivityLevel =
  | 'SEDENTARY'           // desk job, minimal movement
  | 'LIGHTLY_ACTIVE'      // walks, light housework
  | 'MODERATELY_ACTIVE'   // exercises 3x/week
  | 'VERY_ACTIVE'         // daily gym / sports
  | 'ATHLETE';            // competitive sport / bodybuilding

export type HealthCondition =
  // Metabolic
  | 'DIABETES_T1'
  | 'DIABETES_T2'
  | 'PRE_DIABETES'
  | 'INSULIN_RESISTANCE'
  | 'OBESITY'
  // Cardiovascular
  | 'HYPERTENSION'
  | 'HIGH_CHOLESTEROL'
  | 'HEART_DISEASE'
  | 'HEART_ATTACK_HISTORY'
  // Hormonal
  | 'THYROID_HYPO'        // hypothyroidism — very common in Indian women
  | 'THYROID_HYPER'       // hyperthyroidism
  | 'PCOD_PCOS'           // very common in Indian women 15–45
  // Digestive
  | 'GUT_IBS'
  | 'ACID_REFLUX_GERD'
  | 'CELIAC_DISEASE'      // requires strict gluten-free
  | 'LACTOSE_INTOLERANCE'
  // Kidney / Liver
  | 'KIDNEY_DISEASE_CKD'
  | 'KIDNEY_STONES'
  | 'FATTY_LIVER'
  | 'LIVER_DISEASE'
  // Respiratory / Skin
  | 'ASTHMA'
  | 'ECZEMA_SENSITIVE_SKIN'
  // Life stage
  | 'PREGNANCY_T1'        // first trimester — most restrictive
  | 'PREGNANCY_T2'        // second trimester
  | 'PREGNANCY_T3'        // third trimester
  | 'LACTATING'
  | 'MENOPAUSE'
  // Child-specific
  | 'ADHD'                // artificial colours a high concern
  | 'AUTISM_SPECTRUM'
  // Fitness goals
  | 'MUSCLE_GAIN'
  | 'WEIGHT_LOSS'
  | 'ENDURANCE_TRAINING'
  // Other
  | 'URIC_ACID_GOUT'
  | 'ANEMIA'
  | 'OSTEOPOROSIS'
  | 'NONE';

export type Allergen =
  | 'GLUTEN'
  | 'DAIRY_MILK'
  | 'EGGS'
  | 'TREE_NUTS'           // almonds, cashews, walnuts, pistachios
  | 'PEANUTS'             // groundnuts — very common in Indian snacks
  | 'SOY'
  | 'SHELLFISH'
  | 'FISH'
  | 'SESAME'              // til — common in Indian food
  | 'MUSTARD'             // common in Indian food
  | 'SULPHITES'           // INS 220-228 — triggers asthma
  | 'TARTRAZINE_DYE';     // INS 102 — common sensitivity

export type DietaryPreference =
  | 'NO_RESTRICTION'
  | 'VEGETARIAN'
  | 'NON_VEGETARIAN'
  | 'VEGAN'
  | 'JAIN'                // no root vegetables, no onion/garlic
  | 'SATTVIC'             // no onion, garlic, meat, eggs
  | 'KETO'
  | 'LOW_CARB'
  | 'HIGH_PROTEIN'
  | 'LOW_SODIUM'
  | 'LOW_FAT'
  | 'DIABETIC_DIET';

// ── Profile interface ────────────────────────────────────────────────────────

export interface FamilyProfile {
  id: string;
  display_name: string;          // "Dadi", "Mum", "Rahul", "Baby Arjun"
  avatar_emoji: string;
  age_group: AgeGroup;
  gender: Gender;
  activity_level: ActivityLevel;
  health_conditions: HealthCondition[];
  allergens: Allergen[];          // HARD STOP — always RED regardless of score
  dietary_preference: DietaryPreference;
  is_default: boolean;            // the primary shopper's profile
  created_at: string;
}

// ── Indian family archetypes ─────────────────────────────────────────────────
// Pre-built templates the user can pick from during onboarding.
// Saves time — they just confirm/edit rather than building from scratch.

export interface ProfileArchetype {
  id: string;
  label: string;                 // "Dada / Nana"
  sublabel: string;              // "Senior family member, 60+"
  emoji: string;
  description: string;           // shown during profile setup
  defaults: Partial<FamilyProfile>;
  common_conditions: HealthCondition[];   // pre-selected as defaults
  why_it_matters: string;        // shown to user explaining why profile matters
}

export const FAMILY_ARCHETYPES: ProfileArchetype[] = [
  {
    id: 'grandparent',
    label: 'Dada / Dadi / Nana / Nani',
    sublabel: 'Senior family member · 60+',
    emoji: '👴',
    description: 'Grandparents often have diabetes, high blood pressure, or both. Many Indian seniors also have kidney concerns and take multiple medications.',
    defaults: {
      age_group: 'SENIOR_61_PLUS',
      activity_level: 'LIGHTLY_ACTIVE',
      dietary_preference: 'VEGETARIAN',
    },
    common_conditions: ['DIABETES_T2', 'HYPERTENSION', 'HIGH_CHOLESTEROL'],
    why_it_matters: 'Seniors are most vulnerable to high sugar, high sodium, and artificial additives. Many packaged foods are unsafe for them even when labelled as "healthy".'
  },
  {
    id: 'parent_female',
    label: 'Mummy / Maa / Amma',
    sublabel: 'Female adult · 30–55',
    emoji: '👩',
    description: 'Indian women aged 30–50 have one of the highest rates of hypothyroidism and PCOD globally. These conditions interact strongly with certain food additives.',
    defaults: {
      age_group: 'ADULT_26_45',
      gender: 'FEMALE',
      activity_level: 'LIGHTLY_ACTIVE',
      dietary_preference: 'VEGETARIAN',
    },
    common_conditions: ['THYROID_HYPO', 'PCOD_PCOS'],
    why_it_matters: 'Thyroid and PCOD are heavily affected by certain additives, goitrogenic foods, and high-sugar products. Many "healthy" products contain ingredients that worsen these conditions.'
  },
  {
    id: 'parent_male',
    label: 'Papa / Babu / Appa',
    sublabel: 'Male adult · 35–55',
    emoji: '👨',
    description: 'Middle-aged Indian men with desk jobs are at high risk for early metabolic syndrome — pre-diabetes, high cholesterol, and fatty liver.',
    defaults: {
      age_group: 'ADULT_46_60',
      gender: 'MALE',
      activity_level: 'SEDENTARY',
      dietary_preference: 'NO_RESTRICTION',
    },
    common_conditions: ['HIGH_CHOLESTEROL', 'HYPERTENSION', 'FATTY_LIVER'],
    why_it_matters: 'Sedentary lifestyle + Indian diet high in refined carbs and salt creates a high-risk profile. Trans fats, palm oil, and hidden sugars are especially concerning.'
  },
  {
    id: 'young_child',
    label: 'Baccha / Chotu / Junior',
    sublabel: 'Child · 3–12 years',
    emoji: '🧒',
    description: 'Children are more vulnerable to artificial colours (linked to hyperactivity), excess sugar, and additives. Many "children\'s snacks" in India are actually very poorly rated for kids.',
    defaults: {
      age_group: 'CHILD_8_12',
      activity_level: 'VERY_ACTIVE',
      dietary_preference: 'VEGETARIAN',
    },
    common_conditions: ['NONE'],
    why_it_matters: 'European regulators require warning labels for 6 artificial colours in children\'s products. Indian regulations don\'t — so parents need to check themselves.'
  },
  {
    id: 'infant',
    label: 'Baby / Chhotu',
    sublabel: 'Infant · 0–2 years',
    emoji: '👶',
    description: 'Infants and toddlers have very strict dietary needs. No added salt, no added sugar, no preservatives, no artificial colours.',
    defaults: {
      age_group: 'INFANT_0_2',
      activity_level: 'LIGHTLY_ACTIVE',
      dietary_preference: 'NO_RESTRICTION',
    },
    common_conditions: ['NONE'],
    why_it_matters: 'Any product with preservatives, artificial colours, added salt above 0.1g, or added sugar is UNSAFE for infants. The scoring is dramatically more strict for this age group.'
  },
  {
    id: 'young_adult_gym',
    label: 'Fitness Bhaiya / Gym-Going Beta',
    sublabel: 'Young adult · 18–30 · Active',
    emoji: '🏋️',
    description: 'Gym-going young adults are tracking protein, watching trans fat and sugar, and trying to build muscle or lose fat.',
    defaults: {
      age_group: 'YOUNG_ADULT_18_25',
      activity_level: 'VERY_ACTIVE',
      dietary_preference: 'HIGH_PROTEIN',
    },
    common_conditions: ['MUSCLE_GAIN'],
    why_it_matters: 'Many Indian "protein" products are misleadingly labelled. High-protein claims often don\'t meet FSSAI thresholds. Hidden sugar in "health" bars is also very common.'
  },
  {
    id: 'pregnant',
    label: 'Pregnant / Expecting',
    sublabel: 'Pregnancy · any trimester',
    emoji: '🤰',
    description: 'Pregnant women need to avoid a specific set of food additives, artificial sweeteners, high-mercury ingredients, and excess Vitamin A. The restrictions vary by trimester.',
    defaults: {
      age_group: 'ADULT_26_45',
      gender: 'FEMALE',
      activity_level: 'LIGHTLY_ACTIVE',
      dietary_preference: 'NO_RESTRICTION',
    },
    common_conditions: ['PREGNANCY_T1'],
    why_it_matters: 'Pregnancy has the strictest ingredient restrictions of any profile. Aspartame (possible carcinogen), nitrites, high-mercury fish, excess Vitamin A, and raw sprouts are all serious concerns.'
  },
  {
    id: 'diabetic_adult',
    label: 'Sugar Patient',
    sublabel: 'Diabetes / Pre-diabetes',
    emoji: '🩺',
    description: 'For someone managing blood sugar, hidden sugars, high-GI fillers like maltodextrin, and misleading "sugar-free" claims are everyday dangers.',
    defaults: {
      age_group: 'ADULT_46_60',
      activity_level: 'LIGHTLY_ACTIVE',
      dietary_preference: 'DIABETIC_DIET',
    },
    common_conditions: ['DIABETES_T2', 'HYPERTENSION'],
    why_it_matters: 'Products labelled "diabetic-friendly" or "no added sugar" often contain maltodextrin, glucose syrup, or fruit concentrate — all of which spike blood sugar just as fast as regular sugar.'
  },
  {
    id: 'myself',
    label: 'Myself',
    sublabel: 'Build your own profile',
    emoji: '🧑',
    description: 'Set up your own profile with your specific health conditions and goals.',
    defaults: {
      age_group: 'ADULT_26_45',
      activity_level: 'MODERATELY_ACTIVE',
      dietary_preference: 'NO_RESTRICTION',
    },
    common_conditions: ['NONE'],
    why_it_matters: 'Personalised scoring based on your specific conditions and goals.'
  }
];

// ── Condition display metadata ────────────────────────────────────────────────
// Used in the profile setup UI to show conditions grouped by category

export const CONDITION_GROUPS: Array<{
  group: string;
  emoji: string;
  conditions: Array<{ id: HealthCondition; label: string; description: string }>
}> = [
  {
    group: "Metabolic",
    emoji: "🩸",
    conditions: [
      { id: "DIABETES_T2", label: "Type 2 Diabetes", description: "Sugar and high-GI foods heavily penalised" },
      { id: "DIABETES_T1", label: "Type 1 Diabetes", description: "Same as T2 for food assessment" },
      { id: "PRE_DIABETES", label: "Pre-Diabetes", description: "Sugar moderation flags apply" },
      { id: "INSULIN_RESISTANCE", label: "Insulin Resistance", description: "High-GI foods flagged" },
      { id: "OBESITY", label: "Obesity / Weight Loss", description: "Calorie density and satiety considered" },
    ]
  },
  {
    group: "Heart & Blood Pressure",
    emoji: "❤️",
    conditions: [
      { id: "HYPERTENSION", label: "High Blood Pressure", description: "Sodium strictly monitored" },
      { id: "HIGH_CHOLESTEROL", label: "High Cholesterol", description: "Saturated fat, trans fat flagged" },
      { id: "HEART_DISEASE", label: "Heart Disease", description: "Trans fat, saturated fat, sodium — all flagged" },
      { id: "HEART_ATTACK_HISTORY", label: "Heart Attack History", description: "Most restrictive cardiovascular profile" },
    ]
  },
  {
    group: "Hormonal",
    emoji: "⚗️",
    conditions: [
      { id: "THYROID_HYPO", label: "Hypothyroidism", description: "Goitrogenic additives and soy flagged" },
      { id: "THYROID_HYPER", label: "Hyperthyroidism", description: "Iodine-heavy ingredients noted" },
      { id: "PCOD_PCOS", label: "PCOD / PCOS", description: "High sugar, refined carbs, and certain additives flagged" },
      { id: "MENOPAUSE", label: "Menopause", description: "Calcium, Vitamin D, and phytoestrogen considerations" },
    ]
  },
  {
    group: "Digestive",
    emoji: "🫁",
    conditions: [
      { id: "GUT_IBS", label: "IBS / Gut Sensitivity", description: "Carrageenan, certain sweeteners flagged" },
      { id: "ACID_REFLUX_GERD", label: "Acid Reflux / GERD", description: "Citric acid, spicy, high-fat flagged" },
      { id: "CELIAC_DISEASE", label: "Coeliac Disease", description: "Gluten — automatic AVOID" },
      { id: "LACTOSE_INTOLERANCE", label: "Lactose Intolerance", description: "Dairy derivatives flagged" },
      { id: "FATTY_LIVER", label: "Fatty Liver", description: "High fructose, alcohol derivatives, trans fat flagged" },
      { id: "KIDNEY_DISEASE_CKD", label: "Kidney Disease", description: "Phosphates, potassium, sodium all restricted" },
      { id: "KIDNEY_STONES", label: "Kidney Stones", description: "Oxalates, high protein flagged" },
      { id: "URIC_ACID_GOUT", label: "Uric Acid / Gout", description: "Purine-rich additives (INS 627, 631) flagged" },
    ]
  },
  {
    group: "Life Stage",
    emoji: "🌱",
    conditions: [
      { id: "PREGNANCY_T1", label: "Pregnant (1st Trimester)", description: "Most restrictive — aspartame, nitrites, high Vit A avoided" },
      { id: "PREGNANCY_T2", label: "Pregnant (2nd Trimester)", description: "Iron, folate needs considered" },
      { id: "PREGNANCY_T3", label: "Pregnant (3rd Trimester)", description: "Sodium, sugar, mercury fish flagged" },
      { id: "LACTATING", label: "Breastfeeding", description: "Caffeine, alcohol derivatives, certain additives noted" },
    ]
  },
  {
    group: "Children & Sensitivities",
    emoji: "🧒",
    conditions: [
      { id: "ADHD", label: "ADHD", description: "Southampton Six artificial colours flagged HIGH" },
      { id: "ASTHMA", label: "Asthma", description: "Sulphites (INS 220-228) flagged — known triggers" },
      { id: "ASTHMA", label: "Asthma", description: "Sulphites (INS 220-228) flagged — known triggers" },
      { id: "ECZEMA_SENSITIVE_SKIN", label: "Eczema / Sensitive Skin", description: "Artificial colours and preservatives flagged" },
    ]
  },
  {
    group: "Fitness Goals",
    emoji: "🏋️",
    conditions: [
      { id: "MUSCLE_GAIN", label: "Muscle Building", description: "Protein content rewarded; protein claims verified" },
      { id: "WEIGHT_LOSS", label: "Weight Loss", description: "Calorie density, sugar, refined carbs flagged" },
      { id: "ENDURANCE_TRAINING", label: "Endurance / Running", description: "Electrolytes, carb sources considered" },
    ]
  },
  {
    group: "Nutritional",
    emoji: "💊",
    conditions: [
      { id: "ANEMIA", label: "Anaemia", description: "Iron absorption inhibitors (tea tannins, calcium) noted" },
      { id: "OSTEOPOROSIS", label: "Osteoporosis", description: "Calcium, Vitamin D, phosphoric acid considerations" },
    ]
  },
];

// ── Allergen display metadata ─────────────────────────────────────────────────

export const ALLERGEN_OPTIONS: Array<{ id: Allergen; label: string; emoji: string; india_note?: string }> = [
  { id: 'PEANUTS',         label: 'Peanuts / Groundnuts', emoji: '🥜', india_note: 'Very common in Indian snacks, chutneys, and cooking oils' },
  { id: 'DAIRY_MILK',      label: 'Dairy / Milk',          emoji: '🥛', india_note: 'Present in most Indian mithai, biscuits, and chocolates' },
  { id: 'GLUTEN',          label: 'Gluten / Wheat',        emoji: '🌾', india_note: 'Present in most Indian packaged snacks and breads' },
  { id: 'TREE_NUTS',       label: 'Tree Nuts',             emoji: '🌰', india_note: 'Cashews, almonds, walnuts — common in Indian sweets' },
  { id: 'SOY',             label: 'Soy',                   emoji: '🫘', india_note: 'Hidden in many products as soy lecithin or protein' },
  { id: 'SESAME',          label: 'Sesame (Til)',           emoji: '⚪', india_note: 'Common in Indian snacks, breads, and til-based sweets' },
  { id: 'MUSTARD',         label: 'Mustard (Sarson)',       emoji: '🌭', india_note: 'Common in Indian food — mustard oil widely used' },
  { id: 'EGGS',            label: 'Eggs',                  emoji: '🥚', india_note: 'Many vegetarian Indians avoid eggs; hidden in some products' },
  { id: 'FISH',            label: 'Fish',                  emoji: '🐟', india_note: 'Fish sauce, fish collagen used in some products' },
  { id: 'SHELLFISH',       label: 'Shellfish',             emoji: '🦐', india_note: null },
  { id: 'SULPHITES',       label: 'Sulphites (INS 220–228)', emoji: '⚗️', india_note: 'Hidden in dried fruits, wine, juices — major asthma trigger' },
  { id: 'TARTRAZINE_DYE',  label: 'Tartrazine / Yellow Dye', emoji: '🟡', india_note: 'INS 102 — very common in Indian snacks, drinks, and mithai' },
];

// ── Activity level display ────────────────────────────────────────────────────

export const ACTIVITY_LEVELS: Array<{
  id: ActivityLevel;
  label: string;
  description: string;
  emoji: string;
  india_example: string;
}> = [
  {
    id: 'SEDENTARY',
    label: 'Sedentary',
    description: 'Sitting most of the day, minimal exercise',
    emoji: '💺',
    india_example: 'Desk job, watching TV, minimal walking'
  },
  {
    id: 'LIGHTLY_ACTIVE',
    label: 'Lightly Active',
    description: 'Light daily activity like walking and household work',
    emoji: '🚶',
    india_example: 'Daily household work, morning walk, light cooking'
  },
  {
    id: 'MODERATELY_ACTIVE',
    label: 'Moderately Active',
    description: 'Exercise 3–4 times a week',
    emoji: '🏃',
    india_example: 'Evening walks + weekend cricket/badminton'
  },
  {
    id: 'VERY_ACTIVE',
    label: 'Very Active',
    description: 'Exercise daily or physically demanding job',
    emoji: '🏋️',
    india_example: 'Daily gym, yoga, or physical labour'
  },
  {
    id: 'ATHLETE',
    label: 'Athlete / High Performance',
    description: 'Competitive sport or bodybuilding',
    emoji: '🏆',
    india_example: 'Competitive gym, running, sport-specific training'
  },
];

// ── Age group display ─────────────────────────────────────────────────────────

export const AGE_GROUPS: Array<{ id: AgeGroup; label: string; range: string }> = [
  { id: 'INFANT_0_2',        label: 'Baby',          range: '0–2 years' },
  { id: 'CHILD_3_7',         label: 'Young Child',   range: '3–7 years' },
  { id: 'CHILD_8_12',        label: 'Child',         range: '8–12 years' },
  { id: 'TEEN_13_17',        label: 'Teenager',      range: '13–17 years' },
  { id: 'YOUNG_ADULT_18_25', label: 'Young Adult',   range: '18–25 years' },
  { id: 'ADULT_26_45',       label: 'Adult',         range: '26–45 years' },
  { id: 'ADULT_46_60',       label: 'Middle-Aged',   range: '46–60 years' },
  { id: 'SENIOR_61_PLUS',    label: 'Senior',        range: '61+ years' },
];

// ── Default profiles (shown before user sets up their own) ───────────────────

export const DEFAULT_PROFILES: FamilyProfile[] = [
  {
    id: 'default_self',
    display_name: 'Me',
    avatar_emoji: '🧑',
    age_group: 'ADULT_26_45',
    gender: 'PREFER_NOT_TO_SAY',
    activity_level: 'MODERATELY_ACTIVE',
    health_conditions: ['NONE'],
    allergens: [],
    dietary_preference: 'NO_RESTRICTION',
    is_default: true,
    created_at: new Date().toISOString()
  }
];

// ── Emoji picker for avatars ──────────────────────────────────────────────────

export const AVATAR_OPTIONS = [
  '🧑', '👩', '👨', '👧', '👦', '👶',
  '👵', '👴', '🧓', '🤰', '🏋️', '🧑‍🍳',
  '👩‍⚕️', '👨‍💼', '🧑‍🎓', '🧑‍🌾', '🏃', '🧘',
];
