import { MongoClient, Db } from 'mongodb';

// Lazy, hot-reload-safe singleton connection.
//
// The connection (and the MONGODB_URI check) is created on FIRST USE — inside getDb() —
// not at import time. This matters for builds/deploys (e.g. Vercel): route modules can be
// compiled and their page data collected without the database being reachable or configured;
// the error only surfaces if a request actually needs the DB and the env var is missing.
//
// In development, Next.js clears module state on every edit, which would otherwise open a new
// connection on each reload and exhaust the Atlas pool. We stash the client promise on
// globalThis so it survives HMR.

interface GlobalWithMongo {
  _babelMongoClientPromise?: Promise<MongoClient>;
}
const globalWithMongo = globalThis as unknown as GlobalWithMongo;

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Add it in your environment (e.g. .env.local locally, ' +
        'or the Vercel project’s Environment Variables).'
    );
  }

  if (process.env.NODE_ENV === 'development') {
    if (!globalWithMongo._babelMongoClientPromise) {
      globalWithMongo._babelMongoClientPromise = new MongoClient(uri).connect();
    }
    return globalWithMongo._babelMongoClientPromise;
  }

  return new MongoClient(uri).connect();
}

export async function getDb(): Promise<Db> {
  const dbName = process.env.MONGODB_DB || 'library_of_babel';
  const client = await getClientPromise();
  return client.db(dbName);
}
