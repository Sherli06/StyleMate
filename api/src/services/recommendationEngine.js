/**
 * StyleMate Recommendation Engine
 * =================================
 * Deterministic rule-based matching-and-filtering engine.
 * Combines saved preferences, wardrobe items, occasion requirements,
 * and user feedback ratings to produce personalized outfit recommendations.
 *
 * Feedback loop: past ratings adjust future item ordering via feedback_weights.
 */

const { v4: uuidv4 } = require('uuid');

// ── Compatibility matrices ──────────────────────────────────────────────────

/** Maps occasion formality → which wardrobe formality values are compatible */
const FORMALITY_COMPAT = {
  'Casual': ['Casual'],
  'Smart Casual': ['Casual', 'Smart Casual'],
  'Business Casual': ['Smart Casual', 'Business Casual'],
  'Formal': ['Business Casual', 'Formal'],
  'Festive Traditional': ['Festive', 'Formal'],
  'Athletic': ['Athletic', 'Casual']
};

/** Maps body type → favourable silhouette tags */
const BODY_TYPE_TAGS = {
  'Hourglass': ['fitted', 'wrap', 'tailored', 'belt', 'a-line'],
  'Pear': ['a-line', 'empire', 'bootcut', 'dark-bottom', 'statement-top'],
  'Rectangle': ['peplum', 'ruffles', 'belted', 'texture', 'layered'],
  'Inverted Triangle': ['flared', 'wide-leg', 'v-neck', 'a-line'],
  'Apple': ['empire', 'flowy', 'structured', 'vertical-stripes'],
  'Athletic': ['fitted', 'structured', 'cropped', 'layered']
};

/** Outfit structure by occasion: which item roles we need */
const OUTFIT_STRUCTURE = {
  'college': { roles: ['primary_top', 'primary_bottom', 'footwear', 'accessory_bag'], optional: ['accessory_necklace'] },
  'office': { roles: ['primary_top', 'primary_bottom', 'footwear', 'accessory_bag'], optional: ['outerwear', 'accessory_necklace'] },
  'interview': { roles: ['primary_top', 'primary_bottom', 'footwear', 'accessory_bag'], optional: ['outerwear'] },
  'wedding': { roles: ['full_body', 'footwear', 'accessory_necklace', 'accessory_bag'], optional: [] },
  'party': { roles: ['primary_top', 'primary_bottom', 'footwear', 'accessory_necklace'], optional: ['accessory_bag'] },
  'festival': { roles: ['full_body', 'footwear', 'accessory_necklace', 'accessory_bag'], optional: [] },
  'casual': { roles: ['primary_top', 'primary_bottom', 'footwear'], optional: ['accessory_bag', 'accessory_necklace'] },
  'sports': { roles: ['primary_top', 'primary_bottom', 'footwear'], optional: [] },
  'formal': { roles: ['full_body', 'footwear', 'accessory_necklace'], optional: ['accessory_bag', 'outerwear'] },
  'traditional': { roles: ['full_body', 'footwear', 'accessory_necklace', 'accessory_bag'], optional: [] }
};

/** Maps item_role → wardrobe category */
const ROLE_TO_CATEGORY = {
  'primary_top': ['top', 'jacket'],
  'primary_bottom': ['bottom'],
  'full_body': ['dress'],
  'footwear': ['shoes'],
  'accessory_necklace': ['necklace'],
  'accessory_bag': ['bag'],
  'outerwear': ['jacket'],
  'accessory_other': ['accessory']
};

// ── Scoring helpers ─────────────────────────────────────────────────────────

function formalityScore(itemFormality, occasionFormality) {
  const compat = FORMALITY_COMPAT[occasionFormality] || ['Casual'];
  return compat.includes(itemFormality) ? 30 : 0;
}

function colorPreferenceScore(itemColor, preferredColors, dislikedColors) {
  let score = 10; // base
  const lc = (itemColor || '').toLowerCase();

  if (preferredColors.some(c => lc.includes(c.toLowerCase()))) score += 20;
  if (dislikedColors.some(c => lc.includes(c.toLowerCase()))) score -= 25;

  return Math.max(0, score);
}

function bodyTypeScore(itemTags, bodyType) {
  const favTags = BODY_TYPE_TAGS[bodyType] || [];
  const tags = safeParseTags(itemTags);
  const overlap = tags.filter(t => favTags.includes(t.toLowerCase())).length;
  return overlap * 8;
}

function feedbackWeightBoost(item, weights) {
  if (!weights) return 0;
  let boost = 0;
  const catWeight = weights[item.category];
  if (catWeight) boost += (catWeight - 1) * 15;
  const colorKey = `color_${item.color}`;
  if (weights[colorKey]) boost += (weights[colorKey] - 1) * 10;
  return boost;
}

function favoriteBoost(item) {
  return item.is_favorite ? 8 : 0;
}

function stylePreferenceScore(item, preferredStyles) {
  const itemText = [
    item.name, item.subcategory, item.formality,
    ...safeParseTags(item.tags)
  ].filter(Boolean).join(' ').toLowerCase();
  return preferredStyles.reduce((score, style) => {
    const normalized = String(style).trim().toLowerCase();
    return normalized && itemText.includes(normalized) ? score + 8 : score;
  }, 0);
}

function safeParseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
}

// ── Main scoring function ───────────────────────────────────────────────────

function scoreItem(item, occasionFormality, profile, preferences) {
  const prefColors = safeParseTags(preferences.preferred_colors);
  const disColors = safeParseTags(preferences.disliked_colors);
  const prefStyles = safeParseTags(preferences.preferred_styles);
  const weights = preferences.feedback_weights ? (typeof preferences.feedback_weights === 'string' ? JSON.parse(preferences.feedback_weights) : preferences.feedback_weights) : {};

  const fs = formalityScore(item.formality, occasionFormality);
  const cs = colorPreferenceScore(item.color, prefColors, disColors);
  const bs = bodyTypeScore(item.tags, profile.body_type);
  const fb = feedbackWeightBoost(item, weights);
  const fav = favoriteBoost(item);
  const style = stylePreferenceScore(item, prefStyles);

  return fs + cs + bs + fb + fav + style;
}

// ── Recommendation generator ───────────────────────────────────────────────

/**
 * Generate outfit recommendations
 * @param {Object} params
 * @param {Array} params.wardrobeItems - User's wardrobe items
 * @param {Object} params.occasion - Occasion object (with key_name, default_formality)
 * @param {Object} params.profile - User profile
 * @param {Object} params.preferences - User preferences
 * @param {Object} params.weather - Weather data (from stub or live)
 * @param {number} params.maxOutfits - Number of outfits to generate (default 3)
 * @returns {Array<Object>} Array of outfit objects
 */
function generateRecommendations({ wardrobeItems, occasion, profile, preferences, weather, maxOutfits = 3 }) {
  if (!wardrobeItems || wardrobeItems.length === 0) {
    return [];
  }

  const occasionKey = occasion.key_name || 'casual';
  const structure = OUTFIT_STRUCTURE[occasionKey] || OUTFIT_STRUCTURE['casual'];
  const occasionFormality = occasion.default_formality || 'Casual';

  // Score every item
  const scored = wardrobeItems.map(item => ({
    ...item,
    _score: scoreItem(item, occasionFormality, profile, preferences)
  }));

  // Group by category
  const byCat = {};
  for (const item of scored) {
    if (!byCat[item.category]) byCat[item.category] = [];
    byCat[item.category].push(item);
  }

  // Sort each category by score descending
  for (const cat of Object.keys(byCat)) {
    byCat[cat].sort((a, b) => b._score - a._score);
  }

  const outfits = [];

  for (let i = 0; i < maxOutfits; i++) {
    const outfitItems = [];
    const allRoles = [...structure.roles, ...structure.optional];

    for (const role of allRoles) {
      const possibleCats = ROLE_TO_CATEGORY[role] || [];
      let bestItem = null;

      for (const cat of possibleCats) {
        const items = byCat[cat] || [];
        // Pick the (i)-th best if available, else the best
        const pick = items[i % items.length];
        if (pick && (!bestItem || pick._score > bestItem._score)) {
          bestItem = pick;
        }
      }

      if (bestItem) {
        outfitItems.push({
          id: uuidv4(),
          wardrobe_item_id: bestItem.id,
          item_role: role,
          item: bestItem
        });
      }
    }

    if (outfitItems.length < 2) continue; // Skip if too few items

    const titles = [
      `${occasion.name} Look #${i + 1}`,
      `Curated ${occasionFormality} Ensemble`,
      `${occasion.name} Combination`
    ];

    const weatherNote = weather
      ? `${weather.icon} ${weather.temp_c}°C, ${weather.condition} — ${weather.advisory}`
      : null;

    outfits.push({
      id: uuidv4(),
      occasion_id: occasion.id,
      occasion_name: occasion.name,
      title: titles[i % titles.length],
      description: `A ${occasionFormality.toLowerCase()} combination for ${occasion.name}, ordered using occasion formality, your saved color/style preferences, selected silhouette tags, favorites, and prior ratings.`,
      weather_summary: weatherNote,
      ai_model_used: 'rule-matrix-v1',
      style_notes: 'Rule-based ranking only. Skin tone is not used to exclude or downgrade clothing.',
      is_ai_generated: false,
      items: outfitItems
    });
  }

  return outfits;
}

module.exports = { generateRecommendations, scoreItem, FORMALITY_COMPAT, OUTFIT_STRUCTURE };
