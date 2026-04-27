const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');


require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

async function restore() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in environment variables');
    process.exit(1);
  }
  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    const db = client.db('igire_verify');
    const users = db.collection('users');

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'Admin Thierry';

    if (!email || !password) {
      console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local');
      process.exit(1);
    }

    console.log("Cleaning up existing user with same email (if any)...");
    await users.deleteOne({ email });

    console.log("Hashing password...");
    const passwordHash = await bcrypt.hash(password, 12);
    
    console.log("Inserting admin user...");
    await users.insertOne({
      name,
      email,
      passwordHash,
      role: 'admin',
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log("Admin account RESTORED SUCCESSFUL!");
  } catch (err) {
    console.error("FATAL ERROR:", err);
  } finally {
    await client.close();
  }
}

restore();
