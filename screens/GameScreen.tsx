import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import AdvancedThrowPad from '../components/AdvancedThrowPad';
import DartboardPicker from '../components/DartboardPicker';
import Numpad from '../components/Numpad';
import ScoreBoard from '../components/ScoreBoard';
import { getCheckout } from '../lib/checkout';
import { Dart, fetchGames, saveGame } from '../lib/db';
import { getAdvanced } from '../lib/settings';

export default function GameScreen({ route }: any) {
	const { initialScore } = route.params as { initialScore: number };

	/* ------------------------- state ------------------------- */
	const [turns, setTurns] = useState<number[]>([]);
	const [hits, setHits] = useState<Dart[]>([]);
	const [advanced, setAdvanced] = useState<boolean>(false);

	useFocusEffect(
		useCallback(() => {
			let active = true;
			getAdvanced().then(v => {
				if (active) setAdvanced(v);
			});
			return () => {
				active = false;
			};
		}, [])
	);

	/* -------------------- calculations ----------------------- */
	const totalPoints = useMemo(() => turns.reduce((s, t) => s + t, 0), [turns]);
	const currentScore = initialScore - totalPoints;
	const average3d = turns.length ? totalPoints / turns.length : 0;

	/* ------------------- throw logic ------------------------- */
	const addThrow = (bed: number, m: 1 | 2 | 3) => {
		const nextHits = [...hits, { bed, m }];
		setHits(nextHits);
		if (nextHits.length === 3) {
			const pts = nextHits.reduce((s, h) => s + h.bed * h.m, 0);
			addTurn(pts);
			setHits([]);
		}
	};

	const addTurn = (pts: number) => {
		if (pts < 0 || pts > 180) return;
		const next = currentScore - pts;
		if (next < 0 || next === 1) return;

		if (next === 0) {
			try {
				saveGame({
					start: initialScore,
					turns: [...turns, pts],
					hits: advanced ? hits : [],
					checkout: getCheckout(currentScore)?.join(' '),
				});
				console.log('🔍 ALL GAMES IN DB:', fetchGames());
			} catch (e) {
				console.warn('DB error:', e);
			}
			setTurns([]);
			setHits([]);
		} else {
			setTurns(prev => [...prev, pts]);
		}
	};

	/* ---------------------- undo hit ------------------------ */
	const removeHit = (idx: number) => {
		setHits(h => h.filter((_, i) => i !== idx));
	};

	/* -------------------------- UI --------------------------- */
	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle='light-content' />
			<ScrollView contentContainerStyle={styles.scroll}>
				{/* --- 1) Score + AVG --- */}
				<ScoreBoard score={currentScore} average={average3d} checkout={getCheckout(currentScore)} />

				{/* --- 2) Tagi tur (zwykłe, bez tapowania) --- */}
				<View style={styles.history}>
					{turns.map((t, i) => (
						<View key={i} style={styles.tag}>
							<Text style={styles.tagTxt}>{t}</Text>
						</View>
					))}
					{/* kosz – usuń ostatnią turę */}
					{advanced && (
						<Pressable style={styles.trashTurn} onPress={() => setTurns(ts => ts.slice(0, -1))}>
							<Text style={styles.trashTxt}>🗑</Text>
						</Pressable>
					)}
				</View>

				{/* --- 3) Sloty bieżących lotek --- */}
				{advanced && (
					<View style={styles.slotsRow}>
						{Array.from({ length: 3 }).map((_, idx) => (
							<View key={idx} style={styles.slot}>
								<Text style={styles.slotTxt}>{hits[idx] ? `${hits[idx].m}×${hits[idx].bed}` : '-'}</Text>
							</View>
						))}
						{/* undo hit */}
						<Pressable style={styles.slotBtn} onPress={() => setHits(h => h.slice(0, -1))}>
							<Text style={styles.slotBtnTxt}>↩︎</Text>
						</Pressable>
					</View>
				)}

				{/* NumPad or AdvancedThrowPad */}
				{!advanced ? (
					<View style={styles.numpadBox}>
						<Numpad onCommit={pts => addTurn(pts)} onUndo={() => setTurns(t => t.slice(0, -1))} extended={false} />
					</View>
				) : (
					<AdvancedThrowPad onThrow={d => addThrow(d.bed, d.m)} onUndo={() => setHits(h => h.slice(0, -1))} />
				)}

				{/* Dartboard for advanced after scroll */}
				{advanced && (
					<View style={styles.tarczaBox}>
						<DartboardPicker onSelect={addThrow} />
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

/* ------------------------ style -------------------------- */
const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#121212' },
	scroll: { padding: 16, gap: 16, paddingBottom: 80 },
	history: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingVertical: 12 },
	tag: { backgroundColor: '#333', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
	hitTag: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#444',
		borderRadius: 8,
		paddingVertical: 6,
		paddingHorizontal: 8,
	},
	trashTurn: {
		marginLeft: 8,
		padding: 6,
		borderRadius: 6,
		backgroundColor: '#B00020',
	},
	slotsRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 8,
		marginBottom: 16,
	},
	trashTxt: { color: '#fff', fontSize: 16 },
	slot: {
		width: 60,
		height: 40,
		backgroundColor: '#444',
		borderRadius: 6,
		justifyContent: 'center',
		alignItems: 'center',
	},
	slotTxt: { color: '#fff', fontSize: 16 },
	slotBtn: {
		padding: 6,
		backgroundColor: '#333',
		borderRadius: 6,
	},
	slotBtnTxt: { color: '#fff', fontSize: 18 },
	tagTxt: { color: '#fff', fontSize: 16 },
	tagIcon: { marginLeft: 4, padding: 2 },
	numpadBox: { alignItems: 'center', justifyContent: 'center', width: '100%' },
	tarczaBox: { alignItems: 'center', marginTop: 120 },
});
