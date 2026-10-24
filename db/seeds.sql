-- StyleMate Seed Data for MySQL
USE stylemate_db;

-- Predefined Occasions as specified in mad project.pdf
INSERT INTO occasions (id, key_name, name, category, description, default_formality, image_url, tags) VALUES
('occ_college', 'college', 'College & Campus', 'Academic', 'Relaxed, effortless, and comfortable campus style suitable for classes, labs, and casual hanging out.', 'Casual', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80', '["campus", "casual", "comfortable", "backpack", "sneakers"]'),
('occ_office', 'office', 'Office & Workwear', 'Professional', 'Polished business casual attire balancing professional authority with all-day desk comfort.', 'Business Casual', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80', '["professional", "workwear", "blazer", "tote", "tailored"]'),
('occ_interview', 'interview', 'Job Interview', 'Professional', 'Crisp, structured formal outfits engineered to convey confidence, competence, and sharp presentation.', 'Formal', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80', '["formal", "confidence", "suit", "oxfords", "structured"]'),
('occ_wedding', 'wedding', 'Wedding Celebration', 'Celebration', 'Luxurious celebration outfits with rich fabrics, elegant jewelry, and opulent occasion footwear.', 'Festive Traditional', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80', '["celebration", "ceremony", "silk", "heels", "jewelry"]'),
('occ_party', 'party', 'Party & Night Out', 'Social', 'Eye-catching glamorous silhouettes, statement accessories, and stylish evening wear.', 'Smart Casual', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80', '["evening", "glamour", "statement", "clutch", "chic"]'),
('occ_festival', 'festival', 'Festival & Cultural Fair', 'Cultural', 'Vibrant festive ensembles celebrating regional heritage with colorful embroidery and traditional adornments.', 'Festive Traditional', 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80', '["festive", "traditional", "colors", "ethnic", "adornment"]'),
('occ_casual', 'casual', 'Casual Outing & Weekend', 'Social', 'Chic relaxed weekend looks for brunch, cafe hopping, park strolls, and travel.', 'Casual', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80', '["weekend", "brunch", "denim", "crossbody", "sunglasses"]'),
('occ_sports', 'sports', 'Sports & Activewear', 'Fitness', 'High-performance athletic apparel optimized for movement, gym sessions, and outdoor recreation.', 'Athletic', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80', '["fitness", "gym", "sneakers", "breathable", "activewear"]'),
('occ_formal', 'formal', 'Black Tie & Gala', 'Formal', 'Sophisticated evening gowns and sharp tuxedo attire for high-profile galas and banquets.', 'Formal', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80', '["gala", "black-tie", "elegance", "couture", "evening"]'),
('occ_traditional', 'traditional', 'Traditional Ethnic Wear', 'Cultural', 'Authentic traditional silhouettes (Sarees, Kurtas, Anarkalis, Sherwanis) honoring rich cultural crafts.', 'Festive Traditional', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80', '["traditional", "heritage", "handloom", "jhumkas", "dupatta"]')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), image_url=VALUES(image_url);

-- Demo User: demo@stylemate.ai
-- Password: "Password123!" (bcrypt hash: $2a$10$7vUf8pQ1t3X3Xk2z0uYJLeS5Vf5N4qB3wG8R0zY.K1O8pL0d1eWqy or generated on seed)
-- We insert demo user id: 'u_demo_user_001'
INSERT INTO users (id, email, password_hash, full_name) VALUES
('u_demo_user_001', 'demo@stylemate.ai', '$2a$10$w8T0iL6j1gN6A3bC5dE7Fu2G9hI1jK3lM5nO7pQ9rS1tU3vW5xYza', 'Pooja Sharma')
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Demo User Profile
INSERT INTO profiles (user_id, gender, age_group, height_category, body_type, skin_tone, face_shape, hair_type, country, language, style_history) VALUES
('u_demo_user_001', 'Female', '18-24', 'Average (160-175cm)', 'Hourglass', 'Medium', 'Oval', 'Wavy', 'India', 'English', 'Enjoys smart casual blazers, indie ethnic kurtis, and clean minimalist sneakers.')
ON DUPLICATE KEY UPDATE body_type=VALUES(body_type), skin_tone=VALUES(skin_tone);

-- Demo User Preferences
INSERT INTO user_preferences (user_id, preferred_styles, preferred_colors, disliked_colors, formality_level, feedback_weights) VALUES
('u_demo_user_001', '["Smart Casual", "Ethnic", "Minimalist"]', '["Navy Blue", "Ivory", "Terracotta", "Forest Green"]', '["Neon Yellow"]', 'Smart Casual', '{"top": 1.2, "shoes": 1.1, "accessory": 1.15, "color_Navy Blue": 1.3}')
ON DUPLICATE KEY UPDATE preferred_styles=VALUES(preferred_styles);

-- Demo Wardrobe Items
INSERT INTO wardrobe_items (id, user_id, name, category, subcategory, color, pattern, material, season, formality, image_url, tags, is_favorite) VALUES
('w_001', 'u_demo_user_001', 'Tailored Linen Blazer', 'jacket', 'Blazer', 'Beige', 'Solid', 'Linen', 'Spring/Fall', 'Business Casual', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80', '["blazer", "neutral", "office", "chic"]', TRUE),
('w_002', 'u_demo_user_001', 'High-Rise Straight Chinos', 'bottom', 'Trousers', 'Navy Blue', 'Solid', 'Cotton Blend', 'All Season', 'Business Casual', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80', '["trousers", "work", "smart"]', FALSE),
('w_003', 'u_demo_user_001', 'Silk Crew-Neck Blouse', 'top', 'Blouse', 'Ivory', 'Solid', 'Silk', 'All Season', 'Smart Casual', 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&auto=format&fit=crop&q=80', '["silk", "blouse", "elegant", "interview"]', TRUE),
('w_004', 'u_demo_user_001', 'Block Heel Loafers', 'shoes', 'Loafers', 'Black', 'Solid', 'Leather', 'All Season', 'Business Casual', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80', '["shoes", "loafers", "comfortable", "office"]', TRUE),
('w_005', 'u_demo_user_001', 'Structured Leather Work Tote', 'bag', 'Tote', 'Cognac Brown', 'Solid', 'Leather', 'All Season', 'Business Casual', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80', '["bag", "tote", "work", "laptop"]', TRUE),
('w_006', 'u_demo_user_001', 'Dainty Gold Herringbone Chain', 'necklace', 'Chain', 'Gold', 'Metallic', '18k Gold Plated', 'All Season', 'Smart Casual', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80', '["jewelry", "gold", "necklace", "minimal"]', TRUE),
('w_007', 'u_demo_user_001', 'Embroidered Chanderi Kurta Set', 'dress', 'Kurta Set', 'Emerald Green', 'Embroidered', 'Chanderi Silk', 'All Season', 'Festive', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80', '["ethnic", "festival", "kurta", "wedding"]', TRUE),
('w_008', 'u_demo_user_001', 'Handcrafted Juttis with Zari', 'shoes', 'Juttis', 'Gold & Green', 'Embroidered', 'Leather', 'All Season', 'Festive', 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80', '["juttis", "traditional", "ethnic-shoes"]', FALSE),
('w_009', 'u_demo_user_001', 'Kundan Choker with Pearls', 'necklace', 'Choker', 'Gold & Pearl', 'Ornate', 'Brass & Pearls', 'All Season', 'Festive', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80', '["kundan", "wedding", "necklace", "royal"]', TRUE),
('w_010', 'u_demo_user_001', 'Embellished Potli Bag', 'bag', 'Potli', 'Deep Maroon', 'Beaded', 'Velvet', 'All Season', 'Festive', 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&auto=format&fit=crop&q=80', '["potli", "bag", "festive", "traditional"]', FALSE),
('w_011', 'u_demo_user_001', 'Relaxed Oversized Graphic Tee', 'top', 'T-Shirt', 'Charcoal', 'Graphic', 'Cotton', 'Summer', 'Casual', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80', '["college", "casual", "tee", "streetwear"]', FALSE),
('w_012', 'u_demo_user_001', 'Classic Light-Wash Wide Leg Jeans', 'bottom', 'Jeans', 'Light Denim', 'Solid', 'Denim', 'All Season', 'Casual', 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=600&auto=format&fit=crop&q=80', '["jeans", "denim", "college", "casual"]', TRUE),
('w_013', 'u_demo_user_001', 'Retro White Court Sneakers', 'shoes', 'Sneakers', 'White', 'Solid', 'Leather/Rubber', 'All Season', 'Casual', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80', '["sneakers", "white-sneakers", "college", "comfortable"]', TRUE),
('w_014', 'u_demo_user_001', 'Canvas Everyday Backpack', 'bag', 'Backpack', 'Olive Green', 'Solid', 'Canvas', 'All Season', 'Casual', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80', '["backpack", "college", "casual"]', FALSE),
('w_015', 'u_demo_user_001', 'Seamless Performance Leggings', 'bottom', 'Leggings', 'Black', 'Solid', 'Spandex/Nylon', 'All Season', 'Athletic', 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&auto=format&fit=crop&q=80', '["gym", "active", "leggings", "sports"]', FALSE),
('w_016', 'u_demo_user_001', 'Breathable Moisture-Wicking Tank', 'top', 'Tank Top', 'Coral Pink', 'Solid', 'Poly-Mesh', 'Summer', 'Athletic', 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&auto=format&fit=crop&q=80', '["gym", "sports", "running", "tank"]', FALSE)
ON DUPLICATE KEY UPDATE name=VALUES(name);
