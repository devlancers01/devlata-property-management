import { adminDb, adminAuth } from "./admin";
import { UserModel, UserCreateInput, UserUpdateInput } from "@/models/user.model";
import { Permission } from "@/types/roles";
import { Timestamp } from "firebase-admin/firestore";
import { User, OTPRecord } from "@/types";

// Helper to convert Timestamp to Date
function toDate(value: Date | Timestamp): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as any).toDate();
  }
  return value as Date;
}

// ==================== USER OPERATIONS ====================

export async function getUserByEmail(email: string): Promise<UserModel | null> {
  try {
    const snapshot = await adminDb
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      uid: doc.id,
      ...data,
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
    } as UserModel;
  } catch (error) {
    console.error("Error in getUserByEmail:", error);
    throw error;
  }
}

export async function getUserById(uid: string): Promise<UserModel | null> {
  const doc = await adminDb.collection("users").doc(uid).get();
  if (!doc.exists) return null;
  
  const data = doc.data();
  return {
    uid: doc.id,
    ...data,
    createdAt: data!.createdAt ? toDate(data!.createdAt) : new Date(),
    updatedAt: data!.updatedAt ? toDate(data!.updatedAt) : new Date(),
  } as UserModel;
}

export async function createUser(data: UserCreateInput, tempPassword: string): Promise<UserModel> {
  try {
    // Check if email already exists
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create user in Firebase Auth first
    const firebaseUser = await adminAuth.createUser({
      email: data.email,
      password: tempPassword,
      displayName: data.name,
      emailVerified: false,
    });

    // Now create in Firestore with retry logic
    const userRef = adminDb.collection("users").doc(firebaseUser.uid);
    const now = Timestamp.now();

    const userData: Omit<UserModel, "uid"> = {
      email: data.email,
      name: data.name,
      role: data.role,
      phone: data.phone || "",
      active: data.active !== undefined ? data.active : true,
      customPermissions: data.customPermissions || [],
      createdAt: now,
      updatedAt: now,
    };

    let retries = 3;
    let firestoreSuccess = false;

    while (retries > 0 && !firestoreSuccess) {
      try {
        await userRef.set(userData);
        firestoreSuccess = true;
      } catch (firestoreError) {
        retries--;
        if (retries === 0) {
          // If Firestore fails after retries, delete Firebase Auth user
          await adminAuth.deleteUser(firebaseUser.uid);
          throw new Error("Failed to create user in database after retries");
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      uid: firebaseUser.uid,
      ...userData,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  } catch (error: any) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function updateUser(uid: string, data: UserUpdateInput): Promise<void> {
  try {
    const updateData: any = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    // Update Firestore
    await adminDb.collection("users").doc(uid).update(updateData);

    // Update Firebase Auth if name changed
    if (data.name) {
      await adminAuth.updateUser(uid, {
        displayName: data.name,
      });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export async function deleteUser(uid: string): Promise<void> {
  try {
    // Delete from Firestore
    await adminDb.collection("users").doc(uid).delete();

    // Delete from Firebase Auth
    await adminAuth.deleteUser(uid);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

export async function toggleUserStatus(uid: string, active: boolean): Promise<void> {
  await adminDb.collection("users").doc(uid).update({
    active,
    updatedAt: Timestamp.now(),
  });

  // Also disable/enable in Firebase Auth
  await adminAuth.updateUser(uid, {
    disabled: !active,
  });
}

export async function getAllUsers(): Promise<UserModel[]> {
  const snapshot = await adminDb
    .collection("users")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
    } as UserModel;
  });
}

export async function getUserPermissions(uid: string): Promise<Permission[]> {
  const user = await getUserById(uid);
  if (!user) return [];

  // Get role permissions from roles collection
  const { getRolePermissions } = await import("./roles");
  const rolePermissions = await getRolePermissions(user.role);
  const customPermissions = user.customPermissions || [];

  // Merge and deduplicate
  return [...new Set([...rolePermissions, ...customPermissions])];
}

export async function updateUserPermissions(
  uid: string,
  permissions: Permission[]
): Promise<void> {
  await adminDb.collection("users").doc(uid).update({
    customPermissions: permissions,
    updatedAt: Timestamp.now(),
  });
}

export async function updateUserRole(uid: string, role: string): Promise<void> {
  await adminDb.collection("users").doc(uid).update({
    role,
    updatedAt: Timestamp.now(),
  });
}

// ==================== OTP OPERATIONS ====================

export async function createOTP(
  email: string,
  purpose: "email_verification" | "password_reset" | "login_2fa"
): Promise<string> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const otpData: OTPRecord = {
    email,
    otp,
    expiresAt,
    purpose,
    verified: false,
    createdAt: new Date(),
  };

  const existingOTPs = await adminDb
    .collection("otps")
    .where("email", "==", email)
    .where("purpose", "==", purpose)
    .get();

  const batch = adminDb.batch();
  existingOTPs.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  await adminDb.collection("otps").add(otpData);

  return otp;
}

export async function verifyOTP(
  email: string,
  otp: string,
  purpose: "email_verification" | "password_reset" | "login_2fa"
): Promise<boolean> {
  const snapshot = await adminDb
    .collection("otps")
    .where("email", "==", email)
    .where("otp", "==", otp)
    .where("purpose", "==", purpose)
    .where("verified", "==", false)
    .limit(1)
    .get();

  if (snapshot.empty) return false;

  const doc = snapshot.docs[0];
  const data = doc.data() as OTPRecord;

  const expiresAt = (data.expiresAt as any)?.toDate ? (data.expiresAt as any).toDate() : (data.expiresAt as Date);
  if (new Date() > expiresAt) {
    await doc.ref.delete();
    return false;
  }

  await doc.ref.update({ verified: true });

  return true;
}

export async function deleteVerifiedOTPs(email: string): Promise<void> {
  const snapshot = await adminDb
    .collection("otps")
    .where("email", "==", email)
    .where("verified", "==", true)
    .get();

  const batch = adminDb.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}