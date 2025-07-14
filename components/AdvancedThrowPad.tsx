
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Dart } from '../lib/db';

type Props = {
	onThrow: (d: { bed: number; m: 1 | 2 | 3 }) => void;
	onUndo: () => void;
};

export default function AdvancedThrowPad({ onThrow }: Props) {
	const [mult, setMult] = useState<1 | 2 | 3>(1);
	const [throwsArr, setThrowsArr] = useState<Dart[]>([]);

	const add = (d: Dart) => {
		if (throwsArr.length >= 3) return;
		setThrowsArr(prev => [...prev, d]);
		onThrow(d);
	};

	useEffect(() => {
		if (throwsArr.length === 3) {
			setThrowsArr([]);
		}
	}, [throwsArr]);

	
	const multipliers: Array<1 | 2 | 3> = [1, 2, 3];

	return (
		<View style={styles.wrapper}>
			{/* multiplier selectors */}
			<View style={styles.row}>
				{multipliers.map(m => (
					<Pressable key={m} onPress={() => setMult(m)} style={[styles.mult, mult === m && styles.multActive]}>
						<Text style={styles.multTxt}>{m}×</Text>
					</Pressable>
				))}
				<Pressable onPress={() => add({ bed: 25, m: 1 })} style={styles.bull}>
					<Text style={styles.bullTxt}>25</Text>
				</Pressable>
				<Pressable onPress={() => add({ bed: 50, m: 1 })} style={styles.bull}>
					<Text style={styles.bullTxt}>50</Text>
				</Pressable>
				<Pressable style={styles.missBtn} onPress={() => onThrow({ bed: 0, m: 1 })}>
					<Text style={styles.missTxt}>0</Text>
				</Pressable>
			</View>

			{/* target grid */}
			<View style={styles.grid}>
				{Array.from({ length: 20 }, (_, i) => (i + 1) as number).map(b => (
					<Pressable key={b} onPress={() => add({ bed: b, m: mult })} style={styles.key}>
						<Text style={styles.keyTxt}>{b}</Text>
					</Pressable>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: { marginBottom: 16 },
	slotRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 8,
		gap: 8,
	},
	slot: {
		width: 60,
		height: 40,
		backgroundColor: '#333',
		borderRadius: 6,
		justifyContent: 'center',
		alignItems: 'center',
	},
	slotTxt: { color: '#fff', fontSize: 16 },
	actionBtn: { padding: 6, backgroundColor: '#B00020', borderRadius: 6 },
	actionTxt: { color: '#fff', fontSize: 18 },
	row: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: 8,
		flexWrap: 'wrap',
		gap: 8,
	},
	mult: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#333', borderRadius: 6 },
	multActive: { backgroundColor: '#8AB4F8' },
	multTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
	bull: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#650', borderRadius: 6 },
	bullTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
	grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
	key: {
		width: 40,
		height: 40,
		backgroundColor: '#444',
		borderRadius: 6,
		alignItems: 'center',
		justifyContent: 'center',
	},
	keyTxt: { color: '#fff', fontSize: 14 },
	missBtn: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		backgroundColor: '#b22222',
		borderRadius: 6,
	},
	missTxt: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 600,
	},
});
