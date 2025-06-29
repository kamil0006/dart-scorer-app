

import { GameVariant } from '../lib/gameVariant';

export type RootStackParamList = {
	NewGame: undefined;
	Game: { initialScore: number; variant: GameVariant };
	StatsList: undefined;                 // <– było StatsScreen
	StatsDetail: {                        // <– NOWE
	  id: number;
	  turns: number[];                   // już sparsowane
	  avg3: number;
	  date: string;
	  start: number;                     // 501 / 301
	};
  };
  
