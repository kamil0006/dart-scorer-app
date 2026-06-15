import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Circle, Line, Polyline, Svg, Text as SvgText } from 'react-native-svg';

import { RecentTrendGame } from '../../database/statsRepository';

type Props = {
	games: RecentTrendGame[];
};

const PAD = { top: 16, right: 12, bottom: 28, left: 38 };
const CHART_H = 130;
// Section padding (14) * 2 + modal content padding (16) * 2 = 60
const HORIZONTAL_INSET = 60;

export default function AverageTrendChart({ games }: Props) {
	const { width } = useWindowDimensions();
	const chartW = width - HORIZONTAL_INSET;
	const plotW = chartW - PAD.left - PAD.right;
	const plotH = CHART_H - PAD.top - PAD.bottom;

	if (games.length < 2) return null;

	const avgs = games.map(g => g.avg);
	const rawMax = Math.max(...avgs);
	const maxVal = Math.ceil(rawMax / 10) * 10 || 60;
	const midVal = maxVal / 2;

	const xOf = (i: number) =>
		PAD.left + (games.length === 1 ? plotW / 2 : (i / (games.length - 1)) * plotW);
	const yOf = (v: number) => PAD.top + plotH - (v / maxVal) * plotH;

	const polyPoints = games.map((g, i) => `${xOf(i)},${yOf(g.avg)}`).join(' ');
	const dotR = games.length > 20 ? 2.5 : 3.5;
	const gridValues = [0, midVal, maxVal];

	return (
		<View>
			<Svg width={chartW} height={CHART_H}>
				{/* Horizontal grid lines */}
				{gridValues.map(v => (
					<Line
						key={v}
						x1={PAD.left}
						y1={yOf(v)}
						x2={chartW - PAD.right}
						y2={yOf(v)}
						stroke='#2A2A2A'
						strokeWidth={1}
					/>
				))}

				{/* Y-axis labels */}
				{gridValues.map(v => (
					<SvgText
						key={`lbl-${v}`}
						x={PAD.left - 6}
						y={yOf(v) + 4}
						fontSize={9}
						fill='#555'
						textAnchor='end'
					>
						{v % 1 === 0 ? v : v.toFixed(1)}
					</SvgText>
				))}

				{/* Trend line */}
				<Polyline
					points={polyPoints}
					fill='none'
					stroke='#8AB4F8'
					strokeWidth={2}
					strokeLinejoin='round'
					strokeLinecap='round'
				/>

				{/* Data points */}
				{games.map((g, i) => (
					<Circle
						key={i}
						cx={xOf(i)}
						cy={yOf(g.avg)}
						r={dotR}
						fill={g.completed ? '#8AB4F8' : '#121212'}
						stroke='#8AB4F8'
						strokeWidth={1.5}
					/>
				))}
			</Svg>
		</View>
	);
}
