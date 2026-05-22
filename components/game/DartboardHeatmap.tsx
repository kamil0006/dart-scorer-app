import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import type { Dart } from '../../lib/db';
import { useLanguage } from '../../lib/LanguageContext';
import DartboardBase from '../DartboardBase';
import DartboardPicker from '../DartboardPicker';

const { width } = Dimensions.get('window');
const SIZE = width * 0.8;
const R = SIZE / 2;
const SEGMENTS = 20;
const ANG = (2 * Math.PI) / SEGMENTS;
const OFFSET = -ANG / 2;
const DART_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

type Props = {
	hits: Dart[];
	onThrow: (dart: Dart) => void;
	readonly?: boolean;
};

export default function DartboardHeatmap({ hits, onThrow, readonly = false }: Props) {
	const { strings } = useLanguage();
	const dots = useMemo(() => buildHeatmapDots(hits), [hits]);

	return (
		<>
			<View style={styles.board}>
				<DartboardBase />
				<Svg style={StyleSheet.absoluteFill} width={SIZE} height={SIZE}>
					<G x={R} y={R}>
						{dots.map(dot => (
							<Circle key={dot.key} cx={dot.cx} cy={dot.cy} r={6} fill={dot.color} />
						))}
					</G>
				</Svg>
				{!readonly && <DartboardPicker onSelect={(bed, multiplier) => onThrow({ bed, m: multiplier })} />}
			</View>
			<View style={styles.legend}>
				<Text style={styles.legendTitle}>{strings.legendTitle}:</Text>
				<View style={styles.legendItems}>
					<LegendItem color='#00C2FF' label={strings.legend1Hit} />
					<LegendItem color='#FBC02D' label={strings.legend5Hits} />
					<LegendItem color='#F57C00' label={strings.legend10Hits} />
					<LegendItem color='#ff69b4' label={strings.legend15Hits} />
					<LegendItem color='#9400d3' label={strings.legend20PlusHits} />
				</View>
			</View>
		</>
	);
}

function buildHeatmapDots(hits: Dart[]) {
	const frequencies = hits.reduce<Record<string, number>>((acc, hit) => {
		const key = `${hit.bed}x${hit.m}`;
		acc[key] = (acc[key] || 0) + 1;
		return acc;
	}, {});

	return hits.flatMap((hit, index) => {
		if (hit.bed === 0) return [];
		const position = getDartPosition(hit);
		if (!position) return [];

		return [
			{
				key: `${hit.bed}-${hit.m}-${index}`,
				...position,
				color: getHeatmapColor(frequencies[`${hit.bed}x${hit.m}`] || 0),
			},
		];
	});
}

function getDartPosition(hit: Dart) {
	if (hit.bed === 50 || (hit.bed === 25 && hit.m === 2)) {
		return { cx: 0, cy: 0 };
	}

	if (hit.bed === 25) {
		const radius = (R * 0.1 + R * 0.05) / 2;
		const angle = -Math.PI / 2;
		return {
			cx: radius * Math.cos(angle),
			cy: radius * Math.sin(angle),
		};
	}

	const segmentIndex = DART_ORDER.indexOf(hit.bed);
	if (segmentIndex < 0) return null;

	const tripleInner = R * 0.45;
	const tripleOuter = R * 0.55;
	const doubleInner = R * 0.85;
	const doubleOuter = R * 0.95;
	const angle = segmentIndex * ANG - Math.PI / 2 + OFFSET + ANG / 2;
	let radius = (tripleOuter + doubleInner) / 2;

	if (hit.m === 3) radius = (tripleInner + tripleOuter) / 2;
	if (hit.m === 2) radius = (doubleInner + doubleOuter) / 2;

	return {
		cx: radius * Math.cos(angle),
		cy: radius * Math.sin(angle),
	};
}

function getHeatmapColor(count: number) {
	if (count >= 20) return '#9400d3';
	if (count >= 15) return '#ff69b4';
	if (count >= 10) return '#F57C00';
	if (count >= 5) return '#FBC02D';
	return '#00C2FF';
}

function LegendItem({ color, label }: { color: string; label: string }) {
	return (
		<View style={styles.legendItem}>
			<View style={[styles.legendSwatch, { backgroundColor: color }]} />
			<Text style={styles.legendLabel}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	board: {
		width: SIZE,
		height: SIZE,
		alignSelf: 'center',
	},
	legend: {
		marginTop: 16,
		padding: 8,
		backgroundColor: '#222',
		borderRadius: 8,
	},
	legendTitle: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 4,
		textAlign: 'center',
	},
	legendItems: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
	},
	legendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 12,
		paddingBottom: 8,
	},
	legendSwatch: {
		width: 16,
		height: 16,
		borderRadius: 4,
		marginRight: 4,
	},
	legendLabel: {
		color: '#fff',
		fontSize: 12,
	},
});
