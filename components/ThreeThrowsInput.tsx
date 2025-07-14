import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Dart } from '../lib/db';

type Props = {
  onComplete: (throwsArr: Dart[]) => void;
};

export default function ThreeThrowsInput({ onComplete }: Props) {
  const [throwsArr, setThrowsArr] = useState<Dart[]>([]);

  // dodaj lotkę
  const add = (bed: number, m: 1 | 2 | 3) => {
    if (throwsArr.length >= 3) return;
    const next = [...throwsArr, { bed, m }];
    setThrowsArr(next);
    if (next.length === 3) {
      onComplete(next);
      setThrowsArr([]); 
    }
  };

  return (
    <View style={s.wrapper}>
      {Array.from({ length: 3 }).map((_, i) => {
        const d = throwsArr[i];
        return (
          <View key={i} style={s.slot}>
            <Text style={s.txt}>{d ? `${d.m}×${d.bed}` : '-'}</Text>
          </View>
        );
      })}
      
      <View style={s.buttons}>
        {[20, 19, 18].map(b => (
          <Pressable key={b} onPress={() => add(b, 1)} style={s.btn}>
            <Text style={s.btnTxt}>{b}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { alignItems: 'center', marginBottom: 16 },
  slot: {
    width: 60, height: 40, margin: 4,
    backgroundColor: '#333', borderRadius: 6,
    justifyContent: 'center', alignItems: 'center',
  },
  txt: { color: '#fff', fontSize: 16 },
  buttons: { flexDirection: 'row', marginTop: 8 },
  btn: {
    marginHorizontal: 6, padding: 8,
    backgroundColor: '#444', borderRadius: 6,
  },
  btnTxt: { color: '#fff' },
});
