# 🎯 Dart Scorer

A comprehensive React Native mobile application for dart game scoring and statistics tracking. Built with Expo and TypeScript, featuring an interactive dartboard interface and advanced game analytics.

## 📱 Project Overview

**Dart Scorer** is a professional-grade dart scoring application that supports both 301 and 501 dart game variants. The app features an interactive visual dartboard, real-time scoring, comprehensive statistics tracking, and built-in checkout suggestions for optimal finishing strategies.

### ✨ Key Features

- **Game Variants**: Support for 301 and 501 dart games
- **Advanced Mode**: Enhanced gameplay with detailed throw tracking
- **Interactive Dartboard**: Visual dartboard interface with touch input
- **Statistics Tracking**: Comprehensive game history and performance metrics
- **Checkout Calculator**: Built-in checkout suggestions for optimal finishing
- **Dark Theme UI**: Modern, user-friendly interface optimized for mobile
- **Real-time Scoring**: Live score updates and game progress tracking

## 🏗️ Technical Architecture

### **Frontend Framework**

- **React Native 0.79.4** with **Expo SDK 53**
- **TypeScript 5.8.3** for type safety and development experience
- **React Navigation 7** for seamless navigation between screens
- **React Native SVG** for high-quality dartboard rendering

### **State Management & Data**

- **SQLite Database** (expo-sqlite) for persistent game storage
- **AsyncStorage** for user preferences and settings
- **React Hooks** for efficient component state management

### **UI Components**

- **Custom Dartboard Components**: Interactive SVG-based dartboard
- **Advanced Throw Pad**: Enhanced input system for precise scoring
- **Score Board**: Real-time game progress tracking
- **Statistics Dashboard**: Comprehensive performance analytics

## 📁 Project Structure

```
dart-scorer/
├── components/          # Reusable UI components
│   ├── AdvancedThrowPad.tsx
│   ├── DartboardBase.tsx
│   ├── DartboardPicker.tsx
│   ├── Numpad.tsx
│   ├── ScoreBoard.tsx
│   └── ThreeThrowsInput.tsx
├── screens/            # Main application screens
│   ├── GameScreen.tsx
│   ├── NewGameScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── StatsDetailScreen.tsx
│   └── StatsScreen.tsx
├── lib/                # Core business logic
│   ├── checkout.ts     # Checkout calculations
│   ├── db.ts          # Database operations
│   ├── gameVariant.ts # Game variant logic
│   └── settings.ts    # User preferences
├── database/           # Data access layer
├── navigation/         # Navigation configuration
└── assets/            # Images and static resources
```

## 🚀 Getting Started

### **Prerequisites**

- Node.js 18+
- npm or yarn package manager
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### **Installation**

```bash
# Clone the repository
git clone https://github.com/yourusername/dart-scorer.git
cd dart-scorer

# Install dependencies
npm install

# Start the development server
npm start
```

### **Development Commands**

```bash
npm start          # Start Expo development server
npm run android    # Run on Android emulator/device
npm run ios        # Run on iOS simulator/device
npm run web        # Run in web browser
npm run lint       # Run ESLint for code quality
npm run reset-project  # Reset to clean project state
```

## 🔧 Development Setup

### **Environment Configuration**

1. **Expo Configuration**: The app uses Expo's managed workflow for easy development
2. **TypeScript**: Strict mode enabled with custom path mappings for clean imports
3. **ESLint**: Expo-specific linting rules configured for code quality
4. **Database**: SQLite database automatically initialized on first app run

### **Key Dependencies**

- **@expo/vector-icons**: Comprehensive icon library for UI elements
- **react-native-svg**: High-performance SVG rendering for dartboard graphics
- **expo-sqlite**: Local database for game persistence and statistics
- **react-native-gesture-handler**: Advanced touch gesture support
- **expo-haptics**: Tactile feedback for enhanced user experience

## 🎮 Game Logic

### **Scoring System**

- **Single**: 1x points (1-20, 25 for bullseye)
- **Double**: 2x points (2-40, 50 for bullseye)
- **Triple**: 3x points (3-60)
- **Bust Prevention**: Automatic validation to prevent impossible scores

### **Checkout System**

- **Built-in Checkout Chart**: Pre-calculated optimal finishing combinations
- **Smart Suggestions**: Real-time checkout recommendations during gameplay
- **Fallback Logic**: Handles edge cases and special scenarios gracefully

### **Advanced Mode Features**

- **Throw-by-Throw Tracking**: Individual dart placement recording
- **Performance Analytics**: Detailed statistics for player improvement
- **Game History**: Complete record of all games played with metadata

## 📊 Database Schema

### **Games Table**

```sql
CREATE TABLE games (
  id INTEGER PRIMARY KEY NOT NULL,
  date TEXT,                    -- Game completion timestamp
  start INTEGER,                -- Starting score (301/501)
  turns TEXT,                   -- JSON array of turn scores
  darts INTEGER,                -- Total darts thrown
  scored INTEGER,               -- Total points scored
  avg3 REAL,                    -- 3-dart average
  checkout TEXT,                -- Checkout combination used
  hits TEXT,                    -- JSON array of individual dart hits
  forfeited INTEGER,            -- Game forfeited flag
  forfeitScore INTEGER          -- Score when forfeited
);
```

## 🎨 UI/UX Features

### **Design Principles**

- **Dark Theme**: Consistent dark color scheme throughout the application
- **Responsive Layout**: Adapts to different screen sizes and orientations
- **Touch-Optimized**: Large touch targets optimized for mobile use
- **Visual Feedback**: Haptic feedback and visual indicators for user actions

### **Navigation Structure**

- **Bottom Tab Navigation**: Play and Statistics tabs for main app sections
- **Stack Navigation**: Game flow and statistics detail views
- **Modal Presentations**: Settings and game configuration dialogs

## 🧪 Testing & Quality

### **Code Quality Tools**

- **ESLint**: Code style and best practices enforcement
- **TypeScript**: Compile-time error checking and type safety
- **Prettier**: Code formatting for consistent style (recommended)

### **Testing Strategy**

- **Component Testing**: Individual component validation and behavior testing
- **Integration Testing**: Game flow and data persistence testing
- **User Acceptance**: Dart player feedback and real-world validation

## 📱 Platform Support

### **Target Platforms**

- **Android**: API level 21+ (Android 5.0 Lollipop and above)

### **Device Requirements**

- **Minimum RAM**: 2GB for smooth performance
- **Storage**: 50MB available space for app and data
- **Screen**: 4.5" minimum (optimized for 5" and above)

## 🚀 Deployment

### **Build Process**

```bash
# Build for production
expo build:android    # Android APK/AAB
expo build:ios        # iOS IPA
expo build:web        # Web deployment
```

### **Distribution**

- **Google Play Store**: Android app distribution --coming soon
 

## 🤝 Contributing

### **Development Guidelines**

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Code Standards**

- **TypeScript**: Strict mode compliance and proper typing
- **React Native**: Best practices and performance optimization
- **Component Design**: Reusable and maintainable component architecture
- **Documentation**: Clear code comments and README updates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Expo Team**: For the excellent development platform and tools
- **React Native Community**: For the robust mobile framework
- **Dart Players**: For feedback, feature suggestions, and testing

## 🆘 Support & Contact

- **Email**: cheyseee98@gmail.com

---

**Happy darting! 🎯🎲**

_Built with ❤️ using React Native and Expo_
