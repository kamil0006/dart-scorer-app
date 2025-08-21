import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { saveTrainingSession, TrainingSession } from '../database/trainingRepository';
import { useLanguage } from '../lib/LanguageContext';
import { calculateRemainingScore, getCheckout, getCheckoutForRemaining } from '../lib/checkout';

type TargetType = 'single' | 'double' | 'triple';

interface Target {
	value: number;
	type: TargetType;
	display: string;
	points: number;
}

export default function TrainingScreen() {
	const { strings } = useLanguage();
	const [trainingMode, setTrainingMode] = useState<'target' | 'checkout'>('target');
	const [currentTarget, setCurrentTarget] = useState<Target | null>(null);
	const [sessionStarted, setSessionStarted] = useState(false);
	const [sessionStats, setSessionStats] = useState({
		targets: 0,
		hits: 0,
		misses: 0,
		startTime: Date.now(),
	});
	const [targetsPracticed, setTargetsPracticed] = useState<string[]>([]);
	const [targetResults, setTargetResults] = useState<{ target: string; hit: boolean }[]>([]);

	// Checkout practice state
	const [currentCheckout, setCurrentCheckout] = useState<number | null>(null);
	const [checkoutTargets, setCheckoutTargets] = useState<string[]>([]);
	const [checkoutProgress, setCheckoutProgress] = useState<{ target: string; hit: boolean }[]>([]);
	const [checkoutCompleted, setCheckoutCompleted] = useState(false);
	const [remainingScore, setRemainingScore] = useState<number | null>(null); // Track remaining score after partial hits
	const [allCheckoutTargets, setAllCheckoutTargets] = useState<string[]>([]); // Track ALL targets from ALL checkouts
	const [allCheckoutResults, setAllCheckoutResults] = useState<{ target: string; hit: boolean }[]>([]); // Track ALL results from ALL checkouts
	const [checkoutStats, setCheckoutStats] = useState({
		attempts: 0,
		successes: 0,
		totalCheckouts: 0, // Track total checkouts attempted
		completedCheckouts: 0, // Track completed checkouts
		totalTargets: 0, // Track total targets attempted
		hitTargets: 0, // Track total targets hit
		startTime: Date.now(),
	});

	// Custom modal state
	const [showModal, setShowModal] = useState(false);
	const [modalConfig, setModalConfig] = useState<{
		title: string;
		message: string;
		buttons: { text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
	} | null>(null);

	// Constants for target generation
	const TARGET_TYPES: TargetType[] = ['single', 'double', 'triple'];
	const MAX_TARGET_VALUE = 20;

	// Generate a new random target
	const generateTarget = useCallback(() => {
		const type = TARGET_TYPES[Math.floor(Math.random() * TARGET_TYPES.length)];
		const value = Math.floor(Math.random() * MAX_TARGET_VALUE) + 1;

		let display: string;
		let points: number;

		switch (type) {
			case 'single':
				display = value.toString();
				points = value;
				break;
			case 'double':
				display = `D${value}`;
				points = value * 2;
				break;
			case 'triple':
				display = `T${value}`;
				points = value * 3;
				break;
		}

		setCurrentTarget({ value, type, display, points });
	}, []);

	// Generate a new checkout scenario
	const generateCheckout = useCallback(() => {
		// Generate a random score between 40 and 170 for checkout practice
		const score = Math.floor(Math.random() * 131) + 40;
		const targets = getCheckout(score);

		if (targets) {
			setCurrentCheckout(score);
			setCheckoutTargets(targets);
			setCheckoutProgress([]);
			setCheckoutCompleted(false);
			setRemainingScore(null); // Reset remaining score
			// Add new checkout targets to the list of all targets practiced
			setAllCheckoutTargets(prev => [...prev, ...targets]);
			// Reset checkout stats for new checkout
			setCheckoutStats(prev => ({
				...prev,
				attempts: 0,
				successes: 0,
				totalCheckouts: prev.totalCheckouts + 1, // Increment total checkouts
			}));
		} else {
			// If no checkout found, try again with a different score
			// This prevents infinite recursion
			setTimeout(() => generateCheckout(), 100);
		}
	}, []);

	// Retry checkout with remaining score
	const retryCheckout = useCallback(() => {
		if (remainingScore !== null) {
			const targets = getCheckoutForRemaining(remainingScore);
			if (targets) {
				setCheckoutTargets(targets);
				setCheckoutProgress([]);
				setCheckoutCompleted(false);
				// Add new targets to the list of all targets practiced
				setAllCheckoutTargets(prev => [...prev, ...targets]);
				// Reset attempts for retry (don't count towards total checkout stats)
				setCheckoutStats(prev => ({
					...prev,
					attempts: 0,
				}));
			}
		}
	}, [remainingScore]);

	// Auto-generate scenarios when mode changes
	useEffect(() => {
		if (trainingMode === 'target') {
			// Clear checkout data and generate new target
			setCurrentCheckout(null);
			setCheckoutTargets([]);
			setCheckoutProgress([]);
			setCheckoutCompleted(false);
			setRemainingScore(null);
			setAllCheckoutTargets([]);
			setAllCheckoutResults([]);
			setCheckoutStats({
				attempts: 0,
				successes: 0,
				totalCheckouts: 0,
				completedCheckouts: 0,
				totalTargets: 0,
				hitTargets: 0,
				startTime: Date.now(),
			});
			generateTarget();
		} else if (trainingMode === 'checkout') {
			// Clear target data and generate new checkout
			setCurrentTarget(null);
			setTargetsPracticed([]);
			setTargetResults([]);
			setSessionStats({
				targets: 0,
				hits: 0,
				misses: 0,
				startTime: Date.now(),
			});
			generateCheckout();
		}
	}, [trainingMode, generateTarget, generateCheckout]);

	// Generate initial target when component mounts
	useEffect(() => {
		generateTarget();
	}, [generateTarget]);

	// Handle checkout target hit/miss
	const handleCheckoutResult = useCallback(
		(target: string, hit: boolean) => {
			// Prevent multiple clicks on the same target
			if (checkoutProgress.some(p => p.target === target)) {
				return;
			}

			// Track individual target attempts and hits
			setCheckoutStats(prev => ({
				...prev,
				totalTargets: prev.totalTargets + 1,
				hitTargets: prev.hitTargets + (hit ? 1 : 0),
			}));

			setCheckoutProgress(prev => {
				const newProgress = [...prev, { target, hit }];

				// Track this result in the comprehensive results array
				setAllCheckoutResults(prevResults => {
					// Check if this target already exists in results
					const existingIndex = prevResults.findIndex(r => r.target === target);
					if (existingIndex >= 0) {
						// Update existing result
						const updatedResults = [...prevResults];
						updatedResults[existingIndex] = { target, hit };
						return updatedResults;
					} else {
						// Add new result
						return [...prevResults, { target, hit }];
					}
				});

				// Check if checkout is completed
				if (hit) {
					const allTargetsHit = checkoutTargets.every(t => newProgress.some(p => p.target === t && p.hit));
					if (allTargetsHit) {
						setCheckoutCompleted(true);
						// Only increment completedCheckouts for original checkouts, not retries
						if (!remainingScore) {
							setCheckoutStats(prev => ({
								...prev,
								completedCheckouts: prev.completedCheckouts + 1,
							}));
						}
					} else {
						// Calculate remaining score for partial completion
						const currentScore = currentCheckout || 0;
						const hitTargets = newProgress.filter(p => p.hit).map(p => p.target);
						let remaining = currentScore;

						// Subtract points from all hit targets
						hitTargets.forEach(hitTarget => {
							remaining = calculateRemainingScore(remaining, hitTarget);
						});

						if (remaining > 0) {
							setRemainingScore(remaining);
						}
					}
				}

				return newProgress;
			});

			// Only increment attempts for the original checkout (not retries)
			// This prevents retry attempts from affecting the success rate
			if (!remainingScore) {
				setCheckoutStats(prev => ({
					...prev,
					attempts: prev.attempts + 1,
				}));
			}
		},
		[checkoutTargets, checkoutProgress, currentCheckout, remainingScore]
	);

	// Check if all targets have been attempted (hit or missed)
	const allTargetsAttempted = useMemo(() => {
		return checkoutTargets.every(target => checkoutProgress.some(p => p.target === target));
	}, [checkoutTargets, checkoutProgress]);

	// Handle hit/miss
	const handleResult = useCallback(
		(hit: boolean) => {
			if (!currentTarget) return;

			const targetDisplay = currentTarget.display;

			// Track practiced targets (only if not already practiced)
			setTargetsPracticed(prev => (prev.includes(targetDisplay) ? prev : [...prev, targetDisplay]));

			// Track individual target results
			setTargetResults(prev => [...prev, { target: targetDisplay, hit }]);

			// Update session stats
			setSessionStats(prev => ({
				...prev,
				targets: prev.targets + 1,
				hits: prev.hits + (hit ? 1 : 0),
				misses: prev.misses + (hit ? 0 : 1),
			}));

			// Generate next target immediately
			generateTarget();
		},
		[currentTarget, generateTarget]
	);

	// Calculate success rate throughout the session
	const successRate = useMemo(() => {
		if (sessionStats.targets === 0) return 0;
		return Math.round((sessionStats.hits / sessionStats.targets) * 100);
	}, [sessionStats.targets, sessionStats.hits]);

	// Calculate session duration starting from 0
	const [sessionDuration, setSessionDuration] = useState(0);

	// Generate first target on component mount with a small delay
	useEffect(() => {
		const timer = setTimeout(() => {
			generateTarget();
		}, 500); // Small delay to make it feel less automated

		return () => clearTimeout(timer);
	}, []);

	// Real-time timer update
	useEffect(() => {
		if (!sessionStarted) {
			setSessionDuration(0);
			return;
		}

		const interval = setInterval(() => {
			const duration = Math.floor((Date.now() - sessionStats.startTime) / 1000);
			setSessionDuration(duration);
		}, 1000); // Update every second

		return () => clearInterval(interval);
	}, [sessionStarted, sessionStats.startTime]);

	// Initial session state
	const initialSessionStats = useMemo(
		() => ({
			targets: 0,
			hits: 0,
			misses: 0,
			startTime: Date.now(),
		}),
		[]
	);

	// Start training session
	const startSession = useCallback(() => {
		setSessionStarted(true);
		setSessionStats({
			...initialSessionStats,
			startTime: Date.now(),
		});
		setTargetsPracticed([]);
		setTargetResults([]);
		setSessionDuration(0);

		// Reset checkout stats with new start time
		setCheckoutStats({
			attempts: 0,
			successes: 0,
			totalCheckouts: 0,
			completedCheckouts: 0,
			totalTargets: 0,
			hitTargets: 0,
			startTime: Date.now(),
		});
		setAllCheckoutTargets([]); // Reset all checkout targets
		setCheckoutTargets([]);
		setRemainingScore(null);

		if (trainingMode === 'target') {
			generateTarget();
		} else {
			generateCheckout();
		}
	}, [initialSessionStats, generateTarget, generateCheckout, trainingMode]);

	// Save training session
	const saveSession = async () => {
		if (trainingMode === 'target' && sessionStats.targets === 0) return;
		if (trainingMode === 'checkout' && checkoutStats.totalCheckouts === 0) return;

		let session: TrainingSession;

		if (trainingMode === 'target') {
			session = {
				date: new Date().toISOString(),
				targets: sessionStats.targets,
				hits: sessionStats.hits,
				misses: sessionStats.misses,
				duration: Math.floor((Date.now() - sessionStats.startTime) / 1000),
				successRate: successRate,
				trainingMode: 'target',
				targetsPracticed,
				targetResults,
			};
		} else {
			// For checkout practice, create a session with checkout-specific data
			// Calculate checkout success rate based on individual target hits vs attempts
			const checkoutSuccessRate =
				checkoutStats.totalTargets > 0 ? Math.round((checkoutStats.hitTargets / checkoutStats.totalTargets) * 100) : 0;

			session = {
				date: new Date().toISOString(),
				targets: checkoutStats.totalTargets, // Use total targets attempted
				hits: checkoutStats.hitTargets,
				misses: checkoutStats.totalTargets - checkoutStats.hitTargets,
				duration: Math.floor((Date.now() - sessionStats.startTime) / 1000),
				successRate: checkoutSuccessRate,
				trainingMode: 'checkout',
				targetsPracticed: allCheckoutTargets, // Use ALL targets from ALL checkouts
				targetResults: allCheckoutResults, // Use the comprehensive results we've been tracking
			};
		}

		try {
			const sessionId = await saveTrainingSession(session);

			showCustomModal({
				title: strings.sessionSaved,
				message: strings.sessionSavedMessage,
				buttons: [{ text: strings.ok, onPress: () => setShowModal(false), style: 'default' }],
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

	// Reset session
	const resetSession = () => {
		showCustomModal({
			title: strings.resetSession,
			message: strings.resetSessionConfirm,
			buttons: [
				{ text: strings.cancel, onPress: () => setShowModal(false), style: 'cancel' },
				{
					text: strings.saveAndReset,
					style: 'default',
					onPress: async () => {
						setShowModal(false);
						await saveSession();
						resetSessionData();
					},
				},
				{
					text: strings.reset,
					style: 'destructive',
					onPress: () => {
						setShowModal(false);
						resetSessionData();
					},
				},
			],
		});
	};

	// Show custom modal
	const showCustomModal = useCallback(
		(config: {
			title: string;
			message: string;
			buttons: { text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
		}) => {
			setModalConfig(config);
			setShowModal(true);
		},
		[]
	);

	// Reset session data
	const resetSessionData = useCallback(() => {
		setSessionStarted(false);
		setSessionStats(initialSessionStats);
		setTargetsPracticed([]);
		setTargetResults([]);
		setCurrentTarget(null);
		setSessionDuration(0);

		// Reset checkout practice state
		setCurrentCheckout(null);
		setCheckoutTargets([]);
		setCheckoutProgress([]);
		setCheckoutCompleted(false);
		setRemainingScore(null);
		setAllCheckoutTargets([]); // Reset all checkout targets
		setAllCheckoutResults([]); // Reset all checkout results
		setCheckoutStats({
			attempts: 0,
			successes: 0,
			totalCheckouts: 0,
			completedCheckouts: 0,
			totalTargets: 0,
			hitTargets: 0,
			startTime: Date.now(),
		});
	}, [initialSessionStats]);

	// Note: Debug functions removed - training sessions now appear in Statistics tab

	return (
		<View style={styles.container}>
			{/* Mode Selector */}
			{!sessionStarted && (
				<View style={styles.modeSelector}>
					<Text style={styles.modeSelectorTitle}>{strings.trainingMode}</Text>
					<View style={styles.modeButtons}>
						<Pressable
							style={[styles.modeButton, trainingMode === 'target' && styles.modeButtonActive]}
							onPress={() => setTrainingMode('target')}>
							<Text style={[styles.modeButtonText, trainingMode === 'target' && styles.modeButtonTextActive]}>
								{strings.practiceTargets}
							</Text>
						</Pressable>
						<Pressable
							style={[styles.modeButton, trainingMode === 'checkout' && styles.modeButtonActive]}
							onPress={() => setTrainingMode('checkout')}>
							<Text style={[styles.modeButtonText, trainingMode === 'checkout' && styles.modeButtonTextActive]}>
								{strings.checkoutPractice}
							</Text>
						</Pressable>
					</View>
				</View>
			)}

			{/* Current Target Display */}
			{!sessionStarted ? (
				<View style={styles.startSection}>
					<Text style={styles.startTitle}>
						{trainingMode === 'target' ? strings.practiceTargets : strings.checkoutPractice}
					</Text>
					<Text style={styles.startSubtitle}>
						{trainingMode === 'target' ? strings.targetPracticeDescription : strings.checkoutPracticeDescription}
					</Text>
					<Pressable style={styles.startButton} onPress={startSession}>
						<MaterialIcons name='play-arrow' size={32} color='#fff' />
						<Text style={styles.startButtonText}>{strings.startGame}</Text>
					</Pressable>
				</View>
			) : currentTarget ? (
				<View style={styles.targetSection}>
					<Text style={styles.targetLabel}>{strings.currentTarget}</Text>
					<View style={styles.targetDisplay}>
						<Text
							style={[
								styles.targetValue,
								currentTarget.type === 'single' && styles.singleTarget,
								currentTarget.type === 'double' && styles.doubleTarget,
								currentTarget.type === 'triple' && styles.tripleTarget,
							]}>
							{currentTarget.display}
						</Text>
						<Text style={styles.targetPoints}>
							{currentTarget.points} {strings.points}
						</Text>
					</View>
					<Text style={styles.targetInstruction}>{strings.hitTarget}</Text>
				</View>
			) : currentCheckout ? (
				<ScrollView
					style={styles.checkoutSection}
					contentContainerStyle={styles.checkoutSectionContent}
					showsVerticalScrollIndicator={false}>
					<Text style={styles.checkoutLabel}>{strings.checkoutTarget}</Text>
					<Text style={styles.checkoutScore}>{currentCheckout}</Text>
					<Text style={styles.checkoutRemainingScore}>
						{remainingScore !== null
							? `${strings.remaining}: ${remainingScore} - ${strings.hit}: ${checkoutTargets.join(' → ')}`
							: `${strings.targetsToHit}: ${checkoutTargets.join(' → ')}`}
					</Text>

					{/* Checkout targets display */}
					<View style={styles.checkoutTargets}>
						{checkoutTargets.map((target, index) => {
							const isHit = checkoutProgress.some(p => p.target === target && p.hit);
							const isMissed = checkoutProgress.some(p => p.target === target && !p.hit);

							return (
								<View
									key={index}
									style={[
										styles.checkoutTargetChip,
										isHit && styles.checkoutTargetHit,
										isMissed && styles.checkoutTargetMissed,
									]}>
									<Text style={styles.checkoutTargetText}>{target}</Text>
									{isHit && <MaterialIcons name='check' size={14} color='#4CAF50' />}
									{isMissed && <MaterialIcons name='close' size={14} color='#B00020' />}
								</View>
							);
						})}
					</View>

					{/* Progress indicator */}
					<View style={styles.checkoutProgress}>
						<Text style={styles.checkoutProgressText}>
							{checkoutProgress.filter(p => p.hit).length} / {checkoutTargets.length} {strings.targets}
						</Text>
					</View>

					{checkoutCompleted && (
						<View style={styles.checkoutSuccess}>
							<MaterialIcons name='celebration' size={32} color='#4CAF50' />
							<Text style={styles.checkoutSuccessText}>{strings.checkoutSuccess}</Text>
						</View>
					)}
				</ScrollView>
			) : null}

			{/* Hit/Miss Buttons */}
			{sessionStarted && trainingMode === 'target' && (
				<View style={styles.actionButtons}>
					<Pressable style={[styles.actionButton, styles.hitButton]} onPress={() => handleResult(true)}>
						<MaterialIcons name='check-circle' size={24} color='#fff' />
						<Text style={styles.buttonText}>{strings.hit}</Text>
					</Pressable>

					<Pressable style={[styles.actionButton, styles.missButton]} onPress={() => handleResult(false)}>
						<MaterialIcons name='cancel' size={24} color='#fff' />
						<Text style={styles.buttonText}>{strings.miss}</Text>
					</Pressable>
				</View>
			)}

			{/* Checkout Practice Buttons */}
			{sessionStarted && trainingMode === 'checkout' && currentCheckout && checkoutTargets.length > 0 && (
				<View style={styles.checkoutActionButtons}>
					{checkoutTargets.map((target, index) => {
						const isHit = checkoutProgress.some(p => p.target === target && p.hit);
						const isMissed = checkoutProgress.some(p => p.target === target && !p.hit);

						if (isHit || isMissed) return null; // Skip completed targets

						return (
							<View key={index} style={styles.checkoutTargetButton}>
								<Text style={styles.checkoutTargetButtonText}>{target}</Text>
								<View style={styles.checkoutTargetButtonActions}>
									<Pressable
										style={[styles.checkoutActionButton, styles.checkoutHitButton]}
										onPress={() => handleCheckoutResult(target, true)}>
										<MaterialIcons name='check-circle' size={20} color='#fff' />
										<Text style={styles.checkoutActionButtonText}>{strings.hit}</Text>
									</Pressable>
									<Pressable
										style={[styles.checkoutActionButton, styles.checkoutMissButton]}
										onPress={() => handleCheckoutResult(target, false)}>
										<MaterialIcons name='cancel' size={20} color='#fff' />
										<Text style={styles.checkoutActionButtonText}>{strings.miss}</Text>
									</Pressable>
								</View>
							</View>
						);
					})}

					{(checkoutCompleted || allTargetsAttempted) && (
						<View style={styles.checkoutActionButtons}>
							{remainingScore !== null && (
								<Pressable style={[styles.checkoutActionButton, styles.retryCheckoutButton]} onPress={retryCheckout}>
									<MaterialIcons name='refresh' size={20} color='#fff' />
									<Text style={styles.checkoutActionButtonText}>{strings.retryCheckout}</Text>
								</Pressable>
							)}
							<Pressable style={[styles.checkoutActionButton, styles.nextCheckoutButton]} onPress={generateCheckout}>
								<MaterialIcons name='arrow-forward' size={20} color='#fff' />
								<Text style={styles.checkoutActionButtonText}>{strings.nextCheckout}</Text>
							</Pressable>
						</View>
					)}
				</View>
			)}

			{/* Session Statistics */}
			{sessionStarted && (
				<View style={styles.statsSection}>
					<Text style={[styles.statsTitle, trainingMode === 'checkout' && styles.checkoutStatsTitle]}>
						{trainingMode === 'checkout' ? strings.checkoutStats : strings.sessionStats}
					</Text>
					{trainingMode === 'target' ? (
						<View style={styles.statsGrid}>
							<View style={styles.statItem}>
								<Text style={styles.statValue}>{sessionStats.targets}</Text>
								<Text style={styles.statLabel}>{strings.targets}</Text>
							</View>
							<View style={styles.statItem}>
								<Text style={styles.statValue}>{sessionStats.hits}</Text>
								<Text style={styles.statLabel}>{strings.hits}</Text>
							</View>
							<View style={styles.statItem}>
								<Text style={styles.statValue}>{sessionStats.misses}</Text>
								<Text style={styles.statLabel}>{strings.misses}</Text>
							</View>
							<View style={styles.statItem}>
								<Text style={styles.statValue}>{successRate}%</Text>
								<Text style={styles.statLabel}>{strings.successRate}</Text>
							</View>
						</View>
					) : (
						<View style={styles.checkoutStatsGrid}>
							<View style={styles.checkoutStatItem}>
								<Text style={styles.checkoutStatValue}>{checkoutStats.totalCheckouts}</Text>
								<Text style={styles.checkoutStatLabel}>{strings.checkoutAttempts}</Text>
							</View>
							<View style={styles.checkoutStatItem}>
								<Text style={styles.checkoutStatValue}>{checkoutStats.completedCheckouts}</Text>
								<Text style={styles.checkoutStatLabel}>{strings.checkoutComplete}</Text>
							</View>
							<View style={styles.checkoutStatItem}>
								<Text style={styles.checkoutStatValue}>
									{checkoutStats.totalTargets > 0
										? Math.round((checkoutStats.hitTargets / checkoutStats.totalTargets) * 100)
										: 0}
									%
								</Text>
								<Text style={styles.checkoutStatLabel}>{strings.successRate}</Text>
							</View>
						</View>
					)}
					<Text style={styles.durationText}>
						{strings.duration}: {Math.floor(sessionDuration / 60)}:{String(sessionDuration % 60).padStart(2, '0')}
					</Text>
				</View>
			)}

			{/* Control Buttons */}
			{sessionStarted && (
				<View style={styles.controlButtons}>
					{trainingMode === 'target' ? (
						<Pressable style={styles.controlButton} onPress={generateTarget}>
							<MaterialIcons name='refresh' size={20} color='#8AB4F8' />
							<Text style={styles.controlButtonText}>{strings.newTarget}</Text>
						</Pressable>
					) : (
						<Pressable style={styles.controlButton} onPress={generateCheckout}>
							<MaterialIcons name='refresh' size={20} color='#8AB4F8' />
							<Text style={styles.controlButtonText}>{strings.nextCheckout}</Text>
						</Pressable>
					)}

					<Pressable
						style={styles.controlButton}
						onPress={saveSession}
						disabled={
							(trainingMode === 'target' && sessionStats.targets === 0) ||
							(trainingMode === 'checkout' && checkoutStats.totalCheckouts === 0)
						}>
						<MaterialIcons name='save' size={20} color='#4CAF50' />
						<Text style={styles.controlButtonText}>{strings.saveSession}</Text>
					</Pressable>

					<Pressable style={styles.controlButton} onPress={resetSession}>
						<MaterialIcons name='restart-alt' size={20} color='#B00020' />
						<Text style={styles.controlButtonText}>{strings.resetSession}</Text>
					</Pressable>
				</View>
			)}

			{/* Training sessions are now visible in the Statistics tab */}

			{/* Custom Modal */}
			<Modal visible={showModal} transparent={true} animationType='fade' onRequestClose={() => setShowModal(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>{modalConfig?.title}</Text>
						<Text style={styles.modalMessage}>{modalConfig?.message}</Text>
						<View style={styles.modalButtons}>
							{modalConfig?.buttons.map((button, index) => (
								<Pressable
									key={index}
									style={[
										styles.modalButton,
										button.style === 'destructive' && styles.modalButtonDestructive,
										button.style === 'cancel' && styles.modalButtonCancel,
									]}
									onPress={button.onPress}>
									<Text
										style={[
											styles.modalButtonText,
											button.style === 'destructive' && styles.modalButtonTextDestructive,
											button.style === 'cancel' && styles.modalButtonTextCancel,
										]}>
										{button.text}
									</Text>
								</Pressable>
							))}
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
		padding: 20,
	},

	modeSelector: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		padding: 20,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: '#333',
	},
	modeSelectorTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#8AB4F8',
		textAlign: 'center',
		marginBottom: 16,
	},
	modeButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
	},
	modeButton: {
		flex: 1,
		backgroundColor: '#333',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#555',
		alignItems: 'center',
	},
	modeButtonActive: {
		backgroundColor: '#8AB4F8',
		borderColor: '#8AB4F8',
	},
	modeButtonText: {
		color: '#ccc',
		fontSize: 14,
		fontWeight: '500',
	},
	modeButtonTextActive: {
		color: '#fff',
		fontWeight: 'bold',
	},

	checkoutSection: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		marginBottom: 20,
		borderWidth: 2,
		borderColor: '#FF6B35', // Orange color to differentiate from target training
		maxHeight: 400, // Limit height to make it scrollable
	},
	checkoutSectionContent: {
		padding: 20,
		alignItems: 'center',
		minHeight: 300, // Ensure minimum height for content
	},
	checkoutLabel: {
		fontSize: 18,
		color: '#ccc',
		marginBottom: 8,
	},
	checkoutScore: {
		fontSize: 42,
		fontWeight: 'bold',
		color: '#FF6B35', // Orange color to differentiate
		marginBottom: 12,
	},
	checkoutRemainingScore: {
		fontSize: 14,
		color: '#FF6B35',
		marginBottom: 12,
		fontWeight: '600',
		textAlign: 'center',
		lineHeight: 18,
	},
	checkoutInstructions: {
		fontSize: 14,
		color: '#ccc',
		textAlign: 'center',
		marginBottom: 16,
	},

	checkoutTargets: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 6,
		marginBottom: 12,
		maxWidth: '100%',
	},
	checkoutTargetChip: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#333',
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#555',
		gap: 4,
		marginBottom: 4,
	},
	checkoutTargetHit: {
		backgroundColor: '#4CAF50',
		borderColor: '#4CAF50',
	},
	checkoutTargetMissed: {
		backgroundColor: '#B00020',
		borderColor: '#B00020',
	},
	checkoutTargetText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '500',
	},
	checkoutSuccess: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FF6B35', // Orange to match checkout theme
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 25,
		gap: 12,
	},
	checkoutSuccessText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},

	checkoutProgress: {
		marginTop: 8,
		alignItems: 'center',
	},
	checkoutProgressText: {
		color: '#ccc',
		fontSize: 14,
		fontWeight: '500',
	},

	checkoutActionButtons: {
		marginBottom: 16,
		gap: 12,
	},
	checkoutTargetButton: {
		backgroundColor: '#1A1A1A',
		borderRadius: 10,
		padding: 12,
		borderWidth: 1,
		borderColor: '#333',
		alignItems: 'center',
	},
	checkoutTargetButtonText: {
		color: '#FF6B35', // Orange to match checkout theme
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	checkoutTargetButtonActions: {
		flexDirection: 'row',
		gap: 8,
	},
	checkoutActionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
		gap: 8,
	},
	checkoutHitButton: {
		backgroundColor: '#4CAF50',
	},
	checkoutMissButton: {
		backgroundColor: '#B00020',
	},
	nextCheckoutButton: {
		backgroundColor: '#FF6B35', // Orange to match checkout theme
	},
	retryCheckoutButton: {
		backgroundColor: '#8AB4F8', // Blue to differentiate from next checkout
	},
	checkoutActionButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '500',
	},

	startSection: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		padding: 24,
		alignItems: 'center',
		marginBottom: 20,
		borderWidth: 2,
		borderColor: '#8AB4F8',
	},
	startTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#8AB4F8',
		marginBottom: 12,
		textAlign: 'center',
	},
	startSubtitle: {
		fontSize: 14,
		color: '#ccc',
		textAlign: 'center',
		marginBottom: 20,
	},
	startButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#4CAF50',
		paddingVertical: 14,
		paddingHorizontal: 24,
		borderRadius: 12,
		minWidth: 180,
		justifyContent: 'center',
	},
	startButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
		marginLeft: 10,
	},

	targetSection: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		padding: 20,
		alignItems: 'center',
		marginBottom: 20,
		borderWidth: 2,
		borderColor: '#8AB4F8',
	},
	targetLabel: {
		fontSize: 16,
		color: '#ccc',
		marginBottom: 16,
	},
	targetDisplay: {
		alignItems: 'center',
		marginBottom: 16,
	},
	targetValue: {
		fontSize: 40,
		fontWeight: 'bold',
		color: '#8AB4F8',
		marginBottom: 6,
	},
	singleTarget: {
		color: '#8AB4F8', // Blue for single targets (previous color)
	},
	doubleTarget: {
		color: '#8AB4F8', // Blue for double targets (previous color)
	},
	tripleTarget: {
		color: '#8AB4F8', // Blue for triple targets (previous color)
	},
	targetPoints: {
		fontSize: 16,
		color: '#8AB4F8',
		fontWeight: '600',
	},
	targetInstruction: {
		fontSize: 16,
		color: '#fff',
		fontWeight: '600',
	},
	actionButtons: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 20,
	},
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 10,
		minWidth: 100,
		justifyContent: 'center',
	},
	hitButton: {
		backgroundColor: '#4CAF50',
	},
	missButton: {
		backgroundColor: '#B00020',
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
		marginLeft: 6,
	},
	statsSection: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		padding: 16,
		marginBottom: 20,
	},
	statsTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#8AB4F8',
		textAlign: 'center',
		marginBottom: 16,
	},
	statsGrid: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 16,
	},
	statItem: {
		alignItems: 'center',
	},
	statValue: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#fff',
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 14,
		color: '#ccc',
	},

	// Checkout-specific stats styles
	checkoutStatsGrid: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 16,
	},
	checkoutStatItem: {
		alignItems: 'center',
	},
	checkoutStatValue: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#FF6B35', // Orange to match checkout theme
		marginBottom: 3,
	},
	checkoutStatLabel: {
		fontSize: 12,
		color: '#ccc',
		fontWeight: '500',
	},

	checkoutStatsTitle: {
		fontSize: 18,
		color: '#FF6B35', // Orange to match checkout theme
	},
	durationText: {
		textAlign: 'center',
		color: '#ccc',
		fontSize: 18,
	},
	controlButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 8,
		paddingHorizontal: 10,
	},
	controlButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#444',
		backgroundColor: 'transparent',
		flex: 1,
		justifyContent: 'center',
	},
	controlButtonText: {
		color: '#8AB4F8',
		fontSize: 12,
		fontWeight: '600',
		marginLeft: 6,
	},
	resetText: {
		color: '#B00020',
	},
	saveButton: {
		borderColor: '#4CAF50',
	},
	saveText: {
		color: '#4CAF50',
	},

	// Modal styles
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modalContent: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		padding: 20,
		width: '100%',
		maxWidth: 380,
		borderWidth: 1,
		borderColor: '#333',
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#fff',
		textAlign: 'center',
		marginBottom: 12,
	},
	modalMessage: {
		fontSize: 12,
		color: '#ccc',
		textAlign: 'center',
		marginBottom: 20,
		lineHeight: 18,
		paddingHorizontal: 15,
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 16,
	},
	modalButton: {
		flex: 1,
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: 8,
		backgroundColor: '#8AB4F8',
		alignItems: 'center',
		justifyContent: 'center',
	},
	modalButtonDestructive: {
		backgroundColor: '#B00020',
	},
	modalButtonCancel: {
		backgroundColor: '#666',
	},
	modalButtonText: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '600',
		textAlign: 'center',
		flexShrink: 1,
	},
	modalButtonTextDestructive: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '600',
		textAlign: 'center',
		flexShrink: 1,
	},
	modalButtonTextCancel: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '600',
		textAlign: 'center',
		flexShrink: 1,
	},
	// Debug styles removed - training sessions now appear in Statistics tab
});
