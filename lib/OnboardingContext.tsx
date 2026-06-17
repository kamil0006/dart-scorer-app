import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type OnboardingStep = {
	tab: string;
	titleKey: string;
	descKey: string;
};

const STEPS: OnboardingStep[] = [
	{ tab: 'Play',     titleKey: 'onbStep0Title', descKey: 'onbStep0Desc' },
	{ tab: 'Play',     titleKey: 'onbStep1Title', descKey: 'onbStep1Desc' },
	{ tab: 'Play',     titleKey: 'onbStep2Title', descKey: 'onbStep2Desc' },
	{ tab: 'Play',     titleKey: 'onbStep3Title', descKey: 'onbStep3Desc' },
	{ tab: 'Play',     titleKey: 'onbStep4Title', descKey: 'onbStep4Desc' },
	{ tab: 'Stats',    titleKey: 'onbStep5Title', descKey: 'onbStep5Desc' },
	{ tab: 'Training', titleKey: 'onbStep6Title', descKey: 'onbStep6Desc' },
	{ tab: 'Settings', titleKey: 'onbStep7Title', descKey: 'onbStep7Desc' },
];

const STORAGE_KEY = 'onboarding_seen';

type OnboardingContextValue = {
	isActive: boolean;
	currentStep: number;
	stepCount: number;
	steps: OnboardingStep[];
	startTour: () => void;
	endTour: () => void;
	nextStep: () => void;
	prevStep: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
	const ctx = useContext(OnboardingContext);
	if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
	return ctx;
}

type Props = {
	children: React.ReactNode;
	navigationRef: React.MutableRefObject<any>;
};

export function OnboardingProvider({ children, navigationRef }: Props) {
	const [isActive, setIsActive] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const prevTabRef = useRef<string>('Play');

	useEffect(() => {
		AsyncStorage.getItem(STORAGE_KEY).then(val => {
			if (val === null) {
				setTimeout(() => startTour(), 800);
			}
		});
		// Run once on mount; startTour is stable and defined below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const startTour = useCallback(() => {
		setCurrentStep(0);
		setIsActive(true);
		prevTabRef.current = 'Play';
	}, []);

	const endTour = useCallback(() => {
		setIsActive(false);
		AsyncStorage.setItem(STORAGE_KEY, '1');
		// Always return to Play tab after tour ends
		setTimeout(() => {
			(navigationRef.current as any)?.navigate('Play');
		}, 150);
	}, [navigationRef]);

	const nextStep = useCallback(() => {
		if (currentStep + 1 >= STEPS.length) {
			endTour();
			return;
		}
		setCurrentStep(prev => prev + 1);
	}, [currentStep, endTour]);

	const prevStep = useCallback(() => {
		setCurrentStep(prev => Math.max(0, prev - 1));
	}, []);

	useEffect(() => {
		if (!isActive) return;
		const step = STEPS[currentStep];
		if (!step) return;

		const needsNav = step.tab !== prevTabRef.current;
		prevTabRef.current = step.tab;

		if (needsNav) {
			(navigationRef.current as any)?.navigate(step.tab);
		}
	}, [isActive, currentStep, navigationRef]);

	return (
		<OnboardingContext.Provider
			value={{ isActive, currentStep, stepCount: STEPS.length, steps: STEPS, startTour, endTour, nextStep, prevStep }}>
			{children}
		</OnboardingContext.Provider>
	);
}
