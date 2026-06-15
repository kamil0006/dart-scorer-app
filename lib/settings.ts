import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const ADVANCED_KEY = 'advancedMode';
const LANGUAGE_KEY = 'appLanguage';
const HORIZONTAL_TURNS_KEY = 'horizontalTurnsHistory';
const DISPLAY_SERVER_URL_KEY = 'displayServerUrl';
const PLAYER_ONE_NAME_KEY = 'displayPlayerOneName';
const DISPLAY_CLIENT_ID_KEY = 'displayClientId';
const DISPLAY_MATCH_ENABLED_KEY = 'displayMatchEnabled';

export type Language = 'pl' | 'en';

export async function getAdvanced() {
	const v = await AsyncStorage.getItem(ADVANCED_KEY);
	return v === '1'; // null → false
}

export async function setAdvanced(on: boolean) {
	await AsyncStorage.setItem(ADVANCED_KEY, on ? '1' : '0');
}

export async function getHorizontalTurnsHistory() {
	const value = await AsyncStorage.getItem(HORIZONTAL_TURNS_KEY);
	return value === '1';
}

export async function setHorizontalTurnsHistory(on: boolean) {
	await AsyncStorage.setItem(HORIZONTAL_TURNS_KEY, on ? '1' : '0');
}

export async function getLanguage(): Promise<Language> {
	const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
	return (lang as Language) || 'pl'; // Default to Polish
}

export async function setLanguage(lang: Language) {
	await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

export async function getDisplayServerUrl() {
	const savedUrl = await AsyncStorage.getItem(DISPLAY_SERVER_URL_KEY);

	if (!savedUrl || isLocalhostUrl(savedUrl)) {
		return '';
	}

	return savedUrl;
}

export async function getDisplayServerUrls() {
	const savedUrl = await AsyncStorage.getItem(DISPLAY_SERVER_URL_KEY);
	return uniqueUrls([savedUrl, getDefaultDisplayServerUrl(), 'http://127.0.0.1:3000']);
}

export async function setDisplayServerUrl(url: string) {
	await AsyncStorage.setItem(DISPLAY_SERVER_URL_KEY, url.trim());
}

export async function getDisplayPlayerName() {
	return (await AsyncStorage.getItem(PLAYER_ONE_NAME_KEY)) || 'Gracz 1';
}

export async function setDisplayPlayerName(playerName: string) {
	await AsyncStorage.setItem(PLAYER_ONE_NAME_KEY, playerName.trim() || 'Gracz 1');
}

export async function getDisplayMatchEnabled() {
	const value = await AsyncStorage.getItem(DISPLAY_MATCH_ENABLED_KEY);
	return value === '1';
}

export async function setDisplayMatchEnabled(on: boolean) {
	await AsyncStorage.setItem(DISPLAY_MATCH_ENABLED_KEY, on ? '1' : '0');
}

export async function getDisplayClientId() {
	const savedId = await AsyncStorage.getItem(DISPLAY_CLIENT_ID_KEY);
	if (savedId) return savedId;

	const id = `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	await AsyncStorage.setItem(DISPLAY_CLIENT_ID_KEY, id);
	return id;
}

export function getDefaultDisplayServerUrl() {
	const hostUri = getExpoHostUri();
	const host = hostUri?.split(':')[0];

	if (host && host !== 'localhost' && host !== '127.0.0.1') {
		return `http://${host}:3000`;
	}

	return 'http://127.0.0.1:3000';
}

function getExpoHostUri() {
	const constants = Constants as typeof Constants & {
		manifest?: { debuggerHost?: string; hostUri?: string };
		manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
	};

	return (
		Constants.expoConfig?.hostUri ||
		constants.manifest2?.extra?.expoClient?.hostUri ||
		constants.manifest?.hostUri ||
		constants.manifest?.debuggerHost ||
		null
	);
}

function isLocalhostUrl(value: string) {
	return /(^|\/\/)(localhost|127\.0\.0\.1)(:|\/|$)/i.test(value.trim());
}

function uniqueUrls(values: Array<string | null | undefined>) {
	const urls: string[] = [];
	for (const value of values) {
		const trimmed = value?.trim();
		if (!trimmed || urls.includes(trimmed)) continue;
		urls.push(trimmed);
	}
	return urls;
}
