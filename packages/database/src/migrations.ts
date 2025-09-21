import { Db } from 'mongodb';
import { connectToMongoDB, closeConnection } from './connection.js';
import { createDatabaseQueries } from './queries.js';

export async function runMigrations(db: Db): Promise<void> {
  try {
    console.log('Running database migrations...');
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('professors')) {
      await db.createCollection('professors');
      console.log('Created professors collection');
    }
    
    if (!collectionNames.includes('reviews')) {
      await db.createCollection('reviews');
      console.log('Created reviews collection');
    }
    
    await runDataMigrations(db);
    
    const queries = createDatabaseQueries(db);
    await queries.createIndexes();
    
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Failed to run migrations:', error);
    throw error;
  }
}

async function runDataMigrations(db: Db): Promise<void> {
  console.log('Running data migrations...');
  
  await migrateProfessorSatisfactionFields(db);
}

async function migrateProfessorSatisfactionFields(db: Db): Promise<void> {
  console.log('Migrating professor satisfaction fields...');
  
  const professorsCollection = db.collection('professors');
  
  const professorsNeedingMigration = await professorsCollection.countDocuments({
    $or: [
      { average_satisfaction: { $exists: false } },
      { total_reviews: { $exists: false } }
    ]
  });

  if (professorsNeedingMigration === 0) {
    console.log('All professors already have satisfaction fields');
    return;
  }

    console.log(`Found ${professorsNeedingMigration} professors needing satisfaction field migration`);
  
  await professorsCollection.updateMany(
    {
      $or: [
        { average_satisfaction: { $exists: false } },
        { total_reviews: { $exists: false } }
      ]
    },
    {
      $set: {
        total_reviews: 0
      },
      $unset: {
        average_satisfaction: ""
      }
    }
  );

  const queries = createDatabaseQueries(db);
  await queries.recalculateAllProfessorSatisfactions();
  
  console.log('Professor satisfaction fields migration completed');
}

export async function dropCollections(db: Db): Promise<void> {
  try {
    console.log('Dropping database collections...');
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (collectionNames.includes('reviews')) {
      await db.collection('reviews').drop();
      console.log('Dropped reviews collection');
    }
    
    if (collectionNames.includes('professors')) {
      await db.collection('professors').drop();
      console.log('Dropped professors collection');
    }
    
    console.log('Database collections dropped successfully');
  } catch (error) {
    console.error('Failed to drop collections:', error);
    throw error;
  }
}

export async function runMigrationsCLI(): Promise<void> {
  let mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  mongodbUri = mongodbUri.trim();
  if ((mongodbUri.startsWith('"') && mongodbUri.endsWith('"')) || (mongodbUri.startsWith("'") && mongodbUri.endsWith("'"))) {
    mongodbUri = mongodbUri.slice(1, -1);
  }

  try {
    const db = await connectToMongoDB(mongodbUri);
    await runMigrations(db);
  } finally {
    await closeConnection();
  }
}
