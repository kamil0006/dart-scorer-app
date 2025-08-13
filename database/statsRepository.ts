import { db } from '../lib/db';

export function deleteStatById(id: number) {
	db.runSync('DELETE FROM games WHERE id = ?;', id);
}

// Enhanced statistics for both modes
export function getComprehensiveStats() {
	const games = db.getAllSync('SELECT * FROM games ORDER BY id DESC;');

	if (games.length === 0) {
		return {
			totalGames: 0,
			gameVariants: { '301': 0, '501': 0 },
			modeStats: { simple: 0, advanced: 0 },
			performance: { bestAvg: 0, overallAvg: 0, totalDarts: 0, totalScore: 0 },
			completion: { completed: 0, forfeited: 0, successRate: 0 },
			achievements: { highestFinish: 0, count180s: 0, bestCheckout: 0 },
			scoreRanges: { '100+': 0, '120+': 0, '140+': 0, '160+': 0, '180': 0 },
			recentTrends: { last5Games: [], last10Games: [] },
			gameLength: { shortest: 0, longest: 0, average: 0 },
		};
	}

	// Basic counts
	const totalGames = games.length;
	const g501 = games.filter(g => g.start === 501).length;
	const g301 = totalGames - g501;

	// Mode detection and counting
	const modeStats = { simple: 0, advanced: 0 };
	const modePerformance = {
		simple: { games: 0, totalDarts: 0, totalScore: 0, bestAvg: 0 },
		advanced: { games: 0, totalDarts: 0, totalScore: 0, bestAvg: 0 },
	};

	// Performance tracking
	let bestAvg = 0;
	let totalDarts = 0;
	let totalScore = 0;
	let highestFinish = 0;
	let count180s = 0;
	let bestCheckout = 0;

	// Score ranges
	const scoreRanges = { '100+': 0, '120+': 0, '140+': 0, '160+': 0, '180': 0 };

	// Game completion
	let completed = 0;
	let forfeited = 0;

	// Game length tracking
	const gameLengths: number[] = [];

	games.forEach(game => {
		const turns = JSON.parse(game.turns);
		const isAdvanced = game.hits && game.hits !== '[]' && game.hits !== 'null';
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
		turns.forEach((turn: number) => {
			if (turn >= 100) scoreRanges['100+']++;
			if (turn >= 120) scoreRanges['120+']++;
			if (turn >= 140) scoreRanges['140+']++;
			if (turn >= 160) scoreRanges['160+']++;
			if (turn === 180) scoreRanges['180']++;
		});

		// 180s counting
		count180s += turns.filter((turn: number) => turn === 180).length;

		// Game completion
		if (game.forfeited === 1 || game.forfeited === true) {
			forfeited++;
		} else {
			completed++;
		}

		// Checkout tracking
		if (game.checkout && game.checkout !== 'null') {
			const checkoutValue = calculateCheckoutValue(game.checkout);
			if (checkoutValue > highestFinish) highestFinish = checkoutValue;
			if (checkoutValue > bestCheckout) bestCheckout = checkoutValue;
		}

		// Game length
		gameLengths.push(gameLength);
	});

	// Calculate averages
	const overallAvg = totalGames > 0 ? (totalScore / totalDarts) * 3 : 0;

	// Calculate mode averages
	if (modePerformance.simple.games > 0) {
		modePerformance.simple.avg3 = (modePerformance.simple.totalScore / modePerformance.simple.totalDarts) * 3;
	}
	if (modePerformance.advanced.games > 0) {
		modePerformance.advanced.avg3 = (modePerformance.advanced.totalScore / modePerformance.advanced.totalDarts) * 3;
	}

	// Recent trends (last 5 and 10 games)
	const last5Games = games.slice(0, 5).map(g => ({
		avg: g.avg3,
		variant: g.start,
		mode: g.hits && g.hits !== '[]' ? 'advanced' : 'simple',
		completed: !(g.forfeited === 1 || g.forfeited === true),
	}));

	const last10Games = games.slice(0, 10).map(g => ({
		avg: g.avg3,
		variant: g.start,
		mode: g.hits && g.hits !== '[]' ? 'advanced' : 'simple',
		completed: !(g.forfeited === 1 || g.forfeited === true),
	}));

	// Game length statistics
	const shortest = Math.min(...gameLengths);
	const longest = Math.max(...gameLengths);
	const averageLength = gameLengths.reduce((sum, len) => sum + len, 0) / gameLengths.length;

	return {
		totalGames,
		gameVariants: { '301': g301, '501': g501 },
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
		scoreRanges,
		recentTrends: { last5Games, last10Games },
		gameLength: {
			shortest,
			longest,
			average: Math.round(averageLength * 10) / 10,
		},
	};
}

// Helper function to calculate checkout value
function calculateCheckoutValue(checkout: string): number {
	const checkoutValues = checkout.split(' ').map((shot: string) => {
		if (shot.startsWith('T')) return parseInt(shot.slice(1)) * 3;
		if (shot.startsWith('D')) return parseInt(shot.slice(1)) * 2;
		if (shot === 'Bull') return 50;
		if (shot === '25') return 25;
		return parseInt(shot) || 0;
	});
	return checkoutValues.reduce((sum: number, val: number) => sum + val, 0);
}

// Get mode-specific statistics
export function getModeSpecificStats() {
	const games = db.getAllSync('SELECT * FROM games ORDER BY id DESC;');

	const modeStats = {
		simple: { games: 0, avg3: 0, bestAvg: 0, totalDarts: 0, totalScore: 0, variants: { '301': 0, '501': 0 } },
		advanced: { games: 0, avg3: 0, bestAvg: 0, totalDarts: 0, totalScore: 0, variants: { '301': 0, '501': 0 } },
	};

	games.forEach(game => {
		const isAdvanced = game.hits && game.hits !== '[]' && game.hits !== 'null';
		const mode = isAdvanced ? 'advanced' : 'simple';

		modeStats[mode].games++;
		modeStats[mode].totalDarts += game.darts;
		modeStats[mode].totalScore += game.scored;
		modeStats[mode].variants[game.start as '301' | '501']++;

		if (game.avg3 > modeStats[mode].bestAvg) {
			modeStats[mode].bestAvg = game.avg3;
		}
	});

	// Calculate averages
	if (modeStats.simple.games > 0) {
		modeStats.simple.avg3 = (modeStats.simple.totalScore / modeStats.simple.totalDarts) * 3;
	}
	if (modeStats.advanced.games > 0) {
		modeStats.advanced.avg3 = (modeStats.advanced.totalScore / modeStats.advanced.totalDarts) * 3;
	}

	return modeStats;
}
