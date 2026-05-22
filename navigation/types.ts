import { GameVariant } from '../lib/gameVariant';

export type RootStackParamList = {
	NewGame: undefined;
	Game: { initialScore: number; variant: GameVariant };
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
	Heatmap: undefined;
	Training: undefined;
};
