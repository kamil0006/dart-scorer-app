import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'advancedMode';

export async function getAdvanced() {
	const v = await AsyncStorage.getItem('advancedMode');
	return v === '1'; // null → false
}

export async function setAdvanced(on: boolean) {
	await AsyncStorage.setItem(KEY, on ? '1' : '0');
}
