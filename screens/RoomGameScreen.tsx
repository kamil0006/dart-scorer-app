import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AdvancedThrowPad from '../components/AdvancedThrowPad';
import CheckoutDartsModal from '../components/game/CheckoutDartsModal';
import ConfirmModal from '../components/common/ConfirmModal';
import CurrentTurnSlots from '../components/game/CurrentTurnSlots';
import DartboardHeatmap from '../components/game/DartboardHeatmap';
import Numpad from '../components/Numpad';
import ScoreBoard from '../components/ScoreBoard';
import TurnHistory from '../components/game/TurnHistory';
import { getCheckout } from '../lib/checkout';
import { Dart, saveGame } from '../lib/db';
import { useLanguage } from '../lib/LanguageContext';
import { getAdvanced } from '../lib/settings';
import type { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type RoomPlayer = {
	id: string;
	name: string;
	seat: number;
	remaining: number;
	setsWon: number;
	legsWon: number;
	matchLegsWon: number;
	turns: number[];
	legAverage3d: number | null;
	matchAverage3d: number | null;
};

type RoomState = {
	code: string;
	status: 'waiting' | 'ready' | 'playing' | 'bust' | 'legWon' | 'setWon' | 'matchWon';
	startScore: number;
	setsTarget: number;
	legsTarget: number;
	currentSet: number;
	currentLeg: number;
	turnNumber: number;
	activePlayerIndex: number;
	players: RoomPlayer[];
	canUndo: boolean;
};

type PendingCheckoutSave = {
	startScore: number;
	allTurns: number[];
	checkoutStr: string | undefined;
	hits: Dart[];
};

type Props = StackScreenProps<RootStackParamList, 'RoomGame'>;

const LEG_END = new Set(['legWon', 'setWon', 'matchWon']);

export default function RoomGameScreen({ navigation, route }: Props) {
	const { roomCode, playerId, playerName, serverUrl, seat } = route.params;
	const { height } = useWindowDimensions();
	const compact = height < 680;
	const { strings } = useLanguage();

	const [room, setRoom] = useState<RoomState | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [flash, setFlash] = useState<{ text: string; icon: keyof typeof MaterialIcons.glyphMap; color: string } | null>(null);
	const [showLeaveModal, setShowLeaveModal] = useState(false);
	const [legTurns, setLegTurns] = useState<number[]>([]);
	const [showCheckoutModal, setShowCheckoutModal] = useState(false);
	const [pendingCheckoutSave, setPendingCheckoutSave] = useState<PendingCheckoutSave | null>(null);
	const [advanced, setAdvanced] = useState(false);
	const [currentTurnDarts, setCurrentTurnDarts] = useState<Dart[]>([]);
	const [legHits, setLegHits] = useState<Dart[]>([]);
	const [pendingScore, setPendingScore] = useState<number | null>(null);

	const cancelledRef = useRef(false);
	const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const prevStatusRef = useRef<string>('');
	const legTurnsRef = useRef<number[]>([]);
	const legHitsRef = useRef<Dart[]>([]);
	const prevTurnsLenRef = useRef(0);
	const prevMyMatchLegsRef = useRef(0);

	useEffect(() => {
		getAdvanced().then(setAdvanced);
	}, []);

	const updateLegTurns = (turns: number[]) => {
		legTurnsRef.current = turns;
		setLegTurns(turns);
	};

	const applyRoom = useCallback(
		(data: RoomState) => {
			const myPlayer = data.players[seat];
			const prevStatus = prevStatusRef.current;
			const status = data.status;

			const isLegEnd = LEG_END.has(status) && !LEG_END.has(prevStatus);
			// Computed before prevMyMatchLegsRef is updated, used for flash message below
			let iWonThisLeg = false;

			if (!isLegEnd) {
				// Only update turn tracking when NOT at leg end.
				// At leg end the server resets turns to [], which would falsely trigger undo detection.
				const myTurns = myPlayer?.turns ?? [];
				if (myTurns.length > prevTurnsLenRef.current) {
					const added = myTurns.slice(prevTurnsLenRef.current);
					updateLegTurns([...legTurnsRef.current, ...added]);
					prevTurnsLenRef.current = myTurns.length;
				} else if (myTurns.length < prevTurnsLenRef.current) {
					const removedCount = prevTurnsLenRef.current - myTurns.length;
					updateLegTurns(legTurnsRef.current.slice(0, -removedCount));
					// Also trim advanced-mode hit darts (3 per undone turn)
					legHitsRef.current = legHitsRef.current.slice(0, -(removedCount * 3));
					setLegHits(legHitsRef.current.slice());
					prevTurnsLenRef.current = myTurns.length;
				}

				// After a bust, server switches activePlayerIndex to the OTHER player.
			// So if it's no longer my turn and status just became bust, I'm the one who busted.
			if (status === 'bust' && prevStatus !== 'bust' && data.activePlayerIndex !== seat) {
				updateLegTurns([...legTurnsRef.current, 0]);
			}
		}

		if (isLegEnd) {
				const myMatchLegs = myPlayer?.matchLegsWon ?? 0;
				const iWon = myMatchLegs > prevMyMatchLegsRef.current;
				iWonThisLeg = iWon;

				if (iWon) {
					// Infer winning score and ask how many darts were used
					const existingTurns = [...legTurnsRef.current];
					const existingScored = existingTurns.reduce((s, t) => s + t, 0);
					const winningScore = data.startScore - existingScored;
					const checkoutPath = getCheckout(winningScore > 0 ? winningScore : 0);
					const allTurns = winningScore > 0 ? [...existingTurns, winningScore] : existingTurns;
					// Snapshot hits now; legHitsRef will be cleared below
					setPendingCheckoutSave({
						startScore: data.startScore,
						allTurns,
						checkoutStr: checkoutPath ? checkoutPath.join(' ') : undefined,
						hits: [...legHitsRef.current],
					});
					setShowCheckoutModal(true);
				} else {
					const turns = legTurnsRef.current;
					if (turns.length > 0) {
						const scored = turns.reduce((s, t) => s + t, 0);
						saveGame({
							start: data.startScore,
							turns,
							hits: [...legHitsRef.current],
							forfeited: true,
							forfeitScore: Math.max(0, data.startScore - scored),
						});
					}
				}

				prevMyMatchLegsRef.current = myMatchLegs;
				updateLegTurns([]);
				legHitsRef.current = [];
				setLegHits([]);
				prevTurnsLenRef.current = 0;
			}

			setRoom(data);

			if (status !== prevStatus) {
				prevStatusRef.current = status;
				// Only show bust flash to the player who actually busted
				if (status === 'bust' && prevStatus !== 'bust' && data.activePlayerIndex !== seat) {
					showFlash(strings.mpBustFlash, 'whatshot', '#ff6b6b');
				} else if (status === 'legWon') {
					showFlash(
						iWonThisLeg ? strings.mpLegWon : strings.mpLegLost,
						iWonThisLeg ? 'emoji-events' : 'sentiment-dissatisfied',
						iWonThisLeg ? '#60D394' : '#ff6b6b',
					);
				} else if (status === 'setWon') {
					showFlash(
						iWonThisLeg ? strings.mpSetWon : strings.mpSetLost,
						iWonThisLeg ? 'workspace-premium' : 'sentiment-dissatisfied',
						iWonThisLeg ? '#FFD700' : '#ff6b6b',
					);
				}
			}
		},
		[seat]
	);

	const showFlash = (text: string, icon: keyof typeof MaterialIcons.glyphMap, color: string) => {
		setFlash({ text, icon, color });
		setTimeout(() => setFlash(null), 3000);
	};

	const poll = useCallback(async () => {
		if (cancelledRef.current) return;
		try {
			const r = await fetch(`${serverUrl}/api/rooms/${roomCode}`);
			if (r.ok && !cancelledRef.current) applyRoom(await r.json());
		} catch {}
		if (!cancelledRef.current) pollingRef.current = setTimeout(poll, 1200);
	}, [serverUrl, roomCode, applyRoom]);

	useEffect(() => {
		poll();
		return () => {
			cancelledRef.current = true;
			if (pollingRef.current) clearTimeout(pollingRef.current);
		};
	}, []);

	// Use useFocusEffect so BackHandler is only active when this screen is focused.
	// Without this, the handler fires even when navigated back to NewGame
	// (screen stays mounted in the stack) and then the user opens the Stats tab.
	useFocusEffect(
		useCallback(() => {
			const sub = BackHandler.addEventListener('hardwareBackPress', () => {
				if (room?.status === 'matchWon') {
					doLeave();
					return true;
				}
				setShowLeaveModal(true);
				return true;
			});
			return () => sub.remove();
		}, [room])
	);

	const resetDisplay = () => {
		fetch(`${serverUrl}/api/reset`, { method: 'POST' }).catch(() => {});
	};

const doLeave = () => {
		cancelledRef.current = true;
		resetDisplay();
		navigation.navigate('NewGame');
	};

	const handleLeaveConfirm = () => {
		if (room && !LEG_END.has(room.status)) {
			const turns = legTurnsRef.current;
			if (turns.length > 0) {
				const scored = turns.reduce((s, t) => s + t, 0);
				saveGame({
					start: room.startScore,
					turns,
					hits: [...legHitsRef.current],
					forfeited: true,
					forfeitScore: Math.max(0, room.startScore - scored),
				});
			}
		}
		setShowLeaveModal(false);
		doLeave();
	};

	const handleCheckoutSave = (darts: number) => {
		if (pendingCheckoutSave) {
			saveGame({
				start: pendingCheckoutSave.startScore,
				turns: pendingCheckoutSave.allTurns,
				hits: pendingCheckoutSave.hits,
				checkout: pendingCheckoutSave.checkoutStr,
				checkoutDarts: darts,
			});
		}
		setPendingCheckoutSave(null);
		setShowCheckoutModal(false);
	};

	const handleCheckoutClose = () => {
		if (pendingCheckoutSave) {
			saveGame({
				start: pendingCheckoutSave.startScore,
				turns: pendingCheckoutSave.allTurns,
				hits: pendingCheckoutSave.hits,
				checkout: pendingCheckoutSave.checkoutStr,
			});
		}
		setPendingCheckoutSave(null);
		setShowCheckoutModal(false);
	};

	const handleScore = async (score: number) => {
		if (submitting || room?.activePlayerIndex !== seat) return;
		setSubmitting(true);
		try {
			const r = await fetch(`${serverUrl}/api/rooms/${roomCode}/turn`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playerId, score }),
			});
			if (r.ok) applyRoom(await r.json());
		} catch {}
		finally {
			setSubmitting(false);
		}
	};

	// Advanced mode: accumulate individual darts; show confirm card after 3
	const handleDartThrow = (dart: Dart) => {
		if (room?.activePlayerIndex !== seat || submitting || pendingScore !== null) return;
		const newDarts = [...currentTurnDarts, dart];
		setCurrentTurnDarts(newDarts);
		if (newDarts.length === 3) {
			setPendingScore(newDarts.reduce((s, d) => s + d.bed * d.m, 0));
		}
	};

	const handleConfirmScore = async () => {
		if (pendingScore === null) return;
		if (advanced) {
			legHitsRef.current = [...legHitsRef.current, ...currentTurnDarts];
			setLegHits(legHitsRef.current.slice());
			setCurrentTurnDarts([]);
		}
		const score = pendingScore;
		setPendingScore(null);
		await handleScore(score);
	};

	const handleEditScore = () => {
		if (advanced) {
			setCurrentTurnDarts(prev => prev.slice(0, -1));
		}
		setPendingScore(null);
	};

	const handleUndoCurrentTurn = () => {
		if (pendingScore !== null) {
			handleEditScore();
			return;
		}
		if (currentTurnDarts.length > 0) {
			setCurrentTurnDarts(prev => prev.slice(0, -1));
		} else {
			handleUndo();
		}
	};

	const handleUndo = async () => {
		if (!room?.canUndo) return;
		try {
			const r = await fetch(`${serverUrl}/api/rooms/${roomCode}/undo`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playerId }),
			});
			if (r.ok) applyRoom(await r.json());
		} catch {}
	};

	if (!room) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.centered}>
					<MaterialIcons name='wifi' size={40} color='#333' />
					<Text style={styles.connectingText}>{strings.mpConnecting}</Text>
				</View>
			</SafeAreaView>
		);
	}

	const myPlayer = room.players[seat];
	const oppPlayer = room.players[1 - seat];
	const isMyTurn = room.activePlayerIndex === seat;
	const isWaiting = room.status === 'waiting' || room.status === 'ready';
	const checkout = myPlayer ? getCheckout(myPlayer.remaining) ?? undefined : undefined;

	if (room.status === 'matchWon') {
		const winnerIdx = room.players.reduce(
			(best, p, i) => ((p.setsWon ?? 0) > (room.players[best]?.setsWon ?? -1) ? i : best),
			0
		);
		const winner = room.players[winnerIdx];
		const iWon = winner?.id === playerId;

		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.matchEnd}>
					<Text style={styles.matchEndLabel}>{strings.mpMatchOver}</Text>
					<Text style={[styles.matchEndWinner, iWon && styles.matchEndWinnerMe]}>{winner?.name}</Text>
					<Text style={styles.matchEndSub}>{strings.mpWins}</Text>

					<View style={styles.matchEndStats}>
						{room.players.map(p => (
							<View key={p.id} style={[styles.matchEndPlayer, p.id === winner?.id && styles.matchEndPlayerWinner]}>
								<Text style={styles.matchEndPlayerName} numberOfLines={1}>{p.name}</Text>
								<View style={styles.matchEndRow}>
									<StatCell label={strings.mpSets} value={String(p.setsWon)} />
									<StatCell label={strings.mpLegs} value={String(p.matchLegsWon)} />
									<StatCell label={strings.mpAverage} value={(p.matchAverage3d ?? 0).toFixed(1)} />
								</View>
							</View>
						))}
					</View>

					<Pressable style={styles.homeBtn} onPress={doLeave}>
						<MaterialIcons name='home' size={20} color='#101113' />
						<Text style={styles.homeBtnText}>{strings.mpToMenu}</Text>
					</Pressable>
				</View>

				<CheckoutDartsModal
					visible={showCheckoutModal}
					checkout={pendingCheckoutSave?.checkoutStr}
					onSave={handleCheckoutSave}
					onClose={handleCheckoutClose}
				/>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={[styles.header, compact && styles.headerCompact]}>
				<Pressable style={styles.exitBtn} onPress={() => setShowLeaveModal(true)}>
					<MaterialIcons name='exit-to-app' size={20} color='#8AB4F8' />
				</Pressable>
				<View style={styles.headerMid}>
					<Text style={styles.headerCode}>{roomCode}</Text>
					<Text style={styles.headerMeta}>
						{strings.matchLegs} {room.currentLeg} · {strings.matchSets} {room.currentSet}/{room.setsTarget}
						{advanced ? `  ·  ${strings.mpAdvShort}` : ''}
					</Text>
				</View>
				{oppPlayer && (
					<View style={[styles.oppPanel, !isMyTurn && styles.oppPanelActive]}>
						<Text style={styles.oppName} numberOfLines={1}>{oppPlayer.name}</Text>
						<Text style={[styles.oppScore, !isMyTurn && styles.oppScoreActive]}>{oppPlayer.remaining}</Text>
						<Text style={styles.oppMeta}>S:{oppPlayer.setsWon} L:{oppPlayer.legsWon}</Text>
					</View>
				)}
			</View>

			<ScrollView
				contentContainerStyle={[styles.scroll, compact && styles.scrollCompact]}
				showsVerticalScrollIndicator={false}>

				{flash && (
					<View style={[styles.flashBanner, { borderColor: flash.color, backgroundColor: flash.color + '18' }]}>
						<MaterialIcons name={flash.icon} size={20} color={flash.color} />
						<Text style={[styles.flashBannerText, { color: flash.color }]}>{flash.text}</Text>
					</View>
				)}

				{isWaiting && (
					<View style={styles.waitingView}>
						<MaterialIcons name='hourglass-empty' size={40} color='#444' />
						<Text style={styles.waitingText}>
							{room.status === 'waiting' ? strings.mpWaitingForOpponent : strings.mpWaitingForHost}
						</Text>
					</View>
				)}

				{!isWaiting && (
					<>
						<ScoreBoard
							score={myPlayer?.remaining ?? room.startScore}
							average={myPlayer?.legAverage3d ?? 0}
							checkout={checkout}
							compact={compact}
						/>

						<TurnHistory
							turns={legTurns}
							canUndoTurn={false}
							onUndoTurn={() => {}}
							compact={compact}
							horizontalScroll={false}
						/>

						{isMyTurn ? (
							<View style={styles.numpadBox}>
								{pendingScore !== null ? (
									<ScoreConfirmCard
										score={pendingScore}
										remaining={(myPlayer?.remaining ?? room.startScore) - pendingScore}
										darts={advanced ? currentTurnDarts : undefined}
										submitting={submitting}
										confirmLabel={strings.mpConfirmScore}
										editLabel={strings.mpEditScore}
										titleLabel={strings.mpYourScore}
										remainingLabel={strings.remaining}
										bustLabel={strings.mpBustWarning}
										onConfirm={handleConfirmScore}
										onEdit={handleEditScore}
									/>
								) : advanced ? (
									<>
										<CurrentTurnSlots
											hits={currentTurnDarts}
											onUndo={handleUndoCurrentTurn}
										/>
										<AdvancedThrowPad
											onThrow={handleDartThrow}
											onUndo={handleUndoCurrentTurn}
										/>
										<DartboardHeatmap
											hits={legHits}
											onThrow={handleDartThrow}
										/>
									</>
								) : (
									<Numpad
										onCommit={submitting ? undefined : setPendingScore}
										onUndo={handleUndo}
										compact={compact}
									/>
								)}
							</View>
						) : (
							<View style={styles.opponentTurn}>
								<MaterialIcons name='access-time' size={44} color='#333' />
								<Text style={styles.opponentTurnTitle}>{strings.mpPlayersTurn}</Text>
								<Text style={styles.opponentTurnName}>{oppPlayer?.name}</Text>
							</View>
						)}
					</>
				)}
			</ScrollView>

			<ConfirmModal
				visible={showLeaveModal}
				title={strings.mpLeaveGame}
				message={strings.mpLeaveGameMessage}
				cancelText={strings.mpStay}
				confirmText={strings.mpLeave}
				icon='exit-to-app'
				variant='danger'
				onCancel={() => setShowLeaveModal(false)}
				onConfirm={handleLeaveConfirm}
			/>

			<CheckoutDartsModal
				visible={showCheckoutModal}
				checkout={pendingCheckoutSave?.checkoutStr}
				onSave={handleCheckoutSave}
				onClose={handleCheckoutClose}
			/>
		</SafeAreaView>
	);
}

function StatCell({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.statCell}>
			<Text style={styles.statCellLabel}>{label}</Text>
			<Text style={styles.statCellValue}>{value}</Text>
		</View>
	);
}

type ScoreConfirmCardProps = {
	score: number;
	remaining: number;
	darts?: Dart[];
	submitting: boolean;
	titleLabel: string;
	confirmLabel: string;
	editLabel: string;
	remainingLabel: string;
	bustLabel: string;
	onConfirm: () => void;
	onEdit: () => void;
};

function ScoreConfirmCard({ score, remaining, darts, submitting, titleLabel, confirmLabel, editLabel, remainingLabel, bustLabel, onConfirm, onEdit }: ScoreConfirmCardProps) {
	const isBust = remaining < 0 || remaining === 1;
	return (
		<View style={styles.confirmCard}>
			<Text style={styles.confirmTitle}>{titleLabel}</Text>
			{darts && darts.length > 0 && (
				<View style={styles.confirmDarts}>
					{darts.map((d, i) => (
						<View key={i} style={styles.confirmDart}>
							<Text style={styles.confirmDartText}>{formatConfirmDart(d)}</Text>
						</View>
					))}
				</View>
			)}
			<Text style={styles.confirmScore}>{score}</Text>
			{isBust
				? <Text style={styles.confirmBust}>{bustLabel}</Text>
				: <Text style={styles.confirmRemaining}>{remainingLabel}: {remaining}</Text>
			}
			<View style={styles.confirmActions}>
				<Pressable style={styles.confirmEditBtn} onPress={onEdit} disabled={submitting}>
					<MaterialIcons name='edit' size={18} color='#fff' />
					<Text style={styles.confirmEditText}>{editLabel}</Text>
				</Pressable>
				<Pressable style={[styles.confirmOkBtn, submitting && styles.actionBtnDisabled]} onPress={onConfirm} disabled={submitting}>
					<MaterialIcons name='check-circle' size={18} color='#101113' />
					<Text style={styles.confirmOkText}>{confirmLabel}</Text>
				</Pressable>
			</View>
		</View>
	);
}

function formatConfirmDart(d: Dart): string {
	if (d.bed === 0) return 'Miss';
	if (d.bed === 50) return 'Bull';
	if (d.bed === 25) return d.m === 2 ? 'D25' : '25';
	if (d.m === 3) return `T${d.bed}`;
	if (d.m === 2) return `D${d.bed}`;
	return String(d.bed);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
	},
	centered: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
	},
	connectingText: {
		color: '#555',
		fontSize: 16,
		fontWeight: '700',
	},
	// Header
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 12,
		paddingTop: 8,
		paddingBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#1E1E1E',
	},
	headerCompact: {
		paddingTop: 4,
		paddingBottom: 4,
	},
	exitBtn: {
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
	},
	headerMid: {
		flex: 1,
	},
	headerCode: {
		color: '#8AB4F8',
		fontSize: 11,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 2,
	},
	headerMeta: {
		color: '#ccc',
		fontSize: 13,
		fontWeight: '700',
	},
	// Opponent mini panel
	oppPanel: {
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		paddingHorizontal: 10,
		paddingVertical: 6,
		alignItems: 'center',
		minWidth: 80,
	},
	oppPanelActive: {
		borderColor: '#60D394',
		backgroundColor: '#0D2018',
	},
	oppName: {
		color: '#888',
		fontSize: 10,
		fontWeight: '800',
		textTransform: 'uppercase',
		maxWidth: 90,
	},
	oppScore: {
		color: '#fff',
		fontSize: 22,
		fontWeight: '900',
		lineHeight: 24,
	},
	oppScoreActive: {
		color: '#60D394',
	},
	oppMeta: {
		color: '#555',
		fontSize: 10,
		fontWeight: '700',
	},
	// Scroll
	scroll: {
		padding: 12,
		paddingTop: 8,
		gap: 14,
		paddingBottom: 24,
		flexGrow: 1,
	},
	scrollCompact: {
		padding: 10,
		paddingTop: 4,
		gap: 10,
		paddingBottom: 16,
	},
	numpadBox: {
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
	},
	// Flash
	flashBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		borderRadius: 8,
		borderWidth: 1,
		paddingVertical: 10,
		paddingHorizontal: 16,
	},
	flashBannerText: {
		fontSize: 16,
		fontWeight: '900',
		textTransform: 'uppercase',
		letterSpacing: 2,
	},
	// Waiting
	waitingView: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		paddingVertical: 60,
	},
	waitingText: {
		color: '#555',
		fontSize: 15,
		fontWeight: '700',
		textAlign: 'center',
	},
	// Opponent turn
	opponentTurn: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 40,
	},
	opponentTurnTitle: {
		color: '#555',
		fontSize: 14,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	opponentTurnName: {
		color: '#888',
		fontSize: 22,
		fontWeight: '900',
	},
	// Match end
	matchEnd: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
		gap: 12,
	},
	matchEndLabel: {
		color: '#8AB4F8',
		fontSize: 14,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 3,
	},
	matchEndWinner: {
		color: '#fff',
		fontSize: 40,
		fontWeight: '900',
		textAlign: 'center',
	},
	matchEndWinnerMe: {
		color: '#60D394',
	},
	matchEndSub: {
		color: '#888',
		fontSize: 18,
		fontWeight: '800',
		textTransform: 'uppercase',
	},
	matchEndStats: {
		width: '100%',
		gap: 10,
		marginTop: 12,
	},
	matchEndPlayer: {
		backgroundColor: '#1A1A1A',
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 14,
		gap: 10,
	},
	matchEndPlayerWinner: {
		borderColor: '#60D394',
		backgroundColor: '#0D2018',
	},
	matchEndPlayerName: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '900',
	},
	matchEndRow: {
		flexDirection: 'row',
		gap: 8,
	},
	statCell: {
		flex: 1,
		alignItems: 'center',
		backgroundColor: '#242424',
		borderRadius: 6,
		padding: 8,
		gap: 2,
	},
	statCellLabel: {
		color: '#888',
		fontSize: 10,
		fontWeight: '800',
		textTransform: 'uppercase',
	},
	statCellValue: {
		color: '#fff',
		fontSize: 20,
		fontWeight: '900',
	},
	actionBtnDisabled: {
		opacity: 0.6,
	},
	homeBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		backgroundColor: '#60D394',
		borderRadius: 8,
		paddingVertical: 14,
		paddingHorizontal: 32,
		marginTop: 8,
	},
	homeBtnText: {
		color: '#101113',
		fontSize: 16,
		fontWeight: '900',
	},
	confirmCard: {
		width: '100%',
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 20,
		gap: 12,
		alignItems: 'center',
	},
	confirmTitle: {
		color: '#8AB4F8',
		fontSize: 11,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	confirmDarts: {
		flexDirection: 'row',
		gap: 8,
	},
	confirmDart: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		backgroundColor: '#242424',
		borderRadius: 6,
	},
	confirmDartText: {
		color: '#ccc',
		fontSize: 13,
		fontWeight: '800',
	},
	confirmScore: {
		color: '#fff',
		fontSize: 52,
		fontWeight: '900',
		lineHeight: 56,
	},
	confirmRemaining: {
		color: '#aaa',
		fontSize: 15,
		fontWeight: '700',
	},
	confirmBust: {
		color: '#FF6B6B',
		fontSize: 15,
		fontWeight: '900',
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	confirmActions: {
		flexDirection: 'row',
		gap: 10,
		width: '100%',
		marginTop: 4,
	},
	confirmEditBtn: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		backgroundColor: '#2A2A2A',
		borderRadius: 8,
		paddingVertical: 14,
	},
	confirmEditText: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '900',
	},
	confirmOkBtn: {
		flex: 2,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		backgroundColor: '#60D394',
		borderRadius: 8,
		paddingVertical: 14,
	},
	confirmOkText: {
		color: '#101113',
		fontSize: 15,
		fontWeight: '900',
	},
});
