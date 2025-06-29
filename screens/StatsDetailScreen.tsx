import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'StatsDetail'>;

export default function StatsDetailScreen({ route, navigation }: Props) {
  const { turns, avg3, date, start } = route.params;
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
          <Ionicons name="chevron-back" size={26} color="#8AB4F8" />
        </Pressable>
        <Text style={styles.title}>{date.slice(0, 10)} • {start}</Text>
        <View style={{width:26}}/> 
      </View>

     
      <View style={styles.summary}>
        <Stat label="AVG"   value={avg3.toFixed(1)} />
        <Stat label="Tury"  value={turns.length}   />
        <Stat label="Lotki" value={darts}          />
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
    backgroundColor: '#2a2a2a',   /* jaśniejsze niż #1E1E1E */
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  rowIdx: { color: '#888', fontSize: 14 },
  rowPts:{ color: '#fff', fontSize: 16, fontWeight: '600' },
});
