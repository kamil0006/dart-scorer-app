import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Dimensions, Modal, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import AdvancedThrowPad from '../components/AdvancedThrowPad';
import DartboardBase from '../components/DartboardBase';
import DartboardPicker from '../components/DartboardPicker';

import Numpad from '../components/Numpad';
import ScoreBoard from '../components/ScoreBoard';
import { getCheckout, validateCheckout } from '../lib/checkout';
import { Dart, saveGame } from '../lib/db';
import { useLanguage } from '../lib/LanguageContext';
import { getAdvanced } from '../lib/settings';

const { width } = Dimensions.get('window');
const SIZE = width * 0.8; // 80% of screen width for board
const R = SIZE / 2;
const SEGMENTS = 20;
const ANG = (2 * Math.PI) / SEGMENTS;
const OFFSET = -ANG / 2;

export default function GameScreen({ route }: any): React.ReactElement {
	const { initialScore } = route.params as { initialScore: number };
	const { strings } = useLanguage();

	const [turns, setTurns] = useState<number[]>([]);
	const [hits, setHits] = useState<Dart[]>([]);
	const [gameHits, setGameHits] = useState<Dart[]>([]);
	const [advanced, setAdvanced] = useState<boolean>(false);
	const [gameOver, setGameOver] = useState(false);

	const [turnHitCounts, setTurnHitCounts] = useState<number[]>([]);
	
	// Modal do wyboru liczby lotek w ostatniej turze przy checkoutie (tryb simple i advanced)
	const [showCheckoutDartsModal, setShowCheckoutDartsModal] = useState(false);
	const [pendingCheckoutData, setPendingCheckoutData] = useState<{
		start: number;
		turns: number[];
		hits: Dart[];
		checkout: string;
		isAdvanced: boolean;
		lastTurnHits?: Dart[]; // Tylko dla advanced - lotki z ostatniej tury
	} | null>(null);

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
		if (next < 0 || next === 1) return; // bust

		if (next === 0) {
			// Checkout - gra zakończona
			const checkoutStr = getCheckout(currentScore)?.join(' ') || '';
			
			if (advanced) {
				// W trybie advanced: waliduj checkout i pokaż modal jeśli potrzeba
				const checkoutPath = getCheckout(currentScore);
				if (checkoutPath) {
					// Sprawdź czy faktyczne rzuty pasują do checkoutu
					const isValidCheckout = validateCheckout(gameHits, checkoutPath);
					
					if (!isValidCheckout) {
						// Checkout nie jest poprawny - nie kończ gry, traktuj jak bust
						// Wyczyść tylko bieżące lotki tej tury
						setHits([]);
						return;
					}
					
					// Checkout jest poprawny - pokaż modal do wyboru liczby lotek (podobnie jak w simple)
					setPendingCheckoutData({
						start: initialScore,
						turns: [...turns, pts],
						hits: gameHits,
						checkout: checkoutStr,
						isAdvanced: true,
					});
					setShowCheckoutDartsModal(true);
				} else {
					// Brak checkoutu - zapisz od razu (nie powinno się zdarzyć przy next === 0)
					saveGame({
						start: initialScore,
						turns: [...turns, pts],
						hits: gameHits,
						checkout: checkoutStr,
					});
					setGameOver(true);
				}
			} else {
				// W trybie simple: pokaż modal do wyboru liczby lotek w ostatniej turze
				setPendingCheckoutData({
					start: initialScore,
					turns: [...turns, pts],
					hits: gameHits,
					checkout: checkoutStr,
					isAdvanced: false,
				});
				setShowCheckoutDartsModal(true);
			}
		} else {
			setTurns(prev => [...prev, pts]);
		}
	};
	
	// Funkcja do obliczenia minimalnej liczby lotek potrzebnej do checkoutu
	const getMinCheckoutDarts = (checkout: string): number => {
		if (!checkout) return 1;
		// Parsuj checkout string - liczba elementów to minimalna liczba lotek
		const checkoutParts = checkout.trim().split(/\s+/);
		return checkoutParts.length;
	};
	
	// Funkcja do zapisania gry z wybraną liczbą lotek w ostatniej turze
	const handleSaveWithCheckoutDarts = (checkoutDarts: number) => {
		if (!pendingCheckoutData) return;
		
		saveGame({
			start: pendingCheckoutData.start,
			turns: pendingCheckoutData.turns,
			hits: pendingCheckoutData.hits,
			checkout: pendingCheckoutData.checkout,
			checkoutDarts: pendingCheckoutData.isAdvanced ? undefined : checkoutDarts, // W advanced nie używamy checkoutDarts
		});
		
		// Wyczyść stan
		setShowCheckoutDartsModal(false);
		setPendingCheckoutData(null);
		setTurns([]);
		setHits([]);
		setGameHits([]);
		
		if (pendingCheckoutData.isAdvanced) {
			setGameOver(true); // W advanced pokaż przycisk 'Nowa Gra'
		}
	};

	const onThrow = (d: Dart) => {
		// 1) Zbuduj nową listę lotek tej tury
		if (advanced && gameOver) return;
		const nextHits = [...hits, d];
		const ptsSoFar = nextHits.reduce((s, h) => s + h.bed * h.m, 0);

		// 2) Natychmiastowe zakończenie, jeśli w advanced padnie dokładnie currentScore
		if (advanced && ptsSoFar === currentScore) {
			// Waliduj checkout - sprawdź czy faktyczne rzuty z tej tury pasują do checkoutu
			const checkoutPath = getCheckout(currentScore);
			if (!checkoutPath) {
				// Nie ma checkoutu dla tego wyniku - to nie powinno się zdarzyć, ale zabezpieczenie
				return;
			}
			
			// Sprawdź tylko lotki z tej tury (nextHits), nie wszystkie lotki z gry
			const isValidCheckout = validateCheckout(nextHits, checkoutPath);
			
			if (!isValidCheckout) {
				// Checkout nie jest poprawny - nie kończ gry, traktuj jak bust
				// Wyczyść tylko bieżące lotki tej tury
				setHits([]);
				return;
			}
			
			// Checkout jest poprawny - pokaż modal do potwierdzenia (podobnie jak w simple)
			setTurnHitCounts(tc => [...tc, nextHits.length]);
			
			// Zapisz wszystkie lotki z gry (dla bazy danych) oraz lotki z ostatniej tury (dla modala)
			const allHitsForSave = [...gameHits, d];
			
			setPendingCheckoutData({
				start: initialScore,
				turns: [...turns, ptsSoFar],
				hits: allHitsForSave, // Wszystkie lotki z gry dla zapisu do bazy
				checkout: checkoutPath.join(' '),
				isAdvanced: true,
				lastTurnHits: nextHits, // Tylko lotki z ostatniej tury dla modala (używane do wyświetlenia liczby)
			});
			setShowCheckoutDartsModal(true);
			// Wyczyść tylko bieżące lotki tej tury
			setHits([]);
			return;
		}

		// 3) Dodaj lotkę do stanu
		setHits(nextHits);
		setGameHits(prev => [...prev, d]);

		// 4) Zakończenie tury:
		//    - w prostym trybie od razu (po 1 lotce)
		//    - w advanced po 3 lotkach
		if (!advanced || nextHits.length === 3) {
			// zapisz liczbę lotek do turnHitCounts
			setTurnHitCounts(tc => [...tc, nextHits.length]);

			const pts = nextHits.reduce((s, h) => s + h.bed * h.m, 0);
			handleTurnEnd(pts);
			// czyścimy tylko bieżące lotki (gameHits już zawiera te 3)
			setHits([]);
		}
	};
	const freq = gameHits.reduce<Record<string, number>>((acc, h) => {
		const key = `${h.bed}x${h.m}`;
		acc[key] = (acc[key] || 0) + 1;
		return acc;
	}, {});

	function getColor(count: number) {
		if (count >= 20) return '#9400d3';
		if (count >= 15) return '#ff69b4';
		if (count >= 10) return '#F57C00';
		if (count >= 5) return '#FBC02D';
		return '#006400';
	}

	const removeHit = () => {
		setHits(prev => prev.slice(0, -1));
		setGameHits(prev => prev.slice(0, -1));
	};

	// Forfeit handler
	const handleForfeit = () => {
		saveGame({
			start: initialScore,
			turns,
			hits: gameHits,
			checkout: undefined, // Don't set checkout for forfeited games
			forfeited: true,
			forfeitScore: currentScore,
		});
		setTurns([]);
		setHits([]);
		setGameHits([]);
		setTurnHitCounts([]);
		setGameOver(false);
	};

	const DART_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
	const rInnerBull = R * 0.05;
	const rOuterBull = R * 0.1;
	const rTripleInner = R * 0.45;
	const rTripleOuter = R * 0.55;
	const rDoubleInner = R * 0.85;
	const rDoubleOuter = R * 0.95;

	const circles = gameHits.map((h, idx) => {
		if (h.bed === 0) {
			return null; // pomiń rysowanie
		}

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
		const key = `${h.bed}x${h.m}`;
		const color = getColor(freq[key] || 0);
		return <Circle key={idx} cx={cx} cy={cy} r={6} fill={color} />;
	});

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle='light-content' />
			<ScrollView contentContainerStyle={styles.scroll}>
				{/* Forfeit Game button, only show if game is in progress (not over, and there are turns or hits) */}
				{!gameOver && (turns.length > 0 || hits.length > 0) && (
					<Pressable style={styles.forfeitBtn} onPress={handleForfeit}>
						<MaterialIcons name='flag' size={20} color='#fff' style={{ marginRight: 6 }} />
						<Text style={styles.forfeitTxt}>{strings.forfeit}</Text>
					</Pressable>
				)}
				{advanced && gameOver ? (
					<Pressable
						style={styles.newGameBtn}
						onPress={() => {
							setTurns([]);
							setHits([]);
							setGameHits([]);
							setTurnHitCounts([]);
							setGameOver(false);
						}}>
						<Text style={styles.newGameTxt}>{strings.newGameButton}</Text>
					</Pressable>
				) : (
					<ScoreBoard score={currentScore} average={average3d} checkout={getCheckout(currentScore)} />
				)}
				<View style={styles.history}>
					{turns.map((t, i) => (
						<View key={i} style={styles.tag}>
							<Text style={styles.tagTxt}>{t}</Text>
						</View>
					))}
					{advanced && (
						<Pressable
							style={styles.trashTurn}
							onPress={() => {
								setTurns(ts => ts.slice(0, -1));

								setTurnHitCounts(counts => {
									const lastCount = counts[counts.length - 1] ?? 0;
									// 1) odetnijmy ostatni wpis z turnHitCounts
									const newCounts = counts.slice(0, -1);
									// 2) odetnijmy z gameHits tyle elementów, ile było lotek
									setGameHits(h => h.slice(0, -lastCount));
									return newCounts;
								});
							}}>
							<MaterialIcons name='delete-outline' size={24} color='#fff' />
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
								<View key={idx} style={styles.slot}>
									<Text style={styles.slotTxt}>{hits[idx] ? `${hits[idx].m}×${hits[idx].bed}` : '-'}</Text>
								</View>
							))}
							<Pressable style={styles.slotBtn} onPress={removeHit}>
								<MaterialIcons name='undo' size={20} color='#fff' />
							</Pressable>
						</View>

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
						<View style={styles.legend}>
							<Text style={styles.legendTitle}>{strings.legendTitle}:</Text>
							<View style={styles.legendItems}>
								<LegendItem color='#006400' label={strings.legend1Hit} />
								<LegendItem color='#FBC02D' label={strings.legend5Hits} />
								<LegendItem color='#F57C00' label={strings.legend10Hits} />
								<LegendItem color='#ff69b4' label={strings.legend15Hits} />
								<LegendItem color='#9400d3' label={strings.legend20PlusHits} />
							</View>
						</View>
					</>
				)}
			</ScrollView>
			
			{/* Modal do wyboru liczby lotek w ostatniej turze przy checkoutie (tryb simple) */}
			<Modal
				visible={showCheckoutDartsModal}
				transparent={true}
				animationType='fade'
				onRequestClose={() => setShowCheckoutDartsModal(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>{strings.checkoutDartsQuestion}</Text>
						<Text style={styles.modalMessage}>
							{strings.checkout}: {pendingCheckoutData?.checkout || ''}
						</Text>
						<View style={styles.dartsButtons}>
							{(() => {
								// W trybie advanced pokazuj tylko faktyczną liczbę lotek użytych w ostatniej turze
								if (pendingCheckoutData?.isAdvanced) {
									// Użyj lastTurnHits jeśli dostępne, w przeciwnym razie użyj hits (fallback)
									const lastTurnHits = pendingCheckoutData.lastTurnHits || [];
									const actualDarts = lastTurnHits.length > 0 ? lastTurnHits.length : pendingCheckoutData.hits.length;
									return (
										<Pressable
											style={styles.dartsButton}
											onPress={() => handleSaveWithCheckoutDarts(actualDarts)}>
											<Text style={styles.dartsButtonText}>{actualDarts}</Text>
										</Pressable>
									);
								}
								
								// W trybie simple pokazuj opcje filtrowane przez minimalną liczbę lotek
								return [1, 2, 3]
									.filter(darts => {
										// Filtruj tylko możliwe opcje - nie mniej niż minimalna liczba lotek z checkoutu
										const minDarts = pendingCheckoutData?.checkout 
											? getMinCheckoutDarts(pendingCheckoutData.checkout) 
											: 1;
										return darts >= minDarts;
									})
									.map(darts => (
										<Pressable
											key={darts}
											style={styles.dartsButton}
											onPress={() => handleSaveWithCheckoutDarts(darts)}>
											<Text style={styles.dartsButtonText}>{darts}</Text>
										</Pressable>
									));
							})()}
						</View>
						<Pressable
							style={styles.modalCancelButton}
							onPress={() => setShowCheckoutDartsModal(false)}>
							<Text style={styles.modalCancelButtonText}>{strings.cancel}</Text>
						</Pressable>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

function LegendItem({ color, label }: { color: string; label: string }) {
	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, paddingBottom: 8 }}>
			<View style={{ width: 16, height: 16, backgroundColor: color, borderRadius: 4, marginRight: 4 }} />
			<Text style={{ color: '#fff', fontSize: 12 }}>{label}</Text>
		</View>
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
	legend: {
		marginTop: 16,
		padding: 8,
		backgroundColor: '#222',
		borderRadius: 8,
	},
	legendTitle: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 4,
		textAlign: 'center',
	},
	legendItems: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
	},
	newGameBtn: {
		marginTop: 16,
		paddingVertical: 12,
		paddingHorizontal: 24,
		backgroundColor: '#60D394',
		borderRadius: 8,
		alignSelf: 'center',
	},
	newGameTxt: {
		color: '#000',
		fontSize: 16,
		fontWeight: '600',
	},
	forfeitBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'center',
		backgroundColor: '#B00020',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
		marginBottom: 8,
	},
	forfeitTxt: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '600',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: '#1E1E1E',
		borderRadius: 16,
		padding: 24,
		width: '80%',
		maxWidth: 400,
	},
	modalTitle: {
		color: '#fff',
		fontSize: 20,
		fontWeight: '600',
		marginBottom: 12,
		textAlign: 'center',
	},
	modalMessage: {
		color: '#aaa',
		fontSize: 14,
		marginBottom: 20,
		textAlign: 'center',
	},
	dartsButtons: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 16,
		gap: 12,
	},
	dartsButton: {
		flex: 1,
		backgroundColor: '#8AB4F8',
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignItems: 'center',
	},
	dartsButtonText: {
		color: '#000',
		fontSize: 16,
		fontWeight: '600',
	},
	modalCancelButton: {
		marginTop: 8,
		paddingVertical: 12,
		alignItems: 'center',
	},
	modalCancelButtonText: {
		color: '#aaa',
		fontSize: 14,
	},
});
