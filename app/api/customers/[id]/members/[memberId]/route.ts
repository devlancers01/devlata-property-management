import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { adminDb } from "@/lib/firebase/admin";

// PATCH: Update a group member
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, memberId } = await params;
    const body = await req.json();

    // Remove undefined values
    const cleanData: any = {};
    if (body.name) cleanData.name = body.name;
    if (body.age) cleanData.age = body.age;
    if (body.idType) cleanData.idType = body.idType;
    if (body.idValue !== undefined) cleanData.idValue = body.idValue;
    if (body.idProofUrl !== undefined) cleanData.idProofUrl = body.idProofUrl;

    await adminDb
      .collection("customers")
      .doc(id)
      .collection("members")
      .doc(memberId)
      .update(cleanData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update member" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a group member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, memberId } = await params;

    await adminDb
      .collection("customers")
      .doc(id)
      .collection("members")
      .doc(memberId)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete member" },
      { status: 500 }
    );
  }
}