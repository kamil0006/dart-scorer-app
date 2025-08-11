import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StackScreenProps } from '@react-navigation/stack';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../lib/LanguageContext';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'StatsDetail'>;

export default function StatsDetailScreen({ route, navigation }: Props) {
	const { turns, avg3, date, start, forfeited = false, forfeitScore = null } = route.params;
	const { strings } = useLanguage();
	const darts = turns.length * 3;

	const renderTurn = ({ item, index }: { item: number; index: number }) => (
		<View style={styles.row}>
			<Text style={styles.rowIdx}>{index + 1}</Text>
			<Text style={styles.rowPts}>{item}</Text>
		</View>
	);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Pressable onPress={() => navigation.goBack()}>
					<Ionicons name='chevron-back' size={26} color='#8AB4F8' />
				</Pressable>
				<View style={{ flexDirection: 'row', alignItems: 'center' }}>
					<Text style={styles.title}>
						{date.slice(0, 10)} • {start}
					</Text>
					{forfeited ? (
						<View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
							<MaterialIcons name='flag' size={20} color='#B00020' />
							<Text style={{ color: '#B00020', fontWeight: 'bold', marginLeft: 4 }}>
								{strings.forfeited} {forfeitScore != null ? `(${forfeitScore} ${strings.pointsLeft})` : ''}
							</Text>
						</View>
					) : null}
				</View>
				<View style={{ width: 26 }} />
			</View>

			<View style={styles.summary}>
				<Stat label={strings.avg} value={avg3.toFixed(1)} />
				<Stat label={strings.turns} value={turns.length} />
				<Stat label={strings.darts} value={darts} />
			</View>

			<FlatList
				data={turns}
				keyExtractor={(_, i) => i.toString()}
				renderItem={renderTurn}
				contentContainerStyle={{ paddingBottom: 40 }}
			/>
		</View>
	);
}

function Stat({ label, value }: { label: string; value: any }) {
	return (
		<View style={{ alignItems: 'center' }}>
			<Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>{value}</Text>
			<Text style={{ color: '#888' }}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#181818', paddingHorizontal: 16 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 12,
	},
	title: { color: '#fff', fontSize: 18, fontWeight: '600' },
	summary: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 12,
		paddingVertical: 8,
		backgroundColor: '#222',
		borderRadius: 10,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		backgroundColor: '#2a2a2a',
		borderRadius: 8,
		paddingVertical: 6,
		paddingHorizontal: 12,
		marginBottom: 6,
	},
	rowIdx: { color: '#888', fontSize: 14 },
	rowPts: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
