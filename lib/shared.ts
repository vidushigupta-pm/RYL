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

// ── Gemini client with API key rotation ──────────────────────────────────────
// Supports up to 3 API keys: GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3
// On 429, rotates to the next key. Each key has its own 1500 RPD free quota.
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

// fn receives the ai client; the model is fixed at the call site.
// MAX_WAIT_MS: cap any single retry sleep so we never blow Vercel's 60s function limit.
const MAX_WAIT_MS = 8_000;

export async function callGemini<T>(
  fn: (ai: GoogleGenAI) => Promise<T>,
  keyIndex = 0,
  retries = 3,   // reduced from 6 — fail fast when quota is truly exhausted
  delay = 1500
): Promise<T> {
  const keys = getApiKeys();
  const ai = getAI(keyIndex);

  try {
    return await fn(ai);
  } catch (error: any) {
    const msg = JSON.stringify(error) + String(error?.message || '');
    const isQuota = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
    const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('500');

    if (isQuota && retries > 0) {
      // Try next API key first — different key may not be rate-limited yet
      const nextKeyIndex = keyIndex + 1;
      if (nextKeyIndex < keys.length) {
        console.log(`[Gemini] Key ${keyIndex} quota exceeded → rotating to key ${nextKeyIndex}`);
        return callGemini(fn, nextKeyIndex, retries - 1, delay);
      }

      // All keys exhausted — fail immediately instead of waiting and retrying.
      // This caps API calls to exactly N (one per key) when all are quota-limited,
      // and avoids the 8s sleep that was burning extra quota + delaying the error.
      console.log(`[Gemini] All ${keys.length} keys quota exceeded — failing fast. No retry.`);
      throw error;
    }

    if (isTransient && retries > 0) {
      const waitMs = Math.min(delay, MAX_WAIT_MS);
      await new Promise(r => setTimeout(r, waitMs));
      return callGemini(fn, keyIndex, retries - 1, delay * 2);
    }

    throw error;
  }
}

// ── Sanitise cached verdict ───────────────────────────────────────────────────
// Ensures score_breakdown and overall_score are consistent.
// If they differ (stale cache from old scoring engine), reconcile by recomputing
// overall_score from the breakdown so the "WHY THIS SCORE?" maths always adds up.
export function sanitiseCachedVerdict(verdict: any): any {
  if (!verdict || !Array.isArray(verdict.score_breakdown) || verdict.score_breakdown.length === 0) return verdict;
  const overall = Number(verdict.overall_score) || 0;
  const sumOfImpacts = verdict.score_breakdown.reduce((s: number, item: any) => s + (Number(item.impact) || 0), 0);
  const derivedScore = Math.max(0, Math.min(100, 100 + sumOfImpacts));
  if (Math.abs(derivedScore - overall) > 3) {
    // Reconcile: use the breakdown-derived score so the maths is always consistent.
    // Stale caches (from scoring engine updates) cause this — show correct breakdown.
    console.log(`[sanitise] Reconciling stale cache: breakdown derivedScore=${derivedScore} vs stored overall=${overall} → using ${derivedScore}`);
    return { ...verdict, overall_score: derivedScore };
  }
  return verdict;
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

// ── Build merged ingredient list (label order preserved) ─────────────────────
// rawIngredients is the ORDER MASTER — it reflects the label's printed order
// (highest to lowest by weight, as required by FSSAI).
// For each name in rawIngredients we:
//   1. Check verified DB first (most accurate)
//   2. Fall back to Gemini analysis
//   3. Mark as UNVERIFIED if neither has it
export function buildFinalIngredients(
  rawIngredients: string[],
  ingredientsAnalysis: any[]
): Array<{ rawName: string; entry: any }> {
  // Build a fast lookup map from Gemini analysis keyed by lowercase name
  const geminiMap = new Map<string, any>();
  for (const ing of ingredientsAnalysis) {
    const key = (ing.name || '').toLowerCase().trim();
    if (key) geminiMap.set(key, ing);
  }

  // Build a fast lookup map from DB keyed by lowercase rawName
  const lookup = batchLookupIngredients(rawIngredients);
  const dbMap = new Map<string, any>();
  for (const v of lookup.verified) {
    dbMap.set(v.rawName.toLowerCase().trim(), v.entry);
  }

  // Iterate rawIngredients to preserve label order
  const finalVerified: Array<{ rawName: string; entry: any }> = [];

  for (const rawName of rawIngredients) {
    const key = rawName.toLowerCase().trim();

    // Priority 1: verified DB entry
    const dbEntry = dbMap.get(key);
    if (dbEntry) {
      finalVerified.push({ rawName, entry: dbEntry });
      continue;
    }

    // Priority 2: Gemini-analysed entry
    const ing = geminiMap.get(key);
    if (ing) {
      finalVerified.push({
        rawName: ing.name || rawName,
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
      continue;
    }

    // Priority 3: ingredient exists on label but no data at all — still show it
    finalVerified.push({
      rawName,
      entry: {
        common_names: [rawName],
        function: 'Unknown',
        safety_tier: 'UNVERIFIED',
        plain_explanation: '',
        condition_flags: [],
        score_impact: 0,
        data_quality: 'LLM_GENERATED',
        fssai_status: 'UNKNOWN',
        ins_number: null,
        india_specific_note: null,
      }
    });
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
