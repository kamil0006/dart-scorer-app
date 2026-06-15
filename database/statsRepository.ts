import { db } from '../lib/db';
import {
	addTurnToScoreRanges,
	calculateAvg3,
	calculateCheckoutStats,
	calculateCheckoutValue,
	createEmptyScoreRanges,
	createEmptyCheckoutStats,
	isAdvancedGame,
	isForfeitedGame,
	parseTurns,
} from '../lib/dartsStats';
import { GameRow } from '../lib/db';

export type GameMode = 'simple' | 'advanced';

export type GameVariantStats = {
	'301': number;
	'401': number;
	'501': number;
};

export type ModeSummary = {
	games: number;
	totalDarts: number;
	totalScore: number;
	bestAvg: number;
	avg3: number;
};

export type RecentTrendGame = {
	avg: number;
	variant: number;
	mode: GameMode;
	completed: boolean;
};

export type ComprehensiveStats = {
	totalGames: number;
	gameVariants: GameVariantStats;
	modeStats: Record<GameMode, number>;
	modePerformance: Record<GameMode, ModeSummary>;
	performance: {
		bestAvg: number;
		overallAvg: number;
		totalDarts: number;
		totalScore: number;
	};
	completion: {
		completed: number;
		forfeited: number;
		successRate: number;
	};
	achievements: {
		highestFinish: number;
		count180s: number;
		bestCheckout: number;
	};
	checkoutStats: ReturnType<typeof createEmptyCheckoutStats>;
	scoreRanges: ReturnType<typeof createEmptyScoreRanges>;
	recentTrends: {
		last5Games: RecentTrendGame[];
		last10Games: RecentTrendGame[];
		last30Games: RecentTrendGame[];
	};
	gameLength: {
		shortest: number;
		longest: number;
		average: number;
	};
};

export function deleteStatById(id: number) {
	db.runSync('DELETE FROM games WHERE id = ?;', id);
}

// Enhanced statistics for both modes
export function calculateComprehensiveStats(games: GameRow[]): ComprehensiveStats {
	if (games.length === 0) {
		return {
			totalGames: 0,
			gameVariants: { '301': 0, '401': 0, '501': 0 },
			modeStats: { simple: 0, advanced: 0 },
			modePerformance: {
				simple: { games: 0, totalDarts: 0, totalScore: 0, bestAvg: 0, avg3: 0 },
				advanced: { games: 0, totalDarts: 0, totalScore: 0, bestAvg: 0, avg3: 0 },
			},
			performance: { bestAvg: 0, overallAvg: 0, totalDarts: 0, totalScore: 0 },
			completion: { completed: 0, forfeited: 0, successRate: 0 },
			achievements: { highestFinish: 0, count180s: 0, bestCheckout: 0 },
			checkoutStats: createEmptyCheckoutStats(),
			scoreRanges: { '100+': 0, '120+': 0, '140+': 0, '160+': 0, '180': 0 },
			recentTrends: { last5Games: [], last10Games: [], last30Games: [] },
			gameLength: { shortest: 0, longest: 0, average: 0 },
		};
	}

	// Basic counts
	const totalGames = games.length;
	const g501 = games.filter(g => g.start === 501).length;
	const g401 = games.filter(g => g.start === 401).length;
	const g301 = games.filter(g => g.start === 301).length;

	// Mode detection and counting
	const modeStats: Record<GameMode, number> = { simple: 0, advanced: 0 };
	const modePerformance = {
		simple: { games: 0, totalDarts: 0, totalScore: 0, bestAvg: 0, avg3: 0 },
		advanced: { games: 0, totalDarts: 0, totalScore: 0, bestAvg: 0, avg3: 0 },
	} satisfies Record<GameMode, ModeSummary>;

	// Performance tracking
	let bestAvg = 0;
	let totalDarts = 0;
	let totalScore = 0;
	let highestFinish = 0;
	let count180s = 0;
	let bestCheckout = 0;

	// Score ranges
	const scoreRanges = createEmptyScoreRanges();

	// Game completion
	let completed: number = 0;
	let forfeited: number = 0;

	// Game length tracking
	const gameLengths: number[] = [];

	games.forEach(game => {
		const turns = parseTurns(game.turns);
		const isAdvanced = isAdvancedGame(game);
		const gameLength = turns.length;

		// Mode counting
		if (isAdvanced) {
			modeStats.advanced++;
			modePerformance.advanced.games++;
			modePerformance.advanced.totalDarts += game.darts;
			modePerformance.advanced.totalScore += game.scored;
			if (game.avg3 > modePerformance.advanced.bestAvg) {
				modePerformance.advanced.bestAvg = game.avg3;
			}
		} else {
			modeStats.simple++;
			modePerformance.simple.games++;
			modePerformance.simple.totalDarts += game.darts;
			modePerformance.simple.totalScore += game.scored;
			if (game.avg3 > modePerformance.simple.bestAvg) {
				modePerformance.simple.bestAvg = game.avg3;
			}
		}

		// Performance tracking
		if (game.avg3 > bestAvg) bestAvg = game.avg3;
		totalDarts += game.darts;
		totalScore += game.scored;

		// Score ranges
		turns.forEach(turn => addTurnToScoreRanges(scoreRanges, turn));

		// 180s counting
		count180s += turns.filter((turn: number) => turn === 180).length;

		// Game completion
		if (isForfeitedGame(game)) {
			forfeited++;
		} else {
			completed++;
		}

		// Checkout tracking - only count completed games
		if (game.checkout && game.checkout !== 'null' && !isForfeitedGame(game)) {
			const checkoutValue = calculateCheckoutValue(game.checkout);
			if (checkoutValue > highestFinish) highestFinish = checkoutValue;
			if (checkoutValue > bestCheckout) bestCheckout = checkoutValue;
		}

		// Game length
		gameLengths.push(gameLength);
	});

	// Calculate averages
	const overallAvg = calculateAvg3(totalScore, totalDarts);

	// Calculate mode averages
	if (modePerformance.simple.totalDarts > 0) {
		modePerformance.simple.avg3 = calculateAvg3(modePerformance.simple.totalScore, modePerformance.simple.totalDarts);
	}
	if (modePerformance.advanced.totalDarts > 0) {
		modePerformance.advanced.avg3 = calculateAvg3(
			modePerformance.advanced.totalScore,
			modePerformance.advanced.totalDarts
		);
	}

	// Recent trends (last 5 and 10 games)
	const last5Games = games.slice(0, 5).map(g => ({
		avg: g.avg3,
		variant: g.start,
		mode: isAdvancedGame(g) ? ('advanced' as const) : ('simple' as const),
		completed: !isForfeitedGame(g),
	}));

	const last10Games = games.slice(0, 10).map(g => ({
		avg: g.avg3,
		variant: g.start,
		mode: isAdvancedGame(g) ? ('advanced' as const) : ('simple' as const),
		completed: !isForfeitedGame(g),
	}));

	const last30Games = games.slice(0, 30).reverse().map(g => ({
		avg: g.avg3,
		variant: g.start,
		mode: isAdvancedGame(g) ? ('advanced' as const) : ('simple' as const),
		completed: !isForfeitedGame(g),
	}));

	// Game length statistics
	const shortest = Math.min(...gameLengths);
	const longest = Math.max(...gameLengths);
	const averageLength = gameLengths.reduce((sum, len) => sum + len, 0) / gameLengths.length;

	return {
		totalGames,
		gameVariants: { '301': g301, '401': g401, '501': g501 },
		modeStats,
		modePerformance,
		performance: {
			bestAvg: Math.round(bestAvg * 10) / 10,
			overallAvg: Math.round(overallAvg * 10) / 10,
			totalDarts,
			totalScore,
		},
		completion: {
			completed,
			forfeited,
			successRate: totalGames > 0 ? Math.round((completed / totalGames) * 100) : 0,
		},
		achievements: {
			highestFinish,
			count180s,
			bestCheckout,
		},
		checkoutStats: calculateCheckoutStats(games),
		scoreRanges,
		recentTrends: { last5Games, last10Games, last30Games },
		gameLength: {
			shortest,
			longest,
			average: Math.round(averageLength * 10) / 10,
		},
	};
}

export function getComprehensiveStats(): ComprehensiveStats {
	const games = db.getAllSync('SELECT * FROM games ORDER BY id DESC;') as GameRow[];
	return calculateComprehensiveStats(games);
}

// Get mode-specific statistics
export function getModeSpecificStats() {
	const games = db.getAllSync('SELECT * FROM games ORDER BY id DESC;') as GameRow[];

	const modeStats = {
		simple: { games: 0, avg3: 0, bestAvg: 0, totalDarts: 0, totalScore: 0, variants: { '301': 0, '401': 0, '501': 0 } },
		advanced: { games: 0, avg3: 0, bestAvg: 0, totalDarts: 0, totalScore: 0, variants: { '301': 0, '401': 0, '501': 0 } },
	} satisfies Record<GameMode, ModeSummary & { variants: GameVariantStats }>;

	games.forEach(game => {
		const isAdvanced = isAdvancedGame(game);
		const mode = isAdvanced ? 'advanced' : 'simple';

		modeStats[mode].games++;
		modeStats[mode].totalDarts += game.darts;
		modeStats[mode].totalScore += game.scored;
		modeStats[mode].variants[String(game.start) as '301' | '401' | '501']++;

		if (game.avg3 > modeStats[mode].bestAvg) {
			modeStats[mode].bestAvg = game.avg3;
		}
	});

	// Calculate averages
	if (modeStats.simple.totalDarts > 0) {
		modeStats.simple.avg3 = calculateAvg3(modeStats.simple.totalScore, modeStats.simple.totalDarts);
	}
	if (modeStats.advanced.totalDarts > 0) {
		modeStats.advanced.avg3 = calculateAvg3(modeStats.advanced.totalScore, modeStats.advanced.totalDarts);
	}

	return modeStats;
}
