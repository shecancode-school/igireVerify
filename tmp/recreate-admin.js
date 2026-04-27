const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');


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
    const db = client.db('igireverify'); 
    const users = db.collection('users');

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'Admin';

    if (!email || !password) {
      console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local');
      process.exit(1);
    }

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
