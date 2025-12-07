//models/customer.model.ts
export type CustomerStatus = "active" | "completed" | "cancelled";
export type IDType = "Aadhar" | "PAN" | "Driving License" | "Passport" | "Other";
export type PaymentMode = "cash" | "UPI" | "bank";
export type PaymentType = "advance" | "part" | "final" | "extra" | "cancellation";

import { Timestamp } from "firebase-admin/firestore";

export interface CustomerModel {
  uid: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  phone: string;
  email: string;
  address: string;
  idType: "Aadhar" | "PAN" | "Driving License" | "Passport" | "Other";
  idValue?: string;
  idProofUrl?: string;
  vehicleNumber: string;
  checkIn: Date;
  checkOut: Date;
  checkInTime: string;
  checkOutTime: string;
  instructions?: string;
  stayCharges: number;
  cuisineCharges: number;
  extraChargesTotal: number;
  totalAmount: number;
  receivedAmount: number;
  balanceAmount: number;
  status: "active" | "completed" | "cancelled";
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  refundAmount?: number;
  cancelledAt?: Date | Timestamp;
}

export interface GroupMember {
  uid: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  idType: "Aadhar" | "PAN" | "Driving License" | "Passport" | "Other";
  idValue?: string;
  idProofUrl?: string;
  createdAt?: Date | Timestamp;
}

export interface Payment {
  uid: string;
  amount: number;
  mode: string;
  type: PaymentType;
  date: Date | Timestamp;
  notes?: string;
  receiptUrl?: string;
}

export interface ExtraCharge {
  uid: string;
  description: string;
  amount: number;
  date: Date | Timestamp;
  recordInExpenses?: boolean;
  recordInSales?: boolean;
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

export interface Refund {
  uid: string;
  amount: number;
  method: "cash" | "UPI" | "bank";
  reason?: string;
  date: Date | Timestamp;
  receiptUrl?: string;
  processedBy?: string;
}

export interface GroupMemberForm extends GroupMember {
  idProofFile?: File;
  idProofPreview?: string;
}