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
		start: number; // 501 / 301
		forfeited?: boolean;
		forfeitScore?: number;
	};
	Heatmap: undefined;
};
