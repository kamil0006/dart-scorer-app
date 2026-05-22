import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Dart } from '../lib/db';

type Props = {
	onThrow: (d: { bed: number; m: 1 | 2 | 3 }) => void;
	onUndo: () => void;
};

const MULTIPLIERS: { label: string; value: 1 | 2 | 3 }[] = [
	{ label: 'S', value: 1 },
	{ label: 'D', value: 2 },
	{ label: 'T', value: 3 },
];

export default function AdvancedThrowPad({ onThrow }: Props) {
	const [mult, setMult] = useState<1 | 2 | 3>(1);

	const add = (dart: Dart) => onThrow(dart);

	return (
		<View style={styles.wrapper}>
			<View style={styles.toolbar}>
				<View style={styles.segmented}>
					{MULTIPLIERS.map(item => (
						<Pressable
							key={item.value}
							onPress={() => setMult(item.value)}
							style={[styles.mult, mult === item.value && styles.multActive]}>
							<Text style={[styles.multTxt, mult === item.value && styles.multTxtActive]}>{item.label}</Text>
						</Pressable>
					))}
				</View>
				<View style={styles.specials}>
					<SpecialButton label='25' icon='gps-fixed' onPress={() => add({ bed: 25, m: 1 })} />
					<SpecialButton label='50' icon='adjust' onPress={() => add({ bed: 50, m: 1 })} />
					<SpecialButton label='0' icon='close' danger onPress={() => onThrow({ bed: 0, m: 1 })} />
				</View>
			</View>

			<View style={styles.grid}>
				{Array.from({ length: 20 }, (_, index) => index + 1).map(bed => (
					<Pressable key={bed} onPress={() => add({ bed, m: mult })} style={styles.key}>
						<Text style={styles.keyTxt}>{bed}</Text>
					</Pressable>
				))}
			</View>
		</View>
	);
}

function SpecialButton({
	label,
	icon,
	danger,
	onPress,
}: {
	label: string;
	icon: keyof typeof MaterialIcons.glyphMap;
	danger?: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable style={[styles.specialButton, danger && styles.specialButtonDanger]} onPress={onPress}>
			<MaterialIcons name={icon} size={16} color='#fff' />
			<Text style={styles.specialText}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 12,
		marginBottom: 4,
		gap: 12,
	},
	toolbar: {
		gap: 10,
	},
	segmented: {
		flexDirection: 'row',
		backgroundColor: '#242424',
		borderRadius: 8,
		padding: 4,
		gap: 4,
	},
	mult: {
		flex: 1,
		minHeight: 40,
		borderRadius: 6,
		alignItems: 'center',
		justifyContent: 'center',
	},
	multActive: {
		backgroundColor: '#8AB4F8',
	},
	multTxt: {
		color: '#C8D0D9',
		fontSize: 16,
		fontWeight: '900',
	},
	multTxtActive: {
		color: '#101113',
	},
	specials: {
		flexDirection: 'row',
		gap: 8,
	},
	specialButton: {
		flex: 1,
		minHeight: 42,
		borderRadius: 8,
		backgroundColor: '#2F7E49',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
	},
	specialButtonDanger: {
		backgroundColor: '#B00020',
	},
	specialText: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '900',
	},
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 8,
	},
	key: {
		width: 46,
		height: 42,
		backgroundColor: '#30343A',
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	keyTxt: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '800',
	},
});
