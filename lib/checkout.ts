// Simple checkout system that returns targets in order

// Valid checkout paths for different scores
const chart = new Map<number, string[]>([
	// 170–161 (3 darts with Bull)
	[170, ['T20', 'T20', 'Bull']],
	[167, ['T20', 'T19', 'Bull']],
	[164, ['T20', 'T18', 'Bull']],
	[161, ['T20', 'T17', 'Bull']],
	// 160–151
	[160, ['T20', 'T20', 'D20']],
	[158, ['T20', 'T20', 'D19']],
	[157, ['T20', 'T19', 'D20']],
	[156, ['T20', 'T20', 'D18']],
	[155, ['T20', 'T19', 'D19']],
	[154, ['T20', 'T18', 'D20']],
	[153, ['T20', 'T19', 'D18']],
	[152, ['T20', 'T20', 'D16']],
	[151, ['T20', 'T17', 'D20']],
	// 150–141
	[150, ['T20', 'T18', 'D18']],
	[149, ['T20', 'T19', 'D16']],
	[148, ['T20', 'T16', 'D20']],
	[147, ['T20', 'T17', 'D18']],
	[146, ['T20', 'T18', 'D16']],
	[145, ['T20', 'T15', 'D20']],
	[144, ['T20', 'T20', 'D12']],
	[143, ['T20', 'T17', 'D16']],
	[142, ['T20', 'T14', 'D20']],
	[141, ['T20', 'T15', 'D18']],
	// 140–131
	[140, ['T20', 'T20', 'D10']],
	[139, ['T20', 'T13', 'D20']],
	[138, ['T20', 'T18', 'D12']],
	[137, ['T20', 'T19', 'D10']],
	[136, ['T20', 'T20', 'D8']],
	[135, ['T20', 'T17', 'D12']],
	[134, ['T20', 'T14', 'D16']],
	[133, ['T20', 'T19', 'D8']],
	[132, ['T20', 'T16', 'D12']],
	[131, ['T20', 'T13', 'D16']],
	// 130–121
	[130, ['T20', 'T18', 'D8']],
	[129, ['T19', 'T16', 'D12']],
	[128, ['T18', 'T14', 'D16']],
	[127, ['T20', 'T17', 'D8']],
	[126, ['T19', 'T19', 'D6']],
	[125, ['25', 'T20', 'D20']],
	[124, ['T20', 'T16', 'D8']],
	[123, ['T19', 'T16', 'D12']],
	[122, ['T18', 'T18', 'D11']],
	[121, ['T20', 'T11', 'D14']],
	// 120–111
	[120, ['T20', '20', 'D20']],
	[119, ['T19', 'T12', 'D11']],
	[118, ['T20', '18', 'D20']],
	[117, ['T20', '17', 'D20']],
	[116, ['T20', '16', 'D20']],
	[115, ['T20', '15', 'D20']],
	[114, ['T20', '14', 'D20']],
	[113, ['T20', '13', 'D20']],
	[112, ['T20', '12', 'D20']],
	[111, ['T20', '11', 'D20']],
	// 110–101
	[110, ['T20', '10', 'D20']],
	[109, ['T20', '9', 'D20']],
	[108, ['T20', '8', 'D20']],
	[107, ['T19', '10', 'D20']],
	[106, ['T20', '6', 'D20']],
	[105, ['T19', '8', 'D20']],
	[104, ['T18', '18', 'D16']],
	[103, ['T20', '3', 'D20']],
	[102, ['T20', '10', 'D16']],
	[101, ['T17', '18', 'D16']],
	// 100 – 91 (2 darts + double)
	[100, ['T20', 'D20']],
	[99, ['T19', '10', 'D16']],
	[98, ['T20', 'D19']],
	[97, ['T19', 'D20']],
	[96, ['T20', 'D18']],
	[95, ['T19', 'D19']],
	[94, ['T18', 'D20']],
	[93, ['T19', 'D18']],
	[92, ['T20', 'D16']],
	[91, ['T17', 'D20']],
	// 90–81
	[90, ['T18', 'D18']],
	[89, ['T19', 'D16']],
	[88, ['T16', 'D20']],
	[87, ['T17', 'D18']],
	[86, ['T18', 'D16']],
	[85, ['T15', 'D20']],
	[84, ['T20', 'D12']],
	[83, ['T17', 'D16']],
	[82, ['T14', 'D20']],
	[81, ['T19', 'D12']],
	// 80–71
	[80, ['T20', 'D10']],
	[79, ['T13', 'D20']],
	[78, ['T18', 'D12']],
	[77, ['T19', 'D10']],
	[76, ['T20', 'D8']],
	[75, ['T17', 'D12']],
	[74, ['T14', 'D16']],
	[73, ['T19', 'D8']],
	[72, ['T16', 'D12']],
	[71, ['T13', 'D16']],
	// 70–61
	[70, ['T18', 'D8']],
	[69, ['T19', 'D6']],
	[68, ['T20', 'D4']],
	[67, ['T17', 'D8']],
	[66, ['T10', 'D18']],
	[65, ['25', 'D20']],
	[64, ['T16', 'D8']],
	[63, ['T13', 'D12']],
	[62, ['T10', 'D16']],
	[61, ['25', 'D18']],
	// 60–51
	[60, ['20', 'D20']],
	[59, ['19', 'D20']],
	[58, ['18', 'D20']],
	[57, ['17', 'D20']],
	[56, ['16', 'D20']],
	[55, ['15', 'D20']],
	[54, ['14', 'D20']],
	[53, ['13', 'D20']],
	[52, ['12', 'D20']],
	[51, ['11', 'D20']],
	// 50 and below
	[50, ['Bull']],
	[49, ['17', 'D16']],
	[48, ['16', 'D16']],
	[47, ['15', 'D16']],
	[46, ['14', 'D16']],
	[45, ['13', 'D16']],
	[44, ['12', 'D16']],
	[43, ['11', 'D16']],
	[42, ['10', 'D16']],
	[41, ['9', 'D16']],
	[40, ['D20']],
	[39, ['7', 'D16']],
	[38, ['D19']],
	[37, ['5', 'D16']],
	[36, ['D18']],
	[35, ['3', 'D16']],
	[34, ['D17']],
	[33, ['3', 'D15']], // Alternatywnie: ['1', 'D16']
	[32, ['D16']],
	[31, ['15', 'D8']], // Alternatywnie: ['7', 'D12']
	[30, ['D15']],
	[29, ['13', 'D8']],
	[28, ['D14']],
	[27, ['11', 'D8']],
	[26, ['D13']],
	[25, ['9', 'D8']],
	[24, ['D12']],
	[23, ['7', 'D8']],
	[22, ['D11']],
	[21, ['5', 'D8']],
	[20, ['D10']],
	[19, ['3', 'D8']],
	[18, ['D9']],
	[17, ['1', 'D8']], // Alternatywnie: ['9', 'D4']
	[16, ['D8']],
	[15, ['7', 'D4']],
	[14, ['D7']],
	[13, ['5', 'D4']],
	[12, ['D6']],
	[11, ['3', 'D4']],
	[10, ['D5']],
	[9, ['1', 'D4']], // Alternatywnie: ['5', 'D2']
	[8, ['D4']],
	[7, ['3', 'D2']],
	[6, ['D3']],
	[5, ['1', 'D2']],
	[4, ['D2']],
	[3, ['1', 'D1']],
	[2, ['D1']],
]);

// Fallback for simple doubles
function simpleDouble(score: number): string[] | undefined {
	if (score === 50) return ['Bull'];
	if (score % 2 === 0 && score <= 40 && score >= 2) {
		const doubleValue = score / 2;
		if (doubleValue >= 1 && doubleValue <= 20) {
			return ['D' + doubleValue];
		}
	}
	return undefined;
}

// Get checkout path for a given score
export function getCheckout(score: number): string[] | undefined {
	if (score > 170 || score < 2) return undefined;
	return chart.get(score) ?? simpleDouble(score);
}

// Calculate remaining score after hitting a target
export function calculateRemainingScore(currentScore: number, target: string): number {
	if (target === 'Bull') return currentScore - 50;
	if (target === '25') return currentScore - 25;

	const type = target[0];
	const value = parseInt(target.slice(1));

	switch (type) {
		case 'T':
			return currentScore - value * 3;
		case 'D':
			return currentScore - value * 2;
		default:
			return currentScore - value;
	}
}

// Get checkout for remaining score (for partial completions)
export function getCheckoutForRemaining(remainingScore: number): string[] | undefined {
	return getCheckout(remainingScore);
}

// Validate if actual hits form a valid checkout
// Returns true if:
// 1. The last hit is a double (required for checkout)
// 2. The sum of points matches the checkout value
// Note: We don't check exact order, as long as the sum is correct and ends with double
export function validateCheckout(hits: { bed: number; m: 1 | 2 | 3 }[], checkout: string[]): boolean {
	if (!checkout || checkout.length === 0) return false;
	if (hits.length === 0) return false;

	// Check if the last hit is a double (required for checkout)
	const lastHit = hits[hits.length - 1];
	if (lastHit.m !== 2) return false; // Last hit must be a double

	// Calculate total points from hits
	const totalPoints = hits.reduce((sum, hit) => sum + hit.bed * hit.m, 0);

	// Calculate expected points from checkout
	const expectedPoints = checkout.reduce((sum, target) => {
		if (target === 'Bull') return sum + 50;
		if (target === '25') return sum + 25;
		if (target.startsWith('T')) return sum + parseInt(target.slice(1)) * 3;
		if (target.startsWith('D')) return sum + parseInt(target.slice(1)) * 2;
		return sum + parseInt(target) || 0;
	}, 0);

	// Points must match
	return totalPoints === expectedPoints;
}
