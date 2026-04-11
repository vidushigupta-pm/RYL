// lib/shared.ts — shared helpers for all Vercel API routes

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { batchLookupIngredients, BatchLookupResult } from '../functions/src/data';
import { calculateScore, NutritionData } from '../functions/src/scoringEngine';
import { ragLookup, saveProductToCache } from '../functions/src/ragService';

export { batchLookupIngredients, calculateScore, ragLookup, saveProductToCache };
export type { BatchLookupResult, NutritionData, VercelRequest, VercelResponse };

export const VALID_CATEGORIES = ['FOOD', 'COSMETIC', 'PERSONAL_CARE', 'SUPPLEMENT', 'HOUSEHOLD', 'PET_FOOD'];

// ── CORS headers ─────────────────────────────────────────────────────────────
export function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
}

// ── Gemini client with key + model rotation ───────────────────────────────────
// Supports up to 3 API keys: GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3
// On 429, rotates through all keys, then falls back to the next model.
// Each model has its own separate 1500 RPD free-tier quota pool.
// Keys × Models = total daily capacity: 3 keys × 3 models = 9× quota.
const MODEL_FALLBACKS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

function getApiKeys(): string[] {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean) as string[];
  if (keys.length === 0) throw new Error('No GEMINI_API_KEY env variable is set.');
  return keys;
}

export function getAI(keyIndex = 0): GoogleGenAI {
  const keys = getApiKeys();
  const key = keys[keyIndex % keys.length];
  return new GoogleGenAI({ apiKey: key });
}

// fn receives (ai, model) so it can substitute the model dynamically
export async function callGemini<T>(
  fn: (ai: GoogleGenAI, model: string) => Promise<T>,
  keyIndex = 0,
  modelIndex = 0,
  retries = 10,
  delay = 1000
): Promise<T> {
  const keys = getApiKeys();
  const model = MODEL_FALLBACKS[modelIndex % MODEL_FALLBACKS.length];
  const ai = getAI(keyIndex);

  try {
    return await fn(ai, model);
  } catch (error: any) {
    const msg = JSON.stringify(error) + String(error?.message || '');
    const isQuota = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
    const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('500');

    if (isQuota && retries > 0) {
      // 1. Try next API key (same model)
      const nextKeyIndex = keyIndex + 1;
      if (nextKeyIndex < keys.length) {
        console.log(`[Gemini] Key ${keyIndex}/${model} quota exceeded → rotating to key ${nextKeyIndex}`);
        return callGemini(fn, nextKeyIndex, modelIndex, retries - 1, delay);
      }
      // 2. All keys for this model exhausted → try next model with key 0
      const nextModelIndex = modelIndex + 1;
      if (nextModelIndex < MODEL_FALLBACKS.length) {
        const nextModel = MODEL_FALLBACKS[nextModelIndex];
        console.log(`[Gemini] All keys exhausted for ${model} → falling back to ${nextModel}`);
        return callGemini(fn, 0, nextModelIndex, retries - 1, delay);
      }
      // 3. All keys AND all models exhausted → wait, then restart from beginning
      console.log(`[Gemini] All keys & models quota exceeded, waiting ${delay}ms before retry`);
      await new Promise(r => setTimeout(r, delay));
      return callGemini(fn, 0, 0, retries - 1, Math.min(delay * 2, 30000));
    }

    if (isTransient && retries > 0) {
      await new Promise(r => setTimeout(r, delay));
      return callGemini(fn, keyIndex, modelIndex, retries - 1, delay * 2);
    }

    throw error;
  }
}

// ── Timeout wrapper ───────────────────────────────────────────────────────────
export function withTimeout<T>(promise: Promise<T>, ms = 58_000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    )
  ]);
}

// ── Build merged ingredient list ──────────────────────────────────────────────
export function buildFinalIngredients(
  rawIngredients: string[],
  ingredientsAnalysis: any[]
): Array<{ rawName: string; entry: any }> {
  const lookup = batchLookupIngredients(rawIngredients);
  const finalVerified: Array<{ rawName: string; entry: any }> = [...lookup.verified];
  const dbVerifiedNames = new Set(lookup.verified.map(v => v.rawName.toLowerCase()));

  for (const ing of ingredientsAnalysis) {
    if (!dbVerifiedNames.has((ing.name || '').toLowerCase())) {
      finalVerified.push({
        rawName: ing.name,
        entry: {
          common_names: [ing.plain_name || ing.name],
          function: ing.function || 'Unknown',
          safety_tier: ing.safety_tier || 'UNVERIFIED',
          plain_explanation: ing.plain_explanation || '',
          condition_flags: (ing.flag_for || []).map((c: string) => ({
            condition: c, impact: 'MODERATE', reason: '',
            source: 'Gemini AI (unverified — not from regulatory DB)'
          })),
          score_impact: ing.safety_tier === 'AVOID' ? -10 : ing.safety_tier === 'BANNED_IN_INDIA' ? -30 : ing.safety_tier === 'CAUTION' ? -3 : 0,
          data_quality: 'LLM_GENERATED',
          fssai_status: 'UNKNOWN',
          ins_number: null,
          india_specific_note: null,
        }
      });
    }
  }
  return finalVerified;
}

// ── Deduplicate an array by lowercase key ─────────────────────────────────────
export function dedup<T>(arr: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return arr.filter(item => {
    const k = key(item).toLowerCase().trim();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ── Format final result object ────────────────────────────────────────────────
export function buildResult(
  product_name: string,
  brand: string,
  category: string,
  nutrition: NutritionData | null,
  finalVerified: Array<{ rawName: string; entry: any }>,
  rawIngredients: string[],
  geminiData: any
) {
  const finalLookupResult: BatchLookupResult = {
    verified: finalVerified,
    unverified: rawIngredients.filter(r => !finalVerified.some(v => v.rawName === r)),
    coveragePercent: rawIngredients.length > 0
      ? Math.round((finalVerified.length / rawIngredients.length) * 100) : 100
  };
  const scoreResult = calculateScore(finalLookupResult, nutrition, category, geminiData.is_upf ?? false);

  return {
    product_name,
    brand,
    category,
    nutrition,
    overall_score: scoreResult.overall_score,
    score_breakdown: scoreResult.score_breakdown,
    summary: geminiData.summary || 'Analysis complete.',
    india_context: geminiData.india_context || '',
    is_upf: geminiData.is_upf ?? false,
    hfss_status: geminiData.hfss_status || 'GREEN',
    suggestions: Array.isArray(geminiData.suggestions) ? geminiData.suggestions : [],
    ingredients: finalVerified.map(v => ({
      name: v.rawName,
      plain_name: (v.entry.common_names || [])[0] || v.rawName,
      function: v.entry.function || 'Unknown',
      safety_tier: v.entry.safety_tier || 'UNVERIFIED',
      plain_explanation: v.entry.plain_explanation || '',
      flag_for: (v.entry.condition_flags || []).map((f: any) => f.condition),
      source: v.entry.data_quality === 'VERIFIED' ? 'DB_VERIFIED' : 'LLM_GENERATED'
    }))
  };
}
