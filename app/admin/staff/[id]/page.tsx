"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Trash2, Loader2, Plus, Download, Upload, X, DollarSign, Receipt, FileText, User, Save } from "lucide-react";
import { toast } from "sonner";
import type { StaffModel, StaffPayment, StaffExpense, StaffDocument } from "@/models/staff.model";

function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) return value.toDate();
  if (typeof value === "string") return new Date(value);
  return new Date();
}

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params?.id as string;
  const { data: session } = useSession();

  // State management
  const [staff, setStaff] = useState<StaffModel | null>(null);
  const [payments, setPayments] = useState<StaffPayment[]>([]);
  const [expenses, setExpenses] = useState<StaffExpense[]>([]);
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<StaffPayment | null>(null);
  const [editingExpense, setEditingExpense] = useState<StaffExpense | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Form data states
  const [editFormData, setEditFormData] = useState<Partial<StaffModel>>({});
  const [paymentFormData, setPaymentFormData] = useState<{
    amount: number;
    mode: "cash" | "UPI" | "bank";
    type: "salary" | "advance" | "bonus" | "overtime" | "other";
    month: string;
    notes: string;
    date: string;
  }>({
    amount: 0,
    mode: "cash",
    type: "salary",
    month: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [expenseFormData, setExpenseFormData] = useState<{
    amount: number;
    mode: "cash" | "UPI" | "bank";
    category: "fuel" | "travel" | "food" | "uniform" | "training" | "medical" | "other";
    customCategory: string;
    notes: string;
    date: string;
  }>({
    amount: 0,
    mode: "cash",
    category: "fuel",
    customCategory: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [documentFormData, setDocumentFormData] = useState({
    description: "",
    documentUrl: "",
  });

  // Load staff data when form opens
  useEffect(() => {
    if (staff && editDialogOpen) {
      setEditFormData({
        name: staff.name,
        age: staff.age,
        gender: staff.gender,
        phone: staff.phone,
        alternatePhone: staff.alternatePhone || "",
        designation: staff.designation,
        customDesignation: staff.customDesignation || "",
        monthlySalary: staff.monthlySalary,
        joiningDate: toDate(staff.joiningDate),
        leavingDate: staff.leavingDate ? toDate(staff.leavingDate) : undefined,
        status: staff.status,
        idProofType: staff.idProofType,
        idProofValue: staff.idProofValue || "",
        notes: staff.notes || "",
      });
    }
  }, [staff, editDialogOpen]);

  // Load payment data when editing
  useEffect(() => {
    if (editingPayment && paymentDialogOpen) {
      setPaymentFormData({
        amount: editingPayment.amount,
        mode: editingPayment.mode,
        type: editingPayment.type,
        month: editingPayment.month || "",
        notes: editingPayment.notes || "",
        date: toDate(editingPayment.date).toISOString().split("T")[0],
      });
    } else if (!editingPayment && paymentDialogOpen) {
      setPaymentFormData({
        amount: 0,
        mode: "cash",
        type: "salary",
        month: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
  }, [editingPayment, paymentDialogOpen]);

  // Load expense data when editing
  useEffect(() => {
    if (editingExpense && expenseDialogOpen) {
      setExpenseFormData({
        amount: editingExpense.amount,
        mode: editingExpense.mode,
        category: editingExpense.category,
        customCategory: editingExpense.customCategory || "",
        notes: editingExpense.notes || "",
        date: toDate(editingExpense.date).toISOString().split("T")[0],
      });
    } else if (!editingExpense && expenseDialogOpen) {
      setExpenseFormData({
        amount: 0,
        mode: "cash",
        category: "fuel",
        customCategory: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
  }, [editingExpense, expenseDialogOpen]);

  useEffect(() => {
    if (staffId) {
      fetchStaff();
      fetchPayments();
      fetchExpenses();
      fetchDocuments();
    }
  }, [staffId]);

  const fetchStaff = async () => {
    if (!staffId) return;
    try {
      const res = await fetch(`/api/staff/${staffId}`);
      const data = await res.json();
      setStaff(data.staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to load staff details");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (!staffId) return;
    try {
      const res = await fetch(`/api/staff/${staffId}/payments`);
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const fetchExpenses = async () => {
    if (!staffId) return;
    try {
      const res = await fetch(`/api/staff/${staffId}/expenses`);
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const fetchDocuments = async () => {
    if (!staffId) return;
    try {
      const res = await fetch(`/api/staff/${staffId}/documents`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleUpdateStaff = async () => {
    if (!staffId) return;
    setSaving(true);
    try {
      // Filter out undefined values and prepare clean data
      const cleanedData: any = {};

      if (editFormData.name) cleanedData.name = editFormData.name;
      if (editFormData.age) cleanedData.age = editFormData.age;
      if (editFormData.gender) cleanedData.gender = editFormData.gender;
      if (editFormData.phone) cleanedData.phone = editFormData.phone;
      if (editFormData.alternatePhone !== undefined) cleanedData.alternatePhone = editFormData.alternatePhone;
      if (editFormData.designation) cleanedData.designation = editFormData.designation;
      if (editFormData.customDesignation !== undefined) cleanedData.customDesignation = editFormData.customDesignation;
      if (editFormData.monthlySalary !== undefined) cleanedData.monthlySalary = editFormData.monthlySalary;
      if (editFormData.joiningDate) cleanedData.joiningDate = editFormData.joiningDate;
      if (editFormData.leavingDate !== undefined) cleanedData.leavingDate = editFormData.leavingDate;
      if (editFormData.status) cleanedData.status = editFormData.status;
      if (editFormData.idProofType !== undefined) cleanedData.idProofType = editFormData.idProofType;
      if (editFormData.idProofValue !== undefined) cleanedData.idProofValue = editFormData.idProofValue;
      if (editFormData.notes !== undefined) cleanedData.notes = editFormData.notes;

      const res = await fetch(`/api/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Staff updated successfully");
      setEditDialogOpen(false);
      fetchStaff();
    } catch (error) {
      toast.error("Failed to update staff");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!staffId) return;
    try {
      const res = await fetch(`/api/staff/${staffId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Staff member deleted");
      router.push("/admin/staff");
    } catch (error) {
      toast.error("Failed to delete staff");
    }
  };

  const handleSavePayment = async () => {
    if (!staffId) return;
    setSaving(true);
    try {
      const url = editingPayment
        ? `/api/staff/${staffId}/payments/${editingPayment.uid}`
        : `/api/staff/${staffId}/payments`;

      const method = editingPayment ? "PATCH" : "POST";

      // Filter out empty/undefined values
      const cleanedData: any = {
        amount: paymentFormData.amount,
        mode: paymentFormData.mode,
        type: paymentFormData.type,
        date: paymentFormData.date,
      };

      // Only add month if it's a salary payment and month is provided
      if (paymentFormData.type === "salary" && paymentFormData.month) {
        cleanedData.month = paymentFormData.month;
      }

      // Only add notes if not empty
      if (paymentFormData.notes && paymentFormData.notes.trim()) {
        cleanedData.notes = paymentFormData.notes;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });

      if (!res.ok) throw new Error("Failed to save payment");

      toast.success(editingPayment ? "Payment updated" : "Payment added");
      setPaymentDialogOpen(false);
      setEditingPayment(null);
      fetchPayments();
      fetchStaff();
    } catch (error) {
      toast.error("Failed to save payment");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!staffId) return;
    setSaving(true);
    try {
      const url = editingExpense
        ? `/api/staff/${staffId}/expenses/${editingExpense.uid}`
        : `/api/staff/${staffId}/expenses`;

      const method = editingExpense ? "PATCH" : "POST";

      // Filter out empty/undefined values
      const cleanedData: any = {
        amount: expenseFormData.amount,
        mode: expenseFormData.mode,
        category: expenseFormData.category,
        date: expenseFormData.date,
      };

      // Only add customCategory if category is "other" and value is provided
      if (expenseFormData.category === "other" && expenseFormData.customCategory && expenseFormData.customCategory.trim()) {
        cleanedData.customCategory = expenseFormData.customCategory;
      }

      // Only add notes if not empty
      if (expenseFormData.notes && expenseFormData.notes.trim()) {
        cleanedData.notes = expenseFormData.notes;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });

      if (!res.ok) throw new Error("Failed to save expense");

      toast.success(editingExpense ? "Expense updated" : "Expense added");
      setExpenseDialogOpen(false);
      setEditingExpense(null);
      fetchExpenses();
      fetchStaff();
    } catch (error) {
      toast.error("Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploadingDocument(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setDocumentFormData((prev) => ({ ...prev, documentUrl: data.url }));
      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleSaveDocument = async () => {
    if (!staffId || !documentFormData.description || !documentFormData.documentUrl) {
      toast.error("Please fill in all fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/staff/${staffId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(documentFormData),
      });

      if (!res.ok) throw new Error("Failed to save document");

      toast.success("Document added");
      setDocumentDialogOpen(false);
      setDocumentFormData({ description: "", documentUrl: "" });
      fetchDocuments();
    } catch (error) {
      toast.error("Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "on_leave": return "bg-yellow-100 text-yellow-800";
      case "resigned": return "bg-gray-100 text-gray-800";
      case "terminated": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case "salary": return "bg-blue-100 text-blue-800";
      case "advance": return "bg-purple-100 text-purple-800";
      case "bonus": return "bg-green-100 text-green-800";
      case "overtime": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatSalaryMonth = (month: string) => {
    const [year, monthNum] = month.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!staff) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Staff member not found</p>
          <Button onClick={() => router.push("/admin/staff")} className="mt-4">
            Back to Staff List
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{staff.name}</h1>
              <p className="text-muted-foreground">
                {staff.designation === "Other" && staff.customDesignation ? staff.customDesignation : staff.designation}
              </p>
            </div>
            <Badge className={getStatusColor(staff.status)}>{staff.status.replace("_", " ")}</Badge>
          </div>
          <div className="flex gap-2">
            {session?.user?.permissions?.includes("staff.edit") && (
              <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {session?.user?.permissions?.includes("staff.delete") && (
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Total Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">₹{staff.totalPayments.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="w-4 h-4 text-red-600" />
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">₹{staff.totalExpenses.toLocaleString()}</p>
            </CardContent>
          </Card>



          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600" />
                Monthly Salary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">
                ₹{staff.monthlySalary ? staff.monthlySalary.toLocaleString() : "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{staff.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Age</Label>
                  <p className="font-medium">{staff.age}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gender</Label>
                  <p className="font-medium capitalize">{staff.gender}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{staff.phone}</p>
                </div>
                {staff.alternatePhone && (
                  <div>
                    <Label className="text-muted-foreground">Alternate Phone</Label>
                    <p className="font-medium">{staff.alternatePhone}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Designation</Label>
                  <p className="font-medium">
                    {staff.designation === "Other" && staff.customDesignation ? staff.customDesignation : staff.designation}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Monthly Salary</Label>
                  <p className="font-medium">₹{staff.monthlySalary?.toLocaleString() || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Joining Date</Label>
                  <p className="font-medium">{toDate(staff.joiningDate).toLocaleDateString()}</p>
                </div>
                {staff.leavingDate && (
                  <div>
                    <Label className="text-muted-foreground">Leaving Date</Label>
                    <p className="font-medium">{toDate(staff.leavingDate).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(staff.status)}>{staff.status.replace("_", " ")}</Badge>
                </div>
                {staff.idProofType && (
                  <>
                    <div>
                      <Label className="text-muted-foreground">ID Proof Type</Label>
                      <p className="font-medium">{staff.idProofType}</p>
                    </div>
                    {staff.idProofValue && (
                      <div>
                        <Label className="text-muted-foreground">ID Proof Number</Label>
                        <p className="font-medium">{staff.idProofValue}</p>
                      </div>
                    )}
                  </>
                )}
                {staff.notes && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="font-medium whitespace-pre-wrap">{staff.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Payment History</h3>
              {session?.user?.permissions?.includes("staff.payments.create") && (
                <Button onClick={() => { setEditingPayment(null); setPaymentDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment
                </Button>
              )}
            </div>

            {payments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No payments recorded</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <Card key={payment.uid}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getPaymentTypeColor(payment.type)}>{payment.type}</Badge>
                            {payment.type === "salary" && payment.month && (
                              <span className="text-sm text-muted-foreground">{formatSalaryMonth(payment.month)}</span>
                            )}
                          </div>
                          <p className="text-2xl font-bold">₹{payment.amount.toLocaleString()}</p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Mode: <span className="capitalize">{payment.mode}</span></p>
                            <p>Date: {toDate(payment.date).toLocaleDateString()}</p>
                            {payment.notes && <p>Notes: {payment.notes}</p>}
                          </div>
                        </div>
                        {session?.user?.permissions?.includes("staff.payments.edit") && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setEditingPayment(payment); setPaymentDialogOpen(true); }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            {session?.user?.permissions?.includes("staff.payments.delete") && (
                              <Button variant="destructive" size="sm" onClick={async () => {
                                if (confirm("Delete this payment?")) {
                                  await fetch(`/api/staff/${staffId}/payments/${payment.uid}`, { method: "DELETE" });
                                  fetchPayments();
                                  fetchStaff();
                                  toast.success("Payment deleted");
                                }
                              }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Expense History</h3>
              {session?.user?.permissions?.includes("staff.expenses.create") && (
                <Button onClick={() => { setEditingExpense(null); setExpenseDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              )}
            </div>

            {expenses.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No expenses recorded</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <Card key={expense.uid}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1">
                          <Badge>{expense.category === "other" && expense.customCategory ? expense.customCategory : expense.category}</Badge>
                          <p className="text-2xl font-bold">₹{expense.amount.toLocaleString()}</p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Mode: <span className="capitalize">{expense.mode}</span></p>
                            <p>Date: {toDate(expense.date).toLocaleDateString()}</p>
                            {expense.notes && <p>Notes: {expense.notes}</p>}
                          </div>
                        </div>
                        {session?.user?.permissions?.includes("staff.expenses.edit") && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setEditingExpense(expense); setExpenseDialogOpen(true); }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            {session?.user?.permissions?.includes("staff.expenses.delete") && (
                              <Button variant="destructive" size="sm" onClick={async () => {
                                if (confirm("Delete this expense?")) {
                                  await fetch(`/api/staff/${staffId}/expenses/${expense.uid}`, { method: "DELETE" });
                                  fetchExpenses();
                                  fetchStaff();
                                  toast.success("Expense deleted");
                                }
                              }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Documents</h3>
              {session?.user?.permissions?.includes("staff.documents.create") && (
                <Button onClick={() => setDocumentDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              )}
            </div>

            {documents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No documents uploaded</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <Card key={doc.uid}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <p className="font-medium">{doc.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {toDate(doc.uploadedAt).toLocaleDateString()}
                          </p>
                          <Button variant="outline" size="sm" asChild>
                            <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        </div>
                        {session?.user?.permissions?.includes("staff.documents.delete") && (
                          <Button variant="destructive" size="sm" onClick={async () => {
                            if (confirm("Delete this document?")) {
                              await fetch(`/api/staff/${staffId}/documents/${doc.uid}`, { method: "DELETE" });
                              fetchDocuments();
                              toast.success("Document deleted");
                            }
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Staff Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>Update staff member information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={editFormData.name || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={editFormData.age || ""}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      age: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={editFormData.gender}
                    onValueChange={(value: any) => setEditFormData({ ...editFormData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={editFormData.phone || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alternate Phone</Label>
                  <Input
                    value={editFormData.alternatePhone || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, alternatePhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Select
                    value={editFormData.designation}
                    onValueChange={(value: any) => setEditFormData({ ...editFormData, designation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Cook">Cook</SelectItem>
                      <SelectItem value="Cleaner">Cleaner</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Receptionist">Receptionist</SelectItem>
                      <SelectItem value="Accountant">Accountant</SelectItem>
                      <SelectItem value="Driver">Driver</SelectItem>
                      <SelectItem value="Gardener">Gardener</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editFormData.designation === "Other" && (
                  <div className="space-y-2">
                    <Label>Custom Designation</Label>
                    <Input
                      value={editFormData.customDesignation || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, customDesignation: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Monthly Salary</Label>
                  <Input
                    type="number"
                    value={editFormData.monthlySalary || ""}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      monthlySalary: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value: any) => setEditFormData({ ...editFormData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="resigned">Resigned</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editFormData.notes || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStaff} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPayment ? "Edit Payment" : "Add Payment"}</DialogTitle>
              <DialogDescription>
                {editingPayment ? "Update payment details" : "Record a new payment"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={paymentFormData.amount || ""}
                  onChange={(e) => setPaymentFormData({
                    ...paymentFormData,
                    amount: e.target.value ? parseFloat(e.target.value) : 0
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <Select
                    value={paymentFormData.type}
                    onValueChange={(value: any) => setPaymentFormData({ ...paymentFormData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="advance">Advance</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                      <SelectItem value="overtime">Overtime</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select
                    value={paymentFormData.mode}
                    onValueChange={(value: any) => setPaymentFormData({ ...paymentFormData, mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {paymentFormData.type === "salary" && (
                <div className="space-y-2">
                  <Label>Month (YYYY-MM)</Label>
                  <Input
                    type="month"
                    value={paymentFormData.month}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, month: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={paymentFormData.date}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSavePayment} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Expense Dialog */}
        <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
              <DialogDescription>
                {editingExpense ? "Update expense details" : "Record a new expense"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={expenseFormData.amount || ""}
                  onChange={(e) => setExpenseFormData({
                    ...expenseFormData,
                    amount: e.target.value ? parseFloat(e.target.value) : 0
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={expenseFormData.category}
                    onValueChange={(value: any) => setExpenseFormData({ ...expenseFormData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fuel">Fuel</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="uniform">Uniform</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select
                    value={expenseFormData.mode}
                    onValueChange={(value: any) => setExpenseFormData({ ...expenseFormData, mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {expenseFormData.category === "other" && (
                <div className="space-y-2">
                  <Label>Custom Category</Label>
                  <Input
                    value={expenseFormData.customCategory}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, customCategory: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={expenseFormData.date}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={expenseFormData.notes}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExpenseDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSaveExpense} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Document Dialog */}
        <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>Add a new document for this staff member</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={documentFormData.description}
                  onChange={(e) => setDocumentFormData({ ...documentFormData, description: e.target.value })}
                  placeholder="e.g., Aadhar Card, Resume, Certificate"
                />
              </div>
              <div className="space-y-2">
                <Label>Upload File</Label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleDocumentUpload}
                  disabled={uploadingDocument}
                />
                {uploadingDocument && <p className="text-sm text-muted-foreground">Uploading...</p>}
                {documentFormData.documentUrl && (
                  <p className="text-sm text-green-600">Document uploaded successfully</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDocumentDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSaveDocument} disabled={saving || !documentFormData.documentUrl}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Save Document
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this staff member and all associated records including payments, expenses, and documents. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
}