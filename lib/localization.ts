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
	variant401: string;
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
	checkout: string;
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
	points: string;
	
	// Checkout modal
	checkoutDartsQuestion: string;
	dart: string; // 1 lotka
	dartsPlural: string; // 2-4 lotki
	dartsGenitive: string; // 5+ lotek

	// Training Mode
	trainingMode: string;
	practiceTargets: string;
	checkoutPractice: string;
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
	targetsToHit: string;
	// Checkout Practice
	checkoutMode: string;
	checkoutTarget: string;
	checkoutInstructions: string;
	checkoutSuccess: string;
	checkoutFailed: string;
	nextCheckout: string;
	checkoutScore: string;
	checkoutAttempts: string;
	checkoutSuccessRate: string;
	// Training Descriptions
	targetPracticeDescription: string;
	checkoutPracticeDescription: string;
	// Checkout Actions
	retryCheckout: string;
	// Checkout Stats
	checkoutComplete: string;
	checkoutStats: string;
	// UI Info
	areVisibleIn: string;
	tab: string;

	// Data Backup
	dataBackup: string;
	dataBackupDescription: string;
	dataExport: string;
	dataImport: string;
	backupHowItWorks: string;
	backupStep1: string;
	backupStep2: string;
	backupStep3: string;
	backupStep4: string;
	backupSavedLocation: string;
	backupImportModeTitle: string;
	backupImportModeMessage: string;
	backupImportMerge: string;
	backupImportReplace: string;
	backupInProgress: string;
	backupExportSuccessTitle: string;
	backupExportSuccessMessage: string;
	backupExportShareUnavailable: string;
	backupImportSuccessTitle: string;
	backupImportSuccessMessage: string;
	backupErrorExport: string;
	backupErrorImport: string;
	backupErrorInvalidFile: string;
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
	variant401: '401',
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
	points: 'pkt',
	
	// Checkout modal
	checkoutDartsQuestion: 'Ile lotek użyłeś w ostatniej turze?',
	dart: 'lotka', // 1 lotka
	dartsPlural: 'lotki', // 2-4 lotki
	dartsGenitive: 'lotek', // 5+ lotek

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
	checkout: 'Checkout',
	overallPerformance: 'Ogólna wydajność',
	modeComparison: 'Porównanie trybów',

	// Training Mode
	trainingMode: 'Tryb Treningowy',
	practiceTargets: 'Ćwicz swoje cele',
	checkoutPractice: 'Ćwicz Finisze',
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
	resetSessionConfirm: 'Zresetować sesję treningową?',
	reset: 'Resetuj',
	saveSession: 'Zapisz Sesję',
	sessionSaved: 'Sesja Zapisana',
	sessionSavedMessage: 'Twoja sesja treningowa została zapisana!',
	saveAndReset: 'Zapisz i Resetuj',
	ok: 'OK',
	saveError: 'Błąd zapisu',
	saveErrorMsg: 'Nie udało się zapisać sesji treningowej',
	targetsToHit: 'Cele do trafienia',
	// Checkout Practice
	checkoutMode: 'Tryb Finiszu',
	checkoutTarget: 'Cel Finiszu',
	checkoutInstructions: 'Traf wszystkie cele aby ukończyć finisz!',
	checkoutSuccess: 'Finisz Ukończony!',
	checkoutFailed: 'Finisz Nieudany',
	nextCheckout: 'Następny Finisz',
	checkoutScore: 'Wynik Finiszu',
	checkoutAttempts: 'Próby Finiszu',
	checkoutComplete: 'Ukończone',
	checkoutStats: 'Statystyki Finiszu',
	checkoutSuccessRate: 'Skuteczność Finiszu',
	// Training Descriptions
	targetPracticeDescription: 'Trafiaj losowe cele aby poprawić celność',
	checkoutPracticeDescription: 'Ćwicz kończenie gier realistycznymi scenariuszami finiszu',
	// Checkout Actions
	retryCheckout: 'Ponów Finisz',
	// UI Info
	areVisibleIn: 'są widoczne w',
	tab: 'zakładce',

	// Data Backup
	dataBackup: 'Kopia danych',
	dataBackupDescription:
		'Twoje dane są zapisane lokalnie na tym telefonie. Przed zmianą urządzenia wykonaj eksport do pliku, a na nowym telefonie użyj importu.',
	dataExport: 'Eksport danych',
	dataImport: 'Import danych',
	backupHowItWorks: 'Jak to działa?',
	backupStep1: '1. Kliknij Eksport danych, aby utworzyć plik JSON.',
	backupStep2: '2. Plik zapisuje się w folderze aplikacji i otwiera się okno udostępniania.',
	backupStep3: '3. Wyślij plik na komputer, e-mail lub do chmury.',
	backupStep4: '4. Na nowym telefonie pobierz plik i użyj opcji Import danych.',
	backupSavedLocation: 'Lokalizacja zapisu',
	backupImportModeTitle: 'Tryb importu',
	backupImportModeMessage: 'Wybierz jak zaimportować dane.',
	backupImportMerge: 'Scal z obecnymi',
	backupImportReplace: 'Zastąp obecne',
	backupInProgress: 'Trwa operacja backupu...',
	backupExportSuccessTitle: 'Eksport zakończony',
	backupExportSuccessMessage: 'Utworzono plik kopii zapasowej.',
	backupExportShareUnavailable: 'Udostępnianie plików nie jest dostępne na tym urządzeniu.',
	backupImportSuccessTitle: 'Import zakończony',
	backupImportSuccessMessage: 'Dane zostały poprawnie zaimportowane.',
	backupErrorExport: 'Nie udało się wyeksportować danych.',
	backupErrorImport: 'Nie udało się zaimportować danych.',
	backupErrorInvalidFile: 'Wybrany plik nie jest poprawnym backupem.',

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
	variant401: '401',
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
	points: 'pts',
	
	// Checkout modal
	checkoutDartsQuestion: 'How many darts did you use in the last turn?',
	dart: 'dart', // 1 dart
	dartsPlural: 'darts', // 2+ darts
	dartsGenitive: 'darts', // 5+ darts (same as plural in English)

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
	checkout: 'Checkout',
	overallPerformance: 'Overall Performance',
	modeComparison: 'Mode Comparison',

	// Training Mode
	trainingMode: 'Training Mode',
	practiceTargets: 'Practice your targets',
	checkoutPractice: 'Checkout Practice',
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
	resetSessionConfirm: 'Reset training session?',
	reset: 'Reset',
	saveSession: 'Save Session',
	sessionSaved: 'Session Saved',
	sessionSavedMessage: 'Your training session has been saved!',
	saveAndReset: 'Save & Reset',
	ok: 'OK',
	saveError: 'Save Error',
	saveErrorMsg: 'Failed to save training session',
	targetsToHit: 'Targets to hit',
	// Checkout Practice
	checkoutMode: 'Checkout Mode',
	checkoutTarget: 'Checkout Target',
	checkoutInstructions: 'Hit all targets to complete the checkout!',
	checkoutSuccess: 'Checkout Complete!',
	checkoutFailed: 'Checkout Failed',
	nextCheckout: 'Next Checkout',
	checkoutScore: 'Checkout Score',
	checkoutAttempts: 'Checkout Attempts',
	checkoutComplete: 'Complete',
	checkoutStats: 'Checkout Stats',
	checkoutSuccessRate: 'Checkout Success Rate',
	// Training Descriptions
	targetPracticeDescription: 'Hit random targets to improve accuracy',
	checkoutPracticeDescription: 'Practice finishing games with realistic checkout scenarios',
	// Checkout Actions
	retryCheckout: 'Retry Checkout',
	// UI Info
	areVisibleIn: 'are visible in',
	tab: 'tab',

	// Data Backup
	dataBackup: 'Data Backup',
	dataBackupDescription:
		'Your data is stored locally on this phone. Before changing devices, export your data to a file, then import it on the new phone.',
	dataExport: 'Export data',
	dataImport: 'Import data',
	backupHowItWorks: 'How it works',
	backupStep1: '1. Tap Export data to generate a JSON backup file.',
	backupStep2: '2. The file is saved in the app documents folder and the share sheet opens.',
	backupStep3: '3. Send the file to your computer, email, or cloud storage.',
	backupStep4: '4. On the new phone, download the file and use Import data.',
	backupSavedLocation: 'Saved location',
	backupImportModeTitle: 'Import mode',
	backupImportModeMessage: 'Choose how to import data.',
	backupImportMerge: 'Merge with current',
	backupImportReplace: 'Replace current',
	backupInProgress: 'Backup operation in progress...',
	backupExportSuccessTitle: 'Export completed',
	backupExportSuccessMessage: 'Backup file has been created.',
	backupExportShareUnavailable: 'File sharing is not available on this device.',
	backupImportSuccessTitle: 'Import completed',
	backupImportSuccessMessage: 'Data has been imported successfully.',
	backupErrorExport: 'Failed to export data.',
	backupErrorImport: 'Failed to import data.',
	backupErrorInvalidFile: 'The selected file is not a valid backup.',

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
