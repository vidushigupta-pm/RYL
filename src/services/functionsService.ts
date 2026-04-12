// src/services/functionsService.ts
// In DEV:  calls Firebase emulator via httpsCallable (unchanged local workflow)
// In PROD: calls Vercel API routes via fetch (no Firebase Cloud Functions needed)

import { auth, functions, httpsCallable } from '../firebase';

const IS_DEV = import.meta.env.DEV;

// ── Generic fetch helper for Vercel API routes ────────────────────────────────
async function callApi(path: string, body: Record<string, unknown>, requiresAuth = false) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (requiresAuth) {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be signed in to use this feature.');
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });

  // Vercel returns a plain HTML 504 page on timeout — not JSON.
  // Safely parse, fall back to a timeout message if it fails.
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    if (res.status === 504 || res.status === 524) {
      throw new Error('__TIMEOUT__');
    }
    throw new Error(`Unexpected response from server (status ${res.status}). Please try again.`);
  }

  if (!res.ok) {
    // Use the human-friendly message when the API provides one (e.g. quota errors)
    const message = data?.friendly || data?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data;
}

// ── analyseLabel ──────────────────────────────────────────────────────────────
export async function analyseLabel(
  backImageBase64: string,
  backMimeType: string,
  frontImageBase64?: string,
  frontMimeType?: string
): Promise<any> {
  const userId = auth.currentUser?.uid || 'guest';
  try {
    if (IS_DEV) {
      const fn = httpsCallable(functions, 'analyseLabel');
      const result = await fn({ backImageBase64, backMimeType, frontImageBase64, frontMimeType });
      return result.data;
    }
    return await callApi('/api/analyseLabel', { backImageBase64, backMimeType, frontImageBase64, frontMimeType, userId });
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error('❌ analyseLabel failed:', msg);
    return { product_name: '__ERROR__', summary: msg };
  }
}

// ── searchProductByName ───────────────────────────────────────────────────────
export async function searchProductByName(productName: string): Promise<any> {
  const userId = auth.currentUser?.uid || 'guest';
  try {
    if (IS_DEV) {
      const fn = httpsCallable(functions, 'searchProductByName');
      const result = await fn({ productName });
      return result.data;
    }
    return await callApi('/api/searchProductByName', { productName, userId });
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error('❌ searchProductByName failed:', msg);
    return { product_name: '__ERROR__', summary: msg };
  }
}

// ── chatAboutProduct ──────────────────────────────────────────────────────────
export async function chatAboutProduct(
  productAnalysis: any,
  userMessage: string,
  profile: any,
  history: any[]
): Promise<string> {
  try {
    if (IS_DEV) {
      const fn = httpsCallable(functions, 'chatAboutProduct');
      const result = await fn({ productAnalysis, userMessage, profile, history });
      return result.data as string;
    }
    const data = await callApi('/api/chatAboutProduct', { productAnalysis, userMessage, profile, history }, true);
    return data.reply as string;
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error('❌ chatAboutProduct failed:', msg);
    return 'Sorry, I could not process your question. Please try again.';
  }
}
