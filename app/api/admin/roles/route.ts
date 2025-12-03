import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getAllRoles, createRole } from "@/lib/firebase/roles";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("roles.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const roles = await getAllRoles();

    return NextResponse.json({ roles }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("roles.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, displayName, permissions } = body;

    // Validate required fields
    if (!name || !displayName || !permissions) {
      return NextResponse.json(
        { error: "Missing required fields: name, displayName, permissions" },
        { status: 400 }
      );
    }

    // Validate role name format (lowercase with underscores only)
    if (!/^[a-z_]+$/.test(name)) {
      return NextResponse.json(
        { error: "Role name must be lowercase with underscores only" },
        { status: 400 }
      );
    }

    // Validate permissions array
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json(
        { error: "Permissions must be a non-empty array" },
        { status: 400 }
      );
    }

    const role = await createRole({
      name,
      displayName,
      permissions,
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create role" },
      { status: 500 }
    );
  }
}