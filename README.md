# Dart Scorer

A React Native / Expo mobile app for steel darts scoring, training, statistics, and local data backup.

## Overview

`Dart Scorer` is built for local dart sessions on Android. It supports classic `301`, `401`, and `501` games, simple score entry, advanced dart-by-dart input, checkout suggestions, training sessions, and long-term statistics.

The app stores data locally on the device and can export/import a JSON backup.

## Features

- **Game variants**: `301`, `401`, `501`
- **Simple scoring mode**: fast turn score entry
- **Advanced scoring mode**: dart-by-dart input, dartboard picker, heatmap
- **Checkout suggestions**: validated checkout table from `2` to `170`
- **Checkout darts modal**: accurate final-turn dart count for averages
- **Game history**: completed and forfeited games with detail view
- **Game details**:
  - remaining score after each turn
  - best turn
  - average turn
  - `100+` visits
  - turns below `45`
  - checkout value and path
  - read-only heatmap for advanced games
- **Statistics**:
  - PDC-style three-dart average
  - score ranges
  - mode comparison
  - checkout profile
  - trends and game length
- **Training modes**:
  - target practice
  - checkout practice
  - classic clock
  - double clock
  - triple clock
  - jump clock
  - penalty clock
  - Bob's 27
- **Training history**:
  - filters by mode
  - Bob's 27 win/loss status
  - swipe-to-delete sessions
- **Backup / restore**:
  - export games and training sessions to JSON
  - import by merge or replace
- **Localization**:
  - Polish
  - English

## Tech Stack

- Expo SDK `55`
- React Native `0.83`
- React `19.2`
- TypeScript `5.9`
- SQLite via `expo-sqlite`
- AsyncStorage for app settings
- React Navigation
- Hermes on Android release builds

## Project Structure

```text
dart-scorer/
|-- android/
|-- components/
|-- database/
|-- hooks/
|-- lib/
|   |-- checkout.ts
|   |-- dartsStats.ts
|   |-- dataBackup.ts
|   |-- db.ts
|   |-- gameVariant.ts
|   |-- localization.ts
|   `-- settings.ts
|-- navigation/
|-- screens/
|-- tests/
|-- App.tsx
|-- index.js
|-- app.json
`-- package.json
```

## Getting Started

### Requirements

- Node.js `18+`
- npm
- Android Studio / Android SDK for Android builds
- USB debugging enabled on Android device for direct installation

### Install

```bash
npm install
```

### Run in development

```bash
npm start
```

Android:

```bash
npm run android
```

Web:

```bash
npm run web
```

## Quality Checks

Run before committing:

```bash
npx tsc --noEmit
npm test
npm run lint
```

## Android Release Build

Current app identity:

- Display name: `Dart Scorer`
- Android package: `com.anonymous.dartscorer`
- Version: `1.10.0`
- Android versionCode: `9`

Build APK:

```powershell
cd android
.\gradlew.bat assembleRelease
```

APK output:

```text
android/app/build/outputs/apk/release/app-release.apk
```

Install with ADB:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r C:\Users\Kamil\dart-scorer\android\app\build\outputs\apk\release\app-release.apk
```

If build cache causes issues:

```powershell
cd android
.\gradlew.bat clean
.\gradlew.bat assembleRelease
```

## Android Build Notes

- `index.js` is required for native release bundling.
- `android/app/build.gradle` points Hermes to `node_modules/hermes-compiler/hermesc/...`.
- `MainApplication.kt` uses `DefaultReactHost` for the current React Native / Expo setup.
- Before production publishing, replace the debug signing config with a proper release keystore.

## Versioning

Before a release, keep these aligned:

- `package.json` -> `version`
- `app.json` -> `expo.version`
- `app.json` -> `expo.android.versionCode`
- `android/app/build.gradle` -> `versionName`
- `android/app/build.gradle` -> `versionCode`

Increase `versionCode` for every Android release.

## Data Storage

The app stores data locally in SQLite.

### `games`

- start score
- turns
- hits for advanced mode
- darts count
- scored points
- three-dart average
- checkout path
- forfeit status
- remaining score on forfeit

### `training_sessions`

- training mode
- targets practiced
- target results
- hits/misses
- duration
- success rate

## Backup / Restore

In Settings:

1. Export data to JSON.
2. Save or share the file.
3. Import it on the same or another device.
4. Choose merge or replace.

## Tests

The test suite covers:

- checkout chart validity
- checkout-ending dart rules
- turn resolution and busts
- PDC-style average calculation
- stored data parsing
- checkout statistics helpers

Run:

```bash
npm test
```

## Notes

- The app is currently focused on local/offline use.
- Android release build configuration is included, but production signing still needs a real keystore.
- Backup is JSON-based and intended for manual migration between devices.

## Support

Email: `cheyseee98@gmail.com`
