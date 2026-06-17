import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getCheckout, validateCheckout } from '../lib/checkout';
import type { Dart } from '../lib/db';
import { saveGame } from '../lib/db';
import { getTurnScore, resolveTurn } from '../lib/gameRules';
import { getAdvanced } from '../lib/settings';

export type PendingCheckoutData = {
	start: number;
	turns: number[];
	hits: Dart[];
	checkout: string;
	isAdvanced: boolean;
	lastTurnHits?: Dart[];
};

type UseDartGameParams = {
	initialScore: number;
	advancedOverride?: boolean;
};

export function useDartGame({ initialScore, advancedOverride }: UseDartGameParams) {
	const [turns, setTurns] = useState<number[]>([]);
	const [hits, setHits] = useState<Dart[]>([]);
	const [gameHits, setGameHits] = useState<Dart[]>([]);
	// Only the setter is read (via updater form in undo); the value itself is never rendered.
	const [, setTurnHitCounts] = useState<number[]>([]);
	const [advanced, setAdvanced] = useState(advancedOverride ?? false);
	const [gameOver, setGameOver] = useState(false);
	const [showCheckoutDartsModal, setShowCheckoutDartsModal] = useState(false);
	const [showForfeitModal, setShowForfeitModal] = useState(false);
	const [showBustNotice, setShowBustNotice] = useState(false);
	const [pendingCheckoutData, setPendingCheckoutData] = useState<PendingCheckoutData | null>(null);

	useFocusEffect(
		useCallback(() => {
			if (advancedOverride !== undefined) {
				setAdvanced(advancedOverride);
				return undefined;
			}

			let active = true;
			getAdvanced().then(value => active && setAdvanced(value));
			return () => {
				active = false;
			};
		}, [advancedOverride])
	);

	useEffect(() => {
		if (!showBustNotice) return undefined;
		const timeout = setTimeout(() => setShowBustNotice(false), 1800);
		return () => clearTimeout(timeout);
	}, [showBustNotice]);

	const totalPoints = useMemo(() => turns.reduce((sum, turn) => sum + turn, 0), [turns]);
	const currentScore = initialScore - totalPoints;
	const currentTurnPoints = useMemo(() => getTurnScore(hits), [hits]);
	const scoredForAverage = advanced ? totalPoints + currentTurnPoints : totalPoints;
	const dartsForAverage = advanced ? gameHits.length : turns.length * 3;
	const average3d = dartsForAverage > 0 ? (scoredForAverage / dartsForAverage) * 3 : 0;
	const checkout = useMemo(() => getCheckout(currentScore), [currentScore]);
	const actualCheckoutDarts = getActualCheckoutDarts(pendingCheckoutData);

	const resetGameState = useCallback(() => {
		setTurns([]);
		setHits([]);
		setGameHits([]);
		setTurnHitCounts([]);
		setPendingCheckoutData(null);
		setShowCheckoutDartsModal(false);
		setShowForfeitModal(false);
		setShowBustNotice(false);
		setGameOver(false);
	}, []);

	const recordBustTurn = useCallback(
		(turnHits?: Dart[], allHits?: Dart[]) => {
			setShowBustNotice(true);
			setTurns(prev => [...prev, 0]);
			if (advanced && turnHits) {
				setTurnHitCounts(prev => [...prev, turnHits.length]);
				if (allHits) setGameHits(allHits);
				setHits([]);
			}
		},
		[advanced]
	);

	const openCheckoutModal = useCallback((data: PendingCheckoutData) => {
		setPendingCheckoutData(data);
		setShowCheckoutDartsModal(true);
	}, []);

	const handleTurnEnd = useCallback(
		(points: number, turnHits?: Dart[], allHits?: Dart[]) => {
			if (points < 0 || points > 180) return;

			const resolution = resolveTurn(currentScore, points);
			if (resolution.type === 'bust') {
				recordBustTurn(turnHits, allHits);
				return;
			}

			if (resolution.type === 'checkout') {
				const checkoutPath = getCheckout(currentScore);
				if (!checkoutPath) {
					recordBustTurn(turnHits, allHits);
					return;
				}

				if (advanced && !validateCheckout(turnHits ?? hits, checkoutPath)) {
					recordBustTurn(turnHits, allHits);
					return;
				}

				openCheckoutModal({
					start: initialScore,
					turns: [...turns, points],
					hits: allHits ?? gameHits,
					checkout: checkoutPath.join(' '),
					isAdvanced: advanced,
					lastTurnHits: turnHits,
				});
				return;
			}

			if (advanced && turnHits) {
				setTurnHitCounts(prev => [...prev, turnHits.length]);
			}
			setTurns(prev => [...prev, points]);
		},
		[advanced, currentScore, gameHits, hits, initialScore, openCheckoutModal, recordBustTurn, turns]
	);

	const handleSaveWithCheckoutDarts = useCallback(
		(checkoutDarts: number) => {
			if (!pendingCheckoutData) return;

			saveGame({
				start: pendingCheckoutData.start,
				turns: pendingCheckoutData.turns,
				hits: pendingCheckoutData.hits,
				checkout: pendingCheckoutData.checkout,
				checkoutDarts: pendingCheckoutData.isAdvanced ? undefined : checkoutDarts,
			});

			setShowCheckoutDartsModal(false);
			setPendingCheckoutData(null);

			if (pendingCheckoutData.isAdvanced) {
				setTurns(pendingCheckoutData.turns);
				setHits([]);
				setGameHits(pendingCheckoutData.hits);
				setGameOver(true);
			} else {
				setTurns([]);
				setHits([]);
				setGameHits([]);
				setTurnHitCounts([]);
			}
		},
		[pendingCheckoutData]
	);

	const onThrow = useCallback(
		(dart: Dart) => {
			if (advanced && gameOver) return;

			const nextHits = [...hits, dart];
			const pointsSoFar = getTurnScore(nextHits);
			const allHitsForTurn = [...gameHits, dart];
			const remainingAfterThrow = currentScore - pointsSoFar;

			if (advanced && (remainingAfterThrow < 0 || remainingAfterThrow === 1)) {
				recordBustTurn(nextHits, allHitsForTurn);
				return;
			}

			if (advanced && pointsSoFar === currentScore) {
				const checkoutPath = getCheckout(currentScore);
				if (!checkoutPath || !validateCheckout(nextHits, checkoutPath)) {
					recordBustTurn(nextHits, allHitsForTurn);
					return;
				}

				setTurnHitCounts(prev => [...prev, nextHits.length]);
				openCheckoutModal({
					start: initialScore,
					turns: [...turns, pointsSoFar],
					hits: allHitsForTurn,
					checkout: checkoutPath.join(' '),
					isAdvanced: true,
					lastTurnHits: nextHits,
				});
				setHits([]);
				return;
			}

			setHits(nextHits);
			setGameHits(allHitsForTurn);

			if (!advanced || nextHits.length === 3) {
				handleTurnEnd(pointsSoFar, advanced ? nextHits : undefined, advanced ? allHitsForTurn : undefined);
				setHits([]);
			}
		},
		[
			advanced,
			currentScore,
			gameHits,
			gameOver,
			handleTurnEnd,
			hits,
			initialScore,
			openCheckoutModal,
			recordBustTurn,
			turns,
		]
	);

	const removeHit = useCallback(() => {
		setHits(prev => {
			if (prev.length === 0) return prev;
			setGameHits(savedHits => savedHits.slice(0, -1));
			return prev.slice(0, -1);
		});
	}, []);

	const undoAdvancedTurn = useCallback(() => {
		setTurns(prev => prev.slice(0, -1));
		setTurnHitCounts(counts => {
			const lastCount = counts[counts.length - 1] ?? 0;
			setGameHits(savedHits => savedHits.slice(0, -lastCount));
			return counts.slice(0, -1);
		});
	}, []);

	const undoSimpleTurn = useCallback(() => {
		setTurns(prev => prev.slice(0, -1));
	}, []);

	const confirmForfeit = useCallback(() => {
		saveGame({
			start: initialScore,
			turns,
			hits: gameHits,
			checkout: undefined,
			forfeited: true,
			forfeitScore: currentScore,
		});
		resetGameState();
	}, [currentScore, gameHits, initialScore, resetGameState, turns]);

	return {
		state: {
			turns,
			hits,
			gameHits,
			advanced,
			gameOver,
			showCheckoutDartsModal,
			showForfeitModal,
			showBustNotice,
			pendingCheckoutData,
			currentScore,
			average3d,
			checkout,
			actualCheckoutDarts,
			hasStarted: turns.length > 0 || hits.length > 0,
			canUndoAdvancedTurn: advanced && turns.length > 0,
		},
		actions: {
			handleTurnEnd,
			handleSaveWithCheckoutDarts,
			onThrow,
			removeHit,
			undoAdvancedTurn,
			undoSimpleTurn,
			resetGameState,
			confirmForfeit,
			openForfeitModal: () => setShowForfeitModal(true),
			closeForfeitModal: () => setShowForfeitModal(false),
			closeCheckoutDartsModal: () => setShowCheckoutDartsModal(false),
		},
	};
}

function getActualCheckoutDarts(pendingCheckoutData: PendingCheckoutData | null) {
	if (!pendingCheckoutData) return 1;
	if (pendingCheckoutData.lastTurnHits && pendingCheckoutData.lastTurnHits.length > 0) {
		return pendingCheckoutData.lastTurnHits.length;
	}
	return pendingCheckoutData.isAdvanced ? pendingCheckoutData.hits.length : 1;
}
