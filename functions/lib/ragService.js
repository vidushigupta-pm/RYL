"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProductCache = checkProductCache;
exports.saveProductToCache = saveProductToCache;
exports.ragLookup = ragLookup;
const firestore_1 = require("firebase-admin/firestore");
const data_1 = require("./data");
const scoringEngine_1 = require("./scoringEngine");
const getDb = () => (0, firestore_1.getFirestore)();
async function checkProductCache(productName, barcode) {
    try {
        if (barcode) {
            const snap = await getDb().collection('products')
                .where('barcode', '==', barcode)
                .limit(1)
                .get();
            if (!snap.empty) {
                const d = snap.docs[0];
                const cached = { id: d.id, ...d.data() };
                if (cached?.cached_verdict) {
                    const computedAt = cached.verdict_computed_at;
                    if (computedAt) {
                        const ageInDays = (Date.now() - computedAt.toMillis()) / 86400000;
                        if (ageInDays > 90) {
                            console.log('[RAG] Cache expired (>90 days), forcing re-analysis:', cached.product_name);
                            return null;
                        }
                    }
                    if (cached.needs_reverification === true) {
                        console.log('[RAG] Product flagged for re-verification:', cached.product_name);
                        return null;
                    }
                }
                return cached;
            }
        }
        const normName = (0, data_1.normaliseIngredientName)(productName);
        const snap = await getDb().collection('products')
            .where('name_aliases', 'array-contains', normName)
            .limit(1)
            .get();
        if (!snap.empty) {
            const d = snap.docs[0];
            const cached = { id: d.id, ...d.data() };
            if (cached?.cached_verdict) {
                const computedAt = cached.verdict_computed_at;
                if (computedAt) {
                    const ageInDays = (Date.now() - computedAt.toMillis()) / 86400000;
                    if (ageInDays > 90) {
                        console.log('[RAG] Cache expired (>90 days), forcing re-analysis:', cached.product_name);
                        return null;
                    }
                }
                if (cached.needs_reverification === true) {
                    console.log('[RAG] Product flagged for re-verification:', cached.product_name);
                    return null;
                }
            }
            return cached;
        }
        const tokens = normName.split(/\s+/).filter((t) => t.length > 2);
        if (tokens.length > 0) {
            const fuzzySnap = await getDb().collection('products')
                .where('name_aliases', 'array-contains-any', tokens.slice(0, 10))
                .limit(1)
                .get();
            if (!fuzzySnap.empty) {
                const d = fuzzySnap.docs[0];
                return { id: d.id, ...d.data() };
            }
        }
        return null;
    }
    catch (error) {
        console.error('Product cache lookup failed:', error);
        return null;
    }
}
async function saveProductToCache(analysisResult, barcode) {
    try {
        const normName = (0, data_1.normaliseIngredientName)(analysisResult.product_name || '');
        const normBrand = analysisResult.brand ? (0, data_1.normaliseIngredientName)(analysisResult.brand) : '';
        const normFull = (analysisResult.brand && analysisResult.product_name)
            ? (0, data_1.normaliseIngredientName)(analysisResult.brand + ' ' + analysisResult.product_name)
            : '';
        const nameTokens = normName.split(/\s+/).filter((t) => t.length > 2);
        const brandTokens = normBrand ? normBrand.split(/\s+/).filter((t) => t.length > 2) : [];
        const aliases = Array.from(new Set([
            normName,
            ...(normBrand ? [normBrand] : []),
            ...(normFull ? [normFull] : []),
            ...nameTokens,
            ...brandTokens
        ])).filter(Boolean);
        const docId = normBrand
            ? `${normBrand}_${normName}`.replace(/\s+/g, '_').toLowerCase()
            : normName.replace(/\s+/g, '_').toLowerCase();
        if (!docId)
            return;
        await getDb().collection('products').doc(docId).set({
            barcode: barcode || null,
            product_name: analysisResult.product_name,
            brand: analysisResult.brand,
            category: analysisResult.category,
            name_aliases: aliases,
            ingredients_list: (analysisResult.ingredients || []).map((i) => i.name || i),
            nutrition: analysisResult.nutrition || null,
            front_claims: analysisResult.front_claims_detected || [],
            cached_verdict: analysisResult,
            verdict_computed_at: firestore_1.FieldValue.serverTimestamp(),
            data_source: 'LLM_GENERATED',
            needs_reverification: false
        }, { merge: true });
        console.log(`[RAG] Product cached: ${docId}`);
    }
    catch (error) {
        console.error('Failed to save product to cache:', error);
    }
}
async function ragLookup(params) {
    const { productName, barcode, extractedIngredients, nutrition, productCategory } = params;
    if (productName || barcode) {
        const cached = await checkProductCache(productName || '', barcode);
        if (cached?.cached_verdict) {
            return {
                layer: 1,
                cached_verdict: cached.cached_verdict,
                needs_llm: false
            };
        }
    }
    if (extractedIngredients && extractedIngredients.length > 0) {
        const lookup = (0, data_1.batchLookupIngredients)(extractedIngredients);
        if (lookup.coveragePercent >= 80) {
            const scoreResult = (0, scoringEngine_1.calculateScore)(lookup, nutrition || null, productCategory || 'FOOD');
            const partialIngredients = lookup.verified.map(({ rawName, entry }) => ({
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
                plain_explanation: 'Not in our verified database. Excluded from safety score.',
                flag_for: [],
                source: 'UNVERIFIED'
            }));
            return {
                layer: 2,
                partial_result: {
                    ingredients: [...partialIngredients, ...unverifiedIngredients],
                    nutrition,
                    overall_score: scoreResult.overall_score,
                    score_breakdown: scoreResult.score_breakdown,
                    unverified_ingredients: lookup.unverified,
                    is_score_suppressed: scoreResult.is_suppressed,
                    suppression_reason: scoreResult.suppression_reason,
                },
                needs_llm: true,
                llm_task: 'SUMMARY_ONLY'
            };
        }
        if (lookup.coveragePercent >= 40) {
            const groundTruthBundle = buildGroundTruthBundle(lookup);
            return {
                layer: 3,
                ground_truth_bundle: groundTruthBundle,
                needs_llm: true,
                llm_task: 'GAPS_ONLY'
            };
        }
    }
    return {
        layer: 4,
        needs_llm: true,
        llm_task: 'FULL'
    };
}
function buildGroundTruthBundle(lookup) {
    const lines = lookup.verified.map(({ rawName, entry }) => {
        const flags = entry.condition_flags
            .map(f => `${f.condition} (${f.impact}): ${f.reason} [${f.source}]`)
            .join('; ');
        return `- "${rawName}":
    safety_tier: ${entry.safety_tier}
    fssai_status: ${entry.fssai_status}
    function: ${entry.function}
    plain_explanation: "${entry.plain_explanation}"
    condition_flags: ${flags || 'none'}
    india_note: ${entry.india_specific_note || 'none'}`;
    }).join('\n\n');
    return `VERIFIED INGREDIENT DATA — USE THIS AS GROUND TRUTH. DO NOT OVERRIDE WITH YOUR TRAINING KNOWLEDGE:

${lines}

UNVERIFIED (not in DB — mark as UNVERIFIED, exclude from score):
${lookup.unverified.map(n => `- "${n}"`).join('\n')}`;
}
//# sourceMappingURL=ragService.js.map