import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';

import { StatsSummary } from '../components/stats/SummaryModal';
import { calculateComprehensiveStats, ComprehensiveStats, deleteStatById } from '../database/statsRepository';
import {
	calculateTrainingStats,
	deleteTrainingSession,
	getTrainingSessions,
	TrainingSession,
	TrainingStats,
} from '../database/trainingRepository';
import { fetchGames, GameRow } from '../lib/db';
import {
	addTurnToScoreRanges,
	calculateAvg3,
	calculateCheckoutValue,
	createEmptyScoreRanges,
	isAdvancedGame,
	isForfeitedGame,
	parseTurns,
} from '../lib/dartsStats';

export type StatsPeriodFilter = 'all' | '7d' | '30d';
export type StatsVariantFilter = 'all' | '301' | '401' | '501';
export type StatsModeFilter = 'all' | 'simple' | 'advanced';
export type StatsStatusFilter = 'all' | 'completed' | 'forfeited';

export type StatsFilters = {
	period: StatsPeriodFilter;
	variant: StatsVariantFilter;
	mode: StatsModeFilter;
	status: StatsStatusFilter;
};

const DEFAULT_FILTERS: StatsFilters = {
	period: 'all',
	variant: 'all',
	mode: 'all',
	status: 'all',
};

type ModeStats = StatsSummary['modeStats'];

export function useStatsData() {
	const [games, setGames] = useState<GameRow[]>([]);
	const [trainingStats, setTrainingStats] = useState<TrainingStats | null>(null);
	const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
	const [filters, setFilters] = useState<StatsFilters>(DEFAULT_FILTERS);

	const refreshStats = useCallback(() => {
		const fetchedGames = fetchGames();
		const fetchedTrainingSessions = getTrainingSessions();

		setGames(fetchedGames);
		setTrainingSessions(fetchedTrainingSessions);
		setTrainingStats(calculateTrainingStats(fetchedTrainingSessions));
	}, []);

	useFocusEffect(
		useCallback(() => {
			try {
				refreshStats();
			} catch (error) {
				console.warn('Stats refresh error:', error);
			}
		}, [refreshStats])
	);

	const filteredGames = useMemo(() => filterGames(games, filters), [filters, games]);
	const comprehensiveStats = useMemo(() => calculateComprehensiveStats(filteredGames), [filteredGames]);
	const screenStats = useMemo(
		() => calculateScreenStats(filteredGames, comprehensiveStats),
		[comprehensiveStats, filteredGames]
	);
	const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

	const updateFilter = useCallback(<K extends keyof StatsFilters>(key: K, value: StatsFilters[K]) => {
		setFilters(prev => ({ ...prev, [key]: value }));
	}, []);

	const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

	const deleteGame = useCallback(
		(id: number) => {
			deleteStatById(id);
			refreshStats();
		},
		[refreshStats]
	);

	const deleteSession = useCallback(
		(id: number) => {
			deleteTrainingSession(id);
			refreshStats();
		},
		[refreshStats]
	);

	return {
		games,
		filteredGames,
		comprehensiveStats,
		screenStats,
		trainingStats,
		trainingSessions,
		filters,
		activeFilterCount,
		updateFilter,
		resetFilters,
		refreshStats,
		deleteGame,
		deleteSession,
	};
}

function filterGames(games: GameRow[], filters: StatsFilters) {
	const minDate = getMinDate(filters.period);

	return games.filter(game => {
		if (filters.variant !== 'all' && game.start !== Number(filters.variant)) return false;
		if (filters.mode !== 'all') {
			const mode = isAdvancedGame(game) ? 'advanced' : 'simple';
			if (mode !== filters.mode) return false;
		}
		if (filters.status !== 'all') {
			const status = isForfeitedGame(game) ? 'forfeited' : 'completed';
			if (status !== filters.status) return false;
		}
		if (minDate && new Date(game.date).getTime() < minDate.getTime()) return false;
		return true;
	});
}

function getMinDate(period: StatsPeriodFilter) {
	if (period === 'all') return null;
	const days = period === '7d' ? 7 : 30;
	const minDate = new Date();
	minDate.setDate(minDate.getDate() - days);
	return minDate;
}

function countActiveFilters(filters: StatsFilters) {
	return Object.values(filters).filter(value => value !== 'all').length;
}

function calculateScreenStats(games: GameRow[], comprehensiveStats: ComprehensiveStats | null): StatsSummary {
	if (comprehensiveStats) {
		return {
			played: comprehensiveStats.totalGames,
			g501: comprehensiveStats.gameVariants['501'],
			g401: comprehensiveStats.gameVariants['401'],
			g301: comprehensiveStats.gameVariants['301'],
			bestAvg: comprehensiveStats.performance.bestAvg.toFixed(1),
			allDarts: comprehensiveStats.performance.totalDarts,
			allAvg: comprehensiveStats.performance.overallAvg.toFixed(1),
			highestCheckout: comprehensiveStats.achievements.highestFinish,
			count180s: comprehensiveStats.achievements.count180s,
			forfeitedGames: comprehensiveStats.completion.forfeited,
			completedGames: comprehensiveStats.completion.completed,
			scoreRanges: comprehensiveStats.scoreRanges,
			modeStats: {
				simple: comprehensiveStats.modePerformance.simple,
				advanced: comprehensiveStats.modePerformance.advanced,
			},
		};
	}

	const played = games.length;
	const g501 = games.filter(game => game.start === 501).length;
	const g401 = games.filter(game => game.start === 401).length;
	const g301 = games.filter(game => game.start === 301).length;
	const bestAvg = Math.max(...games.map(game => game.avg3), 0).toFixed(1);
	const allDarts = games.reduce((sum, game) => sum + game.darts, 0);
	const allAvg = calculateAvg3(
		games.reduce((sum, game) => sum + game.scored, 0),
		allDarts
	).toFixed(1);
	const highestCheckout = Math.max(
		...games.map(game => {
			if (game.checkout && game.checkout !== 'null' && !isForfeitedGame(game)) {
				return calculateCheckoutValue(game.checkout);
			}
			return 0;
		}),
		0
	);
	const count180s = games.reduce((count, game) => {
		const turns = parseTurns(game.turns);
		return count + turns.filter(turn => turn === 180).length;
	}, 0);
	const forfeitedGames = games.filter(isForfeitedGame).length;
	const completedGames = played - forfeitedGames;
	const scoreRanges = createEmptyScoreRanges();
	const modeStats: ModeStats = {
		simple: { games: 0, avg3: 0, bestAvg: 0, totalDarts: 0, totalScore: 0 },
		advanced: { games: 0, avg3: 0, bestAvg: 0, totalDarts: 0, totalScore: 0 },
	};

	games.forEach(game => {
		const turns = parseTurns(game.turns);
		const mode = isAdvancedGame(game) ? modeStats.advanced : modeStats.simple;

		turns.forEach(turn => addTurnToScoreRanges(scoreRanges, turn));
		mode.games++;
		mode.totalDarts += game.darts;
		mode.totalScore += game.scored;
		if (game.avg3 > mode.bestAvg) mode.bestAvg = game.avg3;
	});

	if (modeStats.simple.totalDarts > 0) {
		modeStats.simple.avg3 = calculateAvg3(modeStats.simple.totalScore, modeStats.simple.totalDarts);
	}
	if (modeStats.advanced.totalDarts > 0) {
		modeStats.advanced.avg3 = calculateAvg3(modeStats.advanced.totalScore, modeStats.advanced.totalDarts);
	}

	return {
		played,
		g501,
		g401,
		g301,
		bestAvg,
		allDarts,
		allAvg,
		highestCheckout,
		count180s,
		forfeitedGames,
		completedGames,
		scoreRanges,
		modeStats,
	};
}
