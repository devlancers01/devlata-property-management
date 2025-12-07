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
  | "expenses.edit"
  | "expenses.delete"
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
  | "roles.delete"
  | "staff.create"
  | "staff.edit"
  | "staff.delete"
  | "staff.view"
  | "staff.payments.view"
  | "staff.expenses.view"
  | "staff.documents.view"
  | "staff.documents.create"
  | "staff.documents.edit"
  | "staff.documents.delete"
  | "staff.payments.create"
  | "staff.payments.edit"
  | "staff.payments.delete"
  | "staff.expenses.create"
  | "staff.expenses.edit"
  | "staff.expenses.delete"
  | "staff.documents.create"
  | "staff.documents.edit"
  | "staff.documents.delete"
  | "sales.create"
  | "sales.edit"
  | "sales.delete"
  | "sales.view";

    
  export interface PermissionMeta {
  key: Permission;
  displayName: string;
  category: "customers" | "bookings" | "payments" | "sales" | "expenses" | "staff" | "settings" | "users" | "roles";
  description: string;
}

export const ALL_PERMISSIONS: PermissionMeta[] = [
  // Customers
  { key: "customers.view", displayName: "View Customers", category: "customers", description: "View customer list and details" },
  { key: "customers.create", displayName: "Create Customers", category: "customers", description: "Create new customer bookings" },
  { key: "customers.edit", displayName: "Edit Customers", category: "customers", description: "Edit customer information" },
  { key: "customers.delete", displayName: "Delete Customers", category: "customers", description: "Delete customer records" },

  { key: "sales.view", displayName: "View Sales", category: "sales", description: "View sales records" },
  { key: "sales.create", displayName: "Create Sales", category: "sales", description: "Add new sales records" },
  { key: "sales.edit", displayName: "Edit Sales", category: "sales", description: "Modify sales records" },
  { key: "sales.delete", displayName: "Delete Sales", category: "sales", description: "Remove sales records" },

  // Expenses
  { key: "expenses.view", displayName: "View Expenses", category: "expenses", description: "View expense records" },
  { key: "expenses.create", displayName: "Create Expenses", category: "expenses", description: "Add new expense records" },
  { key: "expenses.edit", displayName: "Edit Expenses", category: "expenses", description: "Modify expense records" },
  { key: "expenses.delete", displayName: "Delete Expenses", category: "expenses", description: "Remove expense records" },

  // Users Management
  {
    key: "users.view",
    displayName: "View Users",
    category: "users",
    description: "View user list and details",
  },
  {
    key: "users.create",
    displayName: "Create Users",
    category: "users",
    description: "Add new users to the system",
  },
  {
    key: "users.edit",
    displayName: "Edit Users",
    category: "users",
    description: "Modify user information",
  },
  {
    key: "users.delete",
    displayName: "Delete Users",
    category: "users",
    description: "Remove users from the system",
  },

  // Roles Management
  {
    key: "roles.view",
    displayName: "View Roles",
    category: "roles",
    description: "View roles and permissions",
  },
  {
    key: "roles.create",
    displayName: "Create Roles",
    category: "roles",
    description: "Create new roles",
  },
  {
    key: "roles.edit",
    displayName: "Edit Roles",
    category: "roles",
    description: "Modify role permissions",
  },
  {
    key: "roles.delete",
    displayName: "Delete Roles",
    category: "roles",
    description: "Remove custom roles",
  },

  // Bookings Management
  {
    key: "bookings.view",
    displayName: "View Bookings",
    category: "bookings",
    description: "View customer bookings",
  },
  {
    key: "bookings.create",
    displayName: "Create Bookings",
    category: "bookings",
    description: "Create new bookings",
  },
  {
    key: "bookings.edit",
    displayName: "Edit Bookings",
    category: "bookings",
    description: "Modify booking details",
  },
  {
    key: "bookings.delete",
    displayName: "Delete Bookings",
    category: "bookings",
    description: "Cancel and delete bookings",
  },

  // Staff Management
  {
    key: "staff.view",
    displayName: "View Staff",
    category: "staff",
    description: "View staff list and details",
  },
  {
    key: "staff.create",
    displayName: "Add Staff",
    category: "staff",
    description: "Add new staff members",
  },
  {
    key: "staff.edit",
    displayName: "Edit Staff",
    category: "staff",
    description: "Modify staff information",
  },
  {
    key: "staff.delete",
    displayName: "Remove Staff",
    category: "staff",
    description: "Remove staff members",
  },
  {
    key: "staff.payments.view",
    displayName: "View Staff Payments",
    category: "staff",
    description: "View staff payment history",
  },
  {
    key: "staff.payments.create",
    displayName: "Add Staff Payments",
    category: "staff",
    description: "Record staff payments and salaries",
  },
  {
    key: "staff.payments.edit",
    displayName: "Edit Staff Payments",
    category: "staff",
    description: "Modify payment records",
  },
  {
    key: "staff.payments.delete",
    displayName: "Delete Staff Payments",
    category: "staff",
    description: "Remove payment records",
  },
  {
    key: "staff.expenses.view",
    displayName: "View Staff Expenses",
    category: "staff",
    description: "View staff expense records",
  },
  {
    key: "staff.expenses.create",
    displayName: "Add Staff Expenses",
    category: "staff",
    description: "Record staff expenses",
  },
  {
    key: "staff.expenses.edit",
    displayName: "Edit Staff Expenses",
    category: "staff",
    description: "Modify expense records",
  },
  {
    key: "staff.expenses.delete",
    displayName: "Delete Staff Expenses",
    category: "staff",
    description: "Remove expense records",
  },
  {
    key: "staff.documents.view",
    displayName: "View Staff Documents",
    category: "staff",
    description: "View uploaded staff documents",
  },
  {
    key: "staff.documents.create",
    displayName: "Upload Staff Documents",
    category: "staff",
    description: "Upload staff documents",
  },
  {
    key: "staff.documents.delete",
    displayName: "Delete Staff Documents",
    category: "staff",
    description: "Remove uploaded documents",
  },

  
];

export interface Role {
  uid: string;
  name: string;
  displayName: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}
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