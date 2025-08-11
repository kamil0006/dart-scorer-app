// screens/SettingsScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useLanguage } from '../lib/LanguageContext';
import { getAdvanced, getLanguage, Language, setAdvanced } from '../lib/settings';

export default function SettingsScreen() {
	const [adv, setAdv] = useState(false);
	const [currentLanguage, setCurrentLanguage] = useState<Language>('pl');
	const saved = useRef<boolean | null>(null);
	const { strings, changeLanguage } = useLanguage();

	// pierwszy odczyt z AsyncStorage
	useEffect(() => {
		getAdvanced().then(v => {
			setAdv(v);
			saved.current = v;
		});

		getLanguage().then(lang => {
			setCurrentLanguage(lang);
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

	const handleLanguageChange = async (lang: Language) => {
		if (lang === currentLanguage) return;
		setCurrentLanguage(lang);
		await changeLanguage(lang);
		console.log('saved language', lang);
	};

	return (
		<View style={styles.container}>
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>{strings.settings}</Text>

				{/* Advanced Mode Setting */}
				<View style={styles.settingRow}>
					<View style={styles.settingInfo}>
						<Text style={styles.settingLabel}>{strings.advancedMode}</Text>
						<Text style={styles.settingDescription}>{strings.advancedModeDescription}</Text>
					</View>
					<Switch value={adv} onValueChange={handleChange} />
				</View>

				{/* Language Setting */}
				<View style={styles.settingRow}>
					<View style={styles.settingInfo}>
						<Text style={styles.settingLabel}>{strings.language}</Text>
						<Text style={styles.settingDescription}>
							{currentLanguage === 'pl' ? strings.languagePolish : strings.languageEnglish}
						</Text>
					</View>
					<View style={styles.languageButtons}>
						<Pressable
							style={[styles.languageButton, currentLanguage === 'pl' && styles.languageButtonActive]}
							onPress={() => handleLanguageChange('pl')}>
							<Text style={[styles.languageButtonText, currentLanguage === 'pl' && styles.languageButtonTextActive]}>
								{strings.languagePolish}
							</Text>
						</Pressable>
						<Pressable
							style={[styles.languageButton, currentLanguage === 'en' && styles.languageButtonActive]}
							onPress={() => handleLanguageChange('en')}>
							<Text style={[styles.languageButtonText, currentLanguage === 'en' && styles.languageButtonTextActive]}>
								{strings.languageEnglish}
							</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
		padding: 20,
	},
	section: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		padding: 20,
		marginTop: 20,
	},
	sectionTitle: {
		color: '#8AB4F8',
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 24,
		textAlign: 'center',
	},
	settingRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#333',
	},
	settingInfo: {
		flex: 1,
		marginRight: 16,
	},
	settingLabel: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 4,
	},
	settingDescription: {
		color: '#ccc',
		fontSize: 14,
		lineHeight: 20,
	},
	languageButtons: {
		flexDirection: 'row',
		gap: 8,
	},
	languageButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#444',
		backgroundColor: 'transparent',
	},
	languageButtonActive: {
		backgroundColor: '#8AB4F8',
		borderColor: '#8AB4F8',
	},
	languageButtonText: {
		color: '#ccc',
		fontSize: 14,
		fontWeight: '500',
	},
	languageButtonTextActive: {
		color: '#000',
		fontWeight: '600',
	},
});
