"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateScore = calculateScore;
function calculateScore(ingredientLookup, nutrition, productCategory, isUpf = false) {
    const breakdown = [];
    let score = 100;
    const coveragePct = isNaN(ingredientLookup.coveragePercent)
        ? (ingredientLookup.verified.length === 0 && ingredientLookup.unverified.length === 0 ? 100 : 0)
        : ingredientLookup.coveragePercent;
    if (coveragePct < 70) {
        return {
            overall_score: 0,
            score_breakdown: [],
            is_suppressed: true,
            suppression_reason: `Only ${coveragePct}% of ingredients could be verified. Score suppressed to prevent misleading results.`
        };
    }
    if ((productCategory === 'FOOD' || productCategory === 'SUPPLEMENT') && nutrition) {
        const sugar = nutrition.sugar_g ?? 0;
        if (sugar > 40) {
            const d = -10;
            score += d;
            breakdown.push({ label: 'Very High Sugar', impact: d, explanation: `${sugar}g sugar per 100g — that's ${(sugar / 4).toFixed(1)} teaspoons. Significantly above WHO's recommended daily free sugar limit of ~50g total.` });
        }
        else if (sugar > 20) {
            const d = -6;
            score += d;
            breakdown.push({ label: 'High Sugar', impact: d, explanation: `${sugar}g sugar per 100g — ${(sugar / 4).toFixed(1)} teaspoons. A large serving could contribute meaningfully to your daily sugar limit.` });
        }
        else if (sugar > 12) {
            const d = -3;
            score += d;
            breakdown.push({ label: 'Moderate Sugar', impact: d, explanation: `${sugar}g sugar per 100g — moderate. Fine occasionally but worth watching if consumed daily.` });
        }
        const sodium = nutrition.sodium_mg ?? 0;
        if (sodium > 1000) {
            const d = -18;
            score += d;
            breakdown.push({ label: 'Extremely High Sodium', impact: d, explanation: `${sodium}mg sodium per 100g — a single serving can cover 50–75%+ of ICMR's 2000mg daily limit. Strongly linked to hypertension with regular use.` });
        }
        else if (sodium > 800) {
            const d = -13;
            score += d;
            breakdown.push({ label: 'Very High Sodium', impact: d, explanation: `${sodium}mg sodium per 100g — a large portion covers 40%+ of the ICMR daily limit of 2000mg.` });
        }
        else if (sodium > 500) {
            const d = -7;
            score += d;
            breakdown.push({ label: 'High Sodium', impact: d, explanation: `${sodium}mg sodium per 100g — notable. Keep an eye on total daily sodium if consuming regularly.` });
        }
        const transFat = nutrition.trans_fat_g ?? 0;
        if (transFat > 0.5) {
            const d = -10;
            score += d;
            breakdown.push({ label: 'Trans Fat Present', impact: d, explanation: `${transFat}g trans fat per 100g. WHO recommends zero trans fat in the diet. Linked to raised LDL cholesterol.` });
        }
        else if (transFat > 0.2) {
            const d = -4;
            score += d;
            breakdown.push({ label: 'Trace Trans Fat', impact: d, explanation: `${transFat}g trans fat detected. FSSAI allows products to claim "0g" if below 0.2g per serving — this is trace but worth noting.` });
        }
        const protein = nutrition.protein_g ?? 0;
        if (protein > 20) {
            const d = 8;
            score += d;
            breakdown.push({ label: 'High Protein', impact: d, explanation: `${protein}g protein per 100g — excellent. Most Indians don't get enough protein from packaged food.` });
        }
        else if (protein > 10) {
            const d = 4;
            score += d;
            breakdown.push({ label: 'Good Protein', impact: d, explanation: `${protein}g protein per 100g — good protein content.` });
        }
        const fibre = nutrition.fibre_g ?? 0;
        if (fibre > 6) {
            const d = 6;
            score += d;
            breakdown.push({ label: 'High Fibre', impact: d, explanation: `${fibre}g fibre per 100g — excellent. High fibre supports digestion and helps manage blood sugar levels.` });
        }
        else if (fibre > 3) {
            const d = 3;
            score += d;
            breakdown.push({ label: 'Good Fibre', impact: d, explanation: `${fibre}g fibre per 100g — decent fibre content.` });
        }
    }
    if (isUpf && (productCategory === 'FOOD' || productCategory === 'SUPPLEMENT')) {
        const d = -10;
        score += d;
        breakdown.push({
            label: '⚠ Ultra-Processed Food (Nova Group 4)',
            impact: d,
            explanation: 'This product is classified as ultra-processed (Nova Group 4) — industrially formulated with additives, flavours, or texturisers not found in home cooking. Large-cohort studies link regular UPF consumption to obesity, cardiovascular disease, and Type 2 diabetes.'
        });
    }
    for (const { rawName, entry } of ingredientLookup.verified) {
        if (entry.score_impact === 0)
            continue;
        if (entry.score_impact < 0) {
            score += entry.score_impact;
            breakdown.push({
                label: `${rawName} — ${entry.function}`,
                impact: entry.score_impact,
                explanation: `${entry.safety_tier === 'AVOID' || entry.safety_tier === 'BANNED_IN_INDIA' ? '⚠ HIGH CONCERN: ' : ''}${entry.plain_explanation}`
            });
        }
        else if (entry.score_impact > 0) {
            score += entry.score_impact;
            breakdown.push({
                label: `✓ ${rawName} — ${entry.function}`,
                impact: entry.score_impact,
                explanation: entry.plain_explanation
            });
        }
    }
    if (productCategory === 'COSMETIC' || productCategory === 'PERSONAL_CARE') {
        const bannedCount = ingredientLookup.verified.filter(v => v.entry.safety_tier === 'BANNED_IN_INDIA').length;
        const avoidCount = ingredientLookup.verified.filter(v => v.entry.safety_tier === 'AVOID').length;
        const cautionCount = ingredientLookup.verified.filter(v => v.entry.safety_tier === 'CAUTION').length;
        if (bannedCount > 0) {
            const d = bannedCount * -20;
            score += d;
            breakdown.push({ label: '⚠️ Banned Ingredients (CDSCO)', impact: d, explanation: `${bannedCount} ingredient(s) banned by CDSCO India found. This is a serious safety concern — avoid this product.` });
        }
        if (avoidCount > 0) {
            const d = avoidCount * -8;
            score += d;
            breakdown.push({ label: 'High-Concern Ingredients', impact: d, explanation: `${avoidCount} ingredient(s) flagged as high concern (e.g. formaldehyde releasers, triclosan, hydroquinone). Worth avoiding especially for sensitive skin or pregnancy.` });
        }
        if (cautionCount > 4) {
            const d = -5;
            score += d;
            breakdown.push({ label: 'Multiple Caution Ingredients', impact: d, explanation: `${cautionCount} ingredients flagged for caution (e.g. parabens, SLS, fragrance). Each is acceptable at low concentrations, but a high count together may not suit sensitive skin.` });
        }
        const beneficialCount = ingredientLookup.verified.filter(v => v.entry.score_impact > 0).length;
        if (beneficialCount > 0) {
            breakdown.push({ label: 'Beneficial Actives Present', impact: 0, explanation: `${beneficialCount} ingredient(s) with proven skin benefits found (e.g. niacinamide, hyaluronic acid, zinc oxide).` });
        }
    }
    if (productCategory === 'HOUSEHOLD') {
        const bannedCount = ingredientLookup.verified.filter(v => v.entry.safety_tier === 'BANNED_IN_INDIA').length;
        const avoidCount = ingredientLookup.verified.filter(v => v.entry.safety_tier === 'AVOID').length;
        if (bannedCount > 0) {
            const d = bannedCount * -20;
            score += d;
            breakdown.push({ label: 'Prohibited Substances', impact: d, explanation: `${bannedCount} prohibited substance(s) found. Do not use this product.` });
        }
        if (avoidCount > 0) {
            const d = avoidCount * -8;
            score += d;
            breakdown.push({ label: 'Hazardous Chemicals', impact: d, explanation: `${avoidCount} chemical(s) flagged as high concern. Use with protective gloves and good ventilation.` });
        }
    }
    if (ingredientLookup.unverified.length > 0) {
        breakdown.push({
            label: 'Unverified Ingredients',
            impact: 0,
            explanation: `${ingredientLookup.unverified.length} ingredient(s) could not be verified against our database — they were analysed by AI instead: ${ingredientLookup.unverified.slice(0, 3).join(', ')}${ingredientLookup.unverified.length > 3 ? '...' : ''}`
        });
    }
    return {
        overall_score: Math.max(0, Math.min(100, Math.round(score))),
        score_breakdown: breakdown,
        is_suppressed: false,
        suppression_reason: null
    };
}
//# sourceMappingURL=scoringEngine.js.map