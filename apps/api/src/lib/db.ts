import { config } from 'dotenv';
import { connectToMongoDB, createDatabaseQueries } from '../database/index.js';

config({ path: '../../../.env' });

let dbQueries: any = null;
let dbConnection: any = null;

export async function getDatabase() {
  if (dbQueries && dbConnection) {
    return { dbQueries, dbConnection };
  }

  let mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  mongodbUri = mongodbUri.trim();
  if ((mongodbUri.startsWith('"') && mongodbUri.endsWith('"')) || (mongodbUri.startsWith("'") && mongodbUri.endsWith("'"))) {
    mongodbUri = mongodbUri.slice(1, -1);
  }

  if (!/^mongodb(\+srv)?:\/\//.test(mongodbUri)) {
    throw new Error('Invalid MONGODB_URI: connection string must start with "mongodb://" or "mongodb+srv://"');
  }

  try {
    dbConnection = await connectToMongoDB(mongodbUri);
    dbQueries = createDatabaseQueries(dbConnection);
    return { dbQueries, dbConnection };
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}
