import { Timestamp } from "firebase/firestore";

// Staff Status
export type StaffStatus = "active" | "on_leave" | "resigned" | "terminated";

// Staff Designation
export const STAFF_DESIGNATIONS = [
  "Manager",
  "Cook",
  "Cleaner",
  "Security",
  "Maintenance",
  "Receptionist",
  "Accountant",
  "Driver",
  "Gardener",
  "Other",
] as const;

export type StaffDesignation = typeof STAFF_DESIGNATIONS[number];

// ID Proof Types
export const ID_PROOF_TYPES = [
  "Aadhar",
  "PAN",
  "Driving License",
  "Passport",
  "Other",
] as const;

export type IDProofType = typeof ID_PROOF_TYPES[number];

// Payment Mode
export const PAYMENT_MODES = ["cash", "UPI", "bank"] as const;
export type PaymentMode = typeof PAYMENT_MODES[number];

// Payment Type
export const PAYMENT_TYPES = [
  "salary",
  "advance",
  "bonus",
  "overtime",
  "other",
] as const;
export type PaymentType = typeof PAYMENT_TYPES[number];

// Expense Category
export const EXPENSE_CATEGORIES = [
  "fuel",
  "travel",
  "food",
  "uniform",
  "training",
  "medical",
  "other",
] as const;
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// Main Staff Model
export interface StaffModel {
  uid: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  phone: string;
  alternatePhone?: string;
  idProofType?: IDProofType;
  idProofValue?: string;
  idProofUrl?: string;
  designation: StaffDesignation;
  customDesignation?: string; // Used when designation is "Other"
  monthlySalary?: number;
  joiningDate: Date | Timestamp;
  leavingDate?: Date | Timestamp;
  status: StaffStatus;
  notes?: string; // Optional notes field
  totalPayments: number; // Sum of all payments
  totalExpenses: number; // Sum of all expenses
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Payment Record
export interface StaffPayment {
  uid: string;
  staffId: string;
  amount: number;
  mode: PaymentMode;
  type: PaymentType;
  month?: string; // Format: "YYYY-MM" for salary cycles
  receiptUrl?: string;
  notes?: string;
  date: Date | Timestamp;
  createdAt: Date | Timestamp;
}

// Expense Record
export interface StaffExpense {
  uid: string;
  staffId: string;
  amount: number;
  mode: PaymentMode;
  category: ExpenseCategory;
  customCategory?: string; // Used when category is "other"
  receiptUrl?: string;
  notes?: string;
  date: Date | Timestamp;
  createdAt: Date | Timestamp;
}

// Document Record
export interface StaffDocument {
  uid: string;
  staffId: string;
  description: string;
  documentUrl: string;
  uploadedAt: Date | Timestamp;
}

// Form Data Types
export interface StaffFormData {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  phone: string;
  alternatePhone?: string;
  idProofType?: IDProofType;
  idProofValue?: string;
  designation: StaffDesignation;
  customDesignation?: string;
  monthlySalary?: number;
  joiningDate: Timestamp | Date;
  status: StaffStatus;
  leavingDate?: Date;
  notes?: string;
}

export interface PaymentFormData {
  amount: number;
  mode: PaymentMode;
  type: PaymentType;
  month?: string;
  notes?: string;
  date: Date;
}

export interface ExpenseFormData {
  amount: number;
  mode: PaymentMode;
  category: ExpenseCategory;
  customCategory?: string;
  notes?: string;
  date: Date;
}