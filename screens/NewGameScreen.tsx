import SegmentedControl from '@react-native-segmented-control/segmented-control';
import type { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameVariant, STARTING_SCORE } from '../lib/gameVariant';
import { RootStackParamList } from '../navigation/types';

export type NewGameScreenProps = {
	navigation: StackNavigationProp<RootStackParamList, 'NewGame'>;
};

export default function NewGameScreen({ navigation }: NewGameScreenProps) {
	const [variant, setVariant] = useState<GameVariant>('501');

	const handleStart = () =>
		navigation.navigate('Game', {
			initialScore: STARTING_SCORE[variant],
			variant,
		});

	return (
		<View style={styles.wrapper}>
			<SegmentedControl
				values={['501', '301']}
				selectedIndex={variant === '501' ? 0 : 1}
				onChange={e => setVariant(e.nativeEvent.selectedSegmentIndex === 0 ? '501' : '301')}
				style={{ width: 280, height: 50 }}
			/>

			<Pressable style={styles.startBtn} onPress={handleStart}>
				<Text style={styles.startTxt}>Start</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		gap: 24,
		backgroundColor: '#121212',
	},
	startBtn: {
		paddingHorizontal: 40,
		paddingVertical: 14,
		backgroundColor: '#8AB4F8',
		borderRadius: 10,
	},
	startTxt: {
		color: '#121212',
		fontSize: 18,
		fontWeight: '700',
	},
});
