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
	cancelGame: string;
	cancelGameConfirm: string;
	cancelGameMessage: string;
	bust: string;
	bustMessage: string;

	// Game Variants
	variant301: string;
	variant401: string;
	variant501: string;
	variant301Meta: string;
	variant401Meta: string;
	variant501Meta: string;
	selectVariant: string;

	// Scoring
	score: string;
	remaining: string;
	turn: string;
	turns: string;
	average: string;
	bestAverage: string;
	overallAverage: string;
	roundScore: string;
	invalidTurnScore: string;
	undoTurnConfirm: string;
	undoTurnWhileTypingMessage: string;
	undoTurnPrompt: string;

	// Statistics
	summary: string;
	summaryShort: string;
	showSummary: string;
	statsFilters: string;
	statsFiltersTitle: string;
	clearFilters: string;
	filterPeriod: string;
	filterGame: string;
	filterMode: string;
	filterStatus: string;
	filterAll: string;
	filterLast7Days: string;
	filterLast30Days: string;
	simple: string;
	advanced: string;
	selectedGamesSummary: string;
	threeDartAverage: string;
	completedTrendSuffix: string;
	detailedStats: string;
	gameAnalysis: string;
	bestTurn: string;
	averageTurn: string;
	weakTurns: string;
	leftAfterTurn: string;
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
	checkoutOverview: string;
	checkoutCount: string;
	averageCheckout: string;
	oneDartFinishes: string;
	twoDartFinishes: string;
	threeDartFinishes: string;
	lowCheckouts: string;
	midCheckouts: string;
	highCheckouts: string;
	commonCheckouts: string;
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
	turnHistoryLayout: string;
	turnHistoryLayoutDescription: string;
	turnHistoryLayoutWrapped: string;
	turnHistoryLayoutScrollable: string;
	displayMatch: string;
	displayMatchDescription: string;
	displayMatchToggle: string;
	displayMatchToggleDescription: string;
	displayMatchEnabled: string;
	displayMatchDisabled: string;
	displayLaptopAddress: string;
	displayLocalhostWarning: string;
	displayPlayerName: string;
	displayPlayerNamePlaceholder: string;
	displayMatchSetup: string;
	displayMatchSetupDescription: string;
	displayMatchButton: string;
	displayMatchStart: string;
	displayMatchBack: string;
	displaySetupHowItWorks: string;
	displaySetupStep1: string;
	displaySetupStep2: string;
	displaySetupStep3: string;
	displaySetupStep4: string;
	displaySetupStep5: string;
	displaySetupStep6: string;
	displaySetupStep7: string;
	displaySetupStep8: string;
	displayWinsMatch: string;
	displayClosingLeg: string;
	displayAtBoard: string;
	displayEndScreen: string;
	matchSets: string;
	matchLegs: string;
	tooltipOverallAverage: string;
	tooltipBestAverage: string;
	tooltipHighestFinish: string;
	tooltipGames: string;
	tooltipTotalDarts: string;
	tooltipSuccessRate: string;
	tooltipCount180s: string;
	tooltipGameDistribution: string;
	tooltipModeComparison: string;
	tooltipScoreRanges: string;
	tooltipCheckoutOverview: string;
	tooltipGameLength: string;
	tooltipTrainingSessions: string;
	tooltipRecentTrends: string;
	averageTrend: string;
	tooltipAverageTrend: string;

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
	error: string;

	// Training Statistics
	trainingSessions: string;
	trainingSessionsCount: string;
	noTrainingSessions: string;
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
	heatmap: string;
	mpMultiplayerWifi: string;
	pointsLeft: string;
	avg: string;
	darts: string;
	points: string;

	// Checkout modal
	checkoutDartsQuestion: string;
	dart: string;
	dartsPlural: string;
	dartsGenitive: string;

	// Training Mode
	trainingMode: string;
	practiceTargets: string;
	checkoutPractice: string;
	clockClassic: string;
	clockDouble: string;
	clockTriple: string;
	clockJump: string;
	clockPenalty: string;
	bobs27: string;
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
	clockClassicDescription: string;
	clockDoubleDescription: string;
	clockTripleDescription: string;
	clockJumpDescription: string;
	clockPenaltyDescription: string;
	bobs27Description: string;
	bobs27GameOverTitle: string;
	bobs27GameOverMessage: string;
	bobs27Won: string;
	bobs27Lost: string;
	bobs27FinalScore: string;
	result: string;

	// Checkout Actions
	retryCheckout: string;

	// Checkout Stats
	checkoutComplete: string;
	checkoutStats: string;

	// UI Info
	areVisibleIn: string;
	tab: string;

	// Multiplayer
	mpConnecting: string;
	mpMatchOver: string;
	mpWins: string;
	mpToMenu: string;
	mpYourScore: string;
	mpConfirmScore: string;
	mpEditScore: string;
	mpBustWarning: string;
	mpSets: string;
	mpLegs: string;
	mpAverage: string;
	mpWaitingForOpponent: string;
	mpWaitingForHost: string;
	mpPlayersTurn: string;
	mpLeaveGame: string;
	mpLeaveGameMessage: string;
	mpStay: string;
	mpLeave: string;
	mpBustFlash: string;
	mpLegWon: string;
	mpLegLost: string;
	mpSetWon: string;
	mpSetLost: string;
	mpHostWaiting: string;
	mpRoomCreated: string;
	mpRoomCode: string;
	mpShareCode: string;
	mpPlayers: string;
	mpHost: string;
	mpReady: string;
	mpWaitingForPlayer: string;
	mpStarting: string;
	mpCancelRoom: string;
	mpCancelRoomMessage: string;
	mpCreateRoom: string;
	mpJoinRoom: string;
	mpCreating: string;
	mpJoining: string;
	mpYourName: string;
	mpNamePlaceholder: string;
	mpEnterName: string;
	mpServerError: string;
	mpServerErrorMsg: string;
	mpRoomCodeLength: string;
	mpJoinError: string;
	mpWifiSameNetwork: string;
	mpVariant: string;
	mpAdvShort: string;
	mpWhoStarts: string;
	mpBullThrowHint: string;

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
	play: 'Gra',
	stats: 'Statystyki',
	settings: 'Ustawienia',
	newGame: 'Nowa gra',
	game: 'Gra',
	gameOver: 'Koniec gry',
	newGameButton: 'Nowa gra',
	forfeit: 'Poddaj',
	forfeitConfirm: 'Poddać grę?',
	forfeitMessage: 'Czy na pewno chcesz poddać tę grę?',
	cancelGame: 'Anuluj grę',
	cancelGameConfirm: 'Anulować grę?',
	cancelGameMessage: 'Gra nie została jeszcze rozpoczęta, więc nie zapisze się w statystykach.',
	bust: 'BUST',
	bustMessage: 'Wynik bez zmian. Tura zapisana jako 0.',
	variant301: '301',
	variant401: '401',
	variant501: '501',
	variant301Meta: 'Szybka',
	variant401Meta: 'Średnia',
	variant501Meta: 'Meczowa',
	selectVariant: 'Wybierz wariant',
	score: 'Wynik',
	remaining: 'Pozostało',
	turn: 'Runda',
	turns: 'Rundy',
	average: 'Średnia',
	bestAverage: 'Najlepsza średnia',
	overallAverage: 'Średnia ogólna',
	roundScore: 'Wynik rundy',
	invalidTurnScore: 'Nieprawidłowy wynik rundy',
	undoTurnConfirm: 'Cofnąć ostatnią rundę?',
	undoTurnWhileTypingMessage: 'Cofniesz tylko ostatnią zapisaną rundę. Aktualnie wpisany wynik zostanie bez zmian.',
	undoTurnPrompt: 'Dotknij kosza ponownie, aby cofnąć ostatnią rundę.',
	summary: 'Podsumowanie',
	summaryShort: 'Podsum.',
	showSummary: 'Pokaż podsumowanie',
	statsFilters: 'Filtry',
	statsFiltersTitle: 'Filtry wyników',
	clearFilters: 'Wyczyść',
	filterPeriod: 'Okres',
	filterGame: 'Gra',
	filterMode: 'Tryb',
	filterStatus: 'Status',
	filterAll: 'Wszystkie',
	filterLast7Days: '7 dni',
	filterLast30Days: '30 dni',
	simple: 'Prosty',
	advanced: 'Zaawansowany',
	selectedGamesSummary: 'gier w wybranym widoku',
	threeDartAverage: 'średnia 3 lotek',
	completedTrendSuffix: 'ukończone',
	detailedStats: 'Szczegółowe statystyki',
	gameAnalysis: 'Analiza partii',
	bestTurn: 'Najlepsza runda',
	averageTurn: 'Śr. runda',
	weakTurns: 'Rundy <45',
	leftAfterTurn: 'Pozostało',
	gameDistribution: 'Rozkład gier',
	scoreRanges: 'Wyniki w zakresach',
	modeSimple: 'Tryb prosty',
	modeAdvanced: 'Tryb zaawansowany',
	gameCompletion: 'Ukończenie gier',
	completed: 'Ukończone',
	forfeited: 'Przerwane',
	successRate: 'Skuteczność',
	performance: 'Wydajność',
	achievements: 'Osiągnięcia',
	highestFinish: 'Najwyższy finisz',
	totalDarts: 'Lotki łącznie',
	games: 'Gier',
	best: 'Najlepszy',
	totalGames: 'Łącznie gier',
	gameVariants: 'Warianty gier',
	recentTrends: 'Ostatnie trendy',
	gameLength: 'Długość gier',
	shortest: 'Najkrótsza',
	longest: 'Najdłuższa',
	avgLength: 'Średnia',
	last5Games: 'Ostatnie 5 gier',
	last10Games: 'Ostatnie 10 gier',
	bestCheckout: 'Najlepszy finisz',
	checkout: 'Finisz',
	checkoutOverview: 'Profil finiszów',
	checkoutCount: 'Finisze',
	averageCheckout: 'Średni finisz',
	oneDartFinishes: '1 lotka',
	twoDartFinishes: '2 lotki',
	threeDartFinishes: '3 lotki',
	lowCheckouts: '2-40',
	midCheckouts: '41-100',
	highCheckouts: '101+',
	commonCheckouts: 'Najczęstsze',
	overallPerformance: 'Ogólna wydajność',
	modeComparison: 'Porównanie trybów',
	score100plus: '100+',
	score120plus: '120+',
	score140plus: '140+',
	score160plus: '160+',
	score180: '180',
	language: 'Język',
	languagePolish: 'Polski',
	languageEnglish: 'English',
	advancedMode: 'Tryb zaawansowany',
	advancedModeDescription: 'Śledź każdy rzut osobno',
	turnHistoryLayout: 'Historia rund',
	turnHistoryLayoutDescription: 'Wybierz, jak wyniki rund mają układać się podczas gry',
	turnHistoryLayoutWrapped: 'Zawijane',
	turnHistoryLayoutScrollable: 'Przewijane',
	displayMatch: 'Ekran meczu',
	displayMatchDescription: 'Telefon wysyła wynik do komputera z uruchomionym ekranem meczu.',
	displayMatchToggle: 'Pokazuj mecz na ekranie',
	displayMatchToggleDescription: 'Włącza przycisk na ekranie nowej gry.',
	displayMatchEnabled: 'Włączone',
	displayMatchDisabled: 'Wyłączone',
	displayLaptopAddress: 'Adres laptopa',
	displayLocalhostWarning: 'Na telefonie localhost oznacza telefon. Użyj IP komputera, np. http://10.0.0.42:3000.',
	displayPlayerName: 'Twoja nazwa na ekranie',
	displayPlayerNamePlaceholder: 'Gracz',
	displayMatchSetup: 'Ustawienia meczu',
	displayMatchSetupDescription: 'Wybierz format meczu przed połączeniem z ekranem.',
	displayMatchButton: 'Mecz na ekranie',
	displayMatchStart: 'Rozpocznij na ekranie',
	displayMatchBack: 'Wróć',
	displaySetupHowItWorks: 'Jak uruchomić ekran na laptopie?',
	displaySetupStep1: '1. Zainstaluj Node.js ze strony nodejs.org (wersja LTS)',
	displaySetupStep2: '2. Skopiuj folder "display-server" z projektu na laptopa',
	displaySetupStep3: '3. Otwórz terminal w tym folderze i wpisz: npm install  (tylko raz)',
	displaySetupStep4: '4. Uruchom serwer: npm start  (terminal musi być otwarty)',
	displaySetupStep5: '5. Na laptopie otwórz przeglądarkę → wejdź na: http://localhost:3000 → powinien pojawić się ekran gry',
	displaySetupStep6: '6. Znajdź IP laptopa: Windows → cmd → ipconfig → "Adres IPv4"  |  Mac → Terminal → ifconfig → "inet"',
	displaySetupStep7: '7. W polu "Adres laptopa" poniżej wpisz: http://[IP]:3000  np. http://10.0.0.42:3000',
	displaySetupStep8: '8. Telefon i laptop muszą być w tej samej sieci WiFi!',
	displayWinsMatch: 'wygrywa mecz',
	displayClosingLeg: 'zamyka leg',
	displayAtBoard: 'przy tarczy',
	displayEndScreen: 'Zakończ ekran',
	matchSets: 'Sety',
	matchLegs: 'Legi',
	tooltipOverallAverage: 'Średnia 3 lotek z wybranych gier. Wzór: zdobyte punkty / rzucone lotki x 3.',
	tooltipBestAverage: 'Najwyższa średnia 3 lotek uzyskana w jednej zapisanej grze.',
	tooltipHighestFinish: 'Najwyższy zapisany finisz, czyli wynik zamknięty ostatnim poprawnym doublem lub bullem.',
	tooltipGames: 'Liczba gier widocznych po aktualnych filtrach.',
	tooltipTotalDarts: 'Łączna liczba lotek rzuconych w wybranych grach. W trybie prostym liczymy 3 lotki na rundę, z korektą ostatniej rundy przy finiszu.',
	tooltipSuccessRate: 'Procent gier zakończonych finiszem. Wzór: ukończone gry / wszystkie wybrane gry x 100%.',
	tooltipCount180s: 'Liczba rund, w których wynik rundy wyniósł dokładnie 180.',
	tooltipGameDistribution: 'Podział wybranych gier według wariantu oraz statusu: ukończone lub przerwane.',
	tooltipModeComparison: 'Porównanie trybu prostego i zaawansowanego. Średnia jest liczona osobno dla gier z danego trybu.',
	tooltipScoreRanges: 'Liczba rund, które osiągnęły dany próg punktowy, np. 100+, 140+ lub 180.',
	tooltipCheckoutOverview: 'Statystyki tylko dla ukończonych finiszów. Średni finisz to suma wartości finiszów podzielona przez ich liczbę.',
	tooltipGameLength: 'Długość gry liczona liczbą rzuconych lotek: najkrótsza, średnia i najdłuższa gra.',
	tooltipTrainingSessions: 'Podsumowanie zapisanych treningów: liczba sesji, skuteczność, liczba celów i najlepsza sesja.',
	tooltipRecentTrends: 'Średnia i liczba ukończonych gier z ostatnich 5 oraz 10 zapisanych partii.',
	averageTrend: 'Trend średniej',
	tooltipAverageTrend: 'Wykres średniej 3-lotkowej z maksymalnie 30 ostatnich gier (od najstarszej do najnowszej). Puste kółko oznacza grę nieukończoną.',
	close: 'Zamknij',
	cancel: 'Anuluj',
	delete: 'Usuń',
	remove: 'Usuń',
	confirm: 'Potwierdź',
	yes: 'Tak',
	no: 'Nie',
	deleteConfirm: 'Usunąć ten wpis?',
	deleteConfirmMessage: 'Operacja jest nieodwracalna.',
	clearAllConfirm: 'Usunąć wszystkie statystyki?',
	clearAllMessage: 'Operacja jest nieodwracalna.',
	startGame: 'Rozpocznij grę',
	endGame: 'Zakończ grę',
	continueGame: 'Kontynuuj grę',
	loading: 'Ładowanie...',
	success: 'Sukces',
	error: 'Błąd',
	trainingSessions: 'Sesje treningowe',
	trainingSessionsCount: 'Liczba sesji',
	noTrainingSessions: 'Brak zapisanych sesji treningowych.',
	trainingSuccess: 'Skuteczność treningu',
	totalTargets: 'Łącznie celów',
	bestSession: 'Najlepsza sesja',
	targetsPracticed: 'Ćwiczone cele',
	info: 'Informacja',
	legendTitle: 'Legenda',
	legend1Hit: '1 rzut',
	legend5Hits: '5 rzutów',
	legend10Hits: '10 rzutów',
	legend15Hits: '15 rzutów',
	legend20PlusHits: '20 rzutów i więcej',
	heatmap: 'Heatmap',
	mpMultiplayerWifi: 'Multiplayer (WiFi)',
	forfeitScore: 'Wynik poddającego',
	forfeitScoreLeft: 'Pozostało',
	pointsLeft: 'Punkty pozostałe',
	avg: 'Średnia',
	darts: 'Lotki',
	points: 'pkt',
	checkoutDartsQuestion: 'Ile lotek użyłeś w ostatniej turze?',
	dart: 'lotka',
	dartsPlural: 'lotki',
	dartsGenitive: 'lotek',
	trainingMode: 'Tryb treningowy',
	practiceTargets: 'Ćwicz cele',
	checkoutPractice: 'Ćwicz finisze',
	clockClassic: 'Zegar klasyczny',
	clockDouble: 'Zegar double',
	clockTriple: 'Zegar triple',
	clockJump: 'Zegar z przeskokiem',
	clockPenalty: 'Zegar wstecz',
	bobs27: "Bob's 27",
	currentTarget: 'Aktualny cel',
	hitTarget: 'Traf ten cel!',
	hit: 'Traf!',
	miss: 'Pudło',
	sessionStats: 'Statystyki sesji',
	targets: 'Cele',
	hits: 'Trafienia',
	misses: 'Pudła',
	duration: 'Czas trwania',
	minutes: 'min',
	newTarget: 'Nowy cel',
	resetSession: 'Resetuj sesję',
	resetSessionConfirm: 'Zresetować sesję treningową?',
	reset: 'Resetuj',
	saveSession: 'Zapisz sesję',
	sessionSaved: 'Sesja zapisana',
	sessionSavedMessage: 'Twoja sesja treningowa została zapisana!',
	saveAndReset: 'Zapisz i resetuj',
	ok: 'OK',
	saveError: 'Błąd zapisu',
	saveErrorMsg: 'Nie udało się zapisać sesji treningowej.',
	targetsToHit: 'Cele do trafienia',
	checkoutMode: 'Tryb finiszu',
	checkoutTarget: 'Cel finiszu',
	checkoutInstructions: 'Traf wszystkie cele, aby ukończyć finisz!',
	checkoutSuccess: 'Finisz ukończony!',
	checkoutFailed: 'Finisz nieudany',
	nextCheckout: 'Następny finisz',
	checkoutScore: 'Wynik finiszu',
	checkoutAttempts: 'Próby finiszu',
	checkoutSuccessRate: 'Skuteczność finiszu',
	targetPracticeDescription: 'Trafiaj losowe cele, aby poprawić celność.',
	checkoutPracticeDescription: 'Ćwicz kończenie gier w realistycznych scenariuszach finiszu.',
	clockClassicDescription: 'Przejdź 1-20, 25 i Bull. Do przodu idziesz tylko po trafieniu.',
	clockDoubleDescription: 'Przejdź D1-D20, potem 25 i Bull.',
	clockTripleDescription: 'Przejdź T1-T20, potem 25 i Bull.',
	clockJumpDescription: 'S/D/T przesuwa o 1/2/3 pola. Po 20 są 25 i Bull.',
	clockPenaltyDescription: 'S/D/T przesuwa o 1/2/3 pola, pudło cofa o 1. Po 20 są 25 i Bull.',
	bobs27Description: 'Start od 27 punktów. Rzucasz po 3 lotki w każdy double od D1 do D20.',
	bobs27GameOverTitle: "Koniec Bob's 27",
	bobs27GameOverMessage: 'Wynik spadł do 0 lub poniżej. Sesja została zapisana.',
	bobs27Won: 'Wygrana',
	bobs27Lost: 'Przegrana',
	bobs27FinalScore: 'Wynik Bob’s 27',
	result: 'Wynik',
	retryCheckout: 'Ponów finisz',
	checkoutComplete: 'Ukończone',
	checkoutStats: 'Statystyki finiszu',
	areVisibleIn: 'są widoczne w',
	tab: 'zakładce',
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
	backupImportModeMessage: 'Wybierz sposób importu danych.',
	backupImportMerge: 'Scal z obecnymi',
	backupImportReplace: 'Zastąp obecne',
	backupInProgress: 'Trwa operacja kopii danych...',
	backupExportSuccessTitle: 'Eksport zakończony',
	backupExportSuccessMessage: 'Utworzono plik kopii zapasowej.',
	backupExportShareUnavailable: 'Udostępnianie plików nie jest dostępne na tym urządzeniu.',
	backupImportSuccessTitle: 'Import zakończony',
	backupImportSuccessMessage: 'Dane zostały poprawnie zaimportowane.',
	backupErrorExport: 'Nie udało się wyeksportować danych.',
	backupErrorImport: 'Nie udało się zaimportować danych.',
	backupErrorInvalidFile: 'Wybrany plik nie jest poprawnym backupem.',
	mpConnecting: 'Łączenie z pokojem...',
	mpMatchOver: 'KONIEC MECZU',
	mpWins: 'WYGRYWA!',
	mpToMenu: 'Do menu',
	mpYourScore: 'WYNIK TURY',
	mpConfirmScore: 'Potwierdź',
	mpEditScore: 'Popraw',
	mpBustWarning: 'SPALONO!',
	mpSets: 'SETY',
	mpLegs: 'LEGI',
	mpAverage: 'ŚREDNIA',
	mpWaitingForOpponent: 'Czekam na drugiego gracza...',
	mpWaitingForHost: 'Czekam na start od gospodarza...',
	mpPlayersTurn: 'Tura gracza',
	mpLeaveGame: 'Opuść grę',
	mpLeaveGameMessage: 'Czy na pewno chcesz opuścić grę? Aktualny leg zostanie zapisany jako nieukończony.',
	mpStay: 'Zostań',
	mpLeave: 'Wyjdź',
	mpBustFlash: 'SPALONKO!',
	mpLegWon: 'LEG WYGRANY!',
	mpLegLost: 'LEG PRZEGRANY...',
	mpSetWon: 'SET WYGRANY!',
	mpSetLost: 'SET PRZEGRANY...',
	mpHostWaiting: 'Gospodarz · Czekanie',
	mpRoomCreated: 'Pokój stworzony',
	mpRoomCode: 'KOD POKOJU',
	mpShareCode: 'Podaj ten kod drugiemu graczowi',
	mpPlayers: 'GRACZE',
	mpHost: 'Gospodarz',
	mpReady: 'GOTOWY',
	mpWaitingForPlayer: 'Czekam na gracza...',
	mpStarting: 'Uruchamianie...',
	mpCancelRoom: 'Anuluj pokój',
	mpCancelRoomMessage: 'Czy chcesz anulować pokój i wrócić do menu?',
	mpCreateRoom: 'Utwórz pokój',
	mpJoinRoom: 'Dołącz do pokoju',
	mpCreating: 'Tworzenie...',
	mpJoining: 'Dołączanie...',
	mpYourName: 'Twoje imię',
	mpNamePlaceholder: 'Wpisz imię...',
	mpEnterName: 'Wpisz swoje imię',
	mpServerError: 'Błąd połączenia',
	mpServerErrorMsg: 'Nie można połączyć się z serwerem. Sprawdź czy oba urządzenia są w tej samej sieci WiFi.',
	mpRoomCodeLength: 'Kod pokoju musi mieć dokładnie 4 znaki',
	mpJoinError: 'Nie można dołączyć do pokoju',
	mpWifiSameNetwork: 'WiFi · ta sama sieć',
	mpVariant: 'Wariant',
	mpAdvShort: 'ZAW',
	mpWhoStarts: 'Kto zaczyna?',
	mpBullThrowHint: 'Zdecyduj rzutem w bulla',
};

const englishStrings: LocalizedStrings = {
	play: 'Play',
	stats: 'Statistics',
	settings: 'Settings',
	newGame: 'New game',
	game: 'Game',
	gameOver: 'Game over',
	newGameButton: 'New game',
	forfeit: 'Forfeit',
	forfeitConfirm: 'Forfeit game?',
	forfeitMessage: 'Are you sure you want to forfeit this game?',
	cancelGame: 'Cancel game',
	cancelGameConfirm: 'Cancel game?',
	cancelGameMessage: 'This game has not started yet, so it will not be saved in statistics.',
	bust: 'BUST',
	bustMessage: 'Score unchanged. Turn saved as 0.',
	variant301: '301',
	variant401: '401',
	variant501: '501',
	variant301Meta: 'Quick',
	variant401Meta: 'Medium',
	variant501Meta: 'Match',
	selectVariant: 'Select variant',
	score: 'Score',
	remaining: 'Remaining',
	turn: 'Turn',
	turns: 'Turns',
	average: 'Average',
	bestAverage: 'Best average',
	overallAverage: 'Overall average',
	roundScore: 'Turn score',
	invalidTurnScore: 'Invalid turn score',
	undoTurnConfirm: 'Undo last turn?',
	undoTurnWhileTypingMessage: 'Only the last saved turn will be undone. The currently entered score will stay unchanged.',
	undoTurnPrompt: 'Tap the bin again to undo the last turn.',
	summary: 'Summary',
	summaryShort: 'Summary',
	showSummary: 'Show summary',
	statsFilters: 'Filters',
	statsFiltersTitle: 'Result filters',
	clearFilters: 'Clear',
	filterPeriod: 'Period',
	filterGame: 'Game',
	filterMode: 'Mode',
	filterStatus: 'Status',
	filterAll: 'All',
	filterLast7Days: '7 days',
	filterLast30Days: '30 days',
	simple: 'Simple',
	advanced: 'Advanced',
	selectedGamesSummary: 'games in selected view',
	threeDartAverage: '3-dart average',
	completedTrendSuffix: 'completed',
	detailedStats: 'Detailed statistics',
	gameAnalysis: 'Game analysis',
	bestTurn: 'Best turn',
	averageTurn: 'Avg turn',
	weakTurns: 'Turns <45',
	leftAfterTurn: 'Left',
	gameDistribution: 'Game distribution',
	scoreRanges: 'Score ranges',
	modeSimple: 'Simple mode',
	modeAdvanced: 'Advanced mode',
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
	totalGames: 'Total games',
	gameVariants: 'Game variants',
	recentTrends: 'Recent trends',
	gameLength: 'Game length',
	shortest: 'Shortest',
	longest: 'Longest',
	avgLength: 'Average',
	last5Games: 'Last 5 games',
	last10Games: 'Last 10 games',
	bestCheckout: 'Best checkout',
	checkout: 'Checkout',
	checkoutOverview: 'Checkout profile',
	checkoutCount: 'Checkouts',
	averageCheckout: 'Average checkout',
	oneDartFinishes: '1 dart',
	twoDartFinishes: '2 darts',
	threeDartFinishes: '3 darts',
	lowCheckouts: '2-40',
	midCheckouts: '41-100',
	highCheckouts: '101+',
	commonCheckouts: 'Most common',
	overallPerformance: 'Overall performance',
	modeComparison: 'Mode comparison',
	score100plus: '100+',
	score120plus: '120+',
	score140plus: '140+',
	score160plus: '160+',
	score180: '180',
	language: 'Language',
	languagePolish: 'Polski',
	languageEnglish: 'English',
	advancedMode: 'Advanced mode',
	advancedModeDescription: 'Track each throw separately',
	turnHistoryLayout: 'Turn history',
	turnHistoryLayoutDescription: 'Choose how turn scores are arranged during a game',
	turnHistoryLayoutWrapped: 'Wrapped',
	turnHistoryLayoutScrollable: 'Scrollable',
	displayMatch: 'Match screen',
	displayMatchDescription: 'The phone sends the score to the computer running the match screen.',
	displayMatchToggle: 'Show match screen option',
	displayMatchToggleDescription: 'Enables the button on the new game screen.',
	displayMatchEnabled: 'Enabled',
	displayMatchDisabled: 'Disabled',
	displayLaptopAddress: 'Laptop address',
	displayLocalhostWarning: 'On a phone, localhost means the phone itself. Use the computer IP, for example http://10.0.0.42:3000.',
	displayPlayerName: 'Your screen name',
	displayPlayerNamePlaceholder: 'Player',
	displayMatchSetup: 'Match settings',
	displayMatchSetupDescription: 'Choose the match format before connecting to the screen.',
	displayMatchButton: 'Match on screen',
	displayMatchStart: 'Start on screen',
	displayMatchBack: 'Back',
	displaySetupHowItWorks: 'How to set up the display on a laptop?',
	displaySetupStep1: '1. Install Node.js from nodejs.org (LTS version)',
	displaySetupStep2: '2. Copy the "display-server" folder from the project to the laptop',
	displaySetupStep3: '3. Open a terminal in that folder and run: npm install  (once only)',
	displaySetupStep4: '4. Start the server: npm start  (keep the terminal open)',
	displaySetupStep5: '5. On the laptop open a browser → go to: http://localhost:3000 → the scoreboard should appear',
	displaySetupStep6: '6. Find the laptop IP: Windows → cmd → ipconfig → "IPv4 Address"  |  Mac → Terminal → ifconfig → "inet"',
	displaySetupStep7: '7. In the "Laptop address" field below enter: http://[IP]:3000  e.g. http://10.0.0.42:3000',
	displaySetupStep8: '8. The phone and laptop must be on the same WiFi network!',
	displayWinsMatch: 'wins match',
	displayClosingLeg: 'closing leg',
	displayAtBoard: 'at the board',
	displayEndScreen: 'End screen',
	matchSets: 'Sets',
	matchLegs: 'Legs',
	tooltipOverallAverage: '3-dart average from the selected games. Formula: scored points / darts thrown x 3.',
	tooltipBestAverage: 'The highest 3-dart average achieved in one saved game.',
	tooltipHighestFinish: 'The highest saved checkout, finished with a valid double or bull.',
	tooltipGames: 'Number of games visible with the current filters.',
	tooltipTotalDarts: 'Total darts thrown in the selected games. In simple mode, 3 darts are counted per turn, with a last-turn checkout correction.',
	tooltipSuccessRate: 'Percentage of games finished with a checkout. Formula: completed games / all selected games x 100%.',
	tooltipCount180s: 'Number of turns where the turn score was exactly 180.',
	tooltipGameDistribution: 'Breakdown of selected games by variant and status: completed or forfeited.',
	tooltipModeComparison: 'Comparison between simple and advanced mode. The average is calculated separately for each mode.',
	tooltipScoreRanges: 'Number of turns that reached each scoring threshold, such as 100+, 140+ or 180.',
	tooltipCheckoutOverview: 'Stats for completed checkouts only. Average checkout is the sum of checkout values divided by checkout count.',
	tooltipGameLength: 'Game length counted in darts thrown: shortest, average and longest game.',
	tooltipTrainingSessions: 'Summary of saved training sessions: sessions, success rate, targets and best session.',
	tooltipRecentTrends: 'Average and completed game count from the last 5 and last 10 saved games.',
	averageTrend: 'Average trend',
	tooltipAverageTrend: 'Chart of 3-dart average for the last 30 games (oldest to newest). An empty dot means an unfinished game.',
	close: 'Close',
	cancel: 'Cancel',
	delete: 'Delete',
	remove: 'Remove',
	confirm: 'Confirm',
	yes: 'Yes',
	no: 'No',
	deleteConfirm: 'Delete this entry?',
	deleteConfirmMessage: 'This action cannot be undone.',
	clearAllConfirm: 'Delete all statistics?',
	clearAllMessage: 'This action cannot be undone.',
	startGame: 'Start game',
	endGame: 'End game',
	continueGame: 'Continue game',
	loading: 'Loading...',
	success: 'Success',
	error: 'Error',
	trainingSessions: 'Training sessions',
	trainingSessionsCount: 'Sessions',
	noTrainingSessions: 'No saved training sessions.',
	trainingSuccess: 'Training success',
	totalTargets: 'Total targets',
	bestSession: 'Best session',
	targetsPracticed: 'Targets practiced',
	info: 'Information',
	legendTitle: 'Legend',
	legend1Hit: '1 throw',
	legend5Hits: '5 throws',
	legend10Hits: '10 throws',
	legend15Hits: '15 throws',
	legend20PlusHits: '20 throws and more',
	heatmap: 'Heatmap',
	mpMultiplayerWifi: 'Multiplayer (WiFi)',
	forfeitScore: 'Forfeit score',
	forfeitScoreLeft: 'Score left',
	pointsLeft: 'Points left',
	avg: 'Average',
	darts: 'Darts',
	points: 'pts',
	checkoutDartsQuestion: 'How many darts did you use in the last turn?',
	dart: 'dart',
	dartsPlural: 'darts',
	dartsGenitive: 'darts',
	trainingMode: 'Training mode',
	practiceTargets: 'Practice targets',
	checkoutPractice: 'Checkout practice',
	clockClassic: 'Classic clock',
	clockDouble: 'Double clock',
	clockTriple: 'Triple clock',
	clockJump: 'Jump clock',
	clockPenalty: 'Reverse clock',
	bobs27: "Bob's 27",
	currentTarget: 'Current target',
	hitTarget: 'Hit this target!',
	hit: 'Hit!',
	miss: 'Miss',
	sessionStats: 'Session stats',
	targets: 'Targets',
	hits: 'Hits',
	misses: 'Misses',
	duration: 'Duration',
	minutes: 'min',
	newTarget: 'New target',
	resetSession: 'Reset session',
	resetSessionConfirm: 'Reset training session?',
	reset: 'Reset',
	saveSession: 'Save session',
	sessionSaved: 'Session saved',
	sessionSavedMessage: 'Your training session has been saved!',
	saveAndReset: 'Save and reset',
	ok: 'OK',
	saveError: 'Save error',
	saveErrorMsg: 'Failed to save training session.',
	targetsToHit: 'Targets to hit',
	checkoutMode: 'Checkout mode',
	checkoutTarget: 'Checkout target',
	checkoutInstructions: 'Hit all targets to complete the checkout!',
	checkoutSuccess: 'Checkout complete!',
	checkoutFailed: 'Checkout failed',
	nextCheckout: 'Next checkout',
	checkoutScore: 'Checkout score',
	checkoutAttempts: 'Checkout attempts',
	checkoutSuccessRate: 'Checkout success rate',
	targetPracticeDescription: 'Hit random targets to improve accuracy.',
	checkoutPracticeDescription: 'Practice finishing games with realistic checkout scenarios.',
	clockClassicDescription: 'Move 1-20, 25 and Bull. You advance only after a hit.',
	clockDoubleDescription: 'Move D1-D20, then 25 and Bull.',
	clockTripleDescription: 'Move T1-T20, then 25 and Bull.',
	clockJumpDescription: 'S/D/T moves 1/2/3 steps forward. After 20 come 25 and Bull.',
	clockPenaltyDescription: 'S/D/T moves 1/2/3 steps forward, miss moves back 1. After 20 come 25 and Bull.',
	bobs27Description: 'Start at 27 points. Throw 3 darts at every double from D1 to D20.',
	bobs27GameOverTitle: "Bob's 27 over",
	bobs27GameOverMessage: 'The score dropped to 0 or below. The session has been saved.',
	bobs27Won: 'Won',
	bobs27Lost: 'Lost',
	bobs27FinalScore: "Bob's 27 score",
	result: 'Result',
	retryCheckout: 'Retry checkout',
	checkoutComplete: 'Complete',
	checkoutStats: 'Checkout stats',
	areVisibleIn: 'are visible in',
	tab: 'tab',
	dataBackup: 'Data backup',
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
	mpConnecting: 'Connecting to room...',
	mpMatchOver: 'MATCH OVER',
	mpWins: 'WINS!',
	mpToMenu: 'To menu',
	mpYourScore: 'TURN SCORE',
	mpConfirmScore: 'Confirm',
	mpEditScore: 'Edit',
	mpBustWarning: 'BUST!',
	mpSets: 'SETS',
	mpLegs: 'LEGS',
	mpAverage: 'AVERAGE',
	mpWaitingForOpponent: 'Waiting for opponent...',
	mpWaitingForHost: 'Waiting for host to start...',
	mpPlayersTurn: "Player's turn",
	mpLeaveGame: 'Leave game',
	mpLeaveGameMessage: 'Are you sure you want to leave? The current leg will be saved as unfinished.',
	mpStay: 'Stay',
	mpLeave: 'Leave',
	mpBustFlash: 'BUST!',
	mpLegWon: 'LEG WON!',
	mpLegLost: 'LEG LOST...',
	mpSetWon: 'SET WON!',
	mpSetLost: 'SET LOST...',
	mpHostWaiting: 'Host · Waiting',
	mpRoomCreated: 'Room Created',
	mpRoomCode: 'ROOM CODE',
	mpShareCode: 'Share this code with the other player',
	mpPlayers: 'PLAYERS',
	mpHost: 'Host',
	mpReady: 'READY',
	mpWaitingForPlayer: 'Waiting for player...',
	mpStarting: 'Starting...',
	mpCancelRoom: 'Cancel room',
	mpCancelRoomMessage: 'Do you want to cancel the room and return to menu?',
	mpCreateRoom: 'Create room',
	mpJoinRoom: 'Join room',
	mpCreating: 'Creating...',
	mpJoining: 'Joining...',
	mpYourName: 'Your name',
	mpNamePlaceholder: 'Enter name...',
	mpEnterName: 'Enter your name',
	mpServerError: 'Connection error',
	mpServerErrorMsg: 'Could not connect to server. Make sure both devices are on the same WiFi network.',
	mpRoomCodeLength: 'Room code must be exactly 4 characters',
	mpJoinError: 'Cannot join the room',
	mpWifiSameNetwork: 'WiFi · same network',
	mpVariant: 'Variant',
	mpAdvShort: 'ADV',
	mpWhoStarts: 'Who starts?',
	mpBullThrowHint: 'Decide with a bull throw',
};

export function getLocalizedStrings(language: Language): LocalizedStrings {
	return language === 'en' ? englishStrings : polishStrings;
}

export function useLocalization(language: Language) {
	return getLocalizedStrings(language);
}
