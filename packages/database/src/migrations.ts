import { Pool } from 'pg';
import { createTablesSQL, dropTablesSQL } from './schema.js';

export async function runMigrations(pool: Pool): Promise<void> {
  try {
    console.log('Running database migrations...');
    await pool.query(createTablesSQL);
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Failed to run migrations:', error);
    throw error;
  }
}

export async function dropTables(pool: Pool): Promise<void> {
  try {
    console.log('Dropping database tables...');
    await pool.query(dropTablesSQL);
    console.log('Database tables dropped successfully');
  } catch (error) {
    console.error('Failed to drop tables:', error);
    throw error;
  }
}

// CLI script for running migrations
export async function runMigrationsCLI(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    await runMigrations(pool);
  } finally {
    await pool.end();
  }
}
