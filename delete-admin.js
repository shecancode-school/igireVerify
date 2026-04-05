import { config } from 'dotenv';
config({ path: '.env.local' });
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

async function deleteAdmin() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const result = await db.collection('users').deleteOne({ email: 'thierry@igirerwanda.org' });
    console.log(`Deleted ${result.deletedCount} document(s)`);
  } catch (error) {
    console.error('Error deleting admin:', error);
  } finally {
    await client.close();
  }
}

deleteAdmin();