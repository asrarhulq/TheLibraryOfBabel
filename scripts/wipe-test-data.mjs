// One-time admin utility: wipe ALL data so the app starts fresh.
// Usage:  node scripts/wipe-test-data.mjs "<your-mongodb-uri>"
//
// The URI is passed as an argument so no secret is stored in the repo.
// Clears: discoveries, claims, declarations, travelers, notes, visits.

import { MongoClient } from 'mongodb';

const uri = process.argv[2];
if (!uri) {
  console.error('Provide the MongoDB URI as an argument (in quotes).');
  process.exit(1);
}

const dbName = process.env.MONGODB_DB || 'library_of_babel';
const COLLECTIONS = ['discoveries', 'claims', 'declarations', 'travelers', 'notes', 'visits'];

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
try {
  await client.connect();
  const db = client.db(dbName);
  for (const name of COLLECTIONS) {
    const res = await db.collection(name).deleteMany({});
    console.log(`  cleared ${name}: ${res.deletedCount} removed`);
  }
  console.log('Done — database is fresh.');
} catch (e) {
  console.error('Wipe failed:', e.message);
  process.exit(1);
} finally {
  await client.close();
}
