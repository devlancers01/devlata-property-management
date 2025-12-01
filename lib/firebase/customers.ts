import { adminDb, adminStorage } from "./admin";
import { CustomerModel, GroupMember, Payment, ExtraCharge } from "@/models/customer.model";
import { Timestamp } from "firebase-admin/firestore";

// Helper function to safely convert Timestamp to Date
function toDate(value: Date | Timestamp): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as any).toDate();
  }
  return value as Date;
}

// ==================== CUSTOMER OPERATIONS ====================

export async function createCustomer(data: Omit<CustomerModel, "uid" | "createdAt" | "updatedAt">): Promise<CustomerModel> {
  const now = new Date();
  
  const customerData = {
    ...data,
    checkIn: Timestamp.fromDate(toDate(data.checkIn)),
    checkOut: Timestamp.fromDate(toDate(data.checkOut)),
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };

  const docRef = await adminDb.collection("customers").add(customerData);
  
  return {
    uid: docRef.id,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getCustomerById(uid: string): Promise<CustomerModel | null> {
  const doc = await adminDb.collection("customers").doc(uid).get();
  if (!doc.exists) return null;
  
  const data = doc.data();
  return {
    uid: doc.id,
    ...data,
    checkIn: data?.checkIn ? toDate(data.checkIn) : new Date(),
    checkOut: data?.checkOut ? toDate(data.checkOut) : new Date(),
    createdAt: data?.createdAt ? toDate(data.createdAt) : new Date(),
    updatedAt: data?.updatedAt ? toDate(data.updatedAt) : new Date(),
  } as CustomerModel;
}

export async function getAllCustomers(filters?: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}): Promise<CustomerModel[]> {
  let query = adminDb.collection("customers").orderBy("checkIn", "desc");

  if (filters?.status) {
    query = query.where("status", "==", filters.status) as any;
  }

  const snapshot = await query.get();
  
  let customers = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      checkIn: data.checkIn ? toDate(data.checkIn) : new Date(),
      checkOut: data.checkOut ? toDate(data.checkOut) : new Date(),
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
    } as CustomerModel;
  });

  // Client-side filtering for search and date range
  if (filters?.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query)
    );
  }

  if (filters?.startDate || filters?.endDate) {
    customers = customers.filter((c) => {
      const checkIn = toDate(c.checkIn);
      if (filters.startDate && checkIn < filters.startDate) return false;
      if (filters.endDate && checkIn > filters.endDate) return false;
      return true;
    });
  }

  return customers;
}

export async function updateCustomer(uid: string, data: Partial<CustomerModel>): Promise<void> {
  const updateData: any = {
    ...data,
    updatedAt: Timestamp.fromDate(new Date()),
  };

  if (data.checkIn) {
    updateData.checkIn = Timestamp.fromDate(toDate(data.checkIn));
  }
  if (data.checkOut) {
    updateData.checkOut = Timestamp.fromDate(toDate(data.checkOut));
  }

  await adminDb.collection("customers").doc(uid).update(updateData);
}

export async function deleteCustomer(uid: string): Promise<void> {
  await adminDb.collection("customers").doc(uid).delete();
}

// ==================== CHECK BOOKING CONFLICTS ====================

export async function checkBookingConflict(
  checkIn: Date,
  checkOut: Date,
  excludeCustomerId?: string
): Promise<{ hasConflict: boolean; conflictingBookings: CustomerModel[] }> {
  const checkInTimestamp = Timestamp.fromDate(checkIn);
  const checkOutTimestamp = Timestamp.fromDate(checkOut);

  // Get all active bookings
  const snapshot = await adminDb
    .collection("customers")
    .where("status", "==", "active")
    .get();

  const conflictingBookings: CustomerModel[] = [];

  for (const doc of snapshot.docs) {
    if (excludeCustomerId && doc.id === excludeCustomerId) continue;

    const data = doc.data();
    const existingCheckIn = data.checkIn;
    const existingCheckOut = data.checkOut;

    // Check for overlap
    const hasOverlap =
      checkInTimestamp.toDate() < toDate(existingCheckOut) &&
      checkOutTimestamp.toDate() > toDate(existingCheckIn);

    if (hasOverlap) {
      conflictingBookings.push({
        uid: doc.id,
        ...data,
        checkIn: toDate(existingCheckIn),
        checkOut: toDate(existingCheckOut),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as CustomerModel);
    }
  }

  return {
    hasConflict: conflictingBookings.length > 0,
    conflictingBookings,
  };
}

// ==================== GROUP MEMBERS ====================

export async function addGroupMember(customerId: string, member: GroupMember): Promise<void> {
  await adminDb
    .collection("customers")
    .doc(customerId)
    .collection("members")
    .add(member);
}

export async function getGroupMembers(customerId: string): Promise<GroupMember[]> {
  const snapshot = await adminDb
    .collection("customers")
    .doc(customerId)
    .collection("members")
    .get();

  return snapshot.docs.map((doc) => doc.data() as GroupMember);
}

export async function deleteGroupMember(customerId: string, memberId: string): Promise<void> {
  await adminDb
    .collection("customers")
    .doc(customerId)
    .collection("members")
    .doc(memberId)
    .delete();
}

// ==================== PAYMENTS ====================

export async function addPayment(customerId: string, payment: Payment): Promise<void> {
  const paymentData = {
    ...payment,
    timestamp: Timestamp.fromDate(new Date()),
  };

  await adminDb
    .collection("customers")
    .doc(customerId)
    .collection("payments")
    .add(paymentData);

  // Update customer's receivedAmount
  const customer = await getCustomerById(customerId);
  if (customer) {
    const newReceivedAmount = customer.receivedAmount + payment.amount;
    const newBalanceAmount = customer.totalAmount - newReceivedAmount;
    
    await updateCustomer(customerId, {
      receivedAmount: newReceivedAmount,
      balanceAmount: newBalanceAmount,
    });
  }
}

export async function getPayments(customerId: string): Promise<Payment[]> {
  const snapshot = await adminDb
    .collection("customers")
    .doc(customerId)
    .collection("payments")
    .orderBy("timestamp", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      timestamp: data.timestamp ? toDate(data.timestamp) : new Date(),
    } as Payment;
  });
}

// ==================== EXTRA CHARGES ====================

export async function addExtraCharge(customerId: string, charge: ExtraCharge): Promise<void> {
  const chargeData = {
    ...charge,
    timestamp: Timestamp.fromDate(new Date()),
  };

  await adminDb
    .collection("customers")
    .doc(customerId)
    .collection("extras")
    .add(chargeData);

  // Update customer's extraChargesTotal and totalAmount
  const customer = await getCustomerById(customerId);
  if (customer) {
    const newExtraChargesTotal = customer.extraChargesTotal + charge.amount;
    const newTotalAmount = customer.stayCharges + customer.cuisineCharges + newExtraChargesTotal;
    const newBalanceAmount = newTotalAmount - customer.receivedAmount;
    
    await updateCustomer(customerId, {
      extraChargesTotal: newExtraChargesTotal,
      totalAmount: newTotalAmount,
      balanceAmount: newBalanceAmount,
    });
  }
}

export async function getExtraCharges(customerId: string): Promise<ExtraCharge[]> {
  const snapshot = await adminDb
    .collection("customers")
    .doc(customerId)
    .collection("extras")
    .orderBy("timestamp", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      timestamp: data.timestamp ? toDate(data.timestamp) : new Date(),
    } as ExtraCharge;
  });
}