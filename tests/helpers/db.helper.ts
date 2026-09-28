import { sql } from 'drizzle-orm';
import { getDb } from '../../src/db/client.js';

export async function resetDatabase(): Promise<void> {
  const db = getDb();
  await db.execute(sql`TRUNCATE TABLE sessions, users RESTART IDENTITY CASCADE`);
}
