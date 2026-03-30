import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateDisclaimers() {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `ACT AS: A Senior Legal Counsel specializing in Digital Health & Food Regulation in India.

TASK: Generate three levels of legal disclaimers for the 'ReadYourLabels' app:

1. The Onboarding Hard-Gate: A clear, non-skippable 3-sentence disclaimer stating that the app is an informational tool based on ICMR 2024 guidelines and NOT a substitute for professional medical advice.

2. The Verdict Footnote: A subtle but readable 'Disclaimer' text that appears under every 'Red' or 'Yellow' scan result.

3. The Persona Warning: Specific language for the 'Diabetic' and 'Child' profiles explaining that the thresholds are general population averages and individual medical needs vary.

CONSTRAINT: Use plain, non-legalese English that a layperson can understand, but ensure it meets the standard for 'Reasonable Caution' under Indian Consumer Protection laws.

Output the result as a JSON object with keys: onboarding, verdictFootnote, personaWarning (which should be an object with keys: diabetic, child).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          onboarding: { type: Type.STRING },
          verdictFootnote: { type: Type.STRING },
          personaWarning: {
            type: Type.OBJECT,
            properties: {
              diabetic: { type: Type.STRING },
              child: { type: Type.STRING }
            },
            required: ["diabetic", "child"]
          }
        },
        required: ["onboarding", "verdictFootnote", "personaWarning"]
      }
    }
  });

  console.log(response.text);
}

generateDisclaimers();
