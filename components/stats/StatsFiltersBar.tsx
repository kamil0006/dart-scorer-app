import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type {
	StatsFilters,
	StatsModeFilter,
	StatsPeriodFilter,
	StatsStatusFilter,
	StatsVariantFilter,
} from '../../hooks/useStatsData';
import { useLanguage } from '../../lib/LanguageContext';

type Props = {
	filters: StatsFilters;
	activeFilterCount: number;
	resultCount: number;
	totalCount: number;
	onChange: <K extends keyof StatsFilters>(key: K, value: StatsFilters[K]) => void;
	onReset: () => void;
	embedded?: boolean;
};

export default function StatsFiltersBar({
	filters,
	activeFilterCount,
	resultCount,
	totalCount,
	onChange,
	onReset,
	embedded = false,
}: Props) {
	const { strings } = useLanguage();
	const [expanded, setExpanded] = useState(false);
	const showBody = embedded || expanded;

	return (
		<View style={[styles.container, embedded && styles.containerEmbedded]}>
			{embedded ? (
				<View style={styles.embeddedHeader}>
					<Text style={styles.embeddedTitle}>{strings.statsFiltersTitle}</Text>
					<Text style={styles.resultText}>
						{resultCount}/{totalCount}
					</Text>
				</View>
			) : (
				<Pressable style={styles.header} onPress={() => setExpanded(prev => !prev)}>
					<View style={styles.headerTitle}>
						<MaterialIcons name='filter-list' size={20} color='#8AB4F8' />
						<Text style={styles.title}>{strings.statsFilters}</Text>
						{activeFilterCount > 0 && (
							<View style={styles.badge}>
								<Text style={styles.badgeText}>{activeFilterCount}</Text>
							</View>
						)}
					</View>
					<Text style={styles.resultText}>
						{resultCount}/{totalCount}
					</Text>
					{activeFilterCount > 0 && (
						<Pressable
							style={styles.resetButton}
							onPress={event => {
								event.stopPropagation();
								onReset();
							}}>
							<MaterialIcons name='close' size={16} color='#fff' />
							<Text style={styles.resetText}>{strings.clearFilters}</Text>
						</Pressable>
					)}
					<MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={24} color='#8AB4F8' />
				</Pressable>
			)}

			{!showBody && activeFilterCount > 0 && (
				<Text style={styles.compactSummary}>{getCompactSummary(filters, strings)}</Text>
			)}

			{showBody && (
				<View style={styles.filterBody}>
					{embedded && activeFilterCount > 0 && (
						<Pressable style={styles.embeddedReset} onPress={onReset}>
							<MaterialIcons name='close' size={16} color='#fff' />
							<Text style={styles.resetText}>{strings.clearFilters}</Text>
						</Pressable>
					)}
					<FilterRow
						label={strings.filterPeriod}
						options={[
							{ label: strings.filterAll, value: 'all' },
							{ label: strings.filterLast7Days, value: '7d' },
							{ label: strings.filterLast30Days, value: '30d' },
						]}
						value={filters.period}
						onChange={value => onChange('period', value)}
					/>
					<FilterRow
						label={strings.filterGame}
						options={[
							{ label: strings.filterAll, value: 'all' },
							{ label: '301', value: '301' },
							{ label: '401', value: '401' },
							{ label: '501', value: '501' },
						]}
						value={filters.variant}
						onChange={value => onChange('variant', value)}
					/>
					<FilterRow
						label={strings.filterMode}
						options={[
							{ label: strings.filterAll, value: 'all' },
							{ label: strings.simple, value: 'simple' },
							{ label: strings.advanced, value: 'advanced' },
						]}
						value={filters.mode}
						onChange={value => onChange('mode', value)}
					/>
					<FilterRow
						label={strings.filterStatus}
						options={[
							{ label: strings.filterAll, value: 'all' },
							{ label: strings.completed, value: 'completed' },
							{ label: strings.forfeited, value: 'forfeited' },
						]}
						value={filters.status}
						onChange={value => onChange('status', value)}
					/>
				</View>
			)}
		</View>
	);
}

function getCompactSummary(filters: StatsFilters, strings: ReturnType<typeof useLanguage>['strings']) {
	const parts = [
		filters.period !== 'all' ? (filters.period === '7d' ? strings.filterLast7Days : strings.filterLast30Days) : null,
		filters.variant !== 'all' ? filters.variant : null,
		filters.mode !== 'all' ? (filters.mode === 'simple' ? strings.simple : strings.advanced) : null,
		filters.status !== 'all' ? (filters.status === 'completed' ? strings.completed : strings.forfeited) : null,
	].filter(Boolean);

	return parts.join(' | ');
}

type FilterOption<T extends string> = {
	label: string;
	value: T;
};

function FilterRow<T extends StatsPeriodFilter | StatsVariantFilter | StatsModeFilter | StatsStatusFilter>({
	label,
	options,
	value,
	onChange,
}: {
	label: string;
	options: FilterOption<T>[];
	value: T;
	onChange: (value: T) => void;
}) {
	return (
		<View style={styles.row}>
			<Text style={styles.rowLabel}>{label}</Text>
			<View style={styles.chips}>
				{options.map(option => {
					const active = option.value === value;
					return (
						<Pressable
							key={option.value}
							style={[styles.chip, active && styles.chipActive]}
							onPress={() => onChange(option.value)}>
							<Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		padding: 10,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#2A2A2A',
	},
	containerEmbedded: {
		marginBottom: 12,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		minHeight: 36,
	},
	headerTitle: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	title: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '700',
	},
	badge: {
		minWidth: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: '#8AB4F8',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 6,
	},
	badgeText: {
		color: '#0B0B0B',
		fontSize: 12,
		fontWeight: '800',
	},
	resultText: {
		color: '#8AB4F8',
		fontSize: 13,
		fontWeight: '700',
	},
	resetButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		backgroundColor: '#333',
		borderRadius: 999,
		paddingVertical: 6,
		paddingHorizontal: 10,
	},
	resetText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '600',
	},
	embeddedHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 4,
	},
	embeddedTitle: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '700',
	},
	embeddedReset: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		gap: 4,
		backgroundColor: '#333',
		borderRadius: 999,
		paddingVertical: 6,
		paddingHorizontal: 10,
		marginTop: 6,
	},
	compactSummary: {
		color: '#aaa',
		fontSize: 12,
		marginTop: 6,
	},
	filterBody: {
		marginTop: 2,
	},
	row: {
		marginTop: 10,
	},
	rowLabel: {
		color: '#aaa',
		fontSize: 12,
		fontWeight: '700',
		marginBottom: 6,
		textTransform: 'uppercase',
	},
	chips: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	chip: {
		minHeight: 34,
		justifyContent: 'center',
		borderRadius: 999,
		paddingVertical: 7,
		paddingHorizontal: 11,
		backgroundColor: '#242424',
		borderWidth: 1,
		borderColor: '#333',
	},
	chipActive: {
		backgroundColor: '#8AB4F8',
		borderColor: '#8AB4F8',
	},
	chipText: {
		color: '#ddd',
		fontSize: 13,
		fontWeight: '600',
	},
	chipTextActive: {
		color: '#0B0B0B',
	},
});
