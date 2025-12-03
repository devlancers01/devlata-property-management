import { Timestamp } from "firebase-admin/firestore";
import { Permission } from "@/types/roles";

export interface UserModel {
  uid: string;
  email: string;
  name: string;
  role: string; // Dynamic role name (e.g., "admin", "staff", "manager")
  phone: string;
  active: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  customPermissions: Permission[];
}

export interface UserCreateInput {
  email: string;
  name: string;
  role: string;
  phone?: string;
  active?: boolean;
  customPermissions?: Permission[];
}

export interface UserUpdateInput {
  name?: string;
  role?: string;
  phone?: string;
  active?: boolean;
  customPermissions?: Permission[];
}

export interface UserPublic {
  uid: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  customPermissions: Permission[];
}

// Convert Firestore doc to UserPublic
export function toUserPublic(user: UserModel): UserPublic {
  const { createdAt, updatedAt, ...rest } = user;
  return {
    ...rest,
    createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : createdAt,
    updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate() : updatedAt,
  };
}