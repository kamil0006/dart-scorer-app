import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import appConfig from '../app.json';
import { db, ensureDBReady, GameRow } from './db';

const BACKUP_SCHEMA_VERSION = 1;

type ImportMode = 'merge' | 'replace';

type BackupPayload = {
	schemaVersion: number;
	appVersion: string;
	exportedAt: string;
	games: GameBackupRow[];
	trainingSessions: TrainingSessionBackupRow[];
};

type RawRecord = Record<string, unknown>;

type GameBackupRow = GameRow & RawRecord;

type TrainingSessionBackupRow = {
	id?: number;
	date?: string;
	targets?: number;
	hits?: number;
	misses?: number;
	duration?: number;
	success_rate?: number;
	successRate?: number;
	training_mode?: string;
	trainingMode?: string;
	targets_practiced?: unknown;
	targetsPracticed?: unknown;
	target_results?: unknown;
	targetResults?: unknown;
};

function safeJsonArray(value: unknown): unknown[] {
	if (Array.isArray(value)) return value;
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
}

function safeNumberArray(value: unknown): number[] {
	return safeJsonArray(value).map(item => toNumber(item, 0));
}

function toNumber(value: unknown, fallback: number): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return fallback;
}

function isRecord(value: unknown): value is RawRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getBackupPayload(): BackupPayload {
	ensureDBReady();
	const games = db.getAllSync('SELECT * FROM games ORDER BY id ASC;') as GameBackupRow[];
	const trainingSessions = db.getAllSync('SELECT * FROM training_sessions ORDER BY id ASC;') as TrainingSessionBackupRow[];

	return {
		schemaVersion: BACKUP_SCHEMA_VERSION,
		appVersion: appConfig.expo.version,
		exportedAt: new Date().toISOString(),
		games,
		trainingSessions,
	};
}

function getWritableDirectoryUri() {
	try {
		return Paths.document.uri;
	} catch {
		return Paths.cache.uri;
	}
}

export async function exportBackupToFile() {
	const payload = getBackupPayload();
	const fileName = `dart-scorer-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
	const baseDirUri = getWritableDirectoryUri();
	const backupFile = new File(baseDirUri, fileName);

	backupFile.create({ intermediates: true, overwrite: true });
	backupFile.write(JSON.stringify(payload));

	return {
		uri: backupFile.uri,
		fileName,
		directory: baseDirUri,
		gamesCount: payload.games.length,
		trainingSessionsCount: payload.trainingSessions.length,
	};
}

export async function shareBackup(uri: string) {
	const isAvailable = await Sharing.isAvailableAsync();
	if (!isAvailable) return false;

	await Sharing.shareAsync(uri, {
		mimeType: 'application/json',
		dialogTitle: 'Share backup file',
	});
	return true;
}

export async function pickBackupFile() {
	const result = await DocumentPicker.getDocumentAsync({
		type: ['application/json', 'text/json', 'public.json'],
		copyToCacheDirectory: true,
		multiple: false,
	});

	if (result.canceled || !result.assets?.length) {
		return null;
	}

	return result.assets[0];
}

function validateBackupPayload(payload: unknown): payload is BackupPayload {
	return (
		isRecord(payload) &&
		(payload.schemaVersion === undefined || typeof payload.schemaVersion === 'number') &&
		(payload.appVersion === undefined || typeof payload.appVersion === 'string') &&
		(payload.exportedAt === undefined || typeof payload.exportedAt === 'string') &&
		Array.isArray(payload.games) &&
		payload.games.every(isRecord) &&
		Array.isArray(payload.trainingSessions) &&
		payload.trainingSessions.every(isRecord)
	);
}

function insertGame(raw: RawRecord) {
	const turnsArray = safeNumberArray(raw.turns);
	const hitsArray = safeJsonArray(raw?.hits);

	const start = toNumber(raw?.start, 501);
	const dartsFromPayload = toNumber(raw?.darts, 0);
	const scoredFromPayload = toNumber(raw?.scored, 0);

	const scoredCalculated = turnsArray.reduce((sum, n) => sum + toNumber(n, 0), 0);
	const scored = scoredFromPayload > 0 ? scoredFromPayload : scoredCalculated;

	const dartsFallback = hitsArray.length > 0 ? hitsArray.length : turnsArray.length * 3;
	const darts = dartsFromPayload > 0 ? dartsFromPayload : dartsFallback;
	const avg3 = darts > 0 ? toNumber(raw?.avg3, (scored / darts) * 3) : 0;

	const forfeited = raw?.forfeited === 1 || raw?.forfeited === true ? 1 : 0;
	const forfeitScore = raw?.forfeitScore == null ? null : toNumber(raw?.forfeitScore, 0);
	const checkout = typeof raw.checkout === 'string' && raw.checkout.length > 0 ? raw.checkout : null;
	const date = typeof raw.date === 'string' && raw.date.length > 0 ? raw.date : new Date().toISOString();

	db.runSync(
		`INSERT INTO games
    (date,start,turns,hits,darts,scored,avg3,checkout,forfeited,forfeitScore)
    VALUES (?,?,?,?,?,?,?,?,?,?);`,
		date,
		start,
		JSON.stringify(turnsArray),
		JSON.stringify(hitsArray),
		darts,
		scored,
		avg3,
		checkout,
		forfeited,
		forfeitScore
	);
}

function insertTrainingSession(raw: RawRecord) {
	const date = typeof raw.date === 'string' && raw.date.length > 0 ? raw.date : new Date().toISOString();
	const targets = toNumber(raw?.targets, 0);
	const hits = toNumber(raw?.hits, 0);
	const misses = toNumber(raw?.misses, 0);
	const duration = toNumber(raw?.duration, 0);
	const successRate = toNumber(raw?.success_rate ?? raw?.successRate, 0);
	const rawMode = raw?.training_mode ?? raw?.trainingMode;
	const trainingMode =
		rawMode === 'checkout' ||
		rawMode === 'clockClassic' ||
		rawMode === 'clockDouble' ||
		rawMode === 'clockTriple' ||
		rawMode === 'clockJump' ||
		rawMode === 'clockPenalty' ||
		rawMode === 'bobs27'
			? rawMode
			: 'target';
	const targetsPracticed = safeJsonArray(raw?.targets_practiced ?? raw?.targetsPracticed);
	const targetResults = safeJsonArray(raw?.target_results ?? raw?.targetResults);

	db.runSync(
		`INSERT INTO training_sessions
    (date, targets, hits, misses, duration, success_rate, training_mode, targets_practiced, target_results)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		date,
		targets,
		hits,
		misses,
		duration,
		successRate,
		trainingMode,
		JSON.stringify(targetsPracticed),
		JSON.stringify(targetResults)
	);
}

export async function importBackupFromFile(uri: string, mode: ImportMode) {
	ensureDBReady();
	const raw = await new File(uri).text();
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error('Invalid backup format');
	}

	if (!validateBackupPayload(parsed)) {
		throw new Error('Invalid backup format');
	}

	let importedGames = 0;
	let importedTrainingSessions = 0;

	db.execSync('BEGIN TRANSACTION;');
	try {
		if (mode === 'replace') {
			db.runSync('DELETE FROM games;');
			db.runSync('DELETE FROM training_sessions;');
		}

		for (const game of parsed.games) {
			insertGame(game);
			importedGames++;
		}

		for (const trainingSession of parsed.trainingSessions) {
			insertTrainingSession(trainingSession);
			importedTrainingSessions++;
		}

		db.execSync('COMMIT;');
	} catch (error) {
		db.execSync('ROLLBACK;');
		throw error;
	}

	return {
		importedGames,
		importedTrainingSessions,
	};
}
