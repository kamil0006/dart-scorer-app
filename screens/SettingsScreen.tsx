// screens/SettingsScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { exportBackupToFile, importBackupFromFile, pickBackupFile, shareBackup } from '../lib/dataBackup';
import { useLanguage } from '../lib/LanguageContext';
import { getAdvanced, getLanguage, Language, setAdvanced } from '../lib/settings';

type SettingsModalAction = {
	label: string;
	variant?: 'primary' | 'secondary' | 'destructive';
	onPress?: () => void;
};

export default function SettingsScreen() {
	const [adv, setAdv] = useState(false);
	const [currentLanguage, setCurrentLanguage] = useState<Language>('pl');
	const [backupBusy, setBackupBusy] = useState<'export' | 'import' | null>(null);
	const [lastBackupUri, setLastBackupUri] = useState<string | null>(null);
	const [customModalVisible, setCustomModalVisible] = useState(false);
	const [customModalTitle, setCustomModalTitle] = useState('');
	const [customModalMessage, setCustomModalMessage] = useState('');
	const [customModalActions, setCustomModalActions] = useState<SettingsModalAction[]>([]);
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

	const openCustomModal = (title: string, message: string, actions: SettingsModalAction[]) => {
		setCustomModalTitle(title);
		setCustomModalMessage(message);
		setCustomModalActions(actions);
		setCustomModalVisible(true);
	};

	const closeCustomModal = () => {
		setCustomModalVisible(false);
		setCustomModalActions([]);
	};

	const handleCustomModalAction = (action: SettingsModalAction) => {
		closeCustomModal();
		action.onPress?.();
	};

	const handleExportData = async () => {
		setBackupBusy('export');
		try {
			const result = await exportBackupToFile();
			setLastBackupUri(result.uri);
			const shared = await shareBackup(result.uri);

			const message = `${strings.backupExportSuccessMessage}

${strings.games}: ${result.gamesCount}
${strings.trainingSessions}: ${result.trainingSessionsCount}
${strings.backupSavedLocation}: ${result.directory}${result.fileName}${shared ? '' : `\n\n${strings.backupExportShareUnavailable}`}`;

			openCustomModal(strings.backupExportSuccessTitle, message, [{ label: strings.ok, variant: 'primary' }]);
		} catch (error) {
			console.warn('Export backup failed:', error);
			openCustomModal(strings.error, strings.backupErrorExport, [{ label: strings.ok, variant: 'primary' }]);
		} finally {
			setBackupBusy(null);
		}
	};

	const runImportData = async (mode: 'merge' | 'replace') => {
		setBackupBusy('import');
		try {
			const pickedFile = await pickBackupFile();
			if (!pickedFile) {
				setBackupBusy(null);
				return;
			}

			const result = await importBackupFromFile(pickedFile.uri, mode);
			openCustomModal(
				strings.backupImportSuccessTitle,
				`${strings.backupImportSuccessMessage}

${strings.games}: ${result.importedGames}
${strings.trainingSessions}: ${result.importedTrainingSessions}`,
				[{ label: strings.ok, variant: 'primary' }]
			);
		} catch (error) {
			console.warn('Import backup failed:', error);
			const errorMessage = error instanceof Error && error.message.includes('Invalid backup format')
				? strings.backupErrorInvalidFile
				: strings.backupErrorImport;
			openCustomModal(strings.error, errorMessage, [{ label: strings.ok, variant: 'primary' }]);
		} finally {
			setBackupBusy(null);
		}
	};

	const handleImportData = () => {
		openCustomModal(strings.backupImportModeTitle, strings.backupImportModeMessage, [
			{ label: strings.cancel, variant: 'secondary' },
			{ label: strings.backupImportMerge, variant: 'primary', onPress: () => runImportData('merge') },
			{ label: strings.backupImportReplace, variant: 'destructive', onPress: () => runImportData('replace') },
		]);
	};

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
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

				{/* Data Backup */}
				<View style={styles.backupSection}>
					<Text style={styles.settingLabel}>{strings.dataBackup}</Text>
					<Text style={styles.settingDescription}>{strings.dataBackupDescription}</Text>

					<View style={styles.howItWorksBox}>
						<Text style={styles.howItWorksTitle}>{strings.backupHowItWorks}</Text>
						<Text style={styles.howItWorksStep}>{strings.backupStep1}</Text>
						<Text style={styles.howItWorksStep}>{strings.backupStep2}</Text>
						<Text style={styles.howItWorksStep}>{strings.backupStep3}</Text>
						<Text style={styles.howItWorksStep}>{strings.backupStep4}</Text>
					</View>

					<View style={styles.backupButtons}>
						<Pressable
							style={[styles.backupButton, backupBusy && styles.backupButtonDisabled]}
							onPress={handleExportData}
							disabled={backupBusy !== null}>
							<Text style={styles.backupButtonText}>{strings.dataExport}</Text>
						</Pressable>
						<Pressable
							style={[styles.backupButtonSecondary, backupBusy && styles.backupButtonDisabled]}
							onPress={handleImportData}
							disabled={backupBusy !== null}>
							<Text style={styles.backupButtonSecondaryText}>{strings.dataImport}</Text>
						</Pressable>
					</View>

					{backupBusy && (
						<View style={styles.backupBusyRow}>
							<ActivityIndicator size='small' color='#8AB4F8' />
							<Text style={styles.backupBusyText}>{strings.backupInProgress}</Text>
						</View>
					)}

					{lastBackupUri && <Text style={styles.backupPath}>{`${strings.backupSavedLocation}: ${lastBackupUri}`}</Text>}
				</View>
			</View>

			<Modal
				visible={customModalVisible}
				transparent={true}
				animationType='fade'
				onRequestClose={closeCustomModal}>
				<View style={styles.customModalOverlay}>
					<View style={styles.customModalContent}>
						<Text style={styles.customModalTitle}>{customModalTitle}</Text>
						<Text style={styles.customModalMessage}>{customModalMessage}</Text>

						<View style={styles.customModalButtons}>
							{customModalActions.map((action, idx) => (
								<Pressable
									key={`${action.label}-${idx}`}
									style={[
										styles.customModalButton,
										action.variant === 'primary' && styles.customModalButtonPrimary,
										action.variant === 'destructive' && styles.customModalButtonDestructive,
										action.variant === 'secondary' && styles.customModalButtonSecondary,
									]}
									onPress={() => handleCustomModalAction(action)}>
									<Text
										style={[
											styles.customModalButtonText,
											action.variant === 'primary' && styles.customModalButtonTextPrimary,
										]}>
										{action.label}
									</Text>
								</Pressable>
							))}
						</View>
					</View>
				</View>
			</Modal>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
	},
	containerContent: {
		padding: 20,
		paddingBottom: 40,
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
	backupSection: {
		paddingTop: 20,
	},
	howItWorksBox: {
		marginTop: 12,
		backgroundColor: '#23272E',
		borderRadius: 12,
		padding: 12,
	},
	howItWorksTitle: {
		color: '#8AB4F8',
		fontSize: 14,
		fontWeight: '700',
		marginBottom: 8,
	},
	howItWorksStep: {
		color: '#ccc',
		fontSize: 13,
		lineHeight: 19,
		marginBottom: 4,
	},
	backupButtons: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 14,
	},
	backupButton: {
		flex: 1,
		backgroundColor: '#8AB4F8',
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: 'center',
	},
	backupButtonText: {
		color: '#000',
		fontSize: 14,
		fontWeight: '700',
	},
	backupButtonSecondary: {
		flex: 1,
		backgroundColor: '#333',
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#555',
	},
	backupButtonSecondaryText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '700',
	},
	backupButtonDisabled: {
		opacity: 0.55,
	},
	backupBusyRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 12,
	},
	backupBusyText: {
		color: '#8AB4F8',
		marginLeft: 8,
		fontSize: 13,
	},
	backupPath: {
		color: '#888',
		fontSize: 12,
		lineHeight: 18,
		marginTop: 10,
	},
	customModalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.7)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
	},
	customModalContent: {
		width: '100%',
		maxWidth: 380,
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		padding: 20,
		borderWidth: 1,
		borderColor: '#333',
	},
	customModalTitle: {
		color: '#8AB4F8',
		fontSize: 19,
		fontWeight: '700',
		marginBottom: 10,
		textAlign: 'center',
	},
	customModalMessage: {
		color: '#d0d0d0',
		fontSize: 14,
		lineHeight: 21,
		marginBottom: 18,
		textAlign: 'center',
	},
	customModalButtons: {
		gap: 10,
	},
	customModalButton: {
		borderRadius: 10,
		paddingVertical: 12,
		alignItems: 'center',
		borderWidth: 1,
	},
	customModalButtonPrimary: {
		backgroundColor: '#8AB4F8',
		borderColor: '#8AB4F8',
	},
	customModalButtonDestructive: {
		backgroundColor: '#B00020',
		borderColor: '#B00020',
	},
	customModalButtonSecondary: {
		backgroundColor: '#2A2A2A',
		borderColor: '#444',
	},
	customModalButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '700',
	},
	customModalButtonTextPrimary: {
		color: '#111',
	},
});
