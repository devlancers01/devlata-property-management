import { adminDb } from "./admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type {
  StaffModel,
  StaffPayment,
  StaffExpense,
  StaffDocument,
} from "@/models/staff.model";

const STAFF_COLLECTION = "staff";

// Helper to convert Firestore data
function convertTimestamps(data: any): any {
  const converted = { ...data };
  Object.keys(converted).forEach((key) => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    }
  });
  return converted;
}

// ============= STAFF CRUD =============

export async function getAllStaff(filters?: {
  status?: string;
  designation?: string;
  searchQuery?: string;
}): Promise<StaffModel[]> {
  try {
    let query = adminDb.collection(STAFF_COLLECTION).orderBy("createdAt", "desc");

    if (filters?.status && filters.status !== "all") {
      query = query.where("status", "==", filters.status) as any;
    }

    if (filters?.designation && filters.designation !== "all") {
      query = query.where("designation", "==", filters.designation) as any;
    }

    const snapshot = await query.get();
    let staff = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...convertTimestamps(doc.data()),
    })) as StaffModel[];

    // Client-side search filter
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      staff = staff.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.phone.toLowerCase().includes(query) ||
          s.alternatePhone?.toLowerCase().includes(query)
      );
    }

    return staff;
  } catch (error) {
    console.error("Error fetching staff:", error);
    throw error;
  }
}

export async function getStaffById(uid: string): Promise<StaffModel | null> {
  try {
    const doc = await adminDb.collection(STAFF_COLLECTION).doc(uid).get();

    if (!doc.exists) {
      return null;
    }

    return {
      uid: doc.id,
      ...convertTimestamps(doc.data()),
    } as StaffModel;
  } catch (error) {
    console.error("Error fetching staff by ID:", error);
    throw error;
  }
}

export async function createStaff(
  data: Omit<StaffModel, "uid" | "totalPayments" | "totalExpenses" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const staffRef = adminDb.collection(STAFF_COLLECTION).doc();

    const staffData = {
      ...data,
      joiningDate: Timestamp.fromDate(
        data.joiningDate instanceof Date ? data.joiningDate : (data.joiningDate as any).toDate()
      ),
      leavingDate: data.leavingDate
        ? Timestamp.fromDate(
            data.leavingDate instanceof Date ? data.leavingDate : (data.leavingDate as any).toDate()
          )
        : null,
      totalPayments: 0,
      totalExpenses: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await staffRef.set(staffData);

    return staffRef.id;
  } catch (error) {
    console.error("Error creating staff:", error);
    throw error;
  }
}

export async function updateStaff(
  uid: string,
  data: Partial<Omit<StaffModel, "uid" | "createdAt">>
): Promise<void> {
  try {
    const updateData: any = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Convert dates to Timestamp
    if (data.joiningDate) {
      updateData.joiningDate = Timestamp.fromDate(
        data.joiningDate instanceof Date ? data.joiningDate : (data.joiningDate as any).toDate()
      );
    }

    if (data.leavingDate) {
      updateData.leavingDate = Timestamp.fromDate(
        data.leavingDate instanceof Date ? data.leavingDate : (data.leavingDate as any).toDate()
      );
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await adminDb.collection(STAFF_COLLECTION).doc(uid).update(updateData);
  } catch (error) {
    console.error("Error updating staff:", error);
    throw error;
  }
}

export async function deleteStaff(uid: string): Promise<void> {
  try {
    // Delete all sub-collections first
    const batch = adminDb.batch();

    // Delete payments
    const paymentsSnapshot = await adminDb
      .collection(STAFF_COLLECTION)
      .doc(uid)
      .collection("payments")
      .get();

    paymentsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete expenses
    const expensesSnapshot = await adminDb
      .collection(STAFF_COLLECTION)
      .doc(uid)
      .collection("expenses")
      .get();

    expensesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete documents
    const documentsSnapshot = await adminDb
      .collection(STAFF_COLLECTION)
      .doc(uid)
      .collection("documents")
      .get();

    documentsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Delete staff document
    await adminDb.collection(STAFF_COLLECTION).doc(uid).delete();
  } catch (error) {
    console.error("Error deleting staff:", error);
    throw error;
  }
}

// ============= PAYMENTS =============

export async function getStaffPayments(staffId: string): Promise<StaffPayment[]> {
  try {
    const snapshot = await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .collection("payments")
      .orderBy("date", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      uid: doc.id,
      staffId,
      ...convertTimestamps(doc.data()),
    })) as StaffPayment[];
  } catch (error) {
    console.error("Error fetching staff payments:", error);
    throw error;
  }
}

export async function addStaffPayment(
  staffId: string,
  data: Omit<StaffPayment, "uid" | "staffId" | "createdAt">
): Promise<string> {
  try {
    const paymentRef = adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .collection("payments")
      .doc();

    const paymentData = {
      ...data,
      date: Timestamp.fromDate(data.date instanceof Date ? data.date : (data.date as any).toDate()),
      createdAt: FieldValue.serverTimestamp(),
    };

    await paymentRef.set(paymentData);

    // Update staff total payments
    await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .update({
        totalPayments: FieldValue.increment(data.amount),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return paymentRef.id;
  } catch (error) {
    console.error("Error adding staff payment:", error);
    throw error;
  }
}

export async function updateStaffPayment(
  staffId: string,
  paymentId: string,
  data: Partial<Omit<StaffPayment, "uid" | "staffId" | "createdAt">>
): Promise<void> {
  try {
    // Get old payment amount
    const oldPaymentDoc = await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .collection("payments")
      .doc(paymentId)
      .get();

    if (!oldPaymentDoc.exists) {
      throw new Error("Payment not found");
    }

    const oldAmount = oldPaymentDoc.data()?.amount || 0;
    const newAmount = data.amount !== undefined ? data.amount : oldAmount;

    const updateData: any = { ...data };

    if (data.date) {
      updateData.date = Timestamp.fromDate(
        data.date instanceof Date ? data.date : (data.date as any).toDate()
      );
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .collection("payments")
      .doc(paymentId)
      .update(updateData);

    // Update staff total if amount changed
    if (oldAmount !== newAmount) {
      const difference = newAmount - oldAmount;
      await adminDb
        .collection(STAFF_COLLECTION)
        .doc(staffId)
        .update({
          totalPayments: FieldValue.increment(difference),
          updatedAt: FieldValue.serverTimestamp(),
        });
    }
  } catch (error) {
    console.error("Error updating staff payment:", error);
    throw error;
  }
}

export async function deleteStaffPayment(staffId: string, paymentId: string): Promise<void> {
  try {
    const paymentDoc = await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .collection("payments")
      .doc(paymentId)
      .get();

    if (!paymentDoc.exists) {
      throw new Error("Payment not found");
    }

    const amount = paymentDoc.data()?.amount || 0;

    await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .collection("payments")
      .doc(paymentId)
      .delete();

    // Update staff total
    await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .update({
        totalPayments: FieldValue.increment(-amount),
        updatedAt: FieldValue.serverTimestamp(),
      });
  } catch (error) {
    console.error("Error deleting staff payment:", error);
    throw error;
  }
}

// ============= EXPENSES =============

export async function getStaffExpenses(staffId: string): Promise<StaffExpense[]> {
  try {
    const snapshot = await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .collection("expenses")
      .orderBy("date", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      uid: doc.id,
      staffId,
      ...convertTimestamps(doc.data()),
    })) as StaffExpense[];
  } catch (error) {
    console.error("Error fetching staff expenses:", error);
    throw error;
  }
}

export async function addStaffExpense(
  staffId: string,
  data: Omit<StaffExpense, "uid" | "staffId" | "createdAt">
): Promise<string> {
  try {
    const expenseRef = adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .collection("expenses")
      .doc();

    const expenseData = {
      ...data,
      date: Timestamp.fromDate(data.date instanceof Date ? data.date : (data.date as any).toDate()),
      createdAt: FieldValue.serverTimestamp(),
    };

    await expenseRef.set(expenseData);

    // Update staff total expenses
    await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .update({
        totalExpenses: FieldValue.increment(data.amount),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return expenseRef.id;
  } catch (error) {
    console.error("Error adding staff expense:", error);
    throw error;
  }
}

export async function updateStaffExpense(
  staffId: string,
  expenseId: string,
  data: Partial<Omit<StaffExpense, "uid" | "staffId" | "createdAt">>
): Promise<void> {
  try {
    // Get old expense amount
    const oldExpenseDoc = await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .collection("expenses")
      .doc(expenseId)
      .get();

    if (!oldExpenseDoc.exists) {
      throw new Error("Expense not found");
    }

    const oldAmount = oldExpenseDoc.data()?.amount || 0;
    const newAmount = data.amount !== undefined ? data.amount : oldAmount;

    const updateData: any = { ...data };

    if (data.date) {
      updateData.date = Timestamp.fromDate(
        data.date instanceof Date ? data.date : (data.date as any).toDate()
      );
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .collection("expenses")
      .doc(expenseId)
      .update(updateData);

    // Update staff total if amount changed
    if (oldAmount !== newAmount) {
      const difference = newAmount - oldAmount;
      await adminDb
        .collection(STAFF_COLLECTION)
        .doc(staffId)
        .update({
          totalExpenses: FieldValue.increment(difference),
          updatedAt: FieldValue.serverTimestamp(),
        });
    }
  } catch (error) {
    console.error("Error updating staff expense:", error);
    throw error;
  }
}

export async function deleteStaffExpense(staffId: string, expenseId: string): Promise<void> {
  try {
    const expenseDoc = await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .collection("expenses")
      .doc(expenseId)
      .get();

    if (!expenseDoc.exists) {
      throw new Error("Expense not found");
    }

    const amount = expenseDoc.data()?.amount || 0;

    await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .collection("expenses")
      .doc(expenseId)
      .delete();

    // Update staff total
    await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .update({
        totalExpenses: FieldValue.increment(-amount),
        updatedAt: FieldValue.serverTimestamp(),
      });
  } catch (error) {
    console.error("Error deleting staff expense:", error);
    throw error;
  }
}

// ============= DOCUMENTS =============

export async function getStaffDocuments(staffId: string): Promise<StaffDocument[]> {
  try {
    const snapshot = await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .collection("documents")
      .orderBy("uploadedAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      uid: doc.id,
      staffId,
      ...convertTimestamps(doc.data()),
    })) as StaffDocument[];
  } catch (error) {
    console.error("Error fetching staff documents:", error);
    throw error;
  }
}

export async function addStaffDocument(
  staffId: string,
  data: Omit<StaffDocument, "uid" | "staffId" | "uploadedAt">
): Promise<string> {
  try {
    const documentRef = adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .collection("documents")
      .doc();

    const documentData = {
      ...data,
      uploadedAt: FieldValue.serverTimestamp(),
    };

    await documentRef.set(documentData);

    return documentRef.id;
  } catch (error) {
    console.error("Error adding staff document:", error);
    throw error;
  }
}

export async function deleteStaffDocument(staffId: string, documentId: string): Promise<void> {
  try {
    await adminDb
      .collection(STAFF_COLLECTION)
      .doc(staffId)
      .collection("documents")
      .doc(documentId)
      .delete();
  } catch (error) {
    console.error("Error deleting staff document:", error);
    throw error;
  }
}