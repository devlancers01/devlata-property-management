import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getSalesSummary } from "@/lib/firebase/sales";
import { getAllExpenses } from "@/lib/firebase/expenses";
import { getAllCustomers } from "@/lib/firebase/customers";
import { getAllStaff } from "@/lib/firebase/staff";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can view analytics
    if (!session.user.permissions?.includes("sales.view") || !session.user.permissions?.includes("expenses.view") || !session.user.permissions?.includes("bookings.view") || !session.user.permissions?.includes("staff.view") || !session.user.permissions?.includes("customers.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const financialYear = searchParams.get("financialYear") || undefined;

    // Get sales summary
    const salesSummary = await getSalesSummary({
      startDate,
      endDate,
      financialYear,
    });

    // Get expenses
    const expenses = await getAllExpenses({
      startDate,
      endDate,
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const expensesByCategory: Record<string, number> = {};
    expenses.forEach((exp) => {
      if (!expensesByCategory[exp.category]) {
        expensesByCategory[exp.category] = 0;
      }
      expensesByCategory[exp.category] += exp.amount;
    });

    // Get active and completed bookings count
    const activeCustomers = await getAllCustomers({ status: "active" });
    const completedCustomers = await getAllCustomers({ status: "completed" });
    const activeBookingsCount = activeCustomers.length;
    const completedBookingsCount = completedCustomers.length;

    // Get active staff count
    const activeStaff = await getAllStaff({ status: "active" });
    const allStaff = await getAllStaff();
    const activeStaffCount = activeStaff.length;
    const totalStaffCount = allStaff.length;

    // Calculate profit/loss
    const netProfitLoss = salesSummary.totalSales - totalExpenses;
    const profitMargin = salesSummary.totalSales > 0 
      ? (netProfitLoss / salesSummary.totalSales) * 100
      : 0;

    return NextResponse.json({
      sales: {
        total: salesSummary.totalSales,
        count: salesSummary.salesCount,
        byCategory: salesSummary.salesByCategory,
        byPaymentMode: salesSummary.salesByPaymentMode,
        bySource: salesSummary.salesBySource,
      },
      expenses: {
        total: totalExpenses,
        count: expenses.length,
        byCategory: expensesByCategory,
      },
      profit: {
        net: netProfitLoss,
        margin: profitMargin,
      },
      activeBookings: activeBookingsCount,
      completedBookings: completedBookingsCount,
      totalStaff: totalStaffCount,
      activeStaff: activeStaffCount,
    });
  } catch (error: any) {
    console.error("Error fetching analytics summary:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}