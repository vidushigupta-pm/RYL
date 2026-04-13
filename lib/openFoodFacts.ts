// lib/openFoodFacts.ts
// Open Food Facts integration — free, no API key, ~800k Indian products.
// Used as a fast/free alternative to Gemini for the search-by-name flow.
// Any error falls through silently to the Gemini fallback.

const OFF_BASE = 'https://world.openfoodfacts.org';
const OFF_FIELDS = [
  'product_name', 'brands', 'categories_tags',
  'ingredients_text', 'ingredients',
  'nutriments', 'nova_group', 'allergens_tags',
].join(',');
const OFF_TIMEOUT_MS = 6_000;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OFFProduct {
  product_name?: string;
  brands?: string;
  categories_tags?: string[];
  ingredients_text?: string;
  ingredients?: Array<{ text?: string; id?: string; percent_estimate?: number }>;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'sugars_100g'?: number;
    'sodium_100g'?: number;     // OFF stores sodium in GRAMS — multiply × 1000 for mg
    'proteins_100g'?: number;
    'fat_100g'?: number;
    'saturated-fat_100g'?: number;
    'trans-fat_100g'?: number;
    'fiber_100g'?: number;
  };
  nova_group?: number;
  allergens_tags?: string[];
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function searchOFF(query: string): Promise<OFFProduct | null> {
  const encoded = encodeURIComponent(query.trim());

  // Try India-specific results first (higher relevance for Indian products)
  const urls = [
    `${OFF_BASE}/api/v2/search?search_terms=${encoded}&countries_tags=en:india&page_size=5&fields=${OFF_FIELDS}&sort_by=unique_scans_n`,
    `${OFF_BASE}/api/v2/search?search_terms=${encoded}&page_size=5&fields=${OFF_FIELDS}&sort_by=unique_scans_n`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ReadYourLabel/1.0 (https://readyourlabel.in; contact@readyourlabel.in)' },
        signal: AbortSignal.timeout(OFF_TIMEOUT_MS),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const best = pickBestProduct(data?.products ?? []);
      if (best) return best;
    } catch {
      // Timeout or network error — try next URL or fall through to Gemini
      continue;
    }
  }

  return null;
}

// Pick the most complete product from the results list
function pickBestProduct(products: any[]): OFFProduct | null {
  if (!products?.length) return null;

  const scored = products.map((p: any) => ({
    product: p as OFFProduct,
    score:
      (hasIngredients(p) ? 20 : 0) +
      (p.nutriments?.['energy-kcal_100g'] ? 5 : 0) +
      (p.nutriments?.['sugars_100g'] != null ? 3 : 0) +
      (p.product_name ? 3 : 0) +
      (p.brands ? 2 : 0) +
      (p.nova_group != null ? 2 : 0),
  }));

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  // Must have at least ingredients to be useful
  return best.score >= 20 ? best.product : null;
}

function hasIngredients(p: any): boolean {
  return (
    (Array.isArray(p.ingredients) && p.ingredients.length >= 2) ||
    (typeof p.ingredients_text === 'string' && p.ingredients_text.trim().length > 10)
  );
}

// ── Data extraction ───────────────────────────────────────────────────────────

/** Parse OFF ingredients into a clean string array (label order preserved) */
export function parseOFFIngredients(product: OFFProduct): string[] {
  // Prefer structured array (more accurate, already parsed by OFF)
  if (Array.isArray(product.ingredients) && product.ingredients.length >= 2) {
    return product.ingredients
      .map(i => (i.text || '').trim())
      .filter(s => s.length > 1 && !/^\d+(\.\d+)?%$/.test(s)); // skip bare percentage strings
  }

  // Fall back to ingredients_text — split on commas not inside parentheses/brackets
  const text = product.ingredients_text?.trim() ?? '';
  if (!text) return [];

  return text
    .split(/,\s*(?![^()\[\]]*[)\]])/)   // split on commas outside parentheses/brackets
    .map(s => s.trim().replace(/[.,;]+$/, ''))
    .filter(s => s.length > 1);
}

/** Map OFF nutriments → our NutritionData schema */
export function mapOFFNutrition(nutriments: OFFProduct['nutriments']): Record<string, number | null> | null {
  if (!nutriments) return null;

  const sodium_g = nutriments['sodium_100g'];

  return {
    energy_kcal:     nutriments['energy-kcal_100g'] ?? null,
    sugar_g:         nutriments['sugars_100g'] ?? null,
    sodium_mg:       sodium_g != null ? Math.round(sodium_g * 1000) : null, // g → mg
    protein_g:       nutriments['proteins_100g'] ?? null,
    fat_g:           nutriments['fat_100g'] ?? null,
    saturated_fat_g: nutriments['saturated-fat_100g'] ?? null,
    trans_fat_g:     nutriments['trans-fat_100g'] ?? null,
    fibre_g:         nutriments['fiber_100g'] ?? null,
  };
}

/** Map OFF categories_tags → our category enum */
export function mapOFFCategory(tags: string[]): string {
  if (!tags?.length) return 'FOOD';
  const joined = tags.join(' ').toLowerCase();

  if (/cosmetic|skincare|makeup|face-cream|moisturiser/.test(joined)) return 'COSMETIC';
  if (/shampoo|hair-care|soap|toothpaste|dental|personal-care|oral-hygiene|body-wash/.test(joined)) return 'PERSONAL_CARE';
  if (/supplement|vitamins|minerals|protein-powder|nutraceutical/.test(joined)) return 'SUPPLEMENT';
  if (/household|cleaning|detergent|dishwasher/.test(joined)) return 'HOUSEHOLD';
  if (/pet-food|dog-food|cat-food/.test(joined)) return 'PET_FOOD';

  return 'FOOD';
}

/** Extract allergen names from OFF tags like "en:gluten", "en:milk" */
export function mapOFFAllergens(tags: string[]): string[] {
  if (!tags?.length) return [];
  return tags
    .map(t => t.replace(/^(en|fr|de):/, '').replace(/-/g, ' ').trim())
    .filter(Boolean);
}

/** Minimum usability check — must have ≥ 2 ingredients */
export function isOFFProductUsable(product: OFFProduct): boolean {
  return parseOFFIngredients(product).length >= 2;
}

// ── Derived signals ────────────────────────────────────────────────────────────

const SUGAR_ALIASES = [
  'sugar', 'sucrose', 'glucose', 'dextrose', 'maltodextrin', 'corn syrup',
  'glucose syrup', 'fructose', 'invert sugar', 'invert syrup', 'jaggery',
  'honey', 'molasses', 'brown sugar', 'raw sugar', 'palm sugar', 'cane sugar',
  'beet sugar', 'fruit juice concentrate', 'rice syrup', 'maple syrup',
  'agave', 'coconut sugar', 'caramel', 'treacle',
];

/** Detect hidden sugar aliases in ingredient list */
export function detectHiddenSugars(ingredients: string[]): { count: number; names: string[] } {
  const found = ingredients.filter(ing => {
    const lower = ing.toLowerCase();
    return SUGAR_ALIASES.some(alias => lower.includes(alias));
  });
  return { count: found.length, names: found };
}

/** Detect if refined wheat flour is in top 3 ingredients */
export function detectMaidaAlert(ingredients: string[]): boolean {
  return ingredients.slice(0, 3).some(ing => {
    const l = ing.toLowerCase();
    return (
      (l.includes('wheat flour') && !l.includes('whole wheat')) ||
      l.includes('maida') ||
      l.includes('refined flour') ||
      l.includes('refined wheat flour')
    );
  });
}

const TOP_CONCERN_KEYWORDS: Record<string, string> = {
  'sugar':               'Sugar is the #{n} ingredient by weight — a large portion of this product IS sugar.',
  'glucose syrup':       'Glucose syrup is the #{n} ingredient — a high-GI sweetener as a primary component.',
  'invert sugar':        'Invert sugar is the #{n} ingredient — sugar under a different name, still a primary component.',
  'maida':               'Maida (refined flour) is the #{n} ingredient — the primary base with very low fibre and high GI.',
  'refined wheat flour': 'Refined wheat flour is the #{n} ingredient — acts like sugar in the body, spikes blood glucose.',
  'wheat flour':         'Wheat flour (maida) is the #{n} ingredient — refined with low fibre and high glycaemic index.',
  'palm oil':            'Palm oil is the #{n} ingredient — a major source of saturated fat in this product.',
};
const ORDINALS = ['#1', '#2', '#3'];

/** Generate top ingredient warning for position 1 or 2 */
export function detectTopIngredientWarning(ingredients: string[]): string | null {
  for (let i = 0; i < Math.min(2, ingredients.length); i++) {
    const lower = ingredients[i].toLowerCase();
    for (const [keyword, msg] of Object.entries(TOP_CONCERN_KEYWORDS)) {
      if (lower.includes(keyword)) {
        return msg.replace('#{n}', ORDINALS[i]);
      }
    }
  }
  return null;
}

/** Simple HFSS classification (FSSAI / UK nutrient profile model) */
export function detectHFSS(nutrition: Record<string, number | null> | null): string {
  if (!nutrition) return 'GREEN';
  const { fat_g, saturated_fat_g, sugar_g, sodium_mg } = nutrition as any;
  if (
    (fat_g != null && fat_g > 17.5) ||
    (saturated_fat_g != null && saturated_fat_g > 5) ||
    (sugar_g != null && sugar_g > 22.5) ||
    (sodium_mg != null && sodium_mg > 600)
  ) return 'HFSS';
  return 'GREEN';
}

// ── Summary generator (no LLM needed) ────────────────────────────────────────

const INDIA_CONTEXT: Record<string, string> = {
  FOOD:          'Under FSSAI regulations, ingredients must be listed in descending order of weight. All packaged food must display a valid FSSAI licence number on the label.',
  COSMETIC:      'Cosmetics are regulated by CDSCO under the Drugs & Cosmetics Act. The banned ingredients list was updated in 2023. Verify CDSCO approval before use.',
  PERSONAL_CARE: 'Personal care products fall under CDSCO and BIS regulations in India. Ingredients must be listed in descending concentration order.',
  SUPPLEMENT:    'Health supplements and nutraceuticals are regulated by FSSAI under the FSS (Health Supplements, Nutraceuticals) Regulations 2022.',
  HOUSEHOLD:     'Household cleaning products must comply with BIS standards in India. Hazardous chemicals must be declared on the label per the Environment Protection Act.',
  PET_FOOD:      'Commercial pet food requires an FSSAI licence and must comply with the Prevention of Cruelty to Animals Act and FSSAI quality standards.',
};

export function generateSummary(
  productName: string,
  brand: string,
  score: number,
  breakdown: Array<{ label: string; impact: number }>,
  isUpf: boolean,
): string {
  const verdict =
    score >= 80 ? 'a reasonable choice for occasional consumption' :
    score >= 60 ? 'acceptable in moderation — check the concerns below' :
    score >= 40 ? 'worth being cautious about — review concerns before buying' :
    'best avoided or consumed very rarely';

  const concerns = breakdown
    .filter(b => b.impact < 0)
    .slice(0, 3)
    .map(b => b.label.replace(/^⚠\s*/, '').replace(/^Ultra-Processed Food.*/, 'ultra-processed formulation').toLowerCase());

  const positives = breakdown
    .filter(b => b.impact > 0)
    .slice(0, 2)
    .map(b => b.label.replace(/^✓\s*/, '').toLowerCase());

  const parts: string[] = [];
  parts.push(`${productName}${brand ? ` by ${brand}` : ''} scores ${score}/100 — ${verdict}.`);

  if (concerns.length > 0) {
    parts.push(`Key concerns: ${concerns.join(', ')}.`);
  }

  if (isUpf) {
    parts.push('This is an ultra-processed product (Nova Group 4) — formulated with industrial additives not found in home cooking.');
  }

  if (positives.length > 0) {
    parts.push(`On the positive side: ${positives.join(', ')}.`);
  }

  return parts.join(' ');
}

export function getIndiaContext(category: string): string {
  return INDIA_CONTEXT[category] ?? INDIA_CONTEXT.FOOD;
}
