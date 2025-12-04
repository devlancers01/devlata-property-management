import { adminDb } from "./admin";
import { Booking, BookingType } from "@/models/booking.model";
import { Timestamp } from "firebase-admin/firestore";

function toDate(value: Date | Timestamp): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as any).toDate();
  }
  return value as Date;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDatesInRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  
  while (current < endDate) {
    dates.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

export async function createBookings(
  customerId: string,
  checkIn: Date,
  checkOut: Date,
  membersCount: number
): Promise<void> {
  const dateKeys = getDatesInRange(checkIn, checkOut);
  const batch = adminDb.batch();

  for (const dateKey of dateKeys) {
    const bookingRef = adminDb.collection("bookings").doc(dateKey);
    batch.set(bookingRef, {
      uid: dateKey,
      customerId,
      checkIn: Timestamp.fromDate(checkIn),
      checkOut: Timestamp.fromDate(checkOut),
      membersCount,
      type: "customer" as BookingType,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  await batch.commit();
}

export async function updateBookings(
  customerId: string,
  oldCheckIn: Date,
  oldCheckOut: Date,
  newCheckIn: Date,
  newCheckOut: Date,
  membersCount: number
): Promise<void> {
  const oldDateKeys = getDatesInRange(oldCheckIn, oldCheckOut);
  const newDateKeys = getDatesInRange(newCheckIn, newCheckOut);

  const batch = adminDb.batch();

  for (const dateKey of oldDateKeys) {
    const bookingRef = adminDb.collection("bookings").doc(dateKey);
    batch.delete(bookingRef);
  }

  for (const dateKey of newDateKeys) {
    const bookingRef = adminDb.collection("bookings").doc(dateKey);
    batch.set(bookingRef, {
      uid: dateKey,
      customerId,
      checkIn: Timestamp.fromDate(newCheckIn),
      checkOut: Timestamp.fromDate(newCheckOut),
      membersCount,
      type: "customer" as BookingType,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  await batch.commit();
}

export async function deleteBookings(checkIn: Date, checkOut: Date): Promise<void> {
  const dateKeys = getDatesInRange(checkIn, checkOut);
  const batch = adminDb.batch();

  for (const dateKey of dateKeys) {
    const bookingRef = adminDb.collection("bookings").doc(dateKey);
    batch.delete(bookingRef);
  }

  await batch.commit();
}

export async function checkBookingAvailability(
  checkIn: Date,
  checkOut: Date,
  excludeCustomerId?: string
): Promise<{ available: boolean; conflicts: Booking[] }> {
  const dateKeys = getDatesInRange(checkIn, checkOut);
  const conflicts: Booking[] = [];

  for (const dateKey of dateKeys) {
    const doc = await adminDb.collection("bookings").doc(dateKey).get();
    
    if (doc.exists) {
      const data = doc.data() as any;
      
      if (excludeCustomerId && data.customerId === excludeCustomerId) {
        continue;
      }

      conflicts.push({
        uid: doc.id,
        ...data,
        checkIn: toDate(data.checkIn),
        checkOut: toDate(data.checkOut),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      });
    }
  }

  return {
    available: conflicts.length === 0,
    conflicts,
  };
}

export async function blockDates(checkIn: Date, checkOut: Date): Promise<void> {
  const dateKeys = getDatesInRange(checkIn, checkOut);
  const batch = adminDb.batch();

  for (const dateKey of dateKeys) {
    const bookingRef = adminDb.collection("bookings").doc(dateKey);
    batch.set(bookingRef, {
      uid: dateKey,
      customerId: null,
      checkIn: Timestamp.fromDate(checkIn),
      checkOut: Timestamp.fromDate(checkOut),
      membersCount: 0,
      type: "blocked" as BookingType,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  await batch.commit();
}

export async function getBookingsByDate(date: Date): Promise<Booking[]> {
  const dateKey = formatDateKey(date);
  const doc = await adminDb.collection("bookings").doc(dateKey).get();

  if (!doc.exists) return [];

  const data = doc.data() as any;
  return [{
    uid: doc.id,
    ...data,
    checkIn: toDate(data.checkIn),
    checkOut: toDate(data.checkOut),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }];
}

export async function getBookingsByMonth(year: number, month: number): Promise<Booking[]> {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  const startKey = formatDateKey(startDate);
  const endKey = formatDateKey(endDate);

  const snapshot = await adminDb
    .collection("bookings")
    .where("uid", ">=", startKey)
    .where("uid", "<=", endKey)
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      checkIn: toDate(data.checkIn),
      checkOut: toDate(data.checkOut),
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Booking;
  });
}