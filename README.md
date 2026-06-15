# Dart Scorer

A React Native / Expo mobile app for steel darts scoring, training, statistics, and local multiplayer over WiFi.

## Overview

`Dart Scorer` is built for local dart sessions on Android. It supports classic `301`, `401`, and `501` games, simple score entry, advanced dart-by-dart input, checkout suggestions, real-time WiFi multiplayer, a laptop scoreboard display, training sessions, and long-term statistics.

All game data is stored locally on the device and can be exported or imported as a JSON backup.

## Features

### Game modes

- **Simple scoring mode** — fast turn score entry
- **Advanced scoring mode** — dart-by-dart input, dartboard picker, heatmap
- **Game variants** — `301`, `401`, `501`
- **Checkout suggestions** — validated checkout table from `2` to `170`
- **Checkout darts modal** — accurate final-turn dart count for correct averages

### WiFi multiplayer

- Create a room with a 4-digit code
- Opponent joins by entering the code
- Host picks who starts the first leg (decided by bull throw)
- Leg starts alternate automatically for the rest of the match
- Full sets/legs format with undo support
- Real-time sync over local WiFi via SSE

### Game history

- Completed and forfeited games with detail view
- Remaining score after each turn
- Best turn, three-dart average, `100+` visits, turns below `45`
- Checkout value and path
- Read-only heatmap for advanced-mode games

### Statistics

- PDC-style three-dart average
- Score range distribution
- Simple vs advanced mode comparison
- Checkout profile
- Trends and average game length
- Average trend chart (last 30 games, SVG line)

### Training

Eight modes:

- Target practice
- Checkout practice
- Classic clock
- Double clock
- Triple clock
- Jump clock
- Penalty clock
- Bob's 27

Training history with mode filter, Bob's 27 win/loss status, and swipe-to-delete.

### Backup / restore

- Export games and training sessions to JSON
- Import by merge or replace
- Works across devices

### Localization

- Polish
- English

---

## Tech Stack

| | |
|---|---|
| Expo SDK | `55` |
| React Native | `0.83.6` |
| React | `19.2.0` |
| TypeScript | `~5.9` |
| SQLite | `expo-sqlite` |
| Settings | `AsyncStorage` |
| Navigation | React Navigation (stack + bottom tabs) |
| Charts | `react-native-svg` `15.15.3` |
| JS engine | Hermes (Android release builds) |

---

## Project Structure

```text
dart-scorer/
├── android/                  native Android project
├── assets/
├── components/
│   ├── common/               shared UI components
│   ├── game/                 turn history, score board, throw pad
│   └── stats/                summary modal, trend chart, heatmap
├── database/                 SQLite repositories (games, training, stats)
├── display-server/           standalone Node.js scoreboard server
│   ├── public/               browser display page (HTML/CSS/JS)
│   └── server.js
├── hooks/                    useDartGame, useLanguage
├── lib/
│   ├── checkout.ts
│   ├── dartsStats.ts
│   ├── dataBackup.ts
│   ├── db.ts
│   ├── externalDisplay.ts
│   ├── gameVariant.ts
│   ├── localization.ts
│   └── settings.ts
├── navigation/
├── screens/
│   ├── GameScreen.tsx        single-player game
│   ├── NewGameScreen.tsx     game setup (single / multiplayer)
│   ├── MultiplayerScreen.tsx create or join a WiFi room
│   ├── RoomLobbyScreen.tsx   waiting room + who-starts picker
│   ├── RoomGameScreen.tsx    live multiplayer game
│   ├── StatsScreen.tsx
│   ├── StatsDetailScreen.tsx
│   ├── TrainingScreen.tsx
│   └── SettingsScreen.tsx
├── tests/
├── App.tsx
├── index.js
├── app.json
└── package.json
```

---

## Getting Started

### Requirements

- Node.js `18+`
- npm
- Android Studio / Android SDK for Android builds
- USB debugging enabled on an Android device for direct installation

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

---

## Display Server (laptop scoreboard)

A lightweight Node.js HTTP server that shows a live scoreboard in any browser. It also handles the WiFi multiplayer room API.

### Start

```bash
npm run display
```

Open in a browser on the same machine:

```
http://localhost:3000/display
```

### How to connect the phone

1. Start the display server on the laptop.
2. Open `http://localhost:3000/display` in a browser — it waits in standby.
3. Find the laptop's local IP address (e.g. `http://10.0.0.42:3000`).
4. In the app go to **Settings → Display Server** and enter the laptop address.
5. Start a game — the scoreboard updates live.

For full step-by-step instructions see **Settings → Display server setup** in the app.

### API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/display` | Browser scoreboard page |
| `GET` | `/api/state` | Current display state |
| `POST` | `/api/state` | Update display state |
| `POST` | `/api/reset` | Reset display state |
| `GET` | `/api/events` | SSE stream for display |
| `GET` | `/api/rooms` | List active rooms |
| `POST` | `/api/rooms` | Create a multiplayer room |
| `POST` | `/api/rooms/:code/join` | Join a room |
| `POST` | `/api/rooms/:code/start` | Start the match (host only) |
| `POST` | `/api/rooms/:code/turn` | Submit a turn |
| `POST` | `/api/rooms/:code/undo` | Undo last turn (host only) |
| `GET` | `/api/rooms/:code/events` | SSE stream for a room |

---

## Quality Checks

Run before committing:

```bash
npx tsc --noEmit
npm test
npm run lint
```

---

## Tests

The test suite covers:

- Checkout chart validity
- Checkout-ending dart rules
- Turn resolution and busts
- PDC-style average calculation
- Stored data parsing
- Checkout statistics helpers

Run:

```bash
npm test
```

---

## Android Release Build

Current app identity:

- Display name: `Dart Scorer`
- Android package: `com.anonymous.dartscorer`
- Version: `1.10.0`
- versionCode: `9`

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
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r android\app\build\outputs\apk\release\app-release.apk
```

Clean build if cache causes issues:

```powershell
cd android
.\gradlew.bat clean
.\gradlew.bat assembleRelease
```

### Build notes

- `index.js` is required for native release bundling.
- `android/app/build.gradle` points Hermes to `node_modules/hermes-compiler/hermesc/...`.
- `MainApplication.kt` uses `DefaultReactHost` for the current React Native / Expo setup.
- Before production publishing, replace the debug signing config with a proper release keystore.

---

## Versioning

Keep these aligned before every release:

- `package.json` → `version`
- `app.json` → `expo.version`
- `app.json` → `expo.android.versionCode`
- `android/app/build.gradle` → `versionName`
- `android/app/build.gradle` → `versionCode`

Increment `versionCode` for every Android release.

---

## Data Storage

All data is stored locally in SQLite on the device.

### `games`

- Start score, game mode
- Turns with individual dart hits (advanced mode)
- Darts thrown count
- Three-dart average
- Checkout path
- Forfeit status and remaining score on forfeit

### `training_sessions`

- Training mode
- Targets practiced, hits/misses per target
- Duration
- Success rate
- Bob's 27 score and win/loss status

---

## Notes

- The app is focused on local / offline use. No account or internet connection required.
- WiFi multiplayer runs entirely on the local network via the display server.
- Android release build configuration is included, but production signing still needs a real keystore.
- Backup is JSON-based and intended for manual migration between devices.

---

## Support

Email: `cheyseee98@gmail.com`
