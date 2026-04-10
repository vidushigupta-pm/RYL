// api/_adminInit.ts
// Initialises Firebase Admin SDK for Vercel serverless functions.
// Uses a base64-encoded service account JSON stored in FIREBASE_SERVICE_ACCOUNT_BASE64.

import { initializeApp, getApps, cert } from 'firebase-admin/app';

export function initAdmin() {
  if (getApps().length > 0) return; // already initialised

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 env variable is not set.');
  }

  const serviceAccount = JSON.parse(
    Buffer.from(b64, 'base64').toString('utf-8')
  );

  initializeApp({ credential: cert(serviceAccount) });
}
