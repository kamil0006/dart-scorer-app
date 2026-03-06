# Dart Scorer

A React Native (Expo) mobile app for dart scoring, training, and statistics.

## Overview

`Dart Scorer` is a score-tracking app for steel darts with:

- game variants: `301`, `401`, `501`
- simple and advanced throw input
- checkout suggestions
- match and training statistics
- local data backup/import (JSON)
- Polish and English UI

## Main Features

- **Game variants**: `301`, `401`, `501`
- **Advanced mode**: throw-by-throw tracking and dartboard interaction
- **Statistics**: overall summary, detailed metrics, mode comparison, trends
- **Training mode**: target training and checkout training
- **Forfeit support**: store unfinished games with remaining score
- **Data backup**:
  - export local database data to JSON
  - import JSON as merge or replace
  - share backup file from device
- **Localization**: Polish/English switch in settings

## Tech Stack

- **Expo SDK**: `54`
- **React Native**: `0.81`
- **React**: `19`
- **TypeScript**: `5.9`
- **SQLite** (`expo-sqlite`) for persistent local storage
- **AsyncStorage** for app settings

## Project Structure

```text
dart-scorer/
├── components/
├── database/
├── lib/
│   ├── checkout.ts
│   ├── dataBackup.ts
│   ├── db.ts
│   ├── gameVariant.ts
│   ├── localization.ts
│   └── settings.ts
├── navigation/
├── screens/
│   ├── GameScreen.tsx
│   ├── NewGameScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── StatsDetailScreen.tsx
│   ├── StatsScreen.tsx
│   └── TrainingScreen.tsx
└── android/
```

## Getting Started

### Requirements

- Node.js `18+`
- npm
- Android Studio (for Android builds)
- (optional) Xcode/macOS for native iOS builds

### Install

```bash
git clone https://github.com/yourusername/dart-scorer.git
cd dart-scorer
npm install
```

### Run Dev

```bash
npm start
npm run android
npm run web
```

## Build & Release

### Android local build

From `android/`:

```bash
.\gradlew.bat assembleRelease
```

APK output:

```text
android/app/build/outputs/apk/release/app-release.apk
```

For Google Play (`.aab`):

```bash
.\gradlew.bat bundleRelease
```

AAB output:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

### Versioning before release

Update:

- `android/app/build.gradle`
  - `versionCode` (+1 each release)
  - `versionName` (human-readable app version)
- `app.json`
  - `expo.version` (keep aligned with release version)

## Data Storage

The app stores data locally in SQLite.

### `games` table

- start score (`301/401/501`)
- turns, darts count, average
- checkout info
- forfeit status and remaining score

### `training_sessions` table

- targets/hits/misses
- duration and success rate
- training mode and practiced targets

## Backup / Restore

In `Settings` you can:

- **Export data** -> create JSON backup file
- **Import data** -> choose JSON backup and:
  - merge with current data
  - replace current data

Typical migration flow:

1. Export backup on old device
2. Send file to cloud/email/computer
3. Download file on new device
4. Import in app settings

## Localization

Supported languages:

- Polish (`pl`)
- English (`en`)

All key UI sections (gameplay, stats, settings, backup) are localized.

## Notes

- Current Android release config should use a proper release keystore before production publishing.
- Test core flows after each release build: game start/end, stats, training, export/import.

## Support

- Email: `cheyseee98@gmail.com`

