import { GameVariant } from '../lib/gameVariant';

export type RootStackParamList = {
	NewGame: undefined;
	Game: {
		initialScore: number;
		variant: GameVariant;
		displayMode?: boolean;
		advancedOverride?: boolean;
		setsTarget?: number;
		legsTarget?: number;
	};
	Multiplayer: undefined;
	RoomLobby: {
		roomCode: string;
		playerId: string;
		playerName: string;
		serverUrl: string;
	};
	RoomGame: {
		roomCode: string;
		playerId: string;
		playerName: string;
		serverUrl: string;
		seat: number;
	};
	StatsList: undefined;
	StatsDetail: {
		id: number;
		turns: number[];
		avg3: number;
		date: string;
		start: number; // 501 / 401 / 301
		darts: number; // Faktyczna liczba lotek
		scored?: number;
		checkout?: string | null;
		hits?: string | null;
		forfeited?: boolean;
		forfeitScore?: number;
	};
};
