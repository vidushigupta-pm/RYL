# ReadYourLabels

**India's Honest Ingredient Truth-Teller**

Scan any packaged product — food, cosmetics, personal care, supplements, pet food — and get a plain-language verdict grounded in FSSAI, ICMR-NIN, CDSCO, BIS, and EWG standards. Unmask misleading claims. Know what's really inside.

---

## Features

- **Label Scan** — photograph the back of any pack; Gemini AI extracts and analyses every ingredient
- **Name Search** — search by product name if you don't have the pack handy
- **Barcode Scan** — instant product identification
- **Honest Score** — 0–100 score with full breakdown of deductions and bonuses
- **Claim Unmasker** — flags misleading front-of-pack claims ('Natural', 'No Added Sugar', 'No MSG', etc.)
- **Family Vault** — create profiles for kids, seniors, and members with health conditions for personalised alerts
- **Ingredient DB** — 12,000+ ingredients cross-referenced against Indian regulatory databases
- **6 Categories** — Food, Cosmetics, Personal Care, Supplements, Household, Pet Food
- **Scan History** — saved across devices for signed-in users

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Animation | Motion (Framer Motion) |
| Backend | Vercel Serverless Functions (Node.js) |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Database | Firebase Firestore (named DB) |
| Auth | Firebase Auth (email + Google OAuth) |
| Hosting | Vercel |
| Ingredient DB | SQLite (bundled, via `better-sqlite3`) |

---

## Local Development

### Prerequisites
- Node.js 18+
- A Firebase project with Firestore enabled
- A Google AI Studio API key (Gemini) with billing enabled

### Setup

```bash
git clone https://github.com/vidushigupta-pm/RYL.git
cd RYL
npm install
```

Create a `.env` file in the root (never commit this):

```env
# Gemini API (get from aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key

# Firebase Admin SDK (for Vercel serverless functions)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="your_private_key"
FIRESTORE_DB_ID=your_named_db_id

# Admin dashboard protection
ADMIN_TOKEN=your_secret_admin_token
```

Update `src/firebase.ts` with your Firebase web config.

### Run

```bash
npm run dev        # Frontend only (Vite)
vercel dev         # Full stack including serverless functions
```

---

## Deployment

Deployed on **Vercel**. Every push to `main` triggers an automatic deployment.

All environment variables must be set in **Vercel → Settings → Environment Variables** — never hardcoded in source files.

---

## Project Structure

```
RYL/
├── api/                        # Vercel serverless functions
│   ├── analyseLabel.ts         # Image-based label analysis
│   ├── searchProductByName.ts  # Name-based product search
│   ├── chatAboutProduct.ts     # AI chat about a scanned product
│   └── adminStats.ts           # Admin dashboard data
├── functions/src/              # Shared business logic
│   ├── ragService.ts           # Product cache (RAG layer)
│   ├── scoringEngine.ts        # Score calculation engine
│   ├── data.ts                 # Ingredient DB queries
│   └── profileScoringEngine.ts # Family profile personalisation
├── lib/
│   ├── shared.ts               # Gemini client, CORS, helpers
│   └── adminInit.ts            # Firebase Admin SDK init
├── src/
│   ├── App.tsx                 # Main React app
│   ├── firebase.ts             # Firebase client config
│   └── services/               # Client-side services
└── scripts/
    └── seedProducts.ts         # Seed initial product cache
```

---

## Regulatory Grounding

Results are based on:
- **FSSAI** — Food Safety and Standards Authority of India
- **ICMR-NIN** — Indian Council of Medical Research – National Institute of Nutrition
- **CDSCO** — Central Drugs Standard Control Organisation
- **BIS** — Bureau of Indian Standards
- **EWG** — Environmental Working Group (cosmetics safety)

> **Disclaimer:** ReadYourLabels is an informational tool and is NOT a substitute for professional medical advice. Always consult a qualified doctor or nutritionist before making significant dietary or health decisions.

---

## License

Private — all rights reserved.
