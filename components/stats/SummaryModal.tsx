import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ComprehensiveStats, RecentTrendGame } from '../../database/statsRepository';
import AverageTrendChart from './AverageTrendChart';
import { TrainingStats } from '../../database/trainingRepository';
import { formatDarts } from '../../lib/dartsFormatter';
import { createEmptyScoreRanges } from '../../lib/dartsStats';
import { useLanguage } from '../../lib/LanguageContext';

type ModeStats = {
	simple: { games: number; avg3: number; bestAvg: number; totalDarts: number; totalScore: number };
	advanced: { games: number; avg3: number; bestAvg: number; totalDarts: number; totalScore: number };
};

export type StatsSummary = {
	played: number;
	g501: number;
	g401: number;
	g301: number;
	bestAvg: string;
	allDarts: number;
	allAvg: string;
	highestCheckout: number;
	count180s: number;
	forfeitedGames: number;
	completedGames: number;
	scoreRanges: ReturnType<typeof createEmptyScoreRanges>;
	modeStats: ModeStats;
};

type Props = {
	visible: boolean;
	onClose: () => void;
	stats: StatsSummary;
	comprehensiveStats: ComprehensiveStats | null;
	trainingStats: TrainingStats | null;
};

export default function SummaryModal({ visible, onClose, stats, comprehensiveStats, trainingStats }: Props) {
	const { strings } = useLanguage();
	const [infoText, setInfoText] = useState<string | null>(null);
	const successRate = stats.played > 0 ? Math.round((stats.completedGames / stats.played) * 100) : 0;
	const dartsLabel = formatDarts(stats.allDarts, {
		dart: strings.dart,
		dartsPlural: strings.dartsPlural,
		dartsGenitive: strings.dartsGenitive,
	});

	return (
		<Modal visible={visible} animationType='slide' presentationStyle='fullScreen' onRequestClose={onClose}>
			<View style={styles.container}>
				<View style={styles.header}>
					<View>
						<Text style={styles.title}>{strings.summary}</Text>
						<Text style={styles.subtitle}>
							{stats.played} {strings.selectedGamesSummary}
						</Text>
					</View>
					<Pressable style={styles.closeButton} onPress={onClose}>
						<Ionicons name='close' size={24} color='#fff' />
					</Pressable>
				</View>

				<ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
					<View style={styles.hero}>
						<View style={styles.heroMain}>
							<View style={styles.labelWithInfo}>
								<Text style={styles.heroLabel}>{strings.overallAverage}</Text>
								<InfoButton onPress={() => setInfoText(strings.tooltipOverallAverage)} dark />
							</View>
							<Text style={styles.heroValue}>{stats.allAvg}</Text>
							<Text style={styles.heroHint}>{strings.threeDartAverage}</Text>
						</View>
						<View style={styles.heroSide}>
							<HeroMetric icon='star' label={strings.bestAverage} value={stats.bestAvg} info={strings.tooltipBestAverage} onInfo={setInfoText} />
							<HeroMetric
								icon='trending-up'
								label={strings.highestFinish}
								value={stats.highestCheckout}
								info={strings.tooltipHighestFinish}
								onInfo={setInfoText}
							/>
						</View>
					</View>

					<View style={styles.quickGrid}>
						<MiniCard icon='sports-score' label={strings.games} value={stats.played} info={strings.tooltipGames} onInfo={setInfoText} />
						<MiniCard icon='gps-fixed' label={strings.totalDarts} value={dartsLabel} info={strings.tooltipTotalDarts} onInfo={setInfoText} />
						<MiniCard icon='check-circle' label={strings.successRate} value={`${successRate}%`} info={strings.tooltipSuccessRate} onInfo={setInfoText} />
						<MiniCard icon='whatshot' label={`${strings.score180}s`} value={stats.count180s} info={strings.tooltipCount180s} onInfo={setInfoText} />
					</View>

					<Section title={strings.gameDistribution} info={strings.tooltipGameDistribution} onInfo={setInfoText}>
						<View style={styles.pillRow}>
							<MetricPill label='301' value={stats.g301} />
							<MetricPill label='401' value={stats.g401} />
							<MetricPill label='501' value={stats.g501} />
						</View>
						<View style={styles.pillRow}>
							<MetricPill label={strings.completed} value={stats.completedGames} />
							<MetricPill label={strings.forfeited} value={stats.forfeitedGames} danger={stats.forfeitedGames > 0} />
						</View>
					</Section>

					<Section title={strings.modeComparison} info={strings.tooltipModeComparison} onInfo={setInfoText}>
						<View style={styles.modeGrid}>
							<ModeCard title={strings.modeSimple} mode={stats.modeStats.simple} />
							<ModeCard title={strings.modeAdvanced} mode={stats.modeStats.advanced} />
						</View>
					</Section>

					<Section title={strings.scoreRanges} info={strings.tooltipScoreRanges} onInfo={setInfoText}>
						<View style={styles.scoreGrid}>
							<MetricPill label={strings.score100plus} value={stats.scoreRanges['100+']} />
							<MetricPill label={strings.score120plus} value={stats.scoreRanges['120+']} />
							<MetricPill label={strings.score140plus} value={stats.scoreRanges['140+']} />
							<MetricPill label={strings.score160plus} value={stats.scoreRanges['160+']} />
							<MetricPill label={strings.score180} value={stats.scoreRanges['180']} highlight />
						</View>
					</Section>

					{comprehensiveStats && comprehensiveStats.checkoutStats.total > 0 && (
						<Section title={strings.checkoutOverview} info={strings.tooltipCheckoutOverview} onInfo={setInfoText}>
							<View style={styles.pillRow}>
								<MetricPill label={strings.checkoutCount} value={comprehensiveStats.checkoutStats.total} />
								<MetricPill label={strings.averageCheckout} value={comprehensiveStats.checkoutStats.averageValue} />
							</View>
							<View style={styles.pillRow}>
								<MetricPill label={strings.oneDartFinishes} value={comprehensiveStats.checkoutStats.dartsUsed.one} />
								<MetricPill label={strings.twoDartFinishes} value={comprehensiveStats.checkoutStats.dartsUsed.two} />
								<MetricPill label={strings.threeDartFinishes} value={comprehensiveStats.checkoutStats.dartsUsed.three} />
							</View>
							<View style={styles.pillRow}>
								<MetricPill label={strings.lowCheckouts} value={comprehensiveStats.checkoutStats.ranges.low} />
								<MetricPill label={strings.midCheckouts} value={comprehensiveStats.checkoutStats.ranges.mid} />
								<MetricPill label={strings.highCheckouts} value={comprehensiveStats.checkoutStats.ranges.high} />
							</View>
							{comprehensiveStats.checkoutStats.mostCommon.length > 0 && (
								<View style={styles.commonCheckoutBlock}>
									<Text style={styles.commonCheckoutTitle}>{strings.commonCheckouts}</Text>
									{comprehensiveStats.checkoutStats.mostCommon.map(item => (
										<View key={item.checkout} style={styles.commonCheckoutRow}>
											<Text style={styles.commonCheckoutPath} numberOfLines={1}>
												{item.checkout}
											</Text>
											<Text style={styles.commonCheckoutMeta}>
												{item.value} x{item.count}
											</Text>
										</View>
									))}
								</View>
							)}
						</Section>
					)}

					{comprehensiveStats && (
						<Section title={strings.gameLength} info={strings.tooltipGameLength} onInfo={setInfoText}>
							<View style={styles.pillRow}>
								<MetricPill label={strings.shortest} value={comprehensiveStats.gameLength.shortest} />
								<MetricPill label={strings.avgLength} value={comprehensiveStats.gameLength.average} />
								<MetricPill label={strings.longest} value={comprehensiveStats.gameLength.longest} />
							</View>
						</Section>
					)}

					{trainingStats && trainingStats.totalSessions > 0 && (
						<Section title={strings.trainingSessions} info={strings.tooltipTrainingSessions} onInfo={setInfoText}>
							<View style={styles.quickGridCompact}>
								<MiniCard icon='school' label={strings.trainingSessions} value={trainingStats.totalSessions} compact />
								<MiniCard icon='check-circle' label={strings.trainingSuccess} value={`${trainingStats.overallSuccessRate}%`} compact />
								<MiniCard icon='gps-fixed' label={strings.totalTargets} value={trainingStats.totalTargets} compact />
								<MiniCard icon='star' label={strings.bestSession} value={`${trainingStats.bestSession?.successRate ?? 0}%`} compact />
							</View>
						</Section>
					)}

					{comprehensiveStats && (
						<Section title={strings.recentTrends} info={strings.tooltipRecentTrends} onInfo={setInfoText}>
							<View style={styles.trendsGrid}>
								<RecentTrend label={strings.last5Games} games={comprehensiveStats.recentTrends.last5Games} />
								<RecentTrend label={strings.last10Games} games={comprehensiveStats.recentTrends.last10Games} />
							</View>
						</Section>
					)}

					{comprehensiveStats && comprehensiveStats.recentTrends.last30Games.length >= 2 && (
						<Section title={strings.averageTrend} info={strings.tooltipAverageTrend} onInfo={setInfoText}>
							<AverageTrendChart games={comprehensiveStats.recentTrends.last30Games} />
						</Section>
					)}
				</ScrollView>

				<Modal visible={Boolean(infoText)} transparent animationType='fade' onRequestClose={() => setInfoText(null)}>
					<Pressable style={styles.infoOverlay} onPress={() => setInfoText(null)}>
						<Pressable style={styles.infoCard}>
							<View style={styles.infoHeader}>
								<MaterialIcons name='info-outline' size={22} color='#8AB4F8' />
								<Text style={styles.infoTitle}>{strings.info}</Text>
							</View>
							<Text style={styles.infoBody}>{infoText}</Text>
							<Pressable style={styles.infoCloseButton} onPress={() => setInfoText(null)}>
								<Text style={styles.infoCloseText}>{strings.ok}</Text>
							</Pressable>
						</Pressable>
					</Pressable>
				</Modal>
			</View>
		</Modal>
	);
}

function HeroMetric({
	icon,
	label,
	value,
	info,
	onInfo,
}: {
	icon: keyof typeof MaterialIcons.glyphMap;
	label: string;
	value: string | number;
	info?: string;
	onInfo?: (info: string) => void;
}) {
	return (
		<View style={styles.heroMetric}>
			<MaterialIcons name={icon} size={18} color='#8AB4F8' />
			<View style={styles.heroMetricCopy}>
				<View style={styles.labelWithInfo}>
					<Text style={styles.heroMetricLabel} numberOfLines={1}>
						{label}
					</Text>
					{info && onInfo && <InfoButton onPress={() => onInfo(info)} />}
				</View>
				<Text style={styles.heroMetricValue}>{value}</Text>
			</View>
		</View>
	);
}

function MiniCard({
	icon,
	label,
	value,
	compact,
	info,
	onInfo,
}: {
	icon: keyof typeof MaterialIcons.glyphMap;
	label: string;
	value: string | number;
	compact?: boolean;
	info?: string;
	onInfo?: (info: string) => void;
}) {
	return (
		<View style={[styles.miniCard, compact && styles.miniCardCompact]}>
			<View style={styles.miniHeader}>
				<MaterialIcons name={icon} size={20} color='#8AB4F8' />
				{info && onInfo && <InfoButton onPress={() => onInfo(info)} />}
			</View>
			<Text style={styles.miniValue} numberOfLines={1}>
				{value}
			</Text>
			<Text style={styles.miniLabel} numberOfLines={2}>
				{label}
			</Text>
		</View>
	);
}

function Section({
	title,
	children,
	info,
	onInfo,
}: {
	title: string;
	children: React.ReactNode;
	info?: string;
	onInfo?: (info: string) => void;
}) {
	return (
		<View style={styles.section}>
			<View style={styles.sectionHeader}>
				<Text style={styles.sectionTitle}>{title}</Text>
				{info && onInfo && <InfoButton onPress={() => onInfo(info)} />}
			</View>
			{children}
		</View>
	);
}

function InfoButton({ onPress, dark = false }: { onPress: () => void; dark?: boolean }) {
	return (
		<Pressable style={[styles.infoButton, dark && styles.infoButtonDark]} onPress={onPress} hitSlop={8}>
			<MaterialIcons name='info-outline' size={15} color={dark ? '#25354F' : '#8AB4F8'} />
		</Pressable>
	);
}

function MetricPill({
	label,
	value,
	highlight,
	danger,
}: {
	label: string;
	value: string | number;
	highlight?: boolean;
	danger?: boolean;
}) {
	return (
		<View style={[styles.pill, highlight && styles.pillHighlight, danger && styles.pillDanger]}>
			<Text style={[styles.pillValue, highlight && styles.pillValueDark]}>{value}</Text>
			<Text style={[styles.pillLabel, highlight && styles.pillLabelDark]} numberOfLines={1}>
				{label}
			</Text>
		</View>
	);
}

function ModeCard({ title, mode }: { title: string; mode: ModeStats['simple'] }) {
	const { strings } = useLanguage();
	return (
		<View style={styles.modeCard}>
			<Text style={styles.modeTitle}>{title}</Text>
			<Text style={styles.modeAvg}>{mode.avg3.toFixed(1)}</Text>
			<Text style={styles.modeMeta}>
				{strings.games}: {mode.games} | {strings.best}: {mode.bestAvg.toFixed(1)}
			</Text>
		</View>
	);
}

function RecentTrend({ label, games }: { label: string; games: RecentTrendGame[] }) {
	const { strings } = useLanguage();
	const completed = games.filter(game => game.completed).length;
	const avg =
		games.length > 0 ? (games.reduce((sum, game) => sum + game.avg, 0) / games.length).toFixed(1) : '0.0';

	return (
		<View style={styles.trendCard}>
			<Text style={styles.trendLabel}>{label}</Text>
			<Text style={styles.trendValue}>{avg}</Text>
			<Text style={styles.trendMeta}>
				{completed}/{games.length} {strings.completedTrendSuffix}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 20,
		paddingTop: 60,
		borderBottomWidth: 1,
		borderBottomColor: '#333',
	},
	title: {
		color: '#8AB4F8',
		fontSize: 24,
		fontWeight: '800',
	},
	subtitle: {
		color: '#aaa',
		fontSize: 13,
		marginTop: 4,
	},
	closeButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#333',
		justifyContent: 'center',
		alignItems: 'center',
	},
	content: {
		flex: 1,
	},
	contentInner: {
		padding: 16,
		paddingBottom: 40,
	},
	hero: {
		flexDirection: 'row',
		gap: 10,
		marginBottom: 12,
	},
	heroMain: {
		flex: 1,
		minHeight: 152,
		backgroundColor: '#8AB4F8',
		borderRadius: 14,
		padding: 16,
		justifyContent: 'space-between',
	},
	heroLabel: {
		color: '#0B0B0B',
		fontSize: 13,
		fontWeight: '800',
	},
	labelWithInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
	},
	infoButton: {
		width: 22,
		height: 22,
		borderRadius: 11,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#242424',
		borderWidth: 1,
		borderColor: '#333',
	},
	infoButtonDark: {
		backgroundColor: 'rgba(11, 11, 11, 0.1)',
		borderColor: 'rgba(11, 11, 11, 0.18)',
	},
	heroValue: {
		color: '#0B0B0B',
		fontSize: 44,
		fontWeight: '900',
		letterSpacing: 0,
	},
	heroHint: {
		color: '#25354F',
		fontSize: 12,
		fontWeight: '700',
	},
	heroSide: {
		width: '48%',
		gap: 10,
	},
	heroMetric: {
		flex: 1,
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	heroMetricCopy: {
		flex: 1,
	},
	heroMetricLabel: {
		flex: 1,
		color: '#aaa',
		fontSize: 11,
		fontWeight: '700',
	},
	heroMetricValue: {
		color: '#fff',
		fontSize: 20,
		fontWeight: '900',
		marginTop: 4,
	},
	quickGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		gap: 10,
		marginBottom: 12,
	},
	quickGridCompact: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		gap: 10,
	},
	miniCard: {
		width: '48.5%',
		minHeight: 98,
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 12,
		justifyContent: 'space-between',
	},
	miniCardCompact: {
		minHeight: 88,
	},
	miniHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	miniValue: {
		color: '#fff',
		fontSize: 20,
		fontWeight: '900',
		marginTop: 6,
	},
	miniLabel: {
		color: '#aaa',
		fontSize: 11,
		fontWeight: '700',
		marginTop: 4,
	},
	section: {
		backgroundColor: '#1A1A1A',
		borderRadius: 14,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 14,
		marginBottom: 12,
	},
	sectionTitle: {
		flex: 1,
		color: '#fff',
		fontSize: 16,
		fontWeight: '800',
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 8,
		marginBottom: 12,
	},
	pillRow: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 8,
	},
	pill: {
		flex: 1,
		minHeight: 58,
		backgroundColor: '#242424',
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 8,
	},
	pillHighlight: {
		backgroundColor: '#60D394',
	},
	pillDanger: {
		borderWidth: 1,
		borderColor: '#B00020',
	},
	pillValue: {
		color: '#8AB4F8',
		fontSize: 20,
		fontWeight: '900',
	},
	pillValueDark: {
		color: '#0B0B0B',
	},
	pillLabel: {
		color: '#aaa',
		fontSize: 11,
		fontWeight: '700',
		marginTop: 3,
	},
	pillLabelDark: {
		color: '#0B0B0B',
	},
	modeGrid: {
		flexDirection: 'row',
		gap: 10,
	},
	modeCard: {
		flex: 1,
		backgroundColor: '#242424',
		borderRadius: 12,
		padding: 12,
	},
	modeTitle: {
		color: '#aaa',
		fontSize: 12,
		fontWeight: '800',
	},
	modeAvg: {
		color: '#fff',
		fontSize: 28,
		fontWeight: '900',
		marginTop: 8,
	},
	modeMeta: {
		color: '#aaa',
		fontSize: 11,
		fontWeight: '600',
		marginTop: 6,
	},
	scoreGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	commonCheckoutBlock: {
		backgroundColor: '#242424',
		borderRadius: 10,
		padding: 10,
		gap: 8,
	},
	commonCheckoutTitle: {
		color: '#aaa',
		fontSize: 12,
		fontWeight: '800',
	},
	commonCheckoutRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 10,
	},
	commonCheckoutPath: {
		flex: 1,
		color: '#fff',
		fontSize: 13,
		fontWeight: '800',
	},
	commonCheckoutMeta: {
		color: '#8AB4F8',
		fontSize: 13,
		fontWeight: '900',
	},
	trendsGrid: {
		flexDirection: 'row',
		gap: 10,
	},
	trendCard: {
		flex: 1,
		backgroundColor: '#242424',
		borderRadius: 12,
		padding: 12,
		alignItems: 'center',
	},
	trendLabel: {
		color: '#aaa',
		fontSize: 12,
		fontWeight: '800',
	},
	trendValue: {
		color: '#8AB4F8',
		fontSize: 26,
		fontWeight: '900',
		marginTop: 8,
	},
	trendMeta: {
		color: '#aaa',
		fontSize: 11,
		fontWeight: '600',
		marginTop: 4,
		textAlign: 'center',
	},
	infoOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.72)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 22,
	},
	infoCard: {
		width: '100%',
		maxWidth: 380,
		backgroundColor: '#1A1A1A',
		borderRadius: 14,
		borderWidth: 1,
		borderColor: '#333',
		padding: 18,
	},
	infoHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 10,
	},
	infoTitle: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '800',
	},
	infoBody: {
		color: '#D8DEE8',
		fontSize: 14,
		lineHeight: 21,
	},
	infoCloseButton: {
		alignSelf: 'flex-end',
		marginTop: 16,
		backgroundColor: '#8AB4F8',
		borderRadius: 8,
		paddingVertical: 9,
		paddingHorizontal: 16,
	},
	infoCloseText: {
		color: '#101113',
		fontSize: 14,
		fontWeight: '900',
	},
});
