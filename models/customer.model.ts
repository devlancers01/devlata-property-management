import { Timestamp } from "firebase-admin/firestore";

export type CustomerStatus = "active" | "completed" | "cancelled";
export type IDType = "Aadhar" | "PAN" | "Driving License" | "Passport" | "Other";
export type PaymentMode = "cash" | "UPI" | "bank";
export type PaymentType = "advance" | "part" | "final" | "extra" | "cancellation";

export interface CustomerModel {
  uid: string;
  name: string;
  phone: string;
  email: string;
  age: number; // NEW: As requested
  idType: IDType;
  idValue: string;
  idProofUrl?: string;
  address: string;
  vehicleNumber: string;
  checkIn: Timestamp | Date;
  checkOut: Timestamp | Date;
  checkInTime: string; // "HH:MM" format, default "12:00"
  checkOutTime: string; // "HH:MM" format, default "10:00"
  instructions: string;
  status: CustomerStatus;
  
  // Financial (with balance field)
  stayCharges: number;
  cuisineCharges: number;
  extraChargesTotal: number;
  totalAmount: number;
  receivedAmount: number;
  balanceAmount: number; // NEW: As requested
  cancellationCharges: number;
  
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string; // User UID
}

export interface GroupMember {
  name: string;
  age: number;
  idType: IDType;
  idValue: string;
}

export interface Payment {
  type: PaymentType;
  amount: number;
  mode: PaymentMode;
  receiptUrl?: string;
  timestamp: Timestamp | Date;
  recordedBy: string; // User UID
}

export interface ExtraCharge {
  remark: string;
  amount: number;
  timestamp: Timestamp | Date;
  recordedBy: string; // User UID
}

export interface CustomerCreateInput {
  name: string;
  phone: string;
  email: string;
  age: number;
  idType: IDType;
  idValue: string;
  address: string;
  vehicleNumber: string;
  checkIn: Date;
  checkOut: Date;
  checkInTime?: string;
  checkOutTime?: string;
  instructions?: string;
  stayCharges: number;
  cuisineCharges?: number;
  members?: GroupMember[];
}