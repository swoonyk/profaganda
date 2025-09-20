import { Db } from 'mongodb';
import { connectToMongoDB, closeConnection } from './connection.js';
import { createDatabaseQueries } from './queries.js';

export async function runMigrations(db: Db): Promise<void> {
  try {
    console.log('Running database migrations...');
    
    // Create collections if they don't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('professors')) {
      await db.createCollection('professors');
      console.log('✅ Created professors collection');
    }
    
    if (!collectionNames.includes('reviews')) {
      await db.createCollection('reviews');
      console.log('✅ Created reviews collection');
    }
    
    // Create indexes
    const queries = createDatabaseQueries(db);
    await queries.createIndexes();
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Failed to run migrations:', error);
    throw error;
  }
}

export async function dropCollections(db: Db): Promise<void> {
  try {
    console.log('Dropping database collections...');
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (collectionNames.includes('reviews')) {
      await db.collection('reviews').drop();
      console.log('✅ Dropped reviews collection');
    }
    
    if (collectionNames.includes('professors')) {
      await db.collection('professors').drop();
      console.log('✅ Dropped professors collection');
    }
    
    console.log('✅ Database collections dropped successfully');
  } catch (error) {
    console.error('❌ Failed to drop collections:', error);
    throw error;
  }
}

// CLI script for running migrations
export async function runMigrationsCLI(): Promise<void> {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  try {
    const db = await connectToMongoDB(mongodbUri);
    await runMigrations(db);
  } finally {
    await closeConnection();
  }
}
