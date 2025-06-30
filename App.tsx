/**
 * Główne wejście aplikacji – dark-mode, bottom-tabs z ikonami,
 * wrapper GestureHandlerRootView (potrzebny do Swipeable).
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { db, initDB } from './lib/db';
import { RootStackParamList } from './navigation/types';
import GameScreen from './screens/GameScreen';
import HeatmapScreen from './screens/HeatmapScreen';
import NewGameScreen from './screens/NewGameScreen';
import SettingsScreen from './screens/SettingsScreen';
import StatsDetailScreen from './screens/StatsDetailScreen';
import StatsScreen from './screens/StatsScreen';
// w App.tsx, tuż po starcie aplikacji

const StatsStack = createNativeStackNavigator<RootStackParamList>();

function StatsStackScreen() {
	return (
		<StatsStack.Navigator screenOptions={{ headerShown: false }}>
			<StatsStack.Screen name='StatsList' component={StatsScreen} />
			<StatsStack.Screen name='StatsDetail' component={StatsDetailScreen} />
			<StatsStack.Screen name='Heatmap' component={HeatmapScreen} />
		</StatsStack.Navigator>
	);
}

/* ---------------------------- stos do gry (501/301) --------------------------- */
const Stack = createNativeStackNavigator<RootStackParamList>();

function PlayStack() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
			<Stack.Screen name='NewGame' component={NewGameScreen} />
			<Stack.Screen name='Game' component={GameScreen} />
		</Stack.Navigator>
	);
}

/* ----------------------------- bottom-tab root ------------------------------ */
const Tabs = createBottomTabNavigator();

export default function App() {
	useEffect(() => {
		initDB();
		// → sprawdź kolumny
		console.log('TABLE INFO:', db.getAllSync("PRAGMA table_info('games');"));
		// → sprawdź ostatni rekord, jeśli jest
		const rows = db.getAllSync('SELECT * FROM games ORDER BY id DESC LIMIT 1;');
		console.log('LAST ROW:', rows[0]);
	  }, []);
	  
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			{/* system status-bar w trybie jasny-tekst na ciemnym tle */}
			<StatusBar barStyle='light-content' />

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
							const name =
								route.name === 'Play'
									? focused
										? 'aperture'
										: 'aperture-outline'
									: focused
									? 'stats-chart'
									: 'stats-chart-outline';
							return <Ionicons name={name as any} size={size} color={color} />;
						},
					})}>
					<Tabs.Screen name='Play' component={PlayStack} options={{ title: 'Gra' }} />
					<Tabs.Screen name='Stats' component={StatsStackScreen} options={{ title: 'Statystyki' }} />
					<Tabs.Screen
						name='HeatmapTab'
						component={HeatmapScreen}
						options={{
							title: 'Heat-mapa',
							tabBarIcon: ({ color, size, focused }) => (
								<Ionicons name={focused ? 'flame' : 'flame-outline'} size={size} color={color} />
							),
						}}
					/>
					<Tabs.Screen
						name='Settings'
						component={SettingsScreen}
						options={{
							title: 'Ustawienia',
							tabBarIcon: ({ color, size, focused }) => (
								<Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
							),
						}}
					/>
				</Tabs.Navigator>
			</NavigationContainer>
		</GestureHandlerRootView>
	);
}
