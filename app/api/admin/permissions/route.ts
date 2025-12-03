import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { ALL_PERMISSIONS } from "@/types/roles";

// GET: Fetch all available permissions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("roles.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Group permissions by category
    const permissionsByCategory = ALL_PERMISSIONS.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {} as Record<string, typeof ALL_PERMISSIONS>);

    return NextResponse.json({
      permissions: ALL_PERMISSIONS,
      permissionsByCategory,
    });
  } catch (error: any) {
    console.error("Fetch permissions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}