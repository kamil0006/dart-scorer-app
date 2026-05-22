import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveTrainingSession } from '../database/trainingRepository';
import type { TrainingMode, TrainingSession } from '../database/trainingRepository';
import { calculateRemainingScore, getCheckout, getCheckoutForRemaining } from '../lib/checkout';
import { useLanguage } from '../lib/LanguageContext';
import type { LocalizedStrings } from '../lib/localization';

type TargetType = 'single' | 'double' | 'triple';
type Attempt = { target: string; hit: boolean; index?: number };

type ModalButton = {
	text: string;
	onPress: () => void;
	style?: 'default' | 'cancel' | 'destructive';
};

interface Target {
	value: number;
	type: TargetType;
	display: string;
	points: number;
}

const TARGET_TYPES: TargetType[] = ['single', 'double', 'triple'];
const CHECKOUT_SCORES = Array.from({ length: 131 }, (_, index) => index + 40).filter(score => getCheckout(score));
const CLOCK_MODES: TrainingMode[] = ['clockClassic', 'clockDouble', 'clockTriple', 'clockJump', 'clockPenalty'];
const CLOCK_SEQUENCE = [...Array.from({ length: 20 }, (_, index) => index + 1), 25, 50];

function formatDuration(seconds: number) {
	const minutes = Math.floor(seconds / 60);
	const rest = String(seconds % 60).padStart(2, '0');
	return `${minutes}:${rest}`;
}

function randomItem<T>(items: T[]): T {
	return items[Math.floor(Math.random() * items.length)];
}

function createTarget(): Target {
	const type = randomItem(TARGET_TYPES);
	const value = Math.floor(Math.random() * 20) + 1;

	if (type === 'double') {
		return { type, value, display: `D${value}`, points: value * 2 };
	}
	if (type === 'triple') {
		return { type, value, display: `T${value}`, points: value * 3 };
	}
	return { type, value, display: String(value), points: value };
}

function isClockMode(mode: TrainingMode) {
	return CLOCK_MODES.includes(mode);
}

function getClockStart(mode: TrainingMode) {
	return 1;
}

function getClockTarget(mode: TrainingMode, value: number, hitKind?: 'miss' | 1 | 2 | 3) {
	if (value === 50) return 'Bull';
	if (value === 25) return '25';
	if (mode === 'clockClassic') return String(value);
	if (mode === 'clockDouble') return `D${value}`;
	if (mode === 'clockTriple') return `T${value}`;
	if (hitKind === 2) return `D${value}`;
	if (hitKind === 3) return `T${value}`;
	return String(value);
}

function getClockIndex(value: number) {
	const index = CLOCK_SEQUENCE.indexOf(value);
	return index >= 0 ? index : 0;
}

function moveClock(value: number, steps: number) {
	const nextIndex = Math.max(0, Math.min(CLOCK_SEQUENCE.length - 1, getClockIndex(value) + steps));
	return CLOCK_SEQUENCE[nextIndex];
}

function isClockFinished(value: number, hit: boolean) {
	return hit && getClockIndex(value) === CLOCK_SEQUENCE.length - 1;
}

function isClockSpecialTarget(value: number) {
	return value === 25 || value === 50;
}

function getTrainingModeTitle(mode: TrainingMode, strings: LocalizedStrings) {
	switch (mode) {
		case 'checkout':
			return strings.checkoutPractice;
		case 'clockClassic':
			return strings.clockClassic;
		case 'clockDouble':
			return strings.clockDouble;
		case 'clockTriple':
			return strings.clockTriple;
		case 'clockJump':
			return strings.clockJump;
		case 'clockPenalty':
			return strings.clockPenalty;
		case 'bobs27':
			return strings.bobs27;
		default:
			return strings.practiceTargets;
	}
}

function getTrainingModeDescription(mode: TrainingMode, strings: LocalizedStrings) {
	switch (mode) {
		case 'checkout':
			return strings.checkoutPracticeDescription;
		case 'clockClassic':
			return strings.clockClassicDescription;
		case 'clockDouble':
			return strings.clockDoubleDescription;
		case 'clockTriple':
			return strings.clockTripleDescription;
		case 'clockJump':
			return strings.clockJumpDescription;
		case 'clockPenalty':
			return strings.clockPenaltyDescription;
		case 'bobs27':
			return strings.bobs27Description;
		default:
			return strings.targetPracticeDescription;
	}
}

export default function TrainingScreen() {
	const { strings } = useLanguage();
	const [trainingMode, setTrainingMode] = useState<TrainingMode>('target');
	const [sessionStarted, setSessionStarted] = useState(false);
	const [sessionDuration, setSessionDuration] = useState(0);
	const [startedAt, setStartedAt] = useState(Date.now());

	const [currentTarget, setCurrentTarget] = useState<Target>(() => createTarget());
	const [targetAttempts, setTargetAttempts] = useState<Attempt[]>([]);
	const [clockNumber, setClockNumber] = useState(1);
	const [bobsTarget, setBobsTarget] = useState(1);
	const [bobsDartsAtTarget, setBobsDartsAtTarget] = useState(0);
	const [bobsHitsAtTarget, setBobsHitsAtTarget] = useState(0);
	const [bobsScore, setBobsScore] = useState(27);

	const [currentCheckout, setCurrentCheckout] = useState<number | null>(null);
	const [checkoutTargets, setCheckoutTargets] = useState<string[]>([]);
	const [checkoutProgress, setCheckoutProgress] = useState<Attempt[]>([]);
	const [checkoutCompleted, setCheckoutCompleted] = useState(false);
	const [checkoutHistory, setCheckoutHistory] = useState<Attempt[]>([]);
	const [checkoutStats, setCheckoutStats] = useState({
		totalCheckouts: 0,
		completedCheckouts: 0,
		totalTargets: 0,
		hitTargets: 0,
	});

	const [showModal, setShowModal] = useState(false);
	const [modalConfig, setModalConfig] = useState<{
		title: string;
		message: string;
		buttons: ModalButton[];
	} | null>(null);

	const targetStats = useMemo(() => {
		const hits = targetAttempts.filter(attempt => attempt.hit).length;
		const total = targetAttempts.length;
		return {
			total,
			hits,
			misses: total - hits,
			successRate: total > 0 ? Math.round((hits / total) * 100) : 0,
		};
	}, [targetAttempts]);

	const checkoutSuccessRate = useMemo(() => {
		if (checkoutStats.totalTargets === 0) return 0;
		return Math.round((checkoutStats.hitTargets / checkoutStats.totalTargets) * 100);
	}, [checkoutStats.hitTargets, checkoutStats.totalTargets]);

	const activeStats =
		trainingMode === 'checkout'
			? {
					total: checkoutStats.totalTargets,
					hits: checkoutStats.hitTargets,
					misses: checkoutStats.totalTargets - checkoutStats.hitTargets,
					successRate: checkoutSuccessRate,
				}
			: targetStats;

	const recentAttempts = trainingMode === 'checkout' ? checkoutHistory.slice(-8).reverse() : targetAttempts.slice(-8).reverse();

	const generateCheckout = useCallback((countAsNewCheckout = true) => {
		const score = randomItem(CHECKOUT_SCORES);
		const targets = getCheckout(score);
		if (!targets) return;

		setCurrentCheckout(score);
		setCheckoutTargets(targets);
		setCheckoutProgress([]);
		setCheckoutCompleted(false);

		if (countAsNewCheckout) {
			setCheckoutStats(prev => ({ ...prev, totalCheckouts: prev.totalCheckouts + 1 }));
		}
	}, []);

	useEffect(() => {
		if (!sessionStarted) {
			setSessionDuration(0);
			return;
		}

		const interval = setInterval(() => {
			setSessionDuration(Math.floor((Date.now() - startedAt) / 1000));
		}, 1000);

		return () => clearInterval(interval);
	}, [sessionStarted, startedAt]);

	useEffect(() => {
		if (trainingMode === 'target') {
			setCurrentTarget(createTarget());
			return;
		}

		if (trainingMode === 'checkout' && !currentCheckout) {
			generateCheckout(false);
		}
	}, [trainingMode, currentCheckout, generateCheckout]);

	const showCustomModal = useCallback((config: { title: string; message: string; buttons: ModalButton[] }) => {
		setModalConfig(config);
		setShowModal(true);
	}, []);

	const resetCheckoutState = useCallback(() => {
		setCurrentCheckout(null);
		setCheckoutTargets([]);
		setCheckoutProgress([]);
		setCheckoutCompleted(false);
		setCheckoutHistory([]);
		setCheckoutStats({
			totalCheckouts: 0,
			completedCheckouts: 0,
			totalTargets: 0,
			hitTargets: 0,
		});
	}, []);

	const resetSessionData = useCallback(() => {
		setSessionStarted(false);
		setSessionDuration(0);
		setStartedAt(Date.now());
		setTargetAttempts([]);
		setCurrentTarget(createTarget());
		setClockNumber(getClockStart(trainingMode));
		setBobsTarget(1);
		setBobsDartsAtTarget(0);
		setBobsHitsAtTarget(0);
		setBobsScore(27);
		resetCheckoutState();
	}, [resetCheckoutState, trainingMode]);

	const startSession = useCallback(() => {
		setSessionStarted(true);
		setSessionDuration(0);
		setStartedAt(Date.now());
		setTargetAttempts([]);
		setClockNumber(getClockStart(trainingMode));
		setBobsTarget(1);
		setBobsDartsAtTarget(0);
		setBobsHitsAtTarget(0);
		setBobsScore(27);
		resetCheckoutState();

		if (trainingMode === 'target') {
			setCurrentTarget(createTarget());
		} else if (trainingMode === 'checkout') {
			generateCheckout(true);
		}
	}, [generateCheckout, resetCheckoutState, trainingMode]);

	const changeMode = (mode: TrainingMode) => {
		if (sessionStarted) return;
		setTrainingMode(mode);
		if (mode === 'target') {
			setCurrentTarget(createTarget());
		} else if (mode === 'checkout') {
			generateCheckout(false);
		} else {
			setClockNumber(getClockStart(mode));
			setBobsTarget(1);
			setBobsDartsAtTarget(0);
			setBobsHitsAtTarget(0);
			setBobsScore(27);
		}
	};

	const recordTargetAttempt = (hit: boolean) => {
		if (!sessionStarted) return;
		setTargetAttempts(prev => [...prev, { target: currentTarget.display, hit }]);
		setCurrentTarget(createTarget());
	};

	const saveCompletedClockSession = async (attempts: Attempt[]) => {
		const hits = attempts.filter(attempt => attempt.hit).length;
		const total = attempts.length;
		const session: TrainingSession = {
			date: new Date().toISOString(),
			targets: total,
			hits,
			misses: total - hits,
			duration: sessionDuration,
			successRate: total > 0 ? Math.round((hits / total) * 100) : 0,
			trainingMode,
			targetsPracticed: attempts.map(attempt => attempt.target),
			targetResults: attempts,
		};

		try {
			await saveTrainingSession(session);
			showCustomModal({
				title: strings.sessionSaved,
				message: strings.sessionSavedMessage,
				buttons: [{ text: strings.ok, onPress: () => setShowModal(false) }],
			});
			resetSessionData();
		} catch (error) {
			console.error('Failed to save training session:', error);
			showCustomModal({
				title: strings.saveError,
				message: strings.saveErrorMsg,
				buttons: [{ text: strings.ok, onPress: () => setShowModal(false), style: 'destructive' }],
			});
		}
	};

	const saveCompletedBobsSession = async (attempts: Attempt[], finalScore: number, eliminated = false) => {
		const hits = attempts.filter(attempt => attempt.hit).length;
		const total = attempts.length;
		const session: TrainingSession = {
			date: new Date().toISOString(),
			targets: total,
			hits,
			misses: total - hits,
			duration: sessionDuration,
			successRate: total > 0 ? Math.round((hits / total) * 100) : 0,
			trainingMode: 'bobs27',
			targetsPracticed: attempts.map(attempt => attempt.target),
			targetResults: [
				...attempts,
				{ target: `Score ${finalScore}`, hit: finalScore > 0 },
				{ target: eliminated ? 'Result lost' : 'Result won', hit: !eliminated },
			],
		};

		try {
			await saveTrainingSession(session);
			showCustomModal({
				title: eliminated ? strings.bobs27GameOverTitle : strings.sessionSaved,
				message: `${eliminated ? strings.bobs27GameOverMessage : strings.sessionSavedMessage}\n\n${strings.score}: ${finalScore}`,
				buttons: [{ text: strings.ok, onPress: () => setShowModal(false) }],
			});
			resetSessionData();
		} catch (error) {
			console.error('Failed to save training session:', error);
			showCustomModal({
				title: strings.saveError,
				message: strings.saveErrorMsg,
				buttons: [{ text: strings.ok, onPress: () => setShowModal(false), style: 'destructive' }],
			});
		}
	};

	const recordClockAttempt = (kind: 'miss' | 1 | 2 | 3) => {
		if (!sessionStarted || !isClockMode(trainingMode)) return;

		const display = getClockTarget(trainingMode, clockNumber, kind);
		const hit = kind !== 'miss';
		const nextAttempts = [...targetAttempts, { target: display, hit }];
		setTargetAttempts(nextAttempts);

		if (isClockFinished(clockNumber, hit)) {
			void saveCompletedClockSession(nextAttempts);
			return;
		}

		setClockNumber(current => {
			if (trainingMode === 'clockClassic') {
				return hit ? moveClock(current, 1) : current;
			}

			if (trainingMode === 'clockDouble' || trainingMode === 'clockTriple') {
				return hit ? moveClock(current, 1) : current;
			}

			if (trainingMode === 'clockJump') {
				return hit ? moveClock(current, kind) : current;
			}

			if (hit) return moveClock(current, kind);
			return moveClock(current, -1);
		});
	};

	const recordBobsAttempt = (hit: boolean) => {
		if (!sessionStarted || trainingMode !== 'bobs27') return;

		const target = `D${bobsTarget}`;
		const nextAttempts = [...targetAttempts, { target, hit }];
		const nextDartsAtTarget = bobsDartsAtTarget + 1;
		const nextHitsAtTarget = bobsHitsAtTarget + (hit ? 1 : 0);
		const hitValue = bobsTarget * 2;
		const scoreAfterHit = hit ? bobsScore + hitValue : bobsScore;
		const targetComplete = nextDartsAtTarget >= 3;
		const scoreAfterPenalty = targetComplete && nextHitsAtTarget === 0 ? scoreAfterHit - hitValue : scoreAfterHit;

		setTargetAttempts(nextAttempts);
		setBobsScore(scoreAfterPenalty);

		if (targetComplete && scoreAfterPenalty <= 0) {
			void saveCompletedBobsSession(nextAttempts, scoreAfterPenalty, true);
			return;
		}

		if (targetComplete && bobsTarget >= 20) {
			void saveCompletedBobsSession(nextAttempts, scoreAfterPenalty);
			return;
		}

		if (targetComplete) {
			setBobsTarget(current => Math.min(20, current + 1));
			setBobsDartsAtTarget(0);
			setBobsHitsAtTarget(0);
			return;
		}

		setBobsDartsAtTarget(nextDartsAtTarget);
		setBobsHitsAtTarget(nextHitsAtTarget);
	};

	const finishCheckoutTarget = (target: string, targetIndex: number, hit: boolean) => {
		if (!sessionStarted || checkoutProgress.some(attempt => attempt.index === targetIndex)) return;

		const nextProgress = [...checkoutProgress, { target, hit, index: targetIndex }];
		setCheckoutProgress(nextProgress);
		setCheckoutHistory(prev => [...prev, { target, hit }]);
		setCheckoutStats(prev => ({
			...prev,
			totalTargets: prev.totalTargets + 1,
			hitTargets: prev.hitTargets + (hit ? 1 : 0),
		}));

		if (!hit || !currentCheckout) return;

		const remaining = nextProgress
			.filter(attempt => attempt.hit)
			.reduce((score, attempt) => calculateRemainingScore(score, attempt.target), currentCheckout);

		if (remaining === 0 && checkoutTargets.every((_, index) => nextProgress.some(attempt => attempt.index === index && attempt.hit))) {
			setCheckoutCompleted(true);
			setCheckoutStats(prev => ({ ...prev, completedCheckouts: prev.completedCheckouts + 1 }));
		}
	};

	const retryCheckout = () => {
		if (!currentCheckout) return;

		const remaining = checkoutProgress
			.filter(attempt => attempt.hit)
			.reduce((score, attempt) => calculateRemainingScore(score, attempt.target), currentCheckout);

		const nextTargets = remaining > 1 ? getCheckoutForRemaining(remaining) : null;
		if (!nextTargets) {
			generateCheckout(true);
			return;
		}

		setCurrentCheckout(remaining);
		setCheckoutTargets(nextTargets);
		setCheckoutProgress([]);
		setCheckoutCompleted(false);
	};

	const saveSession = async () => {
		if (trainingMode !== 'checkout' && targetStats.total === 0) return;
		if (trainingMode === 'checkout' && checkoutStats.totalTargets === 0) return;

		const session: TrainingSession =
			trainingMode !== 'checkout'
				? {
						date: new Date().toISOString(),
						targets: targetStats.total,
						hits: targetStats.hits,
						misses: targetStats.misses,
						duration: sessionDuration,
						successRate: targetStats.successRate,
						trainingMode,
						targetsPracticed: targetAttempts.map(attempt => attempt.target),
						targetResults: targetAttempts,
					}
				: {
						date: new Date().toISOString(),
						targets: checkoutStats.totalTargets,
						hits: checkoutStats.hitTargets,
						misses: checkoutStats.totalTargets - checkoutStats.hitTargets,
						duration: sessionDuration,
						successRate: checkoutSuccessRate,
						trainingMode: 'checkout',
						targetsPracticed: checkoutHistory.map(attempt => attempt.target),
						targetResults: checkoutHistory,
					};

		try {
			await saveTrainingSession(session);
			showCustomModal({
				title: strings.sessionSaved,
				message: strings.sessionSavedMessage,
				buttons: [{ text: strings.ok, onPress: () => setShowModal(false) }],
			});
		} catch (error) {
			console.error('Failed to save training session:', error);
			showCustomModal({
				title: strings.saveError,
				message: strings.saveErrorMsg,
				buttons: [{ text: strings.ok, onPress: () => setShowModal(false), style: 'destructive' }],
			});
		}
	};

	const resetSession = () => {
		showCustomModal({
			title: strings.resetSession,
			message: strings.resetSessionConfirm,
			buttons: [
				{ text: strings.cancel, onPress: () => setShowModal(false), style: 'cancel' },
				{
					text: strings.saveAndReset,
					onPress: async () => {
						setShowModal(false);
						await saveSession();
						resetSessionData();
					},
				},
				{
					text: strings.reset,
					onPress: () => {
						setShowModal(false);
						resetSessionData();
					},
					style: 'destructive',
				},
			],
		});
	};

	const canSaveSession = trainingMode === 'checkout' ? checkoutStats.totalTargets > 0 : targetStats.total > 0;
	const modeTitle = getTrainingModeTitle(trainingMode, strings);
	const modeDescription = getTrainingModeDescription(trainingMode, strings);
	const currentCheckoutDone =
		checkoutTargets.length > 0 && checkoutTargets.every((_, index) => checkoutProgress.some(attempt => attempt.index === index));

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<View style={styles.headerTitleBlock}>
						<Text style={styles.eyebrow}>{strings.trainingMode}</Text>
						<Text style={styles.title} numberOfLines={2}>
							{modeTitle}
						</Text>
					</View>
					<View style={styles.headerActions}>
						<View style={styles.timerPill}>
							<MaterialIcons name='timer' size={18} color='#E7EEF7' />
							<Text style={styles.timerText}>{formatDuration(sessionDuration)}</Text>
						</View>
						{sessionStarted && (
							<Pressable style={styles.exitButton} onPress={resetSessionData}>
								<MaterialIcons name='close' size={18} color='#E7EEF7' />
								<Text style={styles.exitButtonText}>{strings.close}</Text>
							</Pressable>
						)}
					</View>
				</View>

				{!sessionStarted && (
					<View style={styles.modeGrid}>
						<ModeCard
							active={trainingMode === 'target'}
							color='#8AB4F8'
							icon='gps-fixed'
							title={strings.practiceTargets}
							description={strings.targetPracticeDescription}
							onPress={() => changeMode('target')}
						/>
						<ModeCard
							active={trainingMode === 'checkout'}
							color='#5BD3C7'
							icon='sports-score'
							title={strings.checkoutPractice}
							description={strings.checkoutPracticeDescription}
							onPress={() => changeMode('checkout')}
						/>
						<ModeCard
							active={trainingMode === 'clockClassic'}
							color='#8AB4F8'
							icon='schedule'
							title={strings.clockClassic}
							description={strings.clockClassicDescription}
							onPress={() => changeMode('clockClassic')}
						/>
						<ModeCard
							active={trainingMode === 'clockDouble'}
							color='#C6A7FF'
							icon='adjust'
							title={strings.clockDouble}
							description={strings.clockDoubleDescription}
							onPress={() => changeMode('clockDouble')}
						/>
						<ModeCard
							active={trainingMode === 'clockTriple'}
							color='#F2C94C'
							icon='change-history'
							title={strings.clockTriple}
							description={strings.clockTripleDescription}
							onPress={() => changeMode('clockTriple')}
						/>
						<ModeCard
							active={trainingMode === 'clockJump'}
							color='#60D394'
							icon='double-arrow'
							title={strings.clockJump}
							description={strings.clockJumpDescription}
							onPress={() => changeMode('clockJump')}
						/>
						<ModeCard
							active={trainingMode === 'clockPenalty'}
							color='#D94A5A'
							icon='keyboard-return'
							title={strings.clockPenalty}
							description={strings.clockPenaltyDescription}
							onPress={() => changeMode('clockPenalty')}
						/>
						<ModeCard
							active={trainingMode === 'bobs27'}
							color='#F2994A'
							icon='filter-9-plus'
							title={strings.bobs27}
							description={strings.bobs27Description}
							onPress={() => changeMode('bobs27')}
						/>
					</View>
				)}

				{sessionStarted && (
					<View style={[styles.focusPanel, trainingMode === 'checkout' && styles.checkoutPanel]}>
						<View style={styles.focusTopRow}>
							<View style={styles.focusLabel}>
								<MaterialIcons
									name={trainingMode === 'checkout' ? 'sports-score' : 'gps-fixed'}
									size={18}
									color={trainingMode === 'checkout' ? '#5BD3C7' : '#8AB4F8'}
								/>
								<Text style={styles.focusLabelText}>
									{trainingMode === 'checkout' ? strings.checkoutTarget : strings.currentTarget}
								</Text>
							</View>
							<Text style={styles.focusMeta}>{activeStats.successRate}%</Text>
						</View>

						{trainingMode === 'target' ? (
							<>
								<Text style={[styles.focusValue, styles.targetValue]}>{currentTarget.display}</Text>
								<Text style={styles.focusHint}>
									{currentTarget.points} {strings.points}
								</Text>
							</>
						) : trainingMode === 'checkout' ? (
							<>
								<Text style={[styles.focusValue, styles.checkoutValue]}>{currentCheckout ?? '-'}</Text>
								<View style={styles.checkoutPath}>
									{checkoutTargets.map((target, index) => {
										const attempt = checkoutProgress.find(item => item.index === index);
										return (
											<View
												key={`${target}-${index}`}
												style={[
													styles.pathChip,
													attempt?.hit && styles.pathChipHit,
													attempt && !attempt.hit && styles.pathChipMiss,
												]}>
												<Text style={styles.pathChipText}>{target}</Text>
												{attempt?.hit && <MaterialIcons name='check' size={14} color='#fff' />}
												{attempt && !attempt.hit && <MaterialIcons name='close' size={14} color='#fff' />}
											</View>
										);
									})}
								</View>
								<Text style={styles.focusHint}>
									{checkoutCompleted ? strings.checkoutSuccess : `${strings.targetsToHit}: ${checkoutTargets.join(' / ')}`}
								</Text>
							</>
						) : trainingMode === 'bobs27' ? (
							<>
								<Text style={[styles.focusValue, styles.targetValue]}>{`D${bobsTarget}`}</Text>
								<Text style={styles.focusHint}>
									{strings.score}: {bobsScore} | {bobsDartsAtTarget}/3
								</Text>
							</>
						) : (
							<>
								<Text style={[styles.focusValue, styles.targetValue]}>{getClockTarget(trainingMode, clockNumber)}</Text>
								<Text style={styles.focusHint}>{modeDescription}</Text>
							</>
						)}
					</View>
				)}

				{!sessionStarted ? (
					<Pressable style={styles.startButton} onPress={startSession}>
						<MaterialIcons name='play-arrow' size={28} color='#fff' />
						<Text style={styles.startButtonText}>{strings.startGame}</Text>
					</Pressable>
				) : trainingMode === 'target' ? (
					<View style={styles.primaryActions}>
						<Pressable style={[styles.bigAction, styles.hitAction]} onPress={() => recordTargetAttempt(true)}>
							<MaterialIcons name='check-circle' size={28} color='#fff' />
							<Text style={styles.bigActionText}>{strings.hit}</Text>
						</Pressable>
						<Pressable style={[styles.bigAction, styles.missAction]} onPress={() => recordTargetAttempt(false)}>
							<MaterialIcons name='cancel' size={28} color='#fff' />
							<Text style={styles.bigActionText}>{strings.miss}</Text>
						</Pressable>
					</View>
				) : trainingMode === 'checkout' ? (
					<View style={styles.checkoutActions}>
						{checkoutTargets.map((target, index) => {
							const attempt = checkoutProgress.find(item => item.index === index);
							if (attempt) return null;

							return (
								<View key={`${target}-${index}`} style={styles.checkoutActionRow}>
									<Text style={styles.checkoutActionTarget}>{target}</Text>
									<View style={styles.checkoutButtons}>
										<Pressable style={[styles.smallAction, styles.hitAction]} onPress={() => finishCheckoutTarget(target, index, true)}>
											<MaterialIcons name='check' size={20} color='#fff' />
											<Text style={styles.smallActionText}>{strings.hit}</Text>
										</Pressable>
										<Pressable style={[styles.smallAction, styles.missAction]} onPress={() => finishCheckoutTarget(target, index, false)}>
											<MaterialIcons name='close' size={20} color='#fff' />
											<Text style={styles.smallActionText}>{strings.miss}</Text>
										</Pressable>
									</View>
								</View>
							);
						})}

						{(checkoutCompleted || currentCheckoutDone) && (
							<View style={styles.nextActions}>
								{!checkoutCompleted && (
									<Pressable style={[styles.secondaryButton, styles.retryButton]} onPress={retryCheckout}>
										<MaterialIcons name='refresh' size={20} color='#121212' />
										<Text style={styles.secondaryButtonTextDark}>{strings.retryCheckout}</Text>
									</Pressable>
								)}
								<Pressable style={[styles.secondaryButton, styles.nextButton]} onPress={() => generateCheckout(true)}>
									<MaterialIcons name='arrow-forward' size={20} color='#fff' />
									<Text style={styles.secondaryButtonText}>{strings.nextCheckout}</Text>
								</Pressable>
							</View>
						)}
					</View>
				) : trainingMode === 'clockClassic' ? (
					<View style={styles.primaryActions}>
						<Pressable style={[styles.bigAction, styles.hitAction]} onPress={() => recordClockAttempt(1)}>
							<MaterialIcons name='check-circle' size={28} color='#fff' />
							<Text style={styles.bigActionText}>{strings.hit}</Text>
						</Pressable>
						<Pressable style={[styles.bigAction, styles.missAction]} onPress={() => recordClockAttempt('miss')}>
							<MaterialIcons name='cancel' size={28} color='#fff' />
							<Text style={styles.bigActionText}>{strings.miss}</Text>
						</Pressable>
					</View>
				) : trainingMode === 'clockDouble' || trainingMode === 'clockTriple' || isClockSpecialTarget(clockNumber) ? (
					<View style={styles.primaryActions}>
						<Pressable style={[styles.bigAction, styles.hitAction]} onPress={() => recordClockAttempt(1)}>
							<MaterialIcons name='check-circle' size={28} color='#fff' />
							<Text style={styles.bigActionText}>{strings.hit}</Text>
						</Pressable>
						<Pressable style={[styles.bigAction, styles.missAction]} onPress={() => recordClockAttempt('miss')}>
							<MaterialIcons name='cancel' size={28} color='#fff' />
							<Text style={styles.bigActionText}>{strings.miss}</Text>
						</Pressable>
					</View>
				) : trainingMode === 'bobs27' ? (
					<View style={styles.primaryActions}>
						<Pressable style={[styles.bigAction, styles.hitAction]} onPress={() => recordBobsAttempt(true)}>
							<MaterialIcons name='check-circle' size={28} color='#fff' />
							<Text style={styles.bigActionText}>{strings.hit}</Text>
						</Pressable>
						<Pressable style={[styles.bigAction, styles.missAction]} onPress={() => recordBobsAttempt(false)}>
							<MaterialIcons name='cancel' size={28} color='#fff' />
							<Text style={styles.bigActionText}>{strings.miss}</Text>
						</Pressable>
					</View>
				) : (
					<View style={styles.clockActions}>
						<Pressable style={[styles.smallAction, styles.hitAction]} onPress={() => recordClockAttempt(1)}>
							<Text style={styles.smallActionText}>S</Text>
						</Pressable>
						<Pressable style={[styles.smallAction, styles.hitAction]} onPress={() => recordClockAttempt(2)}>
							<Text style={styles.smallActionText}>D</Text>
						</Pressable>
						<Pressable style={[styles.smallAction, styles.hitAction]} onPress={() => recordClockAttempt(3)}>
							<Text style={styles.smallActionText}>T</Text>
						</Pressable>
						<Pressable style={[styles.smallAction, styles.missAction]} onPress={() => recordClockAttempt('miss')}>
							<Text style={styles.smallActionText}>{strings.miss}</Text>
						</Pressable>
					</View>
				)}

				{sessionStarted && (
					<>
						<View style={styles.statsGrid}>
							<StatTile icon='gps-fixed' label={strings.targets} value={activeStats.total} color='#8AB4F8' />
							<StatTile icon='check-circle' label={strings.hits} value={activeStats.hits} color='#48B66C' />
							<StatTile icon='cancel' label={strings.misses} value={activeStats.misses} color='#D94A5A' />
							<StatTile icon='percent' label={strings.successRate} value={`${activeStats.successRate}%`} color='#F2C94C' />
						</View>

						<View style={styles.historyPanel}>
							<View style={styles.historyHeader}>
								<MaterialIcons name='history' size={18} color='#E7EEF7' />
								<Text style={styles.historyTitle}>{strings.targetsPracticed}</Text>
							</View>
							{recentAttempts.length === 0 ? (
								<Text style={styles.emptyHistory}>{strings.hitTarget}</Text>
							) : (
								<View style={styles.historyChips}>
									{recentAttempts.map((attempt, index) => (
										<View key={`${attempt.target}-${index}`} style={[styles.historyChip, attempt.hit ? styles.historyHit : styles.historyMiss]}>
											<Text style={styles.historyChipText}>{attempt.target}</Text>
											<MaterialIcons name={attempt.hit ? 'check' : 'close'} size={14} color='#fff' />
										</View>
									))}
								</View>
							)}
						</View>

						<View style={styles.footerActions}>
							<Pressable style={[styles.footerButton, !canSaveSession && styles.footerButtonDisabled]} onPress={saveSession} disabled={!canSaveSession}>
								<MaterialIcons name='save' size={20} color='#48B66C' />
								<Text style={styles.footerButtonText}>{strings.saveSession}</Text>
							</Pressable>
							<Pressable style={styles.footerButton} onPress={resetSession}>
								<MaterialIcons name='restart-alt' size={20} color='#D94A5A' />
								<Text style={styles.footerButtonText}>{strings.resetSession}</Text>
							</Pressable>
						</View>
					</>
				)}
			</ScrollView>

			<Modal visible={showModal} transparent={true} animationType='fade' onRequestClose={() => setShowModal(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>{modalConfig?.title}</Text>
						<Text style={styles.modalMessage}>{modalConfig?.message}</Text>
						<View style={styles.modalButtons}>
							{modalConfig?.buttons.map((button, index) => (
								<Pressable
									key={`${button.text}-${index}`}
									style={[
										styles.modalButton,
										button.style === 'cancel' && styles.modalButtonCancel,
										button.style === 'destructive' && styles.modalButtonDestructive,
									]}
									onPress={button.onPress}>
									<Text style={styles.modalButtonText}>{button.text}</Text>
								</Pressable>
							))}
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

function ModeCard({
	active,
	color,
	icon,
	title,
	description,
	onPress,
}: {
	active: boolean;
	color: string;
	icon: keyof typeof MaterialIcons.glyphMap;
	title: string;
	description: string;
	onPress: () => void;
}) {
	return (
		<Pressable style={[styles.modeCard, active && { borderColor: color }]} onPress={onPress}>
			<View style={[styles.modeIcon, { backgroundColor: color }]}>
				<MaterialIcons name={icon} size={24} color='#121212' />
			</View>
			<Text style={styles.modeTitle}>{title}</Text>
			<Text style={styles.modeDescription}>{description}</Text>
		</Pressable>
	);
}

function StatTile({
	icon,
	label,
	value,
	color,
}: {
	icon: keyof typeof MaterialIcons.glyphMap;
	label: string;
	value: string | number;
	color: string;
}) {
	return (
		<View style={styles.statTile}>
			<MaterialIcons name={icon} size={18} color={color} />
			<Text style={styles.statValue}>{value}</Text>
			<Text style={styles.statLabel}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#101113',
	},
	content: {
		padding: 14,
		paddingTop: 8,
		paddingBottom: 40,
		gap: 16,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		gap: 10,
		width: '100%',
	},
	headerTitleBlock: {
		flex: 1,
		minWidth: 0,
	},
	eyebrow: {
		color: '#8B949E',
		fontSize: 12,
		fontWeight: '700',
		textTransform: 'uppercase',
	},
	title: {
		color: '#F4F7FA',
		fontSize: 22,
		lineHeight: 28,
		fontWeight: '800',
		marginTop: 2,
		flexShrink: 1,
	},
	timerPill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		backgroundColor: '#1B1F24',
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderWidth: 1,
		borderColor: '#2A3037',
		flexShrink: 0,
	},
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		flexShrink: 0,
	},
	exitButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		backgroundColor: '#2A3037',
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderWidth: 1,
		borderColor: '#3A4048',
	},
	exitButtonText: {
		color: '#E7EEF7',
		fontSize: 12,
		fontWeight: '800',
	},
	timerText: {
		color: '#E7EEF7',
		fontSize: 14,
		fontWeight: '700',
	},
	modeGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
	},
	modeCard: {
		width: '48%',
		backgroundColor: '#181B20',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A3037',
		padding: 14,
		minHeight: 142,
	},
	modeIcon: {
		width: 40,
		height: 40,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	modeTitle: {
		color: '#F4F7FA',
		fontSize: 15,
		fontWeight: '800',
	},
	modeDescription: {
		color: '#9AA4AF',
		fontSize: 12,
		lineHeight: 16,
		marginTop: 6,
	},
	focusPanel: {
		backgroundColor: '#181B20',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A3037',
		padding: 18,
		alignItems: 'center',
	},
	checkoutPanel: {
		borderColor: '#244B50',
	},
	focusTopRow: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	focusLabel: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	focusLabelText: {
		color: '#C8D0D9',
		fontSize: 14,
		fontWeight: '700',
	},
	focusMeta: {
		color: '#F2C94C',
		fontSize: 14,
		fontWeight: '800',
	},
	focusValue: {
		fontSize: 82,
		fontWeight: '900',
		marginTop: 8,
	},
	targetValue: {
		color: '#8AB4F8',
	},
	checkoutValue: {
		color: '#5BD3C7',
	},
	focusHint: {
		color: '#9AA4AF',
		fontSize: 14,
		fontWeight: '600',
		textAlign: 'center',
		marginTop: 4,
	},
	checkoutPath: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 8,
		marginTop: 4,
		marginBottom: 8,
	},
	pathChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		backgroundColor: '#252A31',
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	pathChipHit: {
		backgroundColor: '#48B66C',
	},
	pathChipMiss: {
		backgroundColor: '#D94A5A',
	},
	pathChipText: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '800',
	},
	startButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		backgroundColor: '#48B66C',
		borderRadius: 8,
		paddingVertical: 16,
	},
	startButtonText: {
		color: '#fff',
		fontSize: 17,
		fontWeight: '800',
	},
	primaryActions: {
		flexDirection: 'row',
		gap: 12,
	},
	bigAction: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		borderRadius: 8,
		paddingVertical: 18,
	},
	bigActionText: {
		color: '#fff',
		fontSize: 17,
		fontWeight: '800',
	},
	hitAction: {
		backgroundColor: '#48B66C',
	},
	missAction: {
		backgroundColor: '#D94A5A',
	},
	checkoutActions: {
		gap: 10,
	},
	checkoutActionRow: {
		backgroundColor: '#181B20',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A3037',
		padding: 12,
		gap: 10,
	},
	checkoutActionTarget: {
		color: '#9BE7DF',
		fontSize: 18,
		fontWeight: '900',
		textAlign: 'center',
	},
	checkoutButtons: {
		flexDirection: 'row',
		gap: 10,
	},
	clockActions: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
	},
	smallAction: {
		flex: 1,
		minWidth: '45%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		borderRadius: 8,
		paddingVertical: 12,
	},
	smallActionText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '800',
	},
	nextActions: {
		flexDirection: 'row',
		gap: 10,
	},
	secondaryButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		borderRadius: 8,
		paddingVertical: 13,
	},
	retryButton: {
		backgroundColor: '#F2C94C',
	},
	nextButton: {
		backgroundColor: '#2FA7A0',
	},
	secondaryButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '800',
	},
	secondaryButtonTextDark: {
		color: '#121212',
		fontSize: 14,
		fontWeight: '800',
	},
	statsGrid: {
		flexDirection: 'row',
		gap: 8,
	},
	statTile: {
		flex: 1,
		backgroundColor: '#181B20',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A3037',
		paddingVertical: 12,
		alignItems: 'center',
		gap: 3,
		minHeight: 86,
	},
	statValue: {
		color: '#F4F7FA',
		fontSize: 19,
		fontWeight: '900',
	},
	statLabel: {
		color: '#9AA4AF',
		fontSize: 11,
		fontWeight: '700',
		textAlign: 'center',
	},
	historyPanel: {
		backgroundColor: '#181B20',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A3037',
		padding: 14,
		gap: 12,
	},
	historyHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	historyTitle: {
		color: '#E7EEF7',
		fontSize: 15,
		fontWeight: '800',
	},
	emptyHistory: {
		color: '#8B949E',
		fontSize: 13,
	},
	historyChips: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	historyChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	historyHit: {
		backgroundColor: '#2F7E49',
	},
	historyMiss: {
		backgroundColor: '#963442',
	},
	historyChipText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '800',
	},
	footerActions: {
		flexDirection: 'row',
		gap: 10,
	},
	footerButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		backgroundColor: '#181B20',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A3037',
		paddingVertical: 14,
	},
	footerButtonDisabled: {
		opacity: 0.45,
	},
	footerButtonText: {
		color: '#E7EEF7',
		fontSize: 13,
		fontWeight: '800',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.72)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modalContent: {
		width: '100%',
		maxWidth: 380,
		backgroundColor: '#181B20',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A3037',
		padding: 20,
	},
	modalTitle: {
		color: '#F4F7FA',
		fontSize: 19,
		fontWeight: '900',
		textAlign: 'center',
		marginBottom: 10,
	},
	modalMessage: {
		color: '#B8C0CA',
		fontSize: 14,
		lineHeight: 20,
		textAlign: 'center',
		marginBottom: 18,
	},
	modalButtons: {
		flexDirection: 'row',
		gap: 10,
	},
	modalButton: {
		flex: 1,
		backgroundColor: '#8AB4F8',
		borderRadius: 8,
		paddingVertical: 13,
		alignItems: 'center',
	},
	modalButtonCancel: {
		backgroundColor: '#3A4048',
	},
	modalButtonDestructive: {
		backgroundColor: '#D94A5A',
	},
	modalButtonText: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '800',
		textAlign: 'center',
	},
});
