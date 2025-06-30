import { Dart } from './db';
export function aggregateHits(games: { hits: string }[]) {
  const f:Record<string,number>={};
  games.forEach(g=>{
    JSON.parse(g.hits||'[]').forEach((h:Dart)=>{
      const k=`${h.bed}x${h.m}`; f[k]=(f[k]||0)+1;
    });
  });
  return f;
};
