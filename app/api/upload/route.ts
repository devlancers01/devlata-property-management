import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { adminStorage } from "@/lib/firebase/admin";

// Increase body parser limit for this route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExtension = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `staff-documents/${fileName}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Firebase Storage
    const bucket = adminStorage.bucket();
    const fileUpload = bucket.file(filePath);

    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make file publicly accessible
    await fileUpload.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}