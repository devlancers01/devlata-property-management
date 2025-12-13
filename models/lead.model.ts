import { Timestamp } from "firebase-admin/firestore";

export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";
export type LeadSource = "website" | "phone" | "email" | "referral" | "walk-in" | "other";

export interface Lead {
  uid: string;
  name: string;
  email: string;
  phone: string;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests?: number;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  budget?: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  convertedToCustomerId?: string; // If converted to booking
}

export interface LeadCreateInput {
  name: string;
  email: string;
  phone: string;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests?: number;
  source: LeadSource;
  notes?: string;
  budget?: number;
}