import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { adminDb } from "@/lib/firebase/admin";
import { Notification } from "@/models/notification.model";

// Helper to convert Timestamp to Date
function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return value.toDate();
  }
  if (typeof value === "string") return new Date(value);
  return new Date();
}

// GET /api/notifications - Get user's notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = adminDb
      .collection("notifications")
      .where("userId", "==", session.user.id)
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (unreadOnly) {
      query = query.where("read", "==", false) as any;
    }

    const snapshot = await query.get();

    const notifications: Notification[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        expiresAt: data.expiresAt ? toDate(data.expiresAt) : undefined,
      } as Notification;
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST /api/notifications/mark-read - Mark notifications as read
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationIds } = body; // Array of notification IDs

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: "notificationIds array is required" },
        { status: 400 }
      );
    }

    const batch = adminDb.batch();

    for (const notificationId of notificationIds) {
      const notificationRef = adminDb.collection("notifications").doc(notificationId);
      batch.update(notificationRef, { read: true });
    }

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}