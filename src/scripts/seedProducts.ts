// src/scripts/seedProducts.ts
// ─────────────────────────────────────────────────────────────────────────────
// Raw seed data for the most common Indian packaged products.
// Ingredients and nutrition are manually verified from FSSAI declarations,
// brand websites, and major e-commerce platforms (BigBasket, Amazon India).
//
// This data is consumed by runSeed.ts, which computes verdicts via the
// scoring engine and writes CachedProduct documents to Firestore.
// ─────────────────────────────────────────────────────────────────────────────

export interface SeedProduct {
  product_name: string;
  brand: string;
  category: 'FOOD' | 'COSMETIC' | 'PERSONAL_CARE' | 'SUPPLEMENT' | 'HOUSEHOLD' | 'PET_FOOD';
  ingredients: string[];
  nutrition: {
    energy_kcal: number;
    sugar_g: number;
    sodium_mg: number;
    protein_g: number;
    fat_g: number;
    saturated_fat_g: number;
    trans_fat_g: number;
    fibre_g: number;
  };
  front_claims?: string[];
}

export const SEED_PRODUCTS: SeedProduct[] = [

  // ── BISCUITS ──────────────────────────────────────────────────────────────

  {
    product_name: "Parle-G Gold Biscuits",
    brand: "Parle",
    category: "FOOD",
    ingredients: ["Wheat Flour", "Sugar", "Edible Vegetable Oil (Palm Oil)", "Invert Syrup", "Leavening Agents (Sodium Bicarbonate, Ammonium Bicarbonate)", "Salt", "Milk Solids", "Emulsifiers (Soya Lecithin)", "Dough Conditioner (Sodium Meta Bisulphite)", "Artificial Flavour (Vanilla)"],
    nutrition: { energy_kcal: 483, sugar_g: 22, sodium_mg: 340, protein_g: 7, fat_g: 14, saturated_fat_g: 6.5, trans_fat_g: 0, fibre_g: 0.7 },
    front_claims: ["Glucose Biscuits"]
  },
  {
    product_name: "Marie Gold Biscuits",
    brand: "Britannia",
    category: "FOOD",
    ingredients: ["Wheat Flour", "Sugar", "Edible Vegetable Oil (Palm Oil)", "Invert Syrup", "Milk Solids", "Iodised Salt", "Leavening Agents (Sodium Bicarbonate, Ammonium Bicarbonate)", "Emulsifiers (322)", "Dough Conditioner (223)", "Artificial Flavour"],
    nutrition: { energy_kcal: 468, sugar_g: 17, sodium_mg: 360, protein_g: 8, fat_g: 11, saturated_fat_g: 5, trans_fat_g: 0, fibre_g: 0.8 }
  },
  {
    product_name: "Good Day Cashew Biscuits",
    brand: "Britannia",
    category: "FOOD",
    ingredients: ["Wheat Flour", "Sugar", "Edible Vegetable Oil (Palm Oil)", "Cashew Nuts (4%)", "Invert Syrup", "Milk Solids", "Iodised Salt", "Leavening Agents (Sodium Bicarbonate, Ammonium Bicarbonate)", "Emulsifiers (Soya Lecithin, INS 471)", "Artificial Flavour"],
    nutrition: { energy_kcal: 506, sugar_g: 20, sodium_mg: 290, protein_g: 7, fat_g: 22, saturated_fat_g: 10, trans_fat_g: 0, fibre_g: 1.2 },
    front_claims: ["Rich in Cashews"]
  },
  {
    product_name: "Bourbon Biscuits",
    brand: "Britannia",
    category: "FOOD",
    ingredients: ["Wheat Flour", "Sugar", "Refined Palm Oil", "Cocoa Solids (3.5%)", "Invert Syrup", "Leavening Agents (Sodium Bicarbonate, Ammonium Bicarbonate)", "Iodised Salt", "Emulsifiers (INS 322, INS 471)", "Artificial Flavour (Chocolate)"],
    nutrition: { energy_kcal: 487, sugar_g: 28, sodium_mg: 280, protein_g: 6, fat_g: 17, saturated_fat_g: 8, trans_fat_g: 0, fibre_g: 1.5 }
  },
  {
    product_name: "Hide & Seek Chocolate Chip Cookies",
    brand: "Parle",
    category: "FOOD",
    ingredients: ["Wheat Flour", "Sugar", "Edible Vegetable Oil (Palm Oil)", "Chocolate Chips (8%)", "Invert Syrup", "Cocoa Powder", "Milk Solids", "Salt", "Leavening Agents (Sodium Bicarbonate, Ammonium Bicarbonate)", "Emulsifiers (Soya Lecithin)", "Artificial Flavour"],
    nutrition: { energy_kcal: 505, sugar_g: 27, sodium_mg: 260, protein_g: 7, fat_g: 22, saturated_fat_g: 10, trans_fat_g: 0, fibre_g: 1.3 }
  },
  {
    product_name: "Monaco Classic Salted Crackers",
    brand: "Parle",
    category: "FOOD",
    ingredients: ["Wheat Flour", "Edible Vegetable Oil (Palm Oil)", "Iodised Salt", "Sugar", "Leavening Agents (Sodium Bicarbonate, Ammonium Bicarbonate)", "Emulsifiers (Soya Lecithin)", "Dough Conditioner (Sodium Meta Bisulphite)"],
    nutrition: { energy_kcal: 490, sugar_g: 4, sodium_mg: 680, protein_g: 8, fat_g: 17, saturated_fat_g: 8, trans_fat_g: 0, fibre_g: 1.0 }
  },
  {
    product_name: "50-50 Sweet & Salty Biscuits",
    brand: "Parle",
    category: "FOOD",
    ingredients: ["Wheat Flour", "Sugar", "Edible Vegetable Oil (Palm Oil)", "Iodised Salt", "Invert Syrup", "Leavening Agents (Sodium Bicarbonate, Ammonium Bicarbonate)", "Emulsifiers (Soya Lecithin)", "Dough Conditioner (Sodium Meta Bisulphite)", "Artificial Flavour"],
    nutrition: { energy_kcal: 489, sugar_g: 19, sodium_mg: 450, protein_g: 7, fat_g: 16, saturated_fat_g: 7.5, trans_fat_g: 0, fibre_g: 0.9 }
  },
  {
    product_name: "Krackjack Cracker Biscuits",
    brand: "Parle",
    category: "FOOD",
    ingredients: ["Wheat Flour", "Sugar", "Edible Vegetable Oil (Palm Oil)", "Iodised Salt", "Leavening Agents (Ammonium Bicarbonate, Sodium Bicarbonate)", "Emulsifiers (Soya Lecithin)", "Dough Conditioner (Sodium Meta Bisulphite)"],
    nutrition: { energy_kcal: 464, sugar_g: 12, sodium_mg: 580, protein_g: 8, fat_g: 13, saturated_fat_g: 5.5, trans_fat_g: 0, fibre_g: 1.1 }
  },
  {
    product_name: "Jim Jam Biscuits",
    brand: "Britannia",
    category: "FOOD",
    ingredients: ["Wheat Flour", "Sugar", "Edible Vegetable Oil (Palm Oil)", "Glucose Syrup", "Strawberry Jam (10%)", "Iodised Salt", "Leavening Agents (Sodium Bicarbonate, Ammonium Bicarbonate)", "Emulsifiers (INS 322, INS 471)", "Artificial Colour (INS 122, INS 110)", "Artificial Flavour"],
    nutrition: { energy_kcal: 466, sugar_g: 32, sodium_mg: 220, protein_g: 5, fat_g: 14, saturated_fat_g: 6.5, trans_fat_g: 0, fibre_g: 0.8 }
  },
  {
    product_name: "Digestive Biscuits",
    brand: "McVitie's",
    category: "FOOD",
    ingredients: ["Whole Wheat Flour (30%)", "Wheat Flour", "Sugar", "Edible Vegetable Oil (Palm Oil)", "Oatmeal (5%)", "Invert Syrup", "Raising Agents (Sodium Bicarbonate, Ammonium Bicarbonate)", "Salt", "Emulsifiers (Soya Lecithin)"],
    nutrition: { energy_kcal: 471, sugar_g: 16.6, sodium_mg: 400, protein_g: 6.5, fat_g: 20, saturated_fat_g: 9, trans_fat_g: 0, fibre_g: 3.5 },
    front_claims: ["Digestive", "Whole Wheat"]
  },
  {
    product_name: "NutriChoice 5 Grain Biscuits",
    brand: "Britannia",
    category: "FOOD",
    ingredients: ["Whole Wheat Flour (30%)", "Oatmeal", "Corn", "Ragi", "Rice", "Edible Vegetable Oil (Palm Oil)", "Sugar", "Invert Syrup", "Iodised Salt", "Leavening Agents", "Emulsifiers"],
    nutrition: { energy_kcal: 452, sugar_g: 10, sodium_mg: 310, protein_g: 9, fat_g: 15, saturated_fat_g: 6.5, trans_fat_g: 0, fibre_g: 4.2 },
    front_claims: ["5 Grain", "No Maida", "High Fibre"]
  },
  {
    product_name: "Oreo Original Cookies",
    brand: "Cadbury",
    category: "FOOD",
    ingredients: ["Wheat Flour", "Sugar", "Edible Vegetable Oil (Palm Oil)", "Cocoa Solids (5.1%)", "Invert Syrup", "Raising Agents (Sodium Bicarbonate, Ammonium Bicarbonate)", "Salt", "Emulsifiers (Soya Lecithin)", "Vanilla Flavour"],
    nutrition: { energy_kcal: 481, sugar_g: 38, sodium_mg: 340, protein_g: 5, fat_g: 20, saturated_fat_g: 9.5, trans_fat_g: 0, fibre_g: 2.2 }
  },

  // ── BISCUITS — DAY 2 CHATGPT ADDITIONS ───────────────────────────────────

  {
    product_name: "Britannia Good Day Butter Cookies",
    brand: "Britannia",
    category: "FOOD",
    ingredients: ["Refined Wheat Flour", "Sugar", "Edible Vegetable Oil (Palm Oil)", "Butter (2%)", "Invert Sugar Syrup", "Milk Solids", "Raising Agents (INS 500, INS 503)", "Iodised Salt", "Emulsifier (INS 322)"],
    nutrition: { energy_kcal: 520, sugar_g: 24, sodium_mg: 300, protein_g: 6, fat_g: 26, saturated_fat_g: 14, trans_fat_g: 0, fibre_g: 2 },
    front_claims: ["Real Butter", "Crunchy Cookies"]
  },
  {
    product_name: "Britannia Little Hearts Biscuits",
    brand: "Britannia",
    category: "FOOD",
    ingredients: ["Refined Wheat Flour", "Sugar", "Edible Vegetable Oil (Palm Oil)", "Invert Sugar Syrup", "Raising Agents (INS 500, INS 503)", "Iodised Salt", "Emulsifier (INS 322)"],
    nutrition: { energy_kcal: 510, sugar_g: 30, sodium_mg: 280, protein_g: 6, fat_g: 24, saturated_fat_g: 11, trans_fat_g: 0, fibre_g: 2 },
    front_claims: ["Heart Shaped", "Light & Crispy"]
  },
  {
    product_name: "Dukes Wafer Rolls Chocolate",
    brand: "Dukes",
    category: "FOOD",
    ingredients: ["Refined Wheat Flour", "Sugar", "Edible Vegetable Oil (Palm Oil)", "Cocoa Solids (3%)", "Milk Solids", "Emulsifier (INS 322)", "Raising Agent (INS 500)", "Artificial Flavour (Chocolate)"],
    nutrition: { energy_kcal: 540, sugar_g: 32, sodium_mg: 200, protein_g: 5, fat_g: 30, saturated_fat_g: 15, trans_fat_g: 0, fibre_g: 2 },
    front_claims: ["Crispy Wafer Rolls", "Chocolate Filled"]
  },

  // ── CHIPS & NAMKEEN ───────────────────────────────────────────────────────

  {
    product_name: "Lay's Classic Salted",
    brand: "PepsiCo",
    category: "FOOD",
    ingredients: ["Potatoes", "Edible Vegetable Oil (Palm Oil / Sunflower Oil)", "Iodised Salt"],
    nutrition: { energy_kcal: 536, sugar_g: 0.5, sodium_mg: 620, protein_g: 6.5, fat_g: 34, saturated_fat_g: 14, trans_fat_g: 0, fibre_g: 4.8 }
  },
  {
    product_name: "Lay's Magic Masala",
    brand: "PepsiCo",
    category: "FOOD",
    ingredients: ["Potatoes", "Edible Vegetable Oil (Palm Oil)", "Masala (Dextrose, Iodised Salt, Spices, Acidity Regulators (INS 330, INS 296), Flavour Enhancer (INS 627, INS 631), Anticaking Agent (INS 551))"],
    nutrition: { energy_kcal: 538, sugar_g: 3.5, sodium_mg: 720, protein_g: 6.5, fat_g: 34, saturated_fat_g: 15, trans_fat_g: 0, fibre_g: 4.5 }
  },
  {
    product_name: "Kurkure Masala Munch",
    brand: "PepsiCo",
    category: "FOOD",
    ingredients: ["Corn Meal", "Edible Vegetable Oil (Palm Oil)", "Rice Meal", "Pulse Flour", "Masala (Iodised Salt, Spices, Sugar, Dextrose, Acidity Regulator (INS 330), Flavour Enhancer (INS 627, INS 631), Colour (INS 110), Anticaking Agent (INS 551))"],
    nutrition: { energy_kcal: 530, sugar_g: 4, sodium_mg: 800, protein_g: 7, fat_g: 30, saturated_fat_g: 13.5, trans_fat_g: 0, fibre_g: 2.5 }
  },
  {
    product_name: "Bingo Mad Angles Achaari Masti",
    brand: "ITC",
    category: "FOOD",
    ingredients: ["Wheat Flour", "Edible Vegetable Oil (Palm Oil)", "Iodised Salt", "Rice Flour", "Spices and Condiments", "Acidity Regulator (INS 330)", "Flavour Enhancer (INS 627, INS 631)", "Anticaking Agent (INS 551)"],
    nutrition: { energy_kcal: 526, sugar_g: 2, sodium_mg: 760, protein_g: 8, fat_g: 28, saturated_fat_g: 13, trans_fat_g: 0, fibre_g: 1.8 }
  },
  {
    product_name: "Haldiram's Aloo Bhujia",
    brand: "Haldiram's",
    category: "FOOD",
    ingredients: ["Besan (Chickpea Flour)", "Potato (20%)", "Edible Vegetable Oil (Palm Oil)", "Iodised Salt", "Spices (Black Pepper, Red Chilli, Coriander)", "Citric Acid"],
    nutrition: { energy_kcal: 541, sugar_g: 2, sodium_mg: 680, protein_g: 14, fat_g: 33, saturated_fat_g: 14, trans_fat_g: 0, fibre_g: 5.5 }
  },
  {
    product_name: "Haldiram's Moong Dal",
    brand: "Haldiram's",
    category: "FOOD",
    ingredients: ["Moong Dal (Green Gram)", "Edible Vegetable Oil (Palm Oil)", "Iodised Salt", "Spices (Black Pepper, Red Chilli)", "Citric Acid"],
    nutrition: { energy_kcal: 546, sugar_g: 1.5, sodium_mg: 640, protein_g: 23, fat_g: 28, saturated_fat_g: 12, trans_fat_g: 0, fibre_g: 7.2 }
  },
  {
    product_name: "Uncle Chips Spicy Treat",
    brand: "PepsiCo",
    category: "FOOD",
    ingredients: ["Potatoes", "Edible Vegetable Oil (Palm Oil)", "Masala (Iodised Salt, Spices, Dextrose, Acidity Regulator (INS 330), Colour (INS 160c))"],
    nutrition: { energy_kcal: 540, sugar_g: 1.5, sodium_mg: 690, protein_g: 6, fat_g: 35, saturated_fat_g: 15, trans_fat_g: 0, fibre_g: 4.2 }
  },
  {
    product_name: "Bikano Chaat Chaska",
    brand: "Bikano",
    category: "FOOD",
    ingredients: ["Rice Flakes", "Puffed Rice", "Groundnuts", "Edible Vegetable Oil (Palm Oil)", "Dals", "Iodised Salt", "Spices", "Sugar", "Citric Acid"],
    nutrition: { energy_kcal: 510, sugar_g: 5, sodium_mg: 640, protein_g: 12, fat_g: 25, saturated_fat_g: 10, trans_fat_g: 0, fibre_g: 4.5 }
  },

  // ── INSTANT NOODLES ───────────────────────────────────────────────────────

  {
    product_name: "Maggi 2-Minute Masala Noodles",
    brand: "Nestle",
    category: "FOOD",
    ingredients: ["Wheat Flour (Maida)", "Palm Oil", "Salt", "Minerals (Calcium Carbonate)", "Gluten", "Masala Tastemaker (Iodised Salt, Sugar, Spices (Coriander, Turmeric, Chilli), Onion Powder, Garlic Powder, Hydrolysed Groundnut Protein, Maltodextrin, Acidity Regulator (INS 330), Flavour Enhancer (INS 635), Colour (INS 160c), Anticaking Agent (INS 551))"],
    nutrition: { energy_kcal: 387, sugar_g: 1.8, sodium_mg: 1030, protein_g: 9, fat_g: 13, saturated_fat_g: 6, trans_fat_g: 0, fibre_g: 1.5 }
  },
  {
    product_name: "Sunfeast Yippee Classic Masala Noodles",
    brand: "ITC",
    category: "FOOD",
    ingredients: ["Wheat Flour (Maida)", "Palm Oil", "Salt", "Acidity Regulator (INS 501(i))", "Antioxidant (INS 319)", "Yippee Masala (Iodised Salt, Spices, Sugar, Dehydrated Vegetables, Hydrolysed Groundnut Protein, Citric Acid, Flavour Enhancer (INS 635))"],
    nutrition: { energy_kcal: 380, sugar_g: 1.5, sodium_mg: 1010, protein_g: 8, fat_g: 12, saturated_fat_g: 6, trans_fat_g: 0, fibre_g: 1.4 }
  },
  {
    product_name: "Maggi Atta Noodles",
    brand: "Nestle",
    category: "FOOD",
    ingredients: ["Whole Wheat Flour (Atta, 60%)", "Palm Oil", "Wheat Flour", "Salt", "Minerals", "Masala Tastemaker (same as Maggi Masala)"],
    nutrition: { energy_kcal: 374, sugar_g: 1.5, sodium_mg: 980, protein_g: 10, fat_g: 11, saturated_fat_g: 5, trans_fat_g: 0, fibre_g: 3.2 },
    front_claims: ["Whole Wheat Atta", "High Fibre"]
  },
  {
    product_name: "Top Ramen Curry Noodles",
    brand: "Nissin",
    category: "FOOD",
    ingredients: ["Wheat Flour", "Palm Oil", "Salt", "Mineral (Calcium Carbonate)", "Curry Masala (Iodised Salt, Sugar, Spices, Dehydrated Onion, Flavour Enhancer (INS 627, INS 631), Colour (INS 160c))"],
    nutrition: { energy_kcal: 385, sugar_g: 2, sodium_mg: 980, protein_g: 8.5, fat_g: 13, saturated_fat_g: 6.5, trans_fat_g: 0, fibre_g: 1.2 }
  },
  {
    product_name: "Wai Wai Chicken Flavour Noodles",
    brand: "CG Foods",
    category: "FOOD",
    ingredients: ["Wheat Flour", "Palm Oil", "Iodised Salt", "Chicken Powder", "Monosodium Glutamate (INS 621)", "Sugar", "Spices", "Flavour Enhancer (INS 627, INS 631)", "Colour (INS 150d)"],
    nutrition: { energy_kcal: 405, sugar_g: 2.5, sodium_mg: 1120, protein_g: 9, fat_g: 15, saturated_fat_g: 7, trans_fat_g: 0, fibre_g: 1.0 }
  },

  // ── BREAKFAST CEREALS ─────────────────────────────────────────────────────

  {
    product_name: "Kellogg's Corn Flakes",
    brand: "Kellogg's",
    category: "FOOD",
    ingredients: ["Milled Corn (99%)", "Sugar", "Salt", "Malt Flavour", "Vitamins and Minerals (Niacin, Vitamin B6, Riboflavin, Thiamine, Folic Acid, Vitamin B12, Vitamin D, Iron, Zinc Oxide)"],
    nutrition: { energy_kcal: 357, sugar_g: 7, sodium_mg: 530, protein_g: 7, fat_g: 0.5, saturated_fat_g: 0.1, trans_fat_g: 0, fibre_g: 2.5 },
    front_claims: ["Fortified with Vitamins and Minerals"]
  },
  {
    product_name: "Kellogg's Chocos",
    brand: "Kellogg's",
    category: "FOOD",
    ingredients: ["Whole Wheat (42%)", "Sugar", "Corn Flour", "Cocoa Powder (3.5%)", "Malt Extract", "Salt", "Vitamins and Minerals", "Artificial Flavour"],
    nutrition: { energy_kcal: 388, sugar_g: 27, sodium_mg: 320, protein_g: 7.5, fat_g: 2.5, saturated_fat_g: 0.8, trans_fat_g: 0, fibre_g: 4 },
    front_claims: ["Whole Wheat", "Fortified"]
  },
  {
    product_name: "Quaker Oats",
    brand: "PepsiCo",
    category: "FOOD",
    ingredients: ["Rolled Oats (100%)"],
    nutrition: { energy_kcal: 379, sugar_g: 0.4, sodium_mg: 4, protein_g: 13, fat_g: 7, saturated_fat_g: 1.5, trans_fat_g: 0, fibre_g: 10.2 },
    front_claims: ["100% Whole Grain", "No Added Sugar", "High Fibre"]
  },
  {
    product_name: "Saffola Oats",
    brand: "Marico",
    category: "FOOD",
    ingredients: ["Rolled Oats (100%)"],
    nutrition: { energy_kcal: 378, sugar_g: 0.3, sodium_mg: 3, protein_g: 13, fat_g: 7, saturated_fat_g: 1.4, trans_fat_g: 0, fibre_g: 10.5 },
    front_claims: ["100% Natural", "No Added Sugar", "High Fibre", "Heart Healthy"]
  },
  {
    product_name: "Bagrry's White Oats",
    brand: "Bagrry's",
    category: "FOOD",
    ingredients: ["Rolled Oats (100%)"],
    nutrition: { energy_kcal: 375, sugar_g: 0.3, sodium_mg: 2, protein_g: 12.5, fat_g: 6.8, saturated_fat_g: 1.3, trans_fat_g: 0, fibre_g: 10.8 },
    front_claims: ["100% Whole Grain Oats"]
  },
  {
    product_name: "Saffola Muesli Crunchy Oats & Honey",
    brand: "Marico",
    category: "FOOD",
    ingredients: ["Oats (50%)", "Sugar", "Honey (5%)", "Corn Flakes", "Dried Fruits (Raisins, Cranberries)", "Sunflower Seeds", "Almonds", "Edible Vegetable Oil (Sunflower Oil)", "Salt"],
    nutrition: { energy_kcal: 390, sugar_g: 18, sodium_mg: 130, protein_g: 9, fat_g: 8, saturated_fat_g: 1.5, trans_fat_g: 0, fibre_g: 6.5 }
  },

  // ── BEVERAGES ─────────────────────────────────────────────────────────────

  {
    product_name: "Frooti Mango Fruit Drink",
    brand: "Parle Agro",
    category: "FOOD",
    ingredients: ["Water", "Sugar", "Mango Pulp (13%)", "Acidity Regulator (INS 330)", "Colour (INS 110)", "Preservative (INS 211)", "Artificial Mango Flavour"],
    nutrition: { energy_kcal: 52, sugar_g: 12.5, sodium_mg: 10, protein_g: 0.1, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Mango Drink"]
  },
  {
    product_name: "Maaza Mango Drink",
    brand: "Coca-Cola India",
    category: "FOOD",
    ingredients: ["Water", "Sugar", "Mango Pulp (12%)", "Citric Acid (INS 330)", "Artificial Mango Flavour", "Preservative (INS 211)", "Colour (INS 110)"],
    nutrition: { energy_kcal: 54, sugar_g: 13, sodium_mg: 12, protein_g: 0.1, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 }
  },
  {
    product_name: "Slice Mango Drink",
    brand: "PepsiCo",
    category: "FOOD",
    ingredients: ["Water", "Sugar", "Mango Pulp (14.5%)", "Acidity Regulator (INS 330)", "Stabiliser (INS 440)", "Preservative (INS 211)", "Artificial Mango Flavour", "Colour (INS 110)"],
    nutrition: { energy_kcal: 60, sugar_g: 14.5, sodium_mg: 8, protein_g: 0.2, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0.2 },
    front_claims: ["Real Mango Pulp"]
  },
  {
    product_name: "Real Fruit Power Orange",
    brand: "Dabur",
    category: "FOOD",
    ingredients: ["Water", "Sugar", "Orange Juice Concentrate (10%)", "Citric Acid", "Vitamin C", "Preservative (INS 202)", "Colour (INS 110)", "Artificial Orange Flavour"],
    nutrition: { energy_kcal: 54, sugar_g: 13, sodium_mg: 10, protein_g: 0.2, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["No Added Preservatives", "Vitamin C"]
  },
  {
    product_name: "Paper Boat Aamras",
    brand: "Hector Beverages",
    category: "FOOD",
    ingredients: ["Mango Pulp (85%)", "Sugar", "Water", "Cardamom", "Saffron"],
    nutrition: { energy_kcal: 76, sugar_g: 17.5, sodium_mg: 6, protein_g: 0.6, fat_g: 0.1, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0.4 },
    front_calls: ["No Preservatives", "No Artificial Colour", "Crafted in India"]
  },
  {
    product_name: "Tropicana Orange 100% Juice",
    brand: "PepsiCo",
    category: "FOOD",
    ingredients: ["Reconstituted Orange Juice (100%)"],
    nutrition: { energy_kcal: 42, sugar_g: 9.5, sodium_mg: 1, protein_g: 0.7, fat_g: 0.1, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0.2 },
    front_claims: ["100% Juice", "No Added Sugar", "No Artificial Colour"]
  },
  {
    product_name: "Appy Fizz Apple Drink",
    brand: "Parle Agro",
    category: "FOOD",
    ingredients: ["Carbonated Water", "Sugar", "Apple Juice Concentrate (2%)", "Acidity Regulator (INS 330)", "Preservative (INS 211)", "Artificial Apple Flavour"],
    nutrition: { energy_kcal: 48, sugar_g: 11.5, sodium_mg: 14, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 }
  },
  {
    product_name: "Coca-Cola",
    brand: "Coca-Cola India",
    category: "FOOD",
    ingredients: ["Carbonated Water", "Sugar", "Caramel Colour (INS 150d)", "Phosphoric Acid (INS 338)", "Natural Flavours", "Caffeine"],
    nutrition: { energy_kcal: 42, sugar_g: 10.6, sodium_mg: 10, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 }
  },
  {
    product_name: "Pepsi",
    brand: "PepsiCo",
    category: "FOOD",
    ingredients: ["Carbonated Water", "Sugar", "Caramel Colour (INS 150d)", "Citric Acid (INS 330)", "Phosphoric Acid (INS 338)", "Natural Flavours", "Caffeine"],
    nutrition: { energy_kcal: 43, sugar_g: 11, sodium_mg: 11, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 }
  },
  {
    product_name: "Thums Up",
    brand: "Coca-Cola India",
    category: "FOOD",
    ingredients: ["Carbonated Water", "Sugar", "Caramel Colour (INS 150d)", "Phosphoric Acid (INS 338)", "Natural Flavours", "Caffeine"],
    nutrition: { energy_kcal: 45, sugar_g: 11.2, sodium_mg: 10, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 }
  },
  {
    product_name: "Limca Lemon Lime Drink",
    brand: "Coca-Cola India",
    category: "FOOD",
    ingredients: ["Carbonated Water", "Sugar", "Acidity Regulator (INS 330)", "Natural Lemon-Lime Flavour"],
    nutrition: { energy_kcal: 40, sugar_g: 10, sodium_mg: 25, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 }
  },

  // ── BEVERAGES — DAY 3 CHATGPT ADDITIONS ──────────────────────────────────

  {
    product_name: "Sprite Lemon-Lime Flavoured Drink",
    brand: "Coca-Cola India",
    category: "FOOD",
    ingredients: ["Carbonated Water", "Sugar", "Acidity Regulators (INS 330, INS 331)", "Natural Lemon-Lime Flavour"],
    nutrition: { energy_kcal: 40, sugar_g: 10, sodium_mg: 8, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 }
  },
  {
    product_name: "Fanta Orange Flavoured Drink",
    brand: "Coca-Cola India",
    category: "FOOD",
    ingredients: ["Carbonated Water", "Sugar", "Acidity Regulator (INS 330)", "Colour (INS 110)", "Natural Orange Flavour"],
    nutrition: { energy_kcal: 45, sugar_g: 11.2, sodium_mg: 7, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Orange Flavoured", "No Added Preservatives"]
  },
  {
    product_name: "Real Mixed Fruit Juice",
    brand: "Dabur",
    category: "FOOD",
    ingredients: ["Water", "Mixed Fruit Pulp (Mango, Guava, Pineapple, Papaya)", "Sugar", "Acidity Regulator (INS 330)", "Antioxidant (INS 300)", "Preservative (INS 202)"],
    nutrition: { energy_kcal: 55, sugar_g: 12, sodium_mg: 6, protein_g: 0.3, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0.5 },
    front_claims: ["Mixed Fruit", "Vitamin C"]
  },
  {
    product_name: "Red Bull Energy Drink",
    brand: "Red Bull India",
    category: "FOOD",
    ingredients: ["Carbonated Water", "Sucrose", "Glucose", "Citric Acid (INS 330)", "Sodium Citrate (INS 331)", "Taurine (400 mg/250ml)", "Caffeine (80 mg/250ml)", "Niacinamide", "Pantothenic Acid", "Vitamin B6", "Vitamin B12", "Natural & Artificial Flavours", "Colour (INS 150c)"],
    nutrition: { energy_kcal: 45, sugar_g: 11, sodium_mg: 40, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Caffeine 80mg", "Taurine", "B-Vitamins", "Vitalises Body & Mind"]
  },
  {
    product_name: "Sting Energy Drink",
    brand: "PepsiCo",
    category: "FOOD",
    ingredients: ["Carbonated Water", "Sugar", "Citric Acid (INS 330)", "Taurine (300 mg/250ml)", "Caffeine (79 mg/250ml)", "Inositol", "Vitamins (B3, B6, B12)", "Colour (INS 110)", "Artificial Flavour (Strawberry)"],
    nutrition: { energy_kcal: 47, sugar_g: 11.5, sodium_mg: 35, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Power Packed", "Caffeine + Taurine"]
  },
  {
    product_name: "Bru Gold Instant Coffee",
    brand: "Hindustan Unilever",
    category: "FOOD",
    ingredients: ["Coffee (100%)"],
    nutrition: { energy_kcal: 2, sugar_g: 0, sodium_mg: 5, protein_g: 0.3, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Gold Roast", "100% Pure Coffee"]
  },
  {
    product_name: "Rasna Instant Drink Mix Orange",
    brand: "Rasna",
    category: "FOOD",
    ingredients: ["Sugar", "Acidity Regulator (INS 330)", "Artificial Orange Flavour", "Colour (INS 110)", "Anticaking Agent (INS 551)"],
    nutrition: { energy_kcal: 380, sugar_g: 90, sodium_mg: 20, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Makes 32 Glasses", "Instant Mix"]
  },

  // ── DAIRY & CONFECTIONERY ─────────────────────────────────────────────────

  {
    product_name: "Amul Butter",
    brand: "Amul",
    category: "FOOD",
    ingredients: ["Pasteurised Cream (from Cow Milk)", "Common Salt"],
    nutrition: { energy_kcal: 720, sugar_g: 0.1, sodium_mg: 640, protein_g: 0.5, fat_g: 80, saturated_fat_g: 50, trans_fat_g: 3.1, fibre_g: 0 }
  },
  {
    product_name: "Amul Processed Cheese Slices",
    brand: "Amul",
    category: "FOOD",
    ingredients: ["Cheese (Cow Milk)", "Emulsifying Salts (INS 331, INS 450, INS 452)", "Common Salt", "Acidity Regulator (INS 330)", "Preservative (INS 234)"],
    nutrition: { energy_kcal: 315, sugar_g: 0.2, sodium_mg: 1040, protein_g: 19, fat_g: 26, saturated_fat_g: 16, trans_fat_g: 0.5, fibre_g: 0 }
  },
  {
    product_name: "Amul Kool Koko Chocolate Milk",
    brand: "Amul",
    category: "FOOD",
    ingredients: ["Toned Milk", "Sugar", "Cocoa Powder (1.5%)", "Stabiliser (INS 407)", "Artificial Chocolate Flavour"],
    nutrition: { energy_kcal: 72, sugar_g: 9.5, sodium_mg: 60, protein_g: 3.5, fat_g: 1.5, saturated_fat_g: 0.9, trans_fat_g: 0, fibre_g: 0 }
  },
  {
    product_name: "Nestle Munch Chocolate Bar",
    brand: "Nestle",
    category: "FOOD",
    ingredients: ["Sugar", "Wheat Flour", "Edible Vegetable Fat (Palm Oil)", "Cocoa Solids (Cocoa Butter, Cocoa Powder)", "Glucose Syrup", "Milk Solids", "Invert Syrup", "Emulsifiers (INS 322, INS 476)", "Salt", "Raising Agent (INS 500(ii))", "Artificial Flavour (Vanilla)"],
    nutrition: { energy_kcal: 521, sugar_g: 43, sodium_mg: 185, protein_g: 5.5, fat_g: 26, saturated_fat_g: 13, trans_fat_g: 0.3, fibre_g: 1.2 }
  },
  {
    product_name: "KitKat 4 Finger",
    brand: "Nestle",
    category: "FOOD",
    ingredients: ["Sugar", "Wheat Flour", "Cocoa Butter", "Skimmed Milk Powder", "Cocoa Mass", "Milk Fat", "Lactose", "Whey Powder", "Hazelnuts", "Emulsifier (INS 322)", "Raising Agent (INS 500)", "Artificial Flavour (Vanilla)"],
    nutrition: { energy_kcal: 518, sugar_g: 48, sodium_mg: 80, protein_g: 6.3, fat_g: 26, saturated_fat_g: 15, trans_fat_g: 0.1, fibre_g: 1.8 }
  },
  {
    product_name: "Cadbury Dairy Milk Silk",
    brand: "Cadbury",
    category: "FOOD",
    ingredients: ["Sugar", "Cocoa Butter", "Whole Milk Powder", "Cocoa Mass", "Skim Milk Powder", "Lactose", "Vegetable Fat", "Emulsifiers (INS 442, INS 476)", "Milk Fat", "Artificial Flavour (Vanilla)"],
    nutrition: { energy_kcal: 565, sugar_g: 50, sodium_mg: 75, protein_g: 7.5, fat_g: 34, saturated_fat_g: 20, trans_fat_g: 0.1, fibre_g: 1.5 }
  },
  {
    product_name: "Cadbury 5 Star",
    brand: "Cadbury",
    category: "FOOD",
    ingredients: ["Sugar", "Glucose Syrup", "Edible Vegetable Fat (Palm Oil)", "Cocoa Solids", "Skim Milk Powder", "Invert Syrup", "Butter", "Emulsifier (INS 322)", "Artificial Flavour (Vanilla)"],
    nutrition: { energy_kcal: 479, sugar_g: 52, sodium_mg: 120, protein_g: 3.5, fat_g: 21, saturated_fat_g: 12, trans_fat_g: 0.2, fibre_g: 0.5 }
  },
  {
    product_name: "Milkybar",
    brand: "Nestle",
    category: "FOOD",
    ingredients: ["Sugar", "Whole Milk Powder", "Cocoa Butter", "Skim Milk Powder", "Milk Fat", "Whey Powder", "Emulsifier (INS 322)", "Artificial Flavour (Vanilla)"],
    nutrition: { energy_kcal: 545, sugar_g: 51, sodium_mg: 120, protein_g: 9, fat_g: 30, saturated_fat_g: 18, trans_fat_g: 0.1, fibre_g: 0 }
  },
  {
    product_name: "Cadbury Eclairs",
    brand: "Cadbury",
    category: "FOOD",
    ingredients: ["Sugar", "Glucose Syrup", "Edible Vegetable Fat (Palm Oil)", "Cocoa Powder", "Skim Milk Powder", "Emulsifier (INS 322)", "Artificial Flavour"],
    nutrition: { energy_kcal: 441, sugar_g: 55, sodium_mg: 70, protein_g: 1.5, fat_g: 16, saturated_fat_g: 10, trans_fat_g: 0.3, fibre_g: 0.3 }
  },

  // ── CHOCOLATES — DAY 2 CHATGPT ADDITIONS ─────────────────────────────────

  {
    product_name: "Cadbury Dairy Milk Chocolate",
    brand: "Cadbury",
    category: "FOOD",
    ingredients: ["Sugar", "Milk Solids (25%)", "Cocoa Butter", "Cocoa Solids", "Edible Vegetable Fat (Palm Oil)", "Emulsifiers (INS 442, INS 476)", "Artificial Flavour (Vanilla)"],
    nutrition: { energy_kcal: 534, sugar_g: 56, sodium_mg: 80, protein_g: 7, fat_g: 30, saturated_fat_g: 18, trans_fat_g: 0.1, fibre_g: 2 },
    front_claims: ["Real Dairy Milk", "Classic Taste"]
  },
  {
    product_name: "Cadbury Perk Chocolate",
    brand: "Cadbury",
    category: "FOOD",
    ingredients: ["Sugar", "Refined Wheat Flour", "Edible Vegetable Fat (Palm Oil)", "Cocoa Solids", "Milk Solids", "Glucose Syrup", "Invert Syrup", "Emulsifier (INS 322)", "Raising Agent (INS 500)", "Artificial Flavour (Vanilla)"],
    nutrition: { energy_kcal: 510, sugar_g: 52, sodium_mg: 95, protein_g: 5, fat_g: 25, saturated_fat_g: 14, trans_fat_g: 0.2, fibre_g: 2 },
    front_claims: ["Light Chocolate Wafer"]
  },
  {
    product_name: "Amul Dark Chocolate 55%",
    brand: "Amul",
    category: "FOOD",
    ingredients: ["Cocoa Solids (55%)", "Sugar", "Cocoa Butter", "Emulsifier (INS 322)", "Vanilla Flavour"],
    nutrition: { energy_kcal: 520, sugar_g: 45, sodium_mg: 20, protein_g: 6, fat_g: 32, saturated_fat_g: 20, trans_fat_g: 0, fibre_g: 5 },
    front_claims: ["55% Cocoa", "Dark Chocolate", "Rich Taste"]
  },
  {
    product_name: "Cadbury Bournville Dark Chocolate",
    brand: "Cadbury",
    category: "FOOD",
    ingredients: ["Cocoa Solids (50%)", "Sugar", "Cocoa Butter", "Emulsifier (INS 322)", "Vanilla Flavour"],
    nutrition: { energy_kcal: 525, sugar_g: 48, sodium_mg: 25, protein_g: 5, fat_g: 33, saturated_fat_g: 19, trans_fat_g: 0, fibre_g: 6 },
    front_claims: ["50% Cocoa", "Rich Dark Chocolate", "Not Too Sweet"]
  },
  {
    product_name: "Snickers Chocolate Bar",
    brand: "Mars India",
    category: "FOOD",
    ingredients: ["Sugar", "Peanuts (15%)", "Glucose Syrup", "Skim Milk Powder", "Cocoa Butter", "Cocoa Mass", "Milk Fat", "Lactose", "Peanut Oil", "Emulsifier (INS 322)", "Salt", "Artificial Flavour (Vanilla)"],
    nutrition: { energy_kcal: 500, sugar_g: 50, sodium_mg: 200, protein_g: 8, fat_g: 24, saturated_fat_g: 10, trans_fat_g: 0.3, fibre_g: 3 },
    front_claims: ["Peanuts", "Caramel", "Nougat", "Hunger Satisfied"]
  },
  {
    product_name: "Alpenliebe Caramel Candy",
    brand: "Perfetti Van Melle",
    category: "FOOD",
    ingredients: ["Sugar", "Glucose Syrup", "Milk Solids (5%)", "Edible Vegetable Fat (Palm Oil)", "Emulsifier (INS 322)", "Artificial Caramel Flavour", "Colour (INS 150c)"],
    nutrition: { energy_kcal: 400, sugar_g: 80, sodium_mg: 50, protein_g: 0, fat_g: 8, saturated_fat_g: 5, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Caramel Flavour", "Smooth & Creamy"]
  },
  {
    product_name: "Mentos Mint Candy",
    brand: "Perfetti Van Melle",
    category: "FOOD",
    ingredients: ["Sugar", "Glucose Syrup", "Hydrogenated Coconut Oil", "Rice Starch", "Natural Peppermint Flavour", "Gum Arabic (INS 414)", "Carnauba Wax (INS 903)"],
    nutrition: { energy_kcal: 390, sugar_g: 92, sodium_mg: 30, protein_g: 0, fat_g: 2, saturated_fat_g: 1, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Freshness", "The Freshmaker"]
  },

  // ── HEALTH SUPPLEMENTS / MALT DRINKS ──────────────────────────────────────

  {
    product_name: "Horlicks Classic Malt",
    brand: "GSK / Unilever",
    category: "SUPPLEMENT",
    ingredients: ["Whole Wheat (44%)", "Milk Solids (23%)", "Sugar", "Barley Malt Extract", "Minerals (Iron, Calcium, Zinc)", "Vitamins (A, B1, B2, B6, B12, C, D)", "Artificial Flavour"],
    nutrition: { energy_kcal: 388, sugar_g: 18, sodium_mg: 120, protein_g: 12, fat_g: 5.5, saturated_fat_g: 3.5, trans_fat_g: 0, fibre_g: 1.5 },
    front_claims: ["Taller Stronger Sharper", "Vitamins & Minerals"]
  },
  {
    product_name: "Boost Chocolate Malt Drink",
    brand: "GSK / Unilever",
    category: "SUPPLEMENT",
    ingredients: ["Sugar", "Malt Extract (30%)", "Cocoa Solids (5%)", "Milk Solids", "Glucose", "Vitamins (B1, B2, B6, B12, C, D, Niacin)", "Minerals (Iron, Zinc, Calcium)", "Artificial Chocolate Flavour"],
    nutrition: { energy_kcal: 392, sugar_g: 38, sodium_mg: 95, protein_g: 7.5, fat_g: 4, saturated_fat_g: 2.5, trans_fat_g: 0, fibre_g: 1.2 },
    front_claims: ["Energy Drink", "Stamina", "Vitamins & Minerals"]
  },
  {
    product_name: "Bournvita Chocolate Drink",
    brand: "Cadbury",
    category: "SUPPLEMENT",
    ingredients: ["Sugar", "Wheat (21.5%)", "Cocoa Solids (6%)", "Milk Solids", "Maltodextrin", "Caramel (INS 150c)", "Vitamins (A, B2, B12, C, D)", "Minerals (Calcium, Iron, Phosphorus, Zinc)", "Artificial Flavour"],
    nutrition: { energy_kcal: 395, sugar_g: 47, sodium_mg: 90, protein_g: 6.5, fat_g: 3, saturated_fat_g: 1.5, trans_fat_g: 0, fibre_g: 1 },
    front_claims: ["Strong Bones", "Immunity", "Vitamins & Minerals"]
  },
  {
    product_name: "Complan Original",
    brand: "Zydus Wellness",
    category: "SUPPLEMENT",
    ingredients: ["Skim Milk Powder (52%)", "Sugar", "Dextrose", "Maltodextrin", "Edible Vegetable Oil", "Vitamins (23 vitamins & minerals)", "Emulsifier (Soya Lecithin)", "Artificial Flavour"],
    nutrition: { energy_kcal: 375, sugar_g: 22, sodium_mg: 200, protein_g: 19, fat_g: 4.5, saturated_fat_g: 2.8, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["2x Faster Growth", "100% Milk Protein"]
  },
  {
    product_name: "Protinex Original",
    brand: "Danone",
    category: "SUPPLEMENT",
    ingredients: ["Hydrolysed Groundnut Protein (40%)", "Milk Solids", "Corn Starch", "Sugar", "Maltodextrin", "Vitamins (A, B1, B2, B6, B12, C, D, E)", "Minerals (Iron, Zinc, Calcium, Phosphorus)", "Emulsifier (Soya Lecithin)"],
    nutrition: { energy_kcal: 360, sugar_g: 14, sodium_mg: 180, protein_g: 30, fat_g: 2.5, saturated_fat_g: 0.8, trans_fat_g: 0, fibre_g: 0.5 },
    front_claims: ["High Protein", "Immunity", "For Adults"]
  },

  // ── COOKING & STAPLES ─────────────────────────────────────────────────────

  {
    product_name: "Tata Salt",
    brand: "Tata",
    category: "FOOD",
    ingredients: ["Iodised Salt (Sodium Chloride)", "Potassium Iodate"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 39000, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Iodised", "Vacuum Evaporated"]
  },
  {
    product_name: "Aashirvaad Whole Wheat Atta",
    brand: "ITC",
    category: "FOOD",
    ingredients: ["Whole Wheat Flour (Atta, 100%)"],
    nutrition: { energy_kcal: 341, sugar_g: 1.5, sodium_mg: 3, protein_g: 12, fat_g: 1.7, saturated_fat_g: 0.3, trans_fat_g: 0, fibre_g: 11 },
    front_claims: ["100% Whole Wheat", "No Maida", "High Fibre"]
  },
  {
    product_name: "Fortune Refined Sunflower Oil",
    brand: "Adani Wilmar",
    category: "FOOD",
    ingredients: ["Refined Sunflower Oil (100%)"],
    nutrition: { energy_kcal: 900, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 100, saturated_fat_g: 11, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["100% Refined Sunflower Oil", "Heart Healthy"]
  },
  {
    product_name: "Saffola Gold Oil",
    brand: "Marico",
    category: "FOOD",
    ingredients: ["Refined Rice Bran Oil (80%)", "Refined Safflower Oil (20%)"],
    nutrition: { energy_kcal: 900, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 100, saturated_fat_g: 18, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Heart Healthy", "LOSORB Technology", "Reduces Absorption"]
  },
  {
    product_name: "MDH Chana Masala",
    brand: "MDH",
    category: "FOOD",
    ingredients: ["Coriander (28%)", "Chilli", "Cumin", "Dry Mango Powder (Amchur)", "Salt", "Pomegranate Powder (Anardana)", "Black Pepper", "Cloves", "Cardamom", "Bay Leaves", "Cassia", "Ginger"],
    nutrition: { energy_kcal: 326, sugar_g: 4.5, sodium_mg: 2100, protein_g: 13, fat_g: 8, saturated_fat_g: 1.5, trans_fat_g: 0, fibre_g: 30 }
  },
  {
    product_name: "Everest Garam Masala",
    brand: "Everest",
    category: "FOOD",
    ingredients: ["Coriander (22%)", "Cumin (14%)", "Chilli (9%)", "Black Pepper (8%)", "Cardamom (7%)", "Cloves (6%)", "Cassia (5%)", "Bay Leaves (4%)", "Dry Ginger (4%)", "Mace", "Nutmeg", "Star Anise"],
    nutrition: { energy_kcal: 350, sugar_g: 3, sodium_mg: 120, protein_g: 12, fat_g: 12, saturated_fat_g: 2, trans_fat_g: 0, fibre_g: 28 }
  },
  {
    product_name: "Everest Kitchen King Masala",
    brand: "Everest",
    category: "FOOD",
    ingredients: ["Coriander", "Cumin", "Chilli", "Turmeric", "Black Pepper", "Salt", "Dry Mango Powder", "Garam Masala Spices"],
    nutrition: { energy_kcal: 331, sugar_g: 4, sodium_mg: 2800, protein_g: 13, fat_g: 9, saturated_fat_g: 1.8, trans_fat_g: 0, fibre_g: 29 }
  },
  {
    product_name: "MDH Rajma Masala",
    brand: "MDH",
    category: "FOOD",
    ingredients: ["Coriander (30%)", "Chilli", "Cumin", "Salt", "Dry Mango Powder", "Cardamom", "Bay Leaves", "Cloves", "Cassia", "Black Pepper"],
    nutrition: { energy_kcal: 320, sugar_g: 4, sodium_mg: 2200, protein_g: 13, fat_g: 8, saturated_fat_g: 1.5, trans_fat_g: 0, fibre_g: 29 }
  },
  {
    product_name: "Maggi Masala Tastemaker",
    brand: "Nestle",
    category: "FOOD",
    ingredients: ["Iodised Salt", "Sugar", "Spices (Coriander, Turmeric, Chilli)", "Onion Powder", "Garlic Powder", "Hydrolysed Groundnut Protein", "Maltodextrin", "Acidity Regulator (INS 330)", "Flavour Enhancer (INS 635)", "Colour (INS 160c)", "Anticaking Agent (INS 551)"],
    nutrition: { energy_kcal: 340, sugar_g: 12, sodium_mg: 18000, protein_g: 8, fat_g: 4, saturated_fat_g: 0.8, trans_fat_g: 0, fibre_g: 4 }
  },

  // ── PERSONAL CARE ─────────────────────────────────────────────────────────

  {
    product_name: "Dove Beauty Cream Bar",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Cocoyl Isethionate", "Stearic Acid", "Sodium Tallowate", "Water", "Sodium Isethionate", "Sodium Stearate", "Cocamidopropyl Betaine", "Fragrance", "Sodium Chloride", "Tetrasodium EDTA", "Titanium Dioxide"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["1/4 Moisturising Cream", "Mild on Skin"]
  },
  {
    product_name: "Lux Soft Glow Soap",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Palmate", "Sodium Palm Kernelate", "Water", "Glycerin", "Parfum (Fragrance)", "Sodium Chloride", "Tetrasodium EDTA", "Titanium Dioxide", "Mica", "Coumarin", "CI 15510"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Glowing Skin", "French Rose Extract"]
  },
  {
    product_name: "Pears Pure & Gentle Soap",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Sorbitol", "Sodium Palmate", "Sodium Palm Kernelate", "Aqua (Water)", "Glycerin", "Sodium Rosinate", "Parfum (Fragrance)", "Propylene Glycol", "Sodium Chloride"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["98% Pure Glycerin", "Dermatologically Tested"]
  },
  {
    product_name: "Lifebuoy Total Soap",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Palmate", "Sodium Palm Kernelate", "Aqua (Water)", "Sodium Tallowate", "Glycerin", "Active Silver Ion (Activ Silver)", "Parfum (Fragrance)", "Titanium Dioxide", "Tetrasodium EDTA"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Germ Protection", "Silver Shield"]
  },
  {
    product_name: "Dettol Original Soap",
    brand: "Reckitt",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Palmate", "Sodium Palm Kernelate", "Water", "Sodium Tallowate", "Glycerin", "Chloroxylenol (PCMX, 0.5%)", "Parfum (Fragrance)", "Tetrasodium EDTA", "Titanium Dioxide"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["10x Better Germ Protection", "Clinically Tested"]
  },
  {
    product_name: "Colgate Strong Teeth Toothpaste",
    brand: "Colgate-Palmolive",
    category: "PERSONAL_CARE",
    ingredients: ["Calcium Carbonate (Abrasive)", "Water", "Sorbitol", "Sodium Lauryl Sulphate (Foaming Agent)", "Cellulose Gum (Binder)", "Sodium Monofluorophosphate (Active Fluoride, 1000 ppm)", "Sodium Saccharin (Sweetener)", "Sodium Benzoate (Preservative)", "Colour (CI 42051)", "Artificial Flavour"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Cavity Protection", "Fluoride", "Aminosenz"]
  },
  {
    product_name: "Colgate MaxFresh Blue Gel",
    brand: "Colgate-Palmolive",
    category: "PERSONAL_CARE",
    ingredients: ["Aqua", "Sorbitol", "Hydrated Silica", "PEG-12", "Sodium Lauryl Sulphate", "Cellulose Gum", "Sodium Monofluorophosphate (1000 ppm F)", "Zinc Citrate", "Menthol", "Eucalyptol", "Sodium Saccharin", "Preservative", "Colour (CI 42051, CI 74160)"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Cooling Crystals", "12 Hour Fresh Breath"]
  },
  {
    product_name: "Pepsodent Germicheck Toothpaste",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Calcium Carbonate", "Water", "Sorbitol", "Sodium Lauryl Sulphate", "Cellulose Gum", "Sodium Monofluorophosphate (1000 ppm)", "Triclosan (0.3%)", "Sodium Benzoate", "Saccharin Sodium", "Titanium Dioxide", "Artificial Flavour"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Germ Attack Protection"]
  },
  {
    product_name: "Himalaya Purifying Neem Face Wash",
    brand: "Himalaya Drug Company",
    category: "PERSONAL_CARE",
    ingredients: ["Aqua", "Neem Leaf Extract (Azadirachta indica, 0.5%)", "Turmeric Extract (Curcuma longa, 0.1%)", "Glycerin", "Cocamidopropyl Betaine", "Sodium Laureth Sulphate", "Citric Acid", "Sodium Benzoate", "Parfum", "Methylisothiazolinone"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Neem + Turmeric", "Controls Pimples", "Oil-Free Skin"]
  },
  {
    product_name: "Dabur Meswak Toothpaste",
    brand: "Dabur",
    category: "PERSONAL_CARE",
    ingredients: ["Calcium Carbonate", "Water", "Glycerin", "Sorbitol", "Sodium Lauryl Sulphate", "Meswak Extract (Salvadora persica, 0.1%)", "Cellulose Gum", "Sodium Fluoride (1000 ppm F)", "Sodium Saccharin", "Sodium Benzoate", "Menthol"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Anti-Bacterial", "Herbal Meswak Extract", "Cavity Protection"]
  },
  {
    product_name: "Pond's Face Wash Bright Beauty",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Aqua", "Glycerin", "Niacinamide (Vitamin B3, 2%)", "Sodium Laureth Sulphate", "Cocamidopropyl Betaine", "Polyethylene (Microbeads)", "Carbomer", "Sodium Hydroxide", "Disodium EDTA", "Methylchloroisothiazolinone", "Fragrance"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Glowing Skin", "Vitamin B3", "Brightening"]
  },
  {
    product_name: "Glow & Lovely Advanced Multivitamin Cream",
    brand: "Hindustan Unilever",
    category: "COSMETIC",
    ingredients: ["Aqua", "Glycerin", "Niacinamide (2%)", "Liquid Paraffin", "Cetyl Alcohol", "Stearyl Alcohol", "Vitamin C (Ascorbyl Glucoside)", "Vitamin E", "Sunscreen (Octinoxate, Titanium Dioxide)", "Phenoxyethanol", "Parfum", "Disodium EDTA", "Sodium Hydroxide"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["SPF 15", "Vitamins", "Brightness in 2 Weeks"]
  },
  {
    product_name: "Garnier Micellar Cleansing Water",
    brand: "Garnier",
    category: "COSMETIC",
    ingredients: ["Aqua", "Hexylene Glycol", "Glycerin", "Poloxamer 184", "Disodium Cocoamphodiacetate", "Disodium EDTA", "Sodium Chloride"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["No Rinse", "Removes Makeup", "Sensitive Skin"]
  },
  {
    product_name: "Lakme Sun Expert SPF 50 PA+++ Sunscreen",
    brand: "Hindustan Unilever",
    category: "COSMETIC",
    ingredients: ["Aqua", "Homosalate (10%)", "Octocrylene (5%)", "Ethylhexyl Salicylate (5%)", "Titanium Dioxide (3%)", "Zinc Oxide (2%)", "Glycerin", "Dimethicone", "Niacinamide", "Phenoxyethanol", "Carbomer", "Parfum"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["SPF 50 PA+++", "UV Protection", "Daily Use"]
  },

  // ── ADDITIONAL COMMON FOODS ───────────────────────────────────────────────

  {
    product_name: "Amul Taaza Toned Milk",
    brand: "Amul",
    category: "FOOD",
    ingredients: ["Toned Milk (Pasteurised, Standardised, Homogenised, Vitamin A & D fortified)"],
    nutrition: { energy_kcal: 58, sugar_g: 4.9, sodium_mg: 50, protein_g: 3.3, fat_g: 3, saturated_fat_g: 1.9, trans_fat_g: 0.1, fibre_g: 0 },
    front_claims: ["Pasteurised", "Homogenised", "Vitamin A & D Fortified"]
  },
  {
    product_name: "Maggi Masala Instant Noodles (Family Pack)",
    brand: "Nestle",
    category: "FOOD",
    ingredients: ["Wheat Flour (Maida)", "Palm Oil", "Salt", "Minerals (Calcium Carbonate)", "Masala Tastemaker (same as standard pack)"],
    nutrition: { energy_kcal: 387, sugar_g: 1.8, sodium_mg: 1030, protein_g: 9, fat_g: 13, saturated_fat_g: 6, trans_fat_g: 0, fibre_g: 1.5 }
  },
  {
    product_name: "Sunfeast Dark Fantasy Choco Fills",
    brand: "ITC",
    category: "FOOD",
    ingredients: ["Wheat Flour", "Edible Vegetable Oil (Palm Oil)", "Sugar", "Chocolate Flavoured Filling (Sugar, Cocoa Powder, Palm Oil, Milk Solids)", "Invert Syrup", "Milk Solids", "Leavening Agents", "Emulsifiers (INS 322, INS 471)", "Salt", "Artificial Flavour (Vanilla)"],
    nutrition: { energy_kcal: 515, sugar_g: 30, sodium_mg: 210, protein_g: 6.5, fat_g: 24, saturated_fat_g: 12, trans_fat_g: 0.2, fibre_g: 1.5 }
  },
  {
    product_name: "Sunfeast Mom's Magic Butter & Cashew Cookies",
    brand: "ITC",
    category: "FOOD",
    ingredients: ["Wheat Flour", "Sugar", "Edible Vegetable Oil (Palm Oil)", "Cashew (4%)", "Butter (3%)", "Invert Syrup", "Milk Solids", "Salt", "Leavening Agents", "Emulsifiers", "Artificial Flavour"],
    nutrition: { energy_kcal: 509, sugar_g: 22, sodium_mg: 270, protein_g: 7, fat_g: 23, saturated_fat_g: 11, trans_fat_g: 0, fibre_g: 1.2 }
  },
  {
    product_name: "Haldiram's Bhujia Sev",
    brand: "Haldiram's",
    category: "FOOD",
    ingredients: ["Gram Flour (Besan)", "Edible Vegetable Oil (Palm Oil)", "Iodised Salt", "Black Pepper", "Red Chilli", "Carom Seeds (Ajwain)", "Asafoetida (Hing)"],
    nutrition: { energy_kcal: 550, sugar_g: 1.5, sodium_mg: 730, protein_g: 16, fat_g: 34, saturated_fat_g: 14, trans_fat_g: 0, fibre_g: 6 }
  },
  {
    product_name: "Bikaji Navratan Mixture",
    brand: "Bikaji",
    category: "FOOD",
    ingredients: ["Gram Flour (Besan)", "Potato Flakes", "Peanuts", "Edible Vegetable Oil (Palm Oil)", "Rice Flour", "Raisins", "Cashew", "Sesame Seeds", "Iodised Salt", "Spices", "Sugar", "Citric Acid"],
    nutrition: { energy_kcal: 530, sugar_g: 4, sodium_mg: 640, protein_g: 12, fat_g: 30, saturated_fat_g: 12, trans_fat_g: 0, fibre_g: 5.5 }
  },
  {
    product_name: "Patanjali Dant Kanti Toothpaste",
    brand: "Patanjali",
    category: "PERSONAL_CARE",
    ingredients: ["Calcium Carbonate", "Aqua", "Sorbitol", "Sodium Lauryl Sulphate", "Bakul (Mimusops elengi)", "Tomar (Zanthoxylum armatum)", "Vajradanti (Barleria prionitis)", "Peppermint", "Sodium Fluoride (1000 ppm F)", "Cellulose Gum", "Saccharin Sodium"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Ayurvedic Herbs", "Natural Ingredients"]
  },
  {
    product_name: "Head & Shoulders Anti-Dandruff Shampoo",
    brand: "Procter & Gamble",
    category: "PERSONAL_CARE",
    ingredients: ["Aqua", "Sodium Laureth Sulphate (SLES)", "Sodium Lauryl Sulphate", "Zinc Pyrithione (Active 1%)", "Dimethicone", "Glycol Distearate", "Sodium Xylenesulphonate", "Cetyl Alcohol", "Sodium Chloride", "Fragrance", "Methylchloroisothiazolinone", "Methylisothiazolinone", "Disodium EDTA", "CI 17200"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Anti-Dandruff", "Zinc Active Formula"]
  },
  {
    product_name: "Pantene Pro-V Silky Smooth Shampoo",
    brand: "Procter & Gamble",
    category: "PERSONAL_CARE",
    ingredients: ["Aqua", "Sodium Laureth Sulphate", "Sodium Lauryl Sulphate", "Dimethicone", "Sodium Citrate", "Cetyl Alcohol", "Guar Hydroxypropyltrimonium Chloride", "Sodium Chloride", "Fragrance", "Citric Acid", "Sodium Benzoate", "Methylchloroisothiazolinone"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Pro-Vitamin Formula", "Silky Smooth"]
  },
  {
    product_name: "Clinic Plus Shampoo",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Aqua", "Sodium Laureth Sulphate", "Cocamide DEA", "Sodium Chloride", "Dimethiconol", "Zinc Carbonate", "Guar Hydroxypropyltrimonium Chloride", "Parfum", "Sodium Benzoate", "Citric Acid", "Polyquaternium-10", "Methylchloroisothiazolinone"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Milk Protein", "Strong & Long Hair"]
  },
  {
    product_name: "Dove Intense Repair Shampoo",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Aqua", "Sodium Laureth Sulphate", "Sodium Lauryl Sulphate", "Dimethicone", "Cetearyl Alcohol", "Behentrimonium Chloride", "Hydrolysed Keratin", "Sodium Chloride", "Citric Acid", "Parfum", "Benzyl Alcohol", "Methylchloroisothiazolinone"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Keratin Actives", "Fibre Actives", "Damage Repair"]
  },

  // ── PERSONAL CARE — DAY 1 GEMINI ADDITIONS ───────────────────────────────────

  {
    product_name: "Dove Creamy Bathing Beauty Bar",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Cocoyl Isethionate", "Stearic Acid", "Lauric Acid", "Sodium Palmitate", "Water", "Sodium Isethionate", "Sodium Stearate", "Cocamidopropyl Betaine", "Sodium Palm Kernelate", "Glycerin", "Perfume", "Sodium Chloride", "Zinc Oxide", "Tetrasodium EDTA", "Tetrasodium Etidronate", "Alpha-Isomethyl Ionone", "Citronellol", "Coumarin", "Hexyl Cinnamal", "Limonene", "Linalool", "CI 77891"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["1/4 Moisturising Cream", "Soft & Smooth Skin"]
  },

  {
    product_name: "Himalaya Herbals Anti-Dandruff Shampoo",
    brand: "Himalaya Drug Company",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Sodium Laureth Sulfate", "Cocamidopropyl Betaine", "Dimethiconol", "TEA-Dodecylbenzenesulfonate", "Trideceth-10", "Glycol Distearate", "Perfume", "Glycerin", "Sodium Chloride", "Sodium Benzoate", "Carbomer", "Guar Hydroxypropyltrimonium Chloride", "Salicylic Acid", "Melaleuca Alternifolia (Tea Tree) Leaf Oil", "Aloe Barbadensis Leaf Juice", "Rosmarinus Officinalis (Rosemary) Leaf Oil", "Sodium Hydroxide", "Disodium EDTA"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Tea Tree Oil", "Salicylic Acid", "Anti-Dandruff", "Herbal"]
  },

  {
    product_name: "Mamaearth Onion Shampoo with Plant Keratin",
    brand: "Mamaearth",
    category: "PERSONAL_CARE",
    ingredients: ["Aqua", "Cocamidopropyl Betaine", "Caprylyl/Capryl Glucoside", "Sodium Methyl Cocoyl Taurate", "Sodium Lauroyl Sarcosinate", "Polyquaternium-7", "Sodium Cocoamphoacetate", "Panthenol", "Allium Cepa (Onion) Bulb Extract", "Plant Keratin", "Glyceryl Oleate", "Coco-Glucoside", "D-Panthenol", "Sodium PCA", "Trigonella Foenum-Graecum (Fenugreek) Seed Extract", "Glycerin", "Potassium Sorbate", "Sodium Benzoate", "IFRA Certified Allergen Free Fragrance"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["No Sulphate", "No Paraben", "No SLS", "Onion Extract", "Hair Fall Control"]
  },

  {
    product_name: "TRESemmé Keratin Smooth Conditioner",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Cetearyl Alcohol", "Dimethicone", "Stearamidopropyl Dimethylamine", "Behentrimonium Chloride", "Perfume", "Dipropylene Glycol", "Lactic Acid", "Sodium Chloride", "Amodimethicone", "Disodium EDTA", "Cetrimonium Chloride", "PEG-7 Propylheptyl Ether", "Phenoxyethanol", "Magnesium Nitrate", "Hydrolyzed Keratin", "Argania Spinosa (Argan) Kernel Oil", "Methylchloroisothiazolinone", "Methylisothiazolinone", "Alpha-Isomethyl Ionone", "Benzyl Alcohol", "Benzyl Salicylate", "Citronellol", "Geraniol", "Hexyl Cinnamal", "Linalool"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Keratin Smooth", "Argan Oil", "Anti-Frizz", "Salon Smooth Hair"]
  },

  // ── COOKING OIL & MORE ────────────────────────────────────────────────────

  {
    product_name: "Dabur Honey",
    brand: "Dabur",
    category: "FOOD",
    ingredients: ["Pure Honey (100%)"],
    nutrition: { energy_kcal: 304, sugar_g: 79, sodium_mg: 4, protein_g: 0.3, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0.2 },
    front_claims: ["100% Pure", "NMR Tested", "Immunity"]
  },
  {
    product_name: "Tata Tea Premium",
    brand: "Tata Consumer Products",
    category: "FOOD",
    ingredients: ["Black Tea (100%)"],
    nutrition: { energy_kcal: 1, sugar_g: 0, sodium_mg: 0, protein_g: 0.1, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Strong Flavour", "Freshness Locked"]
  },
  {
    product_name: "Red Label Natural Care Tea",
    brand: "Brooke Bond",
    category: "FOOD",
    ingredients: ["Black Tea (94%)", "Cardamom", "Tulsi (Holy Basil)", "Ginger", "Liquorice (Mulethi)"],
    nutrition: { energy_kcal: 1, sugar_g: 0, sodium_mg: 0, protein_g: 0.1, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0.5 },
    front_claims: ["5 Natural Ingredients", "Immunity", "Ayurvedic Herbs"]
  },
  {
    product_name: "Nescafe Classic Instant Coffee",
    brand: "Nestle",
    category: "FOOD",
    ingredients: ["100% Pure Instant Coffee"],
    nutrition: { energy_kcal: 2, sugar_g: 0, sodium_mg: 3, protein_g: 0.1, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["100% Pure Coffee", "Freshly Sealed"]
  },
  {
    product_name: "Sunfeast Farmlite Oat & Raisin Cookies",
    brand: "ITC",
    category: "FOOD",
    ingredients: ["Oatmeal (28%)", "Wheat Flour", "Sugar", "Raisins (8%)", "Edible Vegetable Oil (Palm Oil)", "Invert Syrup", "Salt", "Leavening Agents", "Emulsifiers", "Cinnamon"],
    nutrition: { energy_kcal: 472, sugar_g: 24, sodium_mg: 245, protein_g: 7.5, fat_g: 18, saturated_fat_g: 8.5, trans_fat_g: 0, fibre_g: 3.5 },
    front_claims: ["Oats & Raisins", "No Maida"]
  },
  {
    product_name: "Kurkure Triangle Chilli Chatka",
    brand: "PepsiCo",
    category: "FOOD",
    ingredients: ["Rice Meal", "Corn Meal", "Edible Vegetable Oil (Palm Oil)", "Spice Mix (Iodised Salt, Sugar, Spices, Acidity Regulator (INS 330), Flavour Enhancer (INS 627, INS 631), Colour (INS 110, INS 160c), Anticaking Agent (INS 551))"],
    nutrition: { energy_kcal: 522, sugar_g: 3.5, sodium_mg: 830, protein_g: 5, fat_g: 28, saturated_fat_g: 12, trans_fat_g: 0, fibre_g: 2 }
  },
  {
    product_name: "Act II Butter Popcorn",
    brand: "DS Group",
    category: "FOOD",
    ingredients: ["Corn (Maize)", "Edible Vegetable Oil (Palm Oil)", "Butter (1.5%)", "Iodised Salt", "Artificial Butter Flavour", "Colour (INS 160a)"],
    nutrition: { energy_kcal: 488, sugar_g: 1.5, sodium_mg: 540, protein_g: 9, fat_g: 20, saturated_fat_g: 10, trans_fat_g: 0, fibre_g: 11 }
  },
  {
    product_name: "Himalaya Face Moisturizing Lotion SPF 15",
    brand: "Himalaya Drug Company",
    category: "COSMETIC",
    ingredients: ["Aqua", "Glycerin", "Niacinamide (2%)", "Octinoxate (7.5%)", "Titanium Dioxide (1%)", "Aloe Vera Gel", "Wheat Germ Oil", "Cetostearyl Alcohol", "Phenoxyethanol", "Parfum", "Carbomer", "Disodium EDTA"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["SPF 15", "Aloe Vera", "Non-Greasy"]
  },
  {
    product_name: "Vaseline Intensive Care Body Lotion",
    brand: "Hindustan Unilever",
    category: "COSMETIC",
    ingredients: ["Aqua", "Glycerin (21%)", "Petrolatum (Petroleum Jelly)", "Dimethicone", "Stearic Acid", "Cetyl Alcohol", "Glycol Stearate", "Triethanolamine", "Carbomer", "Disodium EDTA", "Parfum", "Methylparaben", "Propylparaben"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Deep Moisture Serum", "21x Glycerin", "Intensive Care"]
  },

  // ── SNACKS — CHIPS & EXTRUDED ─────────────────────────────────────────────────

  {
    product_name: "Doritos Nacho Cheese",
    brand: "PepsiCo",
    category: "FOOD",
    ingredients: ["Corn Flour", "Edible Vegetable Oil (Palm Oil)", "Spices & Condiments (Cheese Powder, Salt, Sugar, Maltodextrin, Acidity Regulators (INS 330, INS 262), Flavour Enhancers (INS 627, INS 631), Artificial Flavour (Cheese Flavour))"],
    nutrition: { energy_kcal: 524, sugar_g: 3.5, sodium_mg: 680, protein_g: 6.5, fat_g: 28, saturated_fat_g: 12, trans_fat_g: 0, fibre_g: 3.2 },
    front_claims: ["Nacho Cheese Flavour"]
  },

  {
    product_name: "Bingo Tedhe Medhe Achari Masti",
    brand: "ITC",
    category: "FOOD",
    ingredients: ["Rice Meal", "Edible Vegetable Oil (Palm Oil)", "Corn Meal", "Wheat Flour", "Iodised Salt", "Spices (Red Chilli, Coriander)", "Acidity Regulators (INS 330, INS 296)", "Sugar", "Flavour Enhancers (INS 621, INS 635)", "Artificial Flavour"],
    nutrition: { energy_kcal: 518, sugar_g: 2.8, sodium_mg: 740, protein_g: 5.2, fat_g: 27, saturated_fat_g: 12.5, trans_fat_g: 0, fibre_g: 2.1 },
    front_claims: ["Tedhe Medhe Shape", "Achari Masti Flavour"]
  },

  {
    product_name: "Bingo Original Style Salted",
    brand: "ITC",
    category: "FOOD",
    ingredients: ["Potatoes", "Edible Vegetable Oil (Palm Oil)", "Iodised Salt"],
    nutrition: { energy_kcal: 536, sugar_g: 0.5, sodium_mg: 480, protein_g: 6.5, fat_g: 34, saturated_fat_g: 15, trans_fat_g: 0, fibre_g: 4.5 },
    front_claims: ["Real Potato Chips", "Simple Ingredients"]
  },

  {
    product_name: "Too Yumm! Multigrain Baked Chips",
    brand: "RP-SG Group",
    category: "FOOD",
    ingredients: ["Multigrain Flour (Rice Flour, Wheat Flour, Corn Flour, Oat Flour)", "Edible Vegetable Oil (Sunflower Oil)", "Iodised Salt", "Spices (Red Chilli, Black Pepper)", "Sugar", "Acidity Regulator (INS 330)"],
    nutrition: { energy_kcal: 421, sugar_g: 2.2, sodium_mg: 520, protein_g: 7.8, fat_g: 14, saturated_fat_g: 2.1, trans_fat_g: 0, fibre_g: 5.5 },
    front_claims: ["Baked Not Fried", "Multigrain", "70% Less Fat"]
  },

  {
    product_name: "Too Yumm! Veggie Sticks",
    brand: "RP-SG Group",
    category: "FOOD",
    ingredients: ["Potato Starch", "Corn Flour", "Edible Vegetable Oil (Sunflower Oil)", "Spinach Powder", "Carrot Powder", "Tomato Powder", "Iodised Salt", "Spices", "Acidity Regulator (INS 330)"],
    nutrition: { energy_kcal: 398, sugar_g: 1.8, sodium_mg: 490, protein_g: 4.5, fat_g: 12, saturated_fat_g: 1.8, trans_fat_g: 0, fibre_g: 4.8 },
    front_claims: ["Baked", "With Real Vegetables", "No MSG"]
  },

  {
    product_name: "Yellow Diamond Chips Chatpata",
    brand: "Vimal Agro",
    category: "FOOD",
    ingredients: ["Potatoes", "Edible Vegetable Oil (Palm Oil)", "Spices (Red Chilli, Coriander, Turmeric)", "Iodised Salt", "Sugar", "Dried Mango Powder (Amchur)", "Acidity Regulator (INS 330)", "Flavour Enhancer (INS 621)"],
    nutrition: { energy_kcal: 528, sugar_g: 3.2, sodium_mg: 560, protein_g: 6.2, fat_g: 32, saturated_fat_g: 14, trans_fat_g: 0, fibre_g: 4.2 },
    front_claims: ["Chatpata Flavour", "Real Potato"]
  },

  {
    product_name: "Pringles Original",
    brand: "Kellanova",
    category: "FOOD",
    ingredients: ["Dehydrated Potatoes", "Vegetable Oil (Palm Oil, Sunflower Oil)", "Wheat Starch", "Corn Flour", "Rice Flour", "Maltodextrin", "Emulsifier (INS 471)", "Salt", "Dextrose"],
    nutrition: { energy_kcal: 532, sugar_g: 1.5, sodium_mg: 430, protein_g: 5.0, fat_g: 33, saturated_fat_g: 12, trans_fat_g: 0, fibre_g: 3.5 },
    front_claims: ["Original Salted", "The Original & Best"]
  },

  {
    product_name: "Pringles Sour Cream & Onion",
    brand: "Kellanova",
    category: "FOOD",
    ingredients: ["Dehydrated Potatoes", "Vegetable Oil (Palm Oil, Sunflower Oil)", "Wheat Starch", "Corn Flour", "Rice Flour", "Maltodextrin", "Seasoning (Whey Powder, Onion Powder, Yeast Extract, Sour Cream Powder, Flavour Enhancer (INS 635), Natural Flavour)", "Salt", "Emulsifier (INS 471)"],
    nutrition: { energy_kcal: 535, sugar_g: 2.8, sodium_mg: 520, protein_g: 5.2, fat_g: 33, saturated_fat_g: 12, trans_fat_g: 0, fibre_g: 3.2 },
    front_claims: ["Sour Cream & Onion Flavour"]
  },

  {
    product_name: "Kurkure Naughty Tomatoes",
    brand: "PepsiCo",
    category: "FOOD",
    ingredients: ["Rice Meal", "Corn Meal", "Edible Vegetable Oil (Palm Oil)", "Gram Meal", "Iodised Salt", "Spices (Red Chilli, Coriander, Turmeric)", "Tomato Powder", "Sugar", "Acidity Regulator (INS 330)", "Flavour Enhancers (INS 621, INS 635)", "Colour (INS 160c, INS 150d)", "Artificial Flavour (Tomato)"],
    nutrition: { energy_kcal: 522, sugar_g: 4.8, sodium_mg: 720, protein_g: 6.8, fat_g: 28, saturated_fat_g: 12.5, trans_fat_g: 0, fibre_g: 3.8 },
    front_claims: ["Naughty Tomatoes Flavour"]
  },

  {
    product_name: "Cornitos Nacho Crisps Cheese & Herbs",
    brand: "Greendot Health Foods",
    category: "FOOD",
    ingredients: ["Corn Flour", "Edible Vegetable Oil (Sunflower Oil)", "Rice Flour", "Cheese Powder", "Herbs (Oregano, Basil)", "Salt", "Acidity Regulator (INS 330)", "Natural Flavour"],
    nutrition: { energy_kcal: 488, sugar_g: 1.5, sodium_mg: 580, protein_g: 7.5, fat_g: 23, saturated_fat_g: 4.2, trans_fat_g: 0, fibre_g: 4.0 },
    front_claims: ["Baked Not Fried", "No Artificial Colours", "No MSG", "Sunflower Oil"]
  },

  {
    product_name: "Lay's Cream & Onion",
    brand: "PepsiCo",
    category: "FOOD",
    ingredients: ["Potatoes", "Edible Vegetable Oil (Sunflower Oil)", "Seasoning (Whey Powder, Onion Powder, Sugar, Salt, Yeast Extract, Acidity Regulator (INS 330), Natural Flavour (Cream, Onion), Anticaking Agent (INS 551))"],
    nutrition: { energy_kcal: 536, sugar_g: 2.8, sodium_mg: 540, protein_g: 6.5, fat_g: 34, saturated_fat_g: 8.5, trans_fat_g: 0, fibre_g: 4.2 },
    front_claims: ["Real Potatoes", "Sunflower Oil"]
  },

  // ── SNACKS — NAMKEEN & TRADITIONAL ───────────────────────────────────────────

  {
    product_name: "Bikaji Bikaneri Bhujia",
    brand: "Bikaji Foods",
    category: "FOOD",
    ingredients: ["Moth Bean Flour (Moth Dal)", "Besan (Chickpea Flour)", "Edible Vegetable Oil (Palm Oil)", "Iodised Salt", "Black Pepper", "Red Chilli", "Asafoetida (Hing)"],
    nutrition: { energy_kcal: 542, sugar_g: 1.2, sodium_mg: 610, protein_g: 19, fat_g: 30, saturated_fat_g: 13, trans_fat_g: 0, fibre_g: 8.5 },
    front_claims: ["Original Bikaneri", "Pure Ghee Taste"]
  },

  {
    product_name: "Haldiram's Khatta Meetha",
    brand: "Haldiram's",
    category: "FOOD",
    ingredients: ["Edible Vegetable Oil (Palm Oil)", "Corn Flakes", "Besan (Chickpea Flour)", "Peanuts", "Wheat Flour", "Sugar", "Salt", "Spices (Red Chilli, Coriander, Turmeric)", "Acidity Regulator (INS 330)", "Raisins"],
    nutrition: { energy_kcal: 522, sugar_g: 12.5, sodium_mg: 440, protein_g: 12, fat_g: 28, saturated_fat_g: 12, trans_fat_g: 0, fibre_g: 5.8 },
    front_claims: ["Sweet & Tangy Mix"]
  },

  {
    product_name: "Haldiram's Punjabi Tadka",
    brand: "Haldiram's",
    category: "FOOD",
    ingredients: ["Besan (Chickpea Flour)", "Edible Vegetable Oil (Palm Oil)", "Puffed Rice", "Peanuts", "Corn Flakes", "Iodised Salt", "Spices (Red Chilli, Cumin, Coriander, Turmeric)", "Dried Mango Powder", "Sugar"],
    nutrition: { energy_kcal: 518, sugar_g: 3.5, sodium_mg: 520, protein_g: 14, fat_g: 28, saturated_fat_g: 11.5, trans_fat_g: 0, fibre_g: 6.5 },
    front_claims: ["Punjabi Style", "Crunchy Mix"]
  },

  {
    product_name: "Bikano Khatta Meetha",
    brand: "Bikano",
    category: "FOOD",
    ingredients: ["Edible Vegetable Oil (Palm Oil)", "Sev (Besan, Salt)", "Corn Flakes", "Puffed Rice", "Peanuts", "Sugar", "Salt", "Spices (Red Chilli, Coriander)", "Acidity Regulator (INS 330)", "Raisins", "Sesame Seeds"],
    nutrition: { energy_kcal: 510, sugar_g: 14, sodium_mg: 420, protein_g: 11, fat_g: 26, saturated_fat_g: 11, trans_fat_g: 0, fibre_g: 5.2 },
    front_claims: ["Sweet & Sour Mix", "Traditional Taste"]
  },

  // ── SNACKS — POPCORN ──────────────────────────────────────────────────────────

  {
    product_name: "Act II Cheese Burst Popcorn",
    brand: "DS Group",
    category: "FOOD",
    ingredients: ["Corn", "Edible Vegetable Oil (Palm Oil)", "Seasoning (Cheese Powder, Maltodextrin, Salt, Sugar, Acidity Regulator (INS 330), Flavour Enhancer (INS 635), Artificial Flavour (Cheese), Colour (INS 160c))"],
    nutrition: { energy_kcal: 465, sugar_g: 3.8, sodium_mg: 640, protein_g: 8.5, fat_g: 22, saturated_fat_g: 9.5, trans_fat_g: 0, fibre_g: 9.2 },
    front_claims: ["Cheese Burst Flavour", "Real Popcorn"]
  },

  // ── SNACKS — HEALTHY / PROTEIN BARS ──────────────────────────────────────────

  {
    product_name: "Yoga Bar Millet & Nut Bar Choco Almond",
    brand: "ITC (Yoga Bar)",
    category: "FOOD",
    ingredients: ["Date Paste", "Almonds", "Rolled Oats", "Millet Flakes (Finger Millet, Pearl Millet)", "Dark Chocolate Chips (Cocoa Mass, Sugar, Cocoa Butter, Emulsifier (INS 322))", "Cocoa Powder", "Honey", "Natural Flavour (Almond)"],
    nutrition: { energy_kcal: 398, sugar_g: 22, sodium_mg: 42, protein_g: 9.5, fat_g: 14, saturated_fat_g: 4.5, trans_fat_g: 0, fibre_g: 6.5 },
    front_claims: ["No Refined Sugar", "High Protein", "No Preservatives", "Millets"]
  },

  {
    product_name: "RiteBite Max Protein Bar Choco Berry",
    brand: "NutroActive",
    category: "FOOD",
    ingredients: ["Whey Protein Concentrate", "Soy Crisps (Soy Protein Isolate, Tapioca Starch)", "Dark Chocolate Compound (Sugar, Cocoa Butter, Cocoa Powder, Emulsifier (INS 476))", "Sugar", "Glycerine", "Glucose Syrup", "Strawberry Flavour (Artificial)", "Salt", "Acidity Regulator (INS 330)"],
    nutrition: { energy_kcal: 362, sugar_g: 18, sodium_mg: 185, protein_g: 27, fat_g: 9, saturated_fat_g: 4.2, trans_fat_g: 0, fibre_g: 3.5 },
    front_claims: ["27g Protein", "High Protein Bar", "Low Fat"]
  },

  {
    product_name: "Unibic Oatmeal Cookies",
    brand: "Unibic Foods",
    category: "FOOD",
    ingredients: ["Whole Wheat Flour", "Rolled Oats (18%)", "Sugar", "Edible Vegetable Oil (Palm Oil)", "Invert Syrup", "Skimmed Milk Powder", "Raisins", "Leavening Agents (INS 500, INS 503)", "Iodised Salt", "Natural Flavour"],
    nutrition: { energy_kcal: 462, sugar_g: 21, sodium_mg: 280, protein_g: 7.5, fat_g: 18, saturated_fat_g: 8.5, trans_fat_g: 0, fibre_g: 4.8 },
    front_claims: ["Whole Wheat", "Oatmeal", "Real Raisins"]
  },

  {
    product_name: "Britannia NutriChoice Digestive Biscuits",
    brand: "Britannia",
    category: "FOOD",
    ingredients: ["Whole Wheat Flour (50%)", "Sugar", "Edible Vegetable Oil (Palm Oil)", "Wheat Bran", "Skimmed Milk Powder", "Invert Syrup", "Iodised Salt", "Raising Agents (INS 500, INS 450)", "Emulsifier (INS 322)"],
    nutrition: { energy_kcal: 458, sugar_g: 18, sodium_mg: 310, protein_g: 8.5, fat_g: 19, saturated_fat_g: 9, trans_fat_g: 0, fibre_g: 5.5 },
    front_claims: ["50% Whole Wheat", "Source of Fibre", "No Maida"]
  },

  {
    product_name: "Parle Musst Stix Masala",
    brand: "Parle",
    category: "FOOD",
    ingredients: ["Wheat Flour (Maida)", "Edible Vegetable Oil (Palm Oil)", "Iodised Salt", "Spices (Red Chilli, Coriander, Cumin, Turmeric)", "Sugar", "Acidity Regulator (INS 330)", "Flavour Enhancer (INS 621)", "Artificial Flavour (Masala)"],
    nutrition: { energy_kcal: 508, sugar_g: 3.5, sodium_mg: 680, protein_g: 6.5, fat_g: 24, saturated_fat_g: 10.5, trans_fat_g: 0, fibre_g: 2.2 },
    front_claims: ["Masala Stix", "Crunchy Snack"]
  },

  {
    product_name: "Haldiram's Chatpata Murmura",
    brand: "Haldiram's",
    category: "FOOD",
    ingredients: ["Puffed Rice (Murmura)", "Edible Vegetable Oil (Sunflower Oil)", "Iodised Salt", "Spices (Red Chilli, Turmeric, Coriander)", "Dried Mango Powder (Amchur)", "Sugar", "Roasted Peanuts"],
    nutrition: { energy_kcal: 385, sugar_g: 4.5, sodium_mg: 420, protein_g: 8.5, fat_g: 11, saturated_fat_g: 2.5, trans_fat_g: 0, fibre_g: 2.8 },
    front_claims: ["Light Snack", "Sunflower Oil"]
  },

  // ── SNACKS — DAY 1 CHATGPT ADDITIONS ─────────────────────────────────────────

  {
    product_name: "Bikaji Aloo Bhujia",
    brand: "Bikaji Foods",
    category: "FOOD",
    ingredients: ["Potato (30%)", "Besan (Chickpea Flour)", "Edible Vegetable Oil (Palm Oil)", "Iodised Salt", "Spices (Red Chilli, Black Pepper, Coriander)", "Dried Mango Powder (Amchur)", "Asafoetida (Hing)"],
    nutrition: { energy_kcal: 534, sugar_g: 1.5, sodium_mg: 640, protein_g: 12, fat_g: 31, saturated_fat_g: 14, trans_fat_g: 0, fibre_g: 5.8 },
    front_claims: ["Crispy Aloo Bhujia", "Traditional Recipe"]
  },

  {
    product_name: "Cornitos Nacho Crisps Chilli Lime",
    brand: "Greendot Health Foods",
    category: "FOOD",
    ingredients: ["Corn Flour", "Edible Vegetable Oil (Sunflower Oil)", "Rice Flour", "Iodised Salt", "Spices (Red Chilli)", "Acidity Regulator (INS 330)", "Citric Acid", "Natural Lime Flavour"],
    nutrition: { energy_kcal: 484, sugar_g: 0.8, sodium_mg: 560, protein_g: 7.2, fat_g: 22, saturated_fat_g: 3.8, trans_fat_g: 0, fibre_g: 4.2 },
    front_claims: ["Baked Not Fried", "No Artificial Colours", "No MSG", "Sunflower Oil"]
  },

  {
    product_name: "DFM Crax Corn Rings Masala",
    brand: "DFM Foods",
    category: "FOOD",
    ingredients: ["Corn Meal", "Edible Vegetable Oil (Palm Oil)", "Iodised Salt", "Sugar", "Spices (Red Chilli, Coriander, Turmeric)", "Acidity Regulator (INS 330)", "Flavour Enhancer (INS 627, INS 631)", "Colour (INS 110)", "Anticaking Agent (INS 551)"],
    nutrition: { energy_kcal: 545, sugar_g: 5, sodium_mg: 760, protein_g: 5.5, fat_g: 32, saturated_fat_g: 15, trans_fat_g: 0, fibre_g: 2.0 },
    front_claims: ["Crunchy Corn Rings"]
  },

  {
    product_name: "Balaji Wafers Classic Salted",
    brand: "Balaji Wafers",
    category: "FOOD",
    ingredients: ["Potatoes", "Edible Vegetable Oil (Palm Oil)", "Iodised Salt"],
    nutrition: { energy_kcal: 538, sugar_g: 0.3, sodium_mg: 590, protein_g: 6.2, fat_g: 35, saturated_fat_g: 15.5, trans_fat_g: 0, fibre_g: 4.5 },
    front_claims: ["Real Potatoes", "Crispy & Crunchy"]
  },

  {
    product_name: "Prataap Snacks Yellow Diamond Namkeen Mix",
    brand: "Prataap Snacks",
    category: "FOOD",
    ingredients: ["Edible Vegetable Oil (Palm Oil)", "Besan (Chickpea Flour)", "Corn Flakes", "Puffed Rice", "Peanuts", "Iodised Salt", "Spices (Red Chilli, Coriander, Turmeric)", "Dried Mango Powder", "Sugar", "Citric Acid"],
    nutrition: { energy_kcal: 512, sugar_g: 4.5, sodium_mg: 510, protein_g: 13, fat_g: 27, saturated_fat_g: 11.5, trans_fat_g: 0, fibre_g: 5.5 },
    front_claims: ["Crunchy Namkeen Mix"]
  },

  {
    product_name: "Tata Soulfull Ragi Bites Chocolate",
    brand: "Tata Consumer Products",
    category: "FOOD",
    ingredients: ["Ragi Flour (Finger Millet) (40%)", "Wheat Flour", "Sugar", "Edible Vegetable Oil (Sunflower Oil)", "Cocoa Powder (3%)", "Skimmed Milk Powder", "Iodised Salt", "Leavening Agents (INS 500, INS 503)", "Emulsifier (INS 322)", "Natural Cocoa Flavour"],
    nutrition: { energy_kcal: 472, sugar_g: 20, sodium_mg: 310, protein_g: 8.5, fat_g: 16, saturated_fat_g: 4.5, trans_fat_g: 0, fibre_g: 4.8 },
    front_claims: ["40% Ragi", "No Maida", "Source of Calcium", "Whole Grain"]
  },

  {
    product_name: "Yoga Bar Oats & Almonds Breakfast Bar",
    brand: "ITC (Yoga Bar)",
    category: "FOOD",
    ingredients: ["Rolled Oats (30%)", "Date Paste", "Almonds (12%)", "Honey", "Whey Protein Concentrate", "Sunflower Seeds", "Pumpkin Seeds", "Rice Crisps", "Natural Vanilla Flavour", "Salt"],
    nutrition: { energy_kcal: 388, sugar_g: 18, sodium_mg: 55, protein_g: 11, fat_g: 13, saturated_fat_g: 2.8, trans_fat_g: 0, fibre_g: 5.5 },
    front_claims: ["No Refined Sugar", "10g Protein", "Whole Grain Oats", "Real Almonds"]
  },

  {
    product_name: "RiteBite Max Protein Active Bar Cookies & Cream",
    brand: "NutroActive",
    category: "FOOD",
    ingredients: ["Whey Protein Concentrate", "Soy Protein Isolate", "Dark Chocolate Compound (Sugar, Cocoa Mass, Cocoa Butter, Emulsifier (INS 476))", "Sugar", "Skimmed Milk Powder", "Glycerine", "Oat Flour", "Cocoa Powder", "Glucose Syrup", "Salt", "Acidity Regulator (INS 330)", "Artificial Flavour (Vanilla)"],
    nutrition: { energy_kcal: 348, sugar_g: 15, sodium_mg: 200, protein_g: 30, fat_g: 8, saturated_fat_g: 3.5, trans_fat_g: 0, fibre_g: 4.0 },
    front_claims: ["30g Protein", "High Protein", "Low Fat", "Post Workout"]
  },

  {
    product_name: "Act II Classic Salted Popcorn",
    brand: "DS Group",
    category: "FOOD",
    ingredients: ["Corn", "Edible Vegetable Oil (Palm Oil)", "Iodised Salt"],
    nutrition: { energy_kcal: 452, sugar_g: 0.5, sodium_mg: 480, protein_g: 9, fat_g: 20, saturated_fat_g: 9, trans_fat_g: 0, fibre_g: 10.5 },
    front_claims: ["Classic Salted", "Real Popcorn", "No Artificial Colours"]
  },

  {
    product_name: "Roasted Foxnuts (Makhana) Himalayan Salt",
    brand: "Farmley",
    category: "FOOD",
    ingredients: ["Fox Nuts (Makhana) (95%)", "Himalayan Pink Salt", "Edible Vegetable Oil (Sunflower Oil)"],
    nutrition: { energy_kcal: 347, sugar_g: 0, sodium_mg: 180, protein_g: 9.7, fat_g: 0.5, saturated_fat_g: 0.1, trans_fat_g: 0, fibre_g: 14.5 },
    front_claims: ["High Protein", "Low Fat", "Gluten Free", "No Artificial Flavour"]
  },

  {
    product_name: "Haldiram's Chivda",
    brand: "Haldiram's",
    category: "FOOD",
    ingredients: ["Flattened Rice (Poha)", "Edible Vegetable Oil (Palm Oil)", "Cashew Nuts", "Raisins", "Peanuts", "Coconut (Dry)", "Sugar", "Iodised Salt", "Spices (Turmeric, Red Chilli, Mustard Seeds, Curry Leaves)", "Citric Acid"],
    nutrition: { energy_kcal: 497, sugar_g: 8, sodium_mg: 390, protein_g: 10, fat_g: 24, saturated_fat_g: 10, trans_fat_g: 0, fibre_g: 3.5 },
    front_claims: ["Traditional Chivda", "Premium Dry Fruits"]
  },

  // ── PERSONAL CARE — DAY 1 GEMINI REVISED (SHAMPOOS) ─────────────────────────

  {
    product_name: "Dove Hair Fall Rescue Shampoo",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Sodium Laureth Sulfate", "Sodium Chloride", "Cocamidopropyl Betaine", "Dimethiconol", "Perfume", "Glycerin", "Sodium Benzoate", "Glycol Distearate", "Carbomer", "TEA-Dodecylbenzenesulfonate", "Guar Hydroxypropyltrimonium Chloride", "TEA-Sulfate", "Mica", "Disodium EDTA", "PEG-45M", "Cyclotetrasiloxane", "Phenoxyethanol", "Lysine HCl", "Zinc Gluconate", "Iodopropynyl Butylcarbamate", "Methylchloroisothiazolinone", "Methylisothiazolinone", "Linalool", "Benzyl Salicylate", "Citronellol", "Alpha-Isomethyl Ionone", "Hexyl Cinnamal", "CI 77891"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Zinc Actives", "Hair Fall Rescue", "Strengthens Hair"]
  },
  {
    product_name: "Head & Shoulders Anti-Dandruff Shampoo Cool Menthol",
    brand: "Procter & Gamble",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Sodium Laureth Sulfate", "Sodium Xylenesulfonate", "Glycol Distearate", "Sodium Lauryl Sulfate", "Zinc Carbonate", "Zinc Pyrithione", "Cocamidopropyl Betaine", "Cocamide MEA", "Fragrance", "Menthol", "Sodium Chloride", "Guar Hydroxypropyltrimonium Chloride", "Sodium Benzoate", "Magnesium Carbonate Hydroxide", "Stearyl Alcohol", "Cetyl Alcohol", "Polyquaternium-76", "Methylchloroisothiazolinone", "Methylisothiazolinone", "CI 42090", "CI 17200"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Cool Menthol", "Zinc Active Formula", "Anti-Dandruff", "100% Flake-Free"]
  },
  {
    product_name: "Pantene Advanced Hair Fall Solution Total Damage Care Shampoo",
    brand: "Procter & Gamble",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Sodium Laureth Sulfate", "Sodium Citrate", "Sodium Xylenesulfonate", "Sodium Lauryl Sulfate", "Sodium Chloride", "Cocamidopropyl Betaine", "Fragrance", "Cocos Nucifera (Coconut) Oil", "Glycerin", "Stearyl Alcohol", "Citric Acid", "Sodium Benzoate", "Cetyl Alcohol", "Guar Hydroxypropyltrimonium Chloride", "Tetrasodium EDTA", "Polyquaternium-6", "Panthenol", "Panthenyl Ethyl Ether", "Histidine", "Methylchloroisothiazolinone", "Methylisothiazolinone"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Pro-Vitamin Formula", "10x Stronger Hair", "Hair Fall Solution"]
  },
  {
    product_name: "Sunsilk Stunning Black Shine Shampoo",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Sodium Laureth Sulfate", "Sodium Chloride", "Cocamidopropyl Betaine", "Dimethiconol", "Perfume", "Sodium Benzoate", "Carbomer", "TEA-Dodecylbenzenesulfonate", "Guar Hydroxypropyltrimonium Chloride", "TEA-Sulfate", "Citric Acid", "Mica", "Sodium Hydroxide", "Disodium EDTA", "Cyclotetrasiloxane", "Phenoxyethanol", "Lysine HCl", "Ethylhexyl Methoxycinnamate", "Phyllanthus Emblica (Amla) Fruit Extract", "Iodopropynyl Butylcarbamate", "Methylchloroisothiazolinone", "Methylisothiazolinone", "Linalool", "Benzyl Salicylate", "Limonene", "CI 77891", "CI 77266"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Amla Extract", "Stunning Black Shine", "Smooth Hair"]
  },
  {
    product_name: "TRESemmé Keratin Smooth Shampoo",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Sodium Laureth Sulfate", "Sodium Chloride", "Cocamidopropyl Betaine", "Dimethiconol", "Perfume", "Sodium Benzoate", "Carbomer", "TEA-Dodecylbenzenesulfonate", "Guar Hydroxypropyltrimonium Chloride", "TEA-Sulfate", "Amodimethicone", "Disodium EDTA", "PEG-45M", "Phenoxyethanol", "Ethylhexyl Methoxycinnamate", "Hydrolyzed Keratin", "Argania Spinosa (Argan) Kernel Oil", "Methylchloroisothiazolinone", "Methylisothiazolinone", "Linalool", "Benzyl Salicylate", "Citronellol", "Alpha-Isomethyl Ionone"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Keratin Smooth", "Argan Oil", "Frizz-Free Shine"]
  },
  {
    product_name: "Himalaya Anti-Hair Fall Shampoo",
    brand: "Himalaya Drug Company",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Sodium Laureth Sulfate", "Cocamidopropyl Betaine", "Dimethiconol", "TEA-Dodecylbenzenesulfonate", "Trideceth-10", "Glycol Distearate", "Perfume", "Glycerin", "Sodium Chloride", "Sodium Benzoate", "Carbomer", "Guar Hydroxypropyltrimonium Chloride", "Salicylic Acid", "Eclipta Prostrata (Bhringaraja) Extract", "Butea Monosperma (Palasha) Flower Extract", "Sodium Hydroxide", "Disodium EDTA", "Hydroxypropyl Methylcellulose"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Bhringraj + Palasha", "Reduces Hair Fall", "Herbal Shampoo"]
  },
  {
    product_name: "Biotique Bio Kelp Protein Shampoo",
    brand: "Biotique",
    category: "PERSONAL_CARE",
    ingredients: ["Neem Bark", "Teshu Flower", "Daruhaldi Root", "Sajikshar", "Kelp (Seaweed) Marine Algae", "Ritha Fruit", "Purified Water Q.S."],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Marine Kelp", "No SLS", "Ayurvedic Herbs", "Fresh Healthy Hair"]
  },
  {
    product_name: "WOW Skin Science Apple Cider Vinegar Shampoo",
    brand: "WOW Skin Science",
    category: "PERSONAL_CARE",
    ingredients: ["Purified Water", "Caprylyl/Capryl Glucoside", "Sodium Methyl Cocoyl Taurate", "Sodium Lauroyl Sarcosinate", "Decyl Glucoside", "Cocamidopropyl Betaine", "Disodium Cocoamphodiacetate", "Polyquaternium-10", "Polyquaternium-73", "D-Panthenol", "Raw Apple Cider Vinegar", "Nettle Leaf Extract", "Saw Palmetto Extract", "Almond Oil", "Argan Oil", "Sodium Benzoate", "Potassium Sorbate", "Fragrance"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["No Sulphate", "No Paraben", "Apple Cider Vinegar", "Scalp Cleanse"]
  },
  {
    product_name: "Indulekha Bringha Shampoo",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Bringharaj", "Amla", "Tulsi", "Neem", "Madhyantika", "Shikakai", "Rosemary", "Water", "Sodium Laureth Sulfate", "Fragrance", "Preservatives"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Bhringraj + Amla", "Reduces Hair Fall", "Ayurvedic Formula"]
  },
  {
    product_name: "L'Oreal Paris Total Repair 5 Shampoo",
    brand: "L'Oreal Paris",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Sodium Laureth Sulfate", "Cocamidopropyl Betaine", "Dimethicone", "Sodium Chloride", "Fragrance", "CI 77891", "Guar Hydroxypropyltrimonium Chloride", "Mica", "Coco-Betaine", "Sodium Benzoate", "Sodium Hydroxide", "Phenoxyethanol", "Steareth-6", "Acetic Acid", "PEG-100 Stearate", "Trideceth-10", "Salicylic Acid", "Limonene", "Fumaric Acid", "Linalool", "Benzyl Salicylate", "Benzyl Alcohol", "Amodimethicone", "Carbomer", "Citric Acid", "Citronellol"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["5 Damage Repair", "Pro-Keratin + Ceramide", "Stronger Hair"]
  },
  {
    product_name: "Garnier Fructis Long & Strong Shampoo",
    brand: "Garnier",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Sodium Laureth Sulfate", "Cocamidopropyl Betaine", "Sodium Lauryl Sulfate", "Glycol Distearate", "Sodium Chloride", "Amodimethicone", "PPG-5-Ceteth-20", "Sodium Benzoate", "Fragrance", "Salicylic Acid", "Guar Hydroxypropyltrimonium Chloride", "Trideceth-6", "Carbomer", "Niacinamide", "Pyridoxine HCl", "Citric Acid", "Cetrimonium Chloride", "Sugar Cane Extract", "Lemon Peel Extract", "Camellia Sinensis Leaf Extract", "Apple Fruit Extract"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Activ Fruit Concentrate", "Long & Strong", "No Fall"]
  },
  {
    product_name: "Dove Daily Shine Shampoo",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Sodium Laureth Sulfate", "Sodium Chloride", "Cocamidopropyl Betaine", "Dimethiconol", "Perfume", "Sodium Benzoate", "Glycol Distearate", "Glycerin", "Carbomer", "TEA-Dodecylbenzenesulfonate", "Guar Hydroxypropyltrimonium Chloride", "TEA-Sulfate", "Mica", "Disodium EDTA", "PEG-45M", "Phenoxyethanol", "Arginine", "Iodopropynyl Butylcarbamate", "Methylchloroisothiazolinone", "Methylisothiazolinone", "Linalool", "Benzyl Salicylate", "Citronellol", "Hexyl Cinnamal", "CI 77891"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Daily Shine", "Arginine Actives", "Light & Nourishing"]
  },
  {
    product_name: "Himalaya Herbals Gentle Daily Care Protein Shampoo",
    brand: "Himalaya Drug Company",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Sodium Laureth Sulfate", "Cocamidopropyl Betaine", "Sodium Cocoyl Glycinate", "Glycol Distearate", "Perfume", "Cicer Arietinum (Chickpea) Seed Extract", "Terminalia Chebula Fruit Extract", "Glycyrrhiza Glabra (Licorice) Root Extract", "Sodium Chloride", "Sodium Benzoate", "Guar Hydroxypropyltrimonium Chloride", "Salicylic Acid", "Sodium Hydroxide", "Disodium EDTA"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Chickpea Protein", "Gentle Daily Use", "Herbal Shampoo"]
  },
  {
    product_name: "Khadi Natural Amla & Bhringraj Hair Cleanser",
    brand: "Khadi Natural",
    category: "PERSONAL_CARE",
    ingredients: ["Purified Water", "Amla (Emblica Officinalis)", "Reetha (Sapindus Mukurossi)", "Aloe Vera Extract (Aloe Barbadensis)", "Bhringraj Extract (Eclipta Alba)", "Rosemary Oil (Rosmarinus Officinalis)", "Lavender Oil (Lavandula Angustifolia)"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["No SLS", "No Paraben", "Herbal", "Amla + Bhringraj"]
  },
  {
    product_name: "Love Beauty & Planet Murumuru Butter & Rose Shampoo",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Sodium Laureth Sulfate", "Cocamidopropyl Betaine", "Sodium Chloride", "Perfume", "Sodium Benzoate", "Glycol Distearate", "Citric Acid", "Polyquaternium-10", "Cocamide MEA", "PPG-9", "Disodium EDTA", "Glycerin", "Cocos Nucifera (Coconut) Oil", "Astrocaryum Murumuru Seed Butter", "Rosa Damascena Flower Oil", "Sodium Hydroxide", "Benzyl Alcohol", "Benzyl Salicylate", "Citronellol", "Coumarin", "Geraniol", "Linalool"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Murumuru Butter", "Rose Oil", "Silicone-Free", "Smooth & Shiny"]
  },
  {
    product_name: "Patanjali Kesh Kanti Natural Hair Cleanser",
    brand: "Patanjali",
    category: "PERSONAL_CARE",
    ingredients: ["Sapindus Trifoliatus (Reetha)", "Aegle Marmelos (Bael)", "Ocimum Sanctum (Tulsi)", "Aloe Barbadensis (Aloe Vera)", "Phyllanthus Emblica (Amla)", "Acacia Concinna (Shikakai)", "Eclipta Alba (Bhringraj)", "Lawsonia Inermis (Mehandi)", "Aqua", "Surfactant Base", "Fragrance", "Diazolidinyl Urea", "IPBC"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["8 Herbs", "Natural Hair Cleanser", "Ayurvedic"]
  },
  {
    product_name: "OGX Thick & Full Biotin & Collagen Shampoo",
    brand: "OGX",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Sodium C14-16 Olefin Sulfonate", "Cocamidopropyl Betaine", "Sodium Chloride", "Fragrance", "Biotin", "Hydrolyzed Collagen", "Hydrolyzed Wheat Protein", "Polyquaternium-10", "Glycol Distearate", "PEG-120 Methyl Glucose Dioleate", "Cocamidopropyl Hydroxysultaine", "Laureth-4", "Citric Acid", "Diazolidinyl Urea", "Iodopropynyl Butylcarbamate", "Sodium Sulfate", "CI 60730", "CI 17200", "CI 19140"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Biotin & Collagen", "Thick & Full", "Volumizing"]
  },
  {
    product_name: "TRESemmé Hair Fall Defense Shampoo",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Sodium Laureth Sulfate", "Sodium Chloride", "Cocamidopropyl Betaine", "Dimethiconol", "Perfume", "Sodium Benzoate", "Glycol Distearate", "Carbomer", "TEA-Dodecylbenzenesulfonate", "Guar Hydroxypropyltrimonium Chloride", "TEA-Sulfate", "Disodium EDTA", "PEG-45M", "Phenoxyethanol", "Lysine HCl", "Hydrolyzed Keratin", "Methylchloroisothiazolinone", "Methylisothiazolinone", "Linalool", "Benzyl Salicylate", "Citronellol", "Hexyl Cinnamal"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_calls: ["Keratin Actives", "Hair Fall Defense", "Strengthens Hair"]
  },

  // ── PERSONAL CARE — DAY 1 GEMINI REVISED (CONDITIONERS) ─────────────────────

  {
    product_name: "Dove Intense Repair Conditioner",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Cetearyl Alcohol", "Dimethicone", "Stearamidopropyl Dimethylamine", "Behentrimonium Chloride", "Perfume", "Glycerin", "Dipropylene Glycol", "Lactic Acid", "Sodium Chloride", "Amodimethicone", "Disodium EDTA", "Gluconolactone", "Trehalose", "Cetrimonium Chloride", "PEG-7 Propylheptyl Ether", "Magnesium Nitrate", "Sodium Sulfate", "Sodium Hydroxide", "Methylchloroisothiazolinone", "Methylisothiazolinone", "Alpha-Isomethyl Ionone", "Benzyl Salicylate", "Citronellol", "Hexyl Cinnamal", "Linalool"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Keratin Actives", "Intense Repair", "Damage Repair Conditioner"]
  },
  {
    product_name: "Pantene Advanced Smooth & Silky Conditioner",
    brand: "Procter & Gamble",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Silicone Quaternium-26", "Stearyl Alcohol", "Behentrimonium Methosulfate", "Cetyl Alcohol", "Fragrance", "Isopropyl Alcohol", "Benzyl Alcohol", "Disodium EDTA", "Polysorbate 20", "Panthenyl Ethyl Ether", "Panthenol", "Histidine", "Citric Acid", "Methylchloroisothiazolinone", "Methylisothiazolinone"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Pro-Vitamin Formula", "Silky Smooth", "Frizz Control"]
  },
  {
    product_name: "Himalaya Gentle Daily Care Protein Conditioner",
    brand: "Himalaya Drug Company",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Cetearyl Alcohol", "Behentrimonium Methosulfate", "Cetyl Alcohol", "Perfume", "Cicer Arietinum Seed Extract", "Aloe Barbadensis Leaf Juice", "Glyceryl Stearate SE", "Terminalia Bellerica Fruit Extract", "Methylparaben", "Propylparaben", "Disodium EDTA"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Chickpea Protein", "Aloe Vera", "Gentle Daily Conditioner"]
  },
  {
    product_name: "Mamaearth Onion Conditioner for Hair Fall Control",
    brand: "Mamaearth",
    category: "PERSONAL_CARE",
    ingredients: ["Aqua", "Cetearyl Alcohol", "Caprylic/Capric Triglyceride", "Emulsifying Wax", "Coconut Oil", "Sweet Almond Oil", "Onion Seed Extract", "Cetrimonium Chloride", "Polyquaternium-10", "Plant Keratin", "Sodium Benzoate", "Potassium Sorbate", "IFRA Certified Allergen Free Fragrance"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["No Sulphate", "No Paraben", "Onion Extract", "Reduces Hair Fall"]
  },
  {
    product_name: "WOW Skin Science Coconut Milk Hair Mask",
    brand: "WOW Skin Science",
    category: "PERSONAL_CARE",
    ingredients: ["Purified Water", "Cetyl Alcohol", "Cococaprylate", "Brassicamidopropyl Dimethylamine", "Coconut Milk Extract", "Extra Virgin Coconut Oil", "Hydrolyzed Wheat Protein", "Panthenol (Vitamin B5)", "Tocopheryl Acetate (Vitamin E)", "Sodium PCA", "Fragrance", "Sodium Benzoate", "Potassium Sorbate"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Coconut Milk", "Deep Conditioning", "No Sulphate", "Vitamin E"]
  },
  {
    product_name: "Garnier Fructis Long & Strong Conditioner",
    brand: "Garnier",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Cetearyl Alcohol", "Behentrimonium Chloride", "Cetyl Esters", "Niacinamide", "Saccharum Officinarum Extract", "Isopropyl Alcohol", "Trideceth-6", "Chlorhexidine Digluconate", "Limonene", "Camellia Sinensis Leaf Extract", "Linalool", "Benzyl Salicylate", "Benzyl Alcohol", "Amodimethicone", "Apple Fruit Extract", "Pyridoxine HCl", "Citric Acid", "Cetrimonium Chloride", "Lemon Peel Extract"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Activ Fruit Concentrate", "Long & Strong", "Detangling"]
  },
  {
    product_name: "L'Oreal Paris Extraordinary Oil Smooth Conditioner",
    brand: "L'Oreal Paris",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Cetearyl Alcohol", "Amodimethicone", "Behentrimonium Chloride", "Cetyl Esters", "Fragrance", "Isopropyl Alcohol", "Trideceth-6", "Phenoxyethanol", "Argania Spinosa Kernel Oil", "Helianthus Annuus Seed Oil", "Lotus Corniculatus Flower Extract", "Cocos Nucifera Oil", "Cetrimonium Chloride", "Linalool", "Caramel"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Extraordinary Oil", "Argan + Lotus + Coconut Oils", "Smooth Shiny Hair"]
  },
  {
    product_name: "Biotique Bio Thyme Volume Conditioner",
    brand: "Biotique",
    category: "PERSONAL_CARE",
    ingredients: ["Thyme", "Ajwain", "Daruhaldi", "Surajmukhi Oil", "Jaitun Oil", "Purified Water Q.S."],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["No SLS", "Thyme & Olive Oil", "Volume & Bounce", "Ayurvedic"]
  },
  {
    product_name: "Dove Hair Fall Rescue Conditioner",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Cetearyl Alcohol", "Dimethicone", "Stearamidopropyl Dimethylamine", "Behentrimonium Chloride", "Perfume", "Glycerin", "Lactic Acid", "Sodium Chloride", "Amodimethicone", "Disodium EDTA", "Gluconolactone", "Trehalose", "Cetrimonium Chloride", "PEG-7 Propylheptyl Ether", "Lysine HCl", "Magnesium Nitrate", "Methylchloroisothiazolinone", "Methylisothiazolinone"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Zinc Actives", "Reduces Hair Fall", "Strengthening Conditioner"]
  },
  {
    product_name: "OGX Nourishing Coconut Milk Conditioner",
    brand: "OGX",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Cetearyl Alcohol", "Cetyl Alcohol", "Behentrimonium Chloride", "Glycerin", "Cocos Nucifera Oil", "Cocos Nucifera Fruit Extract", "Albumen", "Carthamus Tinctorius Seed Oil", "Panthenol", "Isopropyl Alcohol", "Dimethicone", "Cyclotetrasiloxane", "Propylene Glycol", "Magnesium Nitrate", "Methylchloroisothiazolinone", "Methylisothiazolinone", "Fragrance"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Coconut Milk", "Egg White Protein", "Nourishing", "Soft & Smooth"]
  },
  {
    product_name: "Matrix Biolage Smoothproof Conditioner",
    brand: "Matrix",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Cetearyl Alcohol", "Elaeis Guineensis Oil", "Behentrimonium Chloride", "Glycerin", "Fragrance", "Isopropyl Alcohol", "Methylparaben", "Stearamidopropyl Dimethylamine", "Camellia Oleifera Seed Oil", "Citric Acid", "Chlorhexidine Dihydrochloride", "Limonene"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Smoothproof", "Camellia Oil", "Frizz Control", "Salon Formula"]
  },
  {
    product_name: "L'Oreal Paris Dream Lengths Detangling Conditioner",
    brand: "L'Oreal Paris",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Cetearyl Alcohol", "Dicetyldimonium Chloride", "Cetrimonium Chloride", "Niacinamide", "Ricinus Communis Seed Oil", "Sodium Benzoate", "Hydroxycitronellal", "Hydroxypropyltrimonium Hydrolyzed Wheat Protein", "Hydrolyzed Corn Protein", "Hydrolyzed Soy Protein", "Hydrolyzed Wheat Protein", "Phenoxyethanol", "Steareth-6", "Acetic Acid", "PEG-100 Stearate", "Trideceth-10", "Chlorhexidine Digluconate", "Limonene", "Panthenol", "Benzyl Salicylate", "Linalool", "Benzyl Alcohol", "Isopropyl Alcohol", "Amodimethicone", "Alpha-Isomethyl Ionone", "Geraniol", "Citric Acid", "Citronellol", "Hexyl Cinnamal"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Dream Lengths", "Castor Oil", "Detangling", "Long Hair Care"]
  },
  {
    product_name: "Plum Olive & Macadamia Rich Nourish Conditioner",
    brand: "Plum",
    category: "PERSONAL_CARE",
    ingredients: ["Aqua", "Cetearyl Alcohol", "Behentrimonium Chloride", "Helianthus Annuus Seed Oil", "Olive Oil PEG-7 Esters", "Macadamia Ternifolia Seed Oil", "Olive Oil", "Butyrospermum Parkii Butter", "Pro-Vitamin B5", "Fragrance", "Phenoxyethanol", "Ethylhexylglycerin"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Olive + Macadamia Oil", "No Paraben", "No SLS", "Rich Nourishment"]
  },
  {
    product_name: "Sunsilk Soft & Smooth Conditioner",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Cetearyl Alcohol", "Dimethicone", "Stearamidopropyl Dimethylamine", "Perfume", "Behentrimonium Chloride", "Glycerin", "Lactic Acid", "Dipropylene Glycol", "Amodimethicone", "Sodium Chloride", "Disodium EDTA", "Cetrimonium Chloride", "PEG-7 Propylheptyl Ether", "Lysine HCl", "Argania Spinosa Kernel Oil", "Cocos Nucifera Oil", "Methylchloroisothiazolinone", "Methylisothiazolinone"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Argan Oil", "Coconut Oil", "Soft & Smooth"]
  },
  {
    product_name: "Love Beauty & Planet Onion Black Seed & Patchouli Conditioner",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Cetearyl Alcohol", "Behentrimonium Chloride", "Cocos Nucifera Oil", "Perfume", "Dipropylene Glycol", "1,2-Hexanediol", "Benzyl Alcohol", "Disodium EDTA", "Acrylates/Beheneth-25 Methacrylate Copolymer", "Sodium Hydroxide", "Allium Cepa Bulb Extract", "Nigella Sativa Seed Oil", "Patchouli Oil"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Onion Oil", "Black Seed Oil", "Silicone-Free", "Hair Fall Control"]
  },
  {
    product_name: "Schwarzkopf Professional Spa Essence Enriching Conditioner",
    brand: "Schwarzkopf",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Cetearyl Alcohol", "Quaternium-87", "Propylene Glycol", "Hydrolyzed Keratin", "Glycerin", "Distearoylethyl Hydroxyethylmonium Methosulfate", "Isopropyl Myristate", "Fragrance", "Citric Acid", "Phenoxyethanol", "Sodium Methylparaben"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Hydrolyzed Keratin", "Professional Formula", "Enriching Conditioner"]
  },
  {
    product_name: "TRESemmé Hair Fall Defense Conditioner",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Cetearyl Alcohol", "Dimethicone", "Stearamidopropyl Dimethylamine", "Behentrimonium Chloride", "Perfume", "Dipropylene Glycol", "Lactic Acid", "Sodium Chloride", "Amodimethicone", "Disodium EDTA", "Cetrimonium Chloride", "PEG-7 Propylheptyl Ether", "Phenoxyethanol", "Lysine HCl", "Magnesium Nitrate", "Methylchloroisothiazolinone", "Methylisothiazolinone"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Hair Fall Defense", "Keratin Fortified", "Strengthens Hair"]
  },
  {
    product_name: "Dove Daily Shine Conditioner",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Cetearyl Alcohol", "Dimethicone", "Stearamidopropyl Dimethylamine", "Behentrimonium Chloride", "Perfume", "Glycerin", "Lactic Acid", "Sodium Chloride", "Amodimethicone", "Disodium EDTA", "Gluconolactone", "Trehalose", "Cetrimonium Chloride", "PEG-7 Propylheptyl Ether", "Lysine HCl", "Magnesium Nitrate", "Methylchloroisothiazolinone", "Methylisothiazolinone"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Daily Shine", "Moisturising Conditioner", "Soft & Manageable"]
  },
  {
    product_name: "Clinic Plus Soft & Smooth Conditioner",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Cetearyl Alcohol", "Dimethicone", "Stearamidopropyl Dimethylamine", "Behentrimonium Chloride", "Perfume", "Glycerin", "Lactic Acid", "Sodium Chloride", "Amodimethicone", "Disodium EDTA", "Milk Protein", "Lysine HCl", "Cetrimonium Chloride", "PEG-7 Propylheptyl Ether", "Methylchloroisothiazolinone", "Methylisothiazolinone"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Milk Protein", "Soft & Smooth", "Strong & Long Hair"]
  },

  // ── PERSONAL CARE — DAY 1 GEMINI REVISED (SOAPS & BODY WASH) ─────────────────

  {
    product_name: "Lux Bright Glow Soap with Vitamin C & E",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Palmate", "Sodium Palm Kernelate", "Water", "Glycerin", "Perfume", "Sodium Chloride", "Titanium Dioxide", "Tetrasodium Etidronate", "Tetrasodium EDTA", "Sodium Ascorbyl Phosphate (Vitamin C)", "Tocopheryl Acetate (Vitamin E)", "Alpha-Isomethyl Ionone", "Benzyl Salicylate", "Linalool", "CI 12490"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Vitamin C & E", "Bright Glow", "Moisturising"]
  },
  {
    product_name: "Dove Sensitive Skin Beauty Bar",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Lauroyl Isethionate", "Stearic Acid", "Sodium Palmitate", "Lauric Acid", "Water", "Sodium Isethionate", "Sodium Stearate", "Cocamidopropyl Betaine", "Sodium Palm Kernelate", "Glycerin", "Sodium Chloride", "Zinc Oxide", "Tetrasodium EDTA", "Tetrasodium Etidronate", "Titanium Dioxide"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Fragrance-Free", "Sensitive Skin", "Hypoallergenic", "No Paraben"]
  },
  {
    product_name: "Santoor Sandal & Turmeric Soap",
    brand: "Wipro Consumer Care",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Palmate", "Sodium Palm Kernelate", "Aqua", "Hydrated Magnesium Silicate", "Sandalwood Extract", "Turmeric Extract", "Glycerin", "Perfume", "Sodium Carbonate", "Etidronic Acid", "Tetrasodium EDTA", "CI 45100", "CI 11680"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Sandalwood + Turmeric", "Younger Looking Skin", "Dermatologically Tested"]
  },
  {
    product_name: "Himalaya Neem & Turmeric Soap",
    brand: "Himalaya Drug Company",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Palmate", "Sodium Palm Kernelate", "Water", "Fragrance", "Glycerin", "Melia Azadirachta Seed Oil (Neem)", "Curcuma Longa Root Oil (Turmeric)", "Tetrasodium EDTA", "Tetrasodium Etidronate", "Tocopheryl Acetate", "CI 77288"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Neem + Turmeric", "Anti-Bacterial", "Herbal Protection"]
  },
  {
    product_name: "Nivea Creme Soft Bathing Bar",
    brand: "Beiersdorf",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Palmate", "Sodium Palm Kernelate", "Aqua", "Glycerin", "Perfume", "Prunus Amygdalus Dulcis (Sweet Almond) Oil", "Sodium Chloride", "Tetrasodium Etidronate", "Tetrasodium EDTA", "Titanium Dioxide", "Linalool", "Limonene", "Benzyl Alcohol"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Sweet Almond Oil", "Moisturising", "Soft Skin"]
  },
  {
    product_name: "Fiama Lemongrass & Jojoba Shower Gel",
    brand: "ITC",
    category: "PERSONAL_CARE",
    ingredients: ["Aqua", "Sodium Laureth Sulfate", "Cocamidopropyl Betaine", "Acrylates Copolymer", "Glycerin", "PEG-40 Hydrogenated Castor Oil", "Fragrance", "Lemongrass Extract", "Jojoba Beads", "Sodium Hydroxide", "Sodium Chloride", "Benzophenone-4", "Tetrasodium EDTA", "CI 47005", "CI 42090"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Lemongrass + Jojoba", "Skin Conditioners", "Refreshing"]
  },
  {
    product_name: "Margo Original Neem Soap",
    brand: "Henkel India",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Palmate", "Sodium Palm Kernelate", "Neem Seed Oil", "Water", "Talc", "Fragrance", "Sodium Chloride", "Glycerin", "Petroleum Jelly", "Tetrasodium EDTA", "Etidronic Acid", "Vitamin E Acetate", "CI 12740", "CI 61565"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["100% Original Neem", "Anti-Bacterial", "Pure Neem Goodness"]
  },
  {
    product_name: "Godrej No. 1 Sandal & Turmeric Soap",
    brand: "Godrej Consumer Products",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Palmate", "Sodium Palm Kernelate", "Water", "Fragrance", "Sodium Chloride", "Glycerin", "Sandalwood Extract", "Turmeric Extract", "Titanium Dioxide", "Tetrasodium EDTA", "BHT", "CI 12740", "CI 12150"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Sandal + Turmeric", "Moisturising", "Trusted Brand"]
  },
  {
    product_name: "Dove Purely Pampering Shea Butter Body Wash",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Water", "Sodium Lauroyl Glycinate", "Cocamidopropyl Betaine", "Sodium Lauroyl Isethionate", "Sodium Chloride", "Lauric Acid", "Glycerin", "Perfume", "Shea Butter", "Carbomer", "PEG-150 Pentaerythrityl Tetrastearate", "Sodium Hydroxide", "DMDM Hydantoin", "Tetrasodium EDTA", "Iodopropynyl Butylcarbamate", "Benzyl Alcohol", "Coumarin", "Hexyl Cinnamal", "Limonene", "Linalool"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Shea Butter", "Purely Pampering", "Moisturising Body Wash"]
  },
  {
    product_name: "Savlon Moisture Shield Germ Protection Soap",
    brand: "ITC",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Palmate", "Sodium Palm Kernelate", "Aqua", "Talc", "Perfume", "Glycerin", "Sodium Chloride", "Titanium Dioxide", "Tetrasodium EDTA", "Etidronic Acid", "Silver Nano", "BHT", "Alpha-Isomethyl Ionone", "Hexyl Cinnamal"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Silver Shield Technology", "Germ Protection", "Moisture Lock"]
  },
  {
    product_name: "Cinthol Original Deodorant Soap",
    brand: "Godrej Consumer Products",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Palmate", "Sodium Palm Kernelate", "Water", "Perfume", "Triclocarban", "Sodium Chloride", "Glycerin", "Titanium Dioxide", "Tetrasodium EDTA", "BHT", "Citric Acid", "CI 47000", "CI 61565"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Deodorant Soap", "Germ Protection", "Fresh Feel"]
  },
  {
    product_name: "Vivel Aloe Vera Bathing Bar",
    brand: "ITC",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Palmate", "Sodium Palm Kernelate", "Aqua", "Talc", "Fragrance", "Glycerin", "Aloe Barbadensis Leaf Extract", "Vitamin E Acetate", "Sodium Chloride", "Tetrasodium EDTA", "Etidronic Acid", "BHT", "CI 74260", "CI 11680"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Aloe Vera + Vitamin E", "Moisturising", "Gentle Cleansing"]
  },
  {
    product_name: "Biotique Bio Almond Oil Nourishing Body Soap",
    brand: "Biotique",
    category: "PERSONAL_CARE",
    ingredients: ["Nariyal Tail (Coconut Oil)", "Arand Tail (Castor Oil)", "Neem Tail", "Badam Tail (Almond Oil)", "Banhaldi", "Imli", "Ritha", "Purified Water Q.S."],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Almond Oil", "No SLS", "Ayurvedic", "Nourishing"]
  },
  {
    product_name: "Medimix Ayurvedic 18-Herb Soap",
    brand: "Cholayil",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Palmate", "Sodium Palm Kernelate", "Sodium Cocoate", "18 Herb Extracts (Chitraka, Vanardraka, Sariba & others)", "Fragrance", "Magnesium Silicate", "Sodium Chloride", "CI 61565", "CI 47000"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["18 Ayurvedic Herbs", "Anti-Bacterial", "Dermatologically Tested"]
  },
  {
    product_name: "Mamaearth Ubtan Body Wash with Turmeric & Saffron",
    brand: "Mamaearth",
    category: "PERSONAL_CARE",
    ingredients: ["Aqua", "Cocamidopropyl Betaine", "Sodium Lauroyl Sarcosinate", "Glycerin", "Turmeric Extract", "Saffron Extract", "Walnut Shell Powder", "Sodium Benzoate", "Potassium Sorbate", "IFRA Certified Allergen Free Fragrance"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Turmeric + Saffron", "No SLS", "No Paraben", "Ubtan Formula"]
  },
  {
    product_name: "Hamam Neem Tulsi & Aloe Vera Soap",
    brand: "Hindustan Unilever",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Palmate", "Sodium Palm Kernelate", "Water", "Fragrance", "Sodium Chloride", "Glycerin", "Neem Extract", "Tulsi Extract", "Aloe Vera Extract", "Tetrasodium EDTA", "Tetrasodium Etidronate", "CI 77288", "CI 11680"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Neem + Tulsi + Aloe", "Naturally Safe", "Germ Protection"]
  },
  {
    product_name: "Cetaphil Gentle Cleansing Bar",
    brand: "Galderma",
    category: "PERSONAL_CARE",
    ingredients: ["Sodium Cocoyl Isethionate", "Stearic Acid", "Sodium Tallowate", "Sodium Cocoate", "Water", "Sodium Stearate", "Glycerin", "Sodium Chloride", "PEG-20", "Sodium Isethionate", "Petrolatum", "Sodium Isostearoyl Lactylate", "Sucrose Cocoate", "Titanium Dioxide", "Pentasodium Pentetate", "Tetrasodium Etidronate"],
    nutrition: { energy_kcal: 0, sugar_g: 0, sodium_mg: 0, protein_g: 0, fat_g: 0, saturated_fat_g: 0, trans_fat_g: 0, fibre_g: 0 },
    front_claims: ["Sensitive Skin", "Fragrance-Free", "Dermatologist Recommended", "No Harsh Chemicals"]
  }

];

export default SEED_PRODUCTS;
