import { getDb } from "../lib/mongodb";

async function initializeDatabase() {
  try {
    console.log("Connecting to database for initialization...");
    const db = await getDb();

    console.log("Creating unique index for users(email)...");
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    
    console.log("Creating index for users(programId)...");
    await db.collection("users").createIndex({ programId: 1 });

    console.log("Creating compound index for attendance...");
    
    await db.collection("attendance").createIndex(
      { userId: 1, programId: 1, date: 1 },
      { name: "attendance_lookup" }
    );

    console.log("Creating index for attendance(programId)...");
    await db.collection("attendance").createIndex({ programId: 1 });

    console.log("Creating index for attendance(date)...");
    await db.collection("attendance").createIndex({ date: -1 });

    console.log("Database initialized successfully with performance indexes.");
    process.exit(0);
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

initializeDatabase();
