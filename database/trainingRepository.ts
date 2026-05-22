import { db } from '../lib/db';

export type TrainingMode =
	| 'target'
	| 'checkout'
	| 'clockClassic'
	| 'clockDouble'
	| 'clockTriple'
	| 'clockJump'
	| 'clockPenalty'
	| 'bobs27';

export interface TrainingSession {
	id?: number;
	date: string;
	targets: number;
	hits: number;
	misses: number;
	duration: number; // in seconds
	successRate: number;
	trainingMode: TrainingMode; // explicit training mode
	targetsPracticed: string[]; // array of target types practiced
	targetResults?: { target: string; hit: boolean }[]; // individual target results
}

export interface TrainingStats {
	totalSessions: number;
	totalTargets: number;
	totalHits: number;
	overallSuccessRate: number;
	bestSession: TrainingSession | null;
	averageSessionLength: number;
	mostPracticedTargets: { target: string; count: number }[];
}

export type Bobs27Outcome = 'won' | 'lost' | null;

type TrainingSessionRow = {
	id: number;
	date: string;
	targets: number;
	hits: number;
	misses: number;
	duration: number;
	success_rate: number;
	training_mode: TrainingMode | string | null;
	targets_practiced: string | null;
	target_results: string | null;
};

// Note: Training table is now initialized directly in lib/db.ts to avoid circular imports

function safeJsonArray<T>(value: string | null | undefined): T[] {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function mapTrainingSession(row: TrainingSessionRow): TrainingSession {
	return {
		id: row.id,
		date: row.date,
		targets: row.targets,
		hits: row.hits,
		misses: row.misses,
		duration: row.duration,
		successRate: row.success_rate,
		trainingMode: normalizeTrainingMode(row.training_mode),
		targetsPracticed: safeJsonArray<string>(row.targets_practiced),
		targetResults: safeJsonArray<{ target: string; hit: boolean }>(row.target_results),
	};
}

function normalizeTrainingMode(mode: string | null): TrainingMode {
	if (
		mode === 'checkout' ||
		mode === 'clockClassic' ||
		mode === 'clockDouble' ||
		mode === 'clockTriple' ||
		mode === 'clockJump' ||
		mode === 'clockPenalty' ||
		mode === 'bobs27'
	) {
		return mode;
	}
	return 'target';
}

// Save a training session
export function saveTrainingSession(session: TrainingSession): number {
	try {
		const result = db.runSync(
			`INSERT INTO training_sessions 
			(date, targets, hits, misses, duration, success_rate, training_mode, targets_practiced, target_results)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			session.date,
			session.targets,
			session.hits,
			session.misses,
			session.duration,
			session.successRate,
			session.trainingMode,
			JSON.stringify(session.targetsPracticed),
			JSON.stringify(session.targetResults || [])
		);

		return result.lastInsertRowId as number;
	} catch (error) {
		console.error('Failed to save training session:', error);
		throw error;
	}
}

// Get all training sessions
export function getTrainingSessions(): TrainingSession[] {
	const rows = db.getAllSync('SELECT * FROM training_sessions ORDER BY date DESC') as TrainingSessionRow[];

	return rows.map(mapTrainingSession);
}

export function calculateTrainingStats(sessions: TrainingSession[]): TrainingStats {
	if (sessions.length === 0) {
		return {
			totalSessions: 0,
			totalTargets: 0,
			totalHits: 0,
			overallSuccessRate: 0,
			bestSession: null,
			averageSessionLength: 0,
			mostPracticedTargets: [],
		};
	}

	// Single pass through sessions for better performance
	const stats = sessions.reduce(
		(acc, session) => {
			acc.totalTargets += session.targets;
			acc.totalHits += session.hits;
			acc.totalDuration += session.duration;

			// Track best session
			if (!acc.bestSession || session.successRate > acc.bestSession.successRate) {
				acc.bestSession = session;
			}

			// Count target practice frequency
			session.targetsPracticed.forEach(target => {
				acc.targetCounts[target] = (acc.targetCounts[target] || 0) + 1;
			});

			return acc;
		},
		{
			totalTargets: 0,
			totalHits: 0,
			totalDuration: 0,
			bestSession: null as TrainingSession | null,
			targetCounts: {} as { [key: string]: number },
		}
	);

	const totalSessions = sessions.length;
	const overallSuccessRate = stats.totalTargets > 0 ? (stats.totalHits / stats.totalTargets) * 100 : 0;
	const averageSessionLength = stats.totalDuration / totalSessions;

	// Get top 5 most practiced targets
	const mostPracticedTargets = Object.entries(stats.targetCounts)
		.map(([target, count]) => ({ target, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);

	return {
		totalSessions,
		totalTargets: stats.totalTargets,
		totalHits: stats.totalHits,
		overallSuccessRate: Math.round(overallSuccessRate * 10) / 10,
		bestSession: stats.bestSession,
		averageSessionLength: Math.round(averageSessionLength),
		mostPracticedTargets,
	};
}

export function getBobs27FinalScore(session: TrainingSession): number | null {
	if (session.trainingMode !== 'bobs27') return null;

	const scoreEntry = session.targetResults?.find(result => result.target.startsWith('Score '));
	if (!scoreEntry) return null;

	const score = Number(scoreEntry.target.replace('Score ', ''));
	return Number.isFinite(score) ? score : null;
}

export function getBobs27Outcome(session: TrainingSession): Bobs27Outcome {
	if (session.trainingMode !== 'bobs27') return null;

	const finalScore = getBobs27FinalScore(session);
	if (finalScore != null && finalScore <= 0) return 'lost';

	return session.targetsPracticed.includes('D20') ? 'won' : null;
}

// Get training statistics
export function getTrainingStats(): TrainingStats {
	return calculateTrainingStats(getTrainingSessions());
}

// Get recent training sessions (last 10)
export function getRecentTrainingSessions(limit: number = 10): TrainingSession[] {
	const rows = db.getAllSync('SELECT * FROM training_sessions ORDER BY date DESC LIMIT ?', limit) as TrainingSessionRow[];

	return rows.map(mapTrainingSession);
}

// Delete a training session
export function deleteTrainingSession(id: number): void {
	db.runSync('DELETE FROM training_sessions WHERE id = ?', id);
}

// Clear all training data
export function clearTrainingData(): void {
	db.runSync('DELETE FROM training_sessions');
}
