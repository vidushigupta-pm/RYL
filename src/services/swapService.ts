// src/services/swapService.ts

import { db } from '../firebase';
import {
  collection, query, where, orderBy,
  limit, getDocs, Timestamp, addDoc
} from 'firebase/firestore';

export interface AlsoScannedProduct {
  product_name: string;
  brand: string;
  overall_score: number;
  profile_score: number | null;
  scan_count: number;        // how many users scanned this
  sub_category: string;
}

export async function getAlsoScanned(
  currentProductId: string,
  category: string,
  subCategory: string,
  profileType: string,        // e.g. "SENIOR_DIABETIC"
  currentScore: number
): Promise<AlsoScannedProduct[]> {

  try {
    // Find other products in same sub-category
    // that scored BETTER than current product
    const q = query(
      collection(db, 'scan_events'),
      where('sub_category', '==', subCategory),
      where('overall_score', '>', currentScore),
      where('product_id', '!=', currentProductId),
      orderBy('overall_score', 'desc'),
      limit(20)
    );

    const snap = await getDocs(q);

    // Count occurrences and deduplicate by product
    const productMap: Record<string, any> = {};
    snap.docs.forEach(doc => {
      const d = doc.data();
      if (!productMap[d.product_id]) {
        productMap[d.product_id] = {
          product_name: d.product_name,
          brand: d.brand,
          overall_score: d.overall_score,
          profile_score: null,
          scan_count: 0,
          sub_category: d.sub_category
        };
      }
      productMap[d.product_id].scan_count += 1;
    });

    // Sort by scan count (most scanned = most relevant)
    // Minimum 2 scans to appear — prevents one-off flukes
    return Object.values(productMap)
      .filter((p: any) => p.scan_count >= 2)
      .sort((a: any, b: any) => b.scan_count - a.scan_count)
      .slice(0, 3);

  } catch (error) {
    console.error('getAlsoScanned failed:', error);
    return [];
  }
}

// Save every scan to scan_events
export async function recordScanEvent(
  result: any,
  userId: string,
  profileType: string
): Promise<void> {
  try {
    const productId = normaliseProductId(result.product_name, result.brand);

    await addDoc(collection(db, 'scan_events'), {
      product_id: productId,
      product_name: result.product_name,
      brand: result.brand || '',
      category: result.category,
      sub_category: detectSubCategory(result.product_name, result.category),
      overall_score: result.overall_score,
      profile_type: profileType,
      user_id: userId,           // only for deduplication
      scanned_at: Timestamp.now()
    });
  } catch (error) {
    console.error('recordScanEvent failed:', error);
    // Non-critical — don't throw
  }
}

export function normaliseProductId(name: string, brand: string): string {
  return `${brand}_${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');
}

export function detectSubCategory(productName: string, category: string): string {
  if (category !== 'FOOD') return category;
  const name = productName.toLowerCase();

  if (name.includes('biscuit') || name.includes('cookie') || name.includes('cracker')) return 'BISCUIT';
  if (name.includes('noodle') || name.includes('pasta') || name.includes('maggi')) return 'INSTANT_NOODLES';
  if (name.includes('chips') || name.includes('namkeen') || name.includes('snack')) return 'SNACK';
  if (name.includes('juice') || name.includes('drink') || name.includes('beverage')) return 'DRINK';
  if (name.includes('chocolate') || name.includes('candy') || name.includes('sweet')) return 'CONFECTIONERY';
  if (name.includes('bread') || name.includes('roti') || name.includes('toast')) return 'BREAD';
  if (name.includes('sauce') || name.includes('ketchup') || name.includes('chutney')) return 'SAUCE';
  if (name.includes('cereal') || name.includes('oats') || name.includes('muesli')) return 'CEREAL';
  if (name.includes('milk') || name.includes('curd') || name.includes('yogurt')) return 'DAIRY';
  if (name.includes('oil') || name.includes('ghee') || name.includes('butter')) return 'COOKING_FAT';

  return category; // fallback to broad category
}
