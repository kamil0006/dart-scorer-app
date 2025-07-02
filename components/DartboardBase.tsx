// components/DartboardBase.tsx
import React from 'react';
import { Dimensions } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');
// Use 80% of screen width for board
const SIZE = width * 0.8; // board is 60% of screen width
const R = SIZE / 2;
const SEGMENTS = 20;
const ANG = (2 * Math.PI) / SEGMENTS;
const OFFSET = -ANG / 2;

// Promienie pierścieni
const rInnerBull = R * 0.05;
const rOuterBull = R * 0.1;
const rTripleInner = R * 0.45;
const rTripleOuter = R * 0.55;
const rDoubleInner = R * 0.85;
const rDoubleOuter = R * 0.95;
// Pozycjonowanie numerów tuż poza obrysem tarczy
const rNumber = R * 0.95;

const NUMBERS: number[] = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

function segmentPath(i: number, innerR: number, outerR: number): string {
	const start = i * ANG - Math.PI / 2 + OFFSET;
	const end = start + ANG;
	const x1 = innerR * Math.cos(start),
		y1 = innerR * Math.sin(start);
	const x2 = outerR * Math.cos(start),
		y2 = outerR * Math.sin(start);
	const x3 = outerR * Math.cos(end),
		y3 = outerR * Math.sin(end);
	const x4 = innerR * Math.cos(end),
		y4 = innerR * Math.sin(end);
	return `M ${x1},${y1} L ${x2},${y2} A ${outerR},${outerR} 0 0,1 ${x3},${y3} L ${x4},${y4} A ${innerR},${innerR} 0 0,0 ${x1},${y1} Z`;
}

export default function DartboardBase(): React.ReactElement {
	return (
		<Svg width={SIZE} height={SIZE}>
			<G x={R} y={R}>
				{/* inner single */}
				{Array.from({ length: SEGMENTS }).map((_, i) => (
					<Path key={`s-in-${i}`} d={segmentPath(i, rOuterBull, rTripleInner)} fill={i % 2 === 0 ? '#000' : '#fff'} />
				))}
				{/* triple ring */}
				{Array.from({ length: SEGMENTS }).map((_, i) => (
					<Path key={`tri-${i}`} d={segmentPath(i, rTripleInner, rTripleOuter)} fill={i % 2 === 0 ? '#a00' : '#0a0'} />
				))}
				{/* outer single */}
				{Array.from({ length: SEGMENTS }).map((_, i) => (
					<Path
						key={`s-out-${i}`}
						d={segmentPath(i, rTripleOuter, rDoubleInner)}
						fill={i % 2 === 0 ? '#000' : '#fff'}
					/>
				))}
				{/* double ring */}
				{Array.from({ length: SEGMENTS }).map((_, i) => (
					<Path key={`dbl-${i}`} d={segmentPath(i, rDoubleInner, rDoubleOuter)} fill={i % 2 === 0 ? '#a00' : '#0a0'} />
				))}
				{/* bulls */}
				<Circle cx={0} cy={0} r={rOuterBull} fill='#0a0' />
				<Circle cx={0} cy={0} r={rInnerBull} fill='#a00' />
				{/* numbering */}
				{NUMBERS.map((num, i) => {
					const angle = i * ANG - Math.PI / 2 + OFFSET + ANG / 2;
					const tx = rNumber * Math.cos(angle);
					const ty = rNumber * Math.sin(angle) + 4;
					return (
						<SvgText
							key={`num-${i}`}
							x={tx}
							y={ty}
							fontSize={R * 0.1}
							fontWeight='bold'
							fill='#fff'
							textAnchor='middle'>
							{num}
						</SvgText>
					);
				})}
			</G>
		</Svg>
	);
}
