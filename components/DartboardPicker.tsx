
import React from 'react';
import { Dimensions } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

type PickerProps = {
	onSelect: (bed: number, m: 1 | 2 | 3) => void;
};

const { width } = Dimensions.get('window');
const SIZE = width * 0.8;
const R = SIZE / 2;
const SEGMENTS = 20;
const ANG = (2 * Math.PI) / SEGMENTS;
const OFFSET = -ANG / 2;


const rInnerBull = R * 0.05;
const rOuterBull = R * 0.1;
const rTripleInner = R * 0.45;
const rTripleOuter = R * 0.55;
const rDoubleInner = R * 0.85;
const rDoubleOuter = R * 0.95;

function segmentPath(i: number, innerR: number, outerR: number): string {
	const start = i * ANG - Math.PI / 2 + OFFSET;
	const end = start + ANG;
	const x1 = innerR * Math.cos(start);
	const y1 = innerR * Math.sin(start);
	const x2 = outerR * Math.cos(start);
	const y2 = outerR * Math.sin(start);
	const x3 = outerR * Math.cos(end);
	const y3 = outerR * Math.sin(end);
	const x4 = innerR * Math.cos(end);
	const y4 = innerR * Math.sin(end);
	return `M ${x1},${y1} L ${x2},${y2} A ${outerR},${outerR} 0 0,1 ${x3},${y3} L ${x4},${y4} A ${innerR},${innerR} 0 0,0 ${x1},${y1} Z`;
}

export default function DartboardPicker({ onSelect }: PickerProps) {
	return (
		<Svg width={SIZE} height={SIZE}>
			<G x={R} y={R}>
				{/* inner single */}
				{Array.from({ length: SEGMENTS }).map((_, i) => (
					<Path
						key={`s-in-${i}`}
						d={segmentPath(i, rOuterBull, rTripleInner)}
						fill='transparent'
						onPress={() => onSelect(i + 1, 1)}
					/>
				))}
				{/* triple ring */}
				{Array.from({ length: SEGMENTS }).map((_, i) => (
					<Path
						key={`tri-${i}`}
						d={segmentPath(i, rTripleInner, rTripleOuter)}
						fill='transparent'
						onPress={() => onSelect(i + 1, 3)}
					/>
				))}
				{/* outer single */}
				{Array.from({ length: SEGMENTS }).map((_, i) => (
					<Path
						key={`s-out-${i}`}
						d={segmentPath(i, rTripleOuter, rDoubleInner)}
						fill='transparent'
						onPress={() => onSelect(i + 1, 1)}
					/>
				))}
				{/* double ring */}
				{Array.from({ length: SEGMENTS }).map((_, i) => (
					<Path
						key={`dbl-${i}`}
						d={segmentPath(i, rDoubleInner, rDoubleOuter)}
						fill='transparent'
						onPress={() => onSelect(i + 1, 2)}
					/>
				))}
				{/* outer bull (25) */}
				<Circle cx={0} cy={0} r={rOuterBull} fill='transparent' onPress={() => onSelect(25, 1)} />
				{/* inner bull (50) */}
				<Circle cx={0} cy={0} r={rInnerBull} fill='transparent' onPress={() => onSelect(25, 2)} />
			</G>
		</Svg>
	);
}
