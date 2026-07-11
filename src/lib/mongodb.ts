import { MongoClient, type Db } from 'mongodb';

const uri = import.meta.env.MONGODB_URI;
const dbName = import.meta.env.MONGODB_DB_NAME || 'rdr_seguridad';

// Evita que una caída de Atlas cuelgue la request ~30s con los defaults.
const CLIENT_OPTIONS = { serverSelectionTimeoutMS: 5000 } as const;

let clientPromise: Promise<MongoClient> | undefined;

// Reuse the connection across invocations in the same serverless instance.
declare global {
  // eslint-disable-next-line no-var
  var _rdrMongoClientPromise: Promise<MongoClient> | undefined;
}

function connect(uri: string, onFailure: () => void): Promise<MongoClient> {
  // Si el connect falla, se descarta la promesa cacheada para que la próxima
  // request reintente en vez de quedar con un rechazo cacheado para siempre.
  return new MongoClient(uri, CLIENT_OPTIONS).connect().catch((err) => {
    onFailure();
    throw err;
  });
}

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error('Falta la variable de entorno MONGODB_URI.');
  }

  if (import.meta.env.DEV) {
    if (!globalThis._rdrMongoClientPromise) {
      globalThis._rdrMongoClientPromise = connect(uri, () => {
        globalThis._rdrMongoClientPromise = undefined;
      });
    }
    return globalThis._rdrMongoClientPromise;
  }

  if (!clientPromise) {
    clientPromise = connect(uri, () => {
      clientPromise = undefined;
    });
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}
