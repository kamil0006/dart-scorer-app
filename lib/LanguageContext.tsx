import React, { createContext, useContext, useEffect, useState } from 'react';
import { getLocalizedStrings, LocalizedStrings } from './localization';
import { getLanguage, Language, setLanguage } from './settings';

interface LanguageContextType {
	language: Language;
	strings: LocalizedStrings;
	changeLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
	const [language, setLanguageState] = useState<Language>('pl');
	const [strings, setStrings] = useState<LocalizedStrings>(getLocalizedStrings('pl'));

	useEffect(() => {
		// Load saved language on app start
		loadSavedLanguage();
	}, []);

	const loadSavedLanguage = async () => {
		try {
			const savedLanguage = await getLanguage();
			setLanguageState(savedLanguage);
			setStrings(getLocalizedStrings(savedLanguage));
		} catch (error) {
			console.warn('Failed to load saved language:', error);
			// Default to Polish
			setLanguageState('pl');
			setStrings(getLocalizedStrings('pl'));
		}
	};

	const changeLanguage = async (lang: Language) => {
		try {
			await setLanguage(lang);
			setLanguageState(lang);
			setStrings(getLocalizedStrings(lang));
		} catch (error) {
			console.warn('Failed to save language:', error);
		}
	};

	return <LanguageContext.Provider value={{ language, strings, changeLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error('useLanguage must be used within a LanguageProvider');
	}
	return context;
}
