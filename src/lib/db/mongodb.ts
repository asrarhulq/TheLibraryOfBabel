import { MongoClient, Db } from 'mongodb';

// Hot-reload-safe singleton connection.
// In development, Next.js clears module state on every edit, which would otherwise
// open a new connection on each reload and exhaust the Atlas connection pool.
// We stash the client promise on globalThis so it survives HMR.

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'library_of_babel';

if (!uri) {
  throw new Error('MONGODB_URI is not set. Add it to .env.local');
}

interface GlobalWithMongo {
  _babelMongoClientPromise?: Promise<MongoClient>;
}
const globalWithMongo = globalThis as unknown as GlobalWithMongo;

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!globalWithMongo._babelMongoClientPromise) {
    const client = new MongoClient(uri);
    globalWithMongo._babelMongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._babelMongoClientPromise;
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export default clientPromise;
