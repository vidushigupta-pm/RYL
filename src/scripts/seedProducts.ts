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
  }

];

export default SEED_PRODUCTS;
