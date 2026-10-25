/**
 * StyleMate web client for the Express API.
 */

const API_BASE = window.location.origin;

// Application State
const state = {
  token: null,
  user: null,
  profile: null,
  preferences: null,
  currentTab: 'home',
  wardrobe: [],
  occasions: [],
  selectedOccasion: null,
  products: [],
  productCategory: 'all',
  recommendations: [],
  activeFilter: 'all',
  searchQuery: '',
  isGenerating: false,
  favorites: [],
  activeTryOn: null,
  selectedTryOnItemId: null,
  tryonMode: 'doll', // 'doll' or 'photo'
  userTryonPhoto: null,
  tryonLayers: { top: true, bottom: true, shoes: true, bag: true, necklace: true },
};

// Category Icon Mapping
const CATEGORY_ICONS = {
  top: '👕',
  bottom: '👖',
  shoes: '👟',
  bag: '👜',
  necklace: '📿',
  jacket: '🧥',
  dress: '👗',
  accessory: '✨',
};

// Skin Tone Color Palette for Mannequin
const SKIN_TONE_MAP = {
  fair: '#fce7e0',
  light: '#f5d0b5',
  medium: '#d89b6f',
  olive: '#b87d4b',
  tan: '#9b643a',
  deep: '#5a3821',
  'warm ebony': '#3d2414',
};

// Helper: API Request
async function api(endpoint, options = {}) {
  const headers = { ...(options.headers || {}) };
  
  // Only set application/json if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = data.details ? data.details.join(' ') : (data.error || `HTTP error ${res.status}`);
      const error = new Error(errMsg);
      error.status = res.status;
      throw error;
    }
    return data;
  } catch (err) {
    if (!err.status || err.status >= 500) console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

// Toast notification
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = document.createElement('span');
  icon.textContent = type === 'success' ? '✨' : '⚠️';
  const text = document.createElement('div');
  text.textContent = message;
  toast.append(icon, text);
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Initialize Application
async function initApp() {
  localStorage.removeItem('stylemate_token');
  try {
    const userRes = await api('/api/auth/me');
    state.user = userRes.user;
  } catch (err) {
    if (err.status !== 401) showToast(`Could not restore account: ${err.message}`, 'error');
  }
  const tasks = [loadOccasions()];
  if (state.user) tasks.push(loadProfile(), loadWardrobe(), loadFavorites());
  const results = await Promise.allSettled(tasks);
  results.filter((result) => result.status === 'rejected').forEach((result) => {
    showToast(`Could not load account data: ${result.reason.message}`, 'error');
  });
  render();
}

async function loadProfile() {
  const res = await api('/api/profile');
  state.profile = res.profile;
  const prefRes = await api('/api/profile/preferences');
  state.preferences = prefRes.preferences || {};
}

async function loadWardrobe() {
  const res = await api('/api/wardrobe');
  state.wardrobe = res.items || [];
}

async function loadOccasions() {
  const res = await api('/api/occasions');
  state.occasions = res.occasions || [];
  if (state.occasions.length > 0 && !state.selectedOccasion) {
    state.selectedOccasion = state.occasions[0].key_name;
  }
}

async function loadProducts() {
  const params = new URLSearchParams();
  if (state.selectedOccasion) params.set('occasion', state.selectedOccasion);
  if (state.productCategory !== 'all') params.set('category', state.productCategory);
  const response = await api(`/api/products?${params.toString()}`);
  state.products = response.products || [];
}

async function loadFavorites() {
  const response = await api('/api/favorites');
  state.favorites = response.products || [];
}

async function selectOccasion(key) {
  state.selectedOccasion = key;
  state.productCategory = 'all';
  state.currentTab = 'shop';
  try {
    await loadProducts();
    render();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function filterProducts(category) {
  state.productCategory = category;
  try {
    await loadProducts();
    render();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleFavorite(productId) {
  if (!state.user) return openLoginModal('login');
  const alreadySaved = state.favorites.some((product) => product.id === productId);
  try {
    const response = await api(`/api/favorites/${encodeURIComponent(productId)}`, {
      method: alreadySaved ? 'DELETE' : 'POST'
    });
    state.favorites = response.products || [];
    showToast(alreadySaved ? 'Removed from favorites.' : 'Saved to favorites.');
    if (state.modal) openFavorites();
    else render();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openProductTryOn(product) {
  state.selectedTryOnItemId = product.id;
  const item = {
    ...product,
    id: product.id,
    title: product.name,
    imageUrl: product.image_url,
    category: product.category,
    primaryColor: 'Catalogue item'
  };
  openInteractiveTryOn({
    title: `Preview: ${product.name}`,
    occasion: (product.occasions || []).join(', '),
    outfit: { title: product.name, items: [item] }
  });
}

async function submitAdminProduct(event) {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const occasions = [...form.querySelectorAll('input[name="occasions"]:checked')].map((field) => field.value);
  const payload = {
    name: data.get('name'),
    image_url: data.get('image_url'),
    image_source: data.get('image_source'),
    category: data.get('category'),
    occasions
  };
  try {
    await api('/api/products', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Catalogue product saved.');
    await loadProducts();
    navigateTo('admin');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── RENDER MASTER ──────────────────────────────────────────────────────────
function render() {
  const appEl = document.getElementById('app');
  appEl.innerHTML = `
    ${renderNavbar()}
    <main class="main-content">
      ${renderContent()}
    </main>
    ${state.modal ? renderModal() : ''}
  `;
}

function renderNavbar() {
  return `
    <nav class="navbar">
      <div class="nav-brand" onclick="navigateTo('home')">
        <div class="brand-icon">✨</div>
        <span class="brand-name">StyleMate</span>
        <span class="brand-badge">Personal style</span>
      </div>

      <div class="nav-links">
        <button class="nav-btn ${state.currentTab === 'home' ? 'active' : ''}" onclick="navigateTo('home')">Home</button>
        <button class="nav-btn ${state.currentTab === 'shop' ? 'active' : ''}" onclick="navigateTo('shop')">Explore Collections</button>
        ${state.user ? `
          <button class="nav-btn ${state.currentTab === 'recommend' ? 'active' : ''}" onclick="navigateTo('recommend')">Style my wardrobe</button>
          <button class="nav-btn ${state.currentTab === 'wardrobe' ? 'active' : ''}" onclick="navigateTo('wardrobe')">Wardrobe (${state.wardrobe.length})</button>
          <button class="nav-btn" onclick="openDressingRoomStudio()">🪞 Try-On Studio</button>
          <button class="nav-btn" onclick="openFavorites()">Favorites (${state.favorites.length})</button>
          <button class="nav-btn ${state.currentTab === 'profile' ? 'active' : ''}" onclick="navigateTo('profile')">Style Profile</button>
          ${state.user.role === 'admin' ? `<button class="nav-btn ${state.currentTab === 'admin' ? 'active' : ''}" onclick="navigateTo('admin')">Admin</button>` : ''}
        ` : ''}
      </div>

      <div class="nav-user">
        ${state.user ? `
          <div class="user-chip">
            <div class="user-avatar">${escapeHtml((state.user.name || state.user.full_name || 'U')[0].toUpperCase())}</div>
            <span>${escapeHtml(state.user.name || state.user.full_name)}</span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="handleLogout()">Log Out</button>
        ` : `
          <button class="btn btn-primary btn-sm" onclick="openLoginModal('login')">Sign In</button>
        `}
      </div>
    </nav>
  `;
}

function renderContent() {
  if (!state.user && state.currentTab !== 'home') {
    if (state.currentTab === 'shop') return renderShopView();
    return renderHero();
  }

  switch (state.currentTab) {
    case 'home':
      return state.user ? renderDashboard() : renderHero();
    case 'recommend':
      return renderRecommendationsView();
    case 'wardrobe':
      return renderWardrobeView();
    case 'profile':
      return renderProfileView();
    case 'shop':
      return renderShopView();
    case 'admin':
      return state.user?.role === 'admin' ? renderAdminView() : renderHero();
    default:
      return renderHero();
  }
}

// ─── HERO VIEW (Logged-out) ────────────────────────────────────────────────
function renderHero() {
  return `
    <section class="hero">
      <div class="hero-tag">✨ Occasion-based style ideas</div>
      <h1 class="hero-title">Explore your style with <span class="gradient-text">StyleMate</span></h1>
      <p class="hero-desc">
        StyleMate keeps your personal wardrobe private, lets you browse sample products by occasion, and ranks wardrobe combinations from preferences you choose.
      </p>
      <div class="hero-actions">
        <button class="btn btn-primary" onclick="openLoginModal('register')">Create your account</button>
        <button class="btn btn-secondary" onclick="openLoginModal('login')">Sign in</button>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">📸</div>
          <h3 style="margin-bottom:0.5rem; font-size:1.2rem;">Real Photo Digitization</h3>
          <p style="color:var(--text-muted); font-size:0.9rem;">Upload private clothing photos and describe each piece in your wardrobe.</p>
        </div>
        ${renderOccasionChoices()}
        <p class="catalog-sample-note">Explore style inspiration by occasion and category. Collections are examples, not products for sale.</p>
        <div class="feature-card">
          <div class="feature-icon">🪞</div>
          <h3 style="margin-bottom:0.5rem; font-size:1.2rem;">Product Preview (Avatar Reference)</h3>
          <p style="color:var(--text-muted); font-size:0.9rem;">Use a basic avatar reference with selected product images. Realistic garment fitting and size prediction are not available.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">♥</div>
          <h3 style="margin-bottom:0.5rem; font-size:1.2rem;">Saved Favorites</h3>
          <p style="color:var(--text-muted); font-size:0.9rem;">Keep collections you like in your private favorites list.</p>
        </div>
      </div>
    </section>
  `;
}

function renderOccasionChoices() {
  return `
    <section class="occasion-section">
      <div class="card-title">Choose an occasion</div>
      <div class="occasion-grid">
        ${state.occasions.map((occasion) => `
          <button class="occasion-card" onclick="selectOccasion('${occasion.key_name}')">
            <img src="${occasion.image_url}" alt="" loading="lazy" />
            <span>${occasion.name}</span>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function renderShopView() {
  const categoryNames = [
    ['all', 'All'], ['top', 'Tops'], ['bottom', 'Bottoms'], ['dress', 'Dresses'],
    ['shoes', 'Shoes'], ['bag', 'Bags'], ['necklace', 'Jewelry'], ['accessory', 'Accessories'], ['jacket', 'Jackets']
  ];
  return `
    <section>
      <h1 class="page-title">Explore <span class="gradient-text">Collections</span></h1>
      <p class="catalog-sample-note">Style inspiration collections. Use both filters together; every category and occasion has at least five items.</p>
      <div class="occasion-grid">
        ${state.occasions.map((occasion) => `
          <button class="occasion-card ${state.selectedOccasion === occasion.key_name ? 'selected' : ''}" onclick="selectOccasion('${occasion.key_name}')">
            <img src="${occasion.image_url}" alt="" loading="lazy" />
            <span>${occasion.name}</span>
          </button>
        `).join('')}
      </div>
      <div class="category-tabs shop-category-tabs">
        ${categoryNames.map(([key, label]) => `<button class="tab-btn ${state.productCategory === key ? 'active' : ''}" onclick="filterProducts('${key}')">${label}</button>`).join('')}
      </div>
      <div class="catalog-grid">
        ${state.products.map(renderProductCard).join('') || '<div class="card">No catalogue items match both filters. Try another occasion or category.</div>'}
      </div>
    </section>
  `;
}

function renderProductCard(product) {
  const isFavorite = state.favorites.some((favorite) => favorite.id === product.id);
  const imageUrl = escapeHtml(product.image_url || '');
  const name = escapeHtml(product.name || '');
  const occasions = (product.occasions || []).map(escapeHtml).join(' · ');
  return `
    <article class="catalog-card">
      <div class="catalog-image"><img src="${imageUrl}" alt="${name}" loading="lazy" onerror="this.alt='Image unavailable';this.style.opacity='.25'" /></div>
      <div class="catalog-details">
        <div class="catalog-category">${CATEGORY_ICONS[product.category] || ''} ${escapeHtml(product.category)}</div>
        <h3>${name}</h3>
        <p class="catalog-tags">${occasions}</p>
        <div class="catalog-actions">
          <button class="btn btn-secondary btn-sm" onclick="openProductTryOn(${escapeJson(product)})">🪞 See Live / Try On</button>
          <button class="btn btn-primary btn-sm" onclick="toggleFavorite('${escapeHtml(product.id)}')">${isFavorite ? '♥ Saved' : '♡ Save favorite'}</button>
        </div>
      </div>
    </article>
  `;
}

function renderAdminView() {
  return `
    <section class="admin-page">
      <h1 class="page-title">Admin <span class="gradient-text">Catalogue</span></h1>
      <p class="catalog-sample-note">Add a style collection with image, category, and occasion tags. Items appear as inspiration, not listings for sale.</p>
      <form class="card admin-form" onsubmit="submitAdminProduct(event)">
        <label>Product name<input class="form-control" name="name" required maxlength="160" /></label>
        <label>Product image URL<input class="form-control" name="image_url" type="url" required placeholder="https://..." /></label>
        <label>Image source / reuse license URL<input class="form-control" name="image_source" type="url" required placeholder="https://unsplash.com/license or image source page" /></label>
        <label>Category<select class="form-control" name="category" required>
          ${['top', 'bottom', 'dress', 'shoes', 'bag', 'necklace', 'jacket', 'accessory'].map((category) => `<option value="${category}">${category}</option>`).join('')}
        </select></label>
        <fieldset><legend>Occasion tags (choose at least one)</legend>
          ${state.occasions.map((occasion) => `<label class="occasion-check"><input type="checkbox" name="occasions" value="${occasion.key_name}" /> ${occasion.name}</label>`).join('')}
        </fieldset>
        <button class="btn btn-primary" type="submit">Add catalogue product</button>
      </form>
    </section>
  `;
}

// ─── DASHBOARD VIEW ────────────────────────────────────────────────────────
function renderDashboard() {
  const userName = escapeHtml(state.user.name || state.user.full_name || 'Fashionista');

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem; flex-wrap:wrap; gap:1rem;">
      <div>
        <h1 style="font-family:var(--font-display); font-size:2.2rem; font-weight:800;">
          Welcome back, <span class="gradient-text">${userName}</span>
        </h1>
        <p style="color:var(--text-muted); font-size:1rem;">
          Your digital closet has <strong>${state.wardrobe.length}</strong> clothing items catalogued.
        </p>
      </div>

      <div style="display:flex; gap:1rem;">
        <button class="btn btn-primary" onclick="navigateTo('recommend')">✨ Style Today's Outfit</button>
        <button class="btn btn-secondary" onclick="openAddWardrobeModal()">📸 Upload Photo Item</button>
      </div>
    </div>

    ${renderOccasionChoices()}

    <div style="display:grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
      <div class="card">
        <div class="card-title">✨ Recommended Outfits Preview</div>
        <div class="card-subtitle">Rule-based combinations using occasion and your saved preferences</div>
        <p style="color:var(--text-muted); margin-bottom: 1.5rem;">
          Suggestions are ordered using occasion formality, saved style and color preferences, wardrobe tags, favorites, and past ratings.
        </p>
        <button class="btn btn-primary btn-sm" onclick="navigateTo('recommend')">Generate Outfits Now →</button>
      </div>

      <div class="card">
        <div class="card-title">👤 Style Profile</div>
        <div class="card-subtitle">Current profile details</div>
        <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.9rem;">
          <div><strong>Body Silhouette:</strong> <span style="text-transform:capitalize; color:var(--accent-purple);">${state.profile?.body_type || state.profile?.bodyType || 'Hourglass'}</span></div>
          <div><strong>Skin Undertone:</strong> <span style="text-transform:capitalize; color:var(--accent-pink);">${state.profile?.skin_tone || state.profile?.skinTone || 'Medium'}</span></div>
          <div><strong>Gender / style preference:</strong> <span style="text-transform:capitalize;">${state.profile?.gender || 'Other'}</span></div>
        </div>
        <button class="btn btn-secondary btn-sm" style="margin-top:1.25rem;" onclick="navigateTo('profile')">Edit Profile</button>
      </div>
    </div>

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <div class="card-title">👕 Recent Wardrobe Additions</div>
          <div class="card-subtitle">Real photos and pieces in your digital closet</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="navigateTo('wardrobe')">View Full Wardrobe (${state.wardrobe.length}) →</button>
      </div>
      <div class="wardrobe-grid">
        ${state.wardrobe.slice(0, 4).map(item => renderWardrobeCard(item)).join('')}
      </div>
    </div>
  `;
}

// ─── RECOMMENDATIONS VIEW ──────────────────────────────────────────────────
function renderRecommendationsView() {
  return `
    <div style="margin-bottom: 2rem;">
      <h1 style="font-family:var(--font-display); font-size:2.2rem; font-weight:800;">
        Rule-based <span class="gradient-text">Wardrobe Suggestions</span>
      </h1>
      <p style="color:var(--text-muted);">
        Suggestions use the selected occasion, saved style and color preferences, favorites, and prior ratings. Skin tone does not restrict clothing choices.
      </p>
    </div>

    <div class="rec-generator-bar">
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) 180px; gap: 1rem; align-items: flex-end;">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Occasion</label>
          <select id="recOccasion" class="form-control" onchange="state.selectedOccasion = this.value">
            ${state.occasions.map(o => `
              <option value="${o.key_name}" ${o.key_name === state.selectedOccasion ? 'selected' : ''}>
                ${o.name} (${o.default_formality || o.formalityLevel || 'Casual'})
              </option>
            `).join('')}
          </select>
        </div>

        <button class="btn btn-primary" style="height: 44px;" onclick="handleGenerateRecommendations()" ${state.isGenerating ? 'disabled' : ''}>
          ${state.isGenerating ? 'Curating Outfits...' : '✨ Generate Outfits'}
        </button>
      </div>
    </div>

    ${state.recommendations.length > 0 ? `
      <div class="rec-list">
        ${state.recommendations.map(rec => renderRecommendationCard(rec)).join('')}
      </div>
    ` : `
      <div class="card" style="text-align:center; padding: 4rem 2rem;">
        <div style="font-size:3.5rem; margin-bottom:1rem;">✨</div>
        <h3 style="font-size:1.4rem; margin-bottom:0.5rem;">Ready to Curate Today's Look</h3>
        <p style="color:var(--text-muted); max-width:480px; margin:0 auto 1.5rem;">
          Click "Generate Outfits" to rank wardrobe combinations using occasion formality and your saved preferences. The ordering is rule-based, not an AI accuracy score.
        </p>
        <button class="btn btn-primary" onclick="handleGenerateRecommendations()">✨ Generate Outfits</button>
      </div>
    `}
  `;
}

function renderRecommendationCard(rec) {
  const outfit = rec.outfit || {};
  const items = outfit.items || rec.items || [];

  return `
    <div class="outfit-card" id="rec-card-${rec.id}">
      <div class="outfit-header">
        <div>
          <div class="outfit-name">
            <span>${outfit.title || rec.title || 'Curated Ensemble'}</span>
          </div>
          <div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.3rem;">
            Occasion: <strong style="color:var(--text-main);">${rec.occasion || rec.occasion_name || 'Special Occasion'}</strong> • Formality: ${outfit.formality || 'Smart Casual'}
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
          <div class="match-score-badge">Rule-based preference ranking</div>
          <button class="btn btn-secondary btn-sm" onclick="openInteractiveTryOn(${escapeJson(rec)})">
            🪞 Virtual Try-On
          </button>
          <button class="btn btn-success btn-sm" onclick="selectOccasion('${state.selectedOccasion || 'casual'}')">
            View matching store products
          </button>
        </div>
      </div>

      <div class="outfit-reasoning">
        <strong>Stylist rationale:</strong> ${escapeHtml(rec.reasoning || rec.description || 'Ordered using occasion formality, saved color preferences, silhouette tags, favorites, and past ratings.')}
      </div>

      <div class="outfit-items-row">
        ${items.map(item => {
          const itemImg = item.imageUrl || item.image_url;
          return `
            <div class="outfit-item-card">
              <div class="outfit-item-img">
                ${itemImg ? `<img src="${itemImg}" alt="${item.title || item.name}" />` : `<span>${CATEGORY_ICONS[item.category] || '👕'}</span>`}
              </div>
              <div class="outfit-item-info">
                <div class="outfit-item-role">${item.category || item.item_role || 'Piece'}</div>
                <div class="outfit-item-name" title="${item.title || item.name}">${item.title || item.name}</div>
                <div class="outfit-item-color">
                  <span class="color-dot" style="display:inline-block; background:${item.primaryColor || item.color || '#94a3b8'};"></span>
                  ${item.subcategory || item.color || 'Coordinated'}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.4rem;">
                  <span class="outfit-item-price">Your wardrobe</span>
                  <button class="btn btn-secondary btn-sm" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="openSingleItemTryOn(${escapeJson(item)})">Preview</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="outfit-footer">
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span style="font-size:0.88rem; color:var(--text-muted);">Rate this suggestion:</span>
          <div class="rating-stars">
            ${[1, 2, 3, 4, 5].map(star => `
              <button class="star-btn ${rec.feedbackRating >= star ? 'active' : ''}" onclick="submitRating('${rec.id}', ${star})">★</button>
            `).join('')}
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-secondary btn-sm" onclick="submitFeedbackModal('${rec.id}')">💬 Leave Note</button>
          <button class="btn btn-secondary btn-sm" disabled title="Saved outfit collections are not implemented">Save look unavailable</button>
        </div>
      </div>
    </div>
  `;
}

// ─── WARDROBE VIEW ─────────────────────────────────────────────────────────
function renderWardrobeView() {
  const filtered = state.wardrobe.filter(item => {
    const matchesCat = state.activeFilter === 'all' || item.category === state.activeFilter;
    const matchesSearch = !state.searchQuery || 
      (item.title || item.name || '').toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      (item.primaryColor || item.color || '').toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem; flex-wrap:wrap; gap:1rem;">
      <div>
        <h1 style="font-family:var(--font-display); font-size:2.2rem; font-weight:800;">
          My <span class="gradient-text">Wardrobe Collection</span>
        </h1>
        <p style="color:var(--text-muted);">
          Total ${state.wardrobe.length} catalogued items in your closet across multiple categories.
        </p>
      </div>
      <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="openAddWardrobeModal()">📸 Upload Real Photo Piece</button>
      </div>
    </div>

    <!-- Wardrobe Search & Filter Bar -->
    <div class="wardrobe-controls">
      <div class="category-tabs">
        <button class="tab-btn ${state.activeFilter === 'all' ? 'active' : ''}" onclick="filterCategory('all')">All Items (${state.wardrobe.length})</button>
        <button class="tab-btn ${state.activeFilter === 'top' ? 'active' : ''}" onclick="filterCategory('top')">👕 Tops</button>
        <button class="tab-btn ${state.activeFilter === 'bottom' ? 'active' : ''}" onclick="filterCategory('bottom')">👖 Bottoms</button>
        <button class="tab-btn ${state.activeFilter === 'shoes' ? 'active' : ''}" onclick="filterCategory('shoes')">👟 Shoes</button>
        <button class="tab-btn ${state.activeFilter === 'bag' ? 'active' : ''}" onclick="filterCategory('bag')">👜 Bags</button>
        <button class="tab-btn ${state.activeFilter === 'jacket' ? 'active' : ''}" onclick="filterCategory('jacket')">🧥 Jackets</button>
        <button class="tab-btn ${state.activeFilter === 'dress' ? 'active' : ''}" onclick="filterCategory('dress')">👗 Dresses</button>
        <button class="tab-btn ${state.activeFilter === 'necklace' ? 'active' : ''}" onclick="filterCategory('necklace')">📿 Jewelry</button>
        <button class="tab-btn ${state.activeFilter === 'accessory' ? 'active' : ''}" onclick="filterCategory('accessory')">✨ Accessories</button>
      </div>

      <div style="max-width:280px; width:100%;">
        <input 
          type="text" 
          class="form-control" 
          placeholder="🔍 Search items by color, name..." 
          value="${state.searchQuery}" 
          oninput="handleSearchWardrobe(this.value)" 
        />
      </div>
    </div>

    ${filtered.length > 0 ? `
      <div class="wardrobe-grid">
        ${filtered.map(item => renderWardrobeCard(item)).join('')}
      </div>
    ` : `
      <div class="card" style="text-align:center; padding: 4rem 2rem;">
        <div style="font-size:3.5rem; margin-bottom:1rem;">👗✨👠</div>
        <h3 style="font-size:1.4rem; margin-bottom:0.5rem;">Your Digital Wardrobe is Ready</h3>
        <p style="color:var(--text-muted); max-width:480px; margin:0 auto 1.75rem;">
          Your personal closet is separate from the shared catalogue. Upload your own clothing photos to begin.
        </p>
        <div style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="openAddWardrobeModal()">📸 Upload Photo Item</button>
        </div>
      </div>
    `}
  `;
}

function renderWardrobeCard(item) {
  const itemImg = item.imageUrl || item.image_url;
  const itemTitle = item.title || item.name || 'Clothing Item';
  const itemColor = item.primaryColor || item.color || 'Solid';

  return `
    <div class="wardrobe-card">
      <div class="wardrobe-thumb">
        ${itemImg ? `
          <img src="${itemImg}" alt="${itemTitle}" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'placeholder-icon\\'>${CATEGORY_ICONS[item.category] || '👕'}</span>';" />
        ` : `
          <span class="placeholder-icon">${CATEGORY_ICONS[item.category] || '👕'}</span>
        `}
        <span class="wardrobe-chip">${CATEGORY_ICONS[item.category] || ''} ${item.category}</span>
        <div class="wardrobe-color-badge">
          <span class="color-dot" style="background:${itemColor};"></span>
          <span>${itemColor}</span>
        </div>
      </div>
      <div class="wardrobe-details">
        <div class="wardrobe-title" title="${itemTitle}">${itemTitle}</div>
        <div class="wardrobe-sub">${item.subcategory || item.brand || 'Essential Piece'}</div>
        <div class="wardrobe-meta">
          <span class="meta-pill">${item.season || 'All Season'}</span>
          <span class="meta-pill">${item.formality || 'Casual'}</span>
          <span class="meta-pill">${item.material || 'Cotton'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--border-subtle);">
          <button class="btn btn-secondary btn-sm" onclick="openSingleItemTryOn(${escapeJson(item)})">🪞 Try-On</button>
          <button class="btn btn-danger btn-sm" onclick="handleDeleteItem('${item.id}')">Delete</button>
        </div>
      </div>
    </div>
  `;
}

// ─── PROFILE VIEW ──────────────────────────────────────────────────────────
function renderProfileView() {
  const p = state.profile || {};
  const pref = state.preferences || {};

  return `
    <div style="max-width:850px; margin:0 auto;">
      <div style="margin-bottom: 2rem;">
        <h1 style="font-family:var(--font-display); font-size:2.2rem; font-weight:800;">
          Personal <span class="gradient-text">Style Profile</span>
        </h1>
        <p style="color:var(--text-muted);">
          Suggestions use your saved style/color preferences and the selected occasion. Skin tone never excludes clothing.
        </p>
      </div>

      <div class="card" style="margin-bottom:2rem;">
        <div class="card-title">👤 Style Profile & Demographics</div>
        <div class="card-subtitle">Optional preferences for organizing and ranking suggestions; not body or fit predictions.</div>

        <form id="profileForm" onsubmit="handleSaveProfile(event)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Gender</label>
              <select name="gender" class="form-control">
                <option value="Female" ${(p.gender || '').toLowerCase() === 'female' ? 'selected' : ''}>Female</option>
                <option value="Male" ${(p.gender || '').toLowerCase() === 'male' ? 'selected' : ''}>Male</option>
                <option value="Non-binary" ${(p.gender || '').toLowerCase() === 'non-binary' ? 'selected' : ''}>Non-Binary</option>
                <option value="Other" ${(p.gender || '').toLowerCase() === 'other' ? 'selected' : ''}>Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Body Silhouette</label>
              <select name="body_type" class="form-control">
                <option value="Hourglass" ${(p.body_type || p.bodyType || '').toLowerCase() === 'hourglass' ? 'selected' : ''}>Hourglass (Balanced bust & hips, defined waist)</option>
                <option value="Pear" ${(p.body_type || p.bodyType || '').toLowerCase() === 'pear' ? 'selected' : ''}>Pear (Hips wider than shoulders)</option>
                <option value="Rectangle" ${(p.body_type || p.bodyType || '').toLowerCase() === 'rectangle' ? 'selected' : ''}>Rectangle (Even proportions, straight)</option>
                <option value="Inverted Triangle" ${(p.body_type || p.bodyType || '').toLowerCase() === 'inverted triangle' ? 'selected' : ''}>Inverted Triangle (Broad shoulders, narrower hips)</option>
                <option value="Apple" ${(p.body_type || p.bodyType || '').toLowerCase() === 'apple' ? 'selected' : ''}>Apple (Fuller midsection)</option>
                <option value="Athletic" ${(p.body_type || p.bodyType || '').toLowerCase() === 'athletic' ? 'selected' : ''}>Athletic (Muscular, toned structure)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Skin Undertone</label>
              <select name="skin_tone" class="form-control">
                <option value="Fair" ${(p.skin_tone || p.skinTone || '').toLowerCase() === 'fair' ? 'selected' : ''}>Fair (Cool / Rosy undertones)</option>
                <option value="Light" ${(p.skin_tone || p.skinTone || '').toLowerCase() === 'light' ? 'selected' : ''}>Light (Neutral undertones)</option>
                <option value="Medium" ${(p.skin_tone || p.skinTone || '').toLowerCase() === 'medium' ? 'selected' : ''}>Medium (Warm / Olive undertones)</option>
                <option value="Olive" ${(p.skin_tone || p.skinTone || '').toLowerCase() === 'olive' ? 'selected' : ''}>Olive (Greenish / Golden)</option>
                <option value="Deep" ${(p.skin_tone || p.skinTone || '').toLowerCase() === 'deep' ? 'selected' : ''}>Deep (Rich / Cool or Warm)</option>
                <option value="Warm Ebony" ${(p.skin_tone || p.skinTone || '').toLowerCase() === 'warm ebony' ? 'selected' : ''}>Warm Ebony (Warm deep rich)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Height Category</label>
              <select name="height_category" class="form-control">
                <option value="Petite (<160cm)" ${p.height_category?.includes('Petite') ? 'selected' : ''}>Petite (&lt;160cm)</option>
                <option value="Average (160-175cm)" ${p.height_category?.includes('Average') || !p.height_category ? 'selected' : ''}>Average (160-175cm)</option>
                <option value="Tall (>175cm)" ${p.height_category?.includes('Tall') ? 'selected' : ''}>Tall (&gt;175cm)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Age Group</label>
              <select name="age_group" class="form-control">
                <option value="18-24" ${p.age_group === '18-24' ? 'selected' : ''}>18-24</option>
                <option value="25-34" ${p.age_group === '25-34' ? 'selected' : ''}>25-34</option>
                <option value="35-44" ${p.age_group === '35-44' ? 'selected' : ''}>35-44</option>
                <option value="45-54" ${p.age_group === '45-54' ? 'selected' : ''}>45-54</option>
                <option value="55+" ${p.age_group === '55+' ? 'selected' : ''}>55+</option>
              </select>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="margin-top:1rem;">Save Profile</button>
        </form>
      </div>

      <div class="card">
        <div class="card-title">✨ Aesthetic & Color Preferences</div>
        <div class="card-subtitle">Fine-tune your preferred styles and colors to guide suggestion ordering.</div>

        <form id="preferencesForm" onsubmit="handleSavePreferences(event)">
          <div class="form-group">
            <label class="form-label">Preferred Style Aesthetics (comma separated)</label>
            <input type="text" name="preferred_styles" class="form-control" value="${Array.isArray(pref.preferred_styles) ? pref.preferred_styles.join(', ') : 'Smart Casual, Minimalist, Chic'}" />
          </div>

          <div class="form-group">
            <label class="form-label">Favorite Colors (comma separated)</label>
            <input type="text" name="preferred_colors" class="form-control" value="${Array.isArray(pref.preferred_colors) ? pref.preferred_colors.join(', ') : 'Navy Blue, Ivory, Emerald Green'}" />
          </div>

          <div class="form-group">
            <label class="form-label">Colors to Avoid (comma separated)</label>
            <input type="text" name="disliked_colors" class="form-control" value="${Array.isArray(pref.disliked_colors) ? pref.disliked_colors.join(', ') : 'Neon Yellow'}" />
          </div>

          <div class="form-group">
            <label class="form-label">Default Formality Level</label>
            <select name="formality_level" class="form-control">
              <option value="Casual" ${pref.formality_level === 'Casual' ? 'selected' : ''}>Casual</option>
              <option value="Smart Casual" ${pref.formality_level === 'Smart Casual' || !pref.formality_level ? 'selected' : ''}>Smart Casual</option>
              <option value="Business Casual" ${pref.formality_level === 'Business Casual' ? 'selected' : ''}>Business Casual</option>
              <option value="Formal" ${pref.formality_level === 'Formal' ? 'selected' : ''}>Formal</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary" style="margin-top:1rem;">Update Preferences</button>
        </form>
      </div>
      <div class="card account-security-card">
        <div class="card-title">Account security</div>
        <p class="catalog-sample-note">Signed in as ${escapeHtml(state.user?.email || '')}. Passwords are stored as secure hashes.</p>
        <button class="btn btn-secondary" onclick="openChangePasswordModal()">Change password</button>
        <button class="btn btn-danger" onclick="handleLogout()">Log out</button>
      </div>
    </div>
  `;
}

// ─── MODAL SYSTEM ───────────────────────────────────────────────────────────
function renderModal() {
  const m = state.modal;
  if (!m) return '';

  return `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2 style="font-family:var(--font-display); font-size:1.4rem; font-weight:700;">${m.title}</h2>
          <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          ${m.content}
        </div>
      </div>
    </div>
  `;
}

function closeModal() {
  state.modal = null;
  render();
}

// ─── REAL PHOTO UPLOAD MODAL ────────────────────────────────────────────────
function openAddWardrobeModal() {
  state.modal = {
    title: '📸 Upload Real Wardrobe Piece',
    content: `
      <form id="addWardrobeForm" onsubmit="handleRealPhotoUpload(event)">
        <!-- Real File Upload Drop Zone -->
        <div class="upload-dropzone" onclick="document.getElementById('wFileInput').click()">
          <input type="file" id="wFileInput" accept="image/*" style="display:none;" onchange="handleFilePreview(this)" />
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">📁</div>
          <div style="font-weight:700; color:var(--text-main);">Click to Select or Take Photo of Your Clothing</div>
          <div style="font-size:0.82rem; color:var(--text-muted); margin-top:0.25rem;">Supports JPG, PNG, WEBP (stored in server uploads)</div>
          
          <div id="filePreviewBox" class="upload-preview-box" style="display:none;">
            <img id="filePreviewImg" src="" alt="Preview" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Item Title / Name *</label>
          <input type="text" id="wName" class="form-control" required placeholder="e.g. Navy Italian Wool Blazer" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select id="wCategory" class="form-control" required>
              <option value="top">Top (Shirt, Blouse, Tee)</option>
              <option value="bottom">Bottom (Jeans, Trousers, Chinos)</option>
              <option value="shoes">Shoes (Sneakers, Loafers, Heels)</option>
              <option value="bag">Bag (Tote, Crossbody, Backpack)</option>
              <option value="necklace">Necklace / Jewelry</option>
              <option value="jacket">Jacket / Outerwear</option>
              <option value="dress">Dress / One Piece</option>
              <option value="accessory">Accessory</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Primary Color *</label>
            <input type="text" id="wColor" class="form-control" required placeholder="e.g. Navy Blue, Ivory, Olive" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Formality</label>
            <select id="wFormality" class="form-control">
              <option value="Casual">Casual</option>
              <option value="Smart Casual" selected>Smart Casual</option>
              <option value="Business Casual">Business Casual</option>
              <option value="Formal">Formal</option>
              <option value="Festive">Festive / Celebration</option>
              <option value="Athletic">Athletic</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Season</label>
            <select id="wSeason" class="form-control">
              <option value="All Season" selected>All Season</option>
              <option value="Summer">Summer</option>
              <option value="Winter">Winter</option>
              <option value="Spring/Fall">Spring / Fall</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Material (optional)</label>
            <input type="text" id="wMaterial" class="form-control" placeholder="e.g. Cotton, Linen, Silk, Leather" />
          </div>
          <div class="form-group">
            <label class="form-label">Subcategory / Style</label>
            <input type="text" id="wSubcategory" class="form-control" placeholder="e.g. Chinos, Blazer, Loafers" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Or Image URL (if not uploading file)</label>
          <input type="url" id="wUrlInput" class="form-control" placeholder="https://images.unsplash.com/..." />
        </div>

        <button type="submit" id="btnUploadSubmit" class="btn btn-primary" style="width:100%; margin-top:1rem;">
          📤 Upload & Save to Wardrobe
        </button>
      </form>
    `
  };
  render();
}

function handleFilePreview(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const box = document.getElementById('filePreviewBox');
      const img = document.getElementById('filePreviewImg');
      if (box && img) {
        img.src = e.target.result;
        box.style.display = 'flex';
      }
    };
    reader.readAsDataURL(file);
  }
}

async function handleRealPhotoUpload(event) {
  event.preventDefault();
  const btn = document.getElementById('btnUploadSubmit');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Uploading photo to server...';
  }

  try {
    const fileInput = document.getElementById('wFileInput');
    const name = document.getElementById('wName').value;
    const category = document.getElementById('wCategory').value;
    const color = document.getElementById('wColor').value;
    const formality = document.getElementById('wFormality').value;
    const season = document.getElementById('wSeason').value;
    const material = document.getElementById('wMaterial').value || 'Cotton';
    const subcategory = document.getElementById('wSubcategory').value;
    const urlInput = document.getElementById('wUrlInput').value;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('color', color);
    formData.append('formality', formality);
    formData.append('season', season);
    formData.append('material', material);
    if (subcategory) formData.append('subcategory', subcategory);

    if (fileInput.files && fileInput.files[0]) {
      formData.append('image', fileInput.files[0]);
    } else if (urlInput) {
      formData.append('image_url', urlInput);
    }

    const res = await api('/api/wardrobe', {
      method: 'POST',
      body: formData
    });

    state.wardrobe.unshift(res.item);
    state.modal = null;
    showToast(`"${name}" uploaded and added to your wardrobe!`);
    render();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'Upload & Save to Wardrobe';
    }
  }
}

// ─── REAL INTERACTIVE TRY-ON STUDIO (DOLL & USER PHOTO MODES) ─────────────

function openDressingRoomStudio() {
  if (state.recommendations.length > 0) {
    openInteractiveTryOn(state.recommendations[0]);
  } else if (state.wardrobe.length > 0) {
    const topItem = state.wardrobe.find(i => ['top', 'jacket', 'dress'].includes(i.category)) || state.wardrobe[0];
    const bottomItem = state.wardrobe.find(i => i.category === 'bottom') || state.wardrobe[1] || topItem;
    const shoesItem = state.wardrobe.find(i => i.category === 'shoes') || state.wardrobe[2] || topItem;
    const bagItem = state.wardrobe.find(i => i.category === 'bag' || i.category === 'necklace') || state.wardrobe[3];
    openInteractiveTryOn({
      title: 'Digital Wardrobe Fitting',
      occasion: 'Personal Fitting',
      outfit: {
        title: 'Custom Closet Ensemble',
        items: [topItem, bottomItem, shoesItem, bagItem].filter(Boolean)
      }
    });
  } else {
    showToast('Add wardrobe pieces or generate recommendations to try on outfits!');
  }
}

function setTryonMode(mode) {
  state.tryonMode = mode;
  if (state.activeTryOn) {
    openInteractiveTryOn(state.activeTryOn.rec);
  }
}

function toggleTryonLayer(layer) {
  if (!state.tryonLayers) {
    state.tryonLayers = { top: true, bottom: true, shoes: true, bag: true, necklace: true };
  }
  state.tryonLayers[layer] = !state.tryonLayers[layer];
  if (state.activeTryOn) {
    openInteractiveTryOn(state.activeTryOn.rec);
  }
}

function handleUserPhotoUploadForTryon(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      showToast('Choose a JPEG, PNG, or WebP photo under 10 MB.', 'error');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      state.userTryonPhoto = e.target.result;
      state.tryonMode = 'photo';
      showToast('Photo loaded for a local reference only; it is not stored or fitted.');
      if (state.activeTryOn) {
        openInteractiveTryOn(state.activeTryOn.rec);
      }
    };
    reader.readAsDataURL(file);
  }
}

function openInteractiveTryOn(rec) {
  const outfit = rec.outfit || {};
  const items = outfit.items || rec.items || [];
  const skinToneKey = (state.profile?.skin_tone || state.profile?.skinTone || 'Medium').toLowerCase();
  const skinColor = SKIN_TONE_MAP[skinToneKey] || '#d89b6f';
  const bodyShape = state.profile?.body_type || state.profile?.bodyType || 'Hourglass';

  // Find components of the outfit
  const topItem = items.find(i => ['top', 'jacket', 'dress'].includes(i.category));
  const bottomItem = items.find(i => i.category === 'bottom');
  const shoesItem = items.find(i => i.category === 'shoes');
  const bagItem = items.find(i => i.category === 'bag');
  const necklaceItem = items.find(i => ['necklace', 'accessory'].includes(i.category));

  state.activeTryOn = { rec, topItem, bottomItem, shoesItem, bagItem, necklaceItem };

  const isDollMode = state.tryonMode !== 'photo';
  const layers = state.tryonLayers || { top: true, bottom: true, shoes: true, bag: true, necklace: true };

  state.modal = {
    title: `🪞 Virtual Fitting Room — ${outfit.title || rec.title || 'Outfit'}`,
    content: `
      <div class="preview-disclaimer">Preview only: the avatar places product imagery in approximate category areas. Uploaded-photo mode is a visual reference board, not realistic garment fitting or size prediction.</div>
      <!-- Mode Toggle: Doll Model vs Upload My Photo -->
      <div class="tryon-mode-toggle">
        <button class="tryon-mode-btn ${isDollMode ? 'active' : ''}" onclick="setTryonMode('doll')">
          🧍‍♀️ Fashion Doll / Avatar Model
        </button>
        <button class="tryon-mode-btn ${!isDollMode ? 'active' : ''}" onclick="setTryonMode('photo')">
          📸 Photo reference (not fitted)
        </button>
      </div>

      <div class="tryon-studio-container">
        <!-- Fitting Stage Frame -->
        <div class="mannequin-frame" id="tryonStage">
          ${isDollMode ? `
            <!-- DOLL MODEL STAGE -->
            <div class="doll-silhouette">
              <div class="doll-hair"></div>
              <div class="doll-head" style="background:${skinColor};">
                ${necklaceItem && layers.necklace ? `
                  <div class="doll-necklace-slot" title="${necklaceItem.title || necklaceItem.name}">📿</div>
                ` : ''}
              </div>

              <!-- Torso Garment (Top / Dress) -->
              <div class="doll-torso" style="${layers.top && (topItem?.imageUrl || topItem?.image_url) ? `background-image:url('${topItem.imageUrl || topItem.image_url}');` : (layers.top ? `background-color:${topItem?.primaryColor || '#6366f1'};` : `background-color:${skinColor}; opacity:0.6;`)}">
                <span>${layers.top ? (topItem?.title || topItem?.name || 'Top') : 'N/A'}</span>
                
                ${bagItem && layers.bag ? `
                  <div class="doll-bag-slot" style="${bagItem.imageUrl || bagItem.image_url ? `background-image:url('${bagItem.imageUrl || bagItem.image_url}');` : `background:${bagItem.primaryColor || '#d97706'};`}" title="${bagItem.title || bagItem.name}"></div>
                ` : ''}
              </div>

              <!-- Legs Garment (Bottoms / Skirt) -->
              <div class="doll-legs" style="${layers.bottom && (bottomItem?.imageUrl || bottomItem?.image_url) ? `background-image:url('${bottomItem.imageUrl || bottomItem.image_url}');` : (layers.bottom ? `background-color:${bottomItem?.primaryColor || '#1e293b'};` : `background-color:${skinColor}; opacity:0.6;`)}">
                <span>${layers.bottom ? (bottomItem?.title || bottomItem?.name || 'Bottom') : 'N/A'}</span>
              </div>

              <!-- Footwear -->
              <div class="doll-feet" style="${layers.shoes && (shoesItem?.imageUrl || shoesItem?.image_url) ? `background-image:url('${shoesItem.imageUrl || shoesItem.image_url}');` : (layers.shoes ? `background-color:${shoesItem?.primaryColor || '#0f172a'};` : `background-color:${skinColor};`)}">
                <span>${layers.shoes ? (shoesItem?.title || shoesItem?.name || 'Shoes') : 'N/A'}</span>
              </div>
            </div>
          ` : `
            <!-- USER PHOTO FITTING STAGE -->
            ${state.userTryonPhoto ? `
              <div class="user-photo-stage">
                <img src="${state.userTryonPhoto}" class="user-photo-img" alt="Your Photo" />
                
                <!-- Overlayed Fitted Garments onto User Photo -->
                ${topItem && layers.top ? `
                  <div class="garment-overlay-card" style="top:22%; left:20%; width:130px; height:95px;">
                    <span class="garment-pin-badge">Top / Dress</span>
                    <img src="${topItem.imageUrl || topItem.image_url || 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400'}" alt="${topItem.title || topItem.name}" />
                  </div>
                ` : ''}

                ${bottomItem && layers.bottom ? `
                  <div class="garment-overlay-card" style="top:47%; left:22%; width:120px; height:105px;">
                    <span class="garment-pin-badge">Bottom</span>
                    <img src="${bottomItem.imageUrl || bottomItem.image_url || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400'}" alt="${bottomItem.title || bottomItem.name}" />
                  </div>
                ` : ''}

                ${shoesItem && layers.shoes ? `
                  <div class="garment-overlay-card" style="bottom:15px; left:25%; width:100px; height:45px;">
                    <span class="garment-pin-badge">Shoes</span>
                    <img src="${shoesItem.imageUrl || shoesItem.image_url || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400'}" alt="${shoesItem.title || shoesItem.name}" />
                  </div>
                ` : ''}

                ${bagItem && layers.bag ? `
                  <div class="garment-overlay-card" style="top:35%; right:15px; width:75px; height:75px;">
                    <span class="garment-pin-badge">Bag</span>
                    <img src="${bagItem.imageUrl || bagItem.image_url || 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400'}" alt="${bagItem.title || bagItem.name}" />
                  </div>
                ` : ''}
              </div>
            ` : `
              <!-- Prompt to upload photo -->
              <div style="text-align:center; padding:2rem 1.5rem; cursor:pointer;" onclick="document.getElementById('tryonPhotoInput').click()">
                <input type="file" id="tryonPhotoInput" accept="image/*" style="display:none;" onchange="handleUserPhotoUploadForTryon(this)" />
                <div style="font-size:3.5rem; margin-bottom:1rem;">📸</div>
                <h4 style="font-size:1.15rem; font-weight:700; margin-bottom:0.5rem;">Upload Your Full-Body Photo / Selfie</h4>
                <p style="color:var(--text-muted); font-size:0.85rem; max-width:280px; margin:0 auto 1.25rem;">
                  Your photo is displayed with product-reference thumbnails. Garments are not fitted or realistically simulated.
                </p>
                <button type="button" class="btn btn-primary btn-sm">Select Your Photo</button>
              </div>
            `}
          `}
        </div>

        <!-- Controls, Layer Toggles & Fit Diagnostics -->
        <div>
          <div class="form-group">
            <label class="form-label">Switch selected catalogue item</label>
            <select class="form-control" onchange="switchTryOnProduct(this.value)">
              <option value="">Choose a product</option>
              ${state.products.map((product) => `<option value="${escapeHtml(product.id)}" ${items.some((item) => item.id === product.id) ? 'selected' : ''}>${escapeHtml(product.name)} (${escapeHtml(product.category)})</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-danger btn-sm" style="margin-bottom:1rem;" onclick="removeTryOnProduct()">Remove selected item</button>
          ${!isDollMode && state.userTryonPhoto ? `
            <div style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.85rem; color:#34d399; font-weight:700;">Photo loaded for reference only</span>
              <button class="btn btn-secondary btn-sm" onclick="document.getElementById('tryonPhotoInput2').click()">Change Photo</button>
              <input type="file" id="tryonPhotoInput2" accept="image/*" style="display:none;" onchange="handleUserPhotoUploadForTryon(this)" />
            </div>
          ` : ''}

          <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:0.6rem;">Clothing Layer Toggles</h3>
          <div style="display:flex; flex-direction:column; gap:0.4rem; margin-bottom:1.25rem;">
            ${topItem ? `
              <div class="tryon-layer-toggle-row">
                <span>👚 <strong>Top / Dress:</strong> ${topItem.title || topItem.name}</span>
                <input type="checkbox" ${layers.top ? 'checked' : ''} onchange="toggleTryonLayer('top')" />
              </div>
            ` : ''}
            ${bottomItem ? `
              <div class="tryon-layer-toggle-row">
                <span>👖 <strong>Bottom:</strong> ${bottomItem.title || bottomItem.name}</span>
                <input type="checkbox" ${layers.bottom ? 'checked' : ''} onchange="toggleTryonLayer('bottom')" />
              </div>
            ` : ''}
            ${shoesItem ? `
              <div class="tryon-layer-toggle-row">
                <span>👟 <strong>Footwear:</strong> ${shoesItem.title || shoesItem.name}</span>
                <input type="checkbox" ${layers.shoes ? 'checked' : ''} onchange="toggleTryonLayer('shoes')" />
              </div>
            ` : ''}
            ${bagItem ? `
              <div class="tryon-layer-toggle-row">
                <span>👜 <strong>Bag:</strong> ${bagItem.title || bagItem.name}</span>
                <input type="checkbox" ${layers.bag ? 'checked' : ''} onchange="toggleTryonLayer('bag')" />
              </div>
            ` : ''}
            ${necklaceItem ? `
              <div class="tryon-layer-toggle-row">
                <span>📿 <strong>Jewelry:</strong> ${necklaceItem.title || necklaceItem.name}</span>
                <input type="checkbox" ${layers.necklace ? 'checked' : ''} onchange="toggleTryonLayer('necklace')" />
              </div>
            ` : ''}
          </div>

          <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:0.6rem;">Preview details</h3>
          <div class="tryon-specs-list">
            <div><strong>Preview capability:</strong> <span>Avatar placement only; not a fit or size prediction.</span></div>
            <div><strong>Preference input:</strong> <span>Skin tone does not restrict recommended clothing.</span></div>
            <div><strong>Occasion:</strong> <span>${escapeHtml(rec.occasion || 'Personal preview')}</span></div>
          </div>

          <div style="margin-top:1.25rem; display:flex; flex-direction:column; gap:0.6rem;">
            <button class="btn btn-secondary" style="width:100%;" onclick="selectOccasion('${state.selectedOccasion || 'casual'}')">
              Browse store catalogue
            </button>
          </div>
        </div>
      </div>
    `
  };
  render();
}

function openSingleItemTryOn(item) {
  state.selectedTryOnItemId = item.id;
  openInteractiveTryOn({
    title: item.title || item.name,
    occasion: 'Single Item Fitting',
    outfit: {
      title: item.title || item.name,
      items: [item]
    }
  });
}

function switchTryOnProduct(productId) {
  if (!productId) return;
  const product = state.products.find((entry) => entry.id === productId);
  if (product) openProductTryOn(product);
}

function removeTryOnProduct() {
  if (!state.activeTryOn) return;
  const rec = state.activeTryOn.rec;
  const items = rec.outfit?.items || rec.items || [];
  const selectedId = state.selectedTryOnItemId || items[0]?.id;
  const remaining = items.filter((item) => item.id !== selectedId);
  state.selectedTryOnItemId = null;
  const updated = { ...rec, outfit: { ...(rec.outfit || {}), items: remaining } };
  openInteractiveTryOn(updated);
}

// ─── SAVED FAVORITES ───────────────────────────────────────────────────────
function openFavorites() {
  if (!state.user) return openLoginModal('login');
  state.modal = {
    title: `♥ Your Favorites (${state.favorites.length})`,
    content: `
      <p class="catalog-sample-note">Your saved style collections are private to your account.</p>
      <div class="catalog-grid">
        ${state.favorites.map((product) => `
          <article class="catalog-card">
            <div class="catalog-image"><img src="${escapeHtml(product.image_url || '')}" alt="${escapeHtml(product.name)}" loading="lazy" /></div>
            <div class="catalog-details">
              <div class="catalog-category">${CATEGORY_ICONS[product.category] || ''} ${escapeHtml(product.category)}</div>
              <h3>${escapeHtml(product.name)}</h3>
              <p class="catalog-tags">${(product.occasions || []).map(escapeHtml).join(' · ')}</p>
              <div class="catalog-actions">
                <button class="btn btn-secondary btn-sm" onclick="closeModal(); openProductTryOn(${escapeJson(product)})">Preview collection</button>
                <button class="btn btn-danger btn-sm" onclick="toggleFavorite('${escapeHtml(product.id)}')">Remove favorite</button>
              </div>
            </div>
          </article>
        `).join('') || '<p class="catalog-sample-note">No favorites saved yet. Browse collections and tap “Save favorite”.</p>'}
      </div>
    `
  };
  render();
}

// ─── AUTHENTICATION HANDLERS ────────────────────────────────────────────────
function openLoginModal(mode = 'login') {
  const registering = mode === 'register';
  state.modal = {
    title: registering ? '✨ Create StyleMate Account' : '🔑 Sign In to StyleMate',
    content: `
      <div id="authErrorBox" style="display:none; background:rgba(244,63,94,0.15); border:1px solid rgba(244,63,94,0.4); padding:0.75rem; border-radius:8px; color:#fda4af; font-size:0.88rem; margin-bottom:1rem;"></div>

      <form id="authModalForm" onsubmit="handleAuthSubmit(event, '${registering ? 'register' : 'login'}')">
        ${registering ? `
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="authName" class="form-control" required maxlength="100" placeholder="Your name" />
          </div>
        ` : ''}
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" id="authEmail" class="form-control" required maxlength="191" autocomplete="username" placeholder="you@example.com" />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="authPassword" class="form-control" required minlength="${registering ? 10 : 1}" maxlength="128" autocomplete="${registering ? 'new-password' : 'current-password'}" placeholder="${registering ? 'At least 10 characters' : 'Your password'}" />
        </div>
        ${registering ? `
          <div class="form-row">
            <label class="form-group">Age range<select class="form-control" id="authAge"><option>18-24</option><option>25-34</option><option>35-44</option><option>45-54</option><option>55+</option></select></label>
            <label class="form-group">Gender / style preference<select class="form-control" id="authGender"><option>Other</option><option>Female</option><option>Male</option><option>Non-binary</option></select></label>
            <label class="form-group">Skin tone (optional)<select class="form-control" id="authSkinTone"><option>Medium</option><option>Fair</option><option>Light</option><option>Olive</option><option>Deep</option><option>Warm Ebony</option></select></label>
          </div>
          <p class="catalog-sample-note">These details are optional styling inputs, not rules about what you can wear. You can change them in your profile.</p>
        ` : ''}
        <button type="submit" id="authSubmitBtn" class="btn btn-primary" style="width:100%; margin-top:1rem;">
          ${registering ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <div style="margin-top:1.5rem; text-align:center; font-size:0.88rem; color:var(--text-muted);">
        ${registering ? `
          Already have an account? <a href="#" style="color:var(--accent-purple); font-weight:600;" onclick="openLoginModal('login'); return false;">Sign In</a>
        ` : `
          Don't have an account? <a href="#" style="color:var(--accent-purple); font-weight:600;" onclick="openLoginModal('register'); return false;">Register Now</a>
        `}
      </div>
    `
  };
  render();
}

async function handleAuthSubmit(event, mode) {
  event.preventDefault();
  const errBox = document.getElementById('authErrorBox');
  if (errBox) errBox.style.display = 'none';

  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const fullName = mode === 'register' ? document.getElementById('authName').value : undefined;

  try {
    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const body = mode === 'register'
      ? {
        full_name: fullName,
        email,
        password,
        age_group: document.getElementById('authAge').value,
        gender: document.getElementById('authGender').value,
        skin_tone: document.getElementById('authSkinTone').value
      }
      : { email, password };

    const res = await api(endpoint, { method: 'POST', body: JSON.stringify(body) });

    state.user = res.user;
    state.modal = null;
    showToast(mode === 'register' ? 'Account created successfully!' : `Welcome, ${res.user.name || res.user.full_name}!`);
    await Promise.all([loadProfile(), loadWardrobe(), loadOccasions(), loadFavorites()]);
    navigateTo('home');
  } catch (err) {
    if (errBox) {
      errBox.innerText = err.message;
      errBox.style.display = 'block';
    } else {
      showToast(err.message, 'error');
    }
  }
}

async function handleLogout() {
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    showToast(`Logout failed: ${err.message}. Session is still active on the server.`, 'error');
    return;
  }
  state.user = null;
  state.profile = null;
  state.preferences = null;
  state.wardrobe = [];
  state.recommendations = [];
  state.favorites = [];
  showToast('Logged out; the server session has been revoked.');
  navigateTo('home');
}

function openChangePasswordModal() {
  state.modal = {
    title: 'Change password',
    content: `
      <form onsubmit="submitPasswordChange(event)">
        <label class="form-group">Current password<input class="form-control" name="current_password" type="password" required autocomplete="current-password" /></label>
        <label class="form-group">New password (12+ characters)<input class="form-control" name="new_password" type="password" required minlength="12" maxlength="128" autocomplete="new-password" /></label>
        <button class="btn btn-primary" type="submit">Update password</button>
      </form>
    `
  };
  render();
}

async function submitPasswordChange(event) {
  event.preventDefault();
  const form = event.target;
  try {
    await api('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: form.current_password.value,
        new_password: form.new_password.value
      })
    });
    state.modal = null;
    state.user = null;
    state.profile = null;
    state.preferences = null;
    state.wardrobe = [];
    state.favorites = [];
    showToast('Password updated. Sign in again with the new password.');
    navigateTo('home');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── ACTIONS & DISPATCHERS ──────────────────────────────────────────────────
function navigateTo(tab) {
  state.currentTab = tab;
  if (tab === 'shop') {
    loadProducts().then(render).catch((err) => showToast(err.message, 'error'));
  } else {
    render();
  }
}

function filterCategory(cat) {
  state.activeFilter = cat;
  render();
}

function handleSearchWardrobe(query) {
  state.searchQuery = query;
  render();
}

async function handleSaveProfile(event) {
  event.preventDefault();
  const form = event.target;
  const body = {
    gender: form.gender.value,
    body_type: form.body_type.value,
    skin_tone: form.skin_tone.value,
    height_category: form.height_category.value,
    age_group: form.age_group.value,
  };

  try {
    const res = await api('/api/profile', { method: 'PUT', body: JSON.stringify(body) });
    state.profile = res.profile;
    showToast('Style profile silhouette saved!');
    render();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleSavePreferences(event) {
  event.preventDefault();
  const form = event.target;
  const body = {
    preferred_styles: form.preferred_styles.value.split(',').map(s => s.trim()).filter(Boolean),
    preferred_colors: form.preferred_colors.value.split(',').map(s => s.trim()).filter(Boolean),
    disliked_colors: form.disliked_colors.value.split(',').map(s => s.trim()).filter(Boolean),
    formality_level: form.formality_level.value,
  };

  try {
    const res = await api('/api/profile/preferences', { method: 'PUT', body: JSON.stringify(body) });
    state.preferences = res.preferences;
    showToast('Aesthetic preferences updated!');
    render();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleDeleteItem(id) {
  if (!confirm('Are you sure you want to remove this piece from your wardrobe?')) return;
  try {
    await api(`/api/wardrobe/${id}`, { method: 'DELETE' });
    state.wardrobe = state.wardrobe.filter(item => item.id !== id);
    showToast('Item removed from wardrobe');
    render();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleGenerateRecommendations() {
  state.isGenerating = true;
  render();

  try {
    const occKey = document.getElementById('recOccasion')?.value || state.selectedOccasion || 'casual';
    const occObj = state.occasions.find(o => o.key_name === occKey || o.id === occKey || o.name === occKey) || state.occasions[0];

    const res = await api('/api/recommendations/generate', {
      method: 'POST',
      body: JSON.stringify({
        occasion_id: occObj?.id || occKey,
        occasion: occObj?.key_name || occKey,
      })
    });

    state.recommendations = res.recommendations || res.outfits || [];
    showToast(`Generated ${state.recommendations.length} curated outfits!`);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    state.isGenerating = false;
    render();
  }
}

async function submitRating(recId, rating) {
  try {
    await api(`/api/recommendations/${recId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback_text: `User rated ${rating} stars` })
    });

    const target = state.recommendations.find(r => r.id === recId);
    if (target) target.feedbackRating = rating;

    showToast(`Saved ${rating}-star feedback. Future rule-based rankings can use your rating.`);
    render();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function submitFeedbackModal(recId) {
  state.modal = {
    title: '💬 Stylist Feedback Note',
    content: `
      <div class="form-group">
        <label class="form-label">What did you think of this combination?</label>
        <textarea id="feedbackText" class="form-control" rows="3" placeholder="I love the color contrast! Maybe higher waist trousers next time..."></textarea>
      </div>
      <button class="btn btn-primary" style="width:100%;" onclick="handleSendFeedback('${recId}')">Send Feedback</button>
    `
  };
  render();
}

async function handleSendFeedback(recId) {
  const text = document.getElementById('feedbackText')?.value;
  try {
    await api(`/api/recommendations/${recId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating: 5, feedback_text: text })
    });
    state.modal = null;
    showToast('Your rating was saved and can influence future rule-based ordering.');
    render();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleSeedStarterWardrobe() {
  try {
    showToast('Populating 28+ designer pieces with high-res photos across all categories...');
    const res = await api('/api/wardrobe/seed-starter', { method: 'POST' });
    state.wardrobe = res.items || [];
    showToast(`Added ${state.wardrobe.length} fashion pieces to your wardrobe!`);
    render();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function escapeJson(obj) {
  return JSON.stringify(obj).replace(/"/g, '&quot;');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

// Start App on page load
window.addEventListener('DOMContentLoaded', initApp);
