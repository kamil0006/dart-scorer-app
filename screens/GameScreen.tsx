import React, { useState } from 'react';
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Numpad from '../components/Numpad';
import ScoreBoard from '../components/ScoreBoard';
import { getCheckout } from '../lib/checkout';
import { saveGame } from '../lib/db';

const START = 501;

export default function GameScreen() {
	const [turns, setTurns] = useState<number[]>([]);

	/* ----------------------------- wynik + średnia ---------------------------- */
	const totalPoints = turns.reduce((s, t) => s + t, 0);
	const score = START - totalPoints;
	const average3d = turns.length ? totalPoints / turns.length : 0;

	/* ----------------------------- logika tury -------------------------------- */
	const addTurn = (pts: number) => {
		if (pts < 0 || pts > 180) return; // walidacja kalkulatora
		const next = score - pts;
		if (next < 0 || next === 1) return; // bust
		if (next === 0) {
			// ✔️ leg skończony → zapisz do DB
			const co = getCheckout(score);
			try {
				saveGame({ start: START, turns: [...turns, pts], checkout: co?.join(' ') });
			} catch (e) {
				console.warn(e);
			}
			setTurns([]); // reset do nowego lega
		} else {
			setTurns(prev => [...prev, pts]);
		}
	};
	const undo = () => setTurns(p => p.slice(0, -1));

	/* --------------------------------- UI ------------------------------------ */
	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle='light-content' />
			<ScoreBoard score={score} average={average3d} checkout={getCheckout(score)} />

			{/* -----------  historia tur w siatce wrap  ---------- */}
			<View style={styles.history}>
				{turns.map((t, i) => (
					<Pressable key={i} style={styles.tag}>
						<Text style={styles.tagTxt}>{t}</Text>
					</Pressable>
				))}
			</View>

			<Numpad onCommit={addTurn} onUndo={undo} />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
		paddingHorizontal: 16,
		justifyContent: 'space-between',
	},

	/* --- nowy wrap: rzędy po max 5 tagów --- */
	history: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		paddingVertical: 12,
		justifyContent: 'center',
	},
	tag: {
		backgroundColor: '#333',
		borderRadius: 8,
		paddingVertical: 6,
		paddingHorizontal: 12,
	},
	tagTxt: { color: '#fff', fontSize: 16 },
});
