# StyleMate

StyleMate is a fashion inspiration and personal styling app. It helps people explore different looks for occasions, preview a selected collection, save favorites, and organize their personal wardrobe. It is **not a store**: there are no prices, purchases, checkout, or payments.

The project includes a browser app, an Expo mobile app, and a shared Express API using persistent SQLite or MySQL storage.

## Features and status

| Feature | Status | Details |
| --- | --- | --- |
| Registration, login, logout | **Implemented and API-verified** | Passwords are hashed; database-backed sessions can be revoked. Web uses HttpOnly cookies; native mobile uses SecureStore bearer tokens. Repeated failed login attempts are throttled. Public registration cannot grant an admin role. |
| Authorization and privacy | **Implemented and API-verified** | Admin product management is protected server-side. Profile, uploaded wardrobe items/images, and favorites are scoped to the signed-in user. Tests verify cross-user denial and logout invalidation. |
| Profile and preferences | **Implemented and API-verified** | Onboarding collects age range, gender/style preference, and skin tone. Users can update and save profile details, styles, and favorite colors. Preferences are editable; skin tone does not exclude any clothing. |
| Occasion and category collections | **Implemented and API-verified** | The shared catalogue contains **40 distinct seeded collections across 8 categories**: tops, bottoms, dresses, shoes, bags, necklaces/jewelry, jackets, and accessories. It covers **13 occasions**. Each category/occasion filter combination returns at least five distinct collection records. A product has one category; occasion tags do not copy the product into another category. |
| Collection filters | **Implemented and API-verified** | Occasion and category filters can be applied together in the web and mobile clients. Seeded collections are tagged for all occasion choices so browsing never hits an empty seeded category/occasion combination. These are broad style-inspiration groupings, not guarantees of event suitability. |
| Favorites | **Implemented and API-verified** | Save or remove a collection from the web or mobile catalogue. Favorites persist in the database and remain private to the signed-in account. |
| Admin collection management | **Implemented; API create/permission tested** | An admin can add an image, name, category, source/license URL, and editable occasion tags. New entries are saved to the shared database. A full admin UI round-trip and persistence after restarting the server have not yet been manually rechecked in this version. |
| Wardrobe uploads | **Implemented and API-verified** | Upload JPEG/PNG/WebP clothing images up to 10 MB. Images are kept on the API host; retrieval is private to the owner. |
| Collection preview | **Basic reference preview implemented; realistic try-on blocked** | The selected product image appears in a doll/avatar or photo-reference view. This does not synthesize fitted clothing, perform garment segmentation, or predict size/fit. |
| Outfit recommendations | **Implemented and API-verified** | Suggestions use transparent deterministic rules based on occasion, wardrobe tags, saved styles/colors, favorites, and feedback. No AI accuracy percentage is claimed. |
| Physical mobile-device flow | **Implemented but not fully device-verified** | Android bundle export succeeds. A physical phone login and upload session has not been end-to-end tested. Expo web is not configured. |

### Image and collection notes

The seeded catalogue uses 40 separate product records with one category per record, source/reference links, and external Unsplash image URLs. Some images may be reused for different visual collection records; review each image and its current license/attribution requirements before public or commercial use. These entries are illustrative styling content, not retailer inventory or purchasable items.

### Explicitly out of scope

- Store inventory, product prices, cart, checkout, orders, or payment processing.
- Realistic photo virtual try-on, garment segmentation, or size/fit prediction.
- Weather-based recommendations or a remote AI model.

## Requirements

- Node.js 18 or newer and npm.
- Android Studio/emulator or Expo Go for native mobile testing.
- SQLite for the simple local setup, or a configured MySQL server.

## Run the website and API (PowerShell)

From the project root:

```powershell
cd api
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm install
$env:DB_ENGINE = "sqlite"
npm run migrate
npm run seed
cd ..\web
npm run build
cd ..\api
npm start
```

Open [http://localhost:5000](http://localhost:5000). The API also serves the generated web application. On startup it applies migrations and seeds collections. The SQLite database is `api/stylemate.sqlite`; uploaded user images are stored under `api/uploads/`. Keep both private and back them up appropriately.

`DB_ENGINE=sqlite` selects local SQLite. If omitted, the API attempts MySQL using `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`, and reports a warning before using SQLite if MySQL is unreachable. Do not put secrets in tracked files.

## Create or reset the administrator

Run from another PowerShell terminal, using the same database settings as the API:

```powershell
cd api
$env:DB_ENGINE = "sqlite"
$env:ADMIN_EMAIL = "admin@your-local-domain.test"
npm run create-admin
Remove-Item Env:ADMIN_EMAIL
```

The CLI prints a generated temporary password once. Sign in at [http://localhost:5000](http://localhost:5000) and change it from **Profile → Change password**. Running the provisioning command again resets the password and revokes existing sessions. Never create admins through public registration.

The mobile dependency tree currently reports known npm audit advisories. A non-breaking `npm audit fix` did not resolve all of them; forced fixes require Expo dependency upgrades and were not applied.

## Run the mobile app

With the API running:

```powershell
cd mobile
npm install
npx expo start
```

Scan the Expo QR code with Expo Go or launch an emulator from the Expo terminal. API host addresses:

- Android emulator: `http://10.0.2.2:5000`
- iOS simulator: `http://localhost:5000`
- Physical phone: set `EXPO_PUBLIC_API_URL` to the computer's LAN IP before running Expo, for example:

  ```powershell
  $env:EXPO_PUBLIC_API_URL = "http://192.168.1.10:5000"
  npx expo start
  ```

Replace the example LAN IP with the host computer's address. Allow port 5000 through the firewall if needed. A physical phone cannot use `localhost` to reach the computer.

To verify Android bundle generation:

```powershell
cd mobile
.\node_modules\.bin\expo.cmd export --platform android
```

## User walkthrough

1. Register or sign in on web or mobile. Complete the age range, gender/style, and skin-tone onboarding fields.
2. Open **Explore Collections** / **Collections**. Choose an occasion and category; the catalogue shows at least five style ideas per combined filter.
3. Choose **Preview collection** / **See Live / Preview** on a collection. The selected image is shown as a visual reference only.
4. Tap **Save favorite** to keep a collection under **Favorites**. Favorites persist when you sign in again.
5. Use **Wardrobe** to upload and describe personal clothing. Uploaded images are private to your account.
6. Edit profile and style/color preferences on the **Profile** page. Use **Log out** there to revoke the session.
7. Admin accounts can add a collection in the Admin form with its category and occasion tags.

## Verification

Run:

```powershell
cd api
npm test
cd ..\web
npm run build
cd ..\mobile
.\node_modules\.bin\expo.cmd export --platform android
```

The API tests cover authentication, registration validation, login throttling, session revocation, profiles/preferences, admin product permissions, at-least-five collection coverage for all category/occasion combinations, private uploads, favorites persistence, and cross-user access denial. A successful Android export validates bundling, not a full device interaction.

## Database notes

The schema stores users and sessions, profiles/preferences, occasions, distinct catalogue products and product/occasion tags, owner-private wardrobe items, recommendation feedback, and user favorites. Existing databases from an earlier app version may still contain unused legacy shopping/order tables; current application code and screens do not use them. Back up the database before deploying schema changes.
