const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function restore() {
  const uri = "mongodb+srv://Admin:Admin%402026@igireverify.mv7kpau.mongodb.net/IgireVerify?retryWrites=true&w=majority";
  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    const db = client.db('IgireVerify');
    const users = db.collection('users');

    const email = 'thierry@igirerwanda.org';
    const password = '@@@@@@@@@@@@@@1234567890THIERRYadmin@RIO.com';
    const name = 'Admin Thierry';

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
