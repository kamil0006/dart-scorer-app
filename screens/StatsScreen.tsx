import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useState } from 'react';
import { Dimensions, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { deleteStatById, getComprehensiveStats } from '../database/statsRepository';
import { getTrainingSessions, getTrainingStats } from '../database/trainingRepository';
import { clearGames, db, fetchGames } from '../lib/db';
import { useLanguage } from '../lib/LanguageContext';
import { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

export default function StatsScreen() {
	const [games, setGames] = useState<any[]>([]);
	const [comprehensiveStats, setComprehensiveStats] = useState<any>(null);
	const [trainingStats, setTrainingStats] = useState<any>(null);
	const [showSummary, setShowSummary] = useState(false);
	const [showTrainingDetails, setShowTrainingDetails] = useState(false);
	const navigation = useNavigation<Nav>();
	const { strings } = useLanguage();

	// Custom modal state for delete confirmations
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleteModalConfig, setDeleteModalConfig] = useState<{
		title: string;
		message: string;
		onConfirm: () => void;
	} | null>(null);

	/* odczyt listy za każdym wejściem */
	useFocusEffect(
		useCallback(() => {
			try {
				const fetchedGames = fetchGames();
				setGames(fetchedGames);
				setComprehensiveStats(getComprehensiveStats());

				// Fetch training statistics
				try {
					const trainingData = getTrainingStats();
					setTrainingStats(trainingData);
				} catch (trainingError) {
					console.warn('Training stats error:', trainingError);
					setTrainingStats(null);
				}
			} catch (e) {
				console.warn('DB read error:', e);
			}
		}, [])
	);

	/* akcje UI */
	const showDeleteConfirmation = (config: { title: string; message: string; onConfirm: () => void }) => {
		setDeleteModalConfig(config);
		setShowDeleteModal(true);
	};

	const handleClearAll = () =>
		showDeleteConfirmation({
			title: strings.clearAllConfirm,
			message: strings.clearAllMessage,
			onConfirm: () => {
				clearGames();
				setGames([]);
				setComprehensiveStats(null);
				setShowDeleteModal(false);
			},
		});

	const handleDeleteOne = (id: number) =>
		showDeleteConfirmation({
			title: strings.deleteConfirm,
			message: strings.deleteConfirmMessage || 'Are you sure you want to delete this statistic?',
			onConfirm: () => {
				try {
					deleteStatById(id);
					setGames(prev => prev.filter(g => g.id !== id));
					setComprehensiveStats(getComprehensiveStats());
					setShowDeleteModal(false);
				} catch (e) {
					console.warn('Delete stat error:', e);
				}
			},
		});

	const handleDeleteTrainingSession = (id: number) =>
		showDeleteConfirmation({
			title: strings.deleteConfirm,
			message: strings.deleteConfirmMessage || 'Are you sure you want to delete this training session?',
			onConfirm: () => {
				try {
					db.runSync('DELETE FROM training_sessions WHERE id = ?', [id]);
					setTrainingStats(getTrainingStats());
					setShowDeleteModal(false);
				} catch (e) {
					console.warn('Delete training session error:', e);
				}
			},
		});

	/* statystyki zbiorcze */
	const played = games.length;
	const g501 = games.filter(g => g.start === 501).length;
	const g301 = played - g501;
	const bestAvg = Math.max(...games.map(g => g.avg3), 0).toFixed(1);
	const allDarts = games.reduce((s, g) => s + g.darts, 0);
	const allAvg = played ? ((games.reduce((s, g) => s + g.scored, 0) / allDarts) * 3).toFixed(1) : '0.0';
	const highestCheckout = Math.max(
		...games.map(g => {
			if (g.checkout && g.checkout !== 'null') {
				// Extract the highest value from checkout string (e.g., "T20 T20 Bull" -> 170)
				const checkoutValues = g.checkout.split(' ').map((shot: string) => {
					if (shot.startsWith('T')) return parseInt(shot.slice(1)) * 3;
					if (shot.startsWith('D')) return parseInt(shot.slice(1)) * 2;
					if (shot === 'Bull') return 50;
					if (shot === '25') return 25;
					return parseInt(shot) || 0;
				});
				return checkoutValues.reduce((sum: number, val: number) => sum + val, 0);
			}
			return 0;
		}),
		0
	);

	// Calculate 180s count
	const count180s = games.reduce((count, g) => {
		const turns = JSON.parse(g.turns);
		return count + turns.filter((turn: number) => turn === 180).length;
	}, 0);

	// Calculate forfeited games count
	const forfeitedGames = games.filter(g => g.forfeited === 1 || g.forfeited === true).length;
	const completedGames = played - forfeitedGames;

	// Enhanced statistics for different score ranges
	const scoreRanges = {
		'100+': 0,
		'120+': 0,
		'140+': 0,
		'160+': 0,
		'180': 0,
	};

	// Mode-specific statistics
	const modeStats = {
		simple: { games: 0, avg3: 0, bestAvg: 0, totalDarts: 0, totalScore: 0 },
		advanced: { games: 0, avg3: 0, bestAvg: 0, totalDarts: 0, totalScore: 0 },
	};

	// Calculate score ranges and mode statistics
	games.forEach(game => {
		const turns = JSON.parse(game.turns);
		const isAdvanced = game.hits && game.hits !== '[]' && game.hits !== 'null';

		// Count score ranges
		turns.forEach((turn: number) => {
			if (turn >= 100) scoreRanges['100+']++;
			if (turn >= 120) scoreRanges['120+']++;
			if (turn >= 140) scoreRanges['140+']++;
			if (turn >= 160) scoreRanges['160+']++;
			if (turn === 180) scoreRanges['180']++;
		});

		// Mode-specific calculations
		if (isAdvanced) {
			modeStats.advanced.games++;
			modeStats.advanced.totalDarts += game.darts;
			modeStats.advanced.totalScore += game.scored;
			if (game.avg3 > modeStats.advanced.bestAvg) {
				modeStats.advanced.bestAvg = game.avg3;
			}
		} else {
			modeStats.simple.games++;
			modeStats.simple.totalDarts += game.darts;
			modeStats.simple.totalScore += game.scored;
			if (game.avg3 > modeStats.simple.bestAvg) {
				modeStats.simple.bestAvg = game.avg3;
			}
		}
	});

	// Calculate mode averages
	if (modeStats.simple.games > 0) {
		modeStats.simple.avg3 = (modeStats.simple.totalScore / modeStats.simple.totalDarts) * 3;
	}
	if (modeStats.advanced.games > 0) {
		modeStats.advanced.avg3 = (modeStats.advanced.totalScore / modeStats.advanced.totalDarts) * 3;
	}

	/* render pojedynczej karty */
	const renderItem = ({ item }: { item: any }) => (
		<Swipeable
			overshootRight={false}
			renderRightActions={() => (
				<Pressable style={styles.deleteAction} onPress={() => handleDeleteOne(item.id)}>
					<View style={styles.deleteCircle}>
						<Ionicons name='trash' size={18} color='#fff' />
					</View>
				</Pressable>
			)}>
			<Pressable
				style={styles.card}
				onPress={() =>
					navigation.navigate('StatsDetail', {
						id: item.id,
						turns: JSON.parse(item.turns),
						avg3: item.avg3,
						date: item.date,
						start: item.start,
						forfeited: item.forfeited === 1 || item.forfeited === true,
					})
				}>
				<Text style={styles.avg}>{item.avg3.toFixed(1)}</Text>

				<View>
					<Text style={styles.date}>{item.date.slice(0, 10)}</Text>
				</View>

				<View style={styles.variant}>
					<Text style={styles.variantTxt}>{item.start}</Text>
					{item.hits && item.hits !== '[]' && item.hits !== 'null' && (
						<View style={styles.advancedIndicator}>
							<Text style={{ color: '#8AB4F8', fontSize: 8, fontWeight: 'bold' }}>A</Text>
						</View>
					)}
				</View>

				{item.forfeited === 1 || (item.forfeited === true && item.forfeitScore != null) ? (
					<View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
						<MaterialIcons name='flag' size={20} color='#B00020' />
						<Text style={{ color: '#B00020', fontWeight: 'bold', marginLeft: 4, fontSize: 13 }}>
							{item.forfeitScore} {strings.forfeitScoreLeft}
						</Text>
					</View>
				) : null}
			</Pressable>
		</Swipeable>
	);

	/* Summary Modal Component */
	const SummaryModal = () => (
		<Modal
			visible={showSummary}
			animationType='slide'
			presentationStyle='fullScreen'
			onRequestClose={() => setShowSummary(false)}>
			<View style={styles.modalContainer}>
				{/* Header with close button */}
				<View style={styles.modalHeader}>
					<Text style={styles.modalTitle}>{strings.summary}</Text>
					<Pressable style={styles.closeButton} onPress={() => setShowSummary(false)}>
						<Ionicons name='close' size={24} color='#fff' />
					</Pressable>
				</View>

				{/* Full screen summary content */}
				<ScrollView
					style={styles.modalContent}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.modalScrollContent}>
					<View style={styles.modalStatsGrid}>
						<Stat label={strings.games} value={played} icon={'sports-soccer'} />
						<Stat label={strings.bestAverage} value={bestAvg} icon={'star'} />
						<Stat label={strings.overallAverage} value={allAvg} icon={'insert-chart'} />
						<Stat label={strings.totalDarts} value={allDarts} icon={'gps-fixed'} />
						<Stat label={strings.highestFinish} value={highestCheckout} icon={'trending-up'} />
						<Stat label='180s' value={count180s} icon={'whatshot'} />
						<Stat label='501' value={g501} icon={'filter-5'} />
						<Stat label='301' value={g301} icon={'filter-3'} />
						{comprehensiveStats && (
							<>
								<Stat
									label={strings.successRate}
									value={`${comprehensiveStats.completion.successRate}%`}
									icon={'check-circle'}
								/>
								<Stat label={strings.avgLength} value={comprehensiveStats.gameLength.average} icon={'schedule'} />
								<Stat label={strings.modeSimple} value={comprehensiveStats.modeStats.simple} icon={'layers'} />
								<Stat
									label={strings.modeAdvanced}
									value={comprehensiveStats.modeStats.advanced}
									icon={'layers-clear'}
								/>
							</>
						)}

						{/* Training Statistics */}
						{trainingStats && trainingStats.totalSessions > 0 && (
							<>
								<Stat label={strings.trainingSessions} value={trainingStats.totalSessions} icon={'school'} />
								<Stat
									label={strings.trainingSuccess}
									value={`${trainingStats.overallSuccessRate}%`}
									icon={'check-circle'}
								/>
								<Stat label={strings.totalTargets} value={trainingStats.totalTargets} icon={'gps-fixed'} />
								<Stat label={strings.bestSession} value={`${trainingStats.bestSession?.successRate}%`} icon={'star'} />
							</>
						)}
					</View>

					{/* Additional detailed stats */}
					<View style={styles.detailedStats}>
						<Text style={styles.detailedStatsTitle}>{strings.detailedStats}</Text>

						{/* Game distribution */}
						<View style={styles.statRow}>
							<Text style={styles.statRowLabel}>{strings.gameDistribution}:</Text>
							<View style={styles.gameDistribution}>
								<View style={styles.distributionItem}>
									<Text style={styles.distributionValue}>{g501}</Text>
									<Text style={styles.distributionLabel}>501</Text>
								</View>
								<View style={styles.distributionItem}>
									<Text style={styles.distributionValue}>{g301}</Text>
									<Text style={styles.distributionLabel}>301</Text>
								</View>
							</View>
						</View>

						{/* Game completion stats */}
						<View style={styles.statRow}>
							<Text style={styles.statRowLabel}>{strings.gameCompletion}:</Text>
							<View style={styles.completionStats}>
								<View style={styles.completionItem}>
									<Text style={styles.completionValue}>{completedGames}</Text>
									<Text style={styles.completionLabel}>{strings.completed}</Text>
								</View>
								<View style={styles.completionItem}>
									<Text style={styles.completionValue}>{forfeitedGames}</Text>
									<Text style={styles.completionLabel}>{strings.forfeited}</Text>
								</View>
								<View style={styles.completionItem}>
									<Text style={styles.completionValue}>
										{played > 0 ? Math.round((completedGames / played) * 100) : 0}%
									</Text>
									<Text style={styles.completionLabel}>{strings.successRate}</Text>
								</View>
							</View>
						</View>

						{/* Score Range Performance */}
						<View style={styles.statRow}>
							<Text style={styles.statRowLabel}>{strings.scoreRanges}:</Text>
							<View style={styles.scoreRangesGrid}>
								<View style={styles.scoreRangeItem}>
									<Text style={styles.scoreRangeValue}>{scoreRanges['100+']}</Text>
									<Text style={styles.scoreRangeLabel}>{strings.score100plus}</Text>
								</View>
								<View style={styles.scoreRangeItem}>
									<Text style={styles.scoreRangeValue}>{scoreRanges['120+']}</Text>
									<Text style={styles.scoreRangeLabel}>{strings.score120plus}</Text>
								</View>
								<View style={styles.scoreRangeItem}>
									<Text style={styles.scoreRangeValue}>{scoreRanges['140+']}</Text>
									<Text style={styles.scoreRangeLabel}>{strings.score140plus}</Text>
								</View>
								<View style={styles.scoreRangeItem}>
									<Text style={styles.scoreRangeValue}>{scoreRanges['160+']}</Text>
									<Text style={styles.scoreRangeLabel}>{strings.score160plus}</Text>
								</View>
								<View style={styles.scoreRangeItem}>
									<Text style={styles.scoreRangeValue}>{scoreRanges['180']}</Text>
									<Text style={styles.scoreRangeLabel}>{strings.score180}</Text>
								</View>
							</View>
						</View>

						{/* Mode-specific Performance */}
						<View style={styles.statRow}>
							<Text style={styles.statRowLabel}>{strings.modeSimple}:</Text>
							<Text style={styles.statRowValue}>
								{strings.games}: {modeStats.simple.games} | {strings.average}: {modeStats.simple.avg3.toFixed(1)} |{' '}
								{strings.best}: {modeStats.simple.bestAvg.toFixed(1)}
							</Text>
						</View>

						<View style={styles.statRow}>
							<Text style={styles.statRowLabel}>{strings.modeAdvanced}:</Text>
							<Text style={styles.statRowValue}>
								{strings.games}: {modeStats.advanced.games} | {strings.average}: {modeStats.advanced.avg3.toFixed(1)} |{' '}
								{strings.best}: {modeStats.advanced.bestAvg.toFixed(1)}
							</Text>
						</View>

						{/* Performance metrics */}
						<View style={styles.statRow}>
							<Text style={styles.statRowLabel}>{strings.performance}:</Text>
							<Text style={styles.statRowValue}>
								{strings.bestAverage}: {bestAvg} | {strings.overallAverage}: {allAvg}
							</Text>
						</View>

						{/* Achievements */}
						<View style={styles.statRow}>
							<Text style={styles.statRowLabel}>{strings.achievements}:</Text>
							<Text style={styles.statRowValue}>
								{strings.highestFinish}: {highestCheckout} | 180s: {count180s}
							</Text>
						</View>

						{/* Enhanced Statistics */}
						{comprehensiveStats && (
							<View style={styles.enhancedStatsSection}>
								<Text style={styles.enhancedStatsTitle}>{strings.overallPerformance}</Text>

								<View style={styles.statRow}>
									<Text style={styles.statRowLabel}>{strings.gameLength}:</Text>
									<View style={styles.completionStats}>
										<View style={styles.completionItem}>
											<Text style={styles.completionValue}>{comprehensiveStats.gameLength.shortest}</Text>
											<Text style={styles.completionLabel}>{strings.shortest}</Text>
										</View>
										<View style={styles.completionItem}>
											<Text style={styles.completionValue}>{comprehensiveStats.gameLength.longest}</Text>
											<Text style={styles.completionLabel}>{strings.longest}</Text>
										</View>
										<View style={styles.completionItem}>
											<Text style={styles.completionValue}>{comprehensiveStats.gameLength.average}</Text>
											<Text style={styles.completionLabel}>{strings.avgLength}</Text>
										</View>
									</View>
								</View>

								<View style={styles.statRow}>
									<Text style={styles.statRowLabel}>{strings.modeComparison}:</Text>
									<View style={styles.gameDistribution}>
										<View style={styles.distributionItem}>
											<Text style={styles.distributionValue}>{comprehensiveStats.modeStats.simple}</Text>
											<Text style={styles.distributionLabel}>{strings.modeSimple}</Text>
										</View>
										<View style={styles.distributionItem}>
											<Text style={styles.distributionValue}>{comprehensiveStats.modeStats.advanced}</Text>
											<Text style={styles.distributionLabel}>{strings.modeAdvanced}</Text>
										</View>
									</View>
								</View>
							</View>
						)}

						{/* Recent Trends - Smaller Section */}
						{comprehensiveStats && (
							<View style={styles.recentTrendsSection}>
								<Text style={styles.recentTrendsTitle}>{strings.recentTrends}</Text>
								<View style={styles.recentTrendsGrid}>
									<View style={styles.recentTrendsItem}>
										<Text style={styles.recentTrendsLabel}>{strings.last5Games}</Text>
										<Text style={styles.recentTrendsValue}>
											{comprehensiveStats.recentTrends.last5Games.length > 0
												? comprehensiveStats.recentTrends.last5Games.filter((g: any) => g.completed).length +
												  '/' +
												  comprehensiveStats.recentTrends.last5Games.length
												: '0/0'}
										</Text>
									</View>
									<View style={styles.recentTrendsItem}>
										<Text style={styles.recentTrendsLabel}>{strings.last10Games}</Text>
										<Text style={styles.recentTrendsValue}>
											{comprehensiveStats.recentTrends.last10Games.length > 0
												? comprehensiveStats.recentTrends.last10Games.filter((g: any) => g.completed).length +
												  '/' +
												  comprehensiveStats.recentTrends.last10Games.length
												: '0/0'}
										</Text>
									</View>
								</View>
							</View>
						)}
					</View>
				</ScrollView>
			</View>
		</Modal>
	);

	/* ---------- JSX ---------- */
	return (
		<View style={styles.container}>
			{/* Collapsible Summary Button */}
			<Pressable style={styles.summaryButton} onPress={() => setShowSummary(true)}>
				<MaterialIcons name='analytics' size={24} color='#8AB4F8' />
				<Text style={styles.summaryButtonText}>{strings.showSummary}</Text>
				<Ionicons name='chevron-up' size={20} color='#8AB4F8' />
			</Pressable>

			{/* Collapsible Training Sessions Section */}
			{trainingStats && trainingStats.totalSessions > 0 && (
				<View style={styles.trainingSection}>
					<Pressable style={styles.trainingHeader} onPress={() => setShowTrainingDetails(!showTrainingDetails)}>
						<View style={styles.trainingHeaderContent}>
							<MaterialIcons name='school' size={24} color='#8AB4F8' />
							<Text style={styles.trainingHeaderTitle}>{strings.trainingSessions}</Text>
							<Text style={styles.trainingHeaderStats}>
								{trainingStats.totalSessions} {strings.games} •{' '}
								<Text
									style={[trainingStats.overallSuccessRate >= 50 ? styles.successRateGood : styles.successRatePoor]}>
									{trainingStats.overallSuccessRate}%
								</Text>{' '}
								{strings.successRate}
							</Text>
						</View>
						<MaterialIcons name={showTrainingDetails ? 'expand-less' : 'expand-more'} size={24} color='#8AB4F8' />
					</Pressable>

					{/* Training Sessions Details */}
					{showTrainingDetails && (
						<View style={styles.trainingDetails}>
							<FlatList
								data={getTrainingSessions().slice(0, 10)} // Show last 10 training sessions
								keyExtractor={session => session.id?.toString() || Math.random().toString()}
								showsVerticalScrollIndicator={false}
								renderItem={({ item }) => (
									<Swipeable
										renderRightActions={() => (
											<Pressable style={styles.deleteAction} onPress={() => handleDeleteTrainingSession(item.id!)}>
												<View style={styles.deleteCircle}>
													<Ionicons name='trash' size={18} color='#fff' />
												</View>
											</Pressable>
										)}>
										<View style={styles.trainingSessionCard}>
											<Pressable
												style={styles.trainingSessionContent}
												onPress={() => setShowTrainingDetails(false)} // Close when session selected
											>
												<View style={styles.trainingSessionHeader}>
													<Text
														style={[
															styles.trainingSessionDate,
															item.trainingMode === 'checkout' && styles.checkoutModeDate,
														]}>
														{item.date.slice(0, 10)}
													</Text>
													<Text style={styles.trainingSessionTime}>
														{new Date(item.date).toLocaleTimeString().slice(0, 5)}
													</Text>
													<Text
														style={[
															styles.trainingSessionSuccess,
															item.successRate >= 50 ? styles.successRateGood : styles.successRatePoor,
														]}>
														{item.successRate}%
													</Text>
												</View>

												<View style={styles.trainingSessionStats}>
													<View style={styles.trainingStatItem}>
														<Text style={styles.trainingStatLabel}>{strings.targets}</Text>
														<Text style={styles.trainingStatValue}>{item.targets}</Text>
													</View>
													<View style={styles.trainingStatItem}>
														<Text style={styles.trainingStatLabel}>{strings.hits}</Text>
														<Text style={styles.trainingStatValue}>{item.hits}</Text>
													</View>
													<View style={styles.trainingStatItem}>
														<Text style={styles.trainingStatLabel}>{strings.misses}</Text>
														<Text style={[styles.trainingStatValue, styles.missedValue]}>{item.misses}</Text>
													</View>
													<View style={styles.trainingStatItem}>
														<Text style={styles.trainingStatLabel}>{strings.duration}</Text>
														<Text style={styles.trainingStatValue}>{Math.floor(item.duration / 60)}m</Text>
													</View>
												</View>

												{/* Targets Practiced */}
												{item.targetsPracticed && item.targetsPracticed.length > 0 && (
													<View style={styles.targetsPracticedSection}>
														<Text
															style={[
																styles.targetsPracticedTitle,
																item.trainingMode === 'checkout' && styles.checkoutModeTitle,
															]}>
															{strings.targetsPracticed}:
														</Text>
														<View style={styles.targetsPracticedGrid}>
															{item.targetsPracticed.map((target, index) => {
																// Optimize target type detection
																const targetType = target.startsWith('D')
																	? 'double'
																	: target.startsWith('T')
																	? 'triple'
																	: 'single';

																// Check if this specific target was missed
																const targetResult = item.targetResults?.find(result => result.target === target);
																const wasMissed = targetResult ? !targetResult.hit : false;

																// Determine chip style based on type and result
																const chipStyle = [
																	styles.targetChip,
																	// For checkout mode: hits are orange, misses are red (same as target mode)
																	item.trainingMode === 'checkout' &&
																		(wasMissed ? styles.checkoutModeChipMissed : styles.checkoutModeChip),
																	// For target mode: use existing blue/red styling
																	item.trainingMode !== 'checkout' &&
																		targetType === 'single' &&
																		(wasMissed ? styles.singleChipMissed : styles.singleChip),
																	item.trainingMode !== 'checkout' &&
																		targetType === 'double' &&
																		(wasMissed ? styles.doubleChipMissed : styles.doubleChip),
																	item.trainingMode !== 'checkout' &&
																		targetType === 'triple' &&
																		(wasMissed ? styles.tripleChipMissed : styles.tripleChip),
																];

																return (
																	<View key={`${target}-${index}`} style={chipStyle}>
																		<Text style={styles.targetChipText}>{target}</Text>
																	</View>
																);
															})}
														</View>
													</View>
												)}
											</Pressable>
										</View>
									</Swipeable>
								)}
							/>
						</View>
					)}
				</View>
			)}

			{/* Games List */}
			<FlatList
				data={games}
				keyExtractor={g => g.id.toString()}
				contentContainerStyle={{ paddingBottom: 80 }}
				renderItem={renderItem}
			/>

			{/* Custom Delete Modal */}
			<Modal
				visible={showDeleteModal}
				transparent={true}
				animationType='fade'
				onRequestClose={() => setShowDeleteModal(false)}>
				<View style={styles.deleteModalOverlay}>
					<View style={styles.deleteModalContent}>
						<Text style={styles.deleteModalTitle}>{deleteModalConfig?.title}</Text>
						<Text style={styles.deleteModalMessage}>{deleteModalConfig?.message}</Text>
						<View style={styles.deleteModalButtons}>
							<Pressable
								style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
								onPress={() => setShowDeleteModal(false)}>
								<Text style={styles.deleteModalButtonTextCancel}>{strings.cancel}</Text>
							</Pressable>
							<Pressable
								style={[styles.deleteModalButton, styles.deleteModalButtonDestructive]}
								onPress={() => {
									deleteModalConfig?.onConfirm();
								}}>
								<Text style={styles.deleteModalButtonTextDestructive}>{strings.delete}</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>

			{/* Summary Modal */}
			<SummaryModal />
		</View>
	);
}

/* komponent pomocniczy */
function Stat({
	label,
	value,
	icon,
	isAdvanced,
}: {
	label: string;
	value: any;
	icon?: keyof typeof MaterialIcons.glyphMap;
	isAdvanced?: boolean;
}) {
	return (
		<View style={[styles.statCard, isAdvanced && styles.advancedStatCard]}>
			{icon && <MaterialIcons name={icon} size={24} color='#8AB4F8' style={{ marginBottom: 4 }} />}
			<Text style={styles.statValue}>{value}</Text>
			<Text style={styles.statLabel}>{label}</Text>
			{isAdvanced && <View style={styles.advancedIndicator} />}
		</View>
	);
}

/* ---------- style ---------- */
const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#121212', padding: 16 },
	header: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
		marginBottom: 16,
		paddingVertical: 8,
	},
	trashAll: {
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: '#B00020',
		justifyContent: 'center',
		alignItems: 'center',
	},
	deleteAction: {
		justifyContent: 'center',
		alignItems: 'center',
		width: 56,
		height: '100%',
		backgroundColor: 'transparent',
	},
	deleteCircle: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#B00020',
		justifyContent: 'center',
		alignItems: 'center',
	},
	card: {
		flexDirection: 'row',
		gap: 12,
		backgroundColor: '#1E1E1E',
		borderRadius: 10,
		padding: 8,
		marginBottom: 6,
		alignItems: 'center',
	},
	variant: {
		minWidth: 42,
		paddingVertical: 2,
		borderRadius: 6,
		backgroundColor: '#333',
		justifyContent: 'center',
		alignItems: 'center',
	},
	variantTxt: { color: '#8AB4F8', fontSize: 12, fontWeight: '600' },
	avg: { fontSize: 26, color: '#8AB4F8', width: 70, textAlign: 'center' },
	date: { color: '#fff', fontSize: 13 },
	sectionHeader: {
		color: '#8AB4F8',
		fontSize: 18,
		fontWeight: '700',
		marginBottom: 10,
		marginTop: 0,
		alignSelf: 'center',
		letterSpacing: 1,
	},
	statsContainer: {
		flexGrow: 1,
		paddingBottom: 24,
	},
	statsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		paddingHorizontal: 16,
		gap: 12,
		marginBottom: 32,
	},
	statCard: {
		width: '30%',
		minWidth: 100,
		aspectRatio: 1,
		backgroundColor: '#23272E',
		borderRadius: 14,
		margin: 6,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		elevation: 2,
	},
	statValue: {
		color: '#fff',
		fontSize: 22,
		fontWeight: 'bold',
		marginBottom: 2,
	},
	statLabel: {
		color: '#8AB4F8',
		fontSize: 13,
		textAlign: 'center',
	},
	advancedStatCard: {
		borderWidth: 2,
		borderColor: '#8AB4F8',
	},
	advancedIndicator: {
		position: 'absolute',
		top: 4,
		right: 4,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#8AB4F8',
	},
	statsSection: {
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		padding: 16,
		marginBottom: 20,
		elevation: 2,
	},
	// New styles for collapsible summary
	summaryButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		padding: 16,
		marginBottom: 20,
		marginTop: 20,
		gap: 8,
	},
	summaryButtonText: {
		color: '#8AB4F8',
		fontSize: 16,
		fontWeight: '600',
	},
	// Modal styles
	modalContainer: {
		flex: 1,
		backgroundColor: '#121212',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 20,
		paddingTop: 60,
		borderBottomWidth: 1,
		borderBottomColor: '#333',
	},
	modalTitle: {
		color: '#8AB4F8',
		fontSize: 24,
		fontWeight: '700',
	},
	closeButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#333',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		flex: 1,
	},
	modalScrollContent: {
		padding: 20,
		paddingBottom: 40,
	},
	modalStatsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 16,
		marginBottom: 40,
	},
	detailedStats: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		padding: 20,
	},
	detailedStatsTitle: {
		color: '#8AB4F8',
		fontSize: 20,
		fontWeight: '700',
		marginBottom: 20,
		textAlign: 'center',
	},
	statRow: {
		marginBottom: 16,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#333',
	},
	statRowLabel: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 8,
	},
	statRowValue: {
		color: '#ccc',
		fontSize: 14,
		lineHeight: 20,
	},
	gameDistribution: {
		flexDirection: 'row',
		gap: 20,
		marginTop: 8,
	},
	distributionItem: {
		alignItems: 'center',
	},
	distributionValue: {
		color: '#8AB4F8',
		fontSize: 24,
		fontWeight: 'bold',
	},
	distributionLabel: {
		color: '#ccc',
		fontSize: 14,
		marginTop: 4,
	},
	scoreRangesGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 10,
		marginTop: 8,
	},
	scoreRangeItem: {
		alignItems: 'center',
	},
	scoreRangeValue: {
		color: '#8AB4F8',
		fontSize: 24,
		fontWeight: 'bold',
	},
	scoreRangeLabel: {
		color: '#ccc',
		fontSize: 14,
		marginTop: 4,
	},
	completionStats: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginTop: 8,
	},
	completionItem: {
		alignItems: 'center',
	},
	completionValue: {
		color: '#8AB4F8',
		fontSize: 24,
		fontWeight: 'bold',
	},
	completionLabel: {
		color: '#ccc',
		fontSize: 14,
		marginTop: 4,
	},
	enhancedStatsSection: {
		backgroundColor: '#23272E',
		borderRadius: 16,
		padding: 20,
		marginTop: 20,
		borderLeftWidth: 4,
		borderLeftColor: '#8AB4F8',
	},
	enhancedStatsTitle: {
		color: '#8AB4F8',
		fontSize: 18,
		fontWeight: '700',
		marginBottom: 16,
		textAlign: 'center',
	},
	recentTrendsSection: {
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		padding: 16,
		marginTop: 16,
		marginBottom: 20,
	},
	recentTrendsTitle: {
		color: '#8AB4F8',
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 12,
		textAlign: 'center',
	},
	recentTrendsGrid: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
	},
	recentTrendsItem: {
		alignItems: 'center',
		flex: 1,
	},
	recentTrendsLabel: {
		color: '#ccc',
		fontSize: 12,
		marginBottom: 4,
		textAlign: 'center',
	},
	recentTrendsValue: {
		color: '#8AB4F8',
		fontSize: 18,
		fontWeight: 'bold',
	},
	// Training section styles
	trainingSection: {
		marginBottom: 20,
	},
	trainingHeader: {
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		padding: 16,
		marginBottom: 8,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	trainingHeaderContent: {
		flex: 1,
	},
	trainingHeaderTitle: {
		color: '#8AB4F8',
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	trainingHeaderStats: {
		color: '#ccc',
		fontSize: 14,
	},
	trainingDetails: {
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		padding: 16,
		maxHeight: 400,
	},
	trainingSessionCard: {
		backgroundColor: '#23272E',
		borderRadius: 10,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: '#333',
	},
	trainingSessionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	trainingSessionDate: {
		color: '#8AB4F8',
		fontSize: 16,
		fontWeight: '600',
	},
	trainingSessionTime: {
		color: '#888',
		fontSize: 14,
	},
	trainingSessionSuccess: {
		color: '#4CAF50',
		fontSize: 18,
		fontWeight: 'bold',
	},
	successRateGood: {
		color: '#4CAF50', // Green for good success rate
	},
	successRatePoor: {
		color: '#FF6B6B', // Red for poor success rate
	},
	trainingSessionStats: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 16,
	},
	trainingStatItem: {
		alignItems: 'center',
	},
	trainingStatLabel: {
		color: '#ccc',
		fontSize: 12,
		marginBottom: 4,
	},
	trainingStatValue: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	targetsPracticedSection: {
		marginTop: 8,
	},
	targetsPracticedTitle: {
		color: '#ccc',
		fontSize: 14,
		marginBottom: 8,
		fontWeight: '600',
	},
	targetsPracticedGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	targetChip: {
		backgroundColor: '#8AB4F8',
		borderRadius: 16,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	targetChipText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '600',
	},
	missedValue: {
		color: '#FF6B6B', // Red color for missed targets
	},
	singleChip: {
		backgroundColor: '#8AB4F8', // Blue for single targets (previous color)
	},
	doubleChip: {
		backgroundColor: '#8AB4F8', // Blue for double targets (previous color)
	},
	tripleChip: {
		backgroundColor: '#8AB4F8', // Blue for triple targets (previous color)
	},
	singleChipMissed: {
		backgroundColor: '#FF6B6B', // Red for missed single targets
	},
	doubleChipMissed: {
		backgroundColor: '#FF6B6B', // Red for missed double targets
	},
	tripleChipMissed: {
		backgroundColor: '#FF6B6B', // Red for missed triple targets
	},
	trainingSessionContent: {
		flex: 1,
	},

	checkoutModeTitle: {
		color: '#FF6B35', // Orange color for successful checkout mode
	},

	checkoutModeChip: {
		backgroundColor: '#FF6B35', // Orange background for successful checkout mode chips
		borderColor: '#FF6B35',
	},
	checkoutModeChipMissed: {
		backgroundColor: '#FF6B6B', // Same red as target mode for consistency
		borderColor: '#FF6B6B',
	},
	checkoutModeDate: {
		color: '#FF6B35', // Orange color for successful checkout mode date
	},

	// Delete Modal styles
	deleteModalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	deleteModalContent: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		padding: 24,
		width: '100%',
		maxWidth: 320,
		borderWidth: 1,
		borderColor: '#333',
	},
	deleteModalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#fff',
		textAlign: 'center',
		marginBottom: 12,
	},
	deleteModalMessage: {
		fontSize: 14,
		color: '#ccc',
		textAlign: 'center',
		marginBottom: 20,
		lineHeight: 20,
	},
	deleteModalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		gap: 12,
	},
	deleteModalButton: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	deleteModalButtonCancel: {
		backgroundColor: '#666',
	},
	deleteModalButtonDestructive: {
		backgroundColor: '#B00020',
	},
	deleteModalButtonTextCancel: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
	},
	deleteModalButtonTextDestructive: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
	},
});
