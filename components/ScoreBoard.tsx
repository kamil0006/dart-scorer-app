import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
	score: number;
	average: number;
	checkout?: string[];
};

export default function ScoreBoard({ score, average, checkout }: Props) {
	return (
		<View style={styles.box}>
			<Text style={styles.score}>{score}</Text>

			<View style={styles.meta}>
				<Text style={styles.avg}>AVG {average.toFixed(1)}</Text>
				{checkout && (
					<View style={styles.checkoutRow}>
						<MaterialIcons name='flag' size={18} color='#60D394' />
						<Text style={styles.checkout}>{checkout.join(' / ')}</Text>
					</View>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	box: { alignItems: 'center', marginTop: 32 },
	score: { fontSize: 96, color: '#FAFAFA', fontWeight: '700' },
	meta: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 16 },
	avg: { fontSize: 18, color: '#8AB4F8', letterSpacing: 1 },
	checkoutRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
	checkout: { fontSize: 18, color: '#60D394', letterSpacing: 1 },
});
