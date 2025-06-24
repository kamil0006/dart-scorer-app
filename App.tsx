// App.tsx
import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';

import { initDB } from './lib/db';
import GameScreen from './screens/GameScreen';
import StatsScreen from './screens/StatsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
	// tworzymy tabelę tylko raz
	useEffect(initDB, []);

	return (
		<NavigationContainer>
			<StatusBar barStyle='light-content' />
			<Tab.Navigator
				screenOptions={{
					headerShown: false,
					tabBarStyle: { backgroundColor: '#1a1a1a' },
					tabBarActiveTintColor: '#60D394',
					tabBarInactiveTintColor: '#888',
				}}>
				<Tab.Screen
					name='Gra'
					component={GameScreen}
					options={{
						tabBarIcon: ({ color, size }) => <Feather name='target' size={size} color={color} />,
					}}
				/>
				<Tab.Screen
					name='Statystyki'
					component={StatsScreen}
					options={{
						tabBarIcon: ({ color, size }) => <Feather name='bar-chart-2' size={size} color={color} />,
					}}
				/>
			</Tab.Navigator>
		</NavigationContainer>
	);
}
