const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "igireverify";

async function seed() {
  if (!MONGODB_URI) {
    console.error("Please define the MONGODB_URI environment variable inside .env.local");
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    const programs = db.collection('programs');

    const corePrograms = [
      {
        name: "Web Fundamentals",
        code: "web-fundamentals",
        description: "Introduction to HTML, CSS, and basic JavaScript. Building the foundation of web development.",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        schedule: {
          checkInStart: "08:00",
          checkInEnd: "08:30",
          classStart: "09:00",
          checkOutStart: "17:00",
          checkOutEnd: "17:30",
          lateAfter: "08:15",
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Advanced Frontend",
        code: "advanced-frontend",
        description: "Mastering React, Next.js, and modern CSS frameworks like Tailwind. Focusing on UX/UI and performance.",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        schedule: {
          checkInStart: "08:00",
          checkInEnd: "08:30",
          classStart: "09:00",
          checkOutStart: "17:00",
          checkOutEnd: "17:30",
          lateAfter: "08:15",
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Advanced Backend",
        code: "advanced-backend",
        description: "Node.js, Express, MongoDB, and System Architecture. Building scalable and secure server-side applications.",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        schedule: {
          checkInStart: "08:00",
          checkInEnd: "08:30",
          classStart: "09:00",
          checkOutStart: "17:00",
          checkOutEnd: "17:30",
          lateAfter: "08:15",
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log("Seeding core programs...");

    for (const p of corePrograms) {
      const result = await programs.updateOne(
        { code: p.code },
        { $set: p },
        { upsert: true }
      );
      if (result.upsertedCount > 0) {
        console.log(`Created program: ${p.name}`);
      } else {
        console.log(`Updated program: ${p.name}`);
      }
    }

    console.log("Seeding complete!");

  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await client.close();
  }
}

seed();
