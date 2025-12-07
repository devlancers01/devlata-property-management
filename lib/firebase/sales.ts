import { adminDb } from "./admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type { SaleModel, SaleCategory, SalePaymentMode, SaleSourceType } from "@/models/sale.model";
import { getFinancialYearFromDate, getISTDate } from "@/models/sale.model";

const SALES_COLLECTION = "sales";

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

// ============= SALE CRUD =============

export async function createSale(data: Partial<SaleModel>): Promise<string> {
  try {
    const saleRef = adminDb.collection(SALES_COLLECTION).doc();

    // Helper to ensure Date object
    const ensureDate = (value: any): Date => {
      if (value instanceof Date) return value;
      if (typeof value === "string") return new Date(value);
      if (value && typeof value === "object" && "toDate" in value) {
        return value.toDate();
      }
      return new Date();
    };

    const saleDate = ensureDate(data.date);
    const financialYear = data.financialYear || getFinancialYearFromDate(saleDate);

    const saleData: any = {
      uid: saleRef.id,
      date: Timestamp.fromDate(saleDate),
      amount: data.amount!,
      category: data.category!,
      description: data.description!,
      receiptUrls: data.receiptUrls || [],
      paymentMode: data.paymentMode!,
      sourceType: data.sourceType || "manual",
      financialYear,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Only add optional fields if they have values
    if (data.sourceId) saleData.sourceId = data.sourceId;
    if (data.customerId) saleData.customerId = data.customerId;
    if (data.createdBy) saleData.createdBy = data.createdBy;

    await saleRef.set(saleData);

    return saleRef.id;
  } catch (error) {
    console.error("Error creating sale:", error);
    throw error;
  }
}

export async function getSaleById(uid: string): Promise<SaleModel | null> {
  try {
    const doc = await adminDb.collection(SALES_COLLECTION).doc(uid).get();

    if (!doc.exists) {
      return null;
    }

    return {
      uid: doc.id,
      ...convertTimestamps(doc.data()),
    } as SaleModel;
  } catch (error) {
    console.error("Error fetching sale by ID:", error);
    throw error;
  }
}

export async function getAllSales(filters?: {
  category?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  sourceType?: string;
  financialYear?: string;
}): Promise<SaleModel[]> {
  try {
    let query = adminDb.collection(SALES_COLLECTION).orderBy("date", "desc");

    const snapshot = await query.get();
    let sales = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...convertTimestamps(doc.data()),
    })) as SaleModel[];

    // Client-side filtering
    if (filters?.category) {
      sales = sales.filter((s) => s.category === filters.category);
    }

    if (filters?.sourceType) {
      sales = sales.filter((s) => s.sourceType === filters.sourceType);
    }

    if (filters?.financialYear) {
      sales = sales.filter((s) => s.financialYear === filters.financialYear);
    }

    if (filters?.startDate || filters?.endDate) {
      sales = sales.filter((s) => {
        const saleDate = s.date instanceof Date ? s.date : (s.date as any).toDate();
        if (filters.startDate && saleDate < new Date(filters.startDate)) return false;
        if (filters.endDate && saleDate > new Date(filters.endDate)) return false;
        return true;
      });
    }

    if (filters?.customerId) {
      sales = sales.filter((s) => s.customerId === filters.customerId);
    }

    return sales;
  } catch (error) {
    console.error("Error fetching sales:", error);
    throw error;
  }
}

export async function updateSale(
  uid: string,
  data: Partial<Omit<SaleModel, "uid" | "createdAt">>
): Promise<void> {
  try {
    const updateData: any = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (data.date) {
      const saleDate = data.date instanceof Date ? data.date : (data.date as any).toDate();
      updateData.date = Timestamp.fromDate(saleDate);
      updateData.financialYear = getFinancialYearFromDate(saleDate);
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await adminDb.collection(SALES_COLLECTION).doc(uid).update(updateData);
  } catch (error) {
    console.error("Error updating sale:", error);
    throw error;
  }
}

export async function deleteSale(uid: string): Promise<void> {
  try {
    await adminDb.collection(SALES_COLLECTION).doc(uid).delete();
  } catch (error) {
    console.error("Error deleting sale:", error);
    throw error;
  }
}

// ============= REFERENCE-BASED QUERIES =============

export async function getSaleBySource(
  sourceType: SaleSourceType,
  sourceId: string
): Promise<SaleModel | null> {
  try {
    const snapshot = await adminDb
      .collection(SALES_COLLECTION)
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
    } as SaleModel;
  } catch (error) {
    console.error("Error fetching sale by source:", error);
    throw error;
  }
}

export async function deleteSaleBySource(
  sourceType: SaleSourceType,
  sourceId: string
): Promise<void> {
  try {
    const sale = await getSaleBySource(sourceType, sourceId);
    if (sale) {
      await deleteSale(sale.uid);
    }
  } catch (error) {
    console.error("Error deleting sale by source:", error);
    throw error;
  }
}

// ============= SYNC HELPERS =============

export async function syncCustomerPaymentToSale(
  customerId: string,
  paymentId: string,
  paymentData: {
    amount: number;
    mode: string;
    type: string;
    date: Date;
    notes?: string;
  },
  action: "create" | "update" | "delete"
): Promise<void> {
  try {
    const existingSale = await getSaleBySource("customer_payment", paymentId);

    if (action === "delete") {
      // Delete sale if payment is deleted
      if (existingSale) {
        await deleteSale(existingSale.uid);
      }
      return;
    }

    // Determine category based on payment type
    let category: SaleCategory = "other";
    const paymentType = paymentData.type.toLowerCase();

    if (paymentType === "advance") {
      category = "advance";
    } else if (paymentType === "part" || paymentType === "final") {
      category = "stay";
    }

    const saleData: Partial<SaleModel> = {
      date: paymentData.date,
      amount: paymentData.amount,
      category,
      description: `Customer Payment - ${paymentData.type}${paymentData.notes ? `: ${paymentData.notes}` : ""}`,
      receiptUrls: [],
      paymentMode: paymentData.mode as SalePaymentMode,
      sourceType: "customer_payment",
      sourceId: paymentId,
      customerId,
      createdBy: "system",
    };

    if (existingSale) {
      // Update existing sale
      await updateSale(existingSale.uid, saleData);
    } else {
      // Create new sale
      await createSale(saleData);
    }
  } catch (error) {
    console.error("Error syncing customer payment to sale:", error);
    throw error;
  }
}

export async function syncCustomerChargeToSale(
  customerId: string,
  chargeId: string,
  chargeData: {
    description: string;
    amount: number;
    date: Date;
    recordInSales: boolean;
  },
  action: "create" | "update" | "delete"
): Promise<void> {
  try {
    const existingSale = await getSaleBySource("extra_service", chargeId);

    if (!chargeData.recordInSales || action === "delete") {
      // Delete sale if toggle is off or charge is deleted
      if (existingSale) {
        await deleteSale(existingSale.uid);
      }
      return;
    }

    // Determine category based on description
    let category: SaleCategory = "other";
    const desc = chargeData.description.toLowerCase();

    if (desc.includes("cuisine") || desc.includes("food") || desc.includes("meal")) {
      category = "cuisine";
    } else {
      category = "extra_services";
    }

    const saleData: Partial<SaleModel> = {
      date: chargeData.date,
      amount: chargeData.amount,
      category,
      description: chargeData.description,
      receiptUrls: [],
      paymentMode: "cash", // Default, as charges don't have payment mode
      sourceType: "extra_service",
      sourceId: chargeId,
      customerId,
      createdBy: "system",
    };

    if (existingSale) {
      // Update existing sale
      await updateSale(existingSale.uid, saleData);
    } else {
      // Create new sale
      await createSale(saleData);
    }
  } catch (error) {
    console.error("Error syncing customer charge to sale:", error);
    throw error;
  }
}

// ============= ANALYTICS HELPERS =============

export async function getSalesSummary(filters?: {
  startDate?: string;
  endDate?: string;
  financialYear?: string;
}): Promise<{
  totalSales: number;
  salesByCategory: Record<SaleCategory, number>;
  salesByPaymentMode: Record<SalePaymentMode, number>;
  salesBySource: Record<SaleSourceType, number>;
  salesCount: number;
}> {
  try {
    const sales = await getAllSales(filters);

    const summary = {
      totalSales: 0,
      salesByCategory: {} as Record<SaleCategory, number>,
      salesByPaymentMode: {} as Record<SalePaymentMode, number>,
      salesBySource: {} as Record<SaleSourceType, number>,
      salesCount: sales.length,
    };

    sales.forEach((sale) => {
      summary.totalSales += sale.amount;

      // By category
      if (!summary.salesByCategory[sale.category]) {
        summary.salesByCategory[sale.category] = 0;
      }
      summary.salesByCategory[sale.category] += sale.amount;

      // By payment mode
      if (!summary.salesByPaymentMode[sale.paymentMode]) {
        summary.salesByPaymentMode[sale.paymentMode] = 0;
      }
      summary.salesByPaymentMode[sale.paymentMode] += sale.amount;

      // By source
      if (!summary.salesBySource[sale.sourceType]) {
        summary.salesBySource[sale.sourceType] = 0;
      }
      summary.salesBySource[sale.sourceType] += sale.amount;
    });

    return summary;
  } catch (error) {
    console.error("Error getting sales summary:", error);
    throw error;
  }
}