import { db } from '../lib/db';

export interface TrainingSession {
	id?: number;
	date: string;
	targets: number;
	hits: number;
	misses: number;
	duration: number; // in seconds
	successRate: number;
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

// Note: Training table is now initialized directly in lib/db.ts to avoid circular imports

// Save a training session
export function saveTrainingSession(session: TrainingSession): number {
	try {
		const result = db.runSync(
			`INSERT INTO training_sessions 
			(date, targets, hits, misses, duration, success_rate, targets_practiced, target_results)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			session.date,
			session.targets,
			session.hits,
			session.misses,
			session.duration,
			session.successRate,
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
	const rows = db.getAllSync('SELECT * FROM training_sessions ORDER BY date DESC') as any[];

	return rows.map(row => ({
		id: row.id,
		date: row.date,
		targets: row.targets,
		hits: row.hits,
		misses: row.misses,
		duration: row.duration,
		successRate: row.success_rate,
		targetsPracticed: JSON.parse(row.targets_practiced),
		targetResults: row.target_results ? JSON.parse(row.target_results) : [],
	}));
}

// Get training statistics
export function getTrainingStats(): TrainingStats {
	const sessions = getTrainingSessions();

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

	const totalSessions = sessions.length;
	const totalTargets = sessions.reduce((sum, s) => sum + s.targets, 0);
	const totalHits = sessions.reduce((sum, s) => sum + s.hits, 0);
	const overallSuccessRate = totalTargets > 0 ? (totalHits / totalTargets) * 100 : 0;

	const bestSession = sessions.reduce((best, current) => (current.successRate > best.successRate ? current : best));

	const averageSessionLength = sessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions;

	// Count most practiced targets
	const targetCounts: { [key: string]: number } = {};
	sessions.forEach(session => {
		session.targetsPracticed.forEach(target => {
			targetCounts[target] = (targetCounts[target] || 0) + 1;
		});
	});

	const mostPracticedTargets = Object.entries(targetCounts)
		.map(([target, count]) => ({ target, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);

	return {
		totalSessions,
		totalTargets,
		totalHits,
		overallSuccessRate: Math.round(overallSuccessRate * 10) / 10,
		bestSession,
		averageSessionLength: Math.round(averageSessionLength),
		mostPracticedTargets,
	};
}

// Get recent training sessions (last 10)
export function getRecentTrainingSessions(limit: number = 10): TrainingSession[] {
	const rows = db.getAllSync('SELECT * FROM training_sessions ORDER BY date DESC LIMIT ?', limit) as any[];

	return rows.map(row => ({
		id: row.id,
		date: row.date,
		targets: row.targets,
		hits: row.hits,
		misses: row.misses,
		duration: row.duration,
		successRate: row.success_rate,
		targetsPracticed: JSON.parse(row.targets_practiced),
		targetResults: row.target_results ? JSON.parse(row.target_results) : [],
	}));
}

// Delete a training session
export function deleteTrainingSession(id: number): void {
	db.runSync('DELETE FROM training_sessions WHERE id = ?', id);
}

// Clear all training data
export function clearTrainingData(): void {
	db.runSync('DELETE FROM training_sessions');
}
