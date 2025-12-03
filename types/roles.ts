import { Timestamp } from "firebase-admin/firestore";

// Dynamic permission type
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
  | "users.delete"
  | "roles.view"
  | "roles.create"
  | "roles.edit"
  | "roles.delete";

// Permission metadata for UI
export interface PermissionMeta {
  key: Permission;
  displayName: string;
  category: "customers" | "bookings" | "payments" | "sales" | "expenses" | "staff" | "settings" | "users" | "roles";
  description: string;
}

// All available permissions with metadata
export const ALL_PERMISSIONS: PermissionMeta[] = [
  // Customers
  { key: "customers.view", displayName: "View Customers", category: "customers", description: "View customer list and details" },
  { key: "customers.create", displayName: "Create Customers", category: "customers", description: "Create new customer bookings" },
  { key: "customers.edit", displayName: "Edit Customers", category: "customers", description: "Edit customer information" },
  { key: "customers.delete", displayName: "Delete Customers", category: "customers", description: "Delete customer records" },
  
  // Bookings
  { key: "bookings.view", displayName: "View Bookings", category: "bookings", description: "View booking calendar and reservations" },
  { key: "bookings.create", displayName: "Create Bookings", category: "bookings", description: "Create new bookings" },
  { key: "bookings.edit", displayName: "Edit Bookings", category: "bookings", description: "Edit existing bookings" },
  { key: "bookings.delete", displayName: "Delete Bookings", category: "bookings", description: "Delete bookings" },
  
  // Payments
  { key: "payments.view", displayName: "View Payments", category: "payments", description: "View payment records" },
  { key: "payments.create", displayName: "Create Payments", category: "payments", description: "Record new payments" },
  
  // Sales
  { key: "sales.view", displayName: "View Sales", category: "sales", description: "View sales reports and analytics" },
  
  // Expenses
  { key: "expenses.view", displayName: "View Expenses", category: "expenses", description: "View expense records" },
  { key: "expenses.create", displayName: "Create Expenses", category: "expenses", description: "Add new expenses" },
  
  // Staff
  { key: "staff.view", displayName: "View Staff", category: "staff", description: "View staff information" },
  
  // Settings
  { key: "settings.view", displayName: "View Settings", category: "settings", description: "View system settings" },
  { key: "settings.edit", displayName: "Edit Settings", category: "settings", description: "Modify system settings" },
  
  // Users
  { key: "users.view", displayName: "View Users", category: "users", description: "View user list" },
  { key: "users.create", displayName: "Create Users", category: "users", description: "Create new users" },
  { key: "users.edit", displayName: "Edit Users", category: "users", description: "Edit user information" },
  { key: "users.delete", displayName: "Delete Users", category: "users", description: "Delete user accounts" },
  
  // Roles
  { key: "roles.view", displayName: "View Roles", category: "roles", description: "View roles and permissions" },
  { key: "roles.create", displayName: "Create Roles", category: "roles", description: "Create new roles" },
  { key: "roles.edit", displayName: "Edit Roles", category: "roles", description: "Edit role permissions" },
  { key: "roles.delete", displayName: "Delete Roles", category: "roles", description: "Delete custom roles" },
];

// Role model for Firestore
export interface RoleModel {
  uid: string;
  name: string; // "admin", "staff", "manager", etc.
  displayName: string; // "Administrator", "Staff Member", "Manager"
  permissions: Permission[];
  isSystemRole: boolean; // true for admin/staff (cannot delete)
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// Role creation input
export interface RoleCreateInput {
  name: string;
  displayName: string;
  permissions: Permission[];
}

// Role update input
export interface RoleUpdateInput {
  displayName?: string;
  permissions?: Permission[];
}