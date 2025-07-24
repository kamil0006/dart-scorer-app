import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { deleteStatById } from '../database/statsRepository';
import { clearGames, fetchGames } from '../lib/db';
import { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

export default function StatsScreen() {
	const [games, setGames] = useState<any[]>([]);
	const navigation = useNavigation<Nav>();

	/* odczyt listy za każdym wejściem */
	useFocusEffect(
		useCallback(() => {
			try {
				setGames(fetchGames());
			} catch (e) {
				console.warn('DB read error:', e);
			}
		}, [])
	);

	/* akcje UI */
	const handleClearAll = () =>
		Alert.alert('Usunąć wszystkie statystyki?', 'Operacja nieodwracalna.', [
			{ text: 'Anuluj', style: 'cancel' },
			{
				text: 'Usuń',
				style: 'destructive',
				onPress: () => {
					clearGames();
					setGames([]);
				},
			},
		]);

	const handleDeleteOne = (id: number) =>
		Alert.alert('Usunąć ten wpis?', undefined, [
			{ text: 'Anuluj', style: 'cancel' },
			{
				text: 'Usuń',
				style: 'destructive',
				onPress: () => {
					try {
						deleteStatById(id);
						setGames(prev => prev.filter(g => g.id !== id));
					} catch (e) {
						console.warn('Delete stat error:', e);
					}
				},
			},
		]);

	/* statystyki zbiorcze */
	const played = games.length;
	const g501 = games.filter(g => g.start === 501).length;
	const g301 = played - g501;
	const bestAvg = Math.max(...games.map(g => g.avg3), 0).toFixed(1);
	const allDarts = games.reduce((s, g) => s + g.darts, 0);
	const allAvg = played ? ((games.reduce((s, g) => s + g.scored, 0) / allDarts) * 3).toFixed(1) : '0.0';

	/* render pojedynczej karty */
	const renderItem = ({ item }: { item: any }) => (
		<Swipeable
			overshootRight={false}
			renderRightActions={() => (
				<Pressable style={styles.deleteAction} onPress={() => handleDeleteOne(item.id)}>
					<View style={styles.deleteCircle}>
						<Ionicons name='trash' size={18} color='#fff' />
					</View>
				</Pressable>
			)}>
			<Pressable
				style={styles.card}
				onPress={() =>
					navigation.navigate('StatsDetail', {
						id: item.id,
						turns: JSON.parse(item.turns),
						avg3: item.avg3,
						date: item.date,
						start: item.start,
						forfeited: item.forfeited === 1 || item.forfeited === true,
					})
				}>
				<Text style={styles.avg}>{item.avg3.toFixed(1)}</Text>

				<View>
					<Text style={styles.date}>{item.date.slice(0, 10)}</Text>
				</View>

				<View style={styles.variant}>
					<Text style={styles.variantTxt}>{item.start}</Text>
				</View>

				{item.forfeited === 1 || (item.forfeited === true && item.forfeitScore != null) ? (
					<View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
						<MaterialIcons name='flag' size={20} color='#B00020' />
						<Text style={{ color: '#B00020', fontWeight: 'bold', marginLeft: 4, fontSize: 13 }}>
							{item.forfeitScore} pts left
						</Text>
					</View>
				) : null}
			</Pressable>
		</Swipeable>
	);

	/* ---------- JSX ---------- */
	return (
		<View style={styles.container}>
			<Text style={styles.sectionHeader}>Podsumowanie</Text>
			<View style={styles.statsGrid}>
				<Stat label='Gier' value={played} icon={'sports-esports'} />
				<Stat label='Naj. AVG' value={bestAvg} icon={'star'} />
				<Stat label='AVG całość' value={allAvg} icon={'insert-chart'} />
				<Stat label='Lotki łącznie' value={allDarts} icon={'sports-soccer'} />
				<Stat label='501' value={g501} icon={'filter-5'} />
				<Stat label='301' value={g301} icon={'filter-3'} />
			</View>

			<FlatList
				data={games}
				keyExtractor={g => g.id.toString()}
				contentContainerStyle={{ paddingBottom: 80 }}
				renderItem={renderItem}
			/>
		</View>
	);
}

/* komponent pomocniczy */
function Stat({ label, value, icon }: { label: string; value: any; icon?: keyof typeof MaterialIcons.glyphMap }) {
	return (
		<View style={styles.statCard}>
			{icon && <MaterialIcons name={icon} size={24} color='#8AB4F8' style={{ marginBottom: 4 }} />}
			<Text style={styles.statValue}>{value}</Text>
			<Text style={styles.statLabel}>{label}</Text>
		</View>
	);
}

/* ---------- style ---------- */
const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#121212', padding: 16 },
	header: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
		marginBottom: 16,
		paddingVertical: 8,
	},
	trashAll: {
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: '#B00020',
		justifyContent: 'center',
		alignItems: 'center',
	},
	deleteAction: {
		justifyContent: 'center',
		alignItems: 'center',
		width: 56,
		height: '100%',
		backgroundColor: 'transparent',
	},
	deleteCircle: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#B00020',
		justifyContent: 'center',
		alignItems: 'center',
	},
	card: {
		flexDirection: 'row',
		gap: 12,
		backgroundColor: '#1E1E1E',
		borderRadius: 10,
		padding: 12,
		marginBottom: 10,
		alignItems: 'center',
	},
	variant: {
		minWidth: 42,
		paddingVertical: 2,
		borderRadius: 6,
		backgroundColor: '#333',
		justifyContent: 'center',
		alignItems: 'center',
	},
	variantTxt: { color: '#8AB4F8', fontSize: 12, fontWeight: '600' },
	avg: { fontSize: 26, color: '#8AB4F8', width: 70, textAlign: 'center' },
	date: { color: '#fff', fontSize: 14 },
	sectionHeader: {
		color: '#8AB4F8',
		fontSize: 18,
		fontWeight: '700',
		marginBottom: 10,
		marginTop: 8,
		alignSelf: 'center',
		letterSpacing: 1,
	},
	statsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 12,
		marginBottom: 18,
	},
	statCard: {
		width: '30%',
		minWidth: 100,
		aspectRatio: 1,
		backgroundColor: '#23272E',
		borderRadius: 14,
		margin: 6,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		elevation: 2,
	},
	statValue: {
		color: '#fff',
		fontSize: 22,
		fontWeight: 'bold',
		marginBottom: 2,
	},
	statLabel: {
		color: '#8AB4F8',
		fontSize: 13,
		textAlign: 'center',
	},
});
