/**
 * ======================================================================
 *  RYL DATABASE — Gemini Auto-Ingestion (Google Apps Script)
 *
 *  Gemini covers:
 *    Category 1 — PERSONAL CARE   (Days  1–10, ~200 products)
 *    Category 2 — SUPPLEMENTS     (Days 11–20, ~200 products)
 *    Category 3 — PET FOOD        (Days 21–30, ~200 products)
 *
 *  WHY GEMINI FOR THESE:
 *  - Personal Care: Gemini knows Indian CDSCO regs + Ayurvedic brands best
 *  - Supplements: Gemini knows FSSAI Health Supplement Regs 2022 + Ayurveda
 *  - Pet Food: Gemini knows Indian Prevention of Cruelty to Animals Act
 *
 * ──────────────────────────────────────────────────────────────────────
 *  ONE-TIME SETUP (5 minutes):
 *  1. Go to script.google.com → New Project → paste this entire file
 *  2. Project Settings → Script Properties → Add:
 *       GEMINI_API_KEY  =  your free key from aistudio.google.com
 *       GOOGLE_DOC_ID   =  ID from your Google Doc URL (long string)
 *  3. Click Run → runDailyIngestion → Allow permissions
 *  4. Triggers (clock icon) → Add Trigger:
 *       Function:   runDailyIngestion
 *       Event type: Time-driven → Day timer → 8:00 AM–9:00 AM
 *  5. Done. Runs every day at 8 AM. Output saves to your Google Doc.
 *     Share that Doc with Claude at the end of each week.
 * ======================================================================
 */

// ── Daily prompts: Gemini's 3 categories ─────────────────────────────────────

const DAILY_PROMPTS = [

  // ══════════════════════════════════════════════════════════════════════
  //  CATEGORY 1 — PERSONAL CARE (Days 1–10)
  //  Covers: Shampoo, Conditioner, Soap, Body Wash, Toothpaste,
  //          Hair Oil, Face Wash, Skincare Creams, Deodorant, Baby Care
  // ══════════════════════════════════════════════════════════════════════

  {
    day: 1, category: 'PERSONAL_CARE', sub: 'Shampoo #1–20',
    prompt: `You are building a product safety database for Indian consumers. Generate data for the 20 most popular SHAMPOO products sold in India ranked #1 to #20 by market share 2024. Include: Dove Shampoo India, Head & Shoulders India, Pantene India, Clinic Plus, Sunsilk India, TRESemmé India, Himalaya Herbals Shampoo, Biotique Bio Kelp Shampoo, WOW Apple Cider Vinegar Shampoo, Mamaearth Onion Shampoo, Indulekha Bringha Shampoo. Use INDIA label formulations. Output a valid JSON array ONLY (no text before or after). Each item: { "id": "brand_productname_lowercase_underscores", "product_name": "Full name as on India label", "brand": "Brand", "category": "PERSONAL_CARE", "sub_category": "SHAMPOO", "nutrition_per_100g": null, "ingredients": ["INCI name 1", "INCI name 2 — in descending concentration as on India label, include INS numbers if any"], "is_upf": false, "nova_group": null, "allergens": ["fragrance","parabens" — only those present], "fssai_note": "cite relevant CDSCO Cosmetics Rules 2020 regulation" }`
  },

  {
    day: 2, category: 'PERSONAL_CARE', sub: 'Conditioner & Hair Mask #1–20',
    prompt: `Same JSON schema. 20 most popular HAIR CONDITIONER and HAIR MASK products sold in India 2024. Include: Dove Intense Repair Conditioner India, Pantene Smooth & Silky Conditioner India, TRESemmé Smooth & Shine, Himalaya Protein Conditioner, Mamaearth Onion Conditioner, WOW Coconut Milk Hair Mask, Streax Pro Conditioner, Garnier Fructis India, L'Oreal Extraordinary Oil India. INDIA formulations. category: "PERSONAL_CARE", sub_category: "HAIR_CONDITIONER". nutrition_per_100g: null. nova_group: null. is_upf: false. INCI ingredients descending concentration. JSON array only.`
  },

  {
    day: 3, category: 'PERSONAL_CARE', sub: 'Soap & Body Wash #1–20',
    prompt: `Same JSON schema. 20 most popular SOAP and BODY WASH products sold in India 2024. Include: Lux India, Dove Beauty Bar India, Dettol Original Soap, Lifebuoy Total Protection, Pears Soft & Fresh India, Santoor Sandal & Turmeric, Himalaya Neem & Turmeric Soap, Nivea Cream Soft India, Fiama Shower Gel, Margo Neem Original, Godrej No.1. INDIA formulations. category: "PERSONAL_CARE", sub_category: "SOAP". nutrition null. nova null. is_upf: false. JSON array only.`
  },

  {
    day: 4, category: 'PERSONAL_CARE', sub: 'Toothpaste & Oral Care #1–20',
    prompt: `Same JSON schema. 20 most popular TOOTHPASTE and ORAL CARE products sold in India 2024. Include: Colgate Strong Teeth, Colgate MaxFresh, Colgate Sensitive Expert, Colgate Total India, Pepsodent Germicheck, Oral-B Complete India, Dabur Red Paste (Ayurvedic — no fluoride, flag this), Patanjali Dant Kanti (no fluoride), Himalaya Dental Cream, Sensodyne Rapid Relief India, Close Up Red Hot. Flag: Fluoride concentration per 1000g paste, SLS (Sodium Lauryl Sulphate — can cause mouth ulcers), Triclosan (banned in some countries). category: "PERSONAL_CARE", sub_category: "ORAL_CARE". nutrition null. JSON array only.`
  },

  {
    day: 5, category: 'PERSONAL_CARE', sub: 'Hair Oil #1–20',
    prompt: `Same JSON schema. 20 most popular HAIR OIL products sold in India 2024. Include: Parachute Coconut Oil, Marico Nihar Naturals, Bajaj Almond Drops, Dabur Amla Gold Hair Oil, Dabur Vatika Enriched Coconut Hair Oil, Indulekha Bringha Hair Oil, Kesh King Scalp & Hair Medicine, Himalaya Anti-Dandruff Hair Oil, Patanjali Kesh Kanti Hair Oil, Biotique Bio Bhringraj Hair Oil. category: "PERSONAL_CARE", sub_category: "HAIR_OIL". nutrition null. nova null. is_upf: false. JSON array only.`
  },

  {
    day: 6, category: 'PERSONAL_CARE', sub: 'Face Wash #1–20',
    prompt: `Same JSON schema. 20 most popular FACE WASH products sold in India 2024. Include: Himalaya Neem Face Wash, Pond's Pure White Facewash, Clean & Clear Foaming Face Wash India, Cetaphil Gentle Skin Cleanser India, Neutrogena Deep Clean India, Biotique Bio Foam Face Wash, Mamaearth Tea Tree Face Wash, Plum E-Luminence Facewash, WOW Ubtan Face Wash, mCaffeine Coffee Face Wash. Flag: SLS/SLES (skin barrier damage with overuse), Parabens, Microbeads (banned in India and globally). category: "PERSONAL_CARE", sub_category: "FACE_WASH". nutrition null. JSON array only.`
  },

  {
    day: 7, category: 'PERSONAL_CARE', sub: 'Moisturiser & Face Cream #1–20',
    prompt: `Same JSON schema. 20 most popular MOISTURISER and FACE CREAM products sold in India 2024. Include: Pond's Moisturising Cold Cream India, Lakme Peach Milk Moisturiser, Olay Total Effects India, Neutrogena Hydro Boost India, Nivea Soft India, Biotique Bio Coconut Whitening Cream, Himalaya Moisturising Cream, Cetaphil Moisturising Cream India, Mamaearth Ubtan Face Cream, Dot & Key Waterlight Gel. Flag: Hydroquinone (Rx-only in India), Mercury compounds (BANNED), Steroids (Rx-only), Parabens, Retinol (avoid in pregnancy). category: "COSMETIC", sub_category: "MOISTURISER". nutrition null. INCI ingredients. JSON array only.`
  },

  {
    day: 8, category: 'PERSONAL_CARE', sub: 'Deodorant #1–20',
    prompt: `Same JSON schema. 20 most popular DEODORANT and ANTIPERSPIRANT products sold in India 2024. Include: Fogg Fresh Body Spray (India's #1 deo), Fogg Scent, Axe India variants, Engage variants, Wild Stone variants, Park Avenue, Nivea Deo India, Dove Deo India, Old Spice India, Yardley London India. Flag: Aluminium Chlorohydrate/Zirconium (antiperspirant — breast cancer concern debated), Triclosan, Synthetic fragrances (phthalates as fixatives, allergens), Aerosol propellants (LPG/isobutane). category: "PERSONAL_CARE", sub_category: "DEODORANT". nutrition null. JSON array only.`
  },

  {
    day: 9, category: 'PERSONAL_CARE', sub: 'Shaving & Men Grooming #1–20',
    prompt: `Same JSON schema. 20 most popular SHAVING and MEN'S GROOMING products sold in India 2024. Include: Gillette Shaving Gel/Foam India variants, Dettol Shave Gel India, Axe Shaving Gel, Bombay Shaving Company (India brand), Beardo products, Ustraa products, Nivea Men India, Old Spice Shave Foam India, Brylcreem India. category: "PERSONAL_CARE", sub_category: "MENS_GROOMING". nutrition null. JSON array only.`
  },

  {
    day: 10, category: 'PERSONAL_CARE', sub: 'Feminine & Intimate Care #1–20',
    prompt: `Same JSON schema. 20 most popular FEMININE HYGIENE and INTIMATE CARE products sold in India 2024. Include: Whisper Ultra India, Stayfree India, Sofy India, Paree Sanitary Pads, Niine Biodegradable Pads, PeeSafe Intimate Wash, Sirona Intimate Wash, Lactacyd India, Carmesi Natural Pads, Sirona Menstrual Cup. Flag: Dioxin residue in bleached pads, Synthetic fragrance in intimate washes (microbiome disruption), Chlorine bleaching. category: "PERSONAL_CARE", sub_category: "FEMININE_CARE". nutrition null. JSON array only.`
  },

  // ══════════════════════════════════════════════════════════════════════
  //  CATEGORY 2 — SUPPLEMENTS & HEALTH FOODS (Days 11–20)
  //  Covers: Protein, Vitamins, Ayurvedic, Herbal, Sports Nutrition,
  //          Health Bars, Medical Nutrition, Probiotics, Children's Health
  // ══════════════════════════════════════════════════════════════════════

  {
    day: 11, category: 'SUPPLEMENT', sub: 'Protein Supplements #1–20',
    prompt: `Same JSON schema. 20 most popular PROTEIN SUPPLEMENT products sold in India 2024. Include: Muscleblaze Biozyme Whey India, Healthkart HK Vitals Whey, Optimum Nutrition Gold Standard India, GNC Pro Performance India, Oziva Plant Protein, Fast & Up Whey, Ritebite Max Protein, Avvatar Whey India, Nakpro Gold Whey, Big Muscles Nitro Whey. Note: India protein supplement formulations may differ from US — check for added sugar, artificial sweeteners. category: "SUPPLEMENT", sub_category: "PROTEIN". fssai_note: cite FSSAI Health Supplements Nutraceuticals Regulations 2022. JSON array only: { id, product_name, brand, category: "SUPPLEMENT", sub_category: "PROTEIN", nutrition_per_100g: {energy_kcal, protein_g, fat_g, saturated_fat_g, trans_fat_g, carbs_g, sugar_g, fibre_g, sodium_mg}, ingredients (India label), is_upf, nova_group, allergens, fssai_note }`
  },

  {
    day: 12, category: 'SUPPLEMENT', sub: 'Vitamins & Multivitamins #1–20',
    prompt: `Same schema. 20 most popular VITAMIN and MULTIVITAMIN supplement products sold in India 2024. Include: Healthkart HK Vitals Multivitamin, Wellbeing Nutrition Daily Greens, Revital H India (Sanofi), Supradyn India (Bayer), Seven Seas India, Centrum India, Himalaya Vitamin C, Oziva Wholefood Vitamin C, Fast & Up Vitalize, Himalaya Ashvagandha. Flag: Vitamin A toxicity risk (if above UL), Vitamin D toxicity (fat-soluble accumulation), Iron supplements (pro-oxidant at high doses). category: "SUPPLEMENT", sub_category: "VITAMINS". JSON array only.`
  },

  {
    day: 13, category: 'SUPPLEMENT', sub: 'Ayurvedic Supplements #1–20',
    prompt: `Same schema. 20 most popular AYURVEDIC SUPPLEMENT products sold in India 2024. Include: Dabur Chyawanprash, Baidyanath Chyawanprash, Patanjali Chyawanprash, Himalaya Ashvagandha tablets, Dabur Shilajit Gold, Kerala Ayurveda Ashvagandharishtam, Himalaya Liv.52, Dabur Honitus, Sri Sri Tattva Triphala, Organic India Ashwagandha. Flag: Heavy metal contamination risk in Ayurvedic products (AYUSH Ministry mandates testing), Lead/Mercury in some traditional formulations. category: "SUPPLEMENT", sub_category: "AYURVEDIC". fssai_note: cite AYUSH drug regulations alongside FSSAI. JSON array only.`
  },

  {
    day: 14, category: 'SUPPLEMENT', sub: 'Health Drinks & Meal Replacements #1–20',
    prompt: `Same schema. 20 most popular HEALTH DRINK and MEAL REPLACEMENT products sold in India 2024. Include: Protinex Original, Horlicks Growth+ (child nutrition), Complan Royale India, Pediasure India (Abbott), Ensure India (Abbott — for elderly), Glucerna India (for diabetics), Dr. Morepen Gluco, Nestle Resource High Protein, Rite Bite Meal Replacement, Oziva Meal. category: "SUPPLEMENT", sub_category: "HEALTH_DRINK". Include full nutrition and ingredients. JSON array only.`
  },

  {
    day: 15, category: 'SUPPLEMENT', sub: 'Sports Nutrition #1–20',
    prompt: `Same schema. 20 most popular SPORTS NUTRITION products sold in India 2024. Include: Muscleblaze Pre-workout, MuscleBlaze Creatine, BPI Sports India, Optimum Nutrition Creatine India, Fast & Up BCAA, Healthkart HK Vitals Fish Oil, GNC Mega Men Sport India, Enerzal (Zydus), Glucon-D (Heinz India), Electral ORS. Flag: Creatine safety for kidney concerns, excessive caffeine in pre-workouts, Banned WADA substances if any present. category: "SUPPLEMENT", sub_category: "SPORTS_NUTRITION". JSON array only.`
  },

  {
    day: 16, category: 'SUPPLEMENT', sub: 'Digestive & Gut Health #1–20',
    prompt: `Same schema. 20 most popular DIGESTIVE HEALTH and PROBIOTIC products sold in India 2024. Include: Yakult India, Enterogermina (Sanofi), Gut Microbiome by Wellbeing Nutrition, Healthkart Probiotic, Himalaya Liv.52 DS, Dabur Hajmola (digestive candy), Pudin Hara (Dabur), ENO Fruit Salt (GSK India), Isabgol/Psyllium Husk brands (Sat Isabgol), Baidyanath Churna digestive. category: "SUPPLEMENT", sub_category: "DIGESTIVE". JSON array only.`
  },

  {
    day: 17, category: 'SUPPLEMENT', sub: 'Weight Management #1–20',
    prompt: `Same schema. 20 most popular WEIGHT MANAGEMENT supplement products sold in India 2024. Include: Muscleblaze Fat Burner, HealthKart Garcinia Cambogia, Himalaya Vrikshamla (Garcinia), Oziva ThinOziva, Fast & Up Lean, Nature's Velvet CLA, Patanjali Divya Medohar Vati, Lipton Green Tea variants, Tetley Green Tea, Organic India Tulsi Green Tea. Flag: Garcinia Cambogia (liver damage risk at high doses — WHO warning), Synephrine (stimulant), Excessive caffeine. category: "SUPPLEMENT", sub_category: "WEIGHT_MANAGEMENT". JSON array only.`
  },

  {
    day: 18, category: 'SUPPLEMENT', sub: 'Children\'s Nutrition #1–20',
    prompt: `Same schema. 20 most popular CHILDREN'S NUTRITION and GROWTH supplement products sold in India 2024. Include: Bournvita (Cadbury India — flag high sugar content), Horlicks Junior India, Junior Horlicks Toddler, Boost (GSK India), Complan Height & Weight, Pediasure India, Protinex Junior, Nestlé Milo India, Dabur Honey (children's use), Cadbury 5 Star Chocolate Nutrition Drink. CRITICAL: Flag high sugar in children's health drinks — many Indian "health drinks" are primarily sugar. category: "SUPPLEMENT", sub_category: "CHILD_NUTRITION". JSON array only.`
  },

  {
    day: 19, category: 'SUPPLEMENT', sub: 'Women\'s Health Supplements #1–20',
    prompt: `Same schema. 20 most popular WOMEN'S HEALTH SUPPLEMENT products sold in India 2024. Include: Wellbeing Nutrition Myo-Inositol, Oziva Plant Based Iron, Himalaya Evecare, Himalaya Shatavari, Baidyanath Shatavari Granules, Dabur Stri Rasayan Vati, HealthKart HK Vitals for Women, Patanjali Shatavar Churna, Garden of Life Women's Multi India, Pregnacare India (for pregnancy). Flag: Iron toxicity risk, Vitamin A teratogenicity in pregnancy, Soy isoflavones (hormonal effect). category: "SUPPLEMENT", sub_category: "WOMENS_HEALTH". JSON array only.`
  },

  {
    day: 20, category: 'SUPPLEMENT', sub: 'Immunity & Speciality #1–20',
    prompt: `Same schema. 20 most popular IMMUNITY BOOSTER and SPECIALITY supplement products sold in India 2024 (many launched/popularised post-COVID). Include: Zandu Pancharishta, Dabur Immunity Kit, Himalaya Septilin, Kapiva Gold + Shilajit, Wellbeing Nutrition Melting Strips, Carbamide Forte Immunity, Naturyz Plant Vitamin C, Kerala Ayurveda Chyavanaprasham, Patanjali Coronil (note: AYUSH approved, not WHO approved — flag this distinction), Singh's Nutraceuticals. category: "SUPPLEMENT", sub_category: "IMMUNITY". JSON array only.`
  },

  // ══════════════════════════════════════════════════════════════════════
  //  CATEGORY 3 — PET FOOD (Days 21–30)
  //  Covers: Dog Dry Food, Dog Wet Food, Cat Dry Food, Cat Wet Food,
  //          Pet Treats, Pet Supplements, Fish/Bird/Small Animal Food
  // ══════════════════════════════════════════════════════════════════════

  {
    day: 21, category: 'PET_FOOD', sub: 'Dog Dry Food #1–20',
    prompt: `Same JSON schema but for PET FOOD. 20 most popular DRY DOG FOOD products sold in India 2024. Include: Royal Canin India (Adult, Maxi, Mini variants), Pedigree Adult Chicken & Vegetables India, Drools Focus Super Premium, Farmina N&D Dog India, Hills Science Diet India, Arden Grange India, Me-O Dog India, Kennel Kitchen India, Acana India, SmartHeart India Dog. List protein sources, preservatives used. Flag: Ethoxyquin (antioxidant — banned in EU, check India), BHA/BHT in pet food, Artificial colours in pet food (unnecessary). category: "PET_FOOD", sub_category: "DOG_DRY". nutrition_per_100g: include energy_kcal, protein_g, fat_g, fibre_g, sodium_mg. is_upf: false, nova_group: null. fssai_note: cite FSSAI pet food standards and Prevention of Cruelty to Animals Act. JSON array only.`
  },

  {
    day: 22, category: 'PET_FOOD', sub: 'Dog Wet Food & Treats #1–20',
    prompt: `Same schema. 20 most popular DOG WET FOOD and DOG TREAT products sold in India 2024. Include: Pedigree Wet Dog Food pouches India, Royal Canin wet variants India, Drools Wet Dog Food, Cesar India, Chappi India, Pedigree DentaStix India, Pedigree Milky Sticks, Drools Oven Baked Treats, Purina Beggin India, Himalaya PetCare Dog Treats. Flag: High sodium in wet food (cardiac/kidney risk for dogs), Xylitol (TOXIC to dogs — verify absence), Grapes/Raisins/Onion derivatives (TOXIC). category: "PET_FOOD", sub_category: "DOG_WET". nutrition per 100g. JSON array only.`
  },

  {
    day: 23, category: 'PET_FOOD', sub: 'Cat Dry Food #1–20',
    prompt: `Same schema. 20 most popular DRY CAT FOOD products sold in India 2024. Include: Royal Canin Cat India (Indoor, Hair & Skin, Kitten variants), Whiskas Dry India, Me-O Dry Cat India, Farmina N&D Cat India, Hills Science Diet Cat India, Purina Pro Plan Cat India, Drools Focus Cat, Acana Cat India, Orijen Cat India, SmartHeart Cat India. Note: Cats are obligate carnivores — flag if plant protein makes up majority of food. Flag: Propylene Glycol (BANNED in cat food in US, check India), Fish oil rancidity risk, High carbohydrates (unnatural for cats — diabetes/obesity risk). category: "PET_FOOD", sub_category: "CAT_DRY". JSON array only.`
  },

  {
    day: 24, category: 'PET_FOOD', sub: 'Cat Wet Food & Treats #1–20',
    prompt: `Same schema. 20 most popular CAT WET FOOD and CAT TREAT products sold in India 2024. Include: Whiskas Wet Pouches India (tuna, chicken variants), Royal Canin wet cat India, Me-O Creamy Treats India, Drools Cat Wet Food, Temptations Cat Treats India, Purina Fancy Feast India, Inaba Ciao Chururu (Japan brand popular in India), Kit Cat Tuna Mousse India, Himalaya PetCare Cat Treats. Flag: Carrageenan in wet cat food (gut inflammation), High phosphorus (kidney disease risk in cats). category: "PET_FOOD", sub_category: "CAT_WET". JSON array only.`
  },

  {
    day: 25, category: 'PET_FOOD', sub: 'Puppy & Kitten Food #1–20',
    prompt: `Same schema. 20 most popular PUPPY and KITTEN specific food products sold in India 2024. Include: Royal Canin Puppy India, Pedigree Puppy India, Drools Puppy India, Hills Science Diet Puppy India, Purina ProPlan Puppy India, Royal Canin Kitten India, Whiskas Kitten India, Me-O Kitten India. Critical life stage nutrition — flag: DHA levels (brain development), Calcium:Phosphorus ratio (bone development), Calorie density. category: "PET_FOOD", sub_category: "PUPPY_KITTEN". JSON array only.`
  },

  {
    day: 26, category: 'PET_FOOD', sub: 'Senior & Prescription Pet Food #1–20',
    prompt: `Same schema. 20 most popular SENIOR PET FOOD and PRESCRIPTION DIET products sold in India 2024. Include: Royal Canin Mature Consult India, Hills Science Diet Senior, Pedigree Senior India, Royal Canin Renal Cat India (for kidney disease), Royal Canin Diabetic Dog India, Hills Prescription Diet k/d India, Drools Senior Dog, Purina Pro Plan Senior Cat India. Flag: Phosphorus restriction in renal diets, Sodium restriction in cardiac diets, Lower calorie density needs. category: "PET_FOOD", sub_category: "SENIOR_PET". JSON array only.`
  },

  {
    day: 27, category: 'PET_FOOD', sub: 'Pet Supplements #1–20',
    prompt: `Same schema. 20 most popular PET SUPPLEMENT and PET HEALTH products sold in India 2024. Include: Himalaya PetCare Joint Support, Himalaya Erina Dog Shampoo (note: personal care), Beaphar India, NutriVet India, Zymox India, Pet Naturals of Vermont India, VetriScience India, Drools Absolute Calcium Supplement, Dogsee Chew Treats, Heads Up For Tails supplements. category: "PET_FOOD", sub_category: "PET_SUPPLEMENT". nutrition per 100g. is_upf: false, nova_group: null. JSON array only.`
  },

  {
    day: 28, category: 'PET_FOOD', sub: 'Fish & Aquatic Pet Food #1–20',
    prompt: `Same schema. 20 most popular FISH and AQUATIC PET FOOD products sold in India 2024. Include: Taiyo Fish Food India, Sera Vipan Germany (sold in India), Tetra Min India, Wardley Premium India, Ocean Free India, API Fish Food India, Hikari India fish food, Saki-Hikari India, Aqueon India, Anubias fish food. Flag: Ethoxyquin (common fish food preservative — banned in EU for human food), Dyes/artificial colours in fish food. category: "PET_FOOD", sub_category: "FISH_FOOD". JSON array only.`
  },

  {
    day: 29, category: 'PET_FOOD', sub: 'Bird & Small Animal Food #1–20',
    prompt: `Same schema. 20 most popular BIRD FOOD and SMALL ANIMAL (rabbit, hamster, guinea pig) food products sold in India 2024. Include: Versele-Laga Prestige India (parrot, budgie), Higgins India bird food, Kaytee India guinea pig/hamster food, Oxbow India rabbit hay/pellets, Vitapol India, Sharples & Grant India, Mr. Johnson's Supreme India, Padovan India small animal food. Flag: Avocado in bird food (TOXIC), Sunflower seed excess (fatty liver in parrots), Artificially coloured seed mixtures. category: "PET_FOOD", sub_category: "BIRD_SMALL_ANIMAL". JSON array only.`
  },

  {
    day: 30, category: 'PET_FOOD', sub: 'Raw & Natural Pet Food #1–20',
    prompt: `Same schema. 20 most popular RAW, NATURAL, and GRAIN-FREE pet food products sold in India 2024. Include: Pawsitively Gourmet India, The Whole Meal India, Heads Up For Tails Raw India, Drools Absolute Raw India, I And Love And You India, Orijen Original India, Acana Pacifica India, Canidae All Life Stages India, Taste of the Wild India, Natures Variety India. Flag: Salmonella risk in raw pet food (zoonotic — risk to humans handling it), BARF diet nutritional imbalances, Grain-free diets (DCM — dilated cardiomyopathy link in dogs). category: "PET_FOOD", sub_category: "RAW_NATURAL". JSON array only.`
  }

];

// ── Core automation logic ─────────────────────────────────────────────────────

function runDailyIngestion() {
  const props  = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('GEMINI_API_KEY');
  const docId  = props.getProperty('GOOGLE_DOC_ID');

  if (!apiKey) { Logger.log('ERROR: GEMINI_API_KEY not set in Script Properties.'); return; }
  if (!docId)  { Logger.log('ERROR: GOOGLE_DOC_ID not set in Script Properties.');  return; }

  const currentDay = parseInt(props.getProperty('CURRENT_DAY') || '0');

  if (currentDay >= DAILY_PROMPTS.length) {
    Logger.log('All ' + DAILY_PROMPTS.length + ' days completed!');
    appendToDoc(docId, 'DONE', 'ALL DONE', '✅ All Gemini batches completed on ' + new Date().toLocaleDateString('en-IN') + '. Share this Doc with Claude to update the database.');
    return;
  }

  const batch = DAILY_PROMPTS[currentDay];
  Logger.log('Running Day ' + batch.day + ': ' + batch.category + ' — ' + batch.sub);

  try {
    const output = callGeminiAPI(apiKey, batch.prompt);
    appendToDoc(docId, batch.day, batch.category + ' — ' + batch.sub, output);
    props.setProperty('CURRENT_DAY', String(currentDay + 1));
    Logger.log('Done. Next: Day ' + (batch.day + 1));
  } catch (e) {
    Logger.log('Error on Day ' + batch.day + ': ' + e);
    // Do NOT increment — will retry tomorrow automatically
  }
}

// ── Gemini API call ───────────────────────────────────────────────────────────

function callGeminiAPI(apiKey, prompt) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;

  const payload = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      maxOutputTokens: 8192,
    }
  });

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: payload,
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  const text = response.getContentText();

  if (code !== 200) throw new Error('HTTP ' + code + ': ' + text.slice(0, 300));

  const json = JSON.parse(text);
  if (!json.candidates?.[0]) throw new Error('No response from Gemini: ' + text.slice(0, 200));

  return json.candidates[0].content.parts[0].text;
}

// ── Save to Google Doc ────────────────────────────────────────────────────────

function appendToDoc(docId, dayNumber, label, content) {
  const doc  = DocumentApp.openById(docId);
  const body = doc.getBody();
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const heading = body.appendParagraph('DAY ' + dayNumber + ' — ' + label + '  (' + date + ')');
  heading.setHeading(DocumentApp.ParagraphHeading.HEADING2);

  const para = body.appendParagraph(content);
  para.setFontFamily('Courier New');
  para.setFontSize(8);

  body.appendParagraph('───────────────────────────────────────────────────────────────────────');
  doc.saveAndClose();
}

// ── Manual helpers ────────────────────────────────────────────────────────────

function checkStatus() {
  const props = PropertiesService.getScriptProperties();
  const day   = parseInt(props.getProperty('CURRENT_DAY') || '0');
  const next  = DAILY_PROMPTS[day];
  Logger.log('Completed days: ' + day + '/30');
  Logger.log('Next batch: ' + (next ? 'Day ' + next.day + ' — ' + next.category + ' — ' + next.sub : 'ALL DONE'));
}

function resetToDay(dayIndex) {
  PropertiesService.getScriptProperties().setProperty('CURRENT_DAY', String(dayIndex));
  Logger.log('Reset to Day ' + (dayIndex + 1));
}
