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

// ── Daily prompts: each day has 3 batches of 20 products (fits token limits) ───
// WHY 3 BATCHES: Gemini 2.0 Flash max output = 8192 tokens. 60 products with
// full INCI ingredient lists needs ~10,000+ tokens — causes truncation to ~5.
// Splitting into 3×20 per day keeps each call well within the limit.

const DAILY_PROMPTS = [

  // ══════════════════════════════════════════════════════════════════════
  //  CATEGORY 1 — PERSONAL CARE (Days 1–4)
  // ══════════════════════════════════════════════════════════════════════

  {
    day: 1, category: 'PERSONAL_CARE', sub: 'Shampoo + Conditioner + Soap',
    batches: [
      `You are building a product safety database for Indian consumers. Generate data for exactly 20 SHAMPOO products sold in India 2024. Use INDIA label formulations only. Output a valid JSON array ONLY — no markdown, no explanation. Schema: { "id": "brand_productname_lowercase_underscores", "product_name": "Full name as on India label", "brand": "Brand", "category": "PERSONAL_CARE", "sub_category": "SHAMPOO", "nutrition_per_100g": null, "ingredients": ["INCI names in descending concentration"], "is_upf": false, "nova_group": null, "allergens": ["fragrance allergens present"], "fssai_note": "CDSCO Cosmetics Rules 2020" }. Products: Dove Intense Repair, Head & Shoulders Classic Clean, Pantene Silky Smooth, Clinic Plus, Sunsilk Lusciously Thick, TRESemmé Keratin Smooth, Himalaya Herbals Anti-Dandruff, Biotique Bio Kelp, WOW Apple Cider Vinegar, Mamaearth Onion, Indulekha Bringha, L'Oreal Total Repair 5, Garnier Fructis Long & Strong, Tresemme Moisture Rich, Ayur Herbal Amla, Vatika Naturals Coconut, Schwarzkopf Gliss, Sunsilk Stunning Black Shine, Dove Oxygen Moisture, Parachute Advansed Jasmine. JSON array only.`,
      `Same schema. Generate exactly 20 HAIR CONDITIONER products sold in India 2024. sub_category: "HAIR_CONDITIONER". Products: Dove Intense Repair Conditioner, Pantene Smooth & Silky Conditioner, TRESemmé Keratin Smooth Conditioner, Himalaya Protein Conditioner, Mamaearth Onion Conditioner, WOW Coconut & Avocado Conditioner, Garnier Fructis Conditioner, L'Oreal Extraordinary Oil Conditioner, Biotique Bio Dandelion Conditioner, Sunsilk Lusciously Thick Conditioner, Clinic Plus Conditioner, Head & Shoulders Conditioner, Schwarzkopf Gliss Conditioner, Indulekha Bringha Conditioner, Ayur Herbal Conditioner, Khadi Mauri Herbal Conditioner, Tresemme Moisture Rich Conditioner, Streax Ultra Moisturising Conditioner, OGX Coconut Milk Conditioner India, BBLUNT Intense Moisture Conditioner. JSON array only.`,
      `Same schema. Generate exactly 20 SOAP / BODY WASH products sold in India 2024. sub_category: "SOAP" or "BODY_WASH". Products: Lux Soft Glow Soap, Dove Beauty Cream Bar, Dettol Original Soap, Lifebuoy Total 10 Soap, Pears Pure & Gentle Soap, Santoor Sandal & Turmeric, Himalaya Neem & Turmeric Soap, Nivea Cream Soft Soap, Fiama Di Wills Shower Gel, Margo Neem Soap, Godrej No.1 Sandal, Vivel Aloe Vera, Medimix Ayurvedic Soap, Chandrika Soap, Biotique Honey Gel Body Wash, Dove Body Wash Deeply Nourishing, Palmolive Naturals Milk & Honey, Himalaya Refreshing Baby Soap, Sebamed Cleansing Bar, Khadi Natural Neem Soap. JSON array only.`
    ]
  },

  {
    day: 2, category: 'PERSONAL_CARE', sub: 'Toothpaste + Hair Oil + Face Wash',
    batches: [
      `Same schema. Generate exactly 20 TOOTHPASTE products sold in India 2024. sub_category: "ORAL_CARE". Flag fluoride ppm, SLS risk, Triclosan. Products: Colgate Strong Teeth, Colgate MaxFresh Blue Gel, Colgate Sensitive, Colgate Total Advanced, Pepsodent Germicheck, Oral-B Complete, Dabur Red Paste (no fluoride — flag), Patanjali Dant Kanti (no fluoride — flag), Himalaya Dental Cream, Sensodyne Rapid Relief India, Close Up Ever Fresh, Dabur Meswak, Colgate Charcoal, Vicco Vajradanti, Vivel Clove & Neem, Himalaya Botanique Whitening, Patanjali Herbal, Colgate Vedshakti, Ajay Herbal, Babool Toothpaste. JSON array only.`,
      `Same schema. Generate exactly 20 HAIR OIL products sold in India 2024. sub_category: "HAIR_OIL". Products: Parachute Coconut Oil (100%), Nihar Naturals Coconut, Bajaj Almond Drops Hair Oil, Dabur Amla Gold Hair Oil, Dabur Vatika Enriched Coconut, Indulekha Bringha Hair Oil, Kesh King Scalp & Hair Medicine, Himalaya Anti-Dandruff Hair Oil, Patanjali Kesh Kanti Hair Oil, Biotique Bio Bhringraj, Bajaj Kalonji Hair Oil, WOW 10-in-1 Miracle Hair Oil, Mamaearth Onion Hair Oil, Satthwa Premium Hair Oil, Forest Essentials Bhringraj, Ayur Herbal Amla Oil, Emami Nemarks Lite Oil, Schwarzkopf Gliss Hair Oil, L'Oreal Extraordinary Oil, BBLUNT Open Your Mind Oil. JSON array only.`,
      `Same schema. Generate exactly 20 FACE WASH products sold in India 2024. sub_category: "FACE_WASH". Flag SLS/SLES, Parabens, Microbeads (banned India 2020). Products: Himalaya Purifying Neem Face Wash, Pond's Bright Beauty Face Wash, Clean & Clear Morning Energy, Cetaphil Gentle Skin Cleanser, Neutrogena Deep Clean, Mamaearth Tea Tree Face Wash, Plum Green Tea Pore Cleansing Face Wash, WOW Ubtan Face Wash, mCaffeine Coffee Face Wash, Lakme Blush & Glow, Garnier Bright Complete, L'Oreal Paris Glycolic Bright, Olay Natural White, Biotique Honey Gel Face Wash, Forest Essentials Facial Cleanser, Minimalist Salicylic Acid Face Wash, The Derma Co 1% Salicylic Acid, Dot & Key Clearing Face Wash, Re'equil Oil Control Face Wash, Fixderma Miranda Face Wash. JSON array only.`
    ]
  },

  {
    day: 3, category: 'PERSONAL_CARE', sub: 'Moisturiser + Deodorant + Men Grooming',
    batches: [
      `Same schema. Generate exactly 20 MOISTURISER products sold in India 2024. category: "COSMETIC", sub_category: "MOISTURISER". CRITICAL flags: Hydroquinone (Rx-only India), Mercury (BANNED CDSCO), Parabens, Retinol (avoid pregnancy). Products: Pond's Cold Cream, Glow & Lovely Advanced Multivitamin, Lakme Peach Milk Moisturiser, Olay Total Effects India, Neutrogena Hydro Boost, Nivea Soft, Cetaphil Moisturising Cream, Mamaearth Ubtan Moisturiser, Biotique Bio Coconut Whitening Cream, Dot & Key Watermelon, Minimalist Hyaluronic + PGA, Plum E-Luminence, Forest Essentials Soundarya Cream, Kiehl's Ultra Facial India, The Moms Co Natural Vita Rich, Re'equil Ultra Matte Moisturiser, Fixderma Shadow SPF 30, Himalaya Protective Sunscreen, Sebamed Moisturising Cream, Beardo Face Cream. JSON array only.`,
      `Same schema. Generate exactly 20 DEODORANT products sold in India 2024. category: "PERSONAL_CARE", sub_category: "DEODORANT". Flag: Aluminium (antiperspirant concern), Triclosan, Phthalates. Products: Fogg Scent Fresh, Fogg Scent Bloom, Axe Dark Temptation India, Axe Apollo India, Engage On Deo Cologne, Wild Stone Forest Spice, Park Avenue Good Morning, Nivea Men Fresh, Dove Go Fresh, Old Spice Swagger India, Yardley London English Lavender, Secret Outlast India, Rexona Men Active, Gillette Sport, Denver Hamilton, Bombay Shaving Company Deo, Beardo Deo India, Ustraa Bay Rum, Fogg Master, Axe Pulse India. JSON array only.`,
      `Same schema. Generate exactly 20 MEN'S GROOMING products sold in India 2024. sub_category: "MENS_GROOMING". Products: Gillette Mach3 Shaving Gel, Dettol Sensitive Shave Gel, Bombay Shaving Company Shave Foam, Beardo Shave Gel, Ustraa Shave Gel, Nivea Men Sensitive Shave Gel, Old Spice Shave Foam, Brylcreem Original, Set Wet Studio X Hair Wax, Gatsby Hair Gel Ultra Hard, Park Avenue Shaving Foam, Gillette Fusion ProGlide Gel, Axe White Label Shave Gel, Beardo Beard Oil, Ustraa Beard Growth Oil, Man Arden Beard Wash, Bombay Shaving Company Beard Serum, Nivea Men Face Wash Oil Control, Garnier Men PowerWhite, L'Oreal Men Expert. JSON array only.`
    ]
  },

  {
    day: 4, category: 'PERSONAL_CARE', sub: 'Feminine Care + Sunscreen + Face Serum',
    batches: [
      `Same schema. Generate exactly 20 FEMININE HYGIENE products sold in India 2024. sub_category: "FEMININE_CARE". Flag: Dioxin in bleached pads, Synthetic fragrance (microbiome), Chlorine bleaching. Products: Whisper Ultra Clean, Whisper Choice Wings, Stayfree Secure XL, Sofy Antibacterial, Paree Soft & Rash Free Pads, Niine Biodegradable Pads, PeeSafe Intimate Wash, Sirona Intimate Wash, Lactacyd Daily Intimate Wash, Carmesi Natural Pads, Sirona Menstrual Cup, Stonesoup Organic Pads, Azah Organic Pads, Prega News Pregnancy Test Kit, i-pill (note: OTC India — not cosmetic — flag), Everteen Intimate Wash, She Comfort Sanitary Pads, Modess Sanitary Pads India, Bella Sensitive Pads India, Nua Sanitary Pads. JSON array only.`,
      `Same schema. Generate exactly 20 SUNSCREEN products sold in India 2024. category: "COSMETIC", sub_category: "SUNSCREEN". Flag: Oxybenzone (hormone disruption), chemical vs mineral filters, SPF adequacy. Products: Neutrogena Ultra Sheer Dry Touch SPF 50+, Lakme Sun Expert SPF 50 PA+++, Lotus Herbals Safe Sun UV Screen Matte Gel, Biotique Bio Sandalwood SPF 50+, Mamaearth Ultra Light Indian Sunscreen SPF 50, Minimalist Multi Vitamin SPF 50 PA++++, Banana Boat Sport SPF 50, La Shield Fisico SPF 50, Fixderma Shadow SPF 30, Sesderma Repaskin SPF 100, Kaya Clinic Skin Defense, Re'equil Oxybenzone & OMC Free SPF 50, The Derma Co 1% Hyaluronic Sunscreen, Dot & Key Watermelon Sunscreen, WOW Sunscreen SPF 50, Forest Essentials Soundarya SPF 25, Colorbar Sunscreen Lotion SPF 40, Sunscreen Lotion Gloww, Plum Superglow Sunscreen, ISDIN Eryfotona India. JSON array only.`,
      `Same schema. Generate exactly 20 FACE SERUM products sold in India 2024. category: "COSMETIC", sub_category: "FACE_SERUM". Flag: Retinol (avoid pregnancy), AHA/BHA (photosensitivity). Products: Minimalist Niacinamide 10% + Zinc 1%, Minimalist Hyaluronic Acid 2% + B5, Minimalist AHA 25% + BHA 2%, Minimalist Retinol 0.3% (flag), Plum 15% Vitamin C Serum, Dot & Key Vitamin C+E Serum, Mamaearth Skin Illuminate Vitamin C Serum, WOW Vitamin C Serum India, L'Oreal Paris Revitalift 1.5% Pure Hyaluronic Acid, Garnier Booster Serum Vitamin C, Olay Regenerist Micro-Sculpting Serum, The Derma Co 10% Niacinamide Serum, Pilgrim Glycolic Acid 10%, Deconstruct Brightening Serum, RE'EQUIL Ultra Depigmentation Serum, Foxtale Vitamin C Serum, Quench Botanics Sea Cream Serum, mCaffeine Naked & Raw Vitamin C Serum, Juicy Chemistry Vitamin C Serum, Kama Ayurveda Eladi Hydrating Serum. JSON array only.`
    ]
  },

  // ══════════════════════════════════════════════════════════════════════
  //  CATEGORY 2 — SUPPLEMENTS (Days 5–7)
  // ══════════════════════════════════════════════════════════════════════

  {
    day: 5, category: 'SUPPLEMENT', sub: 'Protein + Vitamins + Ayurvedic',
    batches: [
      `Same schema but nutrition_per_100g is required: {energy_kcal, protein_g, fat_g, saturated_fat_g, trans_fat_g, carbs_g, sugar_g, fibre_g, sodium_mg}. category: "SUPPLEMENT". fssai_note: "FSSAI Health Supplements Nutraceuticals Regulations 2022". Generate exactly 20 PROTEIN SUPPLEMENT products sold in India 2024. sub_category: "PROTEIN". Products: MuscleBlaze Biozyme Whey Protein, Healthkart HK Vitals Whey Protein, Optimum Nutrition Gold Standard 100% Whey India, GNC Pro Performance 100% Whey India, Oziva Plant Protein & Herbs, Fast & Up Whey Advanced, Avvatar Absolute Whey Protein, Nakpro Gold Whey Protein, Big Muscles Nitro Whey, AS-IT-IS Nutrition Whey Protein Concentrate, MyProtein Impact Whey India, Dymatize ISO100 India, Labrada 100% Whey, Ripped Up Nutrition Whey, SSN Hardcore Whey Protein, Ronnie Coleman Signature Series Whey, Nutrabolics Whey Protein India, Nutrabay Gold Whey Concentrate, SportNutri Whey Protein, Isopure Zero Carb India. JSON array only.`,
      `Same schema with nutrition. Generate exactly 20 MULTIVITAMIN / VITAMIN products sold in India 2024. sub_category: "VITAMINS". Flag: Vitamin A/D toxicity, Iron pro-oxidant. Products: Healthkart HK Vitals Multivitamin, Wellbeing Nutrition Daily Greens, Revital H (Sanofi India), Supradyn Daily (Bayer India), Seven Seas Omega-3 India, Centrum Silver India, Himalaya Vitamin C Tablets, Oziva Wholefood Vitamin C, Fast & Up Vitalize Effervescent, Carbamide Forte Magnesium, HealthAid Vitamin D3 India, GNC Vitamin C 500, Plix The Plant Fix Vitamin B12, Neurobion Forte India (Merck), Becosules India (Pfizer), Limcee Vitamin C Chewable, Becadexamin Multivitamin, Zincovit Tablets India, Surbex Z India (Abbott), Maxirich Complete India. JSON array only.`,
      `Same schema with nutrition. Generate exactly 20 AYURVEDIC SUPPLEMENT products sold in India 2024. sub_category: "AYURVEDIC". Flag: Heavy metal contamination (AYUSH mandates Bhasma testing). Products: Dabur Chyawanprash, Baidyanath Chyawanprash Special, Patanjali Chyawanprash, Himalaya Ashvagandha Tablets, Dabur Shilajit Gold Capsules, Himalaya Liv.52 Tablets, Dabur Honitus Cough Syrup, Sri Sri Tattva Triphala, Organic India Ashwagandha, Himalaya Brahmi, Dabur Giloy Ghanvati, Kapiva Shilajit Resin, Patanjali Ashvashila Capsule, Baidyanath Shilajit, Zandu Punarnava, Himalaya Speman, Charak Pharma M2 Tone, Kerala Ayurveda Ashwagandha, Oushadhi Triphala, Sandu Arjunarishta. JSON array only.`
    ]
  },

  {
    day: 6, category: 'SUPPLEMENT', sub: 'Sports + Health Drinks + Digestive',
    batches: [
      `Same schema with nutrition. Generate exactly 20 SPORTS NUTRITION products sold in India 2024. sub_category: "SPORTS_NUTRITION". Flag: Creatine (kidney load), excess caffeine, WADA list. Products: MuscleBlaze Pre-Workout Ripped, MuscleBlaze Creatine Monohydrate, Fast & Up BCAA 2:1:1, Healthkart Omega-3 Fish Oil, GNC Mega Men Sport India, Enerzal Energy Drink (Zydus), Glucon-D Instant Energy, Electral ORS Powder, BodyFirst Creatine, MuscleBlaze BCAA Pro, Nakpro Creatine, Endura Mass Weight Gainer, Big Muscles Xtreme Mass, Carbamide Forte L-Carnitine, Fast & Up Reload (Electrolytes), GNC Amplified Wheybolic, Cellucor C4 India, Dymatize Elite Creatine, Scivation Xtend BCAA India, ProSupps HydraSurge India. JSON array only.`,
      `Same schema with nutrition. Generate exactly 20 HEALTH DRINK / MEAL REPLACEMENT products sold in India 2024. sub_category: "HEALTH_DRINK". Products: Protinex Original, Protinex Diabetes Care, Horlicks Growth+ Stage 3, Complan Royale Chocolate India, Pediasure India (Abbott), Ensure Complete Nutrition India, Glucerna India (diabetes), Nestle Resource High Protein, Oziva Wholefood Meal, Herbalife Formula 1 India, Horlicks Women's Plus, Bournvita Health Drink (CRITICAL: flag high sugar — 70%+ carbs, misleading health claims), Boost Health & Nutrition Drink India (flag sugar), Amul Pro Whey Protein, Milo India (Nestle), Complan NutriGro India, Horlicks Lite India, Nature's Best Isopure India, Soy Protein Isolate Nutrima, Sunova Wheatgrass Powder. JSON array only.`,
      `Same schema with nutrition where applicable. Generate exactly 20 DIGESTIVE / PROBIOTIC products sold in India 2024. sub_category: "DIGESTIVE". Products: Yakult Probiotic Drink India, Enterogermina Oral Suspension (Sanofi), Wellbeing Nutrition Daily Probiotic, Himalaya Liv.52 DS Syrup, Dabur Hajmola Candy, Pudin Hara Pearls (Dabur), ENO Fruit Salt Original (Haleon), Sat Isabgol Powder (Dabur), Baidyanath Hingwashtak Churna, Himalaya Trikatu Tablet, Zandu Sudarshan Ghanvati, Patanjali Divya Udarkalp Churna, Pentasure HP (probiotic), Sunpro Probiotic Sachet, Gutgain Probiotic India, Probiotic 100 Tablets India, Darolac Probiotic, BioFit Probiotic, Culturelle Probiotic India, Vibact DS Capsule. JSON array only.`
    ]
  },

  {
    day: 7, category: 'SUPPLEMENT', sub: 'Children + Women + Immunity + Weight',
    batches: [
      `Same schema with nutrition. Generate exactly 20 CHILDREN'S NUTRITION + WOMEN'S HEALTH products sold in India 2024. CHILDREN (10): sub_category "CHILD_NUTRITION". Bournvita Little Champs (CRITICAL: flag — 60%+ sugar/carbs, misleading immunity claims), Horlicks Junior Stage 1 & 2, Boost India (flag sugar), Complan Height & Weight India, Pediasure Complete India, Protinex Junior, Nestle Milo India, Junior Horlicks, Groviva Child Nutrition. WOMEN (10): sub_category "WOMENS_HEALTH". Wellbeing Nutrition Myo-Inositol, Oziva Plant-Based Iron, Himalaya Evecare Capsules, Himalaya Shatavari Tablets, Dabur Stri Rasayan Vati, Pregnacare Original India (Vitabiotics), GNC Women's Ultra Mega, Himalaya Himplasia, Wellwoman India (Vitabiotics), Plix Iron & Folate. Flag: Iron toxicity, Vit A teratogenicity. JSON array only.`,
      `Same schema. Generate exactly 20 IMMUNITY + WEIGHT MANAGEMENT products sold in India 2024. IMMUNITY (10): sub_category "IMMUNITY". Zandu Pancharishta, Dabur Immunity Kit, Himalaya Septilin Tablets, Kapiva Gold Shilajit Resin, Wellbeing Nutrition Melting Strips Immunity, Patanjali Coronil (flag: AYUSH approved, NOT WHO approved for COVID), Dabur Giloy Tulsi Juice, Himalaya Guduchi, Chyawanprash Dabur Junior, Organo Nutritional Supplement. WEIGHT (10): sub_category "WEIGHT_MANAGEMENT". MuscleBlaze Fat Burner Advanced, Himalaya Vrikshamla Capsule, Oziva ThinOziva Plant-Based Fat Loss, Patanjali Medohar Vati (flag: Licorice adulteration reports), Lipton Honey Lemon Green Tea India, Organic India Tulsi Green Tea, Kapiva Fit & Slim Juice, Healthkart CLA 1000, L-Carnitine Carbamide Forte, HealthVit KETO Fat Burner. Flag: Garcinia (liver damage — WHO warning), Synephrine (banned some sports). JSON array only.`,
      `Same schema. Generate exactly 20 SENIOR / JOINT / HEART HEALTH products sold in India 2024. JOINT (7): sub_category "JOINT_HEALTH". Himalaya Ostocalcium, Carbamide Forte Glucosamine Chondroitin, Healthkart HK Vitals Calcium, Muscleblaze Calcium, Joinease India, Revital Woman, Doctor's Best Glucosamine India. HEART (7): sub_category "HEART_HEALTH". Himalaya Abana Tablets, Dabur Arjunarishta, Healthkart Omega-3 Heart Health, GNC Triple Strength Fish Oil India, Fast & Up Coenzyme Q10, Naturesplash Omega-3, Himalaya Arjuna Capsules. EYE (6): sub_category "EYE_HEALTH". Healthkart Lutein & Zeaxanthin, Ocuvite India (Bausch & Lomb), PreserVision India, Himalaya Ophthacare, VisionKare Lutein, I-Caps India. JSON array only.`
    ]
  },

  // ══════════════════════════════════════════════════════════════════════
  //  CATEGORY 3 — PET FOOD (Days 8–10)
  // ══════════════════════════════════════════════════════════════════════

  {
    day: 8, category: 'PET_FOOD', sub: 'Dog Dry Food + Dog Wet Food + Treats',
    batches: [
      `Same schema but nutrition_per_100g: {energy_kcal, protein_g, fat_g, fibre_g, sodium_mg — others null}. category: "PET_FOOD". fssai_note: "FSSAI pet food standards + Prevention of Cruelty to Animals Act". Generate exactly 20 DOG DRY FOOD products sold in India 2024. sub_category: "DOG_DRY". Flag: Ethoxyquin (banned EU), BHA/BHT, artificial colours. Products: Royal Canin Medium Adult India, Royal Canin Maxi Adult India, Royal Canin Mini Adult India, Pedigree Adult Chicken & Vegetables India, Drools Focus Super Premium Adult, Farmina N&D Dog Grain Free India, Hills Science Diet Adult India, Arden Grange Adult with Fresh Chicken India, Me-O Adult Chicken India, Kennel Kitchen Real Chicken India, Acana Regionals India, SmartHeart Dog Adult India, Chappi Adult Dog Food India, Purina ProPlan Adult India, Orijen Dog India, Fidele Dog Food India, Taste of the Wild India (High Prairie), Brit Premium Dog India, Carnilove Dog India, Real HCF Adult Dog India. JSON array only.`,
      `Same schema. Generate exactly 20 DOG WET FOOD products sold in India 2024. sub_category: "DOG_WET". Flag: Xylitol (TOXIC dogs), high sodium, grapes/onion derivatives. Products: Pedigree Adult Wet Dog Food Pouches (Chicken & Liver), Pedigree Gravy with Chicken & Vegetables, Royal Canin Maxi Wet India, Drools Wet Dog Food (Chicken & Vegetables), Cesar Adult Wet Dog Food India, Chappi Wet Dog Food India, Farmina N&D Wet Dog India, Hills Science Diet Wet Dog India, Purina ProPlan Wet Dog India, Nutro Wet Dog India, Royal Canin Puppy Wet India, Arden Grange Wet Dog India, Kennel Kitchen Wet Dog India, SmartHeart Wet Pouch India, Me-O Wet Dog India, Applaws Wet Dog India, Brit Wet Dog India, Orijen Wet Dog India, Fidele Wet Dog India, Taste of the Wild Wet Dog India. JSON array only.`,
      `Same schema. Generate exactly 20 DOG TREATS products sold in India 2024. sub_category: "DOG_TREAT". Flag: Xylitol (TOXIC), Sugar, Salt excess. Products: Pedigree DentaStix Adult India, Pedigree Milky Sticks India, Drools Oven Baked Dog Treats, Himalaya PetCare Sparkle Dental Dog Treats, Dogsee Chew Large Himalayan Yak Milk Bar, Heads Up For Tails Soft & Chewy Treats, Royal Canin Educ Training Treats India, VetriScience Canine Plus Senior, Bakers Complete Dog Treats India, Good Boy Chicken Strips India, Zuke's Mini Naturals India, Bil-Jac Dog Treats India, Orijen Freeze-Dried Treats India, Nutro Crunchy Dog Treats, Carnilove Dog Soft Snacks India, N-Bone Puppy Teething Ring India, Himalaya PetCare Erina Dog Treat, Me-O Dog Treats India, Drools Prime Chicken Chew, Purina Pro Plan Dental Chewz. JSON array only.`
    ]
  },

  {
    day: 9, category: 'PET_FOOD', sub: 'Cat Food + Puppy/Kitten + Senior',
    batches: [
      `Same pet food schema. Generate exactly 20 CAT FOOD products sold in India 2024. sub_category: "CAT_DRY" or "CAT_WET". Flag: Propylene Glycol (banned cat food US), high carbs (cat diabetes), Carrageenan (inflammation). Products (Dry-10): Royal Canin Indoor Adult Cat India, Royal Canin Hair & Skin Care Cat India, Whiskas Dry Tuna India, Me-O Dry Cat Tuna India, Farmina N&D Cat Grain Free India, Hills Science Diet Adult Cat India, Drools Focus Cat Adult India, Purina Pro Plan Cat India, Orijen Cat India, Carnilove Cat India. Products (Wet-10): Whiskas Wet Pouch Ocean Fish India, Whiskas Wet Pouch Tuna India, Me-O Creamy Treats India, Royal Canin Instinctive Wet Cat India, Temptations Creamy Purr-ee Treats India, Inaba Ciao Chururu Cat Treats India, Farmina N&D Wet Cat India, Hills Science Diet Wet Cat India, Fancy Feast India, Drools Wet Cat Food India. JSON array only.`,
      `Same pet food schema. Generate exactly 20 PUPPY / KITTEN FOOD products sold in India 2024. sub_category: "PUPPY_KITTEN". Flag: DHA levels (brain dev), Calcium:Phosphorus ratio (bone dev). Products (Puppy-10): Royal Canin Medium Puppy India, Pedigree Puppy Chicken & Milk India, Drools Focus Puppy Super Premium, Hills Science Diet Puppy India, Purina ProPlan Puppy India, Arden Grange Puppy/Junior India, Farmina N&D Puppy India, Me-O Puppy India, SmartHeart Puppy India, Kennel Kitchen Puppy India. Products (Kitten-10): Royal Canin Kitten India, Whiskas Kitten India, Me-O Kitten Milk Tuna India, Farmina N&D Kitten India, Hills Science Diet Kitten India, Drools Focus Kitten India, Purina Pro Plan Kitten India, Orijen Kitten India, Applaws Kitten India, Brit Kitten India. JSON array only.`,
      `Same pet food schema. Generate exactly 20 SENIOR / PRESCRIPTION PET FOOD products sold in India 2024. sub_category: "SENIOR_PET" or "PRESCRIPTION_PET". Flag: Phosphorus restriction (renal), sodium restriction (cardiac), Vitamin D toxicity. Products (Senior-10): Royal Canin Mature +8 Dog India, Pedigree Senior 7+ India, Hills Science Diet Senior 7+ Dog, Purina ProPlan Senior Dog India, Arden Grange Senior Dog India, Royal Canin Ageing 12+ Cat India, Hills Science Diet Senior Cat India, Purina Pro Plan Senior Cat India, Whiskas Senior 7+ Cat India, Me-O Senior Cat India. Products (Prescription-10): Royal Canin Renal Cat (kidney disease), Royal Canin Urinary SO Cat, Hills Prescription Diet k/d Canine (renal), Hills Prescription Diet c/d Feline (urinary), Royal Canin Diabetic Dog, Hills Prescription Diet w/d (diabetic), Royal Canin Hepatic Dog, Hills Prescription Diet l/d Canine (liver), Royal Canin Gastrointestinal Dog, Hills Prescription Diet i/d Canine. JSON array only.`
    ]
  },

  {
    day: 10, category: 'PET_FOOD', sub: 'Pet Supplements + Fish + Bird + Small Animal',
    batches: [
      `Same schema. Generate exactly 20 PET SUPPLEMENT products sold in India 2024. sub_category: "PET_SUPPLEMENT". Products: Himalaya PetCare Immunol Joint Support, Himalaya PetCare Reosto (Calcium), Beaphar Vitamin Malt India, Drools Absolute Calcium 500g, Dogsee Chew Puffed Treats Calcium, Heads Up For Tails Daily Multivitamin, VetriScience Canine Plus Senior, NutriVet Senior-Vite India, PetAg Bene-Bac Plus Probiotic, Royal Canin Mobility C2P+ India, Himalaya PetCare Erina-EP Shampoo (flag: topical), Nootie Medicated Anti-Bacterial Shampoo India, Vet's Best Flea & Tick India, Bayer Seresto India, Himalaya PetCare Pentasure, Drools Pro Health Digestion, Purina FortiFlora Probiotic Dog, Royal Canin Fibre Response, Hills Prescription Diet Metabolic Dog, Pedigree Dentastix Fresh India. JSON array only.`,
      `Same schema. Generate exactly 20 FISH FOOD + BIRD FOOD products sold in India 2024. FISH FOOD (10): sub_category "FISH_FOOD". category: "PET_FOOD". Flag: Ethoxyquin (EU banned for human food, still used in fish food), artificial colours. Products: Taiyo Micro Pellets India, Sera Vipan Nature India, TetraMin Tropical Flakes India, Ocean Free Superfish Flakes India, Hikari Cichlid Gold India, Saki-Hikari Color Enhancing India, API Fish Food Pellets India, Wardley Goldfish Flake India, Omega One Freshwater Flakes India, JBL NovoBel India. BIRD FOOD (10): sub_category "BIRD_FOOD". Flag: Avocado (TOXIC to birds), excess sunflower seeds (fatty liver in parrots). Products: Versele-Laga Prestige Parakeets India, Versele-Laga Prestige Parrots India, Higgins Safflower Gold Conure India, Vitapol Smakers Budgerigar India, Padovan Grandmix Parrot India, Taiyo Parrot Food India, Versele-Laga Budgie Seed Mix India, Vitapol Economic Bird Food India, Padovan Budgerigar India, JBL Grana Parakeet India. JSON array only.`,
      `Same schema. Generate exactly 20 SMALL ANIMAL FOOD products sold in India 2024. sub_category: "SMALL_ANIMAL". Flag: Artificially coloured mixes (unnecessary), excess sunflower seeds, coloured pelleted food (dye ingestion risk). Products: Kaytee Fiesta Guinea Pig India, Kaytee Fiesta Hamster & Gerbil India, Oxbow Essentials Rabbit Pellets India, Oxbow Western Timothy Hay India, Oxbow Organic Meadow Hay India, Mr. Johnson's Supreme Rabbit India, Sharples & Grant Country Harvest Hamster India, Vitakraft Emotion Beauty Hamster India, Ferplast Cunipic Guinea Pig India, Beaphar Care+ Rabbit India, Versele-Laga Complete Cuni Rabbit India, Vitapol Smakers Small Animal India, Kaytee Clean & Cozy Bedding India, Padovan Hamster India, Vitakraft Raviolos Rabbit India, Tiny Friends Farm Russel Rabbit India, Supreme Science Selective Guinea Pig India, Beaphar Care+ Guinea Pig India, JBL NovoTablet Small Animal India, Kaytee Chinchilla Dust India. JSON array only.`
    ]
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

  const dayEntry = DAILY_PROMPTS[currentDay];
  Logger.log('Running Day ' + dayEntry.day + ': ' + dayEntry.category + ' — ' + dayEntry.sub);

  // Each day has 3 batches of 20 products — run all 3 sequentially.
  // WHY: Gemini 2.0 Flash caps at 8192 output tokens; 60 products exceeds that,
  // causing truncation to ~5 products. Three calls of 20 each stay well within limits.
  const allResults = [];
  try {
    for (let i = 0; i < dayEntry.batches.length; i++) {
      Logger.log('  Batch ' + (i + 1) + '/' + dayEntry.batches.length);
      const result = callGeminiAPI(apiKey, dayEntry.batches[i]);
      allResults.push('// ── Batch ' + (i + 1) + ' ──\n' + result);
      Utilities.sleep(2000); // 2s pause between calls to avoid rate limits
    }
    const combined = allResults.join('\n\n');
    appendToDoc(docId, dayEntry.day, dayEntry.category + ' — ' + dayEntry.sub, combined);
    props.setProperty('CURRENT_DAY', String(currentDay + 1));
    Logger.log('Day ' + dayEntry.day + ' done (' + dayEntry.batches.length + ' batches). Next: Day ' + (dayEntry.day + 1));
  } catch (e) {
    Logger.log('Error on Day ' + dayEntry.day + ': ' + e);
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
