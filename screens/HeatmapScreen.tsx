import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { aggregateHits } from '../lib/heat';
import { fetchGames } from '../lib/db';

export default function HeatmapScreen() {
 // HeatmapScreen.tsx  – linia z błędem
const freq = aggregateHits(fetchGames() as { hits: string }[]);


const games = fetchGames() as any[]; 
const data = games.map(g => {
  try {
    return { ...g, hits: JSON.parse(g.hits) };
  } catch {
    return { ...g, hits: [] };
  }
});
console.log('PARSED HITS:', data.map(g => g.hits));

if(!Object.keys(freq).length)
  return <Text style={{color:'#888',marginTop:20}}>Brak danych włącz tryb zaawansowany</Text>;
}
