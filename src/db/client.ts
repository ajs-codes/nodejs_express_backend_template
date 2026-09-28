import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getDatabaseConfig } from '../config/database.js';
import { getLogger } from '../observability/logger.js';
import * as schema from './schema.js';

let pool: Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

export function getPool(): Pool {
  if (!pool) {
    const config = getDatabaseConfig();
    pool = new Pool({
      connectionString: config.url,
      max: config.maxConnections,
      idleTimeoutMillis: config.idleTimeoutMs,
      connectionTimeoutMillis: config.connectionTimeoutMs,
    });

    pool.on('error', (error) => {
      getLogger().error({ err: error, database: 'postgres' }, 'Unexpected pool error');
    });
  }
  return pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!db) {
    db = drizzle(getPool(), {
      schema,
      logger: {
        logQuery(query, params) {
          getLogger().debug(
            {
              database: 'postgres',
              operation: 'query',
              sql: query,
              params,
            },
            'Database query executed',
          );
        },
      },
    });
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}
