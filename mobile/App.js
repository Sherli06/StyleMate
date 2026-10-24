import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { request, setToken, getToken, API_BASE_URL } from './src/api';

const CATEGORY_ICONS = {
  top: '👕',
  bottom: '👖',
  shoes: '👟',
  accessory: '👜',
  outerwear: '🧥',
  one_piece: '👗',
  dress: '👗',
  bag: '👜',
  necklace: '📿',
  jacket: '🧥',
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [currentTab, setCurrentTab] = useState('shop');
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [wardrobe, setWardrobe] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [selectedOccasion, setSelectedOccasion] = useState('college');
  const [products, setProducts] = useState([]);
  const [productCategory, setProductCategory] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [arModalVisible, setArModalVisible] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [personalPreviewUri, setPersonalPreviewUri] = useState(null);
  const [arTarget, setArTarget] = useState('the default mannequin');
  const [wardrobeImage, setWardrobeImage] = useState(null);
  const [preferenceStyles, setPreferenceStyles] = useState('');
  const [favoriteColors, setFavoriteColors] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminImageUrl, setAdminImageUrl] = useState('');
  const [adminImageSource, setAdminImageSource] = useState('');
  const [adminCategory, setAdminCategory] = useState('top');
  const [adminOccasions, setAdminOccasions] = useState([]);

  // Form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [authName, setAuthName] = useState('');
  const [ageGroup, setAgeGroup] = useState('18-24');
  const [gender, setGender] = useState('Other');

  // New wardrobe item form states
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('top');
  const [newItemColor, setNewItemColor] = useState('black');
  const [newItemFormality, setNewItemFormality] = useState('casual');
  const [newItemSeason, setNewItemSeason] = useState('all_season');

  // Profile form states
  const [bodyType, setBodyType] = useState('hourglass');
  const [skinTone, setSkinTone] = useState('medium');
  const [heightCm, setHeightCm] = useState('172');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await loadPublicData();
    const token = await getToken();
    if (!token) return;
    try {
      await setToken(token);
      setAuthToken(token);
      const response = await request('/api/auth/me');
      setUser(response.user);
      await fetchUserData();
    } catch (err) {
      setAuthToken(null);
      if (err.status === 401) await setToken(null);
      if (err.status !== 401) Alert.alert('Session restore failed', err.message);
    }
  };

  const loadPublicData = async () => {
    try {
      const occData = await request('/api/occasions');
      if (occData.occasions) setOccasions(occData.occasions);
      await loadProducts('college', 'all');
    } catch (err) {
      Alert.alert('Catalogue unavailable', err.message);
    }
  };

  const loadProducts = async (occasionKey = selectedOccasion, category = productCategory) => {
    const params = new URLSearchParams();
    if (occasionKey) params.set('occasion', occasionKey);
    if (category !== 'all') params.set('category', category);
    const response = await request(`/api/products?${params.toString()}`);
    setProducts(response.products || []);
  };

  const loadFavorites = async () => {
    const response = await request('/api/favorites');
    setFavorites(response.products || []);
  };

  const handleLogin = async (overrideEmail, overridePass) => {
    setLoading(true);
    try {
      const email = overrideEmail || authEmail;
      const pass = overridePass || authPassword;
      const endpoint = isRegister && !overrideEmail ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister && !overrideEmail
        ? { email, password: pass, full_name: authName, age_group: ageGroup, gender, skin_tone: skinTone }
        : { email, password: pass };

      const res = await request(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      await setToken(res.token);
      setAuthToken(res.token);
      setUser(res.user);
      await fetchUserData();
      Alert.alert('Welcome!', `Logged in as ${res.user.name}`);
    } catch (err) {
      Alert.alert('Auth Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
      setUser(null);
      await setToken(null);
      setProfile(null);
      setWardrobe([]);
      setFavorites([]);
      setRecommendations([]);
    } catch (err) {
      Alert.alert('Logout failed', `${err.message}. The server session is still active.`);
    }
  };

  const fetchUserData = async () => {
    try {
      const [profRes, prefRes, wRes, favoritesRes] = await Promise.all([
        request('/api/profile'),
        request('/api/profile/preferences'),
        request('/api/wardrobe'),
        request('/api/favorites')
      ]);
      if (profRes.profile) {
        setProfile(profRes.profile);
        setBodyType(String(profRes.profile.bodyType || 'hourglass').toLowerCase().replace(/ /g, '_'));
        setSkinTone(String(profRes.profile.skinTone || 'medium').toLowerCase());
        setAgeGroup(profRes.profile.age_group || '18-24');
        setGender(profRes.profile.gender || 'Other');
        setHeightCm(String(profRes.profile.heightCm || '172'));
      }
      setPreferences(prefRes.preferences || {});
      setPreferenceStyles((prefRes.preferences?.preferred_styles || []).join(', '));
      setFavoriteColors((prefRes.preferences?.preferred_colors || []).join(', '));
      if (wRes.items) setWardrobe(wRes.items);
      setFavorites(favoritesRes.products || []);
    } catch (err) {
      Alert.alert('Could not load account data', err.message);
      throw err;
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const res = await request('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          gender,
          age_group: ageGroup,
          body_type: bodyType.replace(/_/g, ' '),
          skin_tone: skinTone,
          height_category: (parseFloat(heightCm) || 170) < 160 ? 'Petite (<160cm)' : ((parseFloat(heightCm) || 170) > 175 ? 'Tall (>175cm)' : 'Average (160-175cm)'),
        }),
      });
      setProfile(res.profile);
      Alert.alert('Success', 'Style profile updated!');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) {
      Alert.alert('Required', 'Please enter an item title');
      return;
    }
    if (!wardrobeImage) {
      Alert.alert('Photo required', 'Choose a clothing photo to add a personal wardrobe item.');
      return;
    }
    setLoading(true);
    try {
      const body = new FormData();
      body.append('name', newItemTitle.trim());
      body.append('category', newItemCategory);
      body.append('color', newItemColor);
      body.append('formality', newItemFormality);
      body.append('season', newItemSeason);
      body.append('image', {
        uri: wardrobeImage.uri,
        name: wardrobeImage.fileName || `wardrobe-${Date.now()}.jpg`,
        type: wardrobeImage.mimeType || 'image/jpeg',
      });
      const res = await request('/api/wardrobe', {
        method: 'POST',
        body,
      });
      setWardrobe([res.item, ...wardrobe]);
      setModalVisible(false);
      setNewItemTitle('');
      setWardrobeImage(null);
      Alert.alert('Success', 'Wardrobe piece added!');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const pickWardrobePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo permission needed', 'Allow photo-library access to upload a wardrobe image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      const image = result.assets[0];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.mimeType || '') || image.fileSize > 10 * 1024 * 1024) {
        Alert.alert('Unsupported image', 'Choose a JPEG, PNG, or WebP photo under 10 MB.');
        return;
      }
      setWardrobeImage(image);
    }
  };

  const toggleFavorite = async (product) => {
    if (!user) {
      Alert.alert('Sign in required', 'Sign in to save favorites.');
      return;
    }
    const isSaved = favorites.some((item) => item.id === product.id);
    try {
      const response = await request(`/api/favorites/${encodeURIComponent(product.id)}`, {
        method: isSaved ? 'DELETE' : 'POST',
      });
      setFavorites(response.products || []);
    } catch (err) {
      Alert.alert('Could not update favorites', err.message);
    }
  };

  const chooseOccasion = async (key) => {
    setSelectedOccasion(key);
    try {
      await loadProducts(key, productCategory);
    } catch (err) {
      Alert.alert('Could not load products', err.message);
    }
  };

  const chooseCategory = async (category) => {
    setProductCategory(category);
    try {
      await loadProducts(selectedOccasion, category);
    } catch (err) {
      Alert.alert('Could not filter products', err.message);
    }
  };

  const savePreferences = async () => {
    try {
      const response = await request('/api/profile/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          preferred_styles: preferenceStyles.split(',').map((value) => value.trim()).filter(Boolean),
          preferred_colors: favoriteColors.split(',').map((value) => value.trim()).filter(Boolean),
        }),
      });
      setPreferences(response.preferences);
      Alert.alert('Saved', 'Style and color preferences were saved.');
    } catch (err) {
      Alert.alert('Could not save preferences', err.message);
    }
  };

  const toggleAdminOccasion = (key) => {
    setAdminOccasions((current) => current.includes(key) ? current.filter((value) => value !== key) : [...current, key]);
  };

  const addAdminProduct = async () => {
    try {
      await request('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: adminName,
          image_url: adminImageUrl,
          image_source: adminImageSource,
          category: adminCategory,
          occasions: adminOccasions,
        }),
      });
      setAdminName('');
      setAdminImageUrl('');
      setAdminImageSource('');
      await loadProducts(selectedOccasion, productCategory);
      Alert.alert('Saved', 'The product was added to the shared catalogue.');
    } catch (err) {
      Alert.alert('Product not saved', err.message);
    }
  };

  const handleGenerateRecommendations = async () => {
    setLoading(true);
    try {
      const res = await request('/api/recommendations/generate', {
        method: 'POST',
        body: JSON.stringify({
          occasion: selectedOccasion,
        }),
      });
      setRecommendations(res.recommendations || []);
      if (res.recommendations?.length === 0) {
        Alert.alert('Notice', 'Add more tops and bottoms to your wardrobe to get full outfits!');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (recId, rating) => {
    try {
      await request(`/api/recommendations/${recId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ rating, feedback_text: `${rating} stars mobile review` }),
      });
      Alert.alert('Thank You!', `Saved your ${rating}-star feedback.`);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const openARTryOn = (title) => {
    setArTarget(title);
    setPreviewProduct(null);
    setArModalVisible(true);
  };

  const previewCatalogueProduct = (product) => {
    setPreviewProduct(product);
    setArModalVisible(true);
  };

  const pickPersonalPreview = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo permission needed', 'Allow photo-library access to select a private, local preview photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) setPersonalPreviewUri(result.assets[0].uri);
  };

  // ─── AUTH SCREEN ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.authContainer}>
          <View style={styles.brandContainer}>
            <View style={styles.brandIcon}><Text style={{ fontSize: 32 }}>✨</Text></View>
            <Text style={styles.brandTitle}>StyleMate</Text>
            <Text style={styles.brandSubtitle}>Occasion-based style ideas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isRegister ? 'Create Account' : 'Sign In'}</Text>

            {isRegister && (
              <>
                <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#64748b" value={authName} onChangeText={setAuthName} />
                <TextInput style={styles.input} placeholder="Age range (e.g. 18-24)" placeholderTextColor="#64748b" value={ageGroup} onChangeText={setAgeGroup} />
                <TextInput style={styles.input} placeholder="Gender / style preference" placeholderTextColor="#64748b" value={gender} onChangeText={setGender} />
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
              value={authEmail}
              onChangeText={setAuthEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={authPassword}
              onChangeText={setAuthPassword}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={() => handleLogin()} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isRegister ? 'Register' : 'Sign In'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => setIsRegister(!isRegister)}>
              <Text style={styles.linkText}>
                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── MAIN APP SCREEN ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>StyleMate</Text>
          <Text style={styles.headerUser}>👤 {user.name} • {wardrobe.length} Wardrobe Items</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Weather Strip */}
      {weather && (
        <View style={styles.weatherStrip}>
          <Text style={styles.weatherIcon}>{weather.icon || '🌤️'}</Text>
          <Text style={styles.weatherText}>
            {weather.city}: {weather.temperature}°C, {weather.condition} • {weather.recommendationTip}
          </Text>
        </View>
      )}

      {/* Tab Content */}
      <ScrollView style={styles.content}>
        {currentTab === 'shop' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Explore Collections</Text>
              <Text style={styles.sectionSub}>Browse style inspiration by occasion and category.</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {occasions.map((occ) => (
                <TouchableOpacity key={occ.id} style={[styles.pill, selectedOccasion === occ.key_name && styles.pillActive]} onPress={() => chooseOccasion(occ.key_name)}>
                  <Text style={[styles.pillText, selectedOccasion === occ.key_name && styles.pillTextActive]}>{occ.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {['all', 'top', 'bottom', 'dress', 'shoes', 'bag', 'necklace', 'accessory', 'jacket'].map((category) => (
                <TouchableOpacity key={category} style={[styles.pill, productCategory === category && styles.pillActive]} onPress={() => chooseCategory(category)}>
                  <Text style={[styles.pillText, productCategory === category && styles.pillTextActive]}>{category === 'all' ? 'All categories' : category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.catalogNotice}>Collections are for style exploration, not products for sale.</Text>
            {products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <Image style={styles.productImage} source={{ uri: product.image_url }} />
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle}>{CATEGORY_ICONS[product.category] || '✨'} {product.name}</Text>
                  <Text style={styles.productMeta}>{product.category} • {product.occasions.join(' · ')}</Text>
                  <View style={styles.productActions}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => previewCatalogueProduct(product)}>
                      <Text style={styles.secondaryBtnText}>Preview collection</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addBtn} onPress={() => toggleFavorite(product)}>
                      <Text style={styles.addBtnText}>{favorites.some((item) => item.id === product.id) ? '♥ Saved' : '♡ Favorite'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            {!products.length && <Text style={styles.catalogNotice}>No products match both selected filters.</Text>}
          </View>
        )}

        {currentTab === 'favorites' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Favorites</Text>
              <Text style={styles.sectionSub}>Saved privately to your StyleMate account.</Text>
            </View>
            {favorites.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <Image style={styles.productImage} source={{ uri: product.image_url }} />
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle}>{CATEGORY_ICONS[product.category] || '✨'} {product.name}</Text>
                  <Text style={styles.productMeta}>{product.category} • {(product.occasions || []).join(' · ')}</Text>
                  <View style={styles.productActions}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => previewCatalogueProduct(product)}>
                      <Text style={styles.secondaryBtnText}>Preview collection</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addBtn} onPress={() => toggleFavorite(product)}>
                      <Text style={styles.addBtnText}>Remove favorite</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            {!favorites.length && <Text style={styles.catalogNotice}>No favorites yet. Save a collection to see it here.</Text>}
          </View>
        )}

        {/* RECOMMENDATIONS TAB */}
        {currentTab === 'recommend' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Wardrobe outfit suggestions</Text>
              <Text style={styles.sectionSub}>Rule-based ordering uses occasion, favorites, your color/style preferences, and feedback.</Text>
            </View>

            <View style={styles.generatorBox}>
              <Text style={styles.label}>Select Occasion:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                {occasions.map((occ) => (
                  <TouchableOpacity
                    key={occ.id}
                    style={[styles.pill, selectedOccasion === occ.key_name && styles.pillActive]}
                    onPress={() => setSelectedOccasion(occ.key_name)}
                  >
                    <Text style={[styles.pillText, selectedOccasion === occ.key_name && styles.pillTextActive]}>
                      {occ.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateRecommendations} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateBtnText}>✨ Generate Coordinated Outfits</Text>}
              </TouchableOpacity>
            </View>

            {recommendations.map((rec) => (
              <View key={rec.id} style={styles.outfitCard}>
                <View style={styles.outfitHeader}>
                  <Text style={styles.outfitTitle}>{rec.outfit?.title || rec.occasion}</Text>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>Rule-based preference order</Text>
                  </View>
                </View>

                <Text style={styles.outfitReasoning}>💡 {rec.reasoning}</Text>

                <View style={styles.itemsRow}>
                  {rec.outfit?.items?.map((item, idx) => (
                    <View key={idx} style={styles.itemCard}>
                      <View style={styles.itemIconBox}>
                        <Text style={{ fontSize: 28 }}>{CATEGORY_ICONS[item.category] || '👕'}</Text>
                      </View>
                      <Text style={styles.itemCategory}>{item.category}</Text>
                      <Text numberOfLines={1} style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemColor}>{item.primaryColor}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity style={styles.arBtn} onPress={() => openARTryOn(rec.outfit?.title || 'Outfit')}>
                    <Text style={styles.arBtnText}>Preview capability</Text>
                  </TouchableOpacity>

                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => handleFeedback(rec.id, star)}>
                        <Text style={styles.starIcon}>★</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* WARDROBE TAB */}
        {currentTab === 'wardrobe' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Digital Wardrobe</Text>
                <Text style={styles.sectionSub}>{wardrobe.length} items logged</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                <Text style={styles.addBtnText}>+ Add Piece</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.wardrobeGrid}>
              {wardrobe.map((item) => (
                <View key={item.id} style={styles.wardrobeItemCard}>
                  <View style={styles.wardrobeThumb}>
                    {item.imageUrl || item.image_url ? (
                      <Image
                        style={styles.wardrobePhoto}
                        source={{
                          uri: (item.imageUrl || item.image_url).startsWith('http')
                            ? (item.imageUrl || item.image_url)
                            : `${API_BASE_URL}${item.imageUrl || item.image_url}`,
                          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
                        }}
                      />
                    ) : <Text style={{ fontSize: 36 }}>{CATEGORY_ICONS[item.category] || '👕'}</Text>}
                  </View>
                  <View style={styles.wardrobeInfo}>
                    <Text numberOfLines={1} style={styles.wardrobeTitle}>{item.title}</Text>
                    <Text style={styles.wardrobeSubText}>{item.category} • {item.primaryColor}</Text>
                    <Text style={styles.wardrobeBadge}>{item.season} • {item.formality}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* PROFILE TAB */}
        {currentTab === 'profile' && (
          <View style={styles.profileSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Style & Body Profile</Text>
              <Text style={styles.sectionSub}>Edit saved personal details and preferences.</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Body Type Silhouette</Text>
              <View style={styles.pillRow}>
                {['hourglass', 'rectangle', 'pear', 'inverted_triangle', 'apple', 'athletic'].map((bt) => (
                  <TouchableOpacity
                    key={bt}
                    style={[styles.pill, bodyType === bt && styles.pillActive]}
                    onPress={() => setBodyType(bt)}
                  >
                    <Text style={[styles.pillText, bodyType === bt && styles.pillTextActive]}>{bt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 12 }]}>Age range</Text>
              <TextInput style={styles.input} value={ageGroup} onChangeText={setAgeGroup} />

              <Text style={[styles.label, { marginTop: 12 }]}>Gender / style preference</Text>
              <TextInput style={styles.input} value={gender} onChangeText={setGender} />

              <Text style={[styles.label, { marginTop: 12 }]}>Skin Tone (optional preference)</Text>
              <View style={styles.pillRow}>
                {['fair', 'light', 'medium', 'olive', 'deep', 'warm ebony'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.pill, skinTone === st && styles.pillActive]}
                    onPress={() => setSkinTone(st)}
                  >
                    <Text style={[styles.pillText, skinTone === st && styles.pillTextActive]}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 12 }]}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={heightCm}
                onChangeText={setHeightCm}
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Profile</Text>}
              </TouchableOpacity>
            </View>
            <View style={[styles.card, { marginTop: 14 }]}>
              <Text style={styles.cardTitle}>Style preferences</Text>
              <Text style={styles.label}>Preferred styles (comma separated)</Text>
              <TextInput style={styles.input} value={preferenceStyles} onChangeText={setPreferenceStyles} placeholder="Casual, Minimalist" placeholderTextColor="#64748b" />
              <Text style={styles.label}>Favorite colors (comma separated)</Text>
              <TextInput style={styles.input} value={favoriteColors} onChangeText={setFavoriteColors} placeholder="Navy, Ivory" placeholderTextColor="#64748b" />
              <Text style={styles.catalogNotice}>Skin tone is optional and does not restrict clothing choices.</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={savePreferences}><Text style={styles.btnText}>Save preferences</Text></TouchableOpacity>
            </View>
            {user.role === 'admin' && (
              <View style={[styles.card, { marginTop: 14 }]}>
                <Text style={styles.cardTitle}>Admin: add catalogue product</Text>
                <TextInput style={styles.input} value={adminName} onChangeText={setAdminName} placeholder="Product name" placeholderTextColor="#64748b" />
                <TextInput style={styles.input} value={adminImageUrl} onChangeText={setAdminImageUrl} placeholder="HTTPS product image URL" placeholderTextColor="#64748b" autoCapitalize="none" />
                <TextInput style={styles.input} value={adminImageSource} onChangeText={setAdminImageSource} placeholder="Image source / license URL" placeholderTextColor="#64748b" autoCapitalize="none" />
                  <Text style={styles.label}>Category</Text>
                <View style={styles.pillRow}>
                  {['top', 'bottom', 'dress', 'shoes', 'bag', 'necklace', 'jacket', 'accessory'].map((category) => (
                    <TouchableOpacity key={category} style={[styles.pill, adminCategory === category && styles.pillActive]} onPress={() => setAdminCategory(category)}>
                      <Text style={[styles.pillText, adminCategory === category && styles.pillTextActive]}>{category}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>Occasions</Text>
                <View style={styles.pillRow}>
                  {occasions.map((occ) => (
                    <TouchableOpacity key={occ.id} style={[styles.pill, adminOccasions.includes(occ.key_name) && styles.pillActive]} onPress={() => toggleAdminOccasion(occ.key_name)}>
                      <Text style={[styles.pillText, adminOccasions.includes(occ.key_name) && styles.pillTextActive]}>{occ.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={addAdminProduct}><Text style={styles.btnText}>Add product</Text></TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navTab, currentTab === 'shop' && styles.navTabActive]}
          onPress={() => setCurrentTab('shop')}
        >
          <Text style={styles.navIcon}>✨</Text>
          <Text style={[styles.navLabel, currentTab === 'shop' && styles.navLabelActive]}>Collections</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, currentTab === 'recommend' && styles.navTabActive]}
          onPress={() => setCurrentTab('recommend')}
        >
          <Text style={styles.navIcon}>✨</Text>
          <Text style={[styles.navLabel, currentTab === 'recommend' && styles.navLabelActive]}>Outfits</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, currentTab === 'favorites' && styles.navTabActive]}
          onPress={async () => {
            try {
              if (!user) {
                Alert.alert('Sign in required', 'Sign in to view your saved favorites.');
                return;
              }
              await loadFavorites();
              setCurrentTab('favorites');
            } catch (err) {
              Alert.alert('Favorites unavailable', err.message);
            }
          }}
        >
          <Text style={styles.navIcon}>♥</Text>
          <Text style={[styles.navLabel, currentTab === 'favorites' && styles.navLabelActive]}>Favorites</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, currentTab === 'wardrobe' && styles.navTabActive]}
          onPress={() => setCurrentTab('wardrobe')}
        >
          <Text style={styles.navIcon}>👕</Text>
          <Text style={[styles.navLabel, currentTab === 'wardrobe' && styles.navLabelActive]}>Wardrobe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, currentTab === 'profile' && styles.navTabActive]}
          onPress={() => setCurrentTab('profile')}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={[styles.navLabel, currentTab === 'profile' && styles.navLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Add Wardrobe Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.cardTitle}>Add Wardrobe Item</Text>

            <TextInput
              style={styles.input}
              placeholder="Item Title (e.g. Silk Ivory Blouse)"
              placeholderTextColor="#64748b"
              value={newItemTitle}
              onChangeText={setNewItemTitle}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.pillRow}>
              {['top', 'bottom', 'dress', 'shoes', 'bag', 'necklace', 'jacket', 'accessory'].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.pill, newItemCategory === c && styles.pillActive]}
                  onPress={() => setNewItemCategory(c)}
                >
                  <Text style={[styles.pillText, newItemCategory === c && styles.pillTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              placeholder="Color (e.g. Navy, White, Beige)"
              placeholderTextColor="#64748b"
              value={newItemColor}
              onChangeText={setNewItemColor}
            />

            <TouchableOpacity style={styles.secondaryBtn} onPress={pickWardrobePhoto}>
              <Text style={styles.secondaryBtnText}>{wardrobeImage ? 'Change clothing photo' : 'Choose clothing photo (JPG / PNG / WebP)'}</Text>
            </TouchableOpacity>
            {wardrobeImage && <Image source={{ uri: wardrobeImage.uri }} style={styles.selectedImagePreview} />}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleAddItem} disabled={loading}>
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.demoBtn, { flex: 1 }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.demoBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* AR Try-On Modal */}
      <Modal visible={arModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.cardTitle}>{previewProduct ? `Preview: ${previewProduct.name}` : 'Try-on capability'}</Text>
            <View style={styles.arPreview}>
              <Text style={styles.previewAvatar}>🧍‍♀️</Text>
              {previewProduct?.image_url && <Image source={{ uri: previewProduct.image_url }} style={styles.previewProductImage} />}
              <Text style={styles.arPreviewTitle}>{previewProduct ? 'Selected product reference' : `Preview unavailable: ${arTarget}`}</Text>
              <Text style={styles.arPreviewSub}>Reference image only. There is no garment fitting, size prediction, or realistic try-on model in this app.</Text>
              {previewProduct && <TouchableOpacity style={styles.secondaryBtn} onPress={pickPersonalPreview}><Text style={styles.secondaryBtnText}>Select personal photo for local reference</Text></TouchableOpacity>}
              {personalPreviewUri && <Image source={{ uri: personalPreviewUri }} style={styles.selectedImagePreview} />}
              {previewProduct && products.filter((item) => item.id !== previewProduct.id).map((item) => (
                <TouchableOpacity key={item.id} style={styles.secondaryBtn} onPress={() => setPreviewProduct(item)}>
                  <Text style={styles.secondaryBtnText}>Switch to {item.name}</Text>
                </TouchableOpacity>
              ))}
              {previewProduct && <TouchableOpacity style={styles.removePreviewBtn} onPress={() => setPreviewProduct(null)}><Text style={styles.removeText}>Remove selected product</Text></TouchableOpacity>}
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setArModalVisible(false)}>
              <Text style={styles.btnText}>Close Try-On</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0b10' },
  authContainer: { padding: 24, justifyContent: 'center', minHeight: '100%' },
  brandContainer: { alignItems: 'center', marginBottom: 28 },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: { fontSize: 30, fontWeight: '800', color: '#f8fafc' },
  brandSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  card: {
    backgroundColor: '#161926',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginBottom: 14 },
  input: {
    backgroundColor: '#1e2235',
    color: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  primaryBtn: {
    backgroundColor: '#a855f7',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  btnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  demoBtn: {
    backgroundColor: '#1e2235',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  demoBtnText: { color: '#c084fc', fontWeight: '600' },
  linkBtn: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#94a3b8', fontSize: 13 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#a855f7' },
  headerUser: { fontSize: 12, color: '#94a3b8' },
  logoutBtn: { padding: 8 },
  logoutText: { color: '#f43f5e', fontSize: 13, fontWeight: '600' },
  weatherStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 182, 212, 0.25)',
  },
  weatherIcon: { fontSize: 20, marginRight: 8 },
  weatherText: { fontSize: 11, color: '#bae6fd', flex: 1 },
  content: { flex: 1, padding: 16 },
  sectionHeader: { marginBottom: 14 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#f8fafc' },
  sectionSub: { fontSize: 13, color: '#94a3b8' },
  generatorBox: {
    backgroundColor: '#161926',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 6 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#1e2235',
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillActive: { backgroundColor: '#a855f7', borderColor: '#c084fc' },
  pillText: { fontSize: 12, color: '#94a3b8' },
  pillTextActive: { color: '#ffffff', fontWeight: '700' },
  generateBtn: {
    backgroundColor: '#a855f7',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  generateBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  outfitCard: {
    backgroundColor: '#161926',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  outfitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  outfitTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', flex: 1 },
  scoreBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: { color: '#34d399', fontSize: 12, fontWeight: '700' },
  outfitReasoning: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    padding: 10,
    borderRadius: 8,
  },
  itemsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  itemCard: {
    width: '48%',
    backgroundColor: '#1e2235',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  itemIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#262b42',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  itemCategory: { fontSize: 11, color: '#a855f7', fontWeight: '700', textTransform: 'uppercase' },
  itemTitle: { fontSize: 13, fontWeight: '600', color: '#f8fafc', textAlign: 'center' },
  itemColor: { fontSize: 11, color: '#94a3b8' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
  },
  arBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  arBtnText: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
  starsRow: { flexDirection: 'row', gap: 4 },
  starIcon: { fontSize: 18, color: '#fbbf24' },
  addBtn: { backgroundColor: '#a855f7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  wardrobeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  wardrobeItemCard: {
    width: '48%',
    backgroundColor: '#161926',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  wardrobeThumb: {
    height: 100,
    backgroundColor: '#1e2235',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wardrobePhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  wardrobeInfo: { padding: 10 },
  wardrobeTitle: { fontSize: 13, fontWeight: '700', color: '#f8fafc' },
  wardrobeSubText: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  wardrobeBadge: { fontSize: 10, color: '#a855f7', marginTop: 4 },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#12141e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 8,
  },
  navTab: { flex: 1, alignItems: 'center' },
  navTabActive: { opacity: 1 },
  navIcon: { fontSize: 18 },
  navLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  navLabelActive: { color: '#a855f7', fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#161926',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  arPreview: {
    minHeight: 180,
    backgroundColor: '#1e2235',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#a855f7',
  },
  previewAvatar: { fontSize: 58 },
  previewProductImage: { width: 120, height: 120, resizeMode: 'contain', marginTop: 8, borderRadius: 8 },
  selectedImagePreview: { width: '100%', height: 180, resizeMode: 'contain', marginVertical: 10, borderRadius: 8 },
  removePreviewBtn: { padding: 8, marginTop: 4 },
  arPreviewTitle: { color: '#f8fafc', fontWeight: '700', marginTop: 10 },
  arPreviewSub: { color: '#34d399', fontSize: 12, marginTop: 4 },
});
