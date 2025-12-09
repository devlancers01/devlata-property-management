import { adminDb } from "./admin";
import { CustomerModel, GroupMember, Payment, ExtraCharge, Refund } from "@/models/customer.model";
import { Timestamp } from "firebase-admin/firestore";

// Helper function to safely convert Timestamp to Date
function toDate(value: Date | Timestamp): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as any).toDate();
  }
  return value as Date;
}

// ==================== CUSTOMER OPERATIONS ====================

export async function createCustomer(data: Partial<CustomerModel>): Promise<string> {
  try {
    const customerRef = adminDb.collection("customers").doc();

    const ensureDate = (value: any): Date => {
      if (value instanceof Date) return value;
      if (typeof value === "string") return new Date(value);
      if (value && typeof value === "object" && "toDate" in value) {
        return value.toDate();
      }
      return new Date();
    };

    const customerData = {
      uid: customerRef.id,
      name: data.name!,
      age: data.age!,
      gender: data.gender!,
      phone: data.phone!,
      email: data.email!,
      address: data.address!,
      idType: data.idType!,
      idValue: data.idValue || "",
      idProofUrl: data.idProofUrl || "",
      vehicleNumber: data.vehicleNumber!,
      checkIn: Timestamp.fromDate(ensureDate(data.checkIn)),
      checkOut: Timestamp.fromDate(ensureDate(data.checkOut)),
      checkInTime: data.checkInTime || "12:00",
      checkOutTime: data.checkOutTime || "10:00",
      instructions: data.instructions || "",
      stayCharges: data.stayCharges!,
      cuisineCharges: data.cuisineCharges || 0,
      extraChargesTotal: data.extraChargesTotal || 0,
      totalAmount: data.totalAmount!,
      receivedAmount: data.receivedAmount || 0,
      balanceAmount: data.balanceAmount!,
      status: data.status || "active",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await customerRef.set(customerData);

    return customerRef.id;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
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
  startDate?: string;
  endDate?: string;
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
      if (filters.startDate && checkIn < new Date(filters.startDate)) return false;
      if (filters.endDate && checkIn > new Date(filters.endDate)) return false;
      return true;
    });
  }

  return customers;
}

export async function updateCustomer(uid: string, data: Partial<CustomerModel>): Promise<void> {
  // Helper to ensure Date object
  const ensureDate = (value: any): Date => {
    if (value instanceof Date) return value;
    if (typeof value === "string") return new Date(value);
    if (value && typeof value === "object" && "toDate" in value) {
      return value.toDate();
    }
    return new Date();
  };

  const updateData: any = {
    updatedAt: Timestamp.fromDate(new Date()),
  };

  // Copy over fields, converting dates appropriately
  Object.keys(data).forEach(key => {
    if (key === 'checkIn' || key === 'checkOut') {
      if (data[key as keyof CustomerModel]) {
        updateData[key] = Timestamp.fromDate(ensureDate(data[key as keyof CustomerModel]));
      }
    } else if (key !== 'updatedAt') {
      updateData[key] = data[key as keyof CustomerModel];
    }
  });

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
  try {
    // Helper to ensure Date object
    const ensureDate = (value: any): Date => {
      if (value instanceof Date) return value;
      if (typeof value === "string") return new Date(value);
      if (value && typeof value === "object" && "toDate" in value) {
        return value.toDate();
      }
      return new Date();
    };

    const checkInDate = ensureDate(checkIn);
    const checkOutDate = ensureDate(checkOut);

    // Query for active bookings
    const snapshot = await adminDb
      .collection("customers")
      .where("status", "==", "active")
      .get();

    const conflictingBookings: CustomerModel[] = [];

    snapshot.forEach((docSnap) => {
      if (excludeCustomerId && docSnap.id === excludeCustomerId) {
        return; // Skip the customer being edited
      }

      const data = docSnap.data();
      const existingCheckIn = toDate(data.checkIn);
      const existingCheckOut = toDate(data.checkOut);

      // Check for overlap: new booking overlaps if:
      // checkIn < existingCheckOut AND checkOut > existingCheckIn
      const hasOverlap =
        checkInDate < existingCheckOut && checkOutDate > existingCheckIn;

      if (hasOverlap) {
        conflictingBookings.push({
          ...data,
          uid: docSnap.id,
          checkIn: existingCheckIn,
          checkOut: existingCheckOut,
        } as CustomerModel);
      }
    });

    return {
      hasConflict: conflictingBookings.length > 0,
      conflictingBookings,
    };
  } catch (error) {
    console.error("Error checking booking conflicts:", error);
    throw error;
  }
}

// ==================== GROUP MEMBERS ====================

export async function addGroupMember(
  customerId: string,
  member: Omit<GroupMember, "uid">
): Promise<string> {
  // Remove undefined values
  const cleanMember: any = {};
  if (member.name) cleanMember.name = member.name;
  if (member.age) cleanMember.age = member.age;
  if (member.idType) cleanMember.idType = member.idType;
  if (member.idValue) cleanMember.idValue = member.idValue;
  if (member.idProofUrl) cleanMember.idProofUrl = member.idProofUrl;
  cleanMember.createdAt = Timestamp.now();

  const memberRef = await adminDb
    .collection("customers")
    .doc(customerId)
    .collection("members")
    .add(cleanMember);

  return memberRef.id;
}

export async function getGroupMembers(customerId: string): Promise<GroupMember[]> {
  const snapshot = await adminDb
    .collection("customers")
    .doc(customerId)
    .collection("members")
    .get();

  return snapshot.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data(),
  })) as GroupMember[];
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

export async function addPayment(
  customerId: string,
  payment: Omit<Payment, "uid" | "date">
): Promise<string> {
  const paymentRef = await adminDb
    .collection("customers")
    .doc(customerId)
    .collection("payments")
    .add({
      ...payment,
      date: Timestamp.now(),
    });

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

  return paymentRef.id;
}

export async function getPayments(customerId: string): Promise<Payment[]> {
  const snapshot = await adminDb
    .collection("customers")
    .doc(customerId)
    .collection("payments")
    .orderBy("date", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      date: data.date ? toDate(data.date) : new Date(),
    } as Payment;
  });
}

// ==================== EXTRA CHARGES ====================

export async function addExtraCharge(
  customerId: string,
  charge: Omit<ExtraCharge, "uid" | "date">
): Promise<string> {
  const chargeRef = await adminDb
    .collection("customers")
    .doc(customerId)
    .collection("extras")
    .add({
      description: charge.description,
      amount: charge.amount,
      recordInExpenses: charge.recordInExpenses ?? true,
      date: Timestamp.now(),
    });

  // Update customer's extraChargesTotal and totalAmount
  const customer = await getCustomerById(customerId);
  if (customer) {
    const newExtraChargesTotal = customer.extraChargesTotal + charge.amount;
    const newTotalAmount =
      customer.stayCharges + customer.cuisineCharges + newExtraChargesTotal;
    const newBalanceAmount = newTotalAmount - customer.receivedAmount;

    await updateCustomer(customerId, {
      extraChargesTotal: newExtraChargesTotal,
      totalAmount: newTotalAmount,
      balanceAmount: newBalanceAmount,
    });
  }

  return chargeRef.id;
}

export async function getExtraCharges(customerId: string): Promise<ExtraCharge[]> {
  const snapshot = await adminDb
    .collection("customers")
    .doc(customerId)
    .collection("extras")
    .orderBy("date", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      date: data.date ? toDate(data.date) : new Date(),
    } as ExtraCharge;
  });
}

// ==================== REFUNDS ====================

export async function addRefund(
  customerId: string,
  refund: Omit<Refund, "uid" | "date">
): Promise<string> {
  const refundRef = await adminDb
    .collection("customers")
    .doc(customerId)
    .collection("refunds")
    .add({
      ...refund,
      date: Timestamp.now(),
    });

  // Update customer's receivedAmount and refundAmount
  const customer = await getCustomerById(customerId);
  if (customer) {
    const newReceivedAmount = customer.receivedAmount - refund.amount;
    const newRefundAmount = (customer.refundAmount || 0) + refund.amount;
    const newBalanceAmount = 0;

    await updateCustomer(customerId, {
      receivedAmount: newReceivedAmount,
      refundAmount: newRefundAmount,
      balanceAmount: newBalanceAmount,
      status: "cancelled",
      cancelledAt: new Date(),
    });
  }

  return refundRef.id;
}

export async function getRefunds(customerId: string): Promise<Refund[]> {
  const snapshot = await adminDb
    .collection("customers")
    .doc(customerId)
    .collection("refunds")
    .orderBy("date", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      date: data.date ? toDate(data.date) : new Date(),
    } as Refund;
  });
}