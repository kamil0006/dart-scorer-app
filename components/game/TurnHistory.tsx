import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '../../lib/LanguageContext';

type Props = {
	turns: number[];
	canUndoTurn: boolean;
	onUndoTurn: () => void;
};

export default function TurnHistory({ turns, canUndoTurn, onUndoTurn }: Props) {
	const { strings } = useLanguage();
	const latestTurns = turns.slice(-8).reverse();

	if (turns.length === 0) return null;

	return (
		<View style={styles.history}>
			<View style={styles.header}>
				<View style={styles.headerTitle}>
					<MaterialIcons name='history' size={18} color='#8AB4F8' />
					<Text style={styles.title}>{strings.turns}</Text>
				</View>
				<Text style={styles.counter}>{turns.length}</Text>
			</View>

			<View style={styles.tags}>
				{latestTurns.map((turn, index) => {
					const isLatest = index === 0;
					const originalIndex = turns.length - index;
					return (
						<View key={`${turn}-${originalIndex}`} style={[styles.tag, isLatest && styles.tagLatest, turn === 0 && styles.tagBust]}>
							<Text style={[styles.tagIndex, isLatest && styles.tagIndexLatest]}>#{originalIndex}</Text>
							<Text style={[styles.tagTxt, isLatest && styles.tagTxtLatest]}>{turn}</Text>
						</View>
					);
				})}
				{canUndoTurn && (
					<Pressable style={styles.trashTurn} onPress={onUndoTurn}>
						<MaterialIcons name='delete-outline' size={22} color='#fff' />
					</Pressable>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	history: {
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 12,
		gap: 10,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	headerTitle: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	title: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '900',
	},
	counter: {
		color: '#8AB4F8',
		fontSize: 13,
		fontWeight: '900',
	},
	tags: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	tag: {
		minWidth: 58,
		backgroundColor: '#2A2A2A',
		borderRadius: 8,
		paddingVertical: 7,
		paddingHorizontal: 9,
		alignItems: 'center',
	},
	tagLatest: {
		backgroundColor: '#8AB4F8',
	},
	tagBust: {
		borderWidth: 1,
		borderColor: '#D94A5A',
	},
	tagIndex: {
		color: '#999',
		fontSize: 10,
		fontWeight: '800',
	},
	tagIndexLatest: {
		color: '#25354F',
	},
	tagTxt: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '900',
		marginTop: 1,
	},
	tagTxtLatest: {
		color: '#101113',
	},
	trashTurn: {
		minWidth: 44,
		minHeight: 44,
		borderRadius: 8,
		backgroundColor: '#B00020',
		alignItems: 'center',
		justifyContent: 'center',
	},
});
