import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const PRODUCT_CATEGORIES = [
  { id: "FOOD", label: "Food & Drink", emoji: "🥗" },
  { id: "COSMETIC", label: "Cosmetics", emoji: "💄" },
  { id: "PERSONAL_CARE", label: "Personal Care", emoji: "🧴" },
  { id: "SUPPLEMENT", label: "Supplement", emoji: "💊" },
  { id: "HOUSEHOLD", label: "Household", emoji: "🧹" },
  { id: "PET_FOOD", label: "Pet Food", emoji: "🐾" },
];

const DEFAULT_RESULT = {
  product_name: "Unknown Product",
  brand: "Unknown Brand",
  category: "FOOD",
  ingredients: [],
  nutrition: {
    energy_kcal: 0,
    sugar_g: 0,
    sodium_mg: 0,
    protein_g: 0,
    fat_g: 0,
    saturated_fat_g: 0,
    trans_fat_g: 0,
    fibre_g: 0
  },
  overall_score: 0,
  score_breakdown: [],
  summary: "Analysis failed. Please try again.",
  india_context: "",
  claim_checks: [],
  front_claims_detected: [],
  unverified_ingredients: []
};

function safeJsonParse(text: string | undefined): any {
  if (!text || !text.trim()) {
    console.error("Gemini returned empty text");
    return DEFAULT_RESULT;
  }
  
  let cleaned = text.trim();
  
  try {
    // 1. Remove markdown code blocks if present
    if (cleaned.includes('```')) {
      const match = cleaned.match(/```(?:json)?([\s\S]*?)```/);
      if (match && match[1]) {
        cleaned = match[1].trim();
      } else {
        cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
      }
    }

    // 2. Isolate the main JSON object
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // 3. Remove trailing commas which are invalid in standard JSON
    // The \s* handles newlines and spaces
    cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

    // 4. Attempt to fix missing commas between objects/arrays (common LLM error)
    // e.g., } { -> }, {  or ] [ -> ], [
    cleaned = cleaned.replace(/}\s*{/g, '},{').replace(/]\s*\[/g, '],[')
                     .replace(/}\s*\[/g, '},[').replace(/]\s*{/g, '],{');
    
    const parsed = JSON.parse(cleaned);
    return { ...DEFAULT_RESULT, ...parsed };
  } catch (e) {
    console.error("Failed to parse JSON response from Gemini:", e);
    // Log a snippet of the problematic area if possible
    if (e instanceof Error && 'position' in (e as any)) {
      const pos = (e as any).position;
      console.log("Error at position:", pos, "Snippet:", cleaned.substring(Math.max(0, pos - 50), Math.min(cleaned.length, pos + 50)));
    }
    console.log("Raw text was:", text);
    return DEFAULT_RESULT;
  }
}

export async function chatAboutProduct(productAnalysis: any, userMessage: string, profile: any, history: any[]) {
  const model = "gemini-3.1-pro-preview";

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

  const prompt = `
PRODUCT_CONTEXT: ${JSON.stringify(productAnalysis)}
ACTIVE_PROFILE: ${JSON.stringify(profile)}
CONVERSATION_HISTORY: ${JSON.stringify(history)}

USER QUESTION: ${userMessage}`;

  const result = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction,
    },
  });

  return result.text;
}

export async function analyseLabel(backImageBase64: string, backMimeType: string, frontImageBase64?: string, frontMimeType?: string) {
  const model = "gemini-3.1-pro-preview";

  const systemInstruction = `You are ReadYourLabels — India's honest ingredient analyser for packaged products.
  
You receive one or two images:
- IMAGE 1 (BACK of pack) — MANDATORY. Contains ingredients + nutritional table.
- IMAGE 2 (FRONT of pack) — OPTIONAL. Contains brand name, claims, marketing.

Your job is to:
1. Extract and structure label data.
2. Assess ingredient safety based on FSSAI, ICMR-NIN 2024, CDSCO, and BIS standards.
3. Unmask misleading marketing claims if a front image is provided.
4. Calculate an overall safety score (0-100).

TONE & LEGAL SAFETY:
- Be objective, factual, and neutral.
- Use scientific terminology and reference standards (FSSAI, ICMR-NIN 2024).
- NEVER use demeaning or inflammatory language. Do not attack companies or brands.
- Focus strictly on the data: ingredients and nutrition.
- Use words like "misleading", "inconsistent", or "high-risk" instead of "fraud", "scam", or "toxic".

NUTRITION EXTRACTION RULE:
- If the nutritional table is present but blurry or partially cropped, try your best to extract the core values (Energy, Sugar, Sodium, Protein).
- If the table is completely missing or unreadable, but you can identify the product (e.g., from the front image or brand name), use your internal knowledge of standard Indian products to provide estimated values.
- If you use estimates or internal knowledge, mention this in the "summary".

SCORING LOGIC:
- Start at 70.
- Deduct for high sugar (>10g/100g), high sodium (>500mg/100g), trans fats (>0.2g), AVOID/BANNED ingredients.
- Add for high protein, high fibre.
- Adjust for NOVA processing level (NOVA 4 = -20).

SAFETY TIERS: SAFE, CAUTION, AVOID, BANNED_IN_INDIA, UNVERIFIED.

CRITICAL: Respond with VALID JSON ONLY. Do NOT include trailing commas in arrays or objects.

Respond in JSON format only.`;

  const prompt = `Analyse this product label.
${frontImageBase64 ? "I have provided both the front and back of the pack." : "I have only provided the back of the pack."}

Return a JSON object matching this schema:
{
  "product_name": string,
  "brand": string,
  "category": "FOOD" | "COSMETIC" | "PERSONAL_CARE" | "SUPPLEMENT" | "HOUSEHOLD" | "PET_FOOD",
  "category_confidence": "HIGH" | "MEDIUM" | "LOW",
  "parsing_confidence": "HIGH" | "MEDIUM" | "LOW",
  "front_claims_detected": string[],
  "claim_checks": [
    {
      "claim": string,
      "verdict": "CONFIRMED" | "MISLEADING" | "PARTIALLY_TRUE" | "UNVERIFIABLE",
      "explanation": string,
      "evidence": string
    }
  ],
  "ingredients": [
    {
      "name": string,
      "plain_name": string,
      "function": string,
      "safety_tier": "SAFE" | "CAUTION" | "AVOID" | "BANNED_IN_INDIA" | "UNVERIFIED",
      "plain_explanation": string,
      "flag_for": string[]
    }
  ],
  "nutrition": {
    "energy_kcal": number,
    "sugar_g": number,
    "sodium_mg": number,
    "protein_g": number,
    "fat_g": number,
    "saturated_fat_g": number,
    "trans_fat_g": number,
    "fibre_g": number
  },
  "overall_score": number,
  "score_breakdown": [
    {
      "label": string,
      "impact": number,
      "explanation": string
    }
  ],
  "summary": string,
  "india_context": string,
  "unverified_ingredients": string[]
}

SCORING LOGIC DETAILS:
- Starting Score: 100.
- Deductions:
  - Sugar: -10 to -40 based on severity (e.g., >50% sugar = -40).
  - Sodium: -10 to -25.
  - Trans Fats: -15.
  - NOVA 4: -20.
  - Harmful/Avoid Ingredients: -5 to -15 each.
- Additions:
  - Protein: +5 to +10.
  - Fibre: +5 to +10.

LOGIC RULE:
1. The "overall_score" and "score_breakdown" should represent the product's healthiness for a general healthy adult.
2. DO NOT include profile-specific deductions (like Diabetes or Allergies) in the "overall_score" or "score_breakdown". These will be calculated separately by the app logic.
3. In "score_breakdown", provide specific labels and detailed explanations that quantify the findings.`;

  const parts = [
    { text: prompt },
    {
      inlineData: {
        mimeType: backMimeType,
        data: backImageBase64,
      },
    },
  ];

  if (frontImageBase64 && frontMimeType) {
    parts.push({
      inlineData: {
        mimeType: frontMimeType,
        data: frontImageBase64,
      },
    });
  }

  const result = await ai.models.generateContent({
    model,
    contents: [{ parts }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
    },
  });

  return safeJsonParse(result.text);
}

export async function searchProductByName(productName: string) {
  // Using Flash for faster tool usage and reliable search grounding
  const model = "gemini-3-flash-preview";

  const systemInstruction = `You are ReadYourLabels — India's honest ingredient analyser for packaged products.
  
You will be given a product name. Your job is to:
1. ALWAYS use the Google Search tool to find the exact ingredients list and nutritional table for this product in India.
2. Search for variations like "${productName} ingredients India", "${productName} nutrition facts", and "${productName} pack back".
3. If the search tool returns results, extract the data accurately.
4. If the search tool fails or returns no clear ingredients, but you have internal knowledge of this specific product (especially for famous Indian brands like Maggi, Parle-G, Amul, Oreo, etc.), you MUST use your internal knowledge to provide a high-quality analysis. Do NOT return "Unknown Product" if you know what the product is.
5. If the query is broad (e.g., just "Maggi"), analyze the most popular version of that product in India (e.g., Maggi 2-Minute Masala Noodles).
6. Assess ingredient safety based on FSSAI, ICMR-NIN 2024, CDSCO, and BIS standards.
7. Calculate an overall safety score (0-100) based on the same logic as label analysis.
8. Return ONLY a valid JSON object. No other text.

TONE & LEGAL SAFETY:
- Be objective, factual, and neutral.
- Focus on the product's ingredients and nutrition, not the company's reputation.
- Avoid inflammatory language. Use "misleading" instead of "scam".
- Ensure all claims are grounded in the data found.

SCORING LOGIC: Start at 100. Deduct for Sugar (-10 to -40), Sodium (-10 to -25), Trans Fats (-15), NOVA 4 (-20), Harmful Ingredients (-5 to -15). Add for Protein (+5 to +10), Fibre (+5 to +10).

CRITICAL: Respond with VALID JSON ONLY. Do NOT include trailing commas in arrays or objects.`;

  const prompt = `Search for and analyze the product: "${productName}". 
  1. Use the googleSearch tool to find its ingredients and nutrition facts in India.
  2. If search is inconclusive, use your extensive internal knowledge of Indian packaged goods.
  3. Ensure all numeric values in "nutrition" are numbers, not strings.
  4. Ensure "safety_tier" is one of the allowed enum values.
  
  Return ONLY the following JSON structure:
{
  "product_name": string,
  "brand": string,
  "category": "FOOD" | "COSMETIC" | "PERSONAL_CARE" | "SUPPLEMENT" | "HOUSEHOLD" | "PET_FOOD",
  "category_confidence": "HIGH",
  "parsing_confidence": "HIGH",
  "front_claims_detected": string[],
  "claim_checks": [],
  "ingredients": [
    {
      "name": string,
      "plain_name": string,
      "function": string,
      "safety_tier": "SAFE" | "CAUTION" | "AVOID" | "BANNED_IN_INDIA" | "UNVERIFIED",
      "plain_explanation": string,
      "flag_for": string[]
    }
  ],
  "nutrition": {
    "energy_kcal": number,
    "sugar_g": number,
    "sodium_mg": number,
    "protein_g": number,
    "fat_g": number,
    "saturated_fat_g": number,
    "trans_fat_g": number,
    "fibre_g": number
  },
  "overall_score": number,
  "score_breakdown": [
    {
      "label": string,
      "impact": number,
      "explanation": string
    }
  ],
  "summary": string,
  "india_context": string,
  "unverified_ingredients": string[]
}`;

  const result = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
    },
  });

  return safeJsonParse(result.text);
}
