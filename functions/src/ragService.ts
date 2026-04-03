// functions/src/ragService.ts
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import {
  batchLookupIngredients,
  normaliseIngredientName,
  BatchLookupResult
} from './data';
import { calculateScore, NutritionData } from './scoringEngine';

const db = getFirestore();

export interface CachedProduct {
  id: string;
  barcode?: string;
  product_name: string;
  brand: string;
  category: string;
  ingredients_list: string[];
  nutrition: NutritionData | null;
  front_claims: string[];
  cached_verdict: any;
  verdict_computed_at: Timestamp;
  data_source: 'VERIFIED' | 'LLM_GENERATED' | 'COMMUNITY';
}

export interface RAGLookupResult {
  layer: 1 | 2 | 3 | 4;
  cached_verdict?: any;
  partial_result?: Partial<any>;
  ground_truth_bundle?: string;
  needs_llm: boolean;
  llm_task?: 'SUMMARY_ONLY' | 'GAPS_ONLY' | 'FULL';
}

export async function checkProductCache(
  productName: string,
  barcode?: string
): Promise<CachedProduct | null> {
  try {
    if (barcode) {
      const snap = await db.collection('products')
        .where('barcode', '==', barcode)
        .limit(1)
        .get();
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as CachedProduct;
      }
    }

    const normName = normaliseIngredientName(productName);
    const snap = await db.collection('products')
      .where('name_aliases', 'array-contains', normName)
      .limit(1)
      .get();
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as CachedProduct;
    }

    return null;
  } catch (error) {
    console.error('Product cache lookup failed:', error);
    return null;
  }
}

export async function saveProductToCache(
  analysisResult: any,
  barcode?: string
): Promise<void> {
  try {
    const normName = normaliseIngredientName(analysisResult.product_name || '');
    const normBrand = analysisResult.brand ? normaliseIngredientName(analysisResult.brand) : '';
    const normFull = (analysisResult.brand && analysisResult.product_name) 
      ? normaliseIngredientName(analysisResult.brand + ' ' + analysisResult.product_name)
      : '';

    const aliases = Array.from(new Set([normName, normBrand, normFull])).filter(Boolean);

    await db.collection('products').add({
      barcode: barcode || null,
      product_name: analysisResult.product_name,
      brand: analysisResult.brand,
      category: analysisResult.category,
      name_aliases: aliases,
      ingredients_list: (analysisResult.ingredients || []).map((i: any) => i.name),
      nutrition: analysisResult.nutrition || null,
      front_claims: analysisResult.front_claims_detected || [],
      cached_verdict: analysisResult,
      verdict_computed_at: FieldValue.serverTimestamp(),
      data_source: 'LLM_GENERATED'
    });
  } catch (error) {
    console.error('Failed to save product to cache:', error);
  }
}

export async function ragLookup(params: {
  productName?: string;
  barcode?: string;
  extractedIngredients?: string[];
  nutrition?: NutritionData | null;
  productCategory?: string;
}): Promise<RAGLookupResult> {
  const { productName, barcode, extractedIngredients, nutrition, productCategory } = params;

  if (productName || barcode) {
    const cached = await checkProductCache(productName || '', barcode);
    if (cached?.cached_verdict) {
      return {
        layer: 1,
        cached_verdict: cached.cached_verdict,
        needs_llm: false
      };
    }
  }

  if (extractedIngredients && extractedIngredients.length > 0) {
    const lookup = batchLookupIngredients(extractedIngredients);

    if (lookup.coveragePercent >= 80) {
      const scoreResult = calculateScore(lookup, nutrition || null, productCategory || 'FOOD');
      const partialIngredients = lookup.verified.map(({ rawName, entry }) => ({
        name: rawName,
        plain_name: entry.common_names[0] || rawName,
        function: entry.function,
        safety_tier: entry.safety_tier,
        plain_explanation: entry.plain_explanation,
        flag_for: entry.condition_flags.map(f => f.condition),
        source: 'DB_VERIFIED'
      }));

      const unverifiedIngredients = lookup.unverified.map(name => ({
        name,
        plain_name: name,
        function: 'Unknown',
        safety_tier: 'UNVERIFIED' as const,
        plain_explanation: 'Not in our verified database. Excluded from safety score.',
        flag_for: [],
        source: 'UNVERIFIED'
      }));

      return {
        layer: 2,
        partial_result: {
          ingredients: [...partialIngredients, ...unverifiedIngredients],
          nutrition,
          overall_score: scoreResult.overall_score,
          score_breakdown: scoreResult.score_breakdown,
          unverified_ingredients: lookup.unverified,
          is_score_suppressed: scoreResult.is_suppressed,
          suppression_reason: scoreResult.suppression_reason,
        },
        needs_llm: true,
        llm_task: 'SUMMARY_ONLY'
      };
    }

    if (lookup.coveragePercent >= 40) {
      const groundTruthBundle = buildGroundTruthBundle(lookup);
      return {
        layer: 3,
        ground_truth_bundle: groundTruthBundle,
        needs_llm: true,
        llm_task: 'GAPS_ONLY'
      };
    }
  }

  return {
    layer: 4,
    needs_llm: true,
    llm_task: 'FULL'
  };
}

function buildGroundTruthBundle(lookup: BatchLookupResult): string {
  const lines = lookup.verified.map(({ rawName, entry }) => {
    const flags = entry.condition_flags
      .map(f => `${f.condition} (${f.impact}): ${f.reason} [${f.source}]`)
      .join('; ');
    return `- "${rawName}":
    safety_tier: ${entry.safety_tier}
    fssai_status: ${entry.fssai_status}
    function: ${entry.function}
    plain_explanation: "${entry.plain_explanation}"
    condition_flags: ${flags || 'none'}
    india_note: ${entry.india_specific_note || 'none'}`;
  }).join('\n\n');

  return `VERIFIED INGREDIENT DATA — USE THIS AS GROUND TRUTH. DO NOT OVERRIDE WITH YOUR TRAINING KNOWLEDGE:

${lines}

UNVERIFIED (not in DB — mark as UNVERIFIED, exclude from score):
${lookup.unverified.map(n => `- "${n}"`).join('\n')}`;
}
