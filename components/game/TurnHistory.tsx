import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '../../lib/LanguageContext';

type Props = {
	turns: number[];
	canUndoTurn: boolean;
	onUndoTurn: () => void;
	compact?: boolean;
	horizontalScroll?: boolean;
};

export default function TurnHistory({ turns, canUndoTurn, onUndoTurn, compact = false, horizontalScroll = false }: Props) {
	const { strings } = useLanguage();
	const latestTurns = turns.slice().reverse();

	if (turns.length === 0) return null;

	return (
		<View style={[styles.history, compact && styles.historyCompact]}>
			<View style={[styles.header, compact && styles.headerCompact]}>
				<View style={styles.headerTitle}>
					<MaterialIcons name='history' size={compact ? 15 : 18} color='#8AB4F8' />
					<Text style={styles.title}>{strings.turns}</Text>
				</View>
				<Text style={styles.counter}>{turns.length}</Text>
			</View>

			{horizontalScroll ? (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={[styles.tags, compact && styles.tagsCompact]}>
					<HistoryTags
						turns={turns}
						latestTurns={latestTurns}
						canUndoTurn={canUndoTurn}
						onUndoTurn={onUndoTurn}
						compact={compact}
					/>
				</ScrollView>
			) : (
				<View style={[styles.tags, styles.tagsWrapped, compact && styles.tagsCompact]}>
					<HistoryTags
						turns={turns}
						latestTurns={latestTurns}
						canUndoTurn={canUndoTurn}
						onUndoTurn={onUndoTurn}
						compact={compact}
					/>
				</View>
			)}
		</View>
	);
}

function HistoryTags({
	turns,
	latestTurns,
	canUndoTurn,
	onUndoTurn,
	compact,
}: {
	turns: number[];
	latestTurns: number[];
	canUndoTurn: boolean;
	onUndoTurn: () => void;
	compact: boolean;
}) {
	return (
		<>
				{latestTurns.map((turn, index) => {
					const isLatest = index === 0;
					const originalIndex = turns.length - index;
					return (
						<View
							key={`${turn}-${originalIndex}`}
							style={[
								styles.tag,
								compact && styles.tagCompact,
								isLatest && styles.tagLatest,
								turn === 0 && styles.tagBust,
							]}>
							<Text style={[styles.tagIndex, compact && styles.tagIndexCompact, isLatest && styles.tagIndexLatest]}>#{originalIndex}</Text>
							<Text style={[styles.tagTxt, compact && styles.tagCompactTxt, isLatest && styles.tagTxtLatest]}>{turn}</Text>
						</View>
					);
				})}
				{canUndoTurn && (
					<Pressable style={[styles.trashTurn, compact && styles.trashTurnCompact]} onPress={onUndoTurn}>
						<MaterialIcons name='delete-outline' size={compact ? 18 : 22} color='#fff' />
					</Pressable>
				)}
		</>
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
	historyCompact: {
		padding: 8,
		gap: 7,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	headerCompact: {
		minHeight: 18,
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
		gap: 8,
		paddingRight: 2,
	},
	tagsWrapped: {
		flexWrap: 'wrap',
	},
	tagsCompact: {
		gap: 6,
	},
	tag: {
		minWidth: 58,
		backgroundColor: '#2A2A2A',
		borderRadius: 8,
		paddingVertical: 7,
		paddingHorizontal: 9,
		alignItems: 'center',
	},
	tagCompact: {
		minWidth: 42,
		paddingVertical: 4,
		paddingHorizontal: 6,
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
	tagIndexCompact: {
		fontSize: 9,
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
	tagCompactTxt: {
		fontSize: 14,
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
	trashTurnCompact: {
		minWidth: 36,
		minHeight: 36,
	},
});
