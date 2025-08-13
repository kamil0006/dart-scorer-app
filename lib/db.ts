/* lib/db.ts — najkrótsza wersja */

import * as SQLite from 'expo-sqlite';
export const db = SQLite.openDatabaseSync('dart.db');

// Initialize training table directly to avoid circular imports
function initTrainingTable() {
	try {
		db.execSync(`
			CREATE TABLE IF NOT EXISTS training_sessions (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				date TEXT NOT NULL,
				targets INTEGER NOT NULL,
				hits INTEGER NOT NULL,
				misses INTEGER NOT NULL,
				duration INTEGER NOT NULL,
				success_rate REAL NOT NULL,
				targets_practiced TEXT NOT NULL,
				target_results TEXT
			);
		`);
		console.log('Training table initialized successfully');
	} catch (error) {
		console.error('Failed to initialize training table:', error);
	}
}

/** Dart pojedynczy rzut */
export type Dart = { bed: number; m: 1 | 2 | 3 };

/** wejście do saveGame */
type GameInput = {
	start: number;
	turns: number[];
	hits: Dart[];
	checkout?: string;
	forfeited?: boolean;
	forfeitScore?: number;
};

/* ------------------------------------------------------------------------- */
/* 2. Inicjalizacja bazy                                                     */
/* ------------------------------------------------------------------------- */
export function initDB() {
	try {
		console.log('Initializing database...');

		db.execSync(`
		  PRAGMA journal_mode = WAL;
		  CREATE TABLE IF NOT EXISTS games (
			id       INTEGER PRIMARY KEY NOT NULL,
			date     TEXT,
			start    INTEGER,
			turns    TEXT,
			darts    INTEGER,
			scored   INTEGER,
			avg3     REAL,
			checkout TEXT,
			hits TEXT,
			forfeited INTEGER DEFAULT 0,
			forfeitScore INTEGER DEFAULT NULL
		  );
		`);

		console.log('Games table initialized successfully');

		// Initialize training database (avoid circular import)
		initTrainingTable();

		console.log('Database initialization complete');
	} catch (error) {
		console.error('Database initialization failed:', error);
	}

	// ⇣ MIGRACJA – jeżeli brakuje kolumny, dodaj ją
	try {
		const rows = db.getAllSync("PRAGMA table_info('games');") as any[];
		const hasHits = rows.some((r: any) => r.name === 'hits');
		if (!hasHits) {
			db.runSync("ALTER TABLE games ADD COLUMN hits TEXT DEFAULT '[]';");
			console.log('Added hits column to games table');
		}
		const hasForfeited = rows.some((r: any) => r.name === 'forfeited');
		if (!hasForfeited) {
			db.runSync('ALTER TABLE games ADD COLUMN forfeited INTEGER DEFAULT 0;');
			console.log('Added forfeited column to games table');
		}
		const hasForfeitScore = rows.some((r: any) => r.name === 'forfeitScore');
		if (!hasForfeitScore) {
			db.runSync('ALTER TABLE games ADD COLUMN forfeitScore INTEGER DEFAULT NULL;');
			console.log('Added forfeitScore column to games table');
		}
	} catch (error) {
		console.error('Migration failed:', error);
	}

	// ⇣ MIGRACJA dla training_sessions – dodaj kolumnę target_results
	try {
		const trainingRows = db.getAllSync("PRAGMA table_info('training_sessions');") as any[];
		const hasTargetResults = trainingRows.some((r: any) => r.name === 'target_results');
		if (!hasTargetResults) {
			db.runSync("ALTER TABLE training_sessions ADD COLUMN target_results TEXT DEFAULT '[]';");
			console.log('Added target_results column to training_sessions table');
		}
	} catch (error) {
		console.error('Training table migration failed:', error);
	}
}

/* ------------------------------------------------------------------------- */
/* 3. Zapis lega                                                             */
/* ------------------------------------------------------------------------- */
export function saveGame({ start, turns, hits, checkout, forfeited, forfeitScore }: GameInput) {
	const darts = turns.length * 3;
	const scored = turns.reduce((s, t) => s + t, 0);
	const avg3 = (scored / darts) * 3;

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

/* ------------------------------------------------------------------------- */
export function fetchGames() {
	return db.getAllSync('SELECT * FROM games ORDER BY id DESC;');
}

export function clearGames() {
	db.runSync('DELETE FROM games;');
}
