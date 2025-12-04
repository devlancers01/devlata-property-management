import { Timestamp } from "firebase-admin/firestore";

export type BookingType = "customer" | "blocked";

export interface Booking {
  uid: string; // Format: YYYY-MM-DD
  customerId?: string; // null if blocked date
  checkIn: Date;
  checkOut: Date;
  membersCount: number;
  type: BookingType;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}