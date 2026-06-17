import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '../lib/LanguageContext';
import { useOnboarding } from '../lib/OnboardingContext';
import type { LocalizedStrings } from '../lib/localization';

const CARD_MARGIN = 16;
const CARD_BOTTOM = 70; // above tab bar (~60px)

export default function OnboardingOverlay() {
	const { isActive, currentStep, stepCount, steps, nextStep, prevStep, endTour } = useOnboarding();
	const { strings } = useLanguage();
const step = steps[currentStep];

	if (!isActive || !step) return null;

	const isFirst = currentStep === 0;
	const isLast = currentStep === stepCount - 1;

	const titleKey = step.titleKey as keyof LocalizedStrings;
	const descKey = step.descKey as keyof LocalizedStrings;
	const title = strings[titleKey] as string ?? '';
	const desc = strings[descKey] as string ?? '';

	return (
		<Modal visible={isActive} transparent animationType='fade' statusBarTranslucent onRequestClose={endTour}>
			{/* Subtle background tint to block accidental touches */}
			<View style={[StyleSheet.absoluteFill, styles.backdrop]} />

			{/* Tooltip card — always anchored at bottom above tab bar */}
			<View style={[styles.card, { bottom: CARD_BOTTOM, left: CARD_MARGIN, right: CARD_MARGIN }]}>
				<Text style={styles.stepCounter}>{currentStep + 1} / {stepCount}</Text>
				<Text style={styles.cardTitle}>{title}</Text>
				<Text style={styles.cardDesc}>{desc}</Text>
				<View style={styles.cardButtons}>
					<Pressable onPress={endTour} style={styles.skipBtn}>
						<Text style={styles.skipBtnText}>{strings.onbSkipTour}</Text>
					</Pressable>
					<View style={styles.navButtons}>
						{!isFirst && (
							<Pressable onPress={prevStep} style={[styles.navBtn, styles.navBtnSecondary]}>
								<Text style={styles.navBtnSecondaryText}>{strings.onbBack}</Text>
							</Pressable>
						)}
						<Pressable onPress={isLast ? endTour : nextStep} style={[styles.navBtn, styles.navBtnPrimary]}>
							<Text style={styles.navBtnPrimaryText}>{isLast ? strings.onbFinish : strings.onbNext}</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		backgroundColor: 'rgba(0,0,0,0.25)',
	},
	card: {
		position: 'absolute',
		backgroundColor: '#1E2328',
		borderRadius: 16,
		padding: 20,
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.08)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.5,
		shadowRadius: 12,
		elevation: 12,
	},
	stepCounter: {
		color: 'rgba(255,255,255,0.35)',
		fontSize: 11,
		fontWeight: '700',
		textAlign: 'right',
		marginBottom: 6,
	},
	cardTitle: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '900',
		marginBottom: 8,
	},
	cardDesc: {
		color: 'rgba(255,255,255,0.65)',
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 16,
	},
	cardButtons: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	skipBtn: {
		paddingVertical: 6,
		paddingRight: 8,
	},
	skipBtnText: {
		color: 'rgba(255,255,255,0.35)',
		fontSize: 13,
		fontWeight: '600',
	},
	navButtons: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 8,
	},
	navBtn: {
		paddingVertical: 9,
		paddingHorizontal: 18,
		borderRadius: 8,
	},
	navBtnPrimary: {
		backgroundColor: '#8AB4F8',
	},
	navBtnPrimaryText: {
		color: '#0B0B0B',
		fontSize: 14,
		fontWeight: '800',
	},
	navBtnSecondary: {
		backgroundColor: 'rgba(255,255,255,0.08)',
	},
	navBtnSecondaryText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '700',
	},
});
