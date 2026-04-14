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

// ── Daily prompts: Gemini's 3 categories — 10 days total ─────────────────────

const DAILY_PROMPTS = [

  // ══════════════════════════════════════════════════════════════════════
  //  CATEGORY 1 — PERSONAL CARE (Days 1–4)
  // ══════════════════════════════════════════════════════════════════════

  {
    day: 1, category: 'PERSONAL_CARE', sub: 'Shampoo + Conditioner + Soap (60 products)',
    prompt: `You are building a product safety database for Indian consumers. Generate data for 20 SHAMPOO + 20 HAIR CONDITIONER + 20 SOAP/BODY WASH products sold in India 2024. Use INDIA label formulations. Output a valid JSON array ONLY. Schema for each item: { "id": "brand_productname_lowercase_underscores", "product_name": "Full name as on India label", "brand": "Brand", "category": "PERSONAL_CARE", "sub_category": "SHAMPOO or HAIR_CONDITIONER or SOAP", "nutrition_per_100g": null, "ingredients": ["INCI names in descending concentration, India label"], "is_upf": false, "nova_group": null, "allergens": ["only those present"], "fssai_note": "CDSCO Cosmetics Rules 2020 citation" }. SHAMPOO (20): Dove, Head & Shoulders, Pantene, Clinic Plus, Sunsilk, TRESemmé, Himalaya, Biotique, WOW Apple Cider Vinegar, Mamaearth Onion, Indulekha Bringha. CONDITIONER (20): Dove Intense Repair, Pantene Smooth & Silky, TRESemmé, Himalaya Protein, Mamaearth Onion, WOW Coconut Milk Hair Mask, Garnier Fructis, L'Oreal Extraordinary Oil. SOAP (20): Lux India, Dove Beauty Bar, Dettol Original, Lifebuoy, Pears, Santoor, Himalaya Neem, Nivea Cream Soft, Fiama Shower Gel, Margo Neem, Godrej No.1. JSON array only.`
  },

  {
    day: 2, category: 'PERSONAL_CARE', sub: 'Toothpaste + Hair Oil + Face Wash (60 products)',
    prompt: `Same JSON schema. Generate 20 TOOTHPASTE + 20 HAIR OIL + 20 FACE WASH products sold in India 2024. INDIA label formulations only. TOOTHPASTE (20): sub_category "ORAL_CARE". Colgate Strong Teeth, Colgate MaxFresh, Colgate Sensitive, Colgate Total, Pepsodent Germicheck, Oral-B Complete, Dabur Red Paste (no fluoride — flag), Patanjali Dant Kanti (no fluoride — flag), Himalaya Dental Cream, Sensodyne India, Close Up. Flag: Fluoride concentration, SLS mouth ulcer risk, Triclosan. HAIR OIL (20): sub_category "HAIR_OIL". Parachute Coconut Oil, Nihar Naturals, Bajaj Almond Drops, Dabur Amla Gold, Dabur Vatika, Indulekha Bringha, Kesh King, Himalaya Anti-Dandruff Oil, Patanjali Kesh Kanti, Biotique Bio Bhringraj. FACE WASH (20): sub_category "FACE_WASH". Himalaya Neem Face Wash, Pond's Pure White, Clean & Clear, Cetaphil, Neutrogena Deep Clean, Mamaearth Tea Tree, Plum, WOW Ubtan, mCaffeine Coffee. Flag: SLS/SLES, Parabens, Microbeads (banned). JSON array only.`
  },

  {
    day: 3, category: 'PERSONAL_CARE', sub: 'Moisturiser + Deodorant + Men Grooming (60 products)',
    prompt: `Same JSON schema. Generate 20 MOISTURISER + 20 DEODORANT + 20 MEN'S GROOMING products sold in India 2024. MOISTURISER (20): category "COSMETIC", sub_category "MOISTURISER". Pond's Cold Cream, Glow & Lovely, Lakme Peach Milk, Olay Total Effects India, Neutrogena Hydro Boost, Nivea Soft, Cetaphil, Mamaearth Ubtan, Biotique, Dot & Key. CRITICAL: Flag Hydroquinone (Rx-only India), Mercury (BANNED CDSCO), Steroids (Rx-only), Parabens, Retinol (avoid pregnancy). INCI ingredients. DEODORANT (20): category "PERSONAL_CARE", sub_category "DEODORANT". Fogg (India #1 deo), Axe India, Engage, Wild Stone, Park Avenue, Nivea Deo, Dove Deo, Old Spice India, Yardley London India. Flag: Aluminium compounds (antiperspirant concern), Triclosan, Phthalates in fragrance, Aerosol propellants. MEN GROOMING (20): sub_category "MENS_GROOMING". Gillette Shaving Gel, Dettol Shave Gel, Bombay Shaving Company, Beardo, Ustraa, Nivea Men India, Old Spice Shave Foam, Brylcreem India. JSON array only.`
  },

  {
    day: 4, category: 'PERSONAL_CARE', sub: 'Feminine Care + Shaving + Oral Care additional (60 products)',
    prompt: `Same JSON schema. Generate 20 FEMININE HYGIENE + 20 SUNSCREEN + 20 FACE SERUM products sold in India 2024. FEMININE HYGIENE (20): category "PERSONAL_CARE", sub_category "FEMININE_CARE". Whisper Ultra, Stayfree, Sofy, Paree Sanitary Pads, Niine Biodegradable, PeeSafe Intimate Wash, Sirona Intimate Wash, Lactacyd India, Carmesi Natural, Sirona Menstrual Cup. Flag: Dioxin in bleached pads, Synthetic fragrance (microbiome disruption), Chlorine bleaching. SUNSCREEN (20): category "COSMETIC", sub_category "SUNSCREEN". Neutrogena Ultra Sheer India, Lakme Sun Expert, Lotus Herbals Safe Sun, Biotique Bio Sandalwood, Mamaearth Sunscreen, Minimalist SPF 50, Banana Boat India. Flag: Oxybenzone (hormone disruption), chemical vs mineral UV filters. INCI ingredients. FACE SERUM (20): sub_category "FACE_SERUM". Minimalist Niacinamide 10%, Minimalist Hyaluronic Acid, Minimalist AHA BHA, Plum Vitamin C, Dot & Key, Mamaearth Vitamin C, WOW Vitamin C India. Flag: Retinol (avoid pregnancy), AHA/BHA (photosensitivity). INCI ingredients. JSON array only.`
  },

  // ══════════════════════════════════════════════════════════════════════
  //  CATEGORY 2 — SUPPLEMENTS (Days 5–7)
  // ══════════════════════════════════════════════════════════════════════

  {
    day: 5, category: 'SUPPLEMENT', sub: 'Protein + Vitamins + Ayurvedic (60 products)',
    prompt: `Same JSON schema. Generate 20 PROTEIN SUPPLEMENT + 20 VITAMINS/MULTIVITAMINS + 20 AYURVEDIC SUPPLEMENT products sold in India 2024. Schema: { id, product_name, brand, category: "SUPPLEMENT", sub_category, nutrition_per_100g: {energy_kcal, protein_g, fat_g, saturated_fat_g, trans_fat_g, carbs_g, sugar_g, fibre_g, sodium_mg}, ingredients (India label), is_upf, nova_group, allergens, fssai_note: "FSSAI Health Supplements Nutraceuticals Regulations 2022" }. PROTEIN (20): sub_category "PROTEIN". Muscleblaze Biozyme Whey, Healthkart HK Vitals Whey, Optimum Nutrition Gold Standard India, GNC Pro Performance India, Oziva Plant Protein, Fast & Up Whey, Ritebite Max Protein, Avvatar Whey, Nakpro Gold Whey, Big Muscles Nitro Whey. VITAMINS (20): sub_category "VITAMINS". Healthkart HK Vitals Multivitamin, Wellbeing Nutrition Daily Greens, Revital H (Sanofi), Supradyn (Bayer), Seven Seas India, Centrum India, Himalaya Vitamin C, Oziva Wholefood C, Fast & Up Vitalize. Flag: Vitamin A/D toxicity risk, Iron pro-oxidant at high doses. AYURVEDIC (20): sub_category "AYURVEDIC". Dabur Chyawanprash, Baidyanath Chyawanprash, Patanjali Chyawanprash, Himalaya Ashvagandha, Dabur Shilajit Gold, Himalaya Liv.52, Dabur Honitus, Sri Sri Tattva Triphala, Organic India Ashwagandha. Flag: Heavy metal contamination risk (AYUSH mandates testing). JSON array only.`
  },

  {
    day: 6, category: 'SUPPLEMENT', sub: 'Sports + Health Drinks + Digestive (60 products)',
    prompt: `Same JSON schema. Generate 20 SPORTS NUTRITION + 20 HEALTH DRINK/MEAL REPLACEMENT + 20 DIGESTIVE/PROBIOTIC products sold in India 2024. SPORTS (20): sub_category "SPORTS_NUTRITION". Muscleblaze Pre-workout, MuscleBlaze Creatine, Fast & Up BCAA, Healthkart Fish Oil, GNC Mega Men Sport India, Enerzal (Zydus), Glucon-D, Electral ORS. Flag: Creatine kidney concerns, excessive caffeine, WADA banned substances. HEALTH DRINKS (20): sub_category "HEALTH_DRINK". Protinex Original, Horlicks Growth+, Complan Royale India, Pediasure India (Abbott), Ensure India, Glucerna India (diabetics), Nestle Resource High Protein, Oziva Meal. Include full nutrition. DIGESTIVE (20): sub_category "DIGESTIVE". Yakult India, Enterogermina (Sanofi), Wellbeing Nutrition Probiotic, Himalaya Liv.52 DS, Dabur Hajmola, Pudin Hara (Dabur), ENO Fruit Salt (GSK), Sat Isabgol, Baidyanath digestive churna. JSON array only.`
  },

  {
    day: 7, category: 'SUPPLEMENT', sub: 'Children + Women + Immunity + Weight (60 products)',
    prompt: `Same JSON schema. Generate 15 CHILDREN'S NUTRITION + 15 WOMEN'S HEALTH + 15 IMMUNITY + 15 WEIGHT MANAGEMENT products sold in India 2024. CHILDREN (15): sub_category "CHILD_NUTRITION". Bournvita (CRITICAL: flag high sugar — primarily sugar not health drink), Horlicks Junior, Boost India, Complan Height & Weight, Pediasure, Protinex Junior, Nestle Milo India. WOMEN (15): sub_category "WOMENS_HEALTH". Wellbeing Nutrition Myo-Inositol, Oziva Plant Iron, Himalaya Evecare, Himalaya Shatavari, Dabur Stri Rasayan Vati, Pregnacare India. Flag: Iron toxicity, Vitamin A teratogenicity in pregnancy. IMMUNITY (15): sub_category "IMMUNITY". Zandu Pancharishta, Dabur Immunity Kit, Himalaya Septilin, Kapiva Gold Shilajit, Wellbeing Nutrition Melting Strips, Patanjali Coronil (flag: AYUSH approved, NOT WHO approved). WEIGHT (15): sub_category "WEIGHT_MANAGEMENT". Muscleblaze Fat Burner, Himalaya Vrikshamla, Oziva ThinOziva, Patanjali Medohar Vati, Lipton Green Tea India, Organic India Tulsi Green Tea. Flag: Garcinia (liver damage risk WHO warning), Synephrine. JSON array only.`
  },

  // ══════════════════════════════════════════════════════════════════════
  //  CATEGORY 3 — PET FOOD (Days 8–10)
  // ══════════════════════════════════════════════════════════════════════

  {
    day: 8, category: 'PET_FOOD', sub: 'Dog Food + Treats (60 products)',
    prompt: `Same JSON schema. Generate 30 DOG DRY FOOD + 30 DOG WET FOOD/TREATS sold in India 2024. Schema: { id, product_name, brand, category: "PET_FOOD", sub_category, nutrition_per_100g: {energy_kcal, protein_g, fat_g, fibre_g, sodium_mg — others null}, ingredients (India label), is_upf: false, nova_group: null, allergens, fssai_note: "FSSAI pet food standards + Prevention of Cruelty to Animals Act" }. DOG DRY (30): sub_category "DOG_DRY". Royal Canin India (Adult, Maxi, Mini), Pedigree Adult Chicken & Vegetables India, Drools Focus Super Premium, Farmina N&D Dog India, Hills Science Diet India, Arden Grange India, Me-O Dog India, Kennel Kitchen India, Acana India, SmartHeart Dog India. Flag: Ethoxyquin (banned EU — check India), BHA/BHT in pet food, artificial colours. DOG WET + TREATS (30): sub_category "DOG_WET". Pedigree Wet Dog Food pouches, Royal Canin wet India, Drools Wet, Cesar India, Chappi India, Pedigree DentaStix, Pedigree Milky Sticks, Drools Oven Baked Treats, Himalaya PetCare Dog Treats. Flag: Xylitol (TOXIC to dogs), high sodium cardiac risk, grapes/raisins/onion derivatives (TOXIC). JSON array only.`
  },

  {
    day: 9, category: 'PET_FOOD', sub: 'Cat Food + Puppy/Kitten + Senior (60 products)',
    prompt: `Same JSON schema. Generate 20 CAT FOOD + 20 PUPPY/KITTEN FOOD + 20 SENIOR/PRESCRIPTION PET FOOD sold in India 2024. CAT FOOD (20): sub_category "CAT_DRY" and "CAT_WET". Royal Canin Cat India (Indoor, Hair & Skin, Kitten), Whiskas Dry India, Me-O Dry Cat India, Farmina N&D Cat India, Hills Science Diet Cat India, Drools Focus Cat. Whiskas Wet Pouches India, Me-O Creamy Treats, Temptations Cat Treats India, Inaba Ciao Chururu. Flag: Propylene Glycol (banned cat food US), High carbs (diabetes risk in cats), Carrageenan (gut inflammation). PUPPY/KITTEN (20): sub_category "PUPPY_KITTEN". Royal Canin Puppy India, Pedigree Puppy India, Drools Puppy, Hills Science Diet Puppy, Purina ProPlan Puppy, Royal Canin Kitten India, Whiskas Kitten India, Me-O Kitten India. Flag: DHA levels (brain dev), Ca:P ratio (bone dev). SENIOR/PRESCRIPTION (20): sub_category "SENIOR_PET". Royal Canin Mature Consult, Hills Science Diet Senior, Royal Canin Renal Cat (kidney disease), Royal Canin Diabetic Dog, Hills Prescription Diet k/d, Pedigree Senior India. Flag: Phosphorus restriction (renal), sodium restriction (cardiac). JSON array only.`
  },

  {
    day: 10, category: 'PET_FOOD', sub: 'Pet Supplements + Fish + Bird + Small Animal (60 products)',
    prompt: `Same JSON schema. Generate 15 PET SUPPLEMENTS + 15 FISH FOOD + 15 BIRD FOOD + 15 SMALL ANIMAL FOOD sold in India 2024. PET SUPPLEMENTS (15): sub_category "PET_SUPPLEMENT". Himalaya PetCare Joint Support, Beaphar India, NutriVet India, Drools Absolute Calcium, Dogsee Chew Treats, Heads Up For Tails supplements, VetriScience India. FISH FOOD (15): sub_category "FISH_FOOD". Taiyo Fish Food India, Sera Vipan, Tetra Min India, Ocean Free India, Hikari India, Saki-Hikari India, API Fish Food India. Flag: Ethoxyquin (banned EU for human food, used in fish food), artificial colours. BIRD FOOD (15): sub_category "BIRD_FOOD". Versele-Laga Prestige India (parrot, budgie), Higgins India, Vitapol India, Padovan India bird food. Flag: Avocado (TOXIC to birds), sunflower seed excess (fatty liver parrots). SMALL ANIMAL (15): sub_category "SMALL_ANIMAL". Kaytee India guinea pig/hamster, Oxbow India rabbit hay/pellets, Mr. Johnson's Supreme India, Sharples & Grant India. Flag: Artificially coloured seed mixtures (unnecessary). JSON array only.`
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
  Logger.log('Completed days: ' + day + '/10');
  Logger.log('Next batch: ' + (next ? 'Day ' + next.day + ' — ' + next.category + ' — ' + next.sub : 'ALL DONE'));
}

function resetToDay(dayIndex) {
  PropertiesService.getScriptProperties().setProperty('CURRENT_DAY', String(dayIndex));
  Logger.log('Reset to Day ' + (dayIndex + 1));
}
