import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
	score: number;
	average: number;
	checkout?: string[];
	compact?: boolean;
};

export default function ScoreBoard({ score, average, checkout, compact = false }: Props) {
	return (
		<View style={[styles.box, compact && styles.boxCompact]}>
			<Text style={[styles.score, compact && styles.scoreCompact]}>{score}</Text>

			<View style={[styles.meta, compact && styles.metaCompact]}>
				<Text style={[styles.avg, compact && styles.metaText]}>AVG {average.toFixed(1)}</Text>
				{checkout && (
					<View style={styles.checkoutRow}>
						<MaterialIcons name='flag' size={compact ? 15 : 18} color='#60D394' />
						<Text style={[styles.checkout, compact && styles.metaText]}>{checkout.join(' / ')}</Text>
					</View>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	box: { alignItems: 'center', marginTop: 14 },
	boxCompact: { marginTop: 0 },
	score: { fontSize: 86, lineHeight: 94, color: '#FAFAFA', fontWeight: '700' },
	scoreCompact: { fontSize: 62, lineHeight: 68 },
	meta: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 16 },
	metaCompact: { marginTop: 0, gap: 10 },
	avg: { fontSize: 18, color: '#8AB4F8', letterSpacing: 1 },
	checkoutRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
	checkout: { fontSize: 18, color: '#60D394', letterSpacing: 1 },
	metaText: { fontSize: 14 },
});
