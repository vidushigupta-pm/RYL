import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { IngredientEntry } from '../data/ingredientIntelligence';

/**
 * Interface for a Product in Firestore
 */
export interface FirestoreProduct {
  product_name: string;
  brand?: string;
  category: string;
  ingredients: string[];
  nutrition?: any;
  overall_score: number;
  score_breakdown: any;
  summary: string;
  india_context: string;
  is_upf: boolean;
  hfss_status: string;
  suggestions: string[];
  last_updated: any;
}

/**
 * Interface for an Ingredient in Firestore
 */
export interface FirestoreIngredient {
  name: string;
  common_names: string[];
  function: string;
  safety_tier: string;
  plain_explanation: string;
  condition_flags: any[];
  india_specific_note?: string;
  score_impact: number;
  data_quality: string;
}

/**
 * Look up a product by name in Firestore
 */
export async function getProductFromDB(productName: string): Promise<FirestoreProduct | null> {
  try {
    const q = query(collection(db, 'products'), where('product_name', '==', productName));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as FirestoreProduct;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'products');
    return null;
  }
}

/**
 * Save a product to Firestore
 */
export async function saveProductToDB(product: any) {
  if (!auth.currentUser) {
    console.log(`[DB] Skipping product save: user not authenticated.`);
    return;
  }
  try {
    const productId = product.product_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    await setDoc(doc(db, 'products', productId), {
      ...product,
      last_updated: serverTimestamp()
    });
    console.log(`[DB] Saved product: ${product.product_name}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products');
  }
}

/**
 * Look up multiple ingredients in Firestore
 */
export async function getIngredientsFromDB(names: string[]): Promise<Record<string, IngredientEntry>> {
  if (names.length === 0) return {};
  
  const results: Record<string, IngredientEntry> = {};
  try {
    // Firestore 'in' query is limited to 10 items, so we chunk it
    const chunks = [];
    for (let i = 0; i < names.length; i += 10) {
      chunks.push(names.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const q = query(collection(db, 'ingredients'), where('name', 'in', chunk));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirestoreIngredient;
        results[data.name] = data as any;
      });
    }
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'ingredients');
    return {};
  }
}

/**
 * Save an ingredient to the global registry in Firestore
 */
export async function saveIngredientToDB(name: string, entry: any) {
  if (!auth.currentUser) {
    console.log(`[DB] Skipping ingredient save: user not authenticated.`);
    return;
  }
  try {
    const ingredientId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    await setDoc(doc(db, 'ingredients', ingredientId), {
      ...entry,
      name,
      last_updated: serverTimestamp()
    });
    console.log(`[DB] Saved ingredient to registry: ${name}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'ingredients');
  }
}
