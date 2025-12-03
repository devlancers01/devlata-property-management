import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getAllUsers, createUser } from "@/lib/firebase/users";
import { getRoleByName } from "@/lib/firebase/roles";
import { generateTemporaryPassword } from "@/lib/utils/password";
import { sendUserCreationEmail } from "@/lib/email/user-emails";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("users.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await getAllUsers();

    return NextResponse.json({ users }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
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
    if (!session.user.permissions?.includes("users.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, role, active } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, role" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if role exists
    const roleExists = await getRoleByName(role);
    if (!roleExists) {
      return NextResponse.json(
        { error: `Role '${role}' does not exist` },
        { status: 400 }
      );
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Create user (passing tempPassword as second argument)
    const user = await createUser({
      name,
      email,
      phone: phone || "",
      role,
      active: active !== undefined ? active : true,
    }, temporaryPassword);

    // Get role display name for email
    const roleDisplayName = roleExists.displayName || role;

    // Send creation email (passing all 4 required arguments)
    try {
      await sendUserCreationEmail(email, name, temporaryPassword, roleDisplayName);
    } catch (emailError) {
      console.error("Error sending creation email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}