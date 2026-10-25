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
  ["Crisp Oversized Poplin White Shirt", "top", "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=700&auto=format&fit=crop&q=80", 4800, ["office","interview","college","formal","school"], "https://unsplash.com/license?photo=1598033129183-c4f50c736f10"],
  ["Linen Everyday Relaxed Shirt", "top", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=700&auto=format&fit=crop&q=80", 4200, ["casual","college","festival","school","function"], "https://unsplash.com/license?photo=1602810318383-e386cc2a3ccf"],
  ["Soft Combed Cotton Crewneck Tee", "top", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&auto=format&fit=crop&q=80", 2400, ["casual","college","school","sports"], "https://unsplash.com/license?photo=1521572163474-6864f9cf17ab"],
  ["Silk Spread-Collar Evening Blouse", "top", "https://images.unsplash.com/photo-1551803091-e20673f15770?w=700&auto=format&fit=crop&q=80", 7200, ["party","formal","function","wedding","office"], "https://unsplash.com/license?photo=1551803091-e20673f15770"],
  ["Tailored Oxford Button-Down Shirt", "top", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&auto=format&fit=crop&q=80", 5400, ["office","interview","school","college","formal"], "https://unsplash.com/license?photo=1596755094514-f87e34085b2c"],
  ["Ribbed Knit Mockneck Top", "top", "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=700&auto=format&fit=crop&q=80", 3800, ["office","college","casual","interview","formal"], "https://unsplash.com/license?photo=1576566588028-4147f3842f27"],
  ["Hand-Embroidered Kurta Tunic", "top", "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700&auto=format&fit=crop&q=80", 6200, ["traditional","temple","festival","wedding","function"], "https://unsplash.com/license?photo=1610030469983-98e550d6193c"],
  ["Breathable Seamless Training Tee", "top", "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&auto=format&fit=crop&q=80", 2900, ["sports","casual","school","college"], "https://unsplash.com/license?photo=1518611012118-696072aa579a"],
  ["Structured Sleeveless Linen Vest Top", "top", "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=700&auto=format&fit=crop&q=80", 4500, ["casual","college","festival","party"], "https://unsplash.com/license?photo=1509631179647-0177331693ae"],
  ["Chiffon Ruffle Formal Blouse", "top", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=80", 6800, ["formal","wedding","function","party","office"], "https://unsplash.com/license?photo=1534528741775-53994a69daeb"],
  ["Fine-Gauge Merino Wool Polo", "top", "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=700&auto=format&fit=crop&q=80", 5900, ["office","interview","casual","college","formal"], "https://unsplash.com/license?photo=1618354691373-d851c5c3a990"],
  ["Vintage Washed Chambray Workshirt", "top", "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=700&auto=format&fit=crop&q=80", 4600, ["casual","college","school","sports"], "https://unsplash.com/license?photo=1589310243389-96a5483213a8"],
  ["Raw Silk Nehru Bandhgala Tunic", "top", "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&auto=format&fit=crop&q=80", 8900, ["traditional","temple","wedding","festival","function"], "https://unsplash.com/license?photo=1583391733956-3750e0ff4e8b"],
  ["Performance Quarter-Zip Athletic Top", "top", "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=700&auto=format&fit=crop&q=80", 4200, ["sports","school","college","casual"], "https://unsplash.com/license?photo=1556906781-9a412961c28c"],
  ["Satin Cowl-Neck Party Camisole", "top", "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&auto=format&fit=crop&q=80", 5100, ["party","formal","function","wedding"], "https://unsplash.com/license?photo=1503342217505-b0a15ec3261c"],
  ["Pure Cotton Temple Puja Kurta", "top", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&auto=format&fit=crop&q=80", 3600, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1506794778202-cad84cf45f1d"],
  ["Classic Piqué Uniform Polo", "top", "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&auto=format&fit=crop&q=80", 3200, ["school","sports","college","casual","office"], "https://unsplash.com/license?photo=1489987707025-afc232f7ea0f"],
  ["Velvet Gold-Zari Festive Kurta", "top", "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=700&auto=format&fit=crop&q=80", 9200, ["wedding","traditional","festival","party","function"], "https://unsplash.com/license?photo=1512436991641-6745cdb1723f"],
  ["Heavyweight Boxy Drop-Shoulder Tee", "top", "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=700&auto=format&fit=crop&q=80", 2800, ["casual","college","school","sports","party"], "https://unsplash.com/license?photo=1578932750294-f5075e85f44a"],
  ["Formal Pleated Wing-Collar Tuxedo Shirt", "top", "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=700&auto=format&fit=crop&q=80", 7500, ["formal","wedding","party","function","interview"], "https://unsplash.com/license?photo=1507679799987-c73779587ccf"],
  ["Athletic High-Stretch Compression Tank", "top", "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=700&auto=format&fit=crop&q=80", 2700, ["sports","casual","school"], "https://unsplash.com/license?photo=1517838277536-f5f99be501cd"],
  ["Handwoven Khadi Temple Kurta", "top", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop&q=80", 4400, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1500648767791-00dcc994a43e"],
  ["Embroidered Lucknowi Chikankari Kurta", "top", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=700&auto=format&fit=crop&q=80", 6900, ["traditional","temple","festival","wedding","function"], "https://unsplash.com/license?photo=1492562080023-ab3db95bfbce"],
  ["Executive French-Cuff Dress Shirt", "top", "https://images.unsplash.com/photo-1620012253295-c15c429fbb3e?w=700&auto=format&fit=crop&q=80", 6200, ["office","interview","formal","wedding","function"], "https://unsplash.com/license?photo=1620012253295-c15c429fbb3e"],
  ["Structured School Uniform Blouse", "top", "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&auto=format&fit=crop&q=80", 3100, ["school","college","interview","office"], "https://unsplash.com/license?photo=1552374196-1ab2a1c593e8"],
  ["Sequin Embellished Party Halter Top", "top", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&auto=format&fit=crop&q=80", 5800, ["party","festival","wedding","function"], "https://unsplash.com/license?photo=1515886657613-9f3515b0c78f"],
  ["Dry-Fit Performance Running Singlet", "top", "https://images.unsplash.com/photo-1483721074573-586540da5703?w=700&auto=format&fit=crop&q=80", 2600, ["sports","casual","school"], "https://unsplash.com/license?photo=1483721074573-586540da5703"],
  ["Brocade Silk Royal Angrakha Top", "top", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=700&auto=format&fit=crop&q=80", 9800, ["wedding","traditional","temple","festival","function"], "https://unsplash.com/license?photo=1544005313-94ddf0286df2"],
  ["Casual Striped Nautical Tee", "top", "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=700&auto=format&fit=crop&q=80", 2500, ["casual","college","school","festival"], "https://unsplash.com/license?photo=1485230895905-ec40ba36b9bc"],
  ["Silk Georgette Interview Shell Top", "top", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&auto=format&fit=crop&q=80", 5500, ["interview","office","formal","college"], "https://unsplash.com/license?photo=1524504388940-b1c1722653e1"],
  ["Tailored Navy Pleated Trousers", "bottom", "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=700&auto=format&fit=crop&q=80", 5600, ["office","interview","formal","college","school"], "https://unsplash.com/license?photo=1541099649105-f69ad21f3246"],
  ["Relaxed Straight-Leg Denim Jeans", "bottom", "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=700&auto=format&fit=crop&q=80", 4900, ["casual","college","school","festival"], "https://unsplash.com/license?photo=1582418702059-97ebafb35d09"],
  ["Breathable High-Waist Athletic Leggings", "bottom", "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=700&auto=format&fit=crop&q=80", 3400, ["sports","casual","school","college"], "https://unsplash.com/license?photo=1506629082955-511b1aa562c8"],
  ["Wide-Leg Pleated Crepe Pants", "bottom", "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=700&auto=format&fit=crop&q=80", 5800, ["office","party","formal","interview","function"], "https://unsplash.com/license?photo=1473966968600-fa801b869a1a"],
  ["Churidar Traditional Cotton Bottom", "bottom", "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&auto=format&fit=crop&q=80", 2900, ["traditional","temple","wedding","festival","function"], "https://unsplash.com/license?photo=1583391733956-3750e0ff4e8b"],
  ["High-Rise Chino Pants in Sand", "bottom", "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&auto=format&fit=crop&q=80", 4400, ["college","office","school","casual","interview"], "https://unsplash.com/license?photo=1591047139829-d91aecb6caea"],
  ["Classic Charcoal Wool Suit Trousers", "bottom", "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=700&auto=format&fit=crop&q=80", 6800, ["formal","interview","office","wedding","function"], "https://unsplash.com/license?photo=1507679799987-c73779587ccf"],
  ["Lightweight Running Performance Shorts", "bottom", "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&auto=format&fit=crop&q=80", 2800, ["sports","school","casual"], "https://unsplash.com/license?photo=1518611012118-696072aa579a"],
  ["Raw Silk Ethnic Dhoti Trousers", "bottom", "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700&auto=format&fit=crop&q=80", 5200, ["traditional","temple","wedding","festival","function"], "https://unsplash.com/license?photo=1610030469983-98e550d6193c"],
  ["Black Leather Party Flared Trousers", "bottom", "https://images.unsplash.com/photo-1551803091-e20673f15770?w=700&auto=format&fit=crop&q=80", 7500, ["party","formal","function","casual"], "https://unsplash.com/license?photo=1551803091-e20673f15770"],
  ["Tailored Smart School Uniform Slacks", "bottom", "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&auto=format&fit=crop&q=80", 3600, ["school","college","interview","office"], "https://unsplash.com/license?photo=1552374196-1ab2a1c593e8"],
  ["Embroidered Festive Silk Sharara", "bottom", "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=700&auto=format&fit=crop&q=80", 7900, ["wedding","traditional","festival","function","party"], "https://unsplash.com/license?photo=1512436991641-6745cdb1723f"],
  ["Tapered Athletic French Terry Joggers", "bottom", "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=700&auto=format&fit=crop&q=80", 3900, ["sports","casual","college","school"], "https://unsplash.com/license?photo=1556906781-9a412961c28c"],
  ["Pencil Skirt in Suiting Stretch", "bottom", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&auto=format&fit=crop&q=80", 4600, ["office","interview","formal","school"], "https://unsplash.com/license?photo=1524504388940-b1c1722653e1"],
  ["Linen Drawstring Temple Trousers", "bottom", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop&q=80", 3800, ["temple","traditional","casual","festival"], "https://unsplash.com/license?photo=1500648767791-00dcc994a43e"],
  ["Pleated Velvet Evening Palazzo Pants", "bottom", "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&auto=format&fit=crop&q=80", 6400, ["party","wedding","formal","function"], "https://unsplash.com/license?photo=1503342217505-b0a15ec3261c"],
  ["Cargo Utility Relaxed Pants", "bottom", "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=700&auto=format&fit=crop&q=80", 4700, ["casual","college","school","festival"], "https://unsplash.com/license?photo=1578932750294-f5075e85f44a"],
  ["Fine Silk Blend Temple Dhoti", "bottom", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&auto=format&fit=crop&q=80", 4200, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1506794778202-cad84cf45f1d"],
  ["Training Compression Base Shorts", "bottom", "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=700&auto=format&fit=crop&q=80", 2600, ["sports","casual","school"], "https://unsplash.com/license?photo=1517838277536-f5f99be501cd"],
  ["Satin Bias-Cut Midi Skirt", "bottom", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=80", 5300, ["party","formal","wedding","function","office"], "https://unsplash.com/license?photo=1534528741775-53994a69daeb"],
  ["Comfort Flex School Uniform Skort", "bottom", "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&auto=format&fit=crop&q=80", 3200, ["school","sports","college"], "https://unsplash.com/license?photo=1489987707025-afc232f7ea0f"],
  ["Zari Weave Festive Gold Trousers", "bottom", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=700&auto=format&fit=crop&q=80", 8400, ["wedding","traditional","festival","function","party"], "https://unsplash.com/license?photo=1544005313-94ddf0286df2"],
  ["Structured Ivory Crepe Trousers", "bottom", "https://images.unsplash.com/photo-1620012253295-c15c429fbb3e?w=700&auto=format&fit=crop&q=80", 5900, ["formal","interview","wedding","office","function"], "https://unsplash.com/license?photo=1620012253295-c15c429fbb3e"],
  ["Distressed Vintage Boyfriend Jeans", "bottom", "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=700&auto=format&fit=crop&q=80", 4800, ["casual","college","school","festival"], "https://unsplash.com/license?photo=1485230895905-ec40ba36b9bc"],
  ["Traditional White Cotton Mundu Bottom", "bottom", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=700&auto=format&fit=crop&q=80", 2500, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1492562080023-ab3db95bfbce"],
  ["Athletic Quick-Dry Track Pants", "bottom", "https://images.unsplash.com/photo-1483721074573-586540da5703?w=700&auto=format&fit=crop&q=80", 3700, ["sports","school","casual","college"], "https://unsplash.com/license?photo=1483721074573-586540da5703"],
  ["Metallic Sequin Party Pants", "bottom", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&auto=format&fit=crop&q=80", 7200, ["party","festival","wedding","function"], "https://unsplash.com/license?photo=1515886657613-9f3515b0c78f"],
  ["High-Waist Tailored Interview Slacks", "bottom", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&auto=format&fit=crop&q=80", 5100, ["interview","office","formal","college"], "https://unsplash.com/license?photo=1596755094514-f87e34085b2c"],
  ["Tiered Floral Garden Occasion Dress", "dress", "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=700&auto=format&fit=crop&q=80", 6900, ["casual","wedding","function","traditional","festival"], "https://unsplash.com/license?photo=1595777457583-95e059d581b8"],
  ["Couture Silk Evening Gala Gown", "dress", "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=700&auto=format&fit=crop&q=80", 12500, ["formal","wedding","function","party"], "https://unsplash.com/license?photo=1566174053879-31528523f8ae"],
  ["Chanderi Handloom Festive Anarkali", "dress", "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&auto=format&fit=crop&q=80", 9800, ["traditional","temple","function","wedding","festival"], "https://unsplash.com/license?photo=1583391733956-3750e0ff4e8b"],
  ["Structured Executive Sheath Dress", "dress", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&auto=format&fit=crop&q=80", 7200, ["office","interview","formal","school"], "https://unsplash.com/license?photo=1596755094514-f87e34085b2c"],
  ["Ribbed Knit Casual T-Shirt Dress", "dress", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&auto=format&fit=crop&q=80", 3800, ["casual","college","school","sports"], "https://unsplash.com/license?photo=1521572163474-6864f9cf17ab"],
  ["Traditional Banarasi Silk Saree Dress", "dress", "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700&auto=format&fit=crop&q=80", 14500, ["traditional","temple","wedding","festival","function"], "https://unsplash.com/license?photo=1610030469983-98e550d6193c"],
  ["Sequin Shimmer Cocktail Mini Dress", "dress", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&auto=format&fit=crop&q=80", 8500, ["party","festival","function","wedding"], "https://unsplash.com/license?photo=1515886657613-9f3515b0c78f"],
  ["Athletic Tennis Racerback Dress", "dress", "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&auto=format&fit=crop&q=80", 4200, ["sports","casual","school","college"], "https://unsplash.com/license?photo=1518611012118-696072aa579a"],
  ["Block-Print Temple Cotton Kurti Dress", "dress", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop&q=80", 4600, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1500648767791-00dcc994a43e"],
  ["Tailored Blazer Dress in Camel", "dress", "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&auto=format&fit=crop&q=80", 8900, ["office","interview","formal","party","college"], "https://unsplash.com/license?photo=1591047139829-d91aecb6caea"],
  ["Embroidered Bridal Heritage Lehenga", "dress", "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=700&auto=format&fit=crop&q=80", 18900, ["wedding","traditional","festival","function"], "https://unsplash.com/license?photo=1512436991641-6745cdb1723f"],
  ["Pleated Academic Pinafore Uniform Dress", "dress", "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&auto=format&fit=crop&q=80", 4100, ["school","college","office","interview"], "https://unsplash.com/license?photo=1552374196-1ab2a1c593e8"],
  ["Satin Slip Dress in Champagne", "dress", "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&auto=format&fit=crop&q=80", 6500, ["party","formal","wedding","function","casual"], "https://unsplash.com/license?photo=1503342217505-b0a15ec3261c"],
  ["Performance Dry-Fit Court Polo Dress", "dress", "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&auto=format&fit=crop&q=80", 3900, ["sports","school","college","casual"], "https://unsplash.com/license?photo=1489987707025-afc232f7ea0f"],
  ["Traditional Temple Kanjeevaram Drape", "dress", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=700&auto=format&fit=crop&q=80", 16500, ["temple","traditional","wedding","festival","function"], "https://unsplash.com/license?photo=1544005313-94ddf0286df2"],
  ["Black-Tie Velvet Evening Column Dress", "dress", "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=700&auto=format&fit=crop&q=80", 11900, ["formal","wedding","party","function"], "https://unsplash.com/license?photo=1507679799987-c73779587ccf"],
  ["Breezy Linen Button-Front Shirt Dress", "dress", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=700&auto=format&fit=crop&q=80", 5200, ["casual","college","school","office","festival"], "https://unsplash.com/license?photo=1602810318383-e386cc2a3ccf"],
  ["Georgette Lucknowi Festive Kurta Dress", "dress", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=700&auto=format&fit=crop&q=80", 7800, ["traditional","temple","wedding","festival","function"], "https://unsplash.com/license?photo=1492562080023-ab3db95bfbce"],
  ["Sophisticated High-Neck Interview Midi", "dress", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&auto=format&fit=crop&q=80", 7400, ["interview","office","formal","school"], "https://unsplash.com/license?photo=1524504388940-b1c1722653e1"],
  ["Active Flex Cross-Back Sports Dress", "dress", "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=700&auto=format&fit=crop&q=80", 3600, ["sports","casual","school"], "https://unsplash.com/license?photo=1517838277536-f5f99be501cd"],
  ["One-Shoulder Cutout Party Midi Dress", "dress", "https://images.unsplash.com/photo-1551803091-e20673f15770?w=700&auto=format&fit=crop&q=80", 7900, ["party","formal","function","wedding"], "https://unsplash.com/license?photo=1551803091-e20673f15770"],
  ["Cotton Poplin Campus Shirtdress", "dress", "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=700&auto=format&fit=crop&q=80", 4400, ["college","school","casual","office"], "https://unsplash.com/license?photo=1598033129183-c4f50c736f10"],
  ["Hand-Embroidered Temple Dupatta Set", "dress", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&auto=format&fit=crop&q=80", 8800, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1506794778202-cad84cf45f1d"],
  ["Formal Off-Shoulder Gala Gown", "dress", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=80", 13200, ["formal","wedding","party","function"], "https://unsplash.com/license?photo=1534528741775-53994a69daeb"],
  ["Casual Denim Overall Jumper Dress", "dress", "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=700&auto=format&fit=crop&q=80", 4900, ["casual","college","school","sports"], "https://unsplash.com/license?photo=1582418702059-97ebafb35d09"],
  ["Festival Mirror-Work Chaniya Choli", "dress", "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=700&auto=format&fit=crop&q=80", 9400, ["festival","traditional","function","wedding","party"], "https://unsplash.com/license?photo=1485230895905-ec40ba36b9bc"],
  ["Tailored Crepe Day-to-Dinner Dress", "dress", "https://images.unsplash.com/photo-1620012253295-c15c429fbb3e?w=700&auto=format&fit=crop&q=80", 6600, ["office","interview","college","function"], "https://unsplash.com/license?photo=1620012253295-c15c429fbb3e"],
  ["Performance Compression Workout Dress", "dress", "https://images.unsplash.com/photo-1483721074573-586540da5703?w=700&auto=format&fit=crop&q=80", 3700, ["sports","casual","school"], "https://unsplash.com/license?photo=1483721074573-586540da5703"],
  ["Minimal Court Leather Sneakers", "shoes", "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=700&auto=format&fit=crop&q=80", 5800, ["college","school","casual","sports"], "https://unsplash.com/license?photo=1595950653106-6c9ebd614d3a"],
  ["Classic Italian Leather Loafers", "shoes", "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=700&auto=format&fit=crop&q=80", 7900, ["office","formal","function","interview","wedding"], "https://unsplash.com/license?photo=1543163521-1bf539c55dd2"],
  ["Handcrafted Embroidered Velvet Juttis", "shoes", "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=700&auto=format&fit=crop&q=80", 4200, ["traditional","temple","wedding","function","festival"], "https://unsplash.com/license?photo=1608256246200-53e635b5b65f"],
  ["Performance Cushion Running Shoes", "shoes", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80", 6900, ["sports","casual","school","college"], "https://unsplash.com/license?photo=1542291026-7eec264c27ff"],
  ["Pointed-Toe Patent Stiletto Pumps", "shoes", "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=700&auto=format&fit=crop&q=80", 8200, ["formal","party","wedding","function","interview"], "https://unsplash.com/license?photo=1543163521-1bf539c55dd2"],
  ["Suede Penny Loafers in Tan", "shoes", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&auto=format&fit=crop&q=80", 6800, ["office","interview","college","casual","formal"], "https://unsplash.com/license?photo=1596755094514-f87e34085b2c"],
  ["Retro Canvas Low-Top Sneakers", "shoes", "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=700&auto=format&fit=crop&q=80", 3600, ["casual","college","school","sports"], "https://unsplash.com/license?photo=1460353581641-37baddab0fa2"],
  ["Kolhapuri Leather Temple Chappals", "shoes", "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700&auto=format&fit=crop&q=80", 3100, ["temple","traditional","festival","casual","function"], "https://unsplash.com/license?photo=1610030469983-98e550d6193c"],
  ["Polished Oxford Formal Dress Shoes", "shoes", "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=700&auto=format&fit=crop&q=80", 8900, ["formal","interview","office","wedding","function"], "https://unsplash.com/license?photo=1507679799987-c73779587ccf"],
  ["Strappy Metallic Party Heels", "shoes", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&auto=format&fit=crop&q=80", 7400, ["party","wedding","festival","function","formal"], "https://unsplash.com/license?photo=1515886657613-9f3515b0c78f"],
  ["Uniform Black Leather Derby Shoes", "shoes", "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&auto=format&fit=crop&q=80", 4800, ["school","interview","office","formal","college"], "https://unsplash.com/license?photo=1552374196-1ab2a1c593e8"],
  ["Royal Zari Mojari Wedding Shoes", "shoes", "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=700&auto=format&fit=crop&q=80", 5600, ["wedding","traditional","festival","function"], "https://unsplash.com/license?photo=1512436991641-6745cdb1723f"],
  ["Trail Stability Training Trainers", "shoes", "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&auto=format&fit=crop&q=80", 6400, ["sports","casual","school","college"], "https://unsplash.com/license?photo=1518611012118-696072aa579a"],
  ["Comfort Low-Block Office Heels", "shoes", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&auto=format&fit=crop&q=80", 5900, ["office","interview","school","formal"], "https://unsplash.com/license?photo=1524504388940-b1c1722653e1"],
  ["Pure Leather Slip-On Temple Sandals", "shoes", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop&q=80", 3400, ["temple","traditional","casual","festival"], "https://unsplash.com/license?photo=1500648767791-00dcc994a43e"],
  ["Platform Chunky Party Ankle Boots", "shoes", "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&auto=format&fit=crop&q=80", 7800, ["party","casual","college","festival"], "https://unsplash.com/license?photo=1503342217505-b0a15ec3261c"],
  ["High-Top Basketball Street Sneakers", "shoes", "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=700&auto=format&fit=crop&q=80", 6200, ["college","casual","school","sports"], "https://unsplash.com/license?photo=1578932750294-f5075e85f44a"],
  ["Embroidered Silk Temple Flats", "shoes", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&auto=format&fit=crop&q=80", 3800, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1506794778202-cad84cf45f1d"],
  ["Cap-Toe Executive Oxford Shoes", "shoes", "https://images.unsplash.com/photo-1620012253295-c15c429fbb3e?w=700&auto=format&fit=crop&q=80", 8600, ["office","interview","formal","wedding","function"], "https://unsplash.com/license?photo=1620012253295-c15c429fbb3e"],
  ["High-Traction Marathon Running Shoes", "shoes", "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=700&auto=format&fit=crop&q=80", 7100, ["sports","casual","school"], "https://unsplash.com/license?photo=1556906781-9a412961c28c"],
  ["Crystal Embellished Evening Stilettos", "shoes", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=80", 9500, ["wedding","formal","party","function"], "https://unsplash.com/license?photo=1534528741775-53994a69daeb"],
  ["School Uniform Lace-Up Oxford Shoes", "shoes", "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&auto=format&fit=crop&q=80", 3900, ["school","college","interview","office"], "https://unsplash.com/license?photo=1489987707025-afc232f7ea0f"],
  ["Traditional Gold Zari Wedding Juttis", "shoes", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=700&auto=format&fit=crop&q=80", 6200, ["wedding","traditional","festival","function","temple"], "https://unsplash.com/license?photo=1544005313-94ddf0286df2"],
  ["Chunky Lug-Sole Campus Loafers", "shoes", "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=700&auto=format&fit=crop&q=80", 5400, ["college","casual","school","office"], "https://unsplash.com/license?photo=1598033129183-c4f50c736f10"],
  ["Lightweight Aerobic Gym Trainers", "shoes", "https://images.unsplash.com/photo-1483721074573-586540da5703?w=700&auto=format&fit=crop&q=80", 4900, ["sports","school","casual"], "https://unsplash.com/license?photo=1483721074573-586540da5703"],
  ["Glitter Strap Festive Block Heels", "shoes", "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=700&auto=format&fit=crop&q=80", 6700, ["party","festival","wedding","function"], "https://unsplash.com/license?photo=1485230895905-ec40ba36b9bc"],
  ["Polished Dress Monk-Strap Shoes", "shoes", "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=700&auto=format&fit=crop&q=80", 8400, ["office","interview","formal","wedding"], "https://unsplash.com/license?photo=1541099649105-f69ad21f3246"],
  ["Braided Strap Ethnic Temple Chappals", "shoes", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=700&auto=format&fit=crop&q=80", 3200, ["temple","traditional","festival","casual"], "https://unsplash.com/license?photo=1492562080023-ab3db95bfbce"],
  ["Heavy-Duty Canvas Campus Backpack", "bag", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&auto=format&fit=crop&q=80", 3800, ["college","school","casual","sports"], "https://unsplash.com/license?photo=1553062407-98eeb64c6a62"],
  ["Structured Leather Office Laptop Tote", "bag", "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&auto=format&fit=crop&q=80", 7200, ["office","interview","formal","college"], "https://unsplash.com/license?photo=1548036328-c9fa89d128fa"],
  ["Satin Hard-Shell Evening Clutch", "bag", "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=700&auto=format&fit=crop&q=80", 4900, ["formal","wedding","party","function"], "https://unsplash.com/license?photo=1566150905458-1bf1fc113f0d"],
  ["Quilted Crossbody Leather Camera Bag", "bag", "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700&auto=format&fit=crop&q=80", 5400, ["casual","party","college","festival"], "https://unsplash.com/license?photo=1584917865442-de89df76afd3"],
  ["Traditional Embroidered Potli Bag", "bag", "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=700&auto=format&fit=crop&q=80", 3200, ["traditional","temple","wedding","function","festival"], "https://unsplash.com/license?photo=1608256246200-53e635b5b65f"],
  ["Ventilated Athletic Gym Duffel Bag", "bag", "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&auto=format&fit=crop&q=80", 4100, ["sports","school","college","casual"], "https://unsplash.com/license?photo=1518611012118-696072aa579a"],
  ["Executive Slim Leather Briefcase", "bag", "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=700&auto=format&fit=crop&q=80", 8800, ["office","interview","formal","function"], "https://unsplash.com/license?photo=1507679799987-c73779587ccf"],
  ["Handwoven Jute Temple Market Tote", "bag", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop&q=80", 2200, ["temple","traditional","casual","festival"], "https://unsplash.com/license?photo=1500648767791-00dcc994a43e"],
  ["Crystal Evening Minaudière Clutch", "bag", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&auto=format&fit=crop&q=80", 6800, ["party","wedding","formal","function"], "https://unsplash.com/license?photo=1515886657613-9f3515b0c78f"],
  ["Reinforced Student School Backpack", "bag", "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&auto=format&fit=crop&q=80", 3400, ["school","college","casual","sports"], "https://unsplash.com/license?photo=1552374196-1ab2a1c593e8"],
  ["Raw Silk Zari-Work Wedding Bag", "bag", "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=700&auto=format&fit=crop&q=80", 4500, ["wedding","traditional","festival","function"], "https://unsplash.com/license?photo=1512436991641-6745cdb1723f"],
  ["Hydration Running Belt Waist Bag", "bag", "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=700&auto=format&fit=crop&q=80", 2500, ["sports","casual","school"], "https://unsplash.com/license?photo=1556906781-9a412961c28c"],
  ["Classic Neutral Leather Work Satchel", "bag", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&auto=format&fit=crop&q=80", 6900, ["office","interview","formal","college"], "https://unsplash.com/license?photo=1524504388940-b1c1722653e1"],
  ["Pure Cotton Sacred Temple Puja Bag", "bag", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&auto=format&fit=crop&q=80", 1800, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1506794778202-cad84cf45f1d"],
  ["Metallic Chain Party Shoulder Bag", "bag", "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&auto=format&fit=crop&q=80", 5200, ["party","festival","casual","function"], "https://unsplash.com/license?photo=1503342217505-b0a15ec3261c"],
  ["Minimalist Waterproof Campus Daypack", "bag", "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=700&auto=format&fit=crop&q=80", 3900, ["college","school","casual","sports"], "https://unsplash.com/license?photo=1578932750294-f5075e85f44a"],
  ["Formal Velvet Envelope Gala Clutch", "bag", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=80", 5900, ["formal","wedding","party","function"], "https://unsplash.com/license?photo=1534528741775-53994a69daeb"],
  ["Heavyweight Cotton Canvas Book Bag", "bag", "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&auto=format&fit=crop&q=80", 2800, ["school","college","casual","office"], "https://unsplash.com/license?photo=1489987707025-afc232f7ea0f"],
  ["Embroidered Brocade Wedding Potli", "bag", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=700&auto=format&fit=crop&q=80", 4200, ["wedding","traditional","temple","festival","function"], "https://unsplash.com/license?photo=1544005313-94ddf0286df2"],
  ["Structured Top-Handle Professional Bag", "bag", "https://images.unsplash.com/photo-1620012253295-c15c429fbb3e?w=700&auto=format&fit=crop&q=80", 7500, ["office","interview","formal","wedding","function"], "https://unsplash.com/license?photo=1620012253295-c15c429fbb3e"],
  ["Sport Mesh Water-Resistant Backpack", "bag", "https://images.unsplash.com/photo-1483721074573-586540da5703?w=700&auto=format&fit=crop&q=80", 3600, ["sports","school","casual"], "https://unsplash.com/license?photo=1483721074573-586540da5703"],
  ["Beaded Bohemian Festival Crossbody", "bag", "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=700&auto=format&fit=crop&q=80", 3500, ["festival","casual","party","traditional"], "https://unsplash.com/license?photo=1485230895905-ec40ba36b9bc"],
  ["Tailored Leather Portfolio Folder", "bag", "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=700&auto=format&fit=crop&q=80", 4800, ["interview","office","formal","school"], "https://unsplash.com/license?photo=1541099649105-f69ad21f3246"],
  ["Handloom Ethnic Temple Carryall", "bag", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=700&auto=format&fit=crop&q=80", 2600, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1492562080023-ab3db95bfbce"],
  ["Compact Sports Drawstring Sackpack", "bag", "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=700&auto=format&fit=crop&q=80", 1900, ["sports","school","casual"], "https://unsplash.com/license?photo=1517838277536-f5f99be501cd"],
  ["Sequin Fold-Over Nightout Clutch", "bag", "https://images.unsplash.com/photo-1551803091-e20673f15770?w=700&auto=format&fit=crop&q=80", 4700, ["party","wedding","formal","function"], "https://unsplash.com/license?photo=1551803091-e20673f15770"],
  ["Everyday Organic Cotton Groceries Tote", "bag", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=700&auto=format&fit=crop&q=80", 1800, ["casual","temple","festival","college"], "https://unsplash.com/license?photo=1602810318383-e386cc2a3ccf"],
  ["Executive Leather Document Attaché", "bag", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&auto=format&fit=crop&q=80", 8400, ["office","interview","formal","school"], "https://unsplash.com/license?photo=1596755094514-f87e34085b2c"],
  ["Delicate 18K Gold Cable Chain", "necklace", "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=700&auto=format&fit=crop&q=80", 3200, ["office","casual","formal","interview","school"], "https://unsplash.com/license?photo=1599643478518-a784e5dc4c8f"],
  ["Cultured Freshwater Pearl Choker", "necklace", "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=700&auto=format&fit=crop&q=80", 5800, ["formal","wedding","function","office","interview"], "https://unsplash.com/license?photo=1611652022419-a9419f74343d"],
  ["Layered Celestial Coin Necklace", "necklace", "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&auto=format&fit=crop&q=80", 3600, ["casual","party","college","festival"], "https://unsplash.com/license?photo=1515562141207-7a88fb7ce338"],
  ["Traditional Temple Kundan Haar", "necklace", "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700&auto=format&fit=crop&q=80", 8900, ["traditional","temple","wedding","festival","function"], "https://unsplash.com/license?photo=1610030469983-98e550d6193c"],
  ["Geometric Sterling Silver Pendant", "necklace", "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=700&auto=format&fit=crop&q=80", 2900, ["office","college","casual","interview","school"], "https://unsplash.com/license?photo=1617038220319-276d3cfab638"],
  ["High-Impact Crystal Collar Necklace", "necklace", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&auto=format&fit=crop&q=80", 6900, ["party","formal","wedding","function"], "https://unsplash.com/license?photo=1515886657613-9f3515b0c78f"],
  ["Sport Waterproof Silicone ID Cord", "necklace", "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&auto=format&fit=crop&q=80", 1500, ["sports","school","casual"], "https://unsplash.com/license?photo=1518611012118-696072aa579a"],
  ["Rudraksha Sacred Temple Mala Beads", "necklace", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop&q=80", 2400, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1500648767791-00dcc994a43e"],
  ["Regal Polki Diamond Wedding Choker", "necklace", "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=700&auto=format&fit=crop&q=80", 14500, ["wedding","traditional","festival","function","party"], "https://unsplash.com/license?photo=1512436991641-6745cdb1723f"],
  ["Academic Uniform Lanyard Chain", "necklace", "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&auto=format&fit=crop&q=80", 1600, ["school","college","office","interview"], "https://unsplash.com/license?photo=1552374196-1ab2a1c593e8"],
  ["Athletic Stainless Steel Dog Tag", "necklace", "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=700&auto=format&fit=crop&q=80", 2200, ["sports","casual","school","college"], "https://unsplash.com/license?photo=1556906781-9a412961c28c"],
  ["Minimalist Solitaire Diamond Pendant", "necklace", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&auto=format&fit=crop&q=80", 4900, ["office","interview","formal","school"], "https://unsplash.com/license?photo=1524504388940-b1c1722653e1"],
  ["Sacred Tulsi Temple Bead Necklace", "necklace", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&auto=format&fit=crop&q=80", 1800, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1506794778202-cad84cf45f1d"],
  ["Chunky Gold Link Party Necklace", "necklace", "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&auto=format&fit=crop&q=80", 4400, ["party","festival","casual","college"], "https://unsplash.com/license?photo=1503342217505-b0a15ec3261c"],
  ["Beaded Bohemian Campus Choker", "necklace", "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=700&auto=format&fit=crop&q=80", 2100, ["college","casual","festival","school"], "https://unsplash.com/license?photo=1578932750294-f5075e85f44a"],
  ["Diamond Pavé Formal Tennis Necklace", "necklace", "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=700&auto=format&fit=crop&q=80", 11500, ["formal","wedding","party","function"], "https://unsplash.com/license?photo=1507679799987-c73779587ccf"],
  ["Temple Gold Coin Kasu Mala", "necklace", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=700&auto=format&fit=crop&q=80", 9600, ["temple","traditional","wedding","festival","function"], "https://unsplash.com/license?photo=1544005313-94ddf0286df2"],
  ["Bar Pendant Minimalist Office Chain", "necklace", "https://images.unsplash.com/photo-1620012253295-c15c429fbb3e?w=700&auto=format&fit=crop&q=80", 2800, ["office","interview","formal","college","school"], "https://unsplash.com/license?photo=1620012253295-c15c429fbb3e"],
  ["Performance Cord Fitness Whistle Chain", "necklace", "https://images.unsplash.com/photo-1483721074573-586540da5703?w=700&auto=format&fit=crop&q=80", 1400, ["sports","school","casual"], "https://unsplash.com/license?photo=1483721074573-586540da5703"],
  ["Mirror-Work Tribal Festive Necklace", "necklace", "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=700&auto=format&fit=crop&q=80", 3800, ["festival","traditional","casual","function","party"], "https://unsplash.com/license?photo=1485230895905-ec40ba36b9bc"],
  ["Classic Pearl Strand Interview Necklace", "necklace", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&auto=format&fit=crop&q=80", 5200, ["interview","office","formal","school"], "https://unsplash.com/license?photo=1596755094514-f87e34085b2c"],
  ["Sandalwood Sacred Temple Necklace", "necklace", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=700&auto=format&fit=crop&q=80", 2200, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1492562080023-ab3db95bfbce"],
  ["Athletic Sweat-Resistant Chain", "necklace", "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=700&auto=format&fit=crop&q=80", 1700, ["sports","casual","school"], "https://unsplash.com/license?photo=1517838277536-f5f99be501cd"],
  ["Lightweight Titanium Magnetic Sport Necklace", "necklace", "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&auto=format&fit=crop&q=80", 2600, ["sports","casual","school","college"], "https://unsplash.com/license?photo=1548036328-c9fa89d128fa"],
  ["Rhinestone Cascading Party Choker", "necklace", "https://images.unsplash.com/photo-1551803091-e20673f15770?w=700&auto=format&fit=crop&q=80", 5600, ["party","formal","wedding","function"], "https://unsplash.com/license?photo=1551803091-e20673f15770"],
  ["Hand-Knotted Thread Festival Necklace", "necklace", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=700&auto=format&fit=crop&q=80", 2400, ["casual","festival","college","traditional"], "https://unsplash.com/license?photo=1602810318383-e386cc2a3ccf"],
  ["Heirloom Navratan Wedding Necklace", "necklace", "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&auto=format&fit=crop&q=80", 12800, ["wedding","traditional","festival","function"], "https://unsplash.com/license?photo=1583391733956-3750e0ff4e8b"],
  ["Fine Cable Pearl Pendant Chain", "necklace", "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=700&auto=format&fit=crop&q=80", 3400, ["office","interview","formal","school"], "https://unsplash.com/license?photo=1541099649105-f69ad21f3246"],
  ["Black Onyx Cocktail Gala Necklace", "necklace", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=80", 6200, ["formal","party","wedding","function"], "https://unsplash.com/license?photo=1534528741775-53994a69daeb"],
  ["Classic Tailored Navy Wool Blazer", "jacket", "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&auto=format&fit=crop&q=80", 8900, ["office","interview","formal","college","school"], "https://unsplash.com/license?photo=1591047139829-d91aecb6caea"],
  ["Vintage Washed Denim Trucker Jacket", "jacket", "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&auto=format&fit=crop&q=80", 5900, ["casual","college","school","festival"], "https://unsplash.com/license?photo=1551028719-00167b16eac5"],
  ["Lightweight Weatherproof Windbreaker", "jacket", "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&auto=format&fit=crop&q=80", 4800, ["sports","casual","school","college"], "https://unsplash.com/license?photo=1518611012118-696072aa579a"],
  ["Royal Velvet Embroidered Bandhgala Coat", "jacket", "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=700&auto=format&fit=crop&q=80", 13500, ["wedding","traditional","festival","function","formal"], "https://unsplash.com/license?photo=1512436991641-6745cdb1723f"],
  ["Minimalist Structured Crepe Blazer", "jacket", "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=700&auto=format&fit=crop&q=80", 7800, ["office","interview","formal","school"], "https://unsplash.com/license?photo=1544923246-77307dd654cb"],
  ["Oversized Leather Biker Party Jacket", "jacket", "https://images.unsplash.com/photo-1551803091-e20673f15770?w=700&auto=format&fit=crop&q=80", 9200, ["party","casual","college","festival"], "https://unsplash.com/license?photo=1551803091-e20673f15770"],
  ["Raw Silk Temple Nehru Waistcoat", "jacket", "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700&auto=format&fit=crop&q=80", 5400, ["temple","traditional","festival","wedding","function"], "https://unsplash.com/license?photo=1610030469983-98e550d6193c"],
  ["Athletic Full-Zip Warmup Track Jacket", "jacket", "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=700&auto=format&fit=crop&q=80", 4400, ["sports","school","college","casual"], "https://unsplash.com/license?photo=1556906781-9a412961c28c"],
  ["Classic Black-Tie Satin Lapel Tuxedo Jacket", "jacket", "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=700&auto=format&fit=crop&q=80", 14900, ["formal","wedding","party","function","interview"], "https://unsplash.com/license?photo=1507679799987-c73779587ccf"],
  ["Wool Academic Uniform Blazer", "jacket", "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&auto=format&fit=crop&q=80", 6800, ["school","college","interview","office"], "https://unsplash.com/license?photo=1552374196-1ab2a1c593e8"],
  ["Handwoven Tussar Silk Temple Jacket", "jacket", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop&q=80", 6200, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1500648767791-00dcc994a43e"],
  ["Cropped Sequin Evening Shrug Jacket", "jacket", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&auto=format&fit=crop&q=80", 5800, ["party","wedding","formal","function"], "https://unsplash.com/license?photo=1515886657613-9f3515b0c78f"],
  ["Heritage Gold-Embroidered Sherwani Jacket", "jacket", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=700&auto=format&fit=crop&q=80", 17500, ["wedding","traditional","festival","function"], "https://unsplash.com/license?photo=1544005313-94ddf0286df2"],
  ["High-Ventilation Running Shell Jacket", "jacket", "https://images.unsplash.com/photo-1483721074573-586540da5703?w=700&auto=format&fit=crop&q=80", 4900, ["sports","casual","school"], "https://unsplash.com/license?photo=1483721074573-586540da5703"],
  ["Tailored Double-Breasted Executive Blazer", "jacket", "https://images.unsplash.com/photo-1620012253295-c15c429fbb3e?w=700&auto=format&fit=crop&q=80", 9400, ["office","interview","formal","function"], "https://unsplash.com/license?photo=1620012253295-c15c429fbb3e"],
  ["Cozy Fleece Campus Pullover Jacket", "jacket", "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=700&auto=format&fit=crop&q=80", 3900, ["college","casual","school","sports"], "https://unsplash.com/license?photo=1578932750294-f5075e85f44a"],
  ["Traditional Khadi Nehru Vest Jacket", "jacket", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&auto=format&fit=crop&q=80", 4200, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1506794778202-cad84cf45f1d"],
  ["Metallic Shimmer Nightout Bomber Jacket", "jacket", "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&auto=format&fit=crop&q=80", 7400, ["party","festival","casual","function"], "https://unsplash.com/license?photo=1503342217505-b0a15ec3261c"],
  ["Single-Button Interview Suiting Jacket", "jacket", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&auto=format&fit=crop&q=80", 8200, ["interview","office","formal","school"], "https://unsplash.com/license?photo=1524504388940-b1c1722653e1"],
  ["Thermal Quilted Athletic Trainer Jacket", "jacket", "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=700&auto=format&fit=crop&q=80", 5200, ["sports","casual","school"], "https://unsplash.com/license?photo=1517838277536-f5f99be501cd"],
  ["Embroidered Brocade Wedding Koti Jacket", "jacket", "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&auto=format&fit=crop&q=80", 8600, ["wedding","traditional","festival","function","temple"], "https://unsplash.com/license?photo=1583391733956-3750e0ff4e8b"],
  ["Soft Unstructured Casual Linen Blazer", "jacket", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=700&auto=format&fit=crop&q=80", 6400, ["casual","college","school","festival"], "https://unsplash.com/license?photo=1602810318383-e386cc2a3ccf"],
  ["Refined Ivory Gala Tuxedo Jacket", "jacket", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=80", 13800, ["formal","wedding","party","function"], "https://unsplash.com/license?photo=1534528741775-53994a69daeb"],
  ["Traditional Chikankari Festive Nehru Vest", "jacket", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=700&auto=format&fit=crop&q=80", 5600, ["traditional","temple","festival","wedding","function"], "https://unsplash.com/license?photo=1492562080023-ab3db95bfbce"],
  ["Water-Resistant Campus Windcheater", "jacket", "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&auto=format&fit=crop&q=80", 4300, ["school","sports","college","casual"], "https://unsplash.com/license?photo=1489987707025-afc232f7ea0f"],
  ["Festival Mirror-Work Ethnic Jacket", "jacket", "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=700&auto=format&fit=crop&q=80", 6900, ["festival","traditional","party","casual"], "https://unsplash.com/license?photo=1485230895905-ec40ba36b9bc"],
  ["Sharp Pinstripe Interview Suiting Coat", "jacket", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&auto=format&fit=crop&q=80", 8900, ["interview","office","formal","school"], "https://unsplash.com/license?photo=1596755094514-f87e34085b2c"],
  ["Lightweight Trench Duster Coat", "jacket", "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=700&auto=format&fit=crop&q=80", 9600, ["office","interview","college","casual","formal"], "https://unsplash.com/license?photo=1598033129183-c4f50c736f10"],
  ["Handcrafted Temple Jhumka Earrings", "accessory", "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&auto=format&fit=crop&q=80", 3200, ["traditional","temple","wedding","function","festival"], "https://unsplash.com/license?photo=1535632066927-ab7c9ab60908"],
  ["Classic Italian Leather Dress Belt", "accessory", "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&auto=format&fit=crop&q=80", 3600, ["office","interview","formal","school","wedding"], "https://unsplash.com/license?photo=1548036328-c9fa89d128fa"],
  ["UV400 Polarized Designer Sunglasses", "accessory", "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=700&auto=format&fit=crop&q=80", 4200, ["casual","college","festival","sports"], "https://unsplash.com/license?photo=1511499767150-a48a237f0083"],
  ["Athletic Terry Sweatband & Wristband Set", "accessory", "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&auto=format&fit=crop&q=80", 1400, ["sports","school","casual"], "https://unsplash.com/license?photo=1518611012118-696072aa579a"],
  ["Festive Pearl & Zari Maang Tikka", "accessory", "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=700&auto=format&fit=crop&q=80", 2800, ["traditional","wedding","festival","temple","function"], "https://unsplash.com/license?photo=1523293182086-7651a899d37f"],
  ["Silk Formal Tuxedo Bowtie & Pocket Square", "accessory", "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=700&auto=format&fit=crop&q=80", 3100, ["formal","wedding","function","party","interview"], "https://unsplash.com/license?photo=1507679799987-c73779587ccf"],
  ["Embroidered Pashmina Evening Shawl", "accessory", "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=700&auto=format&fit=crop&q=80", 6800, ["wedding","traditional","formal","festival","function"], "https://unsplash.com/license?photo=1512436991641-6745cdb1723f"],
  ["School Uniform Stripe Tie & Badge", "accessory", "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&auto=format&fit=crop&q=80", 1800, ["school","college","interview","office"], "https://unsplash.com/license?photo=1552374196-1ab2a1c593e8"],
  ["Traditional Temple Brass Bangles Set", "accessory", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop&q=80", 2400, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1500648767791-00dcc994a43e"],
  ["Crystal Chandelier Party Drop Earrings", "accessory", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&auto=format&fit=crop&q=80", 3800, ["party","wedding","festival","function"], "https://unsplash.com/license?photo=1515886657613-9f3515b0c78f"],
  ["Breathable Sport Athletic Running Cap", "accessory", "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=700&auto=format&fit=crop&q=80", 2200, ["sports","casual","school","college"], "https://unsplash.com/license?photo=1556906781-9a412961c28c"],
  ["Fine Leather Minimalist Office Cardholder", "accessory", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&auto=format&fit=crop&q=80", 2600, ["office","interview","formal","school"], "https://unsplash.com/license?photo=1524504388940-b1c1722653e1"],
  ["Sacred Temple Rudraksha Wrist Bracelet", "accessory", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&auto=format&fit=crop&q=80", 1600, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1506794778202-cad84cf45f1d"],
  ["Sparkling Rhinestone Party Hairband", "accessory", "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&auto=format&fit=crop&q=80", 2500, ["party","festival","function","wedding"], "https://unsplash.com/license?photo=1503342217505-b0a15ec3261c"],
  ["Woven Canvas Campus D-Ring Belt", "accessory", "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=700&auto=format&fit=crop&q=80", 1900, ["college","casual","school","sports"], "https://unsplash.com/license?photo=1578932750294-f5075e85f44a"],
  ["Cufflinks Set in Sterling Silver & Onyx", "accessory", "https://images.unsplash.com/photo-1620012253295-c15c429fbb3e?w=700&auto=format&fit=crop&q=80", 3400, ["formal","interview","office","wedding","function"], "https://unsplash.com/license?photo=1620012253295-c15c429fbb3e"],
  ["Traditional Golden Temple Kamarbandh", "accessory", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=700&auto=format&fit=crop&q=80", 4600, ["wedding","traditional","temple","festival","function"], "https://unsplash.com/license?photo=1544005313-94ddf0286df2"],
  ["High-Tension Athletic Sports Headband", "accessory", "https://images.unsplash.com/photo-1483721074573-586540da5703?w=700&auto=format&fit=crop&q=80", 1200, ["sports","school","casual"], "https://unsplash.com/license?photo=1483721074573-586540da5703"],
  ["Boho Embroidered Mirror Festival Belt", "accessory", "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=700&auto=format&fit=crop&q=80", 2700, ["festival","traditional","casual","party"], "https://unsplash.com/license?photo=1485230895905-ec40ba36b9bc"],
  ["Classic Professional Leather Wristwatch", "accessory", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&auto=format&fit=crop&q=80", 5900, ["office","interview","formal","school","college"], "https://unsplash.com/license?photo=1596755094514-f87e34085b2c"],
  ["Festive Red Silk Temple Chunari Stole", "accessory", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=700&auto=format&fit=crop&q=80", 2100, ["temple","traditional","festival","function"], "https://unsplash.com/license?photo=1492562080023-ab3db95bfbce"],
  ["Thermal Sport Grip Workout Gloves", "accessory", "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=700&auto=format&fit=crop&q=80", 2300, ["sports","casual","school"], "https://unsplash.com/license?photo=1517838277536-f5f99be501cd"],
  ["Glossy Enamel Formal Tie Clip", "accessory", "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=700&auto=format&fit=crop&q=80", 1900, ["office","interview","formal","school"], "https://unsplash.com/license?photo=1541099649105-f69ad21f3246"],
  ["Velvet Opera Evening Party Gloves", "accessory", "https://images.unsplash.com/photo-1551803091-e20673f15770?w=700&auto=format&fit=crop&q=80", 3500, ["party","formal","wedding","function"], "https://unsplash.com/license?photo=1551803091-e20673f15770"],
  ["Soft Cotton Gauze Summer Scarf", "accessory", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=700&auto=format&fit=crop&q=80", 2200, ["casual","festival","college","school"], "https://unsplash.com/license?photo=1602810318383-e386cc2a3ccf"],
  ["Bridal Kundan Matha Patti Headdress", "accessory", "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&auto=format&fit=crop&q=80", 6400, ["wedding","traditional","festival","function"], "https://unsplash.com/license?photo=1583391733956-3750e0ff4e8b"],
  ["School Crest Uniform Enamel Pin", "accessory", "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&auto=format&fit=crop&q=80", 1100, ["school","college","interview","office"], "https://unsplash.com/license?photo=1489987707025-afc232f7ea0f"],
  ["Refined Satin Formal Cummerbund", "accessory", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=80", 3800, ["formal","wedding","party","function"], "https://unsplash.com/license?photo=1534528741775-53994a69daeb"]
];;

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

  // Optionally provision an admin account if explicit environment variables are supplied at runtime.
  // Never hardcode personal accounts or fixed credentials into seeding scripts.
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const adminEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const existing = await db.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (!existing || existing.length === 0) {
      const bcrypt = require('bcryptjs');
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      const name = process.env.ADMIN_NAME || 'StyleMate Admin';
      await db.query(
        'INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
        [id, adminEmail, hash, name, 'admin']
      );
      await db.query(
        'INSERT INTO profiles (user_id, gender, age_group, body_type, skin_tone) VALUES (?, ?, ?, ?, ?)',
        [id, 'Other', '25-34', 'Athletic', 'Medium']
      );
      await db.query(
        'INSERT INTO user_preferences (user_id, preferred_styles, preferred_colors, formality_level) VALUES (?, ?, ?, ?)',
        [id, JSON.stringify(['Casual', 'Smart Casual']), JSON.stringify([]), 'Smart Casual']
      );
      console.log(`[Seed] Provisioned admin account from environment variable.`);
    }
  }

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
