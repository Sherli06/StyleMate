const path = require('path');
const request = require('supertest');
const { app } = require('../src/server');
const db = require('../src/db/connection');
const migrate = require('../src/db/migrate');
const seed = require('../src/db/seed');

let authToken = '';
let testUserId = '';
let wardrobeItemId = '';
let outfitId = '';
let adminToken = '';
let productId = '';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DB_ENGINE = 'sqlite';
  await db.initDatabase('sqlite');
  await migrate();
  await seed();
});

afterAll(async () => {
  await db.closePool();
});

// ════════════════════════════════════════════════════════════════════════════
// 1. AUTH TESTS
// ════════════════════════════════════════════════════════════════════════════
describe('Auth Endpoints', () => {
  test('POST /api/auth/register — creates a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('X-StyleMate-Client', 'mobile')
      .send({
        email: 'test@stylemate.ai',
        password: 'Test1234!x',
        full_name: 'Test User',
        role: 'admin',
        age_group: '25-34',
        gender: 'Non-binary',
        skin_tone: 'Olive'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@stylemate.ai');
    expect(res.body.user.role).toBe('user');
    authToken = res.body.token;
    testUserId = res.body.user.id;
  });

  test('POST /api/auth/register — rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@stylemate.ai', password: 'Test1234!x', full_name: 'Duplicate' });
    expect(res.statusCode).toBe(409);
  });

  test('POST /api/auth/register — rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad@test.com' });
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/auth/register — rejects invalid onboarding options', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid-profile@stylemate.ai', password: 'Test1234!x', full_name: 'Invalid Profile', age_group: '10-12' });
    expect(res.statusCode).toBe(400);
  });

  test('web registration uses an HttpOnly cookie without returning a bearer token', async () => {
    const created = await request(app)
      .post('/api/auth/register')
      .send({ email: 'cookie-session@stylemate.ai', password: 'CookiePass123!', full_name: 'Cookie Session' });
    expect(created.statusCode).toBe(201);
    expect(created.body.token).toBeUndefined();
    const cookie = created.headers['set-cookie'][0].split(';')[0];
    expect(created.headers['set-cookie'][0]).toMatch(/HttpOnly/i);

    const currentUser = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);
    expect(currentUser.statusCode).toBe(200);

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);
    expect(logout.statusCode).toBe(200);
    const invalidated = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);
    expect(invalidated.statusCode).toBe(401);
  });

  test('POST /api/auth/login — logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('X-StyleMate-Client', 'mobile')
      .send({ email: 'test@stylemate.ai', password: 'Test1234!x' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    authToken = res.body.token; // refresh token
  });

  test('POST /api/auth/login — rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@stylemate.ai', password: 'WrongPass' });
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/auth/login — locks out repeated failed attempts', async () => {
    const registration = await request(app)
      .post('/api/auth/register')
      .send({ email: 'lockout@stylemate.ai', password: 'CorrectPass123!', full_name: 'Lockout Test' });
    expect(registration.statusCode).toBe(201);
    const statuses = [];
    for (let attempt = 1; attempt <= 8; attempt += 1) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'lockout@stylemate.ai', password: 'WrongPassword' });
      statuses.push(response.statusCode);
    }
    expect(statuses).toEqual([401, 401, 401, 401, 401, 401, 401, 429]);
    const locked = await request(app)
      .post('/api/auth/login')
      .send({ email: 'lockout@stylemate.ai', password: 'CorrectPass123!' });
    expect(locked.statusCode).toBe(429);
  });

  test('GET /api/auth/me — returns current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('test@stylemate.ai');
  });

  test('GET /api/auth/me — rejects missing token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. PROFILE TESTS
// ════════════════════════════════════════════════════════════════════════════
describe('Profile Endpoints', () => {
  test('GET /api/profile — returns user profile', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.profile).toBeDefined();
    expect(res.body.enums).toBeDefined();
    expect(res.body.profile.age_group).toBe('25-34');
    expect(res.body.profile.gender).toBe('Non-binary');
    expect(res.body.profile.skin_tone).toBe('Olive');
  });

  test('PUT /api/profile — updates profile fields', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ body_type: 'Pear', skin_tone: 'Fair', country: 'India' });
    expect(res.statusCode).toBe(200);
    expect(res.body.profile.body_type).toBe('Pear');
    expect(res.body.profile.skin_tone).toBe('Fair');
  });

  test('profile changes are retained when loaded again', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.profile.body_type).toBe('Pear');
    expect(res.body.profile.skin_tone).toBe('Fair');
  });

  test('PUT /api/profile — rejects invalid enum value', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ body_type: 'InvalidShape' });
    expect(res.statusCode).toBe(400);
  });

  test('GET /api/profile/preferences — returns preferences', async () => {
    const res = await request(app)
      .get('/api/profile/preferences')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.preferences).toBeDefined();
  });

  test('PUT /api/profile/preferences — updates preferences', async () => {
    const res = await request(app)
      .put('/api/profile/preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        preferred_styles: ['Ethnic', 'Minimalist'],
        preferred_colors: ['Navy', 'Ivory'],
        formality_level: 'Smart Casual'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.preferences.preferred_styles).toEqual(['Ethnic', 'Minimalist']);
  });

  test('GET /api/profile/preferences — returns saved preferences after update', async () => {
    const res = await request(app)
      .get('/api/profile/preferences')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.preferences.preferred_colors).toEqual(['Navy', 'Ivory']);
  });
});

describe('Shared catalogue and favorites', () => {
  test('regular users cannot create products and admin can', async () => {
    const forbidden = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Unauthorized listing' });
    expect(forbidden.statusCode).toBe(403);

    const registration = await request(app)
      .post('/api/auth/register')
      .set('X-StyleMate-Client', 'mobile')
      .send({ email: 'catalog-admin@stylemate.ai', password: 'AdminPass123!', full_name: 'Catalogue Admin' });
    expect(registration.statusCode).toBe(201);
    await db.query('UPDATE users SET role = ? WHERE id = ?', ['admin', registration.body.user.id]);
    const login = await request(app)
      .post('/api/auth/login')
      .set('X-StyleMate-Client', 'mobile')
      .send({ email: 'catalog-admin@stylemate.ai', password: 'AdminPass123!' });
    expect(login.statusCode).toBe(200);
    adminToken = login.body.token;

    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Available Shirt',
        category: 'top',
        image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=700',
        image_source: 'https://unsplash.com/license',
        occasions: ['college']
      });
    expect(created.statusCode).toBe(201);
    productId = created.body.product.id;
    const stored = await db.query('SELECT id, category, image_url FROM products WHERE id = ?', [productId]);
    expect(stored[0]).toMatchObject({ id: productId, category: 'top' });

    const filtered = await request(app).get('/api/products?category=top&occasion=college');
    expect(filtered.statusCode).toBe(200);
    expect(filtered.body.products.some((product) => product.id === productId)).toBe(true);
  });

  test('category and occasion filters return relevant distinct catalogue items without universal padding', async () => {
    // Verify all 8 categories exist with at least five distinct items per category
    const categories = await db.query('SELECT category, COUNT(DISTINCT id) AS item_count FROM products GROUP BY category');
    expect(categories).toHaveLength(8);
    expect(categories.every((entry) => Number(entry.item_count) >= 5)).toBe(true);

    const duplicatedNames = await db.query(
      'SELECT name FROM products GROUP BY name HAVING COUNT(DISTINCT category) > 1'
    );
    expect(duplicatedNames).toHaveLength(0);

    // Verify combined category and occasion filter returns relevant results
    const collegeTops = await request(app).get('/api/products?category=top&occasion=college');
    expect(collegeTops.statusCode).toBe(200);
    expect(collegeTops.body.products.length).toBeGreaterThanOrEqual(1);
    expect(collegeTops.body.products.every((p) => p.category === 'top' && p.occasions.includes('college'))).toBe(true);

    const sportsBottoms = await request(app).get('/api/products?category=bottom&occasion=sports');
    expect(sportsBottoms.statusCode).toBe(200);
    expect(sportsBottoms.body.products.length).toBeGreaterThanOrEqual(1);
    expect(sportsBottoms.body.products.every((p) => p.category === 'bottom' && p.occasions.includes('sports'))).toBe(true);

    // Verify that products are NOT padded with all occasions universally
    const sportsLeggings = await db.query(
      `SELECT o.key_name FROM product_occasions po
       JOIN products p ON p.id = po.product_id
       JOIN occasions o ON o.id = po.occasion_id
       WHERE p.name = 'Breathable Active Leggings'`
    );
    const assignedKeys = sportsLeggings.map((r) => r.key_name);
    expect(assignedKeys).not.toContain('wedding');
    expect(assignedKeys).not.toContain('temple');
  });

  test('users can save and remove sample catalogue items as favorites', async () => {
    const added = await request(app)
      .post(`/api/favorites/${productId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});
    expect(added.statusCode).toBe(200);
    expect(added.body.products.some((item) => item.id === productId)).toBe(true);

    const restored = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${authToken}`);
    expect(restored.statusCode).toBe(200);
    expect(restored.body.products.some((item) => item.id === productId)).toBe(true);

    const removed = await request(app)
      .delete(`/api/favorites/${productId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(removed.statusCode).toBe(200);
    expect(removed.body.products.some((item) => item.id === productId)).toBe(false);
  });

  test('admin can delete a catalogue product and regular user cannot', async () => {
    // Create a temporary product to test deletion
    const toDeleteRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Item To Delete',
        category: 'jacket',
        image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700',
        image_source: 'https://unsplash.com/license',
        occasions: ['casual']
      });
    expect(toDeleteRes.statusCode).toBe(201);
    const deleteId = toDeleteRes.body.product.id;

    // Regular user attempt
    const denied = await request(app)
      .delete(`/api/products/${deleteId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(denied.statusCode).toBe(403);

    // Admin deletion
    const deleted = await request(app)
      .delete(`/api/products/${deleteId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.statusCode).toBe(200);

    const lookup = await db.query('SELECT id FROM products WHERE id = ?', [deleteId]);
    expect(lookup).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. WARDROBE TESTS
// ════════════════════════════════════════════════════════════════════════════
describe('Wardrobe Endpoints', () => {
  test('POST /api/wardrobe — adds a wardrobe item', async () => {
    const res = await request(app)
      .post('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Cotton Tee',
        category: 'top',
        color: 'Navy Blue',
        pattern: 'Solid',
        material: 'Cotton',
        season: 'All Season',
        formality: 'Casual',
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600',
        tags: ['casual', 'tee']
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.item.name).toBe('Test Cotton Tee');
    wardrobeItemId = res.body.item.id;
  });

  test('POST /api/wardrobe — rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'No Category' });
    expect(res.statusCode).toBe(400);
  });

  test('GET /api/wardrobe — lists user wardrobe items', async () => {
    const res = await request(app)
      .get('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/wardrobe/:id — gets single item', async () => {
    const res = await request(app)
      .get(`/api/wardrobe/${wardrobeItemId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.item.id).toBe(wardrobeItemId);
  });

  test('PUT /api/wardrobe/:id — updates item', async () => {
    const res = await request(app)
      .put(`/api/wardrobe/${wardrobeItemId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ color: 'Charcoal', is_favorite: true });
    expect(res.statusCode).toBe(200);
  });

  // Add more items for recommendation engine to work
  test('POST /api/wardrobe — add bottom item', async () => {
    const res = await request(app)
      .post('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Chinos',
        category: 'bottom',
        color: 'Beige',
        formality: 'Business Casual',
        image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600'
      });
    expect(res.statusCode).toBe(201);
  });

  test('POST /api/wardrobe — add shoes item', async () => {
    const res = await request(app)
      .post('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Sneakers',
        category: 'shoes',
        color: 'White',
        formality: 'Casual',
        image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600'
      });
    expect(res.statusCode).toBe(201);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. OCCASIONS TESTS
// ════════════════════════════════════════════════════════════════════════════
describe('Occasions Endpoints', () => {
  test('GET /api/occasions — lists all occasions', async () => {
    const res = await request(app).get('/api/occasions');
    expect(res.statusCode).toBe(200);
    expect(res.body.occasions.length).toBeGreaterThanOrEqual(8);
  });

  test('GET /api/occasions/:id — gets single occasion', async () => {
    const res = await request(app).get('/api/occasions/occ_college');
    expect(res.statusCode).toBe(200);
    expect(res.body.occasion.key_name).toBe('college');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. RECOMMENDATION TESTS
// ════════════════════════════════════════════════════════════════════════════
describe('Recommendation Endpoints', () => {
  test('POST /api/recommendations/generate — generates outfit recommendations', async () => {
    const res = await request(app)
      .post('/api/recommendations/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ occasion_id: 'occ_college', max_outfits: 2 });
    expect(res.statusCode).toBe(200);
    expect(res.body.outfits.length).toBeGreaterThanOrEqual(1);
    expect(res.body.weather).toBeDefined();
    expect(res.body.outfits[0]).not.toHaveProperty('match_score');
    expect(res.body.outfits[0].is_ai_generated).toBe(false);
    outfitId = res.body.outfits[0].id;
  });

  test('GET /api/recommendations — lists past recommendations', async () => {
    const res = await request(app)
      .get('/api/recommendations')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.outfits.length).toBeGreaterThanOrEqual(1);
  });

  test('POST /api/recommendations/:id/feedback — submits feedback', async () => {
    const res = await request(app)
      .post(`/api/recommendations/${outfitId}/feedback`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ rating: 5, feedback_text: 'Love this look!', worn: true });
    expect(res.statusCode).toBe(201);
  });

  test('POST /api/recommendations/:id/feedback — rejects invalid rating', async () => {
    const res = await request(app)
      .post(`/api/recommendations/${outfitId}/feedback`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ rating: 10 });
    expect(res.statusCode).toBe(400);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. OWNERSHIP / SECURITY TESTS
// ════════════════════════════════════════════════════════════════════════════
describe('Ownership & Security', () => {
  let otherToken = '';
  let uploadedItemId = '';

  test('Register a second user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('X-StyleMate-Client', 'mobile')
      .send({ email: 'other@stylemate.ai', password: 'Other1234!', full_name: 'Other User' });
    expect(res.statusCode).toBe(201);
    otherToken = res.body.token;
  });

  test('second user cannot change the first user profile', async () => {
    const updated = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ skin_tone: 'Deep' });
    expect(updated.statusCode).toBe(200);

    const firstUser = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${authToken}`);
    expect(firstUser.body.profile.skin_tone).toBe('Fair');
  });

  test('Second user cannot see first user wardrobe items', async () => {
    const res = await request(app)
      .get(`/api/wardrobe/${wardrobeItemId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.statusCode).toBe(404);
  });

  test('Second user cannot delete first user wardrobe items', async () => {
    const res = await request(app)
      .delete(`/api/wardrobe/${wardrobeItemId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.statusCode).toBe(404);
  });

  test('uploaded wardrobe image is available only to its owner', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/SjoAAAAASUVORK5CYII=', 'base64');
    const created = await request(app)
      .post('/api/wardrobe')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', 'Private upload test')
      .field('category', 'top')
      .field('color', 'Blue')
      .attach('image', png, { filename: 'private.png', contentType: 'image/png' });
    expect(created.statusCode).toBe(201);
    uploadedItemId = created.body.item.id;

    const ownerImage = await request(app)
      .get(`/api/wardrobe/${uploadedItemId}/image`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(ownerImage.statusCode).toBe(200);
    expect(ownerImage.headers['content-type']).toMatch(/image\/png/);
    expect(ownerImage.headers['cache-control']).toBe('private, no-store');

    const otherImage = await request(app)
      .get(`/api/wardrobe/${uploadedItemId}/image`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(otherImage.statusCode).toBe(404);
  });

  test('users cannot see each other favorites and logout revokes the old session', async () => {
    await request(app)
      .post(`/api/favorites/${productId}`)
      .set('Authorization', `Bearer ${authToken}`);
    const otherFavorites = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${otherToken}`);
    expect(otherFavorites.statusCode).toBe(200);
    expect(otherFavorites.body.products).toHaveLength(0);

    const oldToken = authToken;
    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${oldToken}`);
    expect(logout.statusCode).toBe(200);
    const invalidated = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${oldToken}`);
    expect(invalidated.statusCode).toBe(401);

    const relogin = await request(app)
      .post('/api/auth/login')
      .set('X-StyleMate-Client', 'mobile')
      .send({ email: 'test@stylemate.ai', password: 'Test1234!x' });
    expect(relogin.statusCode).toBe(200);
    authToken = relogin.body.token;
    const restoredFavorites = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${authToken}`);
    expect(restoredFavorites.body.products.some((item) => item.id === productId)).toBe(true);

    const removedFavorite = await request(app)
      .delete(`/api/favorites/${productId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(removedFavorite.statusCode).toBe(200);
    const deleted = await request(app)
      .delete(`/api/wardrobe/${uploadedItemId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(deleted.statusCode).toBe(200);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. STUBS TESTS
// ════════════════════════════════════════════════════════════════════════════
describe('Stubs & Weather', () => {
  test('GET /api/stubs/weather — reports that no provider is configured', async () => {
    const res = await request(app).get('/api/stubs/weather');
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toMatch(/not configured/i);
  });

  test('POST /api/stubs/ar-tryon — returns AR stub', async () => {
    const res = await request(app)
      .post('/api/stubs/ar-tryon')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ outfit_id: outfitId });
    expect(res.statusCode).toBe(200);
    expect(res.body.available).toBe(false);
  });

  test('GET /api/health — returns health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. VIRTUAL TRY-ON (FASHN INTEGRATION) TESTS
// ════════════════════════════════════════════════════════════════════════════
describe('Virtual Try-On Endpoints', () => {
  test('GET /api/tryon/config — returns try-on availability and supported categories', async () => {
    const res = await request(app).get('/api/tryon/config');
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.available).toBe('boolean');
    expect(res.body.available).toBe(true);
    expect(res.body.provider).toBe('idm-vton');
    expect(Array.isArray(res.body.supported_categories)).toBe(true);
    expect(res.body.supported_categories).toEqual(['top', 'jacket', 'bottom', 'dress']);
    expect(res.body.supported_categories).not.toContain('shoes');
    expect(res.body.supported_categories).not.toContain('bag');
  });

  test('POST /api/tryon/generate — rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/tryon/generate')
      .send({ product_id: 'some-id', model_image: 'https://example.com/model.jpg', consent: true });
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/tryon/generate — rejects requests without consent', async () => {
    const res = await request(app)
      .post('/api/tryon/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ product_id: 'some-id', model_image: 'https://example.com/model.jpg', consent: false });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/consent/i);
  });

  test('POST /api/tryon/generate — rejects missing model image', async () => {
    const res = await request(app)
      .post('/api/tryon/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ product_id: 'some-id', model_image: '', consent: true });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/model_image/i);
  });

  test('POST /api/tryon/generate — returns 404 when product missing', async () => {
    const res = await request(app)
      .post('/api/tryon/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        product_id: 'non-existent-id',
        model_image: 'https://example.com/model.jpg',
        consent: true
      });
    expect(res.statusCode).toBe(404);
  });

  test('POST /api/tryon/generate — rejects unsupported categories (shoes/accessories) for IDM-VTON', async () => {
    // Find a shoes product from catalogue
    const productsRes = await request(app).get('/api/products?category=shoes');
    expect(productsRes.statusCode).toBe(200);
    const shoeProduct = productsRes.body.products.find(p => p.category === 'shoes');
    expect(shoeProduct).toBeDefined();

    const res = await request(app)
      .post('/api/tryon/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        product_id: shoeProduct.id,
        model_image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
        consent: true
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/not supported for virtual try-on/i);
    expect(res.body.error).toMatch(/shoes/i);
  });

  test('GET /api/tryon/status/:predictionId — rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/tryon/status/test-prediction-123');
    expect(res.statusCode).toBe(401);
  });

  test('tryonAdapter unified router correctly exports provider status and methods', () => {
    const tryonAdapter = require('../src/services/tryonAdapter');
    expect(tryonAdapter.getActiveProviderName()).toBe('idm-vton');
    expect(tryonAdapter.isConfigured()).toBe(true);
    expect(tryonAdapter.getSupportedCategories()).toEqual(['top', 'jacket', 'bottom', 'dress']);
  });

  test('idmVtonAdapter toBlob handles base64 data URIs and validates input', async () => {
    const { toBlob } = require('../src/services/idmVtonAdapter');
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = await toBlob(dataUri, path.resolve(__dirname, '../uploads'));
    expect(blob).toBeDefined();
    expect(blob.type).toBe('image/png');

    await expect(toBlob('', path.resolve(__dirname, '../uploads'))).rejects.toThrow();
  });

  test('toAccessibleImage converts local upload paths to Data URI and preserves public URLs', () => {
    const { toAccessibleImage } = require('../src/services/fashnAdapter');
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    expect(toAccessibleImage(dataUri)).toBe(dataUri);

    const publicUrl = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800';
    expect(toAccessibleImage(publicUrl)).toBe(publicUrl);

    // Test with the existing sample upload file in api/uploads
    const localUploadUrl = 'http://localhost:5000/uploads/5fdc9353-c01b-478d-aa87-33a906ffc8e4.png';
    const resolved = toAccessibleImage(localUploadUrl);
    expect(resolved.startsWith('data:image/png;base64,')).toBe(true);
  });
});
