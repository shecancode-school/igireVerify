const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'IgireVerify';

async function migrate() {
  if (!uri) {
    console.error('Error: MONGODB_URI is not defined in .env.local');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    const users = db.collection('users');

    // 1. Identify CEOs (Super-Admins)
    // You can add the real CEO emails here
    const ceos = [
      'ceo1@igirerwanda.org', 
      'ceo2@igirerwanda.org'
    ];

    console.log('Migrating CEOs...');
    await users.updateMany(
      { email: { $in: ceos } },
      { 
        $set: { 
          role: 'super-admin', 
          position: 'CEO',
          isFaceRegistered: false,
          updatedAt: new Date()
        } 
      }
    );

    // 2. Update existing Admins (HR)
    console.log('Migrating HR Admins...');
    await users.updateMany(
      { role: 'admin' },
      { 
        $set: { 
          role: 'admin', 
          position: 'HR',
          isFaceRegistered: false,
          updatedAt: new Date()
        } 
      }
    );

    // 3. Update Staff to Facilitators
    console.log('Migrating Staff to Facilitators...');
    await users.updateMany(
      { role: 'staff' },
      { 
        $set: { 
          role: 'facilitator', 
          position: 'Facilitator',
          isFaceRegistered: false,
          updatedAt: new Date()
        } 
      }
    );

    // 4. Update Participants
    console.log('Initializing Participants...');
    await users.updateMany(
      { role: 'participant' },
      { 
        $set: { 
          isFaceRegistered: false,
          updatedAt: new Date()
        } 
      }
    );

    // 5. Global Cleanup: Ensure all users have isFaceRegistered
    await users.updateMany(
      { isFaceRegistered: { $exists: false } },
      { $set: { isFaceRegistered: false } }
    );

    console.log('Migration complete!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrate();
