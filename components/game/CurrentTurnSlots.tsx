import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Dart } from '../../lib/db';

type Props = {
	hits: Dart[];
	onUndo: () => void;
};

export default function CurrentTurnSlots({ hits, onUndo }: Props) {
	return (
		<View style={styles.slotsRow}>
			{Array.from({ length: 3 }).map((_, index) => (
				<View key={index} style={styles.slot}>
					<Text style={styles.slotTxt}>{hits[index] ? formatDart(hits[index]) : '-'}</Text>
				</View>
			))}
			<Pressable style={styles.slotBtn} onPress={onUndo}>
				<MaterialIcons name='delete-sweep' size={20} color='#fff' />
			</Pressable>
		</View>
	);
}

function formatDart(dart: Dart) {
	if (dart.bed === 50) return '1x50';
	if (dart.bed === 25) return '1x25';
	return `${dart.m}x${dart.bed}`;
}

const styles = StyleSheet.create({
	slotsRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 8,
		marginBottom: 16,
	},
	slot: {
		width: 60,
		height: 40,
		backgroundColor: '#444',
		borderRadius: 6,
		justifyContent: 'center',
		alignItems: 'center',
	},
	slotTxt: {
		color: '#fff',
		fontSize: 16,
	},
	slotBtn: {
		alignSelf: 'center',
		padding: 6,
		backgroundColor: '#333',
		borderRadius: 6,
	},
});
