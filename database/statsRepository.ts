import { db } from '../lib/db';

export function deleteStatById(id: number) {
	db.runSync('DELETE FROM games WHERE id = ?;', id);
}
