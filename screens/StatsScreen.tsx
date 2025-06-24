// screens/StatsScreen.tsx
import { useFocusEffect } from '@react-navigation/native'; // ← to dodaj
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { clearGames, fetchGames } from '../lib/db';

export default function StatsScreen() {
	const [games, setGames] = useState<any[]>([]);

	// odpala się ZA KAŻDYM razem, gdy ekran staje się aktywny
	useFocusEffect(
		useCallback(() => {
			try {
				setGames(fetchGames());
			} catch (e) {
				console.warn('DB read error:', e);
			}
		}, [])
	);

	/* ---------- UI ---------- */

	const handleClear = () =>
		Alert.alert('Usunąć wszystkie statystyki?', 'Operacja nieodwracalna.', [
			{ text: 'Anuluj', style: 'cancel' },
			{
				text: 'Usuń',
				style: 'destructive',
				onPress: () => {
					clearGames();
					setGames([]); // 🔄 natychmiastowe odświeżenie
				},
			},
		]);

	const played = games.length;
	const bestAvg = Math.max(...games.map(g => g.avg3), 0).toFixed(1);
	const allDarts = games.reduce((s, g) => s + g.darts, 0);
	const allAvg = played ? ((games.reduce((s, g) => s + g.scored, 0) / allDarts) * 3).toFixed(1) : '0.0';

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Stat label='Gier' value={played} />
				<Stat label='Naj. AVG' value={bestAvg} />
				<Stat label='AVG całość' value={allAvg} />

				{/* PRZYCISK KOSZA */}
				<Pressable style={styles.trash} onPress={handleClear}>
					<Text style={styles.trashTxt}>🗑</Text>
				</Pressable>
			</View>

			<FlatList
				data={games}
				keyExtractor={g => g.id.toString()}
				contentContainerStyle={{ paddingBottom: 80 }}
				renderItem={({ item }) => (
					<View style={styles.card}>
						<Text style={styles.avg}>{item.avg3.toFixed(1)}</Text>
						<View>
							<Text style={styles.date}>{item.date.slice(0, 10)}</Text>
							{/* checkout usuwamy → linia skasowana */}
						</View>
					</View>
				)}
			/>
		</View>
	);
}

function Stat({ label, value }: { label: string; value: any }) {
	return (
		<View style={{ alignItems: 'center' }}>
			<Text style={{ color: '#fff', fontSize: 22, fontWeight: '600' }}>{value}</Text>
			<Text style={{ color: '#888' }}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#121212', padding: 16 },
	header: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 16,
		paddingVertical: 8,
	},

	trash: {
		padding: 6,
		borderRadius: 6,
		backgroundColor: '#B00020',
	},
	trashTxt: { color: '#fff', fontSize: 16 },
	card: {
		flexDirection: 'row',
		gap: 12,
		backgroundColor: '#1E1E1E',
		borderRadius: 10,
		padding: 12,
		marginBottom: 10,
		alignItems: 'center',
	},
	avg: { fontSize: 26, color: '#8AB4F8', width: 70, textAlign: 'center' },
	date: { color: '#fff', fontSize: 14 },
});
