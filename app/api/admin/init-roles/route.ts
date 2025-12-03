import { NextRequest, NextResponse } from "next/server";
import { initializeSystemRoles } from "@/lib/firebase/roles";

// POST: Initialize system roles (admin & staff)
// This should be called once during setup
export async function POST(req: NextRequest) {
  try {
    // Optionally add authentication check here
    await initializeSystemRoles();

    return NextResponse.json({
      success: true,
      message: "System roles initialized successfully",
    });
  } catch (error: any) {
    console.error("Initialize roles error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize roles" },
      { status: 500 }
    );
  }
}