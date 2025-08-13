import { Language } from './settings';

export interface LocalizedStrings {
	// Navigation
	play: string;
	stats: string;
	settings: string;

	// Game Screen
	newGame: string;
	game: string;
	gameOver: string;
	newGameButton: string;
	forfeit: string;
	forfeitConfirm: string;
	forfeitMessage: string;

	// Game Variants
	variant301: string;
	variant501: string;
	selectVariant: string;

	// Scoring
	score: string;
	remaining: string;
	turn: string;
	turns: string;
	average: string;
	bestAverage: string;
	overallAverage: string;

	// Statistics
	summary: string;
	showSummary: string;
	detailedStats: string;
	gameDistribution: string;
	scoreRanges: string;
	modeSimple: string;
	modeAdvanced: string;
	gameCompletion: string;
	completed: string;
	forfeited: string;
	successRate: string;
	performance: string;
	achievements: string;
	highestFinish: string;
	totalDarts: string;
	games: string;
	best: string;
	// Enhanced Statistics
	totalGames: string;
	gameVariants: string;
	recentTrends: string;
	gameLength: string;
	shortest: string;
	longest: string;
	avgLength: string;
	last5Games: string;
	last10Games: string;
	bestCheckout: string;
	overallPerformance: string;
	modeComparison: string;

	// Score Ranges
	score100plus: string;
	score120plus: string;
	score140plus: string;
	score160plus: string;
	score180: string;

	// Settings
	language: string;
	languagePolish: string;
	languageEnglish: string;
	advancedMode: string;
	advancedModeDescription: string;

	// Common
	close: string;
	cancel: string;
	delete: string;
	remove: string;
	confirm: string;
	yes: string;
	no: string;

	// Alerts
	deleteConfirm: string;
	deleteConfirmMessage: string;
	clearAllConfirm: string;
	clearAllMessage: string;

	// Game Actions
	startGame: string;
	endGame: string;
	continueGame: string;

	// UI Elements
	loading: string;
	success: string;

	// Training Statistics
	trainingSessions: string;
	trainingSuccess: string;
	totalTargets: string;
	bestSession: string;
	targetsPracticed: string;
	info: string;

	// Legend
	legendTitle: string;
	legend1Hit: string;
	legend5Hits: string;
	legend10Hits: string;
	legend15Hits: string;
	legend20PlusHits: string;

	// Forfeit
	forfeitScore: string;
	forfeitScoreLeft: string;

	// Additional
	pointsLeft: string;
	avg: string;
	darts: string;

	// Training Mode
	trainingMode: string;
	practiceTargets: string;
	currentTarget: string;
	hitTarget: string;
	hit: string;
	miss: string;
	sessionStats: string;
	targets: string;
	hits: string;
	misses: string;
	duration: string;
	minutes: string;
	newTarget: string;
	resetSession: string;
	resetSessionConfirm: string;
	reset: string;
	saveSession: string;
	sessionSaved: string;
	sessionSavedMessage: string;
	saveAndReset: string;
	ok: string;
	error: string;
	saveError: string;
	saveErrorMsg: string;
}

const polishStrings: LocalizedStrings = {
	// Navigation
	play: 'Gra',
	stats: 'Statystyki',
	settings: 'Ustawienia',

	// Game Screen
	newGame: 'Nowa Gra',
	game: 'Gra',
	gameOver: 'Koniec Gry',
	newGameButton: 'Nowa Gra',
	forfeit: 'Poddaj',
	forfeitConfirm: 'Poddaj grę?',
	forfeitMessage: 'Czy na pewno chcesz poddać tę grę?',

	// Game Variants
	variant301: '301',
	variant501: '501',
	selectVariant: 'Wybierz wariant',

	// Scoring
	score: 'Wynik',
	remaining: 'Pozostało',
	turn: 'Runda',
	turns: 'Rundy',
	average: 'Średnia',
	bestAverage: 'Najlepsza średnia',
	overallAverage: 'Średnia ogólna',

	// Statistics
	summary: 'Podsumowanie',
	showSummary: 'Pokaż Podsumowanie',
	detailedStats: 'Szczegółowe Statystyki',
	gameDistribution: 'Rozkład gier',
	scoreRanges: 'Wyniki w zakresach',
	modeSimple: 'Tryb Prosty',
	modeAdvanced: 'Tryb Zaawansowany',
	gameCompletion: 'Ukończenie gier',
	completed: 'Ukończone',
	forfeited: 'Przerwane',
	successRate: 'Skuteczność',
	performance: 'Wydajność',
	achievements: 'Osiągnięcia',
	highestFinish: 'Najwyższy finish',
	totalDarts: 'Lotki łącznie',
	games: 'Gier',
	best: 'Najlepszy',

	// Score Ranges
	score100plus: '100+',
	score120plus: '120+',
	score140plus: '140+',
	score160plus: '160+',
	score180: '180',

	// Settings
	language: 'Język',
	languagePolish: 'Polski',
	languageEnglish: 'English',
	advancedMode: 'Tryb zaawansowany',
	advancedModeDescription: 'Śledź każdy rzut osobno',

	// Common
	close: 'Zamknij',
	cancel: 'Anuluj',
	delete: 'Usuń',
	remove: 'Usuń',
	confirm: 'Potwierdź',
	yes: 'Tak',
	no: 'Nie',

	// Alerts
	deleteConfirm: 'Usunąć ten wpis?',
	deleteConfirmMessage: 'Operacja nieodwracalna',
	clearAllConfirm: 'Usunąć wszystkie statystyki?',
	clearAllMessage: 'Operacja nieodwracalna',

	// Game Actions
	startGame: 'Rozpocznij grę',
	endGame: 'Zakończ grę',
	continueGame: 'Kontynuuj grę',

	// UI Elements
	loading: 'Ładowanie...',
	error: 'Błąd',
	success: 'Sukces',
	info: 'Informacja',

	// Legend
	legendTitle: 'Legenda',
	legend1Hit: '1 rzut',
	legend5Hits: '5 rzutów',
	legend10Hits: '10 rzutów',
	legend15Hits: '15 rzutów',
	legend20PlusHits: '20 rzutów i więcej',

	// Forfeit
	forfeitScore: 'Wynik poddającego',
	forfeitScoreLeft: 'Pozostało',

	// Additional
	pointsLeft: 'Punkty pozostałe',
	avg: 'Średnia',
	darts: 'Lotki',

	// Enhanced Statistics
	totalGames: 'Łącznie gier',
	gameVariants: 'Warianty gier',
	recentTrends: 'Ostatnie trendy',
	gameLength: 'Długość gier',
	shortest: 'Najkrótsza',
	longest: 'Najdłuższa',
	avgLength: 'Średnia',
	last5Games: 'Ostatnie 5 gier',
	last10Games: 'Ostatnie 10 gier',
	bestCheckout: 'Najlepszy finish',
	overallPerformance: 'Ogólna wydajność',
	modeComparison: 'Porównanie trybów',

	// Training Mode
	trainingMode: 'Tryb Treningowy',
	practiceTargets: 'Ćwicz swoje cele',
	currentTarget: 'Aktualny Cel',
	hitTarget: 'Traf ten cel!',
	hit: 'Traf!',
	miss: 'Pudło',
	sessionStats: 'Statystyki Sesji',
	targets: 'Cele',
	hits: 'Trafienia',
	misses: 'Pudła',
	duration: 'Czas trwania',
	minutes: 'min',
	newTarget: 'Nowy Cel',
	resetSession: 'Resetuj Sesję',
	resetSessionConfirm: 'Czy na pewno chcesz zresetować tę sesję treningową?',
	reset: 'Resetuj',
	saveSession: 'Zapisz Sesję',
	sessionSaved: 'Sesja Zapisana',
	sessionSavedMessage: 'Twoja sesja treningowa została zapisana!',
	saveAndReset: 'Zapisz i Resetuj',
	ok: 'OK',
	saveError: 'Błąd zapisu',
	saveErrorMsg: 'Nie udało się zapisać sesji treningowej',

	// Training Statistics
	trainingSessions: 'Sesje Treningowe',
	trainingSuccess: 'Skuteczność Treningu',
	totalTargets: 'Łącznie Celów',
	bestSession: 'Najlepsza Sesja',
	targetsPracticed: 'Cele Ćwiczone',
};

const englishStrings: LocalizedStrings = {
	// Navigation
	play: 'Play',
	stats: 'Statistics',
	settings: 'Settings',

	// Game Screen
	newGame: 'New Game',
	game: 'Game',
	gameOver: 'Game Over',
	newGameButton: 'New Game',
	forfeit: 'Forfeit',
	forfeitConfirm: 'Forfeit game?',
	forfeitMessage: 'Are you sure you want to forfeit this game?',

	// Game Variants
	variant301: '301',
	variant501: '501',
	selectVariant: 'Select variant',

	// Scoring
	score: 'Score',
	remaining: 'Remaining',
	turn: 'Turn',
	turns: 'Turns',
	average: 'Average',
	bestAverage: 'Best average',
	overallAverage: 'Overall average',

	// Statistics
	summary: 'Summary',
	showSummary: 'Show Summary',
	detailedStats: 'Detailed Statistics',
	gameDistribution: 'Game distribution',
	scoreRanges: 'Score ranges',
	modeSimple: 'Simple Mode',
	modeAdvanced: 'Advanced Mode',
	gameCompletion: 'Game completion',
	completed: 'Completed',
	forfeited: 'Forfeited',
	successRate: 'Success rate',
	performance: 'Performance',
	achievements: 'Achievements',
	highestFinish: 'Highest finish',
	totalDarts: 'Total darts',
	games: 'Games',
	best: 'Best',

	// Score Ranges
	score100plus: '100+',
	score120plus: '120+',
	score140plus: '140+',
	score160plus: '160+',
	score180: '180',

	// Settings
	language: 'Language',
	languagePolish: 'Polski',
	languageEnglish: 'English',
	advancedMode: 'Advanced mode',
	advancedModeDescription: 'Track each throw separately',

	// Common
	close: 'Close',
	cancel: 'Cancel',
	delete: 'Delete',
	remove: 'Remove',
	confirm: 'Confirm',
	yes: 'Yes',
	no: 'No',

	// Alerts
	deleteConfirm: 'Delete this entry?',
	deleteConfirmMessage: 'This action cannot be undone',
	clearAllConfirm: 'Delete all statistics?',
	clearAllMessage: 'This action cannot be undone',

	// Game Actions
	startGame: 'Start game',
	endGame: 'End game',
	continueGame: 'Continue game',

	// UI Elements
	loading: 'Loading...',
	error: 'Error',
	success: 'Success',
	info: 'Information',

	// Legend
	legendTitle: 'Legend',
	legend1Hit: '1 throw',
	legend5Hits: '5 throws',
	legend10Hits: '10 throws',
	legend15Hits: '15 throws',
	legend20PlusHits: '20 throws and more',

	// Forfeit
	forfeitScore: 'Forfeit score',
	forfeitScoreLeft: 'Score left',

	// Additional
	pointsLeft: 'Points left',
	avg: 'Average',
	darts: 'Darts',

	// Enhanced Statistics
	totalGames: 'Total Games',
	gameVariants: 'Game Variants',
	recentTrends: 'Recent Trends',
	gameLength: 'Game Length',
	shortest: 'Shortest',
	longest: 'Longest',
	avgLength: 'Average',
	last5Games: 'Last 5 Games',
	last10Games: 'Last 10 Games',
	bestCheckout: 'Best Checkout',
	overallPerformance: 'Overall Performance',
	modeComparison: 'Mode Comparison',

	// Training Mode
	trainingMode: 'Training Mode',
	practiceTargets: 'Practice your targets',
	currentTarget: 'Current Target',
	hitTarget: 'Hit this target!',
	hit: 'Hit!',
	miss: 'Miss',
	sessionStats: 'Session Stats',
	targets: 'Targets',
	hits: 'Hits',
	misses: 'Misses',
	duration: 'Duration',
	minutes: 'min',
	newTarget: 'New Target',
	resetSession: 'Reset Session',
	resetSessionConfirm: 'Are you sure you want to reset this training session?',
	reset: 'Reset',
	saveSession: 'Save Session',
	sessionSaved: 'Session Saved',
	sessionSavedMessage: 'Your training session has been saved!',
	saveAndReset: 'Save & Reset',
	ok: 'OK',
	saveError: 'Save Error',
	saveErrorMsg: 'Failed to save training session',

	// Training Statistics
	trainingSessions: 'Training Sessions',
	trainingSuccess: 'Training Success',
	totalTargets: 'Total Targets',
	bestSession: 'Best Session',
	targetsPracticed: 'Targets Practiced',
};

export function getLocalizedStrings(language: Language): LocalizedStrings {
	return language === 'en' ? englishStrings : polishStrings;
}

// Hook for easy access to localized strings
export function useLocalization(language: Language) {
	return getLocalizedStrings(language);
}
