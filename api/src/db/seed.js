const db = require('./connection');
const unsplashLicense = (photoId) => `https://unsplash.com/license?photo=${photoId}`;
const occasionsData = [
  {
    id: 'occ_school',
    key_name: 'school',
    name: 'School & Uniform',
    category: 'Academic',
    description: 'Comfortable, practical choices for school days and campus activities.',
    default_formality: 'Casual',
    image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['school', 'academic', 'comfortable'])
  },
  {
    id: 'occ_function',
    key_name: 'function',
    name: 'Functions & Celebrations',
    category: 'Celebration',
    description: 'Versatile polished outfits and accessories for celebrations and family functions.',
    default_formality: 'Festive Traditional',
    image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['celebration', 'family', 'festive'])
  },
  {
    id: 'occ_temple',
    key_name: 'temple',
    name: 'Temple & Traditional',
    category: 'Cultural',
    description: 'Comfortable, respectful traditional outfit ideas for cultural and temple visits.',
    default_formality: 'Festive Traditional',
    image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['temple', 'traditional', 'cultural'])
  },
  {
    id: 'occ_college',
    key_name: 'college',
    name: 'College & Campus',
    category: 'Academic',
    description: 'Relaxed, effortless, and comfortable campus style suitable for classes, labs, and casual hanging out.',
    default_formality: 'Casual',
    image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['campus', 'casual', 'comfortable', 'backpack', 'sneakers'])
  },
  {
    id: 'occ_office',
    key_name: 'office',
    name: 'Office & Workwear',
    category: 'Professional',
    description: 'Polished business casual attire balancing professional authority with all-day desk comfort.',
    default_formality: 'Business Casual',
    image_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['professional', 'workwear', 'blazer', 'tote', 'tailored'])
  },
  {
    id: 'occ_interview',
    key_name: 'interview',
    name: 'Job Interview',
    category: 'Professional',
    description: 'Crisp, structured formal outfits engineered to convey confidence, competence, and sharp presentation.',
    default_formality: 'Formal',
    image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['formal', 'confidence', 'suit', 'oxfords', 'structured'])
  },
  {
    id: 'occ_wedding',
    key_name: 'wedding',
    name: 'Wedding Celebration',
    category: 'Celebration',
    description: 'Luxurious celebration outfits with rich fabrics, elegant jewelry, and opulent occasion footwear.',
    default_formality: 'Festive Traditional',
    image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['celebration', 'ceremony', 'silk', 'heels', 'jewelry'])
  },
  {
    id: 'occ_party',
    key_name: 'party',
    name: 'Party & Night Out',
    category: 'Social',
    description: 'Eye-catching glamorous silhouettes, statement accessories, and stylish evening wear.',
    default_formality: 'Smart Casual',
    image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['evening', 'glamour', 'statement', 'clutch', 'chic'])
  },
  {
    id: 'occ_festival',
    key_name: 'festival',
    name: 'Festival & Cultural Fair',
    category: 'Cultural',
    description: 'Vibrant festive ensembles celebrating regional heritage with colorful embroidery and traditional adornments.',
    default_formality: 'Festive Traditional',
    image_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['festive', 'traditional', 'colors', 'ethnic', 'adornment'])
  },
  {
    id: 'occ_casual',
    key_name: 'casual',
    name: 'Casual Outing & Weekend',
    category: 'Social',
    description: 'Chic relaxed weekend looks for brunch, cafe hopping, park strolls, and travel.',
    default_formality: 'Casual',
    image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['weekend', 'brunch', 'denim', 'crossbody', 'sunglasses'])
  },
  {
    id: 'occ_sports',
    key_name: 'sports',
    name: 'Sports & Activewear',
    category: 'Fitness',
    description: 'High-performance athletic apparel optimized for movement, gym sessions, and outdoor recreation.',
    default_formality: 'Athletic',
    image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['fitness', 'gym', 'sneakers', 'breathable', 'activewear'])
  },
  {
    id: 'occ_formal',
    key_name: 'formal',
    name: 'Formal Event & Gala',
    category: 'Formal',
    description: 'Sophisticated evening wear and formal attire for ceremonies and banquets.',
    default_formality: 'Formal',
    image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['gala', 'black-tie', 'elegance', 'couture', 'evening'])
  },
  {
    id: 'occ_traditional',
    key_name: 'traditional',
    name: 'Traditional Ethnic Wear',
    category: 'Cultural',
    description: 'Authentic traditional silhouettes (Sarees, Kurtas, Anarkalis, Sherwanis) honoring rich cultural crafts.',
    default_formality: 'Festive Traditional',
    image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['traditional', 'heritage', 'handloom', 'jhumkas', 'dupatta'])
  }
];

const catalogueSamples = [
  ['Linen Everyday Shirt', 'top', 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=700&auto=format&fit=crop&q=80', 4200, ['college', 'school', 'office', 'casual'], unsplashLicense('1598033129183-c4f50c736f10')],
  ['Soft Cotton Graphic Tee', 'top', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&auto=format&fit=crop&q=80', 2400, ['college', 'school', 'casual', 'sports'], unsplashLicense('1521572163474-6864f9cf17ab')],
  ['Tailored Navy Trousers', 'bottom', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=700&auto=format&fit=crop&q=80', 5200, ['college', 'office', 'formal', 'casual'], unsplashLicense('1541099649105-f69ad21f3246')],
  ['Relaxed Denim Jeans', 'bottom', 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=700&auto=format&fit=crop&q=80', 4800, ['college', 'school', 'casual'], unsplashLicense('1582418702059-97ebafb35d09')],
  ['Floral Occasion Dress', 'dress', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=700&auto=format&fit=crop&q=80', 6900, ['casual', 'wedding', 'function', 'traditional'], unsplashLicense('1595777457583-95e059d581b8')],
  ['Classic Evening Dress', 'dress', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=700&auto=format&fit=crop&q=80', 8900, ['formal', 'wedding', 'function'], unsplashLicense('1566174053879-31528523f8ae')],
  ['Comfort Court Sneakers', 'shoes', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=700&auto=format&fit=crop&q=80', 5500, ['college', 'school', 'casual', 'sports'], unsplashLicense('1595950653106-6c9ebd614d3a')],
  ['Leather Office Loafers', 'shoes', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=700&auto=format&fit=crop&q=80', 7200, ['office', 'formal', 'function'], unsplashLicense('1543163521-1bf539c55dd2')],
  ['Embroidered Festive Flats', 'shoes', 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=700&auto=format&fit=crop&q=80', 3900, ['traditional', 'temple', 'wedding', 'function'], unsplashLicense('1608256246200-53e635b5b65f')],
  ['Everyday Canvas Backpack', 'bag', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&auto=format&fit=crop&q=80', 3600, ['college', 'school', 'casual'], unsplashLicense('1553062407-98eeb64c6a62')],
  ['Structured Work Tote', 'bag', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&auto=format&fit=crop&q=80', 6400, ['office', 'formal', 'college'], unsplashLicense('1548036328-c9fa89d128fa')],
  ['Evening Clutch Bag', 'bag', 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=700&auto=format&fit=crop&q=80', 4500, ['formal', 'wedding', 'function'], unsplashLicense('1566150905458-1bf1fc113f0d')],
  ['Gold Chain Necklace', 'necklace', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=700&auto=format&fit=crop&q=80', 2900, ['office', 'casual', 'formal', 'wedding'], unsplashLicense('1599643478518-a784e5dc4c8f')],
  ['Festive Statement Earrings', 'accessory', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&auto=format&fit=crop&q=80', 3200, ['traditional', 'temple', 'wedding', 'function'], unsplashLicense('1535632066927-ab7c9ab60908')],
  ['Light Training Jacket', 'jacket', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&auto=format&fit=crop&q=80', 5900, ['college', 'casual', 'sports'], unsplashLicense('1551028719-00167b16eac5')],
  ['Breathable Active Leggings', 'bottom', 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=700&auto=format&fit=crop&q=80', 3400, ['sports', 'casual'], unsplashLicense('1506629082955-511b1aa562c8')],
  ['Cotton Kurta', 'dress', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700&auto=format&fit=crop&q=80', 6100, ['traditional', 'temple', 'function', 'college'], unsplashLicense('1610030469983-98e550d6193c')],
  ['Chanderi Occasion Set', 'dress', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&auto=format&fit=crop&q=80', 9500, ['traditional', 'temple', 'function', 'wedding', 'festival'], unsplashLicense('1583391733956-3750e0ff4e8b')],
  ['Relaxed Knit Top', 'top', 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=700&auto=format&fit=crop&q=80', 0, ['casual', 'college', 'office'], unsplashLicense('1525507119028-ed4c629a60a3')],
  ['Everyday Cotton Blouse', 'top', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&auto=format&fit=crop&q=80', 0, ['office', 'interview', 'casual'], unsplashLicense('1503342217505-b0a15ec3261c')],
  ['Layered Casual Tee', 'top', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&auto=format&fit=crop&q=80', 0, ['casual', 'college'], unsplashLicense('1483985988355-763728e1935b')],
  ['Wide-Leg Casual Trousers', 'bottom', 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=700&auto=format&fit=crop&q=80', 0, ['casual', 'office', 'college'], unsplashLicense('1473966968600-fa801b869a1a')],
  ['Active Stretch Leggings', 'bottom', 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=700&auto=format&fit=crop&q=80', 0, ['sports', 'casual'], unsplashLicense('1506629082955-511b1aa562c8')],
  ['Printed Occasion Dress', 'dress', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&auto=format&fit=crop&q=80', 0, ['casual', 'college', 'party'], unsplashLicense('1583391733956-3750e0ff4e8b')],
  ['Retro Court Sneakers', 'shoes', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=700&auto=format&fit=crop&q=80', 0, ['college', 'casual', 'sports'], unsplashLicense('1460353581641-37baddab0fa2')],
  ['Sporty Red Sneakers', 'shoes', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80', 0, ['sports', 'casual'], unsplashLicense('1542291026-7eec264c27ff')],
  ['Quilted Shoulder Bag', 'bag', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700&auto=format&fit=crop&q=80', 0, ['casual', 'party', 'formal'], unsplashLicense('1584917865442-de89df76afd3')],
  ['Everyday Canvas Tote', 'bag', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&auto=format&fit=crop&q=80', 0, ['college', 'casual', 'school'], unsplashLicense('1553062407-98eeb64c6a62')],
  ['Pearl Pendant Necklace', 'necklace', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=700&auto=format&fit=crop&q=80', 0, ['formal', 'wedding', 'function', 'office'], unsplashLicense('1611652022419-a9419f74343d')],
  ['Layered Chain Necklace', 'necklace', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&auto=format&fit=crop&q=80', 0, ['casual', 'party', 'college'], unsplashLicense('1515562141207-7a88fb7ce338')],
  ['Silver Pendant Necklace', 'necklace', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=700&auto=format&fit=crop&q=80', 0, ['casual', 'office', 'college'], unsplashLicense('1617038220319-276d3cfab638')],
  ['Minimal Gold Necklace', 'necklace', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=700&auto=format&fit=crop&q=80', 0, ['office', 'formal', 'casual', 'party'], unsplashLicense('1599643478518-a784e5dc4c8f')],
  ['Statement Hoop Earrings', 'accessory', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&auto=format&fit=crop&q=80', 0, ['party', 'casual', 'college'], unsplashLicense('1535632066927-ab7c9ab60908')],
  ['Pearl Drop Earrings', 'accessory', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=700&auto=format&fit=crop&q=80', 0, ['wedding', 'formal', 'function'], unsplashLicense('1611652022419-a9419f74343d')],
  ['Festive Hair Accessory', 'accessory', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=700&auto=format&fit=crop&q=80', 0, ['traditional', 'wedding', 'festival', 'temple', 'function'], unsplashLicense('1523293182086-7651a899d37f')],
  ['Colorful Style Scarf', 'accessory', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&auto=format&fit=crop&q=80', 0, ['casual', 'festival', 'traditional'], unsplashLicense('1515562141207-7a88fb7ce338')],
  ['Lightweight Denim Jacket', 'jacket', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&auto=format&fit=crop&q=80', 0, ['casual', 'college'], unsplashLicense('1591047139829-d91aecb6caea')],
  ['Classic Layering Jacket', 'jacket', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&auto=format&fit=crop&q=80', 0, ['office', 'casual', 'formal'], unsplashLicense('1551028719-00167b16eac5')],
  ['Everyday Utility Jacket', 'jacket', 'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=700&auto=format&fit=crop&q=80', 0, ['casual', 'college'], unsplashLicense('1544923246-77307dd654cb')],
  ['Soft Casual Layer Jacket', 'jacket', 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=700&auto=format&fit=crop&q=80', 0, ['casual', 'college'], unsplashLicense('1591369822096-ffd140ec948f')]
];

const allOccasionKeys = occasionsData.map((occasion) => occasion.key_name);

const demoWardrobeItems = [
  {
    id: 'w_001',
    user_id: 'u_demo_user_001',
    name: 'Tailored Linen Blazer',
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
    id: 'w_002',
    user_id: 'u_demo_user_001',
    name: 'High-Rise Straight Chinos',
    category: 'bottom',
    subcategory: 'Trousers',
    color: 'Navy Blue',
    pattern: 'Solid',
    material: 'Cotton Blend',
    season: 'All Season',
    formality: 'Business Casual',
    image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['trousers', 'work', 'smart']),
    is_favorite: 0
  },
  {
    id: 'w_003',
    user_id: 'u_demo_user_001',
    name: 'Silk Crew-Neck Blouse',
    category: 'top',
    subcategory: 'Blouse',
    color: 'Ivory',
    pattern: 'Solid',
    material: 'Silk',
    season: 'All Season',
    formality: 'Smart Casual',
    image_url: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['silk', 'blouse', 'elegant', 'interview']),
    is_favorite: 1
  },
  {
    id: 'w_004',
    user_id: 'u_demo_user_001',
    name: 'Block Heel Leather Loafers',
    category: 'shoes',
    subcategory: 'Loafers',
    color: 'Black',
    pattern: 'Solid',
    material: 'Leather',
    season: 'All Season',
    formality: 'Business Casual',
    image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['shoes', 'loafers', 'comfortable', 'office']),
    is_favorite: 1
  },
  {
    id: 'w_005',
    user_id: 'u_demo_user_001',
    name: 'Structured Leather Work Tote',
    category: 'bag',
    subcategory: 'Tote',
    color: 'Cognac Brown',
    pattern: 'Solid',
    material: 'Leather',
    season: 'All Season',
    formality: 'Business Casual',
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['bag', 'tote', 'work', 'laptop']),
    is_favorite: 1
  },
  {
    id: 'w_006',
    user_id: 'u_demo_user_001',
    name: 'Dainty Gold Herringbone Chain',
    category: 'necklace',
    subcategory: 'Chain',
    color: 'Gold',
    pattern: 'Metallic',
    material: '18k Gold Plated',
    season: 'All Season',
    formality: 'Smart Casual',
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['jewelry', 'gold', 'necklace', 'minimal']),
    is_favorite: 1
  },
  {
    id: 'w_007',
    user_id: 'u_demo_user_001',
    name: 'Embroidered Chanderi Kurta Set',
    category: 'dress',
    subcategory: 'Kurta Set',
    color: 'Emerald Green',
    pattern: 'Embroidered',
    material: 'Chanderi Silk',
    season: 'All Season',
    formality: 'Festive',
    image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['ethnic', 'festival', 'kurta', 'wedding']),
    is_favorite: 1
  },
  {
    id: 'w_008',
    user_id: 'u_demo_user_001',
    name: 'Handcrafted Juttis with Zari',
    category: 'shoes',
    subcategory: 'Juttis',
    color: 'Gold & Green',
    pattern: 'Embroidered',
    material: 'Leather',
    season: 'All Season',
    formality: 'Festive',
    image_url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['juttis', 'traditional', 'ethnic-shoes']),
    is_favorite: 0
  },
  {
    id: 'w_009',
    user_id: 'u_demo_user_001',
    name: 'Kundan Choker with Pearls',
    category: 'necklace',
    subcategory: 'Choker',
    color: 'Gold & Pearl',
    pattern: 'Ornate',
    material: 'Brass & Pearls',
    season: 'All Season',
    formality: 'Festive',
    image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['kundan', 'wedding', 'necklace', 'royal']),
    is_favorite: 1
  },
  {
    id: 'w_010',
    user_id: 'u_demo_user_001',
    name: 'Embellished Potli Bag',
    category: 'bag',
    subcategory: 'Potli',
    color: 'Deep Maroon',
    pattern: 'Beaded',
    material: 'Velvet',
    season: 'All Season',
    formality: 'Festive',
    image_url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['potli', 'bag', 'festive', 'traditional']),
    is_favorite: 0
  },
  {
    id: 'w_011',
    user_id: 'u_demo_user_001',
    name: 'Relaxed Oversized Graphic Tee',
    category: 'top',
    subcategory: 'T-Shirt',
    color: 'Charcoal',
    pattern: 'Graphic',
    material: 'Cotton',
    season: 'Summer',
    formality: 'Casual',
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['college', 'casual', 'tee', 'streetwear']),
    is_favorite: 0
  },
  {
    id: 'w_012',
    user_id: 'u_demo_user_001',
    name: 'Classic Light-Wash Wide Leg Jeans',
    category: 'bottom',
    subcategory: 'Jeans',
    color: 'Light Denim',
    pattern: 'Solid',
    material: 'Denim',
    season: 'All Season',
    formality: 'Casual',
    image_url: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['jeans', 'denim', 'college', 'casual']),
    is_favorite: 1
  },
  {
    id: 'w_013',
    user_id: 'u_demo_user_001',
    name: 'Retro White Court Sneakers',
    category: 'shoes',
    subcategory: 'Sneakers',
    color: 'White',
    pattern: 'Solid',
    material: 'Leather/Rubber',
    season: 'All Season',
    formality: 'Casual',
    image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['sneakers', 'white-sneakers', 'college', 'comfortable']),
    is_favorite: 1
  },
  {
    id: 'w_014',
    user_id: 'u_demo_user_001',
    name: 'Canvas Everyday Backpack',
    category: 'bag',
    subcategory: 'Backpack',
    color: 'Olive Green',
    pattern: 'Solid',
    material: 'Canvas',
    season: 'All Season',
    formality: 'Casual',
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['backpack', 'college', 'casual']),
    is_favorite: 0
  },
  {
    id: 'w_015',
    user_id: 'u_demo_user_001',
    name: 'Seamless Performance Leggings',
    category: 'bottom',
    subcategory: 'Leggings',
    color: 'Black',
    pattern: 'Solid',
    material: 'Spandex/Nylon',
    season: 'All Season',
    formality: 'Athletic',
    image_url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['gym', 'active', 'leggings', 'sports']),
    is_favorite: 0
  },
  {
    id: 'w_016',
    user_id: 'u_demo_user_001',
    name: 'Breathable Moisture-Wicking Tank',
    category: 'top',
    subcategory: 'Tank Top',
    color: 'Coral Pink',
    pattern: 'Solid',
    material: 'Poly-Mesh',
    season: 'Summer',
    formality: 'Athletic',
    image_url: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&auto=format&fit=crop&q=80',
    tags: JSON.stringify(['gym', 'sports', 'running', 'tank']),
    is_favorite: 0
  }
];

async function seed() {
  await db.initDatabase();
  console.log('[Seed] Seeding StyleMate database...');

  // 1. Seed Occasions
  for (const occ of occasionsData) {
    const existing = await db.query('SELECT id FROM occasions WHERE id = ?', [occ.id]);
    if (!existing || existing.length === 0) {
      await db.query(
        `INSERT INTO occasions (id, key_name, name, category, description, default_formality, image_url, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [occ.id, occ.key_name, occ.name, occ.category, occ.description, occ.default_formality, occ.image_url, occ.tags]
      );
    }
  }

  await db.query('DELETE FROM users WHERE email = ?', ['demo@stylemate.ai']);
  await db.query('DELETE FROM product_occasions');

  for (const [name, category, imageUrl, , occasionKeys, imageSource] of catalogueSamples) {
    const existing = await db.query('SELECT id FROM products WHERE name = ?', [name]);
    let productId = existing[0]?.id;
    if (!productId) {
      productId = require('uuid').v4();
      await db.query(
        `INSERT INTO products (id, name, category, image_url, image_source, price_cents, availability, description)
         VALUES (?, ?, ?, ?, ?, 0, 'sample', ?)`,
        [productId, name, category, imageUrl, imageSource, 'Illustrative style inspiration collection.']
      );
    } else {
      await db.query(
        "UPDATE products SET image_source = ?, price_cents = 0, availability = 'sample' WHERE id = ?",
        [imageSource, productId]
      );
    }
    // Only assign genuine, specific occasions mapped to the item; do NOT pad with allOccasionKeys
    const assignedOccasions = [...new Set(occasionKeys)];
    for (const key of assignedOccasions) {
      const occasion = await db.query('SELECT id FROM occasions WHERE key_name = ?', [key]);
      if (occasion.length) {
        const association = await db.query('SELECT product_id FROM product_occasions WHERE product_id = ? AND occasion_id = ?', [productId, occasion[0].id]);
        if (!association.length) {
          await db.query('INSERT INTO product_occasions (product_id, occasion_id) VALUES (?, ?)', [productId, occasion[0].id]);
        }
      }
    }
  }

  console.log('[Seed] Database seeding completed successfully.');
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('[Seed] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = seed;
