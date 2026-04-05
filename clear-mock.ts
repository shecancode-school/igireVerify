import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function clearMock() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("No MONGODB_URI");
  
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.MONGODB_DB || "igireverify";
  const db = client.db(dbName);
  
  console.log("Connected to MongoDB.");
  
  await db.collection("attendance").deleteMany({});
  console.log("Cleared all attendance records.");
  
  await db.collection("programs").deleteMany({});
  console.log("Cleared all programs.");
  
  await db.collection("users").deleteMany({ role: { $ne: "admin" } });
  console.log("Cleared all non-admin users.");
  
  await client.close();
}

clearMock().catch(console.error);
