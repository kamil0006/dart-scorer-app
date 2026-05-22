import type { Dart } from './db';

export type TurnResolution =
	| { type: 'continue'; remaining: number }
	| { type: 'bust'; remaining: number }
	| { type: 'checkout'; remaining: 0 };

export function getDartScore(dart: Dart): number {
	if (dart.bed === 50) return 50;
	return dart.bed * dart.m;
}

export function getTurnScore(darts: Dart[]): number {
	return darts.reduce((sum, dart) => sum + getDartScore(dart), 0);
}

export function resolveTurn(currentScore: number, turnScore: number): TurnResolution {
	const remaining = currentScore - turnScore;

	if (remaining < 0 || remaining === 1) {
		return { type: 'bust', remaining: currentScore };
	}

	if (remaining === 0) {
		return { type: 'checkout', remaining: 0 };
	}

	return { type: 'continue', remaining };
}

export function getMinCheckoutDarts(checkout: string): number {
	if (!checkout.trim()) return 1;
	return checkout.trim().split(/\s+/).length;
}

export function getCheckoutDartOptions(checkout?: string): number[] {
	const minDarts = checkout ? getMinCheckoutDarts(checkout) : 1;
	return [1, 2, 3].filter(darts => darts >= minDarts);
}

export function isCheckoutLastDart(dart: Dart): boolean {
	return (dart.m === 2 && dart.bed !== 25) || dart.bed === 50;
}
