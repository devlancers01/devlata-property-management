import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { adminDb } from "@/lib/firebase/admin";
import { getCustomerById, updateCustomer } from "@/lib/firebase/customers";
import { Timestamp } from "firebase-admin/firestore";

// PATCH: Update a payment
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, paymentId } = await params;
    const body = await req.json();

    // Get the old payment to calculate difference
    const oldPaymentDoc = await adminDb
      .collection("customers")
      .doc(id)
      .collection("payments")
      .doc(paymentId)
      .get();

    if (!oldPaymentDoc.exists) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const oldPayment = oldPaymentDoc.data();
    const oldAmount = oldPayment?.amount || 0;
    const newAmount = body.amount || oldAmount;

    // Update payment
    const updateData: any = {};
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.mode) updateData.mode = body.mode;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.receiptUrl !== undefined) updateData.receiptUrl = body.receiptUrl;
    updateData.updatedAt = Timestamp.now();

    await adminDb
      .collection("customers")
      .doc(id)
      .collection("payments")
      .doc(paymentId)
      .update(updateData);

    // Update customer's receivedAmount if amount changed
    if (oldAmount !== newAmount) {
      const customer = await getCustomerById(id);
      if (customer) {
        const difference = newAmount - oldAmount;
        const newReceivedAmount = customer.receivedAmount + difference;
        const newBalanceAmount = customer.totalAmount - newReceivedAmount;

        await updateCustomer(id, {
          receivedAmount: newReceivedAmount,
          balanceAmount: newBalanceAmount,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update payment" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a payment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, paymentId } = await params;

    // Get the payment to subtract from receivedAmount
    const paymentDoc = await adminDb
      .collection("customers")
      .doc(id)
      .collection("payments")
      .doc(paymentId)
      .get();

    if (!paymentDoc.exists) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payment = paymentDoc.data();
    const paymentAmount = payment?.amount || 0;

    // Delete payment
    await adminDb
      .collection("customers")
      .doc(id)
      .collection("payments")
      .doc(paymentId)
      .delete();

    // Update customer's receivedAmount
    const customer = await getCustomerById(id);
    if (customer) {
      const newReceivedAmount = customer.receivedAmount - paymentAmount;
      const newBalanceAmount = customer.totalAmount - newReceivedAmount;

      await updateCustomer(id, {
        receivedAmount: newReceivedAmount,
        balanceAmount: newBalanceAmount,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete payment" },
      { status: 500 }
    );
  }
}