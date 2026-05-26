import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthClaimsFromCookies } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const claims = await getAuthClaimsFromCookies();
    if (!claims) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const notifications = db.collection("notifications");

    await notifications.updateOne(
      { _id: new ObjectId(notificationId) },
      { $addToSet: { readBy: new ObjectId(claims.userId) } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications Read POST error:", error);
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 });
  }
}
