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
				training_mode TEXT NOT NULL DEFAULT 'target',
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
	checkoutDarts?: number; // Faktyczna liczba lotek w ostatniej turze przy checkoutie (tylko dla trybu simple)
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
		const hasTrainingMode = trainingRows.some((r: any) => r.name === 'training_mode');
		if (!hasTrainingMode) {
			db.runSync("ALTER TABLE training_sessions ADD COLUMN training_mode TEXT DEFAULT 'target';");
			console.log('Added training_mode column to training_sessions table');
		}
	} catch (error) {
		console.error('Training table migration failed:', error);
	}
}

/* ------------------------------------------------------------------------- */
/* 3. Zapis lega                                                             */
/* ------------------------------------------------------------------------- */
export function saveGame({ start, turns, hits, checkout, forfeited, forfeitScore, checkoutDarts }: GameInput) {
	// Policz faktyczną liczbę lotek:
	// - W trybie advanced: użyj długości tablicy hits (wszystkie lotki z gry)
	// - W trybie simple: standardowo 3 lotki na turę, ALE jeśli jest checkout, ostatnia tura ma mniej lotek
	const isAdvanced = hits && Array.isArray(hits) && hits.length > 0;
	
	let darts: number;
	if (isAdvanced) {
		// W trybie advanced: hits.length to faktyczna liczba lotek (wszystkie rzuty)
		darts = hits.length;
	} else {
		// W trybie simple: standardowo 3 lotki na turę
		// Jeśli jest checkout, ostatnia tura ma mniej lotek
		const fullTurns = turns.length;
		let lastTurnDarts = 3; // domyślnie 3 lotki w ostatniej turze
		
		if (checkout) {
			// Jeśli podano checkoutDarts (z modala), użyj tej wartości
			// W przeciwnym razie oszacuj z checkout string
			if (checkoutDarts && checkoutDarts >= 1 && checkoutDarts <= 3) {
				lastTurnDarts = checkoutDarts;
			} else {
				// Parsuj checkout string, aby oszacować liczbę lotek
				// Przykład: "D19" = 1 lotka, "T20 D20" = 2 lotki, "T20 T20 Bull" = 3 lotki
				const checkoutParts = checkout.trim().split(/\s+/);
				lastTurnDarts = checkoutParts.length;
			}
		}
		
		// Jeśli jest checkout, ostatnia tura ma lastTurnDarts lotek, pozostałe po 3
		// Jeśli nie ma checkoutu, wszystkie tury mają po 3 lotki
		if (checkout && fullTurns > 0) {
			darts = (fullTurns - 1) * 3 + lastTurnDarts;
		} else {
			darts = fullTurns * 3;
		}
	}
	
	const scored = turns.reduce((s, t) => s + t, 0);
	
	// Profesjonalna formuła średniej w darcie: (suma punktów / liczba lotek) * 3
	// To daje średnią punktów na 3 lotki (standardowa metryka w darcie)
	// Zabezpieczenie przed dzieleniem przez zero
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

/* ------------------------------------------------------------------------- */
export function fetchGames() {
	return db.getAllSync('SELECT * FROM games ORDER BY id DESC;');
}

export function clearGames() {
	db.runSync('DELETE FROM games;');
}
