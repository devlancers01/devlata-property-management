import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getUserById, updateUser, deleteUser } from "@/lib/firebase/users";
import { getRoleByName } from "@/lib/firebase/roles";
import { sendRoleChangeEmail, sendAccountStatusEmail } from "@/lib/email/user-emails";

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
    if (!session.user.permissions?.includes("users.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user" },
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
    if (!session.user.permissions?.includes("users.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, phone, role, active, customPermissions } = body;

    const { id } = await params;

    // Get current user to compare changes
    const currentUser = await getUserById(id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate role if provided
    let roleExists = null;
    if (role && role !== currentUser.role) {
      roleExists = await getRoleByName(role);
      if (!roleExists) {
        return NextResponse.json(
          { error: `Role '${role}' does not exist` },
          { status: 400 }
        );
      }
    }

    // Validate customPermissions if provided
    if (customPermissions && !Array.isArray(customPermissions)) {
      return NextResponse.json(
        { error: "customPermissions must be an array" },
        { status: 400 }
      );
    }

    // Update user
    await updateUser(id, {
      name,
      phone,
      role,
      active,
      customPermissions,
    });

    // Get updated user for response
    const updatedUser = await getUserById(id);

    // Send email notifications
    try {
      // Role change notification
      if (role && role !== currentUser.role && updatedUser) {
        await sendRoleChangeEmail(
          updatedUser.email, 
          updatedUser.name, 
          currentUser.role, 
          role
        );
      }

      // Status change notification
      if (active !== undefined && active !== currentUser.active && updatedUser) {
        await sendAccountStatusEmail(updatedUser.email, updatedUser.name, active);
      }
    } catch (emailError) {
      console.error("Error sending notification email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
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
    if (!session.user.permissions?.includes("users.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    await deleteUser(id);

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}