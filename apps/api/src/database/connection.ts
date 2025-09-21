import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let database: Db | null = null;

export async function connectToMongoDB(uri: string, dbName: string = 'profaganda'): Promise<Db> {
  if (!client) {
    client = new MongoClient(uri, {
      maxPoolSize: 20,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
    });
    
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
  }
  
  if (!database) {
    database = client.db(dbName);
  }
  
  return database;
}

export function getDatabase(): Db {
  if (!database) {
    throw new Error('Database not initialized. Call connectToMongoDB first.');
  }
  return database;
}

export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    database = null;
    console.log('✅ MongoDB connection closed');
  }
}