import React, { useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import type { StackNavigationProp } from '@react-navigation/stack';
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
        onChange={e =>
          setVariant(
            e.nativeEvent.selectedSegmentIndex === 0 ? '501' : '301',
          )
        }
        style={{ width: 220 }}
      />

      <Button title="Start" onPress={handleStart} />
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
});
