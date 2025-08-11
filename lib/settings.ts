import AsyncStorage from '@react-native-async-storage/async-storage';

const ADVANCED_KEY = 'advancedMode';
const LANGUAGE_KEY = 'appLanguage';

export type Language = 'pl' | 'en';

export async function getAdvanced() {
	const v = await AsyncStorage.getItem(ADVANCED_KEY);
	return v === '1'; // null → false
}

export async function setAdvanced(on: boolean) {
	await AsyncStorage.setItem(ADVANCED_KEY, on ? '1' : '0');
}

export async function getLanguage(): Promise<Language> {
	const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
	return (lang as Language) || 'pl'; // Default to Polish
}

export async function setLanguage(lang: Language) {
	await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}
