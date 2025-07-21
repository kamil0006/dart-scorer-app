/* lib/db.ts — najkrótsza wersja */

import * as SQLite from 'expo-sqlite';
export const db = SQLite.openDatabaseSync('dart.db');

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

	// ⇣ MIGRACJA – jeżeli brakuje kolumny, dodaj ją
	const rows = db.getAllSync("PRAGMA table_info('games');");
	const hasHits = rows.some((r: any) => r.name === 'hits');
	if (!hasHits) {
		db.runSync("ALTER TABLE games ADD COLUMN hits TEXT DEFAULT '[]';");
	}
	const hasForfeited = rows.some((r: any) => r.name === 'forfeited');
	if (!hasForfeited) {
		db.runSync('ALTER TABLE games ADD COLUMN forfeited INTEGER DEFAULT 0;');
	}
	const hasForfeitScore = rows.some((r: any) => r.name === 'forfeitScore');
	if (!hasForfeitScore) {
		db.runSync('ALTER TABLE games ADD COLUMN forfeitScore INTEGER DEFAULT NULL;');
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
