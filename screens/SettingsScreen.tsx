// screens/SettingsScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { getAdvanced, setAdvanced } from '../lib/settings';

export default function SettingsScreen() {
	const [adv, setAdv] = useState(false);
	const saved = useRef<boolean | null>(null);

	// pierwszy odczyt z AsyncStorage
	useEffect(() => {
		getAdvanced().then(v => {
			setAdv(v);
			saved.current = v;
		});
	}, []);

	/** zapisujemy TYLKO gdy wartość faktycznie się zmieniła */
	const handleChange = async (value: boolean) => {
		if (value === saved.current) return; // podwójny callback Switcha – ignoruj
		setAdv(value);
		await setAdvanced(value); // zapis
		saved.current = value; // zapamiętaj
		console.log('saved advancedMode', value);
	};

	return (
		<View style={styles.box}>
			<Text style={styles.label}>Rejestruj pojedyncze lotki</Text>
			<Switch value={adv} onValueChange={handleChange} />
		</View>
	);
}

const styles = StyleSheet.create({
	box: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
	label: { color: '#fff', fontSize: 16, marginBottom: 12 },
});
