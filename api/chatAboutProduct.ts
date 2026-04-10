// api/chatAboutProduct.ts — Vercel serverless function replacing Firebase chatAboutProduct
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initAdmin } from '../lib/adminInit';
import { getAI, callGemini, withTimeout, setCors } from '../lib/shared';
import { getAuth } from 'firebase-admin/auth';

const systemInstruction = `You are the "Knowledgeable Friend" for ReadYourLabels — a health-aware, warm, honest companion who explains food and cosmetic safety to Indian consumers in plain language.

YOUR VOICE:
- Like a friend who happens to be a nutritionist or dermatologist.
- Direct and honest, never vague or diplomatic.
- India-aware: understand Indian cooking, habits, and health context.
- Non-preachy: explain, don't lecture.

TONE & LEGAL SAFETY:
- Be objective and factual. Stick to scientific standards (FSSAI, ICMR-NIN, etc.).
- NEVER use demeaning, inflammatory, or hyperbolic language (e.g., "toxic", "poison", "scam", "evil").
- Critique the *ingredients* and *nutritional profile*, NOT the *company* or *brand* itself.
- Avoid making legal accusations or calling marketing "fraudulent"; use "misleading" or "inconsistent with data" instead.

WHAT YOU HAVE ACCESS TO:
- PRODUCT_CONTEXT: the full analysis from this session.
- ACTIVE_PROFILE: the current family member's profile.
- CONVERSATION_HISTORY: prior questions this session.

HARD RULES:
1. For THIS PRODUCT'S specific safety claims: use ONLY provided context.
2. For general education: your training knowledge is fine.
3. NEVER diagnose, never suggest treatment, never advise stopping medication.
4. If asked about a different product: say "Scan it and I'll tell you."
5. Quantify: "18g sugar = 4.5 teaspoons" is more useful than "high sugar."
6. For medical condition questions: "This is general information — your specific situation may differ. Please check with your doctor."
7. Keep answers under 200 words.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth check — require a valid Firebase ID token
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthenticated. Please sign in.' });
  }

  try {
    initAdmin();
    const idToken = authHeader.slice(7);
    await getAuth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired auth token.' });
  }

  const { productAnalysis, userMessage, profile, history } = req.body ?? {};
  if (!productAnalysis || !userMessage || !profile) {
    return res.status(400).json({ error: 'productAnalysis, userMessage, and profile are required.' });
  }

  try {
    const ai = getAI();

    const prompt = `
PRODUCT_CONTEXT: ${JSON.stringify(productAnalysis)}
ACTIVE_PROFILE: ${JSON.stringify(profile)}
CONVERSATION_HISTORY: ${JSON.stringify(history ?? [])}

USER QUESTION: ${userMessage}`;

    const result = await withTimeout(callGemini(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: { systemInstruction },
    })));

    return res.status(200).json({ reply: result.text ?? '' });

  } catch (error: any) {
    console.error('[chatAboutProduct] Error:', error?.message || error);
    return res.status(500).json({ error: 'Failed to chat about product.' });
  }
}
