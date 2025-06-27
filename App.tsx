/**
 * Główne wejście aplikacji – dark-mode, bottom-tabs z ikonami,
 * wrapper GestureHandlerRootView (potrzebny do Swipeable).
 */

import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'react-native';

import NewGameScreen from './screens/NewGameScreen';
import GameScreen from './screens/GameScreen';
import StatsScreen from './screens/StatsScreen';
import { RootStackParamList } from './navigation/types';

/* ---------------------------- stos do gry (501/301) --------------------------- */
const Stack = createNativeStackNavigator<RootStackParamList>();

function PlayStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="NewGame" component={NewGameScreen} />
      <Stack.Screen name="Game" component={GameScreen} />
    </Stack.Navigator>
  );
}

/* ----------------------------- bottom-tab root ------------------------------ */
const Tabs = createBottomTabNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* system status-bar w trybie jasny-tekst na ciemnym tle */}
      <StatusBar barStyle="light-content" />

      <NavigationContainer
        theme={{
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: '#121212',
            card: '#1E1E1E',
            text: '#ffffff',
            primary: '#8AB4F8',
          },
        }}
      >
        <Tabs.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#1E1E1E',
              borderTopColor: '#222',
            },
            tabBarActiveTintColor: '#8AB4F8',
            tabBarInactiveTintColor: '#888',
            tabBarIcon: ({ focused, color, size }) => {
              const name = route.name === 'Play'
                ? focused ? 'aperture' : 'aperture-outline'
                : focused ? 'stats-chart' : 'stats-chart-outline';
              return <Ionicons name={name as any} size={size} color={color} />;
            },
          })}
        >
          <Tabs.Screen
            name="Play"
            component={PlayStack}
            options={{ title: 'Gra' }}
          />
          <Tabs.Screen
            name="Stats"
            component={StatsScreen}
            options={{ title: 'Statystyki' }}
          />
        </Tabs.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}