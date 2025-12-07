import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { adminDb } from "@/lib/firebase/admin";
import { getCustomerById, updateCustomer } from "@/lib/firebase/customers";
import { Timestamp } from "firebase-admin/firestore";
import { syncCustomerChargeToExpense } from "@/lib/firebase/expenses";
import { syncCustomerChargeToSale } from "@/lib/firebase/sales";

// Helper to convert Timestamp to Date
function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return value.toDate();
  }
  if (typeof value === "string") return new Date(value);
  return new Date();
}

// PATCH: Update an extra charge
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; chargeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, chargeId } = await params;
    const body = await req.json();

    // Get the old charge to calculate difference
    const oldChargeDoc = await adminDb
      .collection("customers")
      .doc(id)
      .collection("extras")
      .doc(chargeId)
      .get();

    if (!oldChargeDoc.exists) {
      return NextResponse.json({ error: "Charge not found" }, { status: 404 });
    }

    const oldCharge = oldChargeDoc.data();
    const oldAmount = oldCharge?.amount || 0;
    const newAmount = body.amount || oldAmount;
    const oldRecordInExpenses = oldCharge?.recordInExpenses ?? true;
    const newRecordInExpenses = body.recordInExpenses ?? oldRecordInExpenses;
    const oldRecordInSales = oldCharge?.recordInSales ?? true;
    const newRecordInSales = body.recordInSales ?? oldRecordInSales;

    // Update charge
    const updateData: any = {};
    if (body.description) updateData.description = body.description;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.recordInExpenses !== undefined) updateData.recordInExpenses = body.recordInExpenses;
    if (body.recordInSales !== undefined) updateData.recordInSales = body.recordInSales;
    updateData.updatedAt = Timestamp.now();

    await adminDb
      .collection("customers")
      .doc(id)
      .collection("extras")
      .doc(chargeId)
      .update(updateData);

    // Update customer's extraChargesTotal and totalAmount if amount changed
    if (oldAmount !== newAmount) {
      const customer = await getCustomerById(id);
      if (customer) {
        const difference = newAmount - oldAmount;
        const newExtraChargesTotal = customer.extraChargesTotal + difference;
        const newTotalAmount =
          customer.stayCharges + customer.cuisineCharges + newExtraChargesTotal;
        const newBalanceAmount = newTotalAmount - customer.receivedAmount;

        await updateCustomer(id, {
          extraChargesTotal: newExtraChargesTotal,
          totalAmount: newTotalAmount,
          balanceAmount: newBalanceAmount,
        });
      }
    }

    // Sync to expenses
    if (newRecordInExpenses) {
      const chargeData = {
        description: body.description || oldCharge?.description,
        amount: newAmount,
        date: oldCharge?.date ? toDate(oldCharge.date) : new Date(),
        recordInExpenses: true,
      };
      await syncCustomerChargeToExpense(id, chargeId, chargeData, "update");
    } else if (oldRecordInExpenses && !newRecordInExpenses) {
      // Toggle turned off - delete expense entry
      const chargeData = {
        description: oldCharge?.description || "",
        amount: oldAmount,
        date: oldCharge?.date ? toDate(oldCharge.date) : new Date(),
        recordInExpenses: false,
      };
      await syncCustomerChargeToExpense(id, chargeId, chargeData, "delete");
    }

    // Sync to sales
    if (newRecordInSales) {
      const chargeData = {
        description: body.description || oldCharge?.description,
        amount: newAmount,
        date: oldCharge?.date ? toDate(oldCharge.date) : new Date(),
        recordInSales: true,
      };
      await syncCustomerChargeToSale(id, chargeId, chargeData, "update");
    } else if (oldRecordInSales && !newRecordInSales) {
      // Toggle turned off - delete sales entry
      const chargeData = {
        description: oldCharge?.description || "",
        amount: oldAmount,
        date: oldCharge?.date ? toDate(oldCharge.date) : new Date(),
        recordInSales: false,
      };
      await syncCustomerChargeToSale(id, chargeId, chargeData, "delete");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating charge:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update charge" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an extra charge
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; chargeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, chargeId } = await params;

    // Get the charge to subtract from extraChargesTotal
    const chargeDoc = await adminDb
      .collection("customers")
      .doc(id)
      .collection("extras")
      .doc(chargeId)
      .get();

    if (!chargeDoc.exists) {
      return NextResponse.json({ error: "Charge not found" }, { status: 404 });
    }

    const charge = chargeDoc.data();
    const chargeAmount = charge?.amount || 0;
    const recordInExpenses = charge?.recordInExpenses ?? true;
    const recordInSales = charge?.recordInSales ?? true;

    // Delete from expenses if it was recorded (BEFORE deleting the charge)
    if (recordInExpenses) {
      const chargeData = {
        description: charge?.description || "",
        amount: chargeAmount,
        date: charge?.date ? toDate(charge.date) : new Date(),
        recordInExpenses: false,
      };
      await syncCustomerChargeToExpense(id, chargeId, chargeData, "delete");
    }

    // Delete from sales if it was recorded
    if (recordInSales) {
      const chargeData = {
        description: charge?.description || "",
        amount: chargeAmount,
        date: charge?.date ? toDate(charge.date) : new Date(),
        recordInSales: false,
      };
      await syncCustomerChargeToSale(id, chargeId, chargeData, "delete");
    }

    // Delete charge
    await adminDb
      .collection("customers")
      .doc(id)
      .collection("extras")
      .doc(chargeId)
      .delete();

    // Update customer's extraChargesTotal and totalAmount
    const customer = await getCustomerById(id);
    if (customer) {
      const newExtraChargesTotal = customer.extraChargesTotal - chargeAmount;
      const newTotalAmount =
        customer.stayCharges + customer.cuisineCharges + newExtraChargesTotal;
      const newBalanceAmount = newTotalAmount - customer.receivedAmount;

      await updateCustomer(id, {
        extraChargesTotal: newExtraChargesTotal,
        totalAmount: newTotalAmount,
        balanceAmount: newBalanceAmount,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting charge:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete charge" },
      { status: 500 }
    );
  }
}