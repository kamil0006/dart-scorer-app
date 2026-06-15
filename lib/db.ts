import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const SCHEMA_VERSION = 2;

type DatabaseLike = {
	execSync: (source: string) => void;
	runSync: (source: string, ...params: any[]) => { lastInsertRowId: number };
	getAllSync: <T = unknown>(source: string, ...params: any[]) => T[];
	getFirstSync: <T = unknown>(source: string, ...params: any[]) => T | null;
};

function createWebPreviewDb(): DatabaseLike {
	return {
		execSync: () => undefined,
		runSync: () => ({ lastInsertRowId: 0 }),
		getAllSync: () => [],
		getFirstSync: source => {
			if (source.includes('PRAGMA user_version')) return { user_version: SCHEMA_VERSION } as never;
			return null;
		},
	};
}

export const db: DatabaseLike = Platform.OS === 'web' ? createWebPreviewDb() : SQLite.openDatabaseSync('dart.db');

type TableInfoRow = {
	cid: number;
	name: string;
	type: string;
	notnull: number;
	dflt_value: string | null;
	pk: number;
};

export type Dart = { bed: number; m: 1 | 2 | 3 };

export type GameRow = {
	id: number;
	date: string;
	start: number;
	turns: string;
	darts: number;
	scored: number;
	avg3: number;
	checkout: string | null;
	hits: string | null;
	forfeited: number | boolean;
	forfeitScore: number | null;
};

type GameInput = {
	start: number;
	turns: number[];
	hits: Dart[];
	checkout?: string;
	forfeited?: boolean;
	forfeitScore?: number;
	checkoutDarts?: number;
};

let initialized = false;
let initializing = false;

function getUserVersion() {
	const row = db.getFirstSync('PRAGMA user_version;') as { user_version?: number } | null;
	return row?.user_version ?? 0;
}

function setUserVersion(version: number) {
	db.execSync(`PRAGMA user_version = ${version};`);
}

function getColumns(tableName: string) {
	return db.getAllSync(`PRAGMA table_info('${tableName}');`) as TableInfoRow[];
}

function hasColumn(tableName: string, columnName: string) {
	return getColumns(tableName).some(column => column.name === columnName);
}

function ensureBaseTables() {
	db.execSync(`
		PRAGMA journal_mode = WAL;

		CREATE TABLE IF NOT EXISTS games (
			id INTEGER PRIMARY KEY NOT NULL,
			date TEXT,
			start INTEGER,
			turns TEXT,
			darts INTEGER,
			scored INTEGER,
			avg3 REAL,
			checkout TEXT,
			hits TEXT,
			forfeited INTEGER DEFAULT 0,
			forfeitScore INTEGER DEFAULT NULL
		);

		CREATE TABLE IF NOT EXISTS training_sessions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			date TEXT NOT NULL,
			targets INTEGER NOT NULL,
			hits INTEGER NOT NULL,
			misses INTEGER NOT NULL,
			duration INTEGER NOT NULL,
			success_rate REAL NOT NULL,
			training_mode TEXT NOT NULL DEFAULT 'target',
			targets_practiced TEXT NOT NULL,
			target_results TEXT
		);
	`);
}

function runCompatibleMigrations() {
	if (!hasColumn('games', 'hits')) {
		db.runSync("ALTER TABLE games ADD COLUMN hits TEXT DEFAULT '[]';");
	}
	if (!hasColumn('games', 'forfeited')) {
		db.runSync('ALTER TABLE games ADD COLUMN forfeited INTEGER DEFAULT 0;');
	}
	if (!hasColumn('games', 'forfeitScore')) {
		db.runSync('ALTER TABLE games ADD COLUMN forfeitScore INTEGER DEFAULT NULL;');
	}
	if (!hasColumn('training_sessions', 'target_results')) {
		db.runSync("ALTER TABLE training_sessions ADD COLUMN target_results TEXT DEFAULT '[]';");
	}
	if (!hasColumn('training_sessions', 'training_mode')) {
		db.runSync("ALTER TABLE training_sessions ADD COLUMN training_mode TEXT DEFAULT 'target';");
	}
}

export function initDB() {
	if (initialized || initializing) return;

	initializing = true;
	try {
		ensureBaseTables();
		runCompatibleMigrations();

		if (getUserVersion() < SCHEMA_VERSION) {
			setUserVersion(SCHEMA_VERSION);
		}
		initialized = true;
	} catch (error) {
		console.error('Database initialization failed:', error);
		throw error;
	} finally {
		initializing = false;
	}
}

export function ensureDBReady() {
	if (!initialized) {
		initDB();
	}
}

function getSimpleModeDarts(turns: number[], checkout?: string, checkoutDarts?: number) {
	if (!checkout || turns.length === 0) {
		return turns.length * 3;
	}

	const lastTurnDarts =
		checkoutDarts && checkoutDarts >= 1 && checkoutDarts <= 3 ? checkoutDarts : checkout.trim().split(/\s+/).length;

	return (turns.length - 1) * 3 + lastTurnDarts;
}

export function saveGame({ start, turns, hits, checkout, forfeited, forfeitScore, checkoutDarts }: GameInput) {
	ensureDBReady();

	const isAdvanced = Array.isArray(hits) && hits.length > 0;
	const darts = isAdvanced ? hits.length : getSimpleModeDarts(turns, checkout, checkoutDarts);
	const scored = turns.reduce((sum, turn) => sum + turn, 0);
	const avg3 = darts > 0 ? (scored / darts) * 3 : 0;

	db.runSync(
		`INSERT INTO games
		(date,start,turns,hits,darts,scored,avg3,checkout,forfeited,forfeitScore)
		VALUES (?,?,?,?,?,?,?,?,?,?);`,
		new Date().toISOString(),
		start,
		JSON.stringify(turns),
		JSON.stringify(hits ?? []),
		darts,
		scored,
		avg3,
		checkout ?? null,
		forfeited ? 1 : 0,
		forfeited ? forfeitScore ?? null : null
	);
}

export function fetchGames(): GameRow[] {
	ensureDBReady();
	return db.getAllSync('SELECT * FROM games ORDER BY id DESC;') as GameRow[];
}

export function clearGames() {
	ensureDBReady();
	db.runSync('DELETE FROM games;');
}
