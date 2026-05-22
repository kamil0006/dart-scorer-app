import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
	calculateTrainingStats,
	getBobs27Outcome,
} from '../../database/trainingRepository';
import type { TrainingMode, TrainingSession, TrainingStats } from '../../database/trainingRepository';
import { useLanguage } from '../../lib/LanguageContext';
import type { LocalizedStrings } from '../../lib/localization';
import TrainingSessionsList from './TrainingSessionsList';

type Props = {
	visible: boolean;
	sessions: TrainingSession[];
	stats: TrainingStats | null;
	onClose: () => void;
	onDeleteSession: (id: number) => void;
};

export default function TrainingSessionsModal({ visible, sessions, stats, onClose, onDeleteSession }: Props) {
	const { strings } = useLanguage();
	const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
	const [modeFilter, setModeFilter] = useState<TrainingMode | 'all'>('all');
	const [bobsFilter, setBobsFilter] = useState<'all' | 'won' | 'lost'>('all');
	const [showFilters, setShowFilters] = useState(false);

	const modeOptions = useMemo(() => {
		const modes = new Set(sessions.map(session => session.trainingMode));
		return Array.from(modes);
	}, [sessions]);

	const filteredSessions = useMemo(
		() =>
			sessions.filter(session => {
				const modeMatches = modeFilter === 'all' || session.trainingMode === modeFilter;
				const outcome = getBobs27Outcome(session);
				const bobsMatches = bobsFilter === 'all' || outcome === bobsFilter;
				return modeMatches && bobsMatches;
			}),
		[bobsFilter, modeFilter, sessions]
	);

	const filteredStats = useMemo(() => calculateTrainingStats(filteredSessions), [filteredSessions]);
	const hasSessions = Boolean(stats && stats.totalSessions > 0);
	const activeFilterCount = (modeFilter !== 'all' ? 1 : 0) + (bobsFilter !== 'all' ? 1 : 0);

	const confirmDelete = () => {
		if (sessionToDelete == null) return;
		onDeleteSession(sessionToDelete);
		setSessionToDelete(null);
	};

	return (
		<Modal visible={visible} animationType='slide' presentationStyle='fullScreen' onRequestClose={onClose}>
			<GestureHandlerRootView style={styles.container}>
				<SafeAreaView style={styles.safeArea}>
					<View style={styles.header}>
						<View style={styles.headerCopy}>
							<Text style={styles.title}>{strings.trainingSessions}</Text>
							<Text style={styles.subtitle}>{strings.trainingSessionsCount}: {filteredStats.totalSessions}</Text>
						</View>
						<Pressable style={styles.closeButton} onPress={onClose}>
							<Ionicons name='close' size={24} color='#fff' />
						</Pressable>
					</View>

					{hasSessions ? (
						<View style={styles.content}>
							<Pressable
								style={[styles.filterToggle, (showFilters || activeFilterCount > 0) && styles.filterToggleActive]}
								onPress={() => setShowFilters(current => !current)}>
								<View style={styles.filterToggleLabel}>
									<MaterialIcons name='filter-list' size={18} color={showFilters || activeFilterCount > 0 ? '#10243F' : '#8AB4F8'} />
									<Text
										style={[
											styles.filterToggleText,
											(showFilters || activeFilterCount > 0) && styles.filterToggleTextActive,
										]}>
										{strings.statsFilters}
									</Text>
								</View>
								<View style={styles.filterToggleRight}>
									{activeFilterCount > 0 && (
										<View style={styles.filterBadge}>
											<Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
										</View>
									)}
									<MaterialIcons
										name={showFilters ? 'expand-less' : 'expand-more'}
										size={20}
										color={showFilters || activeFilterCount > 0 ? '#10243F' : '#8AB4F8'}
									/>
								</View>
							</Pressable>
							{showFilters && (
								<View style={styles.filters}>
									<View style={styles.filterRow}>
										<FilterChip active={modeFilter === 'all'} label={strings.filterAll} onPress={() => setModeFilter('all')} />
										{modeOptions.map(mode => (
											<FilterChip
												key={mode}
												active={modeFilter === mode}
												label={getModeLabel(mode, strings)}
												onPress={() => setModeFilter(mode)}
											/>
										))}
									</View>
									<View style={styles.filterRow}>
										<FilterChip active={bobsFilter === 'all'} label={strings.filterAll} onPress={() => setBobsFilter('all')} />
										<FilterChip active={bobsFilter === 'won'} label={strings.bobs27Won} onPress={() => setBobsFilter('won')} />
										<FilterChip active={bobsFilter === 'lost'} label={strings.bobs27Lost} onPress={() => setBobsFilter('lost')} />
									</View>
								</View>
							)}
							<View style={styles.metrics}>
								<Metric icon='school' label={strings.trainingSessionsCount} value={filteredStats.totalSessions} />
								<Metric icon='check-circle' label={strings.trainingSuccess} value={`${filteredStats.overallSuccessRate}%`} />
								<Metric icon='gps-fixed' label={strings.totalTargets} value={filteredStats.totalTargets} />
								<Metric icon='timer' label={strings.avgLength} value={formatDurationShort(filteredStats.averageSessionLength)} />
							</View>
							<View style={styles.listArea}>
								{filteredStats.totalSessions > 0 ? (
									<TrainingSessionsList
										fullHeight
										hideHeader
										sessions={filteredSessions}
										stats={filteredStats}
										showDetails={true}
										onToggleDetails={() => undefined}
										onDeleteSession={setSessionToDelete}
									/>
								) : (
									<View style={styles.emptyState}>
										<MaterialIcons name='filter-list-off' size={36} color='#8AB4F8' />
										<Text style={styles.emptyTitle}>{strings.trainingSessions}</Text>
										<Text style={styles.emptyText}>{strings.noTrainingSessions}</Text>
									</View>
								)}
							</View>
						</View>
					) : (
						<View style={styles.content}>
							<View style={styles.emptyState}>
								<MaterialIcons name='school' size={40} color='#8AB4F8' />
								<Text style={styles.emptyTitle}>{strings.trainingSessions}</Text>
								<Text style={styles.emptyText}>{strings.noTrainingSessions}</Text>
							</View>
						</View>
					)}
				</SafeAreaView>
				<Modal
					visible={sessionToDelete != null}
					transparent={true}
					animationType='fade'
					onRequestClose={() => setSessionToDelete(null)}>
					<View style={styles.deleteOverlay}>
						<View style={styles.deleteContent}>
							<Text style={styles.deleteTitle}>{strings.deleteConfirm}</Text>
							<Text style={styles.deleteMessage}>{strings.deleteConfirmMessage}</Text>
							<View style={styles.deleteButtons}>
								<Pressable style={[styles.deleteButton, styles.deleteCancel]} onPress={() => setSessionToDelete(null)}>
									<Text style={styles.deleteButtonText}>{strings.cancel}</Text>
								</Pressable>
								<Pressable style={[styles.deleteButton, styles.deleteDanger]} onPress={confirmDelete}>
									<Text style={styles.deleteButtonText}>{strings.delete}</Text>
								</Pressable>
							</View>
						</View>
					</View>
				</Modal>
			</GestureHandlerRootView>
		</Modal>
	);
}

function getModeLabel(mode: TrainingMode, strings: LocalizedStrings) {
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

function formatDurationShort(seconds: number) {
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}m`;

	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
}

function Metric({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string | number }) {
	return (
		<View style={styles.metric}>
			<MaterialIcons name={icon} size={15} color='#8AB4F8' />
			<Text style={styles.metricValue}>{value}</Text>
			<Text style={styles.metricLabel} numberOfLines={1}>
				{label}
			</Text>
		</View>
	);
}

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
	return (
		<Pressable style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}>
			<Text style={[styles.filterChipText, active && styles.filterChipTextActive]} numberOfLines={1}>
				{label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
	},
	safeArea: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#333',
	},
	headerCopy: {
		flex: 1,
		paddingRight: 12,
	},
	title: {
		color: '#8AB4F8',
		fontSize: 22,
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
		alignItems: 'center',
		justifyContent: 'center',
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 40,
	},
	filters: {
		gap: 8,
		marginBottom: 10,
	},
	filterToggle: {
		minHeight: 42,
		backgroundColor: '#1A1A1A',
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		paddingHorizontal: 12,
		marginBottom: 10,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	filterToggleActive: {
		backgroundColor: '#8AB4F8',
		borderColor: '#8AB4F8',
	},
	filterToggleLabel: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	filterToggleText: {
		color: '#8AB4F8',
		fontSize: 13,
		fontWeight: '800',
	},
	filterToggleTextActive: {
		color: '#10243F',
	},
	filterToggleRight: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	filterBadge: {
		minWidth: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: '#60D394',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 5,
	},
	filterBadgeText: {
		color: '#10243F',
		fontSize: 11,
		fontWeight: '900',
	},
	filterRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	filterChip: {
		minHeight: 30,
		maxWidth: '47%',
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#333',
		backgroundColor: '#1A1A1A',
		paddingHorizontal: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	filterChipActive: {
		backgroundColor: '#8AB4F8',
		borderColor: '#8AB4F8',
	},
	filterChipText: {
		color: '#D5DCE5',
		fontSize: 11,
		fontWeight: '800',
	},
	filterChipTextActive: {
		color: '#10243F',
	},
	metrics: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 10,
	},
	listArea: {
		flex: 1,
	},
	metric: {
		width: '48.5%',
		minHeight: 58,
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 4,
		paddingVertical: 6,
	},
	metricValue: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '800',
		marginTop: 3,
	},
	metricLabel: {
		color: '#aaa',
		fontSize: 10,
		fontWeight: '600',
		marginTop: 2,
		textAlign: 'center',
	},
	emptyState: {
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 24,
		alignItems: 'center',
	},
	emptyTitle: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '800',
		marginTop: 12,
	},
	emptyText: {
		color: '#aaa',
		fontSize: 13,
		textAlign: 'center',
		marginTop: 6,
	},
	deleteOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	deleteContent: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		padding: 24,
		width: '100%',
		maxWidth: 320,
		borderWidth: 1,
		borderColor: '#333',
	},
	deleteTitle: {
		fontSize: 18,
		fontWeight: '800',
		color: '#fff',
		textAlign: 'center',
		marginBottom: 12,
	},
	deleteMessage: {
		fontSize: 14,
		color: '#ccc',
		textAlign: 'center',
		marginBottom: 20,
		lineHeight: 20,
	},
	deleteButtons: {
		flexDirection: 'row',
		gap: 12,
	},
	deleteButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	deleteCancel: {
		backgroundColor: '#666',
	},
	deleteDanger: {
		backgroundColor: '#B00020',
	},
	deleteButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '700',
	},
});
