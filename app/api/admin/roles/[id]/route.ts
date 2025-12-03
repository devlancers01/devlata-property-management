import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getRoleById, updateRole, deleteRole } from "@/lib/firebase/roles";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("roles.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const role = await getRoleById(id);

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ role }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch role" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("roles.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { displayName, permissions } = body;

    // Validate at least one field to update
    if (!displayName && !permissions) {
      return NextResponse.json(
        { error: "At least one field must be provided for update" },
        { status: 400 }
      );
    }

    // Validate permissions if provided
    if (permissions && (!Array.isArray(permissions) || permissions.length === 0)) {
      return NextResponse.json(
        { error: "Permissions must be a non-empty array" },
        { status: 400 }
      );
    }

    const { id } = await params;
    const role = await updateRole(id, {
      displayName,
      permissions,
    });

    return NextResponse.json({ role }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("roles.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await deleteRole(id);

    return NextResponse.json({ message: "Role deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete role" },
      { status: 500 }
    );
  }
}