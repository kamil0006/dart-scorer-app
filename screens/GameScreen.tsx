// screens/GameScreen.tsx
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Dimensions, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import AdvancedThrowPad from '../components/AdvancedThrowPad';
import DartboardBase from '../components/DartboardBase';
import DartboardPicker from '../components/DartboardPicker';
import ManualInputModal from '../components/ManualInputModal';
import Numpad from '../components/Numpad';
import ScoreBoard from '../components/ScoreBoard';
import { getCheckout } from '../lib/checkout';
import { Dart, saveGame } from '../lib/db';
import { getAdvanced } from '../lib/settings';

const { width } = Dimensions.get('window');
const SIZE = width * 0.8; // 80% of screen width for board
const R = SIZE / 2;
const SEGMENTS = 20;
const ANG = (2 * Math.PI) / SEGMENTS;
const OFFSET = -ANG / 2;

export default function GameScreen({ route }: any): React.ReactElement {
	const { initialScore } = route.params as { initialScore: number };

	const [turns, setTurns] = useState<number[]>([]);
	const [hits, setHits] = useState<Dart[]>([]);
	const [gameHits, setGameHits] = useState<Dart[]>([]);
	const [advanced, setAdvanced] = useState<boolean>(false);
	const [modalVisible, setModalVisible] = useState<boolean>(false);
	const [editingSlot, setEditingSlot] = useState<number>(0);

	useFocusEffect(
		useCallback(() => {
			let active = true;
			getAdvanced().then(v => active && setAdvanced(v));
			return () => {
				active = false;
			};
		}, [])
	);

	const totalPoints = turns.reduce((s, t) => s + t, 0);
	const currentScore = initialScore - totalPoints;
	const average3d = turns.length ? totalPoints / turns.length : 0;

	const handleTurnEnd = (pts: number) => {
		if (pts < 0 || pts > 180) return;
		const next = currentScore - pts;
		if (next < 0 || next === 1) return;
		if (next === 0) {
			saveGame({
				start: initialScore,
				turns: [...turns, pts],
				hits: gameHits,
				checkout: getCheckout(currentScore)?.join(' '),
			});
			setTurns([]);
			setHits([]);
			setGameHits([]);
		} else {
			setTurns(prev => [...prev, pts]);
		}
	};

	const onThrow = (d: Dart) => {
		const newHits = [...hits, d];
		setHits(newHits);
		setGameHits(prev => [...prev, d]);
		if (newHits.length % 3 === 0) {
			const lastThree = newHits.slice(-3);
			const pts = lastThree.reduce((s, h) => s + h.bed * h.m, 0);
			handleTurnEnd(pts);
			setHits([]);
		}
	};

	const removeHit = () => {
		setHits(prev => prev.slice(0, -1));
		setGameHits(prev => prev.slice(0, -1));
	};

	// na górze pliku GameScreen.tsx, zaraz po deklaracji OFFSET, dodaj:
	const DART_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
	const rInnerBull = R * 0.05;
	const rOuterBull = R * 0.1;
	const rTripleInner = R * 0.45;
	const rTripleOuter = R * 0.55;
	const rDoubleInner = R * 0.85;
	const rDoubleOuter = R * 0.95;

	// zastąp swoją pętlę circles dokładnie tym:
	const circles = gameHits.map((h, idx) => {
		let cx = 0,
			cy = 0;
		if (h.bed === 50) {
			// Inner bull (50) always at center
			cx = 0;
			cy = 0;
		} else if (h.bed === 25) {
			// Outer bull (25) at midpoint of bull ring (12 o'clock)
			const rMap = (rOuterBull + rInnerBull) / 2;
			const angle = -Math.PI / 2;
			cx = rMap * Math.cos(angle);
			cy = rMap * Math.sin(angle);
		} else {
			const segIndex = DART_ORDER.indexOf(h.bed);
			const angle = segIndex * ANG - Math.PI / 2 + OFFSET + ANG / 2;
			let rMap = (rTripleOuter + rDoubleInner) / 2; // single
			if (h.m === 3) rMap = (rTripleInner + rTripleOuter) / 2;
			else if (h.m === 2) rMap = (rDoubleInner + rDoubleOuter) / 2;
			cx = rMap * Math.cos(angle);
			cy = rMap * Math.sin(angle);
		}
		return <Circle key={idx} cx={cx} cy={cy} r={6} fill='rgba(255,80,0,0.8)' />;
	});

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle='light-content' />
			<ScrollView contentContainerStyle={styles.scroll}>
				<ScoreBoard score={currentScore} average={average3d} checkout={getCheckout(currentScore)} />
				<View style={styles.history}>
					{turns.map((t, i) => (
						<View key={i} style={styles.tag}>
							<Text style={styles.tagTxt}>{t}</Text>
						</View>
					))}
					{advanced && (
						<Pressable style={styles.trashTurn} onPress={() => setTurns(ts => ts.slice(0, -1))}>
							<Text style={styles.trashTxt}>🗑</Text>
						</Pressable>
					)}
				</View>

				{!advanced ? (
					<View style={styles.numpadBox}>
						<Numpad onCommit={handleTurnEnd} onUndo={() => setTurns(ts => ts.slice(0, -1))} extended={false} />
					</View>
				) : (
					<>
						<View style={styles.slotsRow}>
							{Array.from({ length: 3 }).map((_, idx) => (
								<Pressable
									key={idx}
									style={styles.slot}
									onPress={() => {
										setEditingSlot(idx);
										setModalVisible(true);
									}}>
									<Text style={styles.slotTxt}>{hits[idx] ? `${hits[idx].m}×${hits[idx].bed}` : '-'}</Text>
								</Pressable>
							))}
							<Pressable style={styles.slotBtn} onPress={removeHit}>
								<Text style={styles.slotBtnTxt}>↩︎</Text>
							</Pressable>
						</View>
						<ManualInputModal
							visible={modalVisible}
							initial={hits[editingSlot]?.bed ?? null}
							onClose={() => setModalVisible(false)}
							onConfirm={pts => {
								onThrow({ bed: pts, m: 1 });
								setModalVisible(false);
							}}
						/>
						<AdvancedThrowPad onThrow={onThrow} onUndo={removeHit} />
						<View style={{ width: SIZE, height: SIZE, alignSelf: 'center' }}>
							<DartboardBase />
							<Svg style={StyleSheet.absoluteFill} width={SIZE} height={SIZE}>
								<G x={R} y={R}>
									{circles}
								</G>
							</Svg>
							<DartboardPicker onSelect={(b, m) => onThrow({ bed: b, m })} />
						</View>
					</>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#121212' },
	scroll: { padding: 16, gap: 16, paddingBottom: 80 },
	history: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingVertical: 12 },
	tag: { backgroundColor: '#333', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
	tagTxt: { color: '#fff', fontSize: 16 },
	trashTurn: { marginLeft: 8, padding: 6, borderRadius: 6, backgroundColor: '#B00020' },
	trashTxt: { color: '#fff', fontSize: 16 },
	numpadBox: { alignItems: 'center', justifyContent: 'center', width: '100%' },
	slotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 16 },
	slot: {
		width: 60,
		height: 40,
		backgroundColor: '#444',
		borderRadius: 6,
		justifyContent: 'center',
		alignItems: 'center',
	},
	slotTxt: { color: '#fff', fontSize: 16 },
	slotBtn: { alignSelf: 'center', padding: 6, backgroundColor: '#333', borderRadius: 6 },
	slotBtnTxt: { color: '#fff', fontSize: 18 },
	boardContainer: {
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: 16,
		width: '100%',
	},
});
