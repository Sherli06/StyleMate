-- StyleMate Database Schema for MySQL 8.0+
-- Database: stylemate_db

CREATE DATABASE IF NOT EXISTS stylemate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE stylemate_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Profiles Table (Predefined style attributes per mad project.pdf)
CREATE TABLE IF NOT EXISTS profiles (
    user_id VARCHAR(36) PRIMARY KEY,
    gender ENUM('Female', 'Male', 'Non-binary', 'Other') NOT NULL DEFAULT 'Female',
    age_group ENUM('18-24', '25-34', '35-44', '45-54', '55+') NOT NULL DEFAULT '18-24',
    height_category ENUM('Petite (<160cm)', 'Average (160-175cm)', 'Tall (>175cm)') NOT NULL DEFAULT 'Average (160-175cm)',
    body_type ENUM('Hourglass', 'Pear', 'Rectangle', 'Inverted Triangle', 'Apple', 'Athletic') NOT NULL DEFAULT 'Hourglass',
    skin_tone ENUM('Fair', 'Light', 'Medium', 'Olive', 'Deep', 'Warm Ebony') NOT NULL DEFAULT 'Medium',
    face_shape ENUM('Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Oblong') NOT NULL DEFAULT 'Oval',
    hair_type ENUM('Straight', 'Wavy', 'Curly', 'Coily', 'Short Crop', 'Braided') NOT NULL DEFAULT 'Wavy',
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    language VARCHAR(50) NOT NULL DEFAULT 'English',
    style_history TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Personal Style Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id VARCHAR(36) PRIMARY KEY,
    preferred_styles TEXT NOT NULL, -- JSON array of styles: e.g. ["Casual", "Ethnic", "Minimalist"]
    preferred_colors TEXT NOT NULL, -- JSON array of colors: e.g. ["Navy", "Emerald", "Beige"]
    disliked_colors TEXT NULL,      -- JSON array of colors: e.g. ["Neon Green"]
    formality_level VARCHAR(50) NOT NULL DEFAULT 'Smart Casual',
    feedback_weights TEXT NULL,     -- JSON object tracking category/color preference weights learned from ratings
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Occasions Table
CREATE TABLE IF NOT EXISTS occasions (
    id VARCHAR(50) PRIMARY KEY,
    key_name VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category ENUM('Academic', 'Professional', 'Celebration', 'Social', 'Fitness', 'Cultural', 'Formal') NOT NULL,
    description TEXT NOT NULL,
    default_formality ENUM('Casual', 'Smart Casual', 'Business Casual', 'Formal', 'Festive Traditional', 'Athletic') NOT NULL,
    image_url TEXT NOT NULL,
    tags TEXT NOT NULL, -- JSON array of tags
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Wardrobe Items Table
CREATE TABLE IF NOT EXISTS wardrobe_items (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    category ENUM('top', 'bottom', 'dress', 'shoes', 'bag', 'necklace', 'jacket', 'accessory') NOT NULL,
    subcategory VARCHAR(80) NULL,
    color VARCHAR(50) NOT NULL,
    pattern VARCHAR(50) DEFAULT 'Solid',
    material VARCHAR(50) DEFAULT 'Cotton',
    season ENUM('All Season', 'Summer', 'Winter', 'Spring/Fall', 'Monsoon') DEFAULT 'All Season',
    formality ENUM('Casual', 'Smart Casual', 'Business Casual', 'Formal', 'Festive', 'Athletic') DEFAULT 'Casual',
    image_url TEXT NOT NULL,
    tags TEXT NULL, -- JSON array
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_wardrobe_user (user_id),
    INDEX idx_wardrobe_category (category)
);

-- 6. Outfits Table (AI generated or saved recommendations)
CREATE TABLE IF NOT EXISTS outfits (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    occasion_id VARCHAR(50) NOT NULL,
    occasion_name VARCHAR(100) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    weather_summary VARCHAR(150) NULL,
    ai_model_used VARCHAR(80) NOT NULL DEFAULT 'rule-matrix-v1',
    style_notes TEXT NULL,
    match_score INT NOT NULL DEFAULT 95,
    is_ai_generated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_outfits_user (user_id)
);

-- 7. Outfit Items Link Table (Wardrobe items combined into an outfit)
CREATE TABLE IF NOT EXISTS outfit_items (
    id VARCHAR(36) PRIMARY KEY,
    outfit_id VARCHAR(36) NOT NULL,
    wardrobe_item_id VARCHAR(36) NOT NULL,
    item_role ENUM('primary_top', 'primary_bottom', 'full_body', 'footwear', 'accessory_necklace', 'accessory_bag', 'outerwear', 'accessory_other') NOT NULL,
    FOREIGN KEY (outfit_id) REFERENCES outfits(id) ON DELETE CASCADE,
    FOREIGN KEY (wardrobe_item_id) REFERENCES wardrobe_items(id) ON DELETE CASCADE,
    INDEX idx_outfit_items_outfit (outfit_id)
);

-- 8. Recommendation Feedback Table (Rating feedback loop)
CREATE TABLE IF NOT EXISTS recommendation_feedback (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    outfit_id VARCHAR(36) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT NULL,
    worn BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (outfit_id) REFERENCES outfits(id) ON DELETE CASCADE,
    INDEX idx_feedback_user (user_id)
);
