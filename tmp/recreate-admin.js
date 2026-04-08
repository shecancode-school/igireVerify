const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function recreateAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('IgireVerify'); 
    const users = db.collection('users');

    const email = 'thierry@igirerwanda.org';
    const password = '@@@@@@@@@@@@@@1234567890THIERRYadmin@RIO.com';
    const name = 'Thierry Admin';

    console.log(`Checking if user ${email} already exists...`);
    const existing = await users.findOne({ email });
    if (existing) {
      console.log('User already exists. Deleting the old one to restore correct credentials...');
      await users.deleteOne({ email });
    }

    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);

    console.log('Inserting admin user...');
    await users.insertOne({
      name,
      email,
      passwordHash,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    });

    console.log('Admin account restored successfully!');
  } catch (err) {
    console.error('Error recreating admin:', err);
  } finally {
    await client.close();
  }
}

recreateAdmin();
