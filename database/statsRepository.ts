import { db } from '../lib/db';

// 🚨 Używamy **synchronycznego** API expo‑sqlite/next, tak jak w lib/db.ts.
// Dlatego NIE potrzebujemy async/await – wystarczy runSync.

export function deleteStatById(id: number) {
  // tabela nazywa się `games`, dokładnie jak w innych helperach
  db.runSync('DELETE FROM games WHERE id = ?;', id);
}
