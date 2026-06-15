export type DisplayPlayer = {
	id: string;
	name: string;
	remaining: number;
	setsWon: number;
	legsWon: number;
	matchLegsWon?: number;
	checkout: string[];
	lastTurn: number | null;
	average3d: number;
	legAverage3d?: number;
	setAverage3d?: number;
	matchAverage3d?: number;
	legAverages3d?: number[];
	setAverages3d?: number[];
	legAverageHistory?: DisplayAverageHistoryItem[];
	setAverageHistory?: DisplayAverageHistoryItem[];
	turns: number[];
};

export type DisplayAverageHistoryItem = {
	label: string;
	value: number;
	darts?: number;
};

export type DisplayMatchState = {
	startScore: number;
	activePlayerIndex: number;
	setsTarget: number;
	legsTarget: number;
	currentSet: number;
	currentLeg: number;
	turnNumber: number;
	status: 'waiting' | 'playing' | 'transition' | 'bust' | 'legWon' | 'setWon' | 'matchWon';
	message: string;
	transition: {
		from: string | null;
		to: string;
		text: string;
	};
	players: DisplayPlayer[];
};

export async function sendDisplayState(serverUrl: string, state: DisplayMatchState) {
	if (!serverUrl.trim()) return;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 3000);
	try {
		const response = await fetch(`${normalizeServerUrl(serverUrl)}/api/state`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(state),
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new Error(`Display server responded with ${response.status}`);
		}
	} finally {
		clearTimeout(timeout);
	}
}

export async function sendDisplayStateToFirstAvailable(serverUrls: string[], state: DisplayMatchState) {
	const errors: string[] = [];

	for (const url of serverUrls) {
		try {
			await sendDisplayState(url, state);
			return normalizeServerUrl(url);
		} catch (error) {
			errors.push(`${normalizeServerUrl(url)}: ${getErrorMessage(error)}`);
		}
	}

	throw new Error(errors.join('\n'));
}

export async function resetDisplay(serverUrl: string) {
	if (!serverUrl.trim()) return;

	await fetch(`${normalizeServerUrl(serverUrl)}/api/reset`, {
		method: 'POST',
	});
}

export async function resetDisplayOnFirstAvailable(serverUrls: string[]) {
	const errors: string[] = [];

	for (const url of serverUrls) {
		try {
			await resetDisplay(url);
			return normalizeServerUrl(url);
		} catch (error) {
			errors.push(`${normalizeServerUrl(url)}: ${getErrorMessage(error)}`);
		}
	}

	throw new Error(errors.join('\n'));
}

export async function checkDisplayConnection(serverUrl: string) {
	const normalized = normalizeServerUrl(serverUrl);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 3000);

	try {
		const response = await fetch(`${normalized}/api/state`, {
			method: 'GET',
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new Error(`Display server responded with ${response.status}`);
		}

		return {
			url: normalized,
			state: await response.json(),
		};
	} finally {
		clearTimeout(timeout);
	}
}

function normalizeServerUrl(value: string) {
	const trimmed = value.trim();

	try {
		const url = new URL(trimmed);
		if (url.pathname === '/display' || url.pathname.startsWith('/api/')) {
			url.pathname = '';
			url.search = '';
			url.hash = '';
		}
		return url.toString().replace(/\/+$/, '');
	} catch {
		return trimmed.replace(/\/+$/, '').replace(/\/display$/, '');
	}
}

function getErrorMessage(error: unknown) {
	if (error instanceof Error) return error.message;
	return String(error);
}
