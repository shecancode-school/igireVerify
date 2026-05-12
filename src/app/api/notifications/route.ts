import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthClaimsFromCookies } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
    const claims = await getAuthClaimsFromCookies();
    if (!claims) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const notifications = db.collection("notifications");

    const orConditions: any[] = [
      { recipientId: new ObjectId(claims.userId) },
      { recipientId: claims.role },
      { recipientId: "all" },
    ];

    if (claims.programId) {
      orConditions.push({ recipientId: new ObjectId(claims.programId) });
    }

    // Fetch notifications for this user, their role, their program, or "all"
    const userNotifications = await notifications
      .find({ $or: orConditions })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ notifications: userNotifications });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const claims = await getAuthClaimsFromCookies();
    if (!claims || (claims.role !== "admin" && claims.role !== "super-admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, recipientId, type } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const db = await getDb();
    const notifications = db.collection("notifications");

    const newNotification = {
      title,
      message,
      recipientId: recipientId === "all" || recipientId === "staff" || recipientId === "participant" 
        ? recipientId 
        : new ObjectId(recipientId),
      senderId: new ObjectId(claims.userId),
      senderName: claims.name,
      type: type || "broadcast",
      readBy: [],
      createdAt: new Date(),
    };

    const result = await notifications.insertOne(newNotification);
    return NextResponse.json({ success: true, notificationId: result.insertedId });
  } catch (error) {
    console.error("Notifications POST error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
