/*
 * Centralny plik z deklaracjami typów nawigacji dla całej aplikacji.
 * Możesz rozszerzać RootStackParamList w miarę dodawania kolejnych ekranów.
 */

import { GameVariant } from '../lib/gameVariant';

export type RootStackParamList = {
	NewGame: undefined;
	Game: { initialScore: number; variant: GameVariant };
};
