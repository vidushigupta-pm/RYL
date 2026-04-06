// src/scripts/runSeed.ts
// ─────────────────────────────────────────────────────────────────────────────
// Seed script: reads SEED_PRODUCTS, computes verdicts using the scoring engine
// and ingredient DB, then bulk-writes CachedProduct documents to Firestore.
//
// HOW TO RUN:
//   1. Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account key:
//      export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
//   2. Set FIREBASE_PROJECT_ID:
//      export FIREBASE_PROJECT_ID="your-firebase-project-id"
//   3. Run: npx tsx src/scripts/runSeed.ts
//
// OR if using Application Default Credentials (ADC) from gcloud CLI:
//   gcloud auth application-default login
//   FIREBASE_PROJECT_ID=your-project-id npx tsx src/scripts/runSeed.ts
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, WriteBatch } from 'firebase-admin/firestore';
import { SEED_PRODUCTS, SeedProduct } from './seedProducts';
import { batchLookupIngredients } from '../data/ingredientIntelligence';
import { calculateScore } from '../services/scoringEngine';

// ── Firebase Admin init ───────────────────────────────────────────────────────
function initFirebase() {
  if (getApps().length > 0) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      'FIREBASE_PROJECT_ID env var is required.\n' +
      'Run: FIREBASE_PROJECT_ID=your-project-id npx tsx src/scripts/runSeed.ts'
    );
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    // Service account key file
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccount = require(credPath);
    initializeApp({ credential: cert(serviceAccount), projectId });
  } else {
    // Application Default Credentials (gcloud auth application-default login)
    initializeApp({ projectId });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalise(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDocId(product: SeedProduct): string {
  const normName = normalise(product.product_name);
  const normBrand = normalise(product.brand);
  return normBrand
    ? `${normBrand}_${normName}`.replace(/\s+/g, '_')
    : normName.replace(/\s+/g, '_');
}

function buildAliases(product: SeedProduct): string[] {
  const normName = normalise(product.product_name);
  const normBrand = normalise(product.brand);
  const normFull = normalise(product.brand + ' ' + product.product_name);
  const nameTokens = normName.split(/\s+/).filter(t => t.length > 2);
  const brandTokens = normBrand.split(/\s+/).filter(t => t.length > 2);
  return Array.from(new Set([
    normName,
    normBrand,
    normFull,
    ...nameTokens,
    ...brandTokens
  ])).filter(Boolean);
}

function buildCachedVerdict(product: SeedProduct) {
  const lookup = batchLookupIngredients(product.ingredients);
  const scoreResult = calculateScore(lookup, product.nutrition, product.category);

  const verifiedIngredients = lookup.verified.map(({ rawName, entry }) => ({
    name: rawName,
    plain_name: entry.common_names[0] || rawName,
    function: entry.function,
    safety_tier: entry.safety_tier,
    plain_explanation: entry.plain_explanation,
    flag_for: entry.condition_flags.map(f => f.condition),
    source: 'DB_VERIFIED'
  }));

  const unverifiedIngredients = lookup.unverified.map(name => ({
    name,
    plain_name: name,
    function: 'Unknown',
    safety_tier: 'UNVERIFIED',
    plain_explanation: 'Not in our verified ingredient database. Excluded from safety score.',
    flag_for: [],
    source: 'UNVERIFIED'
  }));

  // Determine hfss_status based on nutrition
  const n = product.nutrition;
  const isHfss =
    (n.fat_g > 17.5) ||
    (n.saturated_fat_g > 5) ||
    (n.sugar_g > 22.5) ||
    (n.sodium_mg > 1500);

  // Determine if UPF (simplified heuristic: has flavour enhancers or >5 additives)
  const additiveMarkers = ['ins ', 'e1', 'e2', 'e3', 'e4', 'e5', 'flavour', 'colour', 'preservative', 'emulsifier'];
  const additivesFound = product.ingredients.filter(i =>
    additiveMarkers.some(m => i.toLowerCase().includes(m))
  );
  const isUpf = additivesFound.length >= 3;

  // Build summary
  const score = scoreResult.overall_score;
  let summary = '';
  if (score >= 70) {
    summary = `${product.product_name} scores ${score}/100 — a reasonably safe choice. `;
  } else if (score >= 45) {
    summary = `${product.product_name} scores ${score}/100 — moderate concerns noted. `;
  } else {
    summary = `${product.product_name} scores ${score}/100 — several ingredient or nutrition concerns detected. `;
  }
  if (lookup.unverified.length > 0) {
    summary += `${lookup.unverified.length} ingredient(s) could not be verified from our database and were excluded from the score. `;
  }
  if (n.sodium_mg > 800) {
    summary += `High sodium content — watch out if you have hypertension.`;
  } else if (n.sugar_g > 20) {
    summary += `High sugar content — limit portion sizes.`;
  } else if (n.trans_fat_g > 0.2) {
    summary += `Contains trace trans fat — consume in moderation.`;
  }

  return {
    product_name: product.product_name,
    brand: product.brand,
    category: product.category,
    ingredients: [...verifiedIngredients, ...unverifiedIngredients],
    nutrition: product.nutrition,
    overall_score: scoreResult.overall_score,
    score_breakdown: scoreResult.score_breakdown,
    summary: summary.trim(),
    india_context: `Commonly available across India in kirana stores, supermarkets and e-commerce platforms.`,
    is_upf: isUpf,
    hfss_status: isHfss ? 'HFSS' : 'GREEN',
    suggestions: [],
    front_claims_detected: product.front_claims || [],
    unverified_ingredients: lookup.unverified,
    is_score_suppressed: scoreResult.is_suppressed,
    suppression_reason: scoreResult.suppression_reason,
    claim_checks: [],
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  initFirebase();
  const db = getFirestore();

  console.log(`\n🌱 Starting seed — ${SEED_PRODUCTS.length} products to write...\n`);

  let written = 0;
  let skipped = 0;
  let errors = 0;

  // Firestore batch limit = 500 ops. We do set() per product so limit is 500 per batch.
  const BATCH_SIZE = 400; // safe margin under 500
  let batch: WriteBatch = db.batch();
  let batchCount = 0;

  for (const product of SEED_PRODUCTS) {
    try {
      const docId = buildDocId(product);
      const aliases = buildAliases(product);
      const cachedVerdict = buildCachedVerdict(product);
      const docRef = db.collection('products').doc(docId);

      // Skip if already exists and is not stale
      const existing = await docRef.get();
      if (existing.exists) {
        const data = existing.data();
        if (data?.data_source === 'VERIFIED') {
          console.log(`  ⏭  Skipping (already VERIFIED): ${product.product_name}`);
          skipped++;
          continue;
        }
      }

      batch.set(docRef, {
        product_name: product.product_name,
        brand: product.brand,
        category: product.category,
        name_aliases: aliases,
        ingredients_list: product.ingredients,
        nutrition: product.nutrition,
        front_claims: product.front_claims || [],
        cached_verdict: cachedVerdict,
        verdict_computed_at: Timestamp.now(),
        data_source: 'VERIFIED',
        needs_reverification: false,
      }, { merge: false }); // overwrite existing LLM_GENERATED docs with VERIFIED data

      batchCount++;
      written++;
      console.log(`  ✅ Queued: ${product.product_name} (score: ${cachedVerdict.overall_score})`);

      // Commit batch when full
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`\n  📦 Committed batch of ${batchCount} products.\n`);
        batch = db.batch();
        batchCount = 0;
      }

    } catch (err: any) {
      console.error(`  ❌ Error processing ${product.product_name}:`, err.message);
      errors++;
    }
  }

  // Commit any remaining
  if (batchCount > 0) {
    await batch.commit();
    console.log(`\n  📦 Committed final batch of ${batchCount} products.\n`);
  }

  console.log('\n──────────────────────────────────────────');
  console.log(`✅ Seed complete!`);
  console.log(`   Written : ${written}`);
  console.log(`   Skipped : ${skipped} (already VERIFIED)`);
  console.log(`   Errors  : ${errors}`);
  console.log('──────────────────────────────────────────\n');
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err);
  process.exit(1);
});
