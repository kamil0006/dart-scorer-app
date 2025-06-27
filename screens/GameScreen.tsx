import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

import Numpad from '../components/Numpad';
import ScoreBoard from '../components/ScoreBoard';
import { getCheckout } from '../lib/checkout';
import { saveGame } from '../lib/db';

// Jeśli masz zdefiniowany typ stosu nawigacji – odkomentuj poniższe

/**
 * Minimalna (bez typów) wersja, jeżeli nie używasz jeszcze TS z React‑Navigation.
 * Odbieramy param "initialScore" przekazany z NewGameScreen, dzięki czemu
 * obsłużymy zarówno wariant 501 jak i 301 (lub inne w przyszłości).
 */
export default function GameScreen({ route }: any) {
	const { initialScore } = route.params as { initialScore: number };

	/* ---------------------------- stan i statystyki --------------------------- */
	const [turns, setTurns] = useState<number[]>([]);

	const totalPoints = useMemo(() => turns.reduce((s, t) => s + t, 0), [turns]);
	const currentScore = initialScore - totalPoints;
	const average3d = turns.length ? totalPoints / turns.length : 0;

	/* --------------------------- logika dodawania rundy ----------------------- */
	const addTurn = useCallback(
		(pts: number) => {
			if (pts < 0 || pts > 180) return; // walidacja kalkulatora

			const next = currentScore - pts;
			if (next < 0 || next === 1) return; // bust (przekroczenie lub 1)

			if (next === 0) {
				// ✔️ leg ukończony → zapis do DB
				const co = getCheckout(currentScore);
				try {
					saveGame({
						start: initialScore,
						turns: [...turns, pts],
						checkout: co?.join(' '),
					});
				} catch (e) {
					console.warn(e);
				}
				setTurns([]); // reset na nowego lega
			} else {
				setTurns(prev => [...prev, pts]);
			}
		},
		[currentScore, initialScore, turns]
	);

	const undo = () => setTurns(p => p.slice(0, -1));

	/* --------------------------------- UI ----------------------------------- */
	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle='light-content' />

			<ScoreBoard score={currentScore} average={average3d} checkout={getCheckout(currentScore)} />

			{/* ----------- historia tur w siatce wrap ----------- */}
			<View style={styles.history}>
				{turns.map((t, i) => (
					<Pressable key={i} style={styles.tag} onPress={undo}>
						<Text style={styles.tagTxt}>{t}</Text>
					</Pressable>
				))}
			</View>

			<Numpad onCommit={addTurn} onUndo={undo} />
		</SafeAreaView>
	);
}

/* -------------------------------- style ---------------------------------- */
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
		paddingHorizontal: 16,
		justifyContent: 'space-between',
	},
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
	tagTxt: {
		color: '#fff',
		fontSize: 16,
	},
});
