import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { getBobs27FinalScore, getBobs27Outcome } from '../../database/trainingRepository';
import type { TrainingSession, TrainingStats } from '../../database/trainingRepository';
import { useLanguage } from '../../lib/LanguageContext';
import type { LocalizedStrings } from '../../lib/localization';

type Props = {
	sessions: TrainingSession[];
	stats: TrainingStats | null;
	showDetails: boolean;
	onToggleDetails: () => void;
	onDeleteSession: (id: number) => void;
	hideHeader?: boolean;
	fullHeight?: boolean;
};

export default function TrainingSessionsList({
	sessions,
	stats,
	showDetails,
	onToggleDetails,
	onDeleteSession,
	hideHeader = false,
	fullHeight = false,
}: Props) {
	const { strings } = useLanguage();

	if (!stats || stats.totalSessions === 0) return null;
	const detailsVisible = hideHeader || showDetails;
	const listData = fullHeight ? sessions : sessions.slice(0, 10);

	return (
		<View style={[styles.section, hideHeader && styles.sectionEmbedded, fullHeight && styles.sectionFullHeight]}>
			{!hideHeader && (
				<Pressable style={styles.header} onPress={onToggleDetails}>
					<View style={styles.headerContent}>
						<MaterialIcons name='school' size={24} color='#8AB4F8' />
						<Text style={styles.headerTitle}>{strings.trainingSessions}</Text>
						<Text style={styles.headerStats}>
							{stats.totalSessions} {strings.trainingSessionsCount.toLowerCase()} |{' '}
							<Text style={stats.overallSuccessRate >= 50 ? styles.successRateGood : styles.successRatePoor}>
								{stats.overallSuccessRate}%
							</Text>{' '}
							{strings.successRate}
						</Text>
					</View>
					<MaterialIcons name={showDetails ? 'expand-less' : 'expand-more'} size={24} color='#8AB4F8' />
				</Pressable>
			)}

			{detailsVisible && (
				<View style={[styles.details, fullHeight && styles.detailsFullHeight]}>
					{hideHeader && !fullHeight && (
						<View style={styles.embeddedHeader}>
							<Text style={styles.embeddedTitle}>{strings.trainingSessions}</Text>
							<Text style={stats.overallSuccessRate >= 50 ? styles.successRateGood : styles.successRatePoor}>
								{stats.overallSuccessRate}%
							</Text>
						</View>
					)}
					<FlatList
						data={listData}
						keyExtractor={(session, index) => session.id?.toString() ?? `${session.date}-${index}`}
						showsVerticalScrollIndicator={false}
						initialNumToRender={6}
						maxToRenderPerBatch={6}
						removeClippedSubviews={true}
						windowSize={5}
						contentContainerStyle={fullHeight ? styles.listContentFullHeight : undefined}
						renderItem={({ item }) => <TrainingSessionRow item={item} strings={strings} onDeleteSession={onDeleteSession} />}
					/>
				</View>
			)}
		</View>
	);
}

function TrainingSessionRow({
	item,
	strings,
	onDeleteSession,
}: {
	item: TrainingSession;
	strings: LocalizedStrings;
	onDeleteSession: (id: number) => void;
}) {
	const modeMeta = getTrainingModeMeta(item.trainingMode, strings);
	const bobsOutcome = getBobs27Outcome(item);
	const bobsFinalScore = getBobs27FinalScore(item);

	return (
		<Swipeable
			overshootRight={false}
			renderRightActions={() => (
				<Pressable style={styles.deleteAction} onPress={() => item.id != null && onDeleteSession(item.id)}>
					<View style={styles.deleteCircle}>
						<Ionicons name='trash' size={18} color='#fff' />
					</View>
				</Pressable>
			)}>
			<View style={styles.sessionCard}>
				<View style={styles.sessionContent}>
					<View style={styles.sessionHeader}>
						<View style={styles.sessionTitleRow}>
							<View style={[styles.modeBadge, { backgroundColor: modeMeta.color }]}>
								<MaterialIcons name={modeMeta.icon} size={14} color='#10243F' />
								<Text style={[styles.modeBadgeText, styles.targetBadgeText]}>{modeMeta.label}</Text>
							</View>
							{bobsOutcome ? (
								<View style={[styles.outcomeBadge, bobsOutcome === 'won' ? styles.outcomeWon : styles.outcomeLost]}>
									<Text style={styles.outcomeBadgeText}>
										{bobsOutcome === 'won' ? strings.bobs27Won : strings.bobs27Lost}
									</Text>
								</View>
							) : (
								<Text style={[styles.sessionSuccess, item.successRate >= 50 ? styles.successRateGood : styles.successRatePoor]}>
									{item.successRate}%
								</Text>
							)}
						</View>
						<View style={styles.sessionDateRow}>
							<Text style={styles.sessionDate}>{item.date.slice(0, 10)}</Text>
							<Text style={styles.sessionTime}>{new Date(item.date).toLocaleTimeString().slice(0, 5)}</Text>
						</View>
					</View>

					<View style={styles.sessionStats}>
						<TrainingStat label={strings.targets} value={item.targets} />
						<TrainingStat label={strings.hits} value={item.hits} />
						<TrainingStat label={strings.misses} value={item.misses} missed />
						<TrainingStat
							label={item.trainingMode === 'bobs27' ? strings.bobs27FinalScore : strings.duration}
							value={item.trainingMode === 'bobs27' ? bobsFinalScore ?? '-' : `${Math.floor(item.duration / 60)}m`}
						/>
					</View>

					{item.targetsPracticed.length > 0 && (
						<View style={styles.targetsPracticedSection}>
							<Text style={[styles.targetsPracticedTitle, item.trainingMode === 'checkout' && styles.checkoutModeText]}>
								{strings.targetsPracticed}:
							</Text>
							<View style={styles.targetsPracticedGrid}>
								{item.targetsPracticed.map((target, index) => {
									const targetResult = item.targetResults?.[index];
									const wasMissed = targetResult ? !targetResult.hit : false;
									return (
										<View
											key={`${target}-${index}`}
											style={[
												styles.targetChip,
												item.trainingMode === 'checkout' && styles.checkoutModeChip,
												wasMissed && styles.targetChipMissed,
											]}>
											<Text style={styles.targetChipText}>{target}</Text>
										</View>
									);
								})}
							</View>
						</View>
					)}
				</View>
			</View>
		</Swipeable>
	);
}

function getTrainingModeMeta(mode: TrainingSession['trainingMode'], strings: LocalizedStrings) {
	switch (mode) {
		case 'checkout':
			return { label: strings.checkoutPractice, icon: 'sports-score' as const, color: '#5BD3C7' };
		case 'clockClassic':
			return { label: strings.clockClassic, icon: 'schedule' as const, color: '#8AB4F8' };
		case 'clockDouble':
			return { label: strings.clockDouble, icon: 'adjust' as const, color: '#C6A7FF' };
		case 'clockTriple':
			return { label: strings.clockTriple, icon: 'change-history' as const, color: '#F2C94C' };
		case 'clockJump':
			return { label: strings.clockJump, icon: 'double-arrow' as const, color: '#60D394' };
		case 'clockPenalty':
			return { label: strings.clockPenalty, icon: 'keyboard-return' as const, color: '#D94A5A' };
		case 'bobs27':
			return { label: strings.bobs27, icon: 'filter-9-plus' as const, color: '#F2994A' };
		default:
			return { label: strings.practiceTargets, icon: 'gps-fixed' as const, color: '#8AB4F8' };
	}
}

function TrainingStat({ label, value, missed }: { label: string; value: string | number; missed?: boolean }) {
	return (
		<View style={styles.statItem}>
			<Text style={styles.statLabel}>{label}</Text>
			<Text style={[styles.statValue, missed && styles.missedValue]}>{value}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	section: {
		marginBottom: 20,
	},
	sectionEmbedded: {
		marginBottom: 12,
	},
	sectionFullHeight: {
		flex: 1,
		marginBottom: 0,
	},
	header: {
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		padding: 16,
		marginBottom: 8,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	headerContent: {
		flex: 1,
	},
	headerTitle: {
		color: '#8AB4F8',
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	headerStats: {
		color: '#ccc',
		fontSize: 14,
	},
	details: {
		backgroundColor: '#121212',
		borderRadius: 12,
		maxHeight: 400,
	},
	detailsFullHeight: {
		flex: 1,
		maxHeight: undefined,
	},
	listContentFullHeight: {
		paddingBottom: 24,
	},
	embeddedHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	embeddedTitle: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '700',
	},
	sessionCard: {
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		padding: 14,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: '#2A2A2A',
	},
	sessionContent: {
		flex: 1,
	},
	sessionHeader: {
		marginBottom: 12,
	},
	sessionTitleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 10,
	},
	sessionDateRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginTop: 8,
	},
	modeBadge: {
		flex: 1,
		minHeight: 30,
		borderRadius: 999,
		paddingHorizontal: 10,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	targetBadge: {
		backgroundColor: '#8AB4F8',
	},
	checkoutBadge: {
		backgroundColor: '#5BD3C7',
	},
	modeBadgeText: {
		flex: 1,
		fontSize: 12,
		fontWeight: '800',
	},
	targetBadgeText: {
		color: '#10243F',
	},
	checkoutBadgeText: {
		color: '#063A35',
	},
	sessionDate: {
		color: '#ddd',
		fontSize: 13,
		fontWeight: '700',
	},
	sessionTime: {
		color: '#888',
		fontSize: 13,
	},
	sessionSuccess: {
		fontSize: 20,
		fontWeight: '900',
	},
	outcomeBadge: {
		minHeight: 30,
		borderRadius: 999,
		paddingHorizontal: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	outcomeWon: {
		backgroundColor: '#2F7E49',
	},
	outcomeLost: {
		backgroundColor: '#963442',
	},
	outcomeBadgeText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '900',
	},
	sessionStats: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 14,
	},
	statItem: {
		flex: 1,
		minHeight: 54,
		backgroundColor: '#242424',
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 6,
	},
	statLabel: {
		color: '#ccc',
		fontSize: 12,
		marginBottom: 4,
		textAlign: 'center',
	},
	statValue: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	missedValue: {
		color: '#FF6B6B',
	},
	successRateGood: {
		color: '#4CAF50',
	},
	successRatePoor: {
		color: '#FF6B6B',
	},
	targetsPracticedSection: {
		marginTop: 2,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: '#2A2A2A',
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
	checkoutModeChip: {
		backgroundColor: '#5BD3C7',
	},
	targetChipMissed: {
		backgroundColor: '#FF6B6B',
	},
	targetChipText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '600',
	},
	checkoutModeText: {
		color: '#5BD3C7',
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
});
