import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

export const PRODUCT_CATEGORIES = [
  { id: "FOOD", label: "Food & Drink", emoji: "🥗" },
  { id: "COSMETIC", label: "Cosmetics", emoji: "💄" },
  { id: "PERSONAL_CARE", label: "Personal Care", emoji: "🧴" },
  { id: "SUPPLEMENT", label: "Supplement", emoji: "💊" },
  { id: "HOUSEHOLD", label: "Household", emoji: "🧹" },
  { id: "PET_FOOD", label: "Pet Food", emoji: "🐾" },
];

const DEFAULT_RESULT = {
  product_name: "Unknown Product",
  brand: "Unknown Brand",
  category: "FOOD",
  ingredients: [],
  nutrition: {
    energy_kcal: 0,
    sugar_g: 0,
    sodium_mg: 0,
    protein_g: 0,
    fat_g: 0,
    saturated_fat_g: 0,
    trans_fat_g: 0,
    fibre_g: 0
  },
  overall_score: 0,
  score_breakdown: [],
  summary: "Analysis failed. Please try again.",
  india_context: "",
  claim_checks: [],
  front_claims_detected: [],
  unverified_ingredients: [],
  is_upf: false,
  hfss_status: "GREEN",
  suggestions: []
};

/**
 * Calls the secure Firebase Cloud Function to analyze product labels.
 */
export async function analyseLabel(backImageBase64: string, backMimeType: string, frontImageBase64?: string, frontMimeType?: string) {
  try {
    const analyseLabelFn = httpsCallable(functions, 'analyseLabel');
    const result = await analyseLabelFn({
      backImageBase64,
      backMimeType,
      frontImageBase64,
      frontMimeType
    });
    
    return { ...DEFAULT_RESULT, ...(result.data as any) };
  } catch (error) {
    console.error("Error calling analyseLabel Cloud Function:", error);
    return DEFAULT_RESULT;
  }
}

/**
 * Calls the secure Firebase Cloud Function to search for products by name.
 */
export async function searchProductByName(productName: string) {
  try {
    const searchProductByNameFn = httpsCallable(functions, 'searchProductByName');
    const result = await searchProductByNameFn({ productName });
    
    return { ...DEFAULT_RESULT, ...(result.data as any) };
  } catch (error) {
    console.error("Error calling searchProductByName Cloud Function:", error);
    return DEFAULT_RESULT;
  }
}

/**
 * Calls the secure Firebase Cloud Function to chat about a product.
 */
export async function chatAboutProduct(productAnalysis: any, userMessage: string, profile: any, history: any[]) {
  try {
    const chatAboutProductFn = httpsCallable(functions, 'chatAboutProduct');
    const result = await chatAboutProductFn({
      productAnalysis,
      userMessage,
      profile,
      history
    });
    
    return result.data as string;
  } catch (error) {
    console.error("Error calling chatAboutProduct Cloud Function:", error);
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.";
  }
}
