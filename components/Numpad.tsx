import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
	onCommit: (pts: number) => void; // zatwierdź turę
	onUndo: () => void; // cofnij poprzednią turę
};

export default function Numpad({ onCommit, onUndo }: Props) {
	const [buffer, setBuffer] = useState<string>('');

	const push = (d: string) => setBuffer(b => (b === '0' ? d : b + d).slice(0, 3)); // max 3 cyfry
	const del = () => setBuffer(b => b.slice(0, -1));
	const clear = () => setBuffer('');
	const ok = () => {
		const n = Number(buffer);
		if (!Number.isNaN(n) && n <= 180) {
			onCommit(n);
			clear();
		}
	};

	return (
		<View style={styles.wrapper}>
			{/* Wyświetl wprowadzane cyfry */}
			<Text style={styles.display}>{buffer || '0'}</Text>

			{/* Klawiatura 3×4 */}
			<View style={styles.grid}>
				{['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '26','60','100'].map(d => (
					<Key key={d} label={d} onPress={() => push(d)} />
				))}
				<Key label='⌫' onPress={del} dark />
				<Key label='OK' onPress={ok} wide />
			</View>

			{/* Cofnij ostatnią turę */}
			<Pressable style={styles.undo} onPress={onUndo}>
				<Text style={styles.undotxt}>↩︎ UNDO</Text>
			</Pressable>
		</View>
	);
}

function Key({
	label,
	onPress,
	wide = false,
	dark = false,
}: {
	label: string;
	onPress: () => void;
	wide?: boolean;
	dark?: boolean;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [styles.key, wide && styles.wide, dark && styles.dark, pressed && styles.pressed]}>
			<Text style={styles.keytxt}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	wrapper: { alignItems: 'center', gap: 12, marginBottom: 32 },
	display: {
		fontSize: 48,
		color: '#FAFAFA',
		fontVariant: ['tabular-nums'],
		letterSpacing: 2,
	},
	grid: {
		width: '100%',
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
		justifyContent: 'center',
	},
	key: {
		width: 70,
		height: 70,
		borderRadius: 12,
		backgroundColor: '#1F1F1F',
		alignItems: 'center',
		justifyContent: 'center',
	},
	wide: { width: 152 },
	dark: { backgroundColor: '#444' },
	pressed: { opacity: 0.5 },
	keytxt: { color: '#FFF', fontSize: 24, fontWeight: '600' },
	undo: { marginTop: 8 },
	undotxt: { color: '#B0B0B0', fontSize: 16 },
});
