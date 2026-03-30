import { MongoClient, type Db } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let cachedConnected = false;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;

  const uri = requireEnv("MONGODB_URI");
  const dbName = process.env.MONGODB_DB || "igireverify";

  if (!cachedClient) {
    // faster fail for invalid config
    if (!uri.trim()) {
      throw new Error("MONGODB_URI is empty");
    }
    cachedClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  if (!cachedConnected) {
    try {
      await cachedClient.connect();
      // explicit ping to verify the connection
      await cachedClient.db(dbName).command({ ping: 1 });
      cachedConnected = true;
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw new Error("Database connection failed: " + (error instanceof Error ? error.message : String(error)));
    }
  }

  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}

