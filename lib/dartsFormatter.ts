// Funkcja do formatowania liczby lotek z odpowiednią formą
// 1 lotka, 2-4 lotki, 5+ lotek (PL)
// 1 dart, 2+ darts (EN)

export function formatDarts(count: number, strings: { dart: string; dartsPlural: string; dartsGenitive: string }): string {
	if (count === 1) {
		return `${count} ${strings.dart}`;
	} else if (count >= 2 && count <= 4) {
		return `${count} ${strings.dartsPlural}`;
	} else {
		return `${count} ${strings.dartsGenitive}`;
	}
}

