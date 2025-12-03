import { Timestamp } from "firebase-admin/firestore";
import { Permission, RoleModel as RoleType } from "@/types/roles";

export type { RoleModel } from "@/types/roles";

export interface RoleCreateInput {
  name: string;
  displayName: string;
  permissions: Permission[];
}

export interface RoleUpdateInput {
  displayName?: string;
  permissions?: Permission[];
}

export interface RolePublic {
  uid: string;
  name: string;
  displayName: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Convert Firestore doc to RolePublic
export function toRolePublic(role: RoleType): RolePublic {
  const { createdAt, updatedAt, ...rest } = role;
  return {
    ...rest,
    createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : createdAt,
    updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate() : updatedAt,
  };
}