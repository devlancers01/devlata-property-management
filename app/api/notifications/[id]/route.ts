import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { adminDb } from "@/lib/firebase/admin";

// PATCH /api/notifications/[id] - Mark single notification as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify notification belongs to user
    const notificationRef = adminDb.collection("notifications").doc(id);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    const notification = notificationDoc.data();
    if (notification?.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await notificationRef.update({ read: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify notification belongs to user
    const notificationRef = adminDb.collection("notifications").doc(id);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    const notification = notificationDoc.data();
    if (notification?.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await notificationRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete notification" },
      { status: 500 }
    );
  }
}