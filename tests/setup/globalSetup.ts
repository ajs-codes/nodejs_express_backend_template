import { config } from 'dotenv';
import { resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

export default async function globalSetup(): Promise<void> {
  config({ path: resolve(process.cwd(), '.env.test'), override: true });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  await migrate(db, { migrationsFolder: resolve(process.cwd(), 'drizzle') });
  await pool.end();
}
