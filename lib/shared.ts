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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ── Gemini client ─────────────────────────────────────────────────────────────
export function getAI(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY env variable is not set.');
  return new GoogleGenAI({ apiKey: key });
}

// ── Retry wrapper ─────────────────────────────────────────────────────────────
export async function callGemini<T>(fn: () => Promise<T>, retries = 4, delay = 3000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const msg = JSON.stringify(error);
    const retryable = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') ||
                      msg.includes('503') || msg.includes('UNAVAILABLE');
    if (retryable && retries > 0) {
      await new Promise(r => setTimeout(r, delay));
      return callGemini(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// ── Timeout wrapper ───────────────────────────────────────────────────────────
export function withTimeout<T>(promise: Promise<T>, ms = 55_000): Promise<T> {
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
