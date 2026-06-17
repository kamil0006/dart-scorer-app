import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNavigationContainerRef, DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import OnboardingOverlay from './components/OnboardingOverlay';
import { initDB } from './lib/db';
import { LanguageProvider, useLanguage } from './lib/LanguageContext';
import { OnboardingProvider } from './lib/OnboardingContext';
import { RootStackParamList } from './navigation/types';
import GameScreen from './screens/GameScreen';
import MultiplayerScreen from './screens/MultiplayerScreen';
import NewGameScreen from './screens/NewGameScreen';
import RoomGameScreen from './screens/RoomGameScreen';
import RoomLobbyScreen from './screens/RoomLobbyScreen';
import SettingsScreen from './screens/SettingsScreen';
import StatsDetailScreen from './screens/StatsDetailScreen';
import StatsScreen from './screens/StatsScreen';
import TrainingScreen from './screens/TrainingScreen';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

const StatsStack = createNativeStackNavigator<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

function StatsStackScreen() {
	return (
		<StatsStack.Navigator screenOptions={{ headerShown: false }}>
			<StatsStack.Screen name='StatsList' component={StatsScreen} />
			<StatsStack.Screen name='StatsDetail' component={StatsDetailScreen} />
		</StatsStack.Navigator>
	);
}

function PlayStack() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
			<Stack.Screen name='NewGame' component={NewGameScreen} />
			<Stack.Screen name='Game' component={GameScreen} options={{ gestureEnabled: false }} />
			<Stack.Screen name='Multiplayer' component={MultiplayerScreen} />
			<Stack.Screen name='RoomLobby' component={RoomLobbyScreen} options={{ gestureEnabled: false }} />
			<Stack.Screen name='RoomGame' component={RoomGameScreen} options={{ gestureEnabled: false }} />
		</Stack.Navigator>
	);
}

function AppContent() {
	const { strings } = useLanguage();

	useEffect(() => {
		initDB();
	}, []);

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<StatusBar barStyle='light-content' />
			<NavigationContainer
				ref={navigationRef}
				theme={{
					...DarkTheme,
					colors: {
						...DarkTheme.colors,
						background: '#121212',
						card: '#1E1E1E',
						text: '#ffffff',
						primary: '#8AB4F8',
					},
				}}>
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
							const name: keyof typeof Ionicons.glyphMap =
								route.name === 'Play'
									? focused
										? 'aperture'
										: 'aperture-outline'
									: focused
									? 'stats-chart'
									: 'stats-chart-outline';
							return <Ionicons name={name} size={size} color={color} />;
						},
					})}>
					<Tabs.Screen name='Play' component={PlayStack} options={{ title: strings.play }} />
					<Tabs.Screen name='Stats' component={StatsStackScreen} options={{ title: strings.stats }} />
					<Tabs.Screen
						name='Training'
						component={TrainingScreen}
						options={{
							title: strings.trainingMode,
							tabBarIcon: ({ color, size, focused }) => (
								<Ionicons name={focused ? 'school' : 'school-outline'} size={size} color={color} />
							),
						}}
					/>
					<Tabs.Screen
						name='Settings'
						component={SettingsScreen}
						options={{
							title: strings.settings,
							tabBarIcon: ({ color, size, focused }) => (
								<Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
							),
						}}
					/>
				</Tabs.Navigator>
			</NavigationContainer>
			<OnboardingOverlay />
		</GestureHandlerRootView>
	);
}

export default function App() {
	return (
		<LanguageProvider>
			<OnboardingProvider navigationRef={navigationRef}>
				<AppContent />
			</OnboardingProvider>
		</LanguageProvider>
	);
}
