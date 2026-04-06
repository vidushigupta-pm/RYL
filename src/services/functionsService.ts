// src/services/functionsService.ts
// Calls Firebase Cloud Functions instead of making direct client-side Gemini calls.
// This bypasses regional API quota restrictions — Functions run on US servers.

import { functions, httpsCallable } from '../firebase';

const analyseLabelFn = httpsCallable(functions, 'analyseLabel');
const searchProductFn = httpsCallable(functions, 'searchProductByName');
const chatAboutProductFn = httpsCallable(functions, 'chatAboutProduct');

export async function analyseLabel(
  backImageBase64: string,
  backMimeType: string,
  frontImageBase64?: string,
  frontMimeType?: string
): Promise<any> {
  try {
    const result = await analyseLabelFn({
      backImageBase64,
      backMimeType,
      frontImageBase64,
      frontMimeType,
    });
    return result.data;
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error('❌ analyseLabel (function) failed:', msg);
    return { product_name: '__ERROR__', summary: msg };
  }
}

export async function searchProductByName(productName: string): Promise<any> {
  try {
    const result = await searchProductFn({ productName });
    return result.data;
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error('❌ searchProductByName (function) failed:', msg);
    return { product_name: '__ERROR__', summary: msg };
  }
}

export async function chatAboutProduct(
  productAnalysis: any,
  userMessage: string,
  profile: any,
  history: any[]
): Promise<any> {
  try {
    const result = await chatAboutProductFn({
      productAnalysis,
      userMessage,
      profile,
      history,
    });
    return result.data;
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error('❌ chatAboutProduct (function) failed:', msg);
    return { response: 'Sorry, I could not process your question. Please try again.' };
  }
}
