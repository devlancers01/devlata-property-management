import { adminDb } from "./admin";
import { User, OTPRecord, Permission, DEFAULT_ROLE_PERMISSIONS } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

// ==================== USER OPERATIONS ====================

export async function getUserByEmail(email: string): Promise<User | null> {
  const snapshot = await adminDb
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { uid: doc.id, ...doc.data() } as User;
}

export async function getUserById(uid: string): Promise<User | null> {
  const doc = await adminDb.collection("users").doc(uid).get();
  if (!doc.exists) return null;
  return { uid: doc.id, ...doc.data() } as User;
}

export async function createUser(data: {
  email: string;
  name: string;
  role: "admin" | "staff";
  phone?: string;
  passwordHash: string;
}): Promise<User> {
  const now = new Date();
  
  const userData: Omit<User, "uid"> & { passwordHash: string } = {
    email: data.email,
    name: data.name,
    role: data.role,
    phone: data.phone || "",
    active: true,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
    customPermissions: [],
    passwordHash: data.passwordHash,
  };

  const docRef = await adminDb.collection("users").add(userData);
  
  return {
    uid: docRef.id,
    ...userData,
  };
}

export async function updateUserEmailVerification(uid: string): Promise<void> {
  await adminDb.collection("users").doc(uid).update({
    emailVerified: true,
    updatedAt: new Date(),
  });
}

export async function updateUserPassword(uid: string, passwordHash: string): Promise<void> {
  await adminDb.collection("users").doc(uid).update({
    passwordHash,
    updatedAt: new Date(),
  });
}

export async function getUserPermissions(uid: string): Promise<Permission[]> {
  const user = await getUserById(uid);
  if (!user) return [];

  // Merge default role permissions + custom permissions
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
  const customPermissions = user.customPermissions || [];

  return [...new Set([...rolePermissions, ...customPermissions])];
}

export async function updateUserPermissions(
  uid: string,
  permissions: Permission[]
): Promise<void> {
  await adminDb.collection("users").doc(uid).update({
    customPermissions: permissions,
    updatedAt: new Date(),
  });
}

export async function toggleUserStatus(uid: string, active: boolean): Promise<void> {
  await adminDb.collection("users").doc(uid).update({
    active,
    updatedAt: new Date(),
  });
}

// ==================== OTP OPERATIONS ====================

export async function createOTP(
  email: string,
  purpose: "email_verification" | "password_reset" | "login_2fa"
): Promise<string> {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const otpData: OTPRecord = {
    email,
    otp,
    expiresAt,
    purpose,
    verified: false,
    createdAt: new Date(),
  };

  // Delete any existing OTPs for this email + purpose
  const existingOTPs = await adminDb
    .collection("otps")
    .where("email", "==", email)
    .where("purpose", "==", purpose)
    .get();

  const batch = adminDb.batch();
  existingOTPs.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  // Create new OTP
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

  // Check expiration
  const expiresAt = (data.expiresAt as any)?.toDate ? (data.expiresAt as any).toDate() : (data.expiresAt as Date);
  if (new Date() > expiresAt) {
    await doc.ref.delete();
    return false;
  }

  // Mark as verified
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

// ==================== ROLE MANAGEMENT ====================

export async function getAllUsers(): Promise<User[]> {
  const snapshot = await adminDb
    .collection("users")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data(),
  })) as User[];
}

export async function updateUserRole(
  uid: string,
  role: "admin" | "staff"
): Promise<void> {
  await adminDb.collection("users").doc(uid).update({
    role,
    updatedAt: new Date(),
  });
}