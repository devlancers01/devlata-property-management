import { adminDb } from "./admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type { ExpenseCategory, ExpenseModel, ExpenseSourceType } from "@/models/expense.model";

const EXPENSES_COLLECTION = "expenses";

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

// Helper to get IST date
function getISTDate(date?: Date): Date {
    const targetDate = date || new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utcTime = targetDate.getTime();
    const istTime = new Date(utcTime + istOffset);
    return istTime;
}

// ============= EXPENSE CRUD =============

//lib/firebase/expenses.ts - UPDATE createExpense function

export async function createExpense(data: Partial<ExpenseModel>): Promise<string> {
  try {
    const expenseRef = adminDb.collection("expenses").doc();

    // Helper to ensure Date object
    const ensureDate = (value: any): Date => {
      if (value instanceof Date) return value;
      if (typeof value === "string") return new Date(value);
      if (value && typeof value === "object" && "toDate" in value) {
        return value.toDate();
      }
      return new Date();
    };

    const expenseData: any = {
      uid: expenseRef.id,
      date: Timestamp.fromDate(ensureDate(data.date)),
      amount: data.amount!,
      category: data.category!,
      description: data.description!,
      receiptUrls: data.receiptUrls || [],
      sourceType: data.sourceType || "manual",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Only add optional fields if they have values
    if (data.yearlySubCategory) expenseData.yearlySubCategory = data.yearlySubCategory;
    if (data.financialYear) expenseData.financialYear = data.financialYear;
    if (data.sourceId) expenseData.sourceId = data.sourceId;
    if (data.customerId) expenseData.customerId = data.customerId;
    if (data.staffId) expenseData.staffId = data.staffId;
    if (data.createdBy) expenseData.createdBy = data.createdBy;

    await expenseRef.set(expenseData);

    return expenseRef.id;
  } catch (error) {
    console.error("Error creating expense:", error);
    throw error;
  }
}

export async function getExpenseById(uid: string): Promise<ExpenseModel | null> {
    try {
        const doc = await adminDb.collection(EXPENSES_COLLECTION).doc(uid).get();

        if (!doc.exists) {
            return null;
        }

        return {
            uid: doc.id,
            ...convertTimestamps(doc.data()),
        } as ExpenseModel;
    } catch (error) {
        console.error("Error fetching expense by ID:", error);
        throw error;
    }
}

export async function getAllExpenses(filters?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    customerId?: string;
    staffId?: string;
}): Promise<ExpenseModel[]> {
    try {
        let query = adminDb.collection(EXPENSES_COLLECTION).orderBy("date", "desc");

        const snapshot = await query.get();
        let expenses = snapshot.docs.map((doc) => ({
            uid: doc.id,
            ...convertTimestamps(doc.data()),
        })) as ExpenseModel[];

        // Client-side filtering
        if (filters?.category) {
            expenses = expenses.filter((e) => e.category === filters.category);
        }

        if (filters?.startDate || filters?.endDate) {
            expenses = expenses.filter((e) => {
                const expenseDate = e.date instanceof Date ? e.date : (e.date as any).toDate();
                if (filters.startDate && expenseDate < new Date(filters.startDate)) return false;
                if (filters.endDate && expenseDate > new Date(filters.endDate)) return false;
                return true;
            });
        }

        if (filters?.customerId) {
            expenses = expenses.filter((e) => e.customerId === filters.customerId);
        }

        if (filters?.staffId) {
            expenses = expenses.filter((e) => e.staffId === filters.staffId);
        }

        return expenses;
    } catch (error) {
        console.error("Error fetching expenses:", error);
        throw error;
    }
}

export async function updateExpense(
    uid: string,
    data: Partial<Omit<ExpenseModel, "uid" | "createdAt">>
): Promise<void> {
    try {
        const updateData: any = {
            ...data,
            updatedAt: FieldValue.serverTimestamp(),
        };

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

        await adminDb.collection(EXPENSES_COLLECTION).doc(uid).update(updateData);
    } catch (error) {
        console.error("Error updating expense:", error);
        throw error;
    }
}

export async function deleteExpense(uid: string): Promise<void> {
    try {
        await adminDb.collection(EXPENSES_COLLECTION).doc(uid).delete();
    } catch (error) {
        console.error("Error deleting expense:", error);
        throw error;
    }
}

// ============= REFERENCE-BASED QUERIES =============

export async function getExpenseBySource(
    sourceType: ExpenseSourceType,
    sourceId: string
): Promise<ExpenseModel | null> {
    try {
        const snapshot = await adminDb
            .collection(EXPENSES_COLLECTION)
            .where("sourceType", "==", sourceType)
            .where("sourceId", "==", sourceId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        return {
            uid: doc.id,
            ...convertTimestamps(doc.data()),
        } as ExpenseModel;
    } catch (error) {
        console.error("Error fetching expense by source:", error);
        throw error;
    }
}

export async function deleteExpenseBySource(
    sourceType: ExpenseSourceType,
    sourceId: string
): Promise<void> {
    try {
        const expense = await getExpenseBySource(sourceType, sourceId);
        if (expense) {
            await deleteExpense(expense.uid);
        }
    } catch (error) {
        console.error("Error deleting expense by source:", error);
        throw error;
    }
}

// ============= SYNC HELPERS =============

export async function syncCustomerChargeToExpense(
    customerId: string,
    chargeId: string,
    chargeData: {
        description: string;
        amount: number;
        date: Date;
        recordInExpenses: boolean;
    },
    action: "create" | "update" | "delete"
): Promise<void> {
    try {
        const existingExpense = await getExpenseBySource("customer", chargeId);

        if (chargeData.recordInExpenses) {
            // Determine category based on description
            let category: any = "miscellaneous";
            const desc = chargeData.description.toLowerCase();

            if (desc.includes("food") || desc.includes("meal")) {
                category = "food";
            } else if (desc.includes("service")) {
                category = "service";
            } else if (desc.includes("maintenance") || desc.includes("repair")) {
                category = "maintenance";
            }

            // In syncCustomerChargeToExpense function, update the expenseData:

            const expenseData: Partial<ExpenseModel> = {
                date: chargeData.date || new Date(), // ✅ Use charge date or default to now
                amount: chargeData.amount,
                category: "miscellaneous" as ExpenseCategory,
                description: chargeData.description,
                receiptUrls: [],
                sourceType: action === "delete" ? "manual" : "customer",
                sourceId: action === "delete" ? undefined : chargeId,
                customerId: action === "delete" ? undefined : customerId,
                createdBy: "system",
            };

            if (existingExpense) {
                // Update existing expense
                await updateExpense(existingExpense.uid, expenseData);
            } else {
                // Create new expense
                await createExpense(expenseData as Omit<ExpenseModel, "uid" | "createdAt" | "updatedAt">);
            }
        } else {
            // Delete expense if toggle is off
            if (existingExpense) {
                await deleteExpense(existingExpense.uid);
            }
        }
    } catch (error) {
        console.error("Error syncing customer charge to expense:", error);
        throw error;
    }
}

export async function syncStaffPaymentToExpense(
    staffId: string,
    paymentId: string,
    paymentData: {
        amount: number;
        date: Date;
        type: string;
        notes?: string;
    },
    action: "create" | "update" | "delete"
): Promise<void> {
    try {
        const existingExpense = await getExpenseBySource("staff_payment", paymentId);

        const expenseData = {
            date: paymentData.date,
            amount: paymentData.amount,
            category: "salary" as any,
            description: `Salary Payment - ${paymentData.type}${paymentData.notes ? `: ${paymentData.notes}` : ""}`,
            receiptUrls: [],
            sourceType: "staff_payment" as ExpenseSourceType,
            sourceId: paymentId,
            staffId,
        };

        if (existingExpense) {
            await updateExpense(existingExpense.uid, expenseData);
        } else {
            await createExpense(expenseData);
        }
    } catch (error) {
        console.error("Error syncing staff payment to expense:", error);
        throw error;
    }
}

export async function syncStaffExpenseToExpense(
    staffId: string,
    expenseId: string,
    expenseData: {
        amount: number;
        date: Date;
        category: string;
        notes?: string;
    },
    action: "create" | "update" | "delete"
): Promise<void> {
    try {
        const existingExpense = await getExpenseBySource("staff_expense", expenseId);

        const mainExpenseData = {
            date: expenseData.date,
            amount: expenseData.amount,
            category: "staff" as any,
            description: `Staff Expense - ${expenseData.category}${expenseData.notes ? `: ${expenseData.notes}` : ""}`,
            receiptUrls: [],
            sourceType: "staff_expense" as ExpenseSourceType,
            sourceId: expenseId,
            staffId,
        };

        if (existingExpense) {
            await updateExpense(existingExpense.uid, mainExpenseData);
        } else {
            await createExpense(mainExpenseData);
        }
    } catch (error) {
        console.error("Error syncing staff expense to expense:", error);
        throw error;
    }
}