import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
	score: number;
	average: number; // 3-dart avg
	checkout?: string[];
};

export default function ScoreBoard({ score, average, checkout }: Props) {
	return (
		<View style={styles.box}>
			<Text style={styles.score}>{score}</Text>

			{/*    ------ meta: AVG + checkout ------    */}
			<View style={styles.meta}>
				<Text style={styles.avg}>AVG&nbsp;{average.toFixed(1)}</Text>
				{checkout && <Text style={styles.checkout}>➜&nbsp;{checkout.join(' • ')}</Text>}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	box: { alignItems: 'center', marginTop: 32 },
	score: { fontSize: 96, color: '#FAFAFA', fontWeight: '700' },

	meta: { marginTop: 6, flexDirection: 'row', gap: 16 },
	avg: { fontSize: 18, color: '#8AB4F8', letterSpacing: 1 },
	checkout: { fontSize: 18, color: '#60D394', letterSpacing: 1 },
});
