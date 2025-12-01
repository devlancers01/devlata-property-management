import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import {
  createUser,
  getAllUsers,
  updateUserRole,
  updateUserPermissions,
  toggleUserStatus,
} from "@/lib/firebase/firestore";
import { sendOTPEmail } from "@/lib/email/mailer";
import { createOTP } from "@/lib/firebase/firestore";
import bcrypt from "bcryptjs";

// GET: Fetch all users (Admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await getAllUsers();

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST: Create new user (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, name, role, phone, password } = await req.json();

    if (!email || !name || !role || !password) {
      return NextResponse.json(
        { error: "Email, name, role, and password required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["admin", "staff"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await require("@/lib/firebase/firestore").getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password (simple validation - min 6 chars)
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await createUser({
      email,
      name,
      role,
      phone,
    });

    // Send email verification OTP
    const otp = await createOTP(email, "email_verification");
    await sendOTPEmail(email, otp, "email_verification");

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: "User created. Verification email sent.",
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// PATCH: Update user role or permissions (Admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uid, role, permissions, active } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Update role if provided
    if (role) {
      if (!["admin", "staff"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      await updateUserRole(uid, role);
    }

    // Update permissions if provided
    if (permissions) {
      await updateUserPermissions(uid, permissions);
    }

    // Update active status if provided
    if (typeof active === "boolean") {
      await toggleUserStatus(uid, active);
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}