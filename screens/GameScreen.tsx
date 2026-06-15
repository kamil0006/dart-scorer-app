import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AdvancedThrowPad from '../components/AdvancedThrowPad';
import ConfirmModal from '../components/common/ConfirmModal';
import CheckoutDartsModal from '../components/game/CheckoutDartsModal';
import CurrentTurnSlots from '../components/game/CurrentTurnSlots';
import DartboardHeatmap from '../components/game/DartboardHeatmap';
import ForfeitModal from '../components/game/ForfeitModal';
import TurnHistory from '../components/game/TurnHistory';
import Numpad from '../components/Numpad';
import ScoreBoard from '../components/ScoreBoard';
import { useDartGame } from '../hooks/useDartGame';
import type { DisplayAverageHistoryItem, DisplayMatchState } from '../lib/externalDisplay';
import type { RootStackParamList } from '../navigation/types';
import { resetDisplayOnFirstAvailable, sendDisplayStateToFirstAvailable } from '../lib/externalDisplay';
import { useLanguage } from '../lib/LanguageContext';
import { getDisplayClientId, getDisplayPlayerName, getDisplayServerUrls, getHorizontalTurnsHistory } from '../lib/settings';

type GameScreenProps = StackScreenProps<RootStackParamList, 'Game'>;

type DisplayProgress = {
	legsWon: number;
	matchLegsWon: number;
	setsWon: number;
	matchComplete: boolean;
	matchScored: number;
	matchDarts: number;
	setScored: number;
	setDarts: number;
	legAverages: number[];
	setAverages: number[];
	legAverageHistory: DisplayAverageHistoryItem[];
	setAverageHistory: DisplayAverageHistoryItem[];
};

const INITIAL_DISPLAY_PROGRESS: DisplayProgress = {
	legsWon: 0,
	matchLegsWon: 0,
	setsWon: 0,
	matchComplete: false,
	matchScored: 0,
	matchDarts: 0,
	setScored: 0,
	setDarts: 0,
	legAverages: [],
	setAverages: [],
	legAverageHistory: [],
	setAverageHistory: [],
};

export default function GameScreen({ route, navigation }: GameScreenProps): React.ReactElement {
	const { initialScore, displayMode = false, advancedOverride, setsTarget = 1, legsTarget = 1 } = route.params;
	const { strings } = useLanguage();
	const { height, width } = useWindowDimensions();
	const game = useDartGame({ initialScore, advancedOverride });
	const { state, actions } = game;
	const compactLayout = height < 820 || width < 390;
	const [showUndoTurnModal, setShowUndoTurnModal] = useState(false);
	const [horizontalTurnsHistory, setHorizontalTurnsHistory] = useState(false);
	const [displayServerUrls, setDisplayServerUrls] = useState<string[]>([]);
	const [displayClientId, setDisplayClientId] = useState('player-local');
	const [displayPlayerName, setDisplayPlayerNameState] = useState('Gracz 1');
	const [displayProgress, setDisplayProgress] = useState<DisplayProgress>(INITIAL_DISPLAY_PROGRESS);
	const displayProgressRef = useRef<DisplayProgress>(INITIAL_DISPLAY_PROGRESS);
	const allowLeaveRef = useRef(false);
	const forfeitTitle = state.hasStarted ? strings.forfeitConfirm : strings.cancelGameConfirm;
	const forfeitMessage = state.hasStarted ? strings.forfeitMessage : strings.cancelGameMessage;
	const forfeitConfirmText = state.hasStarted ? strings.forfeit : strings.cancelGame;

	const handleForfeitConfirm = () => {
		if (state.hasStarted) {
			if (displayMode) {
				const progress = normalizeDisplayProgress(displayProgressRef.current);
				const legAverage = calculateDisplayAverage(currentLegScored, currentLegDarts);
				commitDisplayProgress({
					...progress,
					matchScored: progress.matchScored + currentLegScored,
					matchDarts: progress.matchDarts + currentLegDarts,
					setScored: progress.setScored + currentLegScored,
					setDarts: progress.setDarts + currentLegDarts,
					legAverages: [...progress.legAverages, legAverage],
					legAverageHistory: [
						...progress.legAverageHistory,
						{ label: createLegHistoryLabel(progress.setsWon, progress.legsWon), value: legAverage },
					],
				});
			}
			actions.confirmForfeit();
			return;
		}

		actions.closeForfeitModal();
		actions.resetGameState();
		allowLeaveRef.current = true;
		navigation.goBack();
	};

	const confirmUndoAdvancedTurn = () => {
		actions.undoAdvancedTurn();
		setShowUndoTurnModal(false);
	};

	const handleEndDisplayMatch = () => {
		if (displayServerUrls.length > 0) {
			resetDisplayOnFirstAvailable(displayServerUrls).catch(() => undefined);
		}

		commitDisplayProgress(INITIAL_DISPLAY_PROGRESS);
		actions.resetGameState();
		allowLeaveRef.current = true;
		navigation.goBack();
	};

	const currentLegScored = state.pendingCheckoutData ? initialScore : initialScore - state.currentScore;
	const currentLegDarts = getCurrentLegDarts(state);
	const legAverage3d = calculateDisplayAverage(currentLegScored, currentLegDarts);
	const safeDisplayProgress = useMemo(() => normalizeDisplayProgress(displayProgress), [displayProgress]);
	const setAverage3d = calculateDisplayAverage(safeDisplayProgress.setScored + currentLegScored, safeDisplayProgress.setDarts + currentLegDarts);
	const matchAverage3d = calculateDisplayAverage(safeDisplayProgress.matchScored + currentLegScored, safeDisplayProgress.matchDarts + currentLegDarts);

	const commitDisplayProgress = (nextProgress: DisplayProgress) => {
		const normalizedProgress = normalizeDisplayProgress(nextProgress);
		displayProgressRef.current = normalizedProgress;
		setDisplayProgress(normalizedProgress);
	};

	const handleCheckoutSave = (darts: number) => {
		if (!displayMode) {
			actions.handleSaveWithCheckoutDarts(darts);
			return;
		}

		const completedLegScored = initialScore;
		const completedLegDarts = getCompletedLegDarts(state, darts);
		const progress = normalizeDisplayProgress(displayProgressRef.current);
		const nextLegs = progress.legsWon + 1;
		const setWon = nextLegs >= legsTarget;
		const nextSets = progress.setsWon + (setWon ? 1 : 0);
		const matchWon = nextSets >= setsTarget;
		const completedLegAverage = calculateDisplayAverage(completedLegScored, completedLegDarts);
		const completedSetAverage = calculateDisplayAverage(
			progress.setScored + completedLegScored,
			progress.setDarts + completedLegDarts
		);
		const legHistoryItem = {
			label: createLegHistoryLabel(progress.setsWon, progress.legsWon),
			value: completedLegAverage,
			darts: completedLegDarts,
		};
		const setHistoryItem = {
			label: `S${progress.setsWon + 1}`,
			value: completedSetAverage,
			darts: progress.setDarts + completedLegDarts,
		};

		const nextProgress = {
			legsWon: matchWon ? legsTarget : setWon ? 0 : nextLegs,
			matchLegsWon: progress.matchLegsWon + 1,
			setsWon: Math.min(setsTarget, nextSets),
			matchComplete: matchWon,
			matchScored: progress.matchScored + completedLegScored,
			matchDarts: progress.matchDarts + completedLegDarts,
			setScored: setWon ? 0 : progress.setScored + completedLegScored,
			setDarts: setWon ? 0 : progress.setDarts + completedLegDarts,
			legAverages: [...progress.legAverages, completedLegAverage],
			setAverages: setWon ? [...progress.setAverages, completedSetAverage] : progress.setAverages,
			legAverageHistory: [...progress.legAverageHistory, legHistoryItem],
			setAverageHistory: setWon ? [...progress.setAverageHistory, setHistoryItem] : progress.setAverageHistory,
		};

		commitDisplayProgress(nextProgress);

		if (matchWon && displayServerUrls.length > 0) {
			sendDisplayStateToFirstAvailable(displayServerUrls, {
				startScore: initialScore,
				activePlayerIndex: 0,
				setsTarget,
				legsTarget,
				currentSet: Math.max(1, nextProgress.setsWon),
				currentLeg: Math.max(1, nextProgress.legsWon),
				turnNumber: Math.max(1, state.turns.length + 1),
				status: 'matchWon',
				message: `${displayPlayerName} ${strings.displayWinsMatch}`,
				transition: {
					from: null,
					to: displayPlayerName,
					text: `${displayPlayerName} ${strings.displayWinsMatch}`,
				},
				players: [
					{
						id: displayClientId,
						name: displayPlayerName,
						remaining: 0,
						setsWon: nextProgress.setsWon,
						legsWon: nextProgress.legsWon,
						matchLegsWon: nextProgress.matchLegsWon,
						checkout: state.checkout ?? [],
						lastTurn: state.turns[state.turns.length - 1] ?? null,
						average3d: state.average3d,
						legAverage3d: completedLegAverage,
						setAverage3d: completedSetAverage,
						matchAverage3d: calculateDisplayAverage(nextProgress.matchScored, nextProgress.matchDarts),
						legAverages3d: nextProgress.legAverages,
						setAverages3d: nextProgress.setAverages,
						legAverageHistory: nextProgress.legAverageHistory,
						setAverageHistory: nextProgress.setAverageHistory,
						turns: state.turns,
					},
				],
			}).catch(() => undefined);
		}

		actions.handleSaveWithCheckoutDarts(darts);

		if (!matchWon) {
			actions.resetGameState();
		}
	};

	const visibleLegsWon = useMemo(() => {
		return Math.min(legsTarget, safeDisplayProgress.legsWon);
	}, [safeDisplayProgress.legsWon, legsTarget]);

	const visibleSetsWon = useMemo(() => {
		if (safeDisplayProgress.matchComplete) return setsTarget;
		return Math.min(setsTarget, safeDisplayProgress.setsWon);
	}, [safeDisplayProgress.matchComplete, safeDisplayProgress.setsWon, setsTarget]);

	useFocusEffect(
		useCallback(() => {
			let active = true;
			getHorizontalTurnsHistory().then(enabled => {
				if (active) setHorizontalTurnsHistory(enabled);
			});
			if (displayMode) {
				getDisplayServerUrls().then(urls => {
					if (active) setDisplayServerUrls(urls);
				});
				getDisplayPlayerName().then(name => {
					if (active) setDisplayPlayerNameState(name);
				});
				getDisplayClientId().then(id => {
					if (active) setDisplayClientId(id);
				});
			}

			return () => {
				active = false;
			};
		}, [displayMode])
	);

	const displayState = useMemo<DisplayMatchState>(
		() => ({
			startScore: initialScore,
			activePlayerIndex: 0,
			setsTarget,
			legsTarget,
			currentSet: Math.min(setsTarget, safeDisplayProgress.setsWon + 1),
			currentLeg: Math.min(legsTarget, safeDisplayProgress.legsWon + 1),
			turnNumber: Math.max(1, state.turns.length + 1),
			status: safeDisplayProgress.matchComplete ? 'matchWon' : state.showBustNotice ? 'bust' : state.gameOver || state.pendingCheckoutData ? 'legWon' : 'playing',
			message: state.showBustNotice
				? strings.bust
				: state.pendingCheckoutData
				? `${displayPlayerName} ${strings.displayClosingLeg}`
				: `${displayPlayerName} ${strings.displayAtBoard}`,
			transition: {
				from: null,
				to: displayPlayerName,
				text: `${displayPlayerName} ${strings.displayAtBoard}`,
			},
			players: [
				{
					id: displayClientId,
					name: displayPlayerName,
					remaining: safeDisplayProgress.matchComplete || state.pendingCheckoutData ? 0 : state.currentScore,
					setsWon: visibleSetsWon,
					legsWon: visibleLegsWon,
					matchLegsWon: safeDisplayProgress.matchLegsWon,
					checkout: state.checkout ?? [],
					lastTurn: state.turns[state.turns.length - 1] ?? null,
					average3d: state.average3d,
					legAverage3d,
					setAverage3d,
					matchAverage3d,
					legAverages3d: safeDisplayProgress.legAverages,
					setAverages3d: safeDisplayProgress.setAverages,
					legAverageHistory: safeDisplayProgress.legAverageHistory,
					setAverageHistory: safeDisplayProgress.setAverageHistory,
					turns: state.turns,
				},
			],
		}),
		[
			displayClientId,
			safeDisplayProgress,
			displayPlayerName,
			safeDisplayProgress.matchLegsWon,
			visibleLegsWon,
			visibleSetsWon,
			initialScore,
			legsTarget,
			legAverage3d,
			matchAverage3d,
			setsTarget,
			setAverage3d,
			state.average3d,
			state.checkout,
			state.currentScore,
			state.gameOver,
			state.pendingCheckoutData,
			state.showBustNotice,
			state.turns,
			strings,
		]
	);

	useEffect(() => {
		if (!displayMode || displayServerUrls.length === 0) return;

		sendDisplayStateToFirstAvailable(displayServerUrls, displayState)
			.then(() => undefined)
			.catch(() => undefined);

		return undefined;
	}, [displayMode, displayServerUrls, displayState]);

	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', event => {
			if (allowLeaveRef.current || state.gameOver || safeDisplayProgress.matchComplete) return;

			event.preventDefault();
			actions.openForfeitModal();
		});

		return unsubscribe;
	}, [actions, navigation, safeDisplayProgress.matchComplete, state.gameOver]);

	useFocusEffect(
		useCallback(() => {
			const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
				if (state.gameOver || safeDisplayProgress.matchComplete) return false;

				actions.openForfeitModal();
				return true;
			});

			return () => subscription.remove();
		}, [actions, safeDisplayProgress.matchComplete, state.gameOver])
	);

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle='light-content' />
			{!state.gameOver && (
				<View style={[styles.topActions, !displayMode && styles.topActionsSolo, compactLayout && styles.topActionsCompact]}>
					{displayMode && (
						<Pressable style={[styles.displayEndButton, compactLayout && styles.forfeitButtonCompact]} onPress={handleEndDisplayMatch}>
							<MaterialIcons name='desktop-access-disabled' size={compactLayout ? 15 : 18} color='#8AB4F8' />
							<Text style={styles.displayEndButtonText}>{strings.displayEndScreen}</Text>
						</Pressable>
					)}
					<Pressable style={[styles.forfeitButton, compactLayout && styles.forfeitButtonCompact]} onPress={actions.openForfeitModal}>
						<MaterialIcons name='flag' size={compactLayout ? 15 : 18} color='#FFB4BE' />
						<Text style={styles.forfeitButtonText}>{state.hasStarted ? strings.forfeit : strings.cancel}</Text>
					</Pressable>
				</View>
			)}
			<ScrollView
				contentContainerStyle={[
					styles.scroll,
					compactLayout && styles.scrollCompact,
					state.gameOver && styles.scrollGameOver,
				]}>
				{state.showBustNotice && (
					<View style={styles.bustNotice}>
						<MaterialIcons name='report' size={20} color='#fff' />
						<View style={styles.bustCopy}>
							<Text style={styles.bustTitle}>{strings.bust}</Text>
							<Text style={styles.bustMessage}>{strings.bustMessage}</Text>
						</View>
					</View>
				)}

				{state.advanced && state.gameOver ? (
					<Pressable style={styles.newGameBtn} onPress={actions.resetGameState}>
						<Text style={styles.newGameTxt}>{strings.newGameButton}</Text>
					</Pressable>
				) : (
					<ScoreBoard score={state.currentScore} average={state.average3d} checkout={state.checkout} compact={compactLayout} />
				)}

				<TurnHistory
					turns={state.turns}
					canUndoTurn={state.canUndoAdvancedTurn}
					onUndoTurn={() => setShowUndoTurnModal(true)}
					compact={compactLayout}
					horizontalScroll={horizontalTurnsHistory}
				/>

				{!state.advanced ? (
					<View style={styles.numpadBox}>
						<Numpad onCommit={actions.handleTurnEnd} onUndo={actions.undoSimpleTurn} extended={false} compact={compactLayout} />
					</View>
				) : (
					<>
						<CurrentTurnSlots hits={state.hits} onUndo={actions.removeHit} />
						<AdvancedThrowPad onThrow={actions.onThrow} onUndo={actions.removeHit} />
						<DartboardHeatmap hits={state.gameHits} onThrow={actions.onThrow} />
					</>
				)}
			</ScrollView>

			<CheckoutDartsModal
				visible={state.showCheckoutDartsModal}
				checkout={state.pendingCheckoutData?.checkout}
				isAdvanced={state.pendingCheckoutData?.isAdvanced}
				actualDarts={state.actualCheckoutDarts}
				onSave={handleCheckoutSave}
				onClose={actions.closeCheckoutDartsModal}
			/>
			<ForfeitModal
				visible={state.showForfeitModal}
				title={forfeitTitle}
				message={forfeitMessage}
				confirmText={forfeitConfirmText}
				onConfirm={handleForfeitConfirm}
				onClose={actions.closeForfeitModal}
			/>
			<ConfirmModal
				visible={showUndoTurnModal}
				title={strings.undoTurnConfirm}
				message={strings.undoTurnWhileTypingMessage}
				cancelText={strings.cancel}
				confirmText={strings.confirm}
				icon='delete-outline'
				onCancel={() => setShowUndoTurnModal(false)}
				onConfirm={confirmUndoAdvancedTurn}
			/>
		</SafeAreaView>
	);
}

type DisplayAverageState = {
	advanced: boolean;
	turns: number[];
	gameHits: unknown[];
	actualCheckoutDarts: number;
	pendingCheckoutData: {
		turns: number[];
		hits: unknown[];
	} | null;
};

function getCurrentLegDarts(state: DisplayAverageState) {
	if (state.advanced) {
		return state.pendingCheckoutData?.hits.length ?? state.gameHits.length;
	}

	if (state.pendingCheckoutData) {
		return Math.max(0, state.pendingCheckoutData.turns.length - 1) * 3 + state.actualCheckoutDarts;
	}

	return state.turns.length * 3;
}

function getCompletedLegDarts(state: DisplayAverageState, checkoutDarts: number) {
	if (state.advanced) {
		return state.pendingCheckoutData?.hits.length ?? state.gameHits.length;
	}

	const completedTurns = state.pendingCheckoutData?.turns.length ?? state.turns.length;
	return Math.max(0, completedTurns - 1) * 3 + checkoutDarts;
}

function calculateDisplayAverage(scored: number, darts: number) {
	return darts > 0 ? (scored / darts) * 3 : 0;
}

function createLegHistoryLabel(setsWon: number, legsWon: number) {
	return `L${legsWon + 1} S${setsWon + 1}`;
}

function normalizeDisplayProgress(progress: Partial<DisplayProgress> | null | undefined): DisplayProgress {
	return {
		...INITIAL_DISPLAY_PROGRESS,
		...(progress ?? {}),
		legsWon: Number(progress?.legsWon ?? 0),
		matchLegsWon: Number(progress?.matchLegsWon ?? 0),
		setsWon: Number(progress?.setsWon ?? 0),
		matchScored: Number(progress?.matchScored ?? 0),
		matchDarts: Number(progress?.matchDarts ?? 0),
		setScored: Number(progress?.setScored ?? 0),
		setDarts: Number(progress?.setDarts ?? 0),
		matchComplete: Boolean(progress?.matchComplete),
		legAverages: Array.isArray(progress?.legAverages) ? progress.legAverages : [],
		setAverages: Array.isArray(progress?.setAverages) ? progress.setAverages : [],
		legAverageHistory: Array.isArray(progress?.legAverageHistory) ? progress.legAverageHistory : [],
		setAverageHistory: Array.isArray(progress?.setAverageHistory) ? progress.setAverageHistory : [],
	};
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
	},
	scroll: {
		padding: 16,
		paddingTop: 0,
		gap: 16,
		paddingBottom: 80,
	},
	scrollCompact: {
		paddingHorizontal: 10,
		gap: 8,
		paddingBottom: 54,
	},
	scrollGameOver: {
		paddingTop: 8,
	},
	numpadBox: {
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
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
	topActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 16,
		paddingTop: 6,
		paddingBottom: 8,
	},
	topActionsSolo: {
		justifyContent: 'flex-end',
	},
	topActionsCompact: {
		paddingHorizontal: 10,
		paddingTop: 2,
		paddingBottom: 5,
	},
	forfeitButton: {
		minHeight: 38,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		backgroundColor: '#2A1519',
		borderRadius: 999,
		paddingHorizontal: 12,
		borderWidth: 1,
		borderColor: '#7A2634',
	},
	displayEndButton: {
		minHeight: 38,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		backgroundColor: '#142033',
		borderRadius: 999,
		paddingHorizontal: 12,
		borderWidth: 1,
		borderColor: '#2F5D95',
	},
	forfeitButtonCompact: {
		minHeight: 31,
		paddingHorizontal: 10,
	},
	displayEndButtonText: {
		color: '#8AB4F8',
		fontSize: 12,
		fontWeight: '900',
	},
	forfeitButtonText: {
		color: '#FFB4BE',
		fontSize: 12,
		fontWeight: '900',
	},
	bustNotice: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'center',
		gap: 10,
		backgroundColor: '#B00020',
		borderRadius: 8,
		paddingVertical: 10,
		paddingHorizontal: 12,
		maxWidth: 360,
		width: '100%',
	},
	bustCopy: {
		flex: 1,
	},
	bustTitle: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '700',
	},
	bustMessage: {
		color: '#F5D4DA',
		fontSize: 12,
		marginTop: 2,
	},
});
