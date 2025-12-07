import { Timestamp } from "firebase-admin/firestore";

// Sale Categories
export const SALE_CATEGORIES = [
  "stay",
  "cuisine",
  "extra_services",
  "advance",
  "other",
] as const;

export type SaleCategory = typeof SALE_CATEGORIES[number];

// Payment Modes
export const SALE_PAYMENT_MODES = ["cash", "UPI", "bank"] as const;
export type SalePaymentMode = typeof SALE_PAYMENT_MODES[number];

// Source Types
export type SaleSourceType =
  | "manual"
  | "customer_payment"
  | "online_booking"
  | "extra_service";

// Main Sale Model
export interface SaleModel {
  uid: string;
  date: Date | Timestamp; // IST date
  amount: number;
  category: SaleCategory;
  description: string;
  receiptUrls: string[]; // Array of receipt URLs
  paymentMode: SalePaymentMode;

  // Reference tracking
  sourceType: SaleSourceType;
  sourceId?: string; // ID of the customer payment
  customerId?: string; // If from customer

  // Financial year tracking
  financialYear: string; // e.g., "2025-2026"

  // Metadata
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy?: string; // User who created
}

// Form Data Types
export interface SaleFormData {
  date: string; // YYYY-MM-DD format
  amount: number;
  category: SaleCategory;
  description: string;
  paymentMode: SalePaymentMode;
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

// Helper to get financial year from date
export function getFinancialYearFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11

  if (month >= 3) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

// Helper to get IST date
export function getISTDate(date?: Date): Date {
  const targetDate = date || new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
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

// Helper to get financial years for dropdown
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