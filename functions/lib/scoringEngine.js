"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateScore = calculateScore;
function calculateScore(ingredientLookup, nutrition, productCategory) {
    const breakdown = [];
    let score = 70;
    if (ingredientLookup.coveragePercent < 70) {
        return {
            overall_score: 0,
            score_breakdown: [],
            is_suppressed: true,
            suppression_reason: `Only ${ingredientLookup.coveragePercent}% of ingredients could be verified. Score suppressed to prevent misleading results.`
        };
    }
    if ((productCategory === 'FOOD' || productCategory === 'SUPPLEMENT') && nutrition) {
        const sugar = nutrition.sugar_g ?? 0;
        if (sugar > 40) {
            const d = -20;
            score += d;
            breakdown.push({ label: 'Very High Sugar', impact: d, explanation: `${sugar}g sugar per 100g — that's ${(sugar / 4).toFixed(1)} teaspoons. Extremely high.` });
        }
        else if (sugar > 20) {
            const d = -12;
            score += d;
            breakdown.push({ label: 'High Sugar', impact: d, explanation: `${sugar}g sugar per 100g — ${(sugar / 4).toFixed(1)} teaspoons. Above safe daily limits for regular consumption.` });
        }
        else if (sugar > 10) {
            const d = -6;
            score += d;
            breakdown.push({ label: 'Moderate Sugar', impact: d, explanation: `${sugar}g sugar per 100g — moderate amount. Monitor daily intake.` });
        }
        const sodium = nutrition.sodium_mg ?? 0;
        if (sodium > 800) {
            const d = -15;
            score += d;
            breakdown.push({ label: 'Very High Sodium', impact: d, explanation: `${sodium}mg sodium per 100g — dangerously high. ICMR recommends <2000mg per day total.` });
        }
        else if (sodium > 500) {
            const d = -8;
            score += d;
            breakdown.push({ label: 'High Sodium', impact: d, explanation: `${sodium}mg sodium per 100g — high. A large portion could use up a significant share of your daily allowance.` });
        }
        const transFat = nutrition.trans_fat_g ?? 0;
        if (transFat > 0.5) {
            const d = -15;
            score += d;
            breakdown.push({ label: 'Trans Fat Present', impact: d, explanation: `${transFat}g trans fat per 100g. WHO recommends zero trans fat. Raises bad cholesterol and lowers good cholesterol.` });
        }
        else if (transFat > 0.2) {
            const d = -8;
            score += d;
            breakdown.push({ label: 'Trace Trans Fat', impact: d, explanation: `${transFat}g trans fat — product claims "0g" but FSSAI allows this if below 0.2g/serving. Worth noting.` });
        }
        const protein = nutrition.protein_g ?? 0;
        if (protein > 20) {
            const d = 10;
            score += d;
            breakdown.push({ label: 'High Protein', impact: d, explanation: `${protein}g protein per 100g — excellent protein content.` });
        }
        else if (protein > 10) {
            const d = 5;
            score += d;
            breakdown.push({ label: 'Good Protein', impact: d, explanation: `${protein}g protein per 100g — good protein content.` });
        }
        const fibre = nutrition.fibre_g ?? 0;
        if (fibre > 6) {
            const d = 8;
            score += d;
            breakdown.push({ label: 'High Fibre', impact: d, explanation: `${fibre}g fibre per 100g — excellent. Most Indians are fibre deficient.` });
        }
        else if (fibre > 3) {
            const d = 4;
            score += d;
            breakdown.push({ label: 'Good Fibre', impact: d, explanation: `${fibre}g fibre per 100g — decent fibre content.` });
        }
    }
    for (const { rawName, entry } of ingredientLookup.verified) {
        if (entry.score_impact === 0)
            continue;
        if (entry.score_impact < 0) {
            score += entry.score_impact;
            breakdown.push({
                label: entry.function,
                impact: entry.score_impact,
                explanation: `${rawName} (${entry.function}) — ${entry.safety_tier === 'AVOID' || entry.safety_tier === 'BANNED_IN_INDIA' ? 'HIGH CONCERN. ' : ''}${entry.plain_explanation.substring(0, 100)}...`
            });
        }
        else if (entry.score_impact > 0) {
            score += entry.score_impact;
            breakdown.push({
                label: `Beneficial: ${entry.function}`,
                impact: entry.score_impact,
                explanation: `${rawName} — ${entry.plain_explanation.substring(0, 100)}...`
            });
        }
    }
    if (productCategory === 'COSMETIC' || productCategory === 'PERSONAL_CARE') {
        const bannedCount = ingredientLookup.verified.filter(v => v.entry.safety_tier === 'BANNED_IN_INDIA').length;
        const avoidCount = ingredientLookup.verified.filter(v => v.entry.safety_tier === 'AVOID').length;
        if (bannedCount > 0) {
            const d = bannedCount * -30;
            score += d;
            breakdown.push({ label: 'Banned Ingredients', impact: d, explanation: `${bannedCount} ingredient(s) banned by CDSCO found in this product.` });
        }
        if (avoidCount > 0) {
            const d = avoidCount * -10;
            score += d;
            breakdown.push({ label: 'Ingredients to Avoid', impact: d, explanation: `${avoidCount} ingredient(s) flagged as AVOID.` });
        }
    }
    if (ingredientLookup.unverified.length > 0) {
        breakdown.push({
            label: 'Unverified Ingredients',
            impact: 0,
            explanation: `${ingredientLookup.unverified.length} ingredient(s) excluded from score as they could not be verified: ${ingredientLookup.unverified.slice(0, 3).join(', ')}${ingredientLookup.unverified.length > 3 ? '...' : ''}`
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