import { Timestamp } from "firebase-admin/firestore";

// Expense Categories
export const MONTHLY_EXPENSE_CATEGORIES = [
  "food",
  "miscellaneous",
  "service",
  "maintenance",
  "staff",
  "refund",
  "other",
] as const;

export const YEARLY_EXPENSE_CATEGORIES = ["yearly"] as const;

export const ALL_EXPENSE_CATEGORIES = [
  ...MONTHLY_EXPENSE_CATEGORIES,
  "salary",
  "yearly",
] as const;

export type MonthlyExpenseCategory = typeof MONTHLY_EXPENSE_CATEGORIES[number];
export type YearlyExpenseCategory = typeof YEARLY_EXPENSE_CATEGORIES[number];
export type ExpenseCategory = typeof ALL_EXPENSE_CATEGORIES[number];

// Yearly Sub-categories
export const YEARLY_SUBCATEGORIES = [
  "GST",
  "Property Tax",
  "Water Tax",
  "Other",
] as const;

export type YearlySubCategory = typeof YEARLY_SUBCATEGORIES[number];

// Source Types
export type ExpenseSourceType =
  | "manual"
  | "customer"
  | "staff_payment"
  | "staff_expense";

// Main Expense Model
export interface ExpenseModel {
  uid: string;
  date: Date | Timestamp; // IST date
  amount: number;
  category: ExpenseCategory;
  mode: string; // Mode of payment
  description: string;
  receiptUrls: string[]; // Array of receipt URLs

  // For yearly expenses
  yearlySubCategory?: YearlySubCategory;
  financialYear?: string; // e.g., "2025-2026"

  // Reference tracking
  sourceType: ExpenseSourceType;
  sourceId?: string; // ID of the customer charge/staff payment/staff expense
  customerId?: string; // If from customer
  staffId?: string; // If from staff

  // Metadata
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy?: string; // User who created
}

// Form Data Types
export interface MonthlyExpenseFormData {
  date: string; // YYYY-MM-DD format
  amount: number;
  category: MonthlyExpenseCategory;
  description: string;
  receiptUrls?: string[];
}

export interface YearlyExpenseFormData {
  financialYear: string; // e.g., "2025-2026"
  amount: number;
  yearlySubCategory: YearlySubCategory;
  description: string;
  receiptUrls?: string[];
}

// Helper to get current financial year
export function getCurrentFinancialYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  // Financial year starts in April (month 3)
  if (currentMonth >= 3) {
    // Apr onwards - current year to next year
    return `${currentYear}-${currentYear + 1}`;
  } else {
    // Jan-Mar - previous year to current year
    return `${currentYear - 1}-${currentYear}`;
  }
}

// Helper to get last date of financial year
export function getFinancialYearEndDate(financialYear: string): Date {
  const [startYear, endYear] = financialYear.split("-").map(Number);
  // March 31st of the end year
  return new Date(endYear, 2, 31); // Month 2 = March (0-indexed)
}

// Helper to get IST date
export function getISTDate(date?: Date): Date {
  const targetDate = date || new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const utcTime = targetDate.getTime();
  const istTime = new Date(utcTime + istOffset);
  return istTime;
}

// Helper to format date to IST string
export function formatISTDate(date: Date | Timestamp): string {
  const dateObj = date instanceof Date ? date : (date as any).toDate();
  return dateObj.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Helper to get financial years for dropdown (last 5 years + next 2 years)
export function getFinancialYearOptions(): string[] {
  const currentFY = getCurrentFinancialYear();
  const [currentStart] = currentFY.split("-").map(Number);
  
  const options: string[] = [];
  
  // Last 5 years
  for (let i = 5; i >= 1; i--) {
    const startYear = currentStart - i;
    options.push(`${startYear}-${startYear + 1}`);
  }
  
  // Current year
  options.push(currentFY);
  
  // Next 2 years
  for (let i = 1; i <= 2; i++) {
    const startYear = currentStart + i;
    options.push(`${startYear}-${startYear + 1}`);
  }
  
  return options;
}