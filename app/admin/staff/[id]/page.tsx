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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Trash2, Loader2, Plus, Download, Upload, X, DollarSign, Receipt, FileText, User } from "lucide-react";
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
  const [staff, setStaff] = useState<StaffModel | null>(null);
  const [payments, setPayments] = useState<StaffPayment[]>([]);
  const [expenses, setExpenses] = useState<StaffExpense[]>([]);
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<StaffPayment | null>(null);
  const [editingExpense, setEditingExpense] = useState<StaffExpense | null>(null);

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
        <div className="flex items-center justify-between">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <DollarSign className="w-4 h-4 text-blue-600" />
                Net Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                ₹{(staff.totalPayments - staff.totalExpenses).toLocaleString()}
              </p>
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

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

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
                  <p className="font-medium">{staff.gender}</p>
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
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getPaymentTypeColor(payment.type)}>{payment.type}</Badge>
                            {payment.type === "salary" && payment.month && (
                              <span className="text-sm text-muted-foreground">{formatSalaryMonth(payment.month)}</span>
                            )}
                          </div>
                          <p className="text-2xl font-bold">₹{payment.amount.toLocaleString()}</p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Mode: {payment.mode}</p>
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
                        <div className="space-y-1">
                          <Badge>{expense.category === "other" && expense.customCategory ? expense.customCategory : expense.category}</Badge>
                          <p className="text-2xl font-bold">₹{expense.amount.toLocaleString()}</p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Mode: {expense.mode}</p>
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

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this staff member and all associated records. This action cannot be undone.
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