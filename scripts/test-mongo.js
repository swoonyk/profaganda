// scripts/test-mongo.js
// Simple MongoDB connection test that uses process.env.MONGODB_URI
const path = require('path');
// Load repository .env (if present) so pnpm test-mongo works without manual env export
try {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
} catch (e) {
  // ignore if dotenv isn't available
}
const { MongoClient } = require('mongodb');

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Mongo OK');
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Mongo test failed:', err.message);
    process.exit(1);
  }
})();
