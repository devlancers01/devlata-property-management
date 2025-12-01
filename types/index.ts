export type UserRole = "admin" | "staff";

export type Permission = 
  | "customers.view"
  | "customers.create"
  | "customers.edit"
  | "customers.delete"
  | "bookings.view"
  | "bookings.create"
  | "bookings.edit"
  | "bookings.delete"
  | "payments.view"
  | "payments.create"
  | "sales.view"
  | "expenses.view"
  | "expenses.create"
  | "staff.view"
  | "settings.view"
  | "settings.edit"
  | "users.view"
  | "users.create"
  | "users.edit"
  | "roles.manage";

export interface RolePermissions {
  [key: string]: Permission[];
}

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  customPermissions?: Permission[];
}

export interface OTPRecord {
  email: string;
  otp: string;
  expiresAt: Date;
  purpose: "email_verification" | "password_reset" | "login_2fa";
  verified: boolean;
  createdAt: Date;
}

// Default role permissions
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    "customers.view",
    "customers.create",
    "customers.edit",
    "customers.delete",
    "bookings.view",
    "bookings.create",
    "bookings.edit",
    "bookings.delete",
    "payments.view",
    "payments.create",
    "sales.view",
    "expenses.view",
    "expenses.create",
    "staff.view",
    "settings.view",
    "settings.edit",
    "users.view",
    "users.create",
    "users.edit",
    "roles.manage",
  ],
  staff: [
    "customers.view",
    "bookings.view",
    "payments.view",
  ],
};