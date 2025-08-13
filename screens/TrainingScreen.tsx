import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { saveTrainingSession, TrainingSession } from '../database/trainingRepository';
import { useLanguage } from '../lib/LanguageContext';

type TargetType = 'single' | 'double' | 'triple';

interface Target {
	value: number;
	type: TargetType;
	display: string;
	points: number;
}

export default function TrainingScreen() {
	const { strings } = useLanguage();
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

	// Calculate success rate
	const successRate = useMemo(
		() => (sessionStats.targets > 0 ? Math.round((sessionStats.hits / sessionStats.targets) * 100) : 0),
		[sessionStats.targets, sessionStats.hits]
	);

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
		if (!sessionStarted) return;

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
		setSessionStats(initialSessionStats);
		setTargetsPracticed([]);
		setTargetResults([]);
		setSessionDuration(0);
		generateTarget();
	}, [initialSessionStats, generateTarget]);

	// Save training session
	const saveSession = async () => {
		if (sessionStats.targets === 0) return;

		const session: TrainingSession = {
			date: new Date().toISOString(),
			targets: sessionStats.targets,
			hits: sessionStats.hits,
			misses: sessionStats.misses,
			duration: Math.floor((Date.now() - sessionStats.startTime) / 1000),
			successRate: successRate,
			targetsPracticed,
			targetResults,
		};

		try {
			const sessionId = await saveTrainingSession(session);

			Alert.alert(
				strings.sessionSaved || 'Session Saved',
				strings.sessionSavedMessage || 'Your training session has been saved!',
				[{ text: strings.ok || 'OK' }]
			);
		} catch (error) {
			console.error('Failed to save training session:', error);
			Alert.alert(strings.saveError || 'Save Error', strings.saveErrorMsg || 'Failed to save training session', [
				{ text: strings.ok || 'OK' },
			]);
		}
	};

	// Reset session
	const resetSession = () => {
		Alert.alert(
			strings.resetSession || 'Reset Session',
			strings.resetSessionConfirm || 'Are you sure you want to reset this training session?',
			[
				{ text: strings.cancel || 'Cancel', style: 'cancel' },
				{
					text: strings.saveAndReset || 'Save & Reset',
					style: 'default',
					onPress: async () => {
						await saveSession();
						resetSessionData();
					},
				},
				{
					text: strings.reset || 'Reset',
					style: 'destructive',
					onPress: () => {
						resetSessionData();
					},
				},
			]
		);
	};

	// Reset session data
	const resetSessionData = useCallback(() => {
		setSessionStarted(false);
		setSessionStats(initialSessionStats);
		setTargetsPracticed([]);
		setTargetResults([]);
		setCurrentTarget(null);
		setSessionDuration(0);
	}, [initialSessionStats]);

	// Note: Debug functions removed - training sessions now appear in Statistics tab

	return (
		<View style={styles.container}>
			{/* Current Target Display */}
			{!sessionStarted ? (
				<View style={styles.startSection}>
					<Text style={styles.startTitle}>{strings.trainingMode || 'Training Mode'}</Text>
					<Text style={styles.startSubtitle}>{strings.practiceTargets || 'Practice your targets'}</Text>
					<Pressable style={styles.startButton} onPress={startSession}>
						<MaterialIcons name='play-arrow' size={32} color='#fff' />
						<Text style={styles.startButtonText}>{strings.startGame || 'Start Training'}</Text>
					</Pressable>
				</View>
			) : currentTarget ? (
				<View style={styles.targetSection}>
					<Text style={styles.targetLabel}>{strings.currentTarget || 'Current Target'}</Text>
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
						<Text style={styles.targetPoints}>{currentTarget.points} pts</Text>
					</View>
					<Text style={styles.targetInstruction}>{strings.hitTarget || 'Hit this target!'}</Text>
				</View>
			) : null}

			{/* Hit/Miss Buttons */}
			{sessionStarted && (
				<View style={styles.actionButtons}>
					<Pressable style={[styles.actionButton, styles.hitButton]} onPress={() => handleResult(true)}>
						<MaterialIcons name='check-circle' size={24} color='#fff' />
						<Text style={styles.buttonText}>{strings.hit || 'Hit!'}</Text>
					</Pressable>

					<Pressable style={[styles.actionButton, styles.missButton]} onPress={() => handleResult(false)}>
						<MaterialIcons name='cancel' size={24} color='#fff' />
						<Text style={styles.buttonText}>{strings.miss || 'Miss'}</Text>
					</Pressable>
				</View>
			)}

			{/* Session Statistics */}
			{sessionStarted && (
				<View style={styles.statsSection}>
					<Text style={styles.statsTitle}>{strings.sessionStats || 'Session Stats'}</Text>
					<View style={styles.statsGrid}>
						<View style={styles.statItem}>
							<Text style={styles.statValue}>{sessionStats.targets}</Text>
							<Text style={styles.statLabel}>{strings.targets || 'Targets'}</Text>
						</View>
						<View style={styles.statItem}>
							<Text style={styles.statValue}>{sessionStats.hits}</Text>
							<Text style={styles.statLabel}>{strings.hits || 'Hits'}</Text>
						</View>
						<View style={styles.statItem}>
							<Text style={styles.statValue}>{sessionStats.misses}</Text>
							<Text style={styles.statLabel}>{strings.misses || 'Misses'}</Text>
						</View>
						<View style={styles.statItem}>
							<Text style={styles.statValue}>{successRate}%</Text>
							<Text style={styles.statLabel}>{strings.successRate || 'Success'}</Text>
						</View>
					</View>
					<Text style={styles.durationText}>
						{strings.duration || 'Duration'}: {Math.floor(sessionDuration / 60)}:
						{String(sessionDuration % 60).padStart(2, '0')}
					</Text>
				</View>
			)}

			{/* Control Buttons */}
			{sessionStarted && (
				<View style={styles.controlButtons}>
					<Pressable style={styles.controlButton} onPress={generateTarget}>
						<MaterialIcons name='refresh' size={20} color='#8AB4F8' />
						<Text style={styles.controlButtonText}>{strings.newTarget || 'New Target'}</Text>
					</Pressable>

					<Pressable
						style={[styles.controlButton, styles.saveButton]}
						onPress={saveSession}
						disabled={sessionStats.targets === 0}>
						<MaterialIcons name='save' size={20} color='#4CAF50' />
						<Text style={[styles.controlButtonText, styles.saveText]}>{strings.saveSession || 'Save Session'}</Text>
					</Pressable>

					<Pressable style={styles.controlButton} onPress={resetSession}>
						<MaterialIcons name='restart-alt' size={20} color='#B00020' />
						<Text style={[styles.controlButtonText, styles.resetText]}>{strings.resetSession || 'Reset Session'}</Text>
					</Pressable>
				</View>
			)}

			{/* Training sessions are now visible in the Statistics tab */}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
		padding: 20,
	},

	startSection: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		padding: 40,
		alignItems: 'center',
		marginBottom: 30,
		borderWidth: 2,
		borderColor: '#8AB4F8',
	},
	startTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#8AB4F8',
		marginBottom: 16,
		textAlign: 'center',
	},
	startSubtitle: {
		fontSize: 16,
		color: '#ccc',
		textAlign: 'center',
		marginBottom: 30,
	},
	startButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#4CAF50',
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
		minWidth: 200,
		justifyContent: 'center',
	},
	startButtonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '600',
		marginLeft: 12,
	},

	targetSection: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		padding: 24,
		alignItems: 'center',
		marginBottom: 30,
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
		fontSize: 48,
		fontWeight: 'bold',
		color: '#8AB4F8',
		marginBottom: 8,
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
		fontSize: 18,
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
		marginBottom: 30,
	},
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
		minWidth: 120,
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
		fontSize: 18,
		fontWeight: '600',
		marginLeft: 8,
	},
	statsSection: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		padding: 20,
		marginBottom: 30,
	},
	statsTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#8AB4F8',
		textAlign: 'center',
		marginBottom: 20,
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
	durationText: {
		textAlign: 'center',
		color: '#ccc',
		fontSize: 16,
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
	// Debug styles removed - training sessions now appear in Statistics tab
});
