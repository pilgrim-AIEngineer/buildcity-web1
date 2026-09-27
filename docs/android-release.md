# Android apps

One Capacitor project (`android/`) builds two Play Store apps as Gradle product flavors:

| Flavor     | App                 | Package                | How screens get updated |
|------------|---------------------|------------------------|-------------------------|
| `customer` | BuildCity           | `com.buildcity.app`    | Bundled web app, plus over-the-air (OTA) updates after every deploy of `main` |
| `partner`  | BuildCity Partner   | `com.buildcity.vendor` | Loads the live site `https://www.buildcity.in` in vendor mode: every deploy of `main` is live on the next launch |

A Play Store release is only needed for **native** changes: a new or upgraded Capacitor plugin, Android
permissions, icons/app name, or the Capacitor/Gradle setup.

## Release a new build

1. Bump `versionCode` (must be higher than the one on the Play Store) and `versionName` for the flavor in
   `android/app/build.gradle`.
2. Prepare the Android project for that app:
   ```sh
   npm run android:partner    # or: npm run android:customer
   ```
   This builds the web app for that app, runs `cap sync android` and writes the app's Capacitor config
   into `android/app/src/main/assets`. Run it before **every** Gradle build — both apps share that folder.
3. Build the signed bundle:
   ```sh
   cd android && ./gradlew bundlePartnerRelease    # or bundleCustomerRelease
   ```
   (Android Studio: Build Variants → `partnerRelease` / `customerRelease` → Build → Generate Signed App Bundle.)
4. Upload `android/app/build/outputs/bundle/<flavor>Release/app-<flavor>-release.aab` to that app in the Play Console.

`android/app/google-services.json` is not in the repo; it must contain Firebase clients for **both**
`com.buildcity.app` and `com.buildcity.vendor` for push notifications to work in both apps.

## Partner app: live site

`scripts/android.mjs partner` sets `server.url` to `https://www.buildcity.in` and appends `BuildCityPartner`
to the WebView user agent. `src/config/appMode.js` sees that marker and renders the vendor app, so the same
Vercel deployment serves the storefront in browsers and the vendor app inside the partner app.

- No internet: the app shows the bundled `public/offline.html` and reloads when the connection returns.
- Need a build that works without the live site? `npm run android:partner -- --bundled` bundles the vendor
  app instead (updates then need a Play Store release).
- Vendors log in once more after switching to the live-site build (the session now lives on
  `www.buildcity.in` instead of the app's local origin).

## Customer app: over-the-air updates

Uses `@capgo/capacitor-updater`, self-hosted on our own Vercel deployment (no Capgo account):

1. `npm run build` (Vercel's build command) runs `vite build`, then `scripts/ota-bundle.mjs`, which zips
   `dist/` into `dist/ota/customer/<version>.zip` and writes `dist/ota/customer/latest.json`.
2. On launch/resume the app POSTs to `/api/ota-customer` (`api/ota-customer.js`), which answers with the
   latest bundle or "up to date".
3. The app downloads the bundle in the background and switches to it on the next launch. `src/main.jsx`
   calls `CapacitorUpdater.notifyAppReady()`; if a bundle fails to boot within 10 s the app rolls back.

When a release adds or upgrades a native plugin, raise `MIN_NATIVE_VERSION` in `scripts/ota-bundle.mjs` to
that release's `versionName`, so older installs keep their bundle until they update from the Play Store.
