"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Loader2, Upload, X, Eye, Calendar, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import type { ExpenseModel, MonthlyExpenseCategory } from "@/models/expense.model";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";

const MONTHLY_CATEGORIES: MonthlyExpenseCategory[] = ["food", "miscellaneous", "service", "maintenance", "staff"];

function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) return value.toDate();
  if (typeof value === "string") return new Date(value);
  return new Date();
}

export default function MonthlyExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseModel | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [uploadingReceipts, setUploadingReceipts] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    category: "food" as MonthlyExpenseCategory,
    description: "",
    receiptUrls: [] as string[],
  });

  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [receiptPreviews, setReceiptPreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, startDate, endDate]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (categoryFilter !== "all") {
        params.set("category", categoryFilter);
      }

      if (startDate) {
        params.set("startDate", startDate);
      }

      if (endDate) {
        params.set("endDate", endDate);
      }

      const res = await fetch(`/api/expenses?${params}`);
      const data = await res.json();

      const monthlyExpenses = (data.expenses || []).filter(
        (e: ExpenseModel) => e.category !== "yearly" && e.category !== "salary"
      );

      setExpenses(monthlyExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 5MB`);
        return false;
      }
      return true;
    });

    setReceiptFiles((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeReceipt = (index: number) => {
    setReceiptFiles((prev) => prev.filter((_, i) => i !== index));
    setReceiptPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadReceipts = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of receiptFiles) {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `receipts/${fileName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      uploadedUrls.push(url);
    }

    return uploadedUrls;
  };

  const openDialog = (expense?: ExpenseModel) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        date: toDate(expense.date).toISOString().split("T")[0],
        amount: expense.amount.toString(),
        category: expense.category as MonthlyExpenseCategory,
        description: expense.description,
        receiptUrls: expense.receiptUrls || [],
      });
    } else {
      setEditingExpense(null);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        amount: "",
        category: "food",
        description: "",
        receiptUrls: [],
      });
    }
    setReceiptFiles([]);
    setReceiptPreviews([]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.amount || !formData.description) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    setUploadingReceipts(receiptFiles.length > 0);

    try {
      let receiptUrls = formData.receiptUrls;

      if (receiptFiles.length > 0) {
        const uploadedUrls = await uploadReceipts();
        receiptUrls = [...receiptUrls, ...uploadedUrls];
      }

      const payload = {
        date: formData.date,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        receiptUrls,
      };

      if (editingExpense) {
        const res = await fetch(`/api/expenses/${editingExpense.uid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Failed to update expense");
        toast.success("Expense updated successfully");
      } else {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Failed to create expense");
        toast.success("Expense added successfully");
      }

      setDialogOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense");
    } finally {
      setSaving(false);
      setUploadingReceipts(false);
    }
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;

    try {
      const res = await fetch(`/api/expenses/${expenseToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete expense");

      toast.success("Expense deleted successfully");
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Monthly Expenses</h1>
            <p className="text-muted-foreground mt-1">Track daily operational expenses</p>
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>

        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              Total Monthly Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">₹{totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {MONTHLY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : expenses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No expenses found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-semibold">Date</th>
                  <th className="p-3 text-left font-semibold">Category</th>
                  <th className="p-3 text-left font-semibold">Description</th>
                  <th className="p-3 text-right font-semibold">Amount</th>
                  <th className="p-3 text-center font-semibold">Receipts</th>
                  <th className="p-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.uid} className="border-b hover:bg-muted/30">
                    <td className="p-3">{toDate(expense.date).toLocaleDateString("en-IN")}</td>
                    <td className="p-3 capitalize">{expense.category}</td>
                    <td className="p-3">{expense.description}</td>
                    <td className="p-3 text-right font-semibold">₹{expense.amount.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      {expense.receiptUrls && expense.receiptUrls.length > 0 ? (
                        <span className="text-sm text-muted-foreground">
                          {expense.receiptUrls.length} file(s)
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-center">
                        <Button variant="ghost" size="sm" onClick={() => openDialog(expense)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setExpenseToDelete(expense.uid);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹) *</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value as MonthlyExpenseCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHLY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Enter expense description"
                />
              </div>

              <div className="space-y-2">
                <Label>Upload Receipts</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <input
                    type="file"
                    id="receipts"
                    accept="image/*,.pdf"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="receipts" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload receipts</span>
                  </label>
                </div>

                {formData.receiptUrls.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Existing Receipts:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.receiptUrls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Receipt {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {receiptPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {receiptPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Receipt ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={() => removeReceipt(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || uploadingReceipts}>
                {saving || uploadingReceipts ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadingReceipts ? "Uploading..." : "Saving..."}
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this expense? This action cannot be undone.
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