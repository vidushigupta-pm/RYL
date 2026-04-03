// src/services/ragService.ts
// ─────────────────────────────────────────────────────────────────────────────
// RAG service: DB-first lookup ladder before any LLM call.
// Layer 1: Exact product cache (Firestore)
// Layer 2: Ingredient DB coverage ≥ 80% → score in code, LLM writes summary
// Layer 3: Partial coverage → RAG-grounded LLM call
// Layer 4: Unknown product → full LLM, save to DB after
// ─────────────────────────────────────────────────────────────────────────────

import { db, auth } from '../firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  query, where, orderBy, limit, Timestamp
} from 'firebase/firestore';
import {
  batchLookupIngredients,
  lookupIngredient,
  normaliseIngredientName,
  INGREDIENT_DB,
  BatchLookupResult
} from '../data/ingredientIntelligence';
import { calculateScore, NutritionData } from './scoringEngine';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CachedProduct {
  id: string;
  barcode?: string;
  product_name: string;
  brand: string;
  category: string;
  ingredients_list: string[];
  nutrition: NutritionData | null;
  front_claims: string[];
  cached_verdict: any;   // full result JSON, ready to serve
  verdict_computed_at: Timestamp;
  data_source: 'VERIFIED' | 'LLM_GENERATED' | 'COMMUNITY';
}

export interface RAGLookupResult {
  layer: 1 | 2 | 3 | 4;
  cached_verdict?: any;           // Layer 1: ready to return immediately
  partial_result?: Partial<any>;  // Layer 2/3: to augment with LLM
  ground_truth_bundle?: string;   // Layer 3: inject into LLM prompt
  needs_llm: boolean;
  llm_task?: 'SUMMARY_ONLY' | 'GAPS_ONLY' | 'FULL';
}

// ── Layer 1: Exact product match ──────────────────────────────────────────

export async function checkProductCache(
  productName: string,
  barcode?: string
): Promise<CachedProduct | null> {
  try {
    // Barcode match (fastest)
    if (barcode) {
      const q = query(
        collection(db, 'products'),
        where('barcode', '==', barcode),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as CachedProduct;
      }
    }

    // Exact name match
    const normName = normaliseIngredientName(productName);
    const q = query(
      collection(db, 'products'),
      where('name_aliases', 'array-contains', normName),
      limit(1)
    );
    const snap = await getDocs(q);
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

// ── Save product to DB after LLM analysis ────────────────────────────────

export async function saveProductToCache(
  analysisResult: any,
  barcode?: string
): Promise<void> {
  if (!auth.currentUser) {
    console.log(`[RAG] Skipping product cache: user not authenticated.`);
    return;
  }
  try {
    const normName = normaliseIngredientName(analysisResult.product_name || '');
    const normBrand = normaliseIngredientName(analysisResult.brand || '');
    
    // Create a deterministic ID: brand-productname or just productname
    const docId = normBrand 
      ? `${normBrand}-${normName}`.replace(/\s+/g, '-').toLowerCase()
      : normName.replace(/\s+/g, '-').toLowerCase();

    if (!docId) return;

    const aliases = [
      normName,
      ...(analysisResult.brand ? [normaliseIngredientName(analysisResult.brand + ' ' + analysisResult.product_name)] : [])
    ].filter(Boolean);

    await setDoc(doc(db, 'products', docId), {
      barcode: barcode || null,
      product_name: analysisResult.product_name,
      brand: analysisResult.brand,
      category: analysisResult.category,
      name_aliases: aliases,
      ingredients_list: (analysisResult.ingredients || []).map((i: any) => i.name),
      nutrition: analysisResult.nutrition || null,
      front_claims: analysisResult.front_claims_detected || [],
      cached_verdict: analysisResult,
      verdict_computed_at: Timestamp.now(),
      data_source: 'LLM_GENERATED'
    }, { merge: true }); // Use merge to preserve any manually verified fields if they exist
    
    console.log(`[RAG] Product cached successfully: ${docId}`);
  } catch (error) {
    console.error('Failed to save product to cache:', error);
    // Non-critical — don't throw
  }
}

// ── Core RAG lookup function ──────────────────────────────────────────────

export async function ragLookup(params: {
  productName?: string;
  barcode?: string;
  extractedIngredients?: string[];   // from OCR Pass 1
  nutrition?: NutritionData | null;
  productCategory?: string;
}): Promise<RAGLookupResult> {

  const { productName, barcode, extractedIngredients, nutrition, productCategory } = params;

  // ── LAYER 1: Exact product cache ──────────────────────────────────────────
  if (productName || barcode) {
    const cached = await checkProductCache(productName || '', barcode);
    if (cached?.cached_verdict) {
      console.log('[RAG] Layer 1 hit — returning cached verdict for:', cached.product_name);
      return {
        layer: 1,
        cached_verdict: cached.cached_verdict,
        needs_llm: false
      };
    }
  }

  // ── LAYER 2 / 3: Ingredient DB lookup ────────────────────────────────────
  if (extractedIngredients && extractedIngredients.length > 0) {
    const lookup = batchLookupIngredients(extractedIngredients);
    console.log(`[RAG] DB coverage: ${lookup.coveragePercent}% (${lookup.verified.length}/${extractedIngredients.length} ingredients found)`);

    // Layer 2: High coverage — score in code, LLM only writes summary
    if (lookup.coveragePercent >= 80) {
      const scoreResult = calculateScore(lookup, nutrition || null, productCategory || 'FOOD');

      // Build partial result from DB data (no LLM needed for ingredients)
      const partialIngredients = lookup.verified.map(({ rawName, entry }) => ({
        name: rawName,
        plain_name: entry.common_names[0] || rawName,
        function: entry.function,
        safety_tier: entry.safety_tier,
        plain_explanation: entry.plain_explanation,
        flag_for: entry.condition_flags.map(f => f.condition),
        source: 'DB_VERIFIED'
      }));

      // Add unverified ones without assessment
      const unverifiedIngredients = lookup.unverified.map(name => ({
        name,
        plain_name: name,
        function: 'Unknown',
        safety_tier: 'UNVERIFIED' as const,
        plain_explanation: 'Not in our verified database. Excluded from safety score.',
        flag_for: [],
        source: 'UNVERIFIED'
      }));

      console.log('[RAG] Layer 2 — scoring in code, LLM only writes summary');
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

    // Layer 3: Partial coverage — inject verified data as ground truth, LLM fills gaps
    if (lookup.coveragePercent >= 40) {
      const groundTruthBundle = buildGroundTruthBundle(lookup);
      console.log('[RAG] Layer 3 — partial RAG, LLM fills gaps');
      return {
        layer: 3,
        ground_truth_bundle: groundTruthBundle,
        needs_llm: true,
        llm_task: 'GAPS_ONLY'
      };
    }
  }

  // ── LAYER 4: Full LLM ─────────────────────────────────────────────────────
  console.log('[RAG] Layer 4 — full LLM fallback');
  return {
    layer: 4,
    needs_llm: true,
    llm_task: 'FULL'
  };
}

// ── Build ground truth bundle for LLM injection ───────────────────────────

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
