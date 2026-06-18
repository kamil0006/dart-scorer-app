import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboarding } from '../lib/OnboardingContext';

import { fetchGames, GameRow } from '../lib/db';
import { calculateAvg3 } from '../lib/dartsStats';
import { GameVariant, STARTING_SCORE } from '../lib/gameVariant';
import { useLanguage } from '../lib/LanguageContext';
import { getAdvanced, setAdvanced as saveAdvanced } from '../lib/settings';
import { RootStackParamList } from '../navigation/types';

export type NewGameScreenProps = {
	navigation: StackNavigationProp<RootStackParamList, 'NewGame'>;
};

const VARIANTS: GameVariant[] = ['501', '401', '301'];

function getVariantMeta(variant: GameVariant, strings: ReturnType<typeof useLanguage>['strings']) {
	switch (variant) {
		case '501':
			return strings.variant501Meta;
		case '401':
			return strings.variant401Meta;
		case '301':
			return strings.variant301Meta;
	}
}

export default function NewGameScreen({ navigation }: NewGameScreenProps) {
	const { strings } = useLanguage();
	const { height } = useWindowDimensions();
	const compact = height < 680;
	const [variant, setVariant] = useState<GameVariant>('501');
	const [advanced, setAdvanced] = useState(false);
	const [games, setGames] = useState<GameRow[]>([]);

	const { startTour } = useOnboarding();

	useFocusEffect(
		useCallback(() => {
			setGames(fetchGames());
			getAdvanced().then(setAdvanced);
		}, [])
	);

	const overallAverage = useMemo(() => {
		const scored = games.reduce((sum, game) => sum + game.scored, 0);
		const darts = games.reduce((sum, game) => sum + game.darts, 0);
		return calculateAvg3(scored, darts).toFixed(1);
	}, [games]);
	const selectedGames = games.filter(game => game.start === STARTING_SCORE[variant]).length;

	const handleStart = () =>
		navigation.navigate('Game', {
			initialScore: STARTING_SCORE[variant],
			variant,
		});

	const handleModeChange = async (nextAdvanced: boolean) => {
		if (nextAdvanced === advanced) return;
		setAdvanced(nextAdvanced);
		await saveAdvanced(nextAdvanced);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView
				contentContainerStyle={[styles.container, compact && styles.containerCompact]}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps='handled'>
				<View style={styles.header}>
					<View>
						<Text style={styles.eyebrow}>{strings.play}</Text>
						<Text style={[styles.title, compact && styles.titleCompact]}>{strings.newGame}</Text>
					</View>
					<View style={styles.modeSwitch}>
						<Pressable
							style={[styles.modeOption, !advanced && styles.modeOptionActive]}
							onPress={() => handleModeChange(false)}>
							<MaterialIcons name='dialpad' size={14} color={!advanced ? '#101113' : '#8AB4F8'} />
							<Text style={[styles.modeOptionText, !advanced && styles.modeOptionTextActive]} numberOfLines={1}>
								{strings.simple}
							</Text>
						</Pressable>
						<Pressable
							style={[styles.modeOption, advanced && styles.modeOptionActive]}
							onPress={() => handleModeChange(true)}>
							<MaterialIcons name='track-changes' size={14} color={advanced ? '#101113' : '#8AB4F8'} />
							<Text style={[styles.modeOptionText, advanced && styles.modeOptionTextActive]} numberOfLines={1}>
								{strings.advanced}
							</Text>
						</Pressable>
					</View>
					<Pressable style={styles.helpBtn} onPress={startTour}>
						<Text style={styles.helpBtnText}>?</Text>
					</Pressable>
				</View>

				<View style={styles.variantGrid}>
					{VARIANTS.map(item => {
						const active = item === variant;
						return (
							<Pressable key={item} style={[styles.variantCard, active && styles.variantCardActive, compact && styles.variantCardCompact]} onPress={() => setVariant(item)}>
								<Text style={[styles.variantScore, active && styles.variantScoreActive, compact && styles.variantScoreCompact]}>{item}</Text>
								<Text style={[styles.variantMeta, active && styles.variantMetaActive]}>
									{getVariantMeta(item, strings)}
								</Text>
							</Pressable>
						);
					})}
				</View>

				<View style={[styles.previewPanel, compact && styles.previewPanelCompact]}>
					<View style={styles.previewHeader}>
						<MaterialIcons name='insights' size={20} color='#8AB4F8' />
						<Text style={styles.previewTitle}>{strings.stats}</Text>
					</View>
					<View style={styles.previewGrid}>
						<PreviewMetric label={strings.games} value={games.length} />
						<PreviewMetric label={strings.average} value={overallAverage} />
						<PreviewMetric label={variant} value={selectedGames} />
					</View>
				</View>

				<Pressable style={[styles.startBtn, compact && styles.startBtnCompact]} onPress={handleStart}>
					<MaterialIcons name='play-arrow' size={28} color='#101113' />
					<Text style={styles.startTxt}>{strings.startGame}</Text>
				</Pressable>

				<Pressable style={[styles.multiplayerBtn, compact && styles.secondaryBtnCompact]} onPress={() => navigation.navigate('Multiplayer')}>
					<MaterialIcons name='people' size={21} color='#60D394' />
					<Text style={styles.multiplayerTxt}>{strings.mpMultiplayerWifi}</Text>
				</Pressable>
			</ScrollView>
		</SafeAreaView>
	);
}

function PreviewMetric({ label, value }: { label: string; value: string | number }) {
	return (
		<View style={styles.previewMetric}>
			<Text style={styles.previewValue}>{value}</Text>
			<Text style={styles.previewLabel} numberOfLines={1}>
				{label}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#121212',
	},
	container: {
		flexGrow: 1,
		backgroundColor: '#121212',
		padding: 16,
		justifyContent: 'center',
		gap: 18,
	},
	containerCompact: {
		gap: 10,
		paddingVertical: 12,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
	},
	eyebrow: {
		color: '#8AB4F8',
		fontSize: 12,
		fontWeight: '800',
		textTransform: 'uppercase',
	},
	title: {
		color: '#fff',
		fontSize: 32,
		fontWeight: '900',
		marginTop: 2,
	},
	titleCompact: {
		fontSize: 24,
	},
	modeSwitch: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 3,
		maxWidth: 188,
	},
	modeOption: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4,
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 7,
		minWidth: 76,
	},
	modeOptionActive: {
		backgroundColor: '#8AB4F8',
	},
	modeOptionText: {
		color: '#E7EEF7',
		fontSize: 11,
		fontWeight: '800',
	},
	modeOptionTextActive: {
		color: '#101113',
	},
	variantGrid: {
		flexDirection: 'row',
		gap: 10,
	},
	variantCard: {
		flex: 1,
		minHeight: 116,
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 10,
	},
	variantCardActive: {
		backgroundColor: '#8AB4F8',
		borderColor: '#8AB4F8',
	},
	variantCardCompact: {
		minHeight: 76,
	},
	variantScore: {
		color: '#fff',
		fontSize: 34,
		fontWeight: '900',
	},
	variantScoreActive: {
		color: '#101113',
	},
	variantScoreCompact: {
		fontSize: 26,
	},
	variantMeta: {
		color: '#9AA4AF',
		fontSize: 11,
		fontWeight: '800',
		marginTop: 6,
		textTransform: 'uppercase',
	},
	variantMetaActive: {
		color: '#25354F',
	},
	previewPanel: {
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 14,
	},
	previewPanelCompact: {
		padding: 10,
	},
	previewHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 12,
	},
	previewTitle: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '900',
	},
	previewGrid: {
		flexDirection: 'row',
		gap: 8,
	},
	previewMetric: {
		flex: 1,
		backgroundColor: '#242424',
		borderRadius: 8,
		padding: 10,
		alignItems: 'center',
	},
	previewValue: {
		color: '#fff',
		fontSize: 20,
		fontWeight: '900',
	},
	previewLabel: {
		color: '#aaa',
		fontSize: 11,
		fontWeight: '700',
		marginTop: 4,
	},
	startBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		backgroundColor: '#60D394',
		borderRadius: 8,
		paddingVertical: 16,
	},
	startBtnCompact: {
		paddingVertical: 11,
	},
	startTxt: {
		color: '#101113',
		fontSize: 17,
		fontWeight: '900',
	},
	multiplayerBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#1D3A2A',
		paddingVertical: 14,
	},
	secondaryBtnCompact: {
		paddingVertical: 10,
	},
	multiplayerTxt: {
		color: '#60D394',
		fontSize: 15,
		fontWeight: '900',
	},
	helpBtn: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: 'rgba(255,255,255,0.08)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	helpBtnText: {
		color: 'rgba(255,255,255,0.5)',
		fontSize: 16,
		fontWeight: '900',
	},
});
