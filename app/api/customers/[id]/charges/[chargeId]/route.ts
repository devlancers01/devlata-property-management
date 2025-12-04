import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { adminDb } from "@/lib/firebase/admin";
import { getCustomerById, updateCustomer } from "@/lib/firebase/customers";
import { Timestamp } from "firebase-admin/firestore";

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

    // Update charge
    const updateData: any = {};
    if (body.description) updateData.description = body.description;
    if (body.amount !== undefined) updateData.amount = body.amount;
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