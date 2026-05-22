import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { GameRow } from '../../lib/db';
import { isAdvancedGame, isForfeitedGame, parseTurns } from '../../lib/dartsStats';
import { useLanguage } from '../../lib/LanguageContext';
import { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

type Props = {
	games: GameRow[];
	onDeleteGame: (id: number) => void;
};

export default function GameHistoryList({ games, onDeleteGame }: Props) {
	const navigation = useNavigation<Nav>();
	const { strings } = useLanguage();

	return (
		<FlatList
			data={games}
			ListEmptyComponent={<EmptyHistory />}
			keyExtractor={game => game.id.toString()}
			contentContainerStyle={styles.listContent}
			initialNumToRender={12}
			maxToRenderPerBatch={12}
			removeClippedSubviews={true}
			windowSize={7}
			renderItem={({ item }) => (
				<Swipeable
					overshootRight={false}
					renderRightActions={() => (
						<Pressable style={styles.deleteAction} onPress={() => onDeleteGame(item.id)}>
							<View style={styles.deleteCircle}>
								<Ionicons name='trash' size={18} color='#fff' />
							</View>
						</Pressable>
					)}>
					<Pressable
						style={styles.card}
						onPress={() =>
							navigation.navigate('StatsDetail', {
								id: item.id,
								turns: parseTurns(item.turns),
								avg3: item.avg3,
								date: item.date,
								start: item.start,
								darts: item.darts,
								scored: item.scored,
								checkout: item.checkout,
								hits: item.hits,
								forfeited: isForfeitedGame(item),
								forfeitScore: item.forfeitScore ?? undefined,
							})
						}>
						{isAdvancedGame(item) && <View style={styles.advancedCornerSlash} />}
						<View style={styles.avgCell}>
							<Text style={styles.avg}>{item.avg3.toFixed(1)}</Text>
						</View>

						<View>
							<Text style={styles.date}>{item.date.slice(0, 10)}</Text>
						</View>

						<View style={styles.variant}>
							<Text style={styles.variantTxt}>{item.start}</Text>
						</View>

						{isForfeitedGame(item) && item.forfeitScore != null ? (
							<View style={styles.forfeitInfo}>
								<MaterialIcons name='flag' size={20} color='#B00020' />
								<Text style={styles.forfeitInfoText}>
									{item.forfeitScore} {strings.forfeitScoreLeft}
								</Text>
							</View>
						) : null}
					</Pressable>
				</Swipeable>
			)}
		/>
	);
}

function EmptyHistory() {
	const { strings } = useLanguage();
	return (
		<View style={styles.emptyState}>
			<MaterialIcons name='sports-score' size={34} color='#8AB4F8' />
			<Text style={styles.emptyTitle}>{strings.newGame}</Text>
			<Text style={styles.emptyText}>{strings.startGame}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	listContent: {
		paddingBottom: 80,
		flexGrow: 1,
	},
	emptyState: {
		flex: 1,
		minHeight: 260,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 24,
	},
	emptyTitle: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '900',
		marginTop: 12,
	},
	emptyText: {
		color: '#aaa',
		fontSize: 13,
		fontWeight: '700',
		marginTop: 6,
	},
	deleteAction: {
		justifyContent: 'center',
		alignItems: 'center',
		width: 56,
		height: '100%',
		backgroundColor: 'transparent',
	},
	deleteCircle: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#B00020',
		justifyContent: 'center',
		alignItems: 'center',
	},
	card: {
		flexDirection: 'row',
		gap: 12,
		backgroundColor: '#1E1E1E',
		borderRadius: 10,
		padding: 8,
		marginBottom: 6,
		alignItems: 'center',
		position: 'relative',
		overflow: 'hidden',
	},
	avgCell: {
		width: 70,
		minHeight: 34,
		alignItems: 'center',
		justifyContent: 'center',
		position: 'relative',
	},
	avg: {
		fontSize: 26,
		color: '#8AB4F8',
		textAlign: 'center',
	},
	advancedCornerSlash: {
		position: 'absolute',
		top: 4,
		left: -7,
		width: 28,
		height: 3,
		backgroundColor: '#60D394',
		transform: [{ rotate: '-45deg' }],
	},
	date: {
		color: '#fff',
		fontSize: 13,
	},
	variant: {
		minWidth: 50,
		paddingVertical: 4,
		paddingHorizontal: 6,
		borderRadius: 6,
		backgroundColor: '#333',
		justifyContent: 'center',
		alignItems: 'center',
	},
	variantTxt: {
		color: '#8AB4F8',
		fontSize: 12,
		fontWeight: '600',
	},
	forfeitInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 8,
	},
	forfeitInfoText: {
		color: '#B00020',
		fontWeight: 'bold',
		marginLeft: 4,
		fontSize: 13,
	},
});
