# Quote Maker – Capacitor Android project

Offline Android app (Capacitor 6). All web files, fonts and PDF/Share code are bundled; no network is used.

## Build the debug APK

### A. GitHub Actions (no local setup)
1. Create a GitHub repo and push the contents of this folder.
2. Open **Actions → Build debug APK** (runs on push, or "Run workflow").
3. Download artifact **QuoteMaker-debug-apk** → unzip → `app-debug.apk`.

### B. Command line (needs Node 20+, JDK 17, Android SDK with platform 34)
```
npm ci
npm run sync            # bundles web-src → www, copies into android/
cd android && ./gradlew assembleDebug
```
APK: `android/app/build/outputs/apk/debug/app-debug.apk`
(set `ANDROID_HOME`, or create `android/local.properties` with `sdk.dir=/path/to/Android/sdk`)

### C. Android Studio
`npm ci && npm run sync && npx cap open android`, then Build → Build APK(s).

### Install on a phone
Copy the APK over, open it, allow "install unknown apps". Or: `adb install -r app-debug.apk`.

## Layout
- `web-src/` original web app (edit here). `build-www.mjs` → `www/` (adds offline fonts, native hooks, removes Google Fonts and service worker).
- `src/native.js` PDF generation (html2canvas + jsPDF, A4) and Share/Filesystem hooks.
- `android/` generated Capacitor Android project (icons/splash customized).

## Phone test checklist
Airplane mode on, then: create quote; check totals; add logo; save; reopen from My quotations; Export PDF (share sheet → Save to Drive/Files/WhatsApp); Back up (share sheet) ; clear app data or reinstall; Restore from the backup file.
