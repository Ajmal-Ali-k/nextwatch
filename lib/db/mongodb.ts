import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "nextwatch";

// Cache the connection promise (not just the result) so concurrent
// requests during the initial connect don't each start their own attempt.
const g = globalThis as unknown as {
  __mongoPromise?: Promise<{ client: MongoClient; db: Db }>;
};

function connect(): Promise<{ client: MongoClient; db: Db }> {
  if (!uri) return Promise.reject(new Error("MONGODB_URI is not set"));

  if (!g.__mongoPromise) {
    g.__mongoPromise = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    })
      .connect()
      .then((client) => {
        const db = client.db(dbName);
        return { client, db };
      })
      .catch((err) => {
        // Clear so the next call retries instead of returning a rejected promise forever
        g.__mongoPromise = undefined;
        throw err;
      });
  }

  return g.__mongoPromise;
}

export async function getDb(): Promise<Db> {
  const { db } = await connect();
  return db;
}
