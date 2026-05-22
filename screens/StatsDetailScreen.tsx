import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StackScreenProps } from '@react-navigation/stack';
import React from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import DartboardHeatmap from '../components/game/DartboardHeatmap';
import { formatDarts } from '../lib/dartsFormatter';
import { calculateCheckoutValue, parseHits } from '../lib/dartsStats';
import { useLanguage } from '../lib/LanguageContext';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'StatsDetail'>;

export default function StatsDetailScreen({ route, navigation }: Props) {
	const { turns, avg3, date, start, darts, scored = 0, checkout, hits, forfeited = false, forfeitScore = null } = route.params;
	const { strings } = useLanguage();
	const parsedHits = parseHits(hits);
	const isAdvanced = parsedHits.length > 0;
	const totalScored = scored || turns.reduce((sum, turn) => sum + turn, 0);
	const detailStats = getGameDetailStats(turns, start);
	const checkoutValue = calculateCheckoutValue(checkout);
	const dartsFormatted = formatDarts(darts, {
		dart: strings.dart,
		dartsPlural: strings.dartsPlural,
		dartsGenitive: strings.dartsGenitive,
	});

	const renderTurn = ({ item, index }: { item: TurnDetail; index: number }) => (
		<View style={[styles.row, item.score === 0 && styles.bustRow]}>
			<Text style={styles.rowIdx}>#{index + 1}</Text>
			<View style={styles.rowValues}>
				<Text style={styles.rowPts}>{item.score}</Text>
				<Text style={styles.rowRemaining}>
					{strings.leftAfterTurn}: {item.remaining}
				</Text>
			</View>
		</View>
	);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
					<Ionicons name='chevron-back' size={26} color='#8AB4F8' />
				</Pressable>
				<View style={styles.titleBlock}>
					<Text style={styles.title}>{start}</Text>
					<Text style={styles.subtitle}>{date.slice(0, 10)}</Text>
				</View>
				<View style={styles.modeBadge}>
					<Text style={styles.modeBadgeText}>{isAdvanced ? strings.advanced : strings.simple}</Text>
				</View>
			</View>

			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
				{forfeited ? (
					<View style={styles.forfeitBanner}>
						<MaterialIcons name='flag' size={20} color='#FFB4BE' />
						<Text style={styles.forfeitText}>
							{strings.forfeited}
							{forfeitScore != null ? ` | ${forfeitScore} ${strings.pointsLeft}` : ''}
						</Text>
					</View>
				) : null}

				<View style={styles.hero}>
					<Stat label={strings.avg} value={avg3.toFixed(1)} />
					<Stat label={strings.darts} value={dartsFormatted} />
					<Stat label={strings.score} value={totalScored} />
				</View>

				{checkout ? (
					<View style={styles.checkoutCard}>
						<MaterialIcons name='flag' size={18} color='#60D394' />
						<Text style={styles.checkoutText}>
							{checkoutValue} | {checkout}
						</Text>
					</View>
				) : null}

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{strings.gameAnalysis}</Text>
					<View style={styles.analysisGrid}>
						<AnalysisTile icon='trending-up' label={strings.bestTurn} value={detailStats.bestTurn} color='#8AB4F8' />
						<AnalysisTile icon='functions' label={strings.averageTurn} value={detailStats.averageTurn.toFixed(1)} color='#F2C94C' />
						<AnalysisTile icon='whatshot' label={strings.score100plus} value={detailStats.bigTurns} color='#60D394' />
						<AnalysisTile icon='warning' label={strings.weakTurns} value={detailStats.weakTurns} color='#D94A5A' />
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{strings.turns}</Text>
					<FlatList
						scrollEnabled={false}
						data={detailStats.turnDetails}
						keyExtractor={(_, index) => index.toString()}
						renderItem={renderTurn}
						ItemSeparatorComponent={() => <View style={styles.separator} />}
					/>
				</View>

				{isAdvanced ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Heatmap</Text>
						<DartboardHeatmap hits={parsedHits} onThrow={() => undefined} readonly />
					</View>
				) : null}
			</ScrollView>
		</View>
	);
}

type TurnDetail = {
	score: number;
	remaining: number;
};

function getGameDetailStats(turns: number[], start: number) {
	let remaining = start;
	const scoringTurns = turns.filter(turn => turn > 0);
	const turnDetails = turns.map(score => {
		if (score > 0) {
			remaining = Math.max(0, remaining - score);
		}
		return { score, remaining };
	});

	return {
		bestTurn: Math.max(...turns, 0),
		averageTurn: scoringTurns.length > 0 ? scoringTurns.reduce((sum, turn) => sum + turn, 0) / scoringTurns.length : 0,
		bigTurns: turns.filter(turn => turn >= 100).length,
		weakTurns: turns.filter(turn => turn > 0 && turn < 45).length,
		turnDetails,
	};
}

function Stat({ label, value }: { label: string; value: string | number }) {
	return (
		<View style={styles.stat}>
			<Text style={styles.statValue}>{value}</Text>
			<Text style={styles.statLabel} numberOfLines={1}>
				{label}
			</Text>
		</View>
	);
}

function AnalysisTile({
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
		<View style={styles.analysisTile}>
			<MaterialIcons name={icon} size={18} color={color} />
			<Text style={styles.analysisValue}>{value}</Text>
			<Text style={styles.analysisLabel} numberOfLines={1}>
				{label}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
		paddingHorizontal: 16,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 12,
		gap: 12,
	},
	backButton: {
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
	},
	titleBlock: {
		flex: 1,
		alignItems: 'center',
	},
	title: {
		color: '#fff',
		fontSize: 24,
		fontWeight: '900',
	},
	subtitle: {
		color: '#aaa',
		fontSize: 12,
		fontWeight: '700',
		marginTop: 2,
	},
	modeBadge: {
		minWidth: 68,
		backgroundColor: '#1A1A1A',
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		paddingHorizontal: 10,
		paddingVertical: 7,
		alignItems: 'center',
	},
	modeBadgeText: {
		color: '#8AB4F8',
		fontSize: 11,
		fontWeight: '900',
	},
	scrollContent: {
		paddingBottom: 40,
		gap: 12,
	},
	forfeitBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		backgroundColor: '#3A161C',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#7A2634',
		padding: 10,
	},
	forfeitText: {
		color: '#FFB4BE',
		fontSize: 13,
		fontWeight: '900',
	},
	hero: {
		flexDirection: 'row',
		gap: 8,
	},
	stat: {
		flex: 1,
		minHeight: 78,
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 8,
	},
	statValue: {
		color: '#fff',
		fontSize: 19,
		fontWeight: '900',
		textAlign: 'center',
	},
	statLabel: {
		color: '#aaa',
		fontSize: 11,
		fontWeight: '800',
		marginTop: 5,
		textAlign: 'center',
	},
	checkoutCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		backgroundColor: '#183A27',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2F7E49',
		padding: 12,
	},
	checkoutText: {
		color: '#60D394',
		fontSize: 15,
		fontWeight: '900',
	},
	section: {
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 12,
	},
	sectionTitle: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '900',
		marginBottom: 10,
	},
	analysisGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	analysisTile: {
		width: '48.5%',
		minHeight: 74,
		backgroundColor: '#242424',
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 8,
	},
	analysisValue: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '900',
		marginTop: 4,
	},
	analysisLabel: {
		color: '#aaa',
		fontSize: 10,
		fontWeight: '800',
		marginTop: 3,
		textAlign: 'center',
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: '#242424',
		borderRadius: 8,
		paddingVertical: 10,
		paddingHorizontal: 12,
	},
	bustRow: {
		borderWidth: 1,
		borderColor: '#D94A5A',
	},
	rowIdx: {
		color: '#aaa',
		fontSize: 12,
		fontWeight: '800',
	},
	rowPts: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '900',
	},
	rowValues: {
		alignItems: 'flex-end',
	},
	rowRemaining: {
		color: '#8B949E',
		fontSize: 11,
		fontWeight: '700',
		marginTop: 2,
	},
	separator: {
		height: 7,
	},
});
