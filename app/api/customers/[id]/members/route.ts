import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getGroupMembers, addGroupMember } from "@/lib/firebase/customers";

// GET /api/customers/[id]/members - Get all group members
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; // ✅ Await params

    const members = await getGroupMembers(id);

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error("Error fetching group members:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch group members" },
      { status: 500 }
    );
  }
}

// POST /api/customers/[id]/members - Add a group member
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; // ✅ Await params

    const body = await req.json();
    const { name, age, idType, idValue, idProofUrl } = body;

    if (!name || !age || !idType) {
      return NextResponse.json(
        { error: "Name, age, and ID type are required" },
        { status: 400 }
      );
    }

    // Validate: either idValue or idProofUrl is required
    if (!idValue && !idProofUrl) {
      return NextResponse.json(
        { error: "Either ID number or ID proof image is required" },
        { status: 400 }
      );
    }

    const memberUid = await addGroupMember(id, {
      name,
      age,
      idType,
      idValue,
      idProofUrl,
    });

    return NextResponse.json({
      success: true,
      memberUid,
    });
  } catch (error: any) {
    console.error("Error adding group member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add group member" },
      { status: 500 }
    );
  }
}