// components/Numpad.tsx
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type NumpadProps = {
  /** podstawowy tryb: wywołanie addTurn(sum) */
  onCommit?: (pts: number) => void;
  /** zaawansowany tryb: przekazuje raw string np. "T20" */
  onCommitRaw?: (raw: string) => void;
  onUndo: () => void;
  /** czy pokazać przyciski D/T/SB/DB */
  extended?: boolean;
};

export default function Numpad({ onCommit, onCommitRaw, onUndo, extended = false }: NumpadProps) {
  const [buffer, setBuffer] = useState<string>('');

  const push = (d: string) =>
    setBuffer(b => {
      const next = (b + d).toUpperCase().slice(0, 3);
      if (!/^[0-9DTB]+$/.test(next)) return b;
      return next;
    });
  const del = () => setBuffer(b => b.slice(0, -1));
  const clear = () => setBuffer('');

  const ok = () => {
    if (!buffer) return;
    if (onCommitRaw) {
      onCommitRaw(buffer);
    } else if (onCommit) {
      const pts = Number(buffer);
      if (!Number.isNaN(pts)) onCommit(pts);
    }
    clear();
  };

  // tylko cyfry 0–9
  const basicKeys = ['1','2','3','4','5','6','7','8','9','0'];
  // w extended: D, T, SB, DB
  const extKeys = ['D','T','SB','DB'];
  const keys = extended ? basicKeys.concat(extKeys) : basicKeys;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.display}>{buffer || '0'}</Text>

      <View style={styles.grid}>
        {keys.map(k => (
          <Key
            key={k}
            label={k}
            onPress={() => push(k === 'SB' ? '25' : k === 'DB' ? '50' : k)}
            dark={extended && (k === 'D' || k === 'T')}
            wide={extended && (k === 'SB' || k === 'DB')}
          />
        ))}

        <Key label='⌫' onPress={del} dark />
        <Key label='OK' onPress={ok} wide />
      </View>

      <Pressable style={styles.undo} onPress={onUndo}>
        <Text style={styles.undotxt}>↩︎ UNDO</Text>
      </Pressable>
    </View>
  );
}

function Key({ label, onPress, wide = false, dark = false }: { label: string; onPress: () => void; wide?: boolean; dark?: boolean; }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        wide && styles.wide,
        dark && styles.dark,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.keytxt}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 12, marginBottom: 32 },
  display: { fontSize: 48, color: '#FAFAFA', letterSpacing: 2, fontVariant: ['tabular-nums'] },
  grid: { width: '100%', maxWidth: 320, flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  key: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#1F1F1F', alignItems: 'center', justifyContent: 'center' },
  wide: { width: 152 },
  dark: { backgroundColor: '#444' },
  pressed: { opacity: 0.5 },
  keytxt: { color: '#FFF', fontSize: 24, fontWeight: '600' },
  undo: { marginTop: 8 },
  undotxt: { color: '#B0B0B0', fontSize: 16 },
});
