const { v4: uuidv4 } = require('uuid');

const STARTER_WARDROBE_ITEMS = [
  // ─── TOPS ─────────────────────────────────────────────────────────────
  {
    name: 'Silk Ivory Crew-Neck Blouse',
    category: 'top',
    subcategory: 'Blouse',
    color: 'Ivory',
    pattern: 'Solid',
    material: 'Silk',
    season: 'All Season',
    formality: 'Smart Casual',
    image_url: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['silk', 'blouse', 'elegant', 'interview', 'minimal']),
    is_favorite: 1
  },
  {
    name: 'Cashmere Knit Camel Crewneck',
    category: 'top',
    subcategory: 'Sweater',
    color: 'Camel Tan',
    pattern: 'Solid',
    material: 'Cashmere',
    season: 'Winter',
    formality: 'Smart Casual',
    image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['knitwear', 'warm', 'chic', 'minimalist']),
    is_favorite: 1
  },
  {
    name: 'Crisp Oversized Poplin White Shirt',
    category: 'top',
    subcategory: 'Button-Down',
    color: 'White',
    pattern: 'Solid',
    material: 'Egyptian Cotton',
    season: 'All Season',
    formality: 'Business Casual',
    image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['classic', 'office', 'white-shirt', 'clean']),
    is_favorite: 0
  },
  {
    name: 'Ribbed Forest Green Long-Sleeve Top',
    category: 'top',
    subcategory: 'Knit Top',
    color: 'Forest Green',
    pattern: 'Ribbed',
    material: 'Modal Blend',
    season: 'Spring/Fall',
    formality: 'Casual',
    image_url: 'https://images.unsplash.com/photo-1524137160148-d4147db75a51?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['casual', 'green', 'ribbed', 'autumn']),
    is_favorite: 0
  },
  {
    name: 'Relaxed Oversized Charcoal Graphic Tee',
    category: 'top',
    subcategory: 'T-Shirt',
    color: 'Charcoal',
    pattern: 'Graphic',
    material: 'Cotton',
    season: 'Summer',
    formality: 'Casual',
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['college', 'casual', 'streetwear', 'tee']),
    is_favorite: 0
  },
  {
    name: 'Breathable Moisture-Wicking Coral Tank',
    category: 'top',
    subcategory: 'Tank Top',
    color: 'Coral Pink',
    pattern: 'Solid',
    material: 'Poly-Mesh',
    season: 'Summer',
    formality: 'Athletic',
    image_url: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['gym', 'sports', 'active', 'tank']),
    is_favorite: 0
  },

  // ─── BOTTOMS ──────────────────────────────────────────────────────────
  {
    name: 'High-Rise Navy Tailored Chinos',
    category: 'bottom',
    subcategory: 'Trousers',
    color: 'Navy Blue',
    pattern: 'Solid',
    material: 'Cotton Twill',
    season: 'All Season',
    formality: 'Business Casual',
    image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['trousers', 'work', 'smart', 'navy']),
    is_favorite: 1
  },
  {
    name: 'Classic Light-Wash Wide Leg Jeans',
    category: 'bottom',
    subcategory: 'Jeans',
    color: 'Light Denim',
    pattern: 'Solid',
    material: 'Denim',
    season: 'All Season',
    formality: 'Casual',
    image_url: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['jeans', 'denim', 'college', 'casual', 'wide-leg']),
    is_favorite: 1
  },
  {
    name: 'Pleated High-Waist Linen Trousers',
    category: 'bottom',
    subcategory: 'Trousers',
    color: 'Beige',
    pattern: 'Solid',
    material: 'Pure Linen',
    season: 'Spring/Fall',
    formality: 'Smart Casual',
    image_url: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['linen', 'summer', 'pleated', 'chic']),
    is_favorite: 0
  },
  {
    name: 'Charcoal Grey Wool Tailored Pants',
    category: 'bottom',
    subcategory: 'Slacks',
    color: 'Charcoal Grey',
    pattern: 'Solid',
    material: 'Wool Blend',
    season: 'All Season',
    formality: 'Formal',
    image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['formal', 'suit-pants', 'interview', 'charcoal']),
    is_favorite: 0
  },
  {
    name: 'Seamless High-Waisted Athletic Leggings',
    category: 'bottom',
    subcategory: 'Leggings',
    color: 'Black',
    pattern: 'Solid',
    material: 'Spandex/Nylon',
    season: 'All Season',
    formality: 'Athletic',
    image_url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['gym', 'active', 'leggings', 'fitness']),
    is_favorite: 0
  },

  // ─── SHOES ────────────────────────────────────────────────────────────
  {
    name: 'Retro White Court Leather Sneakers',
    category: 'shoes',
    subcategory: 'Sneakers',
    color: 'White',
    pattern: 'Solid',
    material: 'Leather/Rubber',
    season: 'All Season',
    formality: 'Casual',
    image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['sneakers', 'white-sneakers', 'comfortable', 'daily']),
    is_favorite: 1
  },
  {
    name: 'Block Heel Italian Leather Loafers',
    category: 'shoes',
    subcategory: 'Loafers',
    color: 'Black',
    pattern: 'Solid',
    material: 'Full Grain Leather',
    season: 'All Season',
    formality: 'Business Casual',
    image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['loafers', 'workwear', 'classic', 'comfortable']),
    is_favorite: 1
  },
  {
    name: 'Pointed Toe Suede Pumps (Nude)',
    category: 'shoes',
    subcategory: 'Heels',
    color: 'Nude Beige',
    pattern: 'Solid',
    material: 'Suede Leather',
    season: 'All Season',
    formality: 'Formal',
    image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['heels', 'pumps', 'cocktail', 'gala']),
    is_favorite: 0
  },
  {
    name: 'Handcrafted Zari Embroidered Juttis',
    category: 'shoes',
    subcategory: 'Juttis',
    color: 'Gold & Green',
    pattern: 'Embroidered',
    material: 'Leather & Zari',
    season: 'All Season',
    formality: 'Festive',
    image_url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['juttis', 'ethnic', 'traditional', 'wedding']),
    is_favorite: 1
  },
  {
    name: 'Classic Chelsea Leather Ankle Boots',
    category: 'shoes',
    subcategory: 'Boots',
    color: 'Dark Brown',
    pattern: 'Solid',
    material: 'Leather',
    season: 'Winter',
    formality: 'Smart Casual',
    image_url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['boots', 'chelsea', 'autumn', 'winter']),
    is_favorite: 0
  },

  // ─── BAGS ─────────────────────────────────────────────────────────────
  {
    name: 'Structured Cognac Leather Work Tote',
    category: 'bag',
    subcategory: 'Tote',
    color: 'Cognac Brown',
    pattern: 'Solid',
    material: 'Italian Leather',
    season: 'All Season',
    formality: 'Business Casual',
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['tote', 'laptop-bag', 'office', 'leather']),
    is_favorite: 1
  },
  {
    name: 'Quilted Black Leather Chain Crossbody',
    category: 'bag',
    subcategory: 'Crossbody',
    color: 'Black',
    pattern: 'Quilted',
    material: 'Leather',
    season: 'All Season',
    formality: 'Smart Casual',
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['crossbody', 'evening', 'party', 'chic']),
    is_favorite: 1
  },
  {
    name: 'Heavy-Duty Canvas Everyday Backpack',
    category: 'bag',
    subcategory: 'Backpack',
    color: 'Olive Green',
    pattern: 'Solid',
    material: 'Canvas',
    season: 'All Season',
    formality: 'Casual',
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['backpack', 'college', 'campus', 'travel']),
    is_favorite: 0
  },
  {
    name: 'Embellished Velvet Maroon Potli Bag',
    category: 'bag',
    subcategory: 'Potli',
    color: 'Deep Maroon',
    pattern: 'Beaded',
    material: 'Velvet',
    season: 'All Season',
    formality: 'Festive',
    image_url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['potli', 'traditional', 'wedding', 'festive']),
    is_favorite: 0
  },

  // ─── JACKETS / OUTERWEAR ──────────────────────────────────────────────
  {
    name: 'Tailored Italian Linen Blazer (Beige)',
    category: 'jacket',
    subcategory: 'Blazer',
    color: 'Beige',
    pattern: 'Solid',
    material: 'Linen',
    season: 'Spring/Fall',
    formality: 'Business Casual',
    image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['blazer', 'neutral', 'office', 'chic']),
    is_favorite: 1
  },
  {
    name: 'Vintage Distressed Denim Trucker Jacket',
    category: 'jacket',
    subcategory: 'Denim Jacket',
    color: 'Indigo Blue',
    pattern: 'Solid',
    material: 'Denim',
    season: 'Spring/Fall',
    formality: 'Casual',
    image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['denim', 'casual', 'outerwear', 'streetwear']),
    is_favorite: 0
  },
  {
    name: 'Classic Black Moto Leather Jacket',
    category: 'jacket',
    subcategory: 'Leather Jacket',
    color: 'Black',
    pattern: 'Solid',
    material: 'Nappa Leather',
    season: 'Winter',
    formality: 'Smart Casual',
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['leather', 'biker', 'edgy', 'party']),
    is_favorite: 1
  },

  // ─── DRESSES / ONE-PIECE ──────────────────────────────────────────────
  {
    name: 'Embroidered Chanderi Kurta Set',
    category: 'dress',
    subcategory: 'Kurta Set',
    color: 'Emerald Green',
    pattern: 'Embroidered',
    material: 'Chanderi Silk',
    season: 'All Season',
    formality: 'Festive',
    image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['ethnic', 'kurta', 'festival', 'wedding']),
    is_favorite: 1
  },
  {
    name: 'Silk Satin Cowl-Neck Midi Slip Dress',
    category: 'dress',
    subcategory: 'Slip Dress',
    color: 'Burgundy Red',
    pattern: 'Solid',
    material: 'Silk Satin',
    season: 'Summer',
    formality: 'Formal',
    image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['slip-dress', 'evening', 'cocktail', 'date-night']),
    is_favorite: 1
  },
  {
    name: 'Floral Bohemian Cotton Tiered Maxi Dress',
    category: 'dress',
    subcategory: 'Maxi Dress',
    color: 'Terracotta Floral',
    pattern: 'Floral',
    material: 'Cotton',
    season: 'Summer',
    formality: 'Casual',
    image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['maxi', 'floral', 'summer', 'boho', 'vacation']),
    is_favorite: 0
  },

  // ─── ACCESSORIES & JEWELRY ────────────────────────────────────────────
  {
    name: 'Dainty 18k Gold Herringbone Chain',
    category: 'necklace',
    subcategory: 'Chain',
    color: 'Gold',
    pattern: 'Metallic',
    material: '18k Gold Plated',
    season: 'All Season',
    formality: 'Smart Casual',
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['necklace', 'gold', 'minimalist', 'jewelry']),
    is_favorite: 1
  },
  {
    name: 'Kundan Statement Choker with Pearls',
    category: 'necklace',
    subcategory: 'Choker',
    color: 'Gold & Pearl',
    pattern: 'Ornate',
    material: 'Brass & Pearls',
    season: 'All Season',
    formality: 'Festive',
    image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['kundan', 'wedding', 'royal', 'necklace']),
    is_favorite: 1
  },
  {
    name: 'Tortoiseshell Acetate Polarized Sunglasses',
    category: 'accessory',
    subcategory: 'Sunglasses',
    color: 'Tortoiseshell Brown',
    pattern: 'Tortoise',
    material: 'Acetate',
    season: 'Summer',
    formality: 'Casual',
    image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['sunglasses', 'summer', 'accessories']),
    is_favorite: 0
  }
];

async function seedStarterWardrobeForUser(db, userId) {
  for (const item of STARTER_WARDROBE_ITEMS) {
    const id = uuidv4();
    await db.query(
      `INSERT INTO wardrobe_items (id, user_id, name, category, subcategory, color, pattern, material, season, formality, image_url, tags, is_favorite)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        item.name,
        item.category,
        item.subcategory,
        item.color,
        item.pattern,
        item.material,
        item.season,
        item.formality,
        item.image_url,
        item.tags,
        item.is_favorite || 0
      ]
    );
  }
}

module.exports = { STARTER_WARDROBE_ITEMS, seedStarterWardrobeForUser };
