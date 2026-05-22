import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GameHistoryList from '../components/stats/GameHistoryList';
import StatsFiltersBar from '../components/stats/StatsFiltersBar';
import SummaryModal from '../components/stats/SummaryModal';
import TrainingSessionsModal from '../components/stats/TrainingSessionsModal';
import { useStatsData } from '../hooks/useStatsData';
import { useLanguage } from '../lib/LanguageContext';

type DeleteModalConfig = {
	title: string;
	message: string;
	onConfirm: () => void;
};

export default function StatsScreen() {
	const stats = useStatsData();
	const [showSummary, setShowSummary] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [showTrainingModal, setShowTrainingModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleteModalConfig, setDeleteModalConfig] = useState<DeleteModalConfig | null>(null);
	const { strings } = useLanguage();

	const showDeleteConfirmation = (config: DeleteModalConfig) => {
		setDeleteModalConfig(config);
		setShowDeleteModal(true);
	};

	const handleDeleteOne = (id: number) =>
		showDeleteConfirmation({
			title: strings.deleteConfirm,
			message: strings.deleteConfirmMessage,
			onConfirm: () => {
				try {
					stats.deleteGame(id);
					setShowDeleteModal(false);
				} catch (error) {
					console.warn('Delete stat error:', error);
				}
			},
		});

	const handleDeleteTrainingSession = (id: number) =>
		showDeleteConfirmation({
			title: strings.deleteConfirm,
			message: strings.deleteConfirmMessage,
			onConfirm: () => {
				try {
					stats.deleteSession(id);
					setShowDeleteModal(false);
				} catch (error) {
					console.warn('Delete training session error:', error);
				}
			},
		});

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.actionBar}>
				<TopAction
					icon='analytics'
					label={strings.summaryShort}
					onPress={() => setShowSummary(true)}
				/>
				<TopAction
					icon='school'
					label={strings.trainingSessions}
					active={showTrainingModal}
					badge={stats.trainingStats?.totalSessions}
					disabled={!stats.trainingStats || stats.trainingStats.totalSessions === 0}
					onPress={() => {
						setShowTrainingModal(true);
						setShowFilters(false);
					}}
				/>
				<TopAction
					icon='filter-list'
					label={strings.statsFilters}
					active={showFilters || stats.activeFilterCount > 0}
					badge={stats.activeFilterCount || undefined}
					onPress={() => {
						setShowFilters(prev => !prev);
					}}
				/>
			</View>

			<View style={styles.quickStats}>
				<QuickStat label={strings.games} value={stats.screenStats.played} />
				<QuickStat label={strings.average} value={stats.screenStats.allAvg} />
				<QuickStat label={strings.highestFinish} value={stats.screenStats.highestCheckout} />
				<QuickStat label='180s' value={stats.screenStats.count180s} />
			</View>

			{showFilters && (
				<StatsFiltersBar
					embedded
					filters={stats.filters}
					activeFilterCount={stats.activeFilterCount}
					resultCount={stats.filteredGames.length}
					totalCount={stats.games.length}
					onChange={stats.updateFilter}
					onReset={stats.resetFilters}
				/>
			)}

			<GameHistoryList games={stats.filteredGames} onDeleteGame={handleDeleteOne} />

			<SummaryModal
				visible={showSummary}
				onClose={() => setShowSummary(false)}
				stats={stats.screenStats}
				comprehensiveStats={stats.comprehensiveStats}
				trainingStats={stats.trainingStats}
			/>

			<TrainingSessionsModal
				visible={showTrainingModal}
				sessions={stats.trainingSessions}
				stats={stats.trainingStats}
				onClose={() => setShowTrainingModal(false)}
				onDeleteSession={stats.deleteSession}
			/>

			<DeleteModal
				visible={showDeleteModal}
				config={deleteModalConfig}
				cancelText={strings.cancel}
				deleteText={strings.delete}
				onClose={() => setShowDeleteModal(false)}
			/>
		</SafeAreaView>
	);
}

function QuickStat({ label, value }: { label: string; value: string | number }) {
	return (
		<View style={styles.quickStat}>
			<Text style={styles.quickStatValue}>{value}</Text>
			<Text style={styles.quickStatLabel} numberOfLines={1}>
				{label}
			</Text>
		</View>
	);
}

function TopAction({
	icon,
	label,
	active,
	disabled,
	badge,
	onPress,
}: {
	icon: keyof typeof MaterialIcons.glyphMap;
	label: string;
	active?: boolean;
	disabled?: boolean;
	badge?: number;
	onPress: () => void;
}) {
	return (
		<Pressable
			style={[styles.topAction, active && styles.topActionActive, disabled && styles.topActionDisabled]}
			disabled={disabled}
			onPress={onPress}>
			<View style={styles.topActionIconWrap}>
				<MaterialIcons name={icon} size={20} color={active ? '#0B0B0B' : '#8AB4F8'} />
				{badge ? (
					<View style={styles.topActionBadge}>
						<Text style={styles.topActionBadgeText}>{badge > 99 ? '99+' : badge}</Text>
					</View>
				) : null}
			</View>
			<Text style={[styles.topActionText, active && styles.topActionTextActive]} numberOfLines={1}>
				{label}
			</Text>
		</Pressable>
	);
}

function DeleteModal({
	visible,
	config,
	cancelText,
	deleteText,
	onClose,
}: {
	visible: boolean;
	config: DeleteModalConfig | null;
	cancelText: string;
	deleteText: string;
	onClose: () => void;
}) {
	return (
		<Modal visible={visible} transparent={true} animationType='fade' onRequestClose={onClose}>
			<View style={styles.deleteModalOverlay}>
				<View style={styles.deleteModalContent}>
					<Text style={styles.deleteModalTitle}>{config?.title}</Text>
					<Text style={styles.deleteModalMessage}>{config?.message}</Text>
					<View style={styles.deleteModalButtons}>
						<Pressable style={[styles.deleteModalButton, styles.deleteModalButtonCancel]} onPress={onClose}>
							<Text style={styles.deleteModalButtonTextCancel}>{cancelText}</Text>
						</Pressable>
						<Pressable style={[styles.deleteModalButton, styles.deleteModalButtonDestructive]} onPress={() => config?.onConfirm()}>
							<Text style={styles.deleteModalButtonTextDestructive}>{deleteText}</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	actionBar: {
		flexDirection: 'row',
		gap: 8,
		marginTop: 8,
		marginBottom: 12,
	},
	topAction: {
		flex: 1,
		minHeight: 56,
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingHorizontal: 6,
	},
	topActionActive: {
		backgroundColor: '#8AB4F8',
		borderColor: '#8AB4F8',
	},
	topActionDisabled: {
		opacity: 0.42,
	},
	topActionIconWrap: {
		position: 'relative',
	},
	topActionBadge: {
		position: 'absolute',
		top: -9,
		right: -14,
		minWidth: 18,
		height: 18,
		borderRadius: 9,
		backgroundColor: '#60D394',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 4,
	},
	topActionBadgeText: {
		color: '#0B0B0B',
		fontSize: 10,
		fontWeight: '800',
	},
	topActionText: {
		color: '#8AB4F8',
		fontSize: 12,
		fontWeight: '700',
	},
	topActionTextActive: {
		color: '#0B0B0B',
	},
	quickStats: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 12,
	},
	quickStat: {
		flex: 1,
		minHeight: 62,
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 6,
	},
	quickStatValue: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '900',
	},
	quickStatLabel: {
		color: '#aaa',
		fontSize: 10,
		fontWeight: '800',
		marginTop: 4,
		textAlign: 'center',
	},
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
