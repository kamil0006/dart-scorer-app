import React from 'react';
import Svg, { Circle, Line, G } from 'react-native-svg';

/** typ pojedynczego kliknięcia  */
type PickerProps = { onSelect: (bed: number, m: 1 | 2 | 3) => void };

export default function DartboardPicker({ onSelect }: PickerProps) {
  const R = 120;
  const beds = [...Array(20).keys()].map(i => i + 1);

  return (
    <Svg width={R * 2} height={R * 2}>
      <G x={R} y={R}>
        {/* prosta, widoczna tarcza demo */}
        <Circle cx={0} cy={0} r={R} fill="#444" />

        {beds.map((b, i) => (
          <Line
            key={b}
            x1={0}
            y1={0}
            x2={R * Math.sin((i * Math.PI) / 10)}
            y2={-R * Math.cos((i * Math.PI) / 10)}
            stroke="#8AB4F8"
            strokeWidth={1}
            /* każde kliknięcie wysyła bed + m=1  (demo) */
            onPress={() => onSelect(b, 1)}
          />
        ))}
      </G>
    </Svg>
  );
}
