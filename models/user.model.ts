import { Timestamp } from "firebase-admin/firestore";
import { UserRole, Permission } from "@/types";

export interface UserModel {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  active: boolean;
  emailVerified: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  customPermissions: Permission[];
  passwordHash: string;
}

export interface UserCreateInput {
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  passwordHash: string;
}

export interface UserUpdateInput {
  name?: string;
  role?: UserRole;
  phone?: string;
  active?: boolean;
  customPermissions?: Permission[];
}

export interface UserPublic {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  active: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  customPermissions: Permission[];
}

// Convert Firestore doc to UserPublic (remove passwordHash)
export function toUserPublic(user: UserModel): UserPublic {
  const { passwordHash, createdAt, updatedAt, ...rest } = user;
  return {
    ...rest,
    createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : createdAt,
    updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate() : updatedAt,
  };
}