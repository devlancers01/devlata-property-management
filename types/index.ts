// Core Permission Type - matches roles.ts
export type Permission =
  // Customer permissions
  | "customers.view"
  | "customers.create"
  | "customers.edit"
  | "customers.delete"
  // Booking permissions
  | "bookings.view"
  | "bookings.create"
  | "bookings.edit"
  | "bookings.delete"
  // Payment permissions
  | "payments.view"
  | "payments.create"
  // Sales permissions
  | "sales.view"
  | "sales.create"
  | "sales.edit"
  | "sales.delete"
  // Expense permissions
  | "expenses.view"
  | "expenses.create"
  // Staff permissions
  | "staff.view"
  | "staff.create"
  | "staff.edit"
  | "staff.delete"
  // Settings permissions
  | "settings.view"
  | "settings.edit"
  // User management permissions
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  // Role management permissions
  | "roles.view"
  | "roles.create"
  | "roles.edit"
  | "roles.delete";

export interface User {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "staff";
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

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
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
    "sales.create",
    "sales.edit",
    "sales.delete",
    "expenses.view",
    "expenses.create",
    "staff.view",
    "staff.create",
    "staff.edit",
    "staff.delete",
    "settings.view",
    "settings.edit",
    "users.view",
    "users.create",
    "users.edit",
    "users.delete",
    "roles.view",
    "roles.create",
    "roles.edit",
    "roles.delete",
  ],
  staff: [
    "customers.view",
    "bookings.view",
    "payments.view",
  ],
};