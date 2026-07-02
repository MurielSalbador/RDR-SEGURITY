import { MongoClient, type Db } from 'mongodb';

const uri = import.meta.env.MONGODB_URI;
const dbName = import.meta.env.MONGODB_DB_NAME || 'rdr_seguridad';

let clientPromise: Promise<MongoClient> | undefined;

// Reuse the connection across invocations in the same serverless instance.
declare global {
  // eslint-disable-next-line no-var
  var _rdrMongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error('Falta la variable de entorno MONGODB_URI.');
  }

  if (import.meta.env.DEV) {
    if (!globalThis._rdrMongoClientPromise) {
      globalThis._rdrMongoClientPromise = new MongoClient(uri).connect();
    }
    return globalThis._rdrMongoClientPromise;
  }

  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}
