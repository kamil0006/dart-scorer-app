import * as SQLite from 'expo-sqlite';

/* 1 połączenie na apkę – wersja SYNC (prosta, bez promes) */
export const db = SQLite.openDatabaseSync('dart.db');

/* -------- inicjalizacja -------- */
export function initDB() {
	db.execSync(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS games (
      id       INTEGER PRIMARY KEY NOT NULL,
      date     TEXT,
      start    INTEGER,
      turns    TEXT,
      darts    INTEGER,
      scored   INTEGER,
      avg3     REAL,
      checkout TEXT
    );`);
}

/* -------- zapis lega -------- */
type GameInput = { start: number; turns: number[]; checkout?: string };

export function saveGame({ start, turns, checkout }: GameInput) {
	const darts = turns.length * 3;
	const scored = turns.reduce((s, t) => s + t, 0);
	const avg3 = (scored / darts) * 3;

	db.runSync(
		`INSERT INTO games
       (date,start,turns,darts,scored,avg3,checkout)
     VALUES (?,?,?,?,?,?,?);`,
		new Date().toISOString(),
		start,
		JSON.stringify(turns),
		darts,
		scored,
		avg3,
		checkout ?? null
	);
}

/* -------- pobranie listy -------- */
export function fetchGames() {
	return db.getAllSync('SELECT * FROM games ORDER BY id DESC;');
}

/* usuń wszystkie rekordy */
export function clearGames(): void {
	db.runSync('DELETE FROM games;');
}
