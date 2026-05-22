import type { GameRow } from './db';
import type { Dart } from './db';

export type ScoreRanges = {
	'100+': number;
	'120+': number;
	'140+': number;
	'160+': number;
	'180': number;
};

export type CheckoutStats = {
	total: number;
	averageValue: number;
	dartsUsed: {
		one: number;
		two: number;
		three: number;
	};
	ranges: {
		low: number;
		mid: number;
		high: number;
	};
	mostCommon: { checkout: string; value: number; count: number }[];
};

export function parseTurns(turns: unknown): number[] {
	if (Array.isArray(turns)) {
		return turns.map(Number).filter(Number.isFinite);
	}

	if (typeof turns !== 'string') return [];

	try {
		const parsed = JSON.parse(turns);
		return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
	} catch {
		return [];
	}
}

export function isAdvancedGame(game: Pick<GameRow, 'hits'>): boolean {
	return Boolean(game.hits && game.hits !== '[]' && game.hits !== 'null');
}

export function normalizeDart(dart: Dart): Dart {
	if (dart.bed === 25 && dart.m === 2) return { bed: 50, m: 1 };
	if (dart.bed === 25) return { bed: 25, m: 1 };
	return dart;
}

export function parseHits(hits: unknown): Dart[] {
	if (!hits || hits === 'null') return [];
	const raw = Array.isArray(hits) ? hits : safeParseArray(hits);
	return raw
		.map(item => {
			if (!item || typeof item !== 'object') return null;
			const dart = item as Partial<Dart>;
			const bed = Number(dart.bed);
			const m = Number(dart.m);
			if (!Number.isFinite(bed) || ![1, 2, 3].includes(m)) return null;
			return normalizeDart({ bed, m: m as 1 | 2 | 3 });
		})
		.filter((dart): dart is Dart => dart != null);
}

function safeParseArray(value: unknown): unknown[] {
	if (typeof value !== 'string') return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function isForfeitedGame(game: Pick<GameRow, 'forfeited'>): boolean {
	return game.forfeited === 1 || game.forfeited === true;
}

export function calculateAvg3(totalScore: number, totalDarts: number): number {
	return totalDarts > 0 ? (totalScore / totalDarts) * 3 : 0;
}

export function createEmptyScoreRanges(): ScoreRanges {
	return { '100+': 0, '120+': 0, '140+': 0, '160+': 0, '180': 0 };
}

export function addTurnToScoreRanges(scoreRanges: ScoreRanges, turn: number) {
	if (turn >= 100) scoreRanges['100+']++;
	if (turn >= 120) scoreRanges['120+']++;
	if (turn >= 140) scoreRanges['140+']++;
	if (turn >= 160) scoreRanges['160+']++;
	if (turn === 180) scoreRanges['180']++;
}

export function calculateCheckoutValue(checkout: string | null | undefined): number {
	if (!checkout || checkout === 'null') return 0;

	return checkout
		.split(' ')
		.map(shot => {
			if (shot.startsWith('T')) return parseInt(shot.slice(1), 10) * 3;
			if (shot.startsWith('D')) return parseInt(shot.slice(1), 10) * 2;
			if (shot === 'Bull') return 50;
			if (shot === '25') return 25;
			return parseInt(shot, 10) || 0;
		})
		.reduce((sum, value) => sum + value, 0);
}

export function createEmptyCheckoutStats(): CheckoutStats {
	return {
		total: 0,
		averageValue: 0,
		dartsUsed: { one: 0, two: 0, three: 0 },
		ranges: { low: 0, mid: 0, high: 0 },
		mostCommon: [],
	};
}

export function calculateCheckoutStats(games: GameRow[]): CheckoutStats {
	const checkoutCounts = new Map<string, { value: number; count: number }>();
	const stats = createEmptyCheckoutStats();
	let totalValue = 0;

	games.forEach(game => {
		if (!game.checkout || game.checkout === 'null' || isForfeitedGame(game)) return;

		const value = calculateCheckoutValue(game.checkout);
		if (value <= 0) return;

		const turns = parseTurns(game.turns);
		const dartsUsed = getCheckoutDartsUsed(game, turns);
		const existing = checkoutCounts.get(game.checkout);

		stats.total++;
		totalValue += value;

		if (dartsUsed === 1) stats.dartsUsed.one++;
		if (dartsUsed === 2) stats.dartsUsed.two++;
		if (dartsUsed === 3) stats.dartsUsed.three++;

		if (value <= 40) stats.ranges.low++;
		else if (value <= 100) stats.ranges.mid++;
		else stats.ranges.high++;

		checkoutCounts.set(game.checkout, {
			value,
			count: existing ? existing.count + 1 : 1,
		});
	});

	stats.averageValue = stats.total > 0 ? Math.round((totalValue / stats.total) * 10) / 10 : 0;
	stats.mostCommon = Array.from(checkoutCounts.entries())
		.map(([checkout, item]) => ({ checkout, value: item.value, count: item.count }))
		.sort((a, b) => b.count - a.count || b.value - a.value)
		.slice(0, 3);

	return stats;
}

function getCheckoutDartsUsed(game: GameRow, turns: number[]) {
	const estimatedLastTurnDarts = turns.length > 0 ? game.darts - (turns.length - 1) * 3 : 0;
	if (estimatedLastTurnDarts >= 1 && estimatedLastTurnDarts <= 3) return estimatedLastTurnDarts;
	return game.checkout?.trim().split(/\s+/).filter(Boolean).length ?? 1;
}
