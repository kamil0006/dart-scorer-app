import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { calculateRemainingScore, getCheckout, validateCheckout } from '../lib/checkout.ts';
import { calculateAvg3, calculateCheckoutStats, calculateCheckoutValue, parseTurns } from '../lib/dartsStats.ts';
import {
	getCheckoutDartOptions,
	getDartScore,
	getMinCheckoutDarts,
	getTurnScore,
	isCheckoutLastDart,
	resolveTurn,
} from '../lib/gameRules.ts';

describe('checkout chart', () => {
	it('returns only possible checkout suggestions', () => {
		assert.deepEqual(getCheckout(170), ['T20', 'T20', 'Bull']);
		assert.deepEqual(getCheckout(123), ['T19', 'T16', 'D9']);
		assert.deepEqual(getCheckout(50), ['Bull']);
		assert.deepEqual(getCheckout(2), ['D1']);
		assert.equal(getCheckout(171), undefined);
		assert.equal(getCheckout(1), undefined);
	});

	it('keeps every checkout suggestion equal to its score', () => {
		for (let score = 2; score <= 170; score++) {
			const checkout = getCheckout(score);
			if (!checkout) continue;

			const value = calculateCheckoutValue(checkout.join(' '));
			const lastTarget = checkout.at(-1);
			assert.equal(value, score, `${score}: ${checkout.join(' ')} = ${value}`);
			assert.equal(lastTarget === 'Bull' || lastTarget?.startsWith('D'), true, `${score}: ${checkout.join(' ')}`);
		}
	});

	it('requires a double or bull as the last checkout dart', () => {
		assert.equal(validateCheckout([{ bed: 20, m: 2 }], ['D20']), true);
		assert.equal(validateCheckout([{ bed: 20, m: 1 }], ['D10']), false);
		assert.equal(validateCheckout([{ bed: 50, m: 1 }], ['Bull']), true);
		assert.equal(validateCheckout([{ bed: 25, m: 2 }], ['Bull']), false);
	});

	it('subtracts checkout targets from the remaining score', () => {
		assert.equal(calculateRemainingScore(120, '20'), 100);
		assert.equal(calculateRemainingScore(120, 'T20'), 60);
		assert.equal(calculateRemainingScore(40, 'D20'), 0);
		assert.equal(calculateRemainingScore(50, 'Bull'), 0);
	});
});

describe('game rules', () => {
	it('scores darts and full turns consistently', () => {
		assert.equal(getDartScore({ bed: 20, m: 3 }), 60);
		assert.equal(getDartScore({ bed: 50, m: 1 }), 50);
		assert.equal(
			getTurnScore([
				{ bed: 20, m: 3 },
				{ bed: 20, m: 3 },
				{ bed: 20, m: 3 },
			]),
			180
		);
	});

	it('resolves normal turns, busts and checkouts', () => {
		assert.deepEqual(resolveTurn(501, 100), { type: 'continue', remaining: 401 });
		assert.deepEqual(resolveTurn(40, 45), { type: 'bust', remaining: 40 });
		assert.deepEqual(resolveTurn(40, 39), { type: 'bust', remaining: 40 });
		assert.deepEqual(resolveTurn(40, 40), { type: 'checkout', remaining: 0 });
	});

	it('calculates valid checkout dart options', () => {
		assert.equal(getMinCheckoutDarts('T20 T20 Bull'), 3);
		assert.deepEqual(getCheckoutDartOptions('D20'), [1, 2, 3]);
		assert.deepEqual(getCheckoutDartOptions('20 D20'), [2, 3]);
		assert.deepEqual(getCheckoutDartOptions('T20 T20 Bull'), [3]);
	});

	it('recognizes checkout-ending darts', () => {
		assert.equal(isCheckoutLastDart({ bed: 20, m: 2 }), true);
		assert.equal(isCheckoutLastDart({ bed: 50, m: 1 }), true);
		assert.equal(isCheckoutLastDart({ bed: 25, m: 2 }), false);
		assert.equal(isCheckoutLastDart({ bed: 20, m: 3 }), false);
	});
});

describe('stats helpers', () => {
	it('parses stored turns defensively', () => {
		assert.deepEqual(parseTurns('[60, 45, 180]'), [60, 45, 180]);
		assert.deepEqual(parseTurns([60, '45', 'bad']), [60, 45]);
		assert.deepEqual(parseTurns('not json'), []);
		assert.deepEqual(parseTurns(null), []);
	});

	it('uses PDC-style three-dart average', () => {
		assert.equal(calculateAvg3(501, 30).toFixed(1), '50.1');
		assert.equal(calculateAvg3(0, 0), 0);
	});

	it('calculates checkout values from target notation', () => {
		assert.equal(calculateCheckoutValue('T20 T20 Bull'), 170);
		assert.equal(calculateCheckoutValue('20 D20'), 60);
		assert.equal(calculateCheckoutValue(null), 0);
	});

	it('summarizes completed checkouts without forfeits', () => {
		const stats = calculateCheckoutStats([
			{ checkout: 'D20', turns: '[60,40]', darts: 4, forfeited: 0 },
			{ checkout: '20 D20', turns: '[100,60]', darts: 5, forfeited: 0 },
			{ checkout: 'T20 T20 Bull', turns: '[180,170]', darts: 6, forfeited: 0 },
			{ checkout: 'D20', turns: '[40]', darts: 3, forfeited: 1 },
		]);

		assert.equal(stats.total, 3);
		assert.equal(stats.averageValue, 90);
		assert.deepEqual(stats.dartsUsed, { one: 1, two: 1, three: 1 });
		assert.deepEqual(stats.ranges, { low: 1, mid: 1, high: 1 });
		assert.equal(stats.mostCommon[0].checkout, 'T20 T20 Bull');
	});
});
