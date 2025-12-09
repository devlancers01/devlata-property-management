"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Car,
  CreditCard,
  Users,
  Plus,
  Receipt,
  MessageCircle,
  Loader2,
  Calendar,
  IndianRupee,
  FileText,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
  Eye,
  AlertCircle,
  Ban,
} from "lucide-react";
import type { CustomerModel } from "@/models/customer.model";
import { toast } from "sonner";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase/config";

// Helper to safely convert to Date
function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return value.toDate();
  }
  if (typeof value === "string") return new Date(value);
  return new Date();
}

import type { GroupMember, ExtraCharge } from "@/models/customer.model";
import { PaymentMode, PaymentType, Payment } from "@/models/customer.model";
import Footer from "@/components/footer";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerModel | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);
  const [recordInExpenses, setRecordInExpenses] = useState(true);

  // Form states
  const [personalForm, setPersonalForm] = useState<any>({});
  const [bookingForm, setBookingForm] = useState<any>({});

  // File upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [idProofPreview, setIdProofPreview] = useState<string>("");

  // Member dialog states
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);
  const [memberForm, setMemberForm] = useState<any>({});
  const [memberIdProofFile, setMemberIdProofFile] = useState<File | null>(null);
  const [memberIdProofPreview, setMemberIdProofPreview] = useState<string>("");
  const [savingMember, setSavingMember] = useState(false);

  // Payment dialog states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentForm, setPaymentForm] = useState<any>({});
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);
  const [paymentReceiptPreview, setPaymentReceiptPreview] = useState<string>("");
  const [savingPayment, setSavingPayment] = useState(false);

  // Charge dialog states
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<ExtraCharge | null>(null);
  const [chargeForm, setChargeForm] = useState<any>({});
  const [savingCharge, setSavingCharge] = useState(false);

  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cancellation dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [refundForm, setRefundForm] = useState<any>({});
  const [refundReceiptFile, setRefundReceiptFile] = useState<File | null>(null);
  const [refundReceiptPreview, setRefundReceiptPreview] = useState<string>("");
  const [processingCancellation, setProcessingCancellation] = useState(false);

  // Conflict warning
  const [conflictWarning, setConflictWarning] = useState<string>("");

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);

      // Fetch customer
      const customerRes = await fetch(`/api/customers/${customerId}`);
      const customerData = await customerRes.json();
      setCustomer(customerData.customer);
      setPersonalForm(customerData.customer);
      setBookingForm(customerData.customer);

      // Fetch group members
      const membersRes = await fetch(`/api/customers/${customerId}/members`);
      const membersData = await membersRes.json();
      setGroupMembers(membersData.members || []);

      // Fetch payments
      const paymentsRes = await fetch(`/api/customers/${customerId}/payments`);
      const paymentsData = await paymentsRes.json();
      setPayments(paymentsData.payments || []);

      // Fetch extra charges
      const chargesRes = await fetch(`/api/customers/${customerId}/charges`);
      const chargesData = await chargesRes.json();
      setExtraCharges(chargesData.charges || []);

      // Fetch refunds
      const refundsRes = await fetch(`/api/customers/${customerId}/refunds`);
      const refundsData = await refundsRes.json();
      setRefunds(refundsData.refunds || []);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast.error("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals in real-time
  const calculateTotals = () => {
    if (!customer) return { total: 0, received: 0, balance: 0 };

    const stayCharges = bookingForm.stayCharges || customer.stayCharges || 0;
    const cuisineCharges = bookingForm.cuisineCharges || customer.cuisineCharges || 0;
    const extraChargesTotal = extraCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const totalAmount = stayCharges + cuisineCharges + extraChargesTotal;
    const receivedAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const balanceAmount = totalAmount - receivedAmount;

    return {
      total: totalAmount,
      received: receivedAmount,
      balance: balanceAmount,
    };
  };

  const totals = calculateTotals();

  // Check for booking conflicts
  const checkConflicts = async (checkIn: Date, checkOut: Date) => {
    try {
      const res = await fetch("/api/customers/conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          excludeCustomerId: customerId,
        }),
      });

      const data = await res.json();

      if (data.hasConflict) {
        setConflictWarning(
          `⚠️ Booking conflict! ${data.conflictingBookings.length} existing booking(s) overlap with these dates.`
        );
      } else {
        setConflictWarning("");
      }
    } catch (error) {
      console.error("Error checking conflicts:", error);
    }
  };

  // File upload helper
  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // Delete file helper
  const deleteFile = async (url: string) => {
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // Handle file change
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (preview: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, or PDF files are allowed");
      return;
    }

    setFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview("");
    }
  };

  // Save Personal Information
  const savePersonalInfo = async () => {
    setSavingPersonal(true);
    try {
      let idProofUrl = personalForm.idProofUrl;

      // Upload new ID proof if selected
      if (idProofFile) {
        setUploadingFile(true);
        // Delete old file if exists
        if (personalForm.idProofUrl) {
          await deleteFile(personalForm.idProofUrl);
        }
        idProofUrl = await uploadFile(idProofFile, "id-proofs");
        setUploadingFile(false);
      }

      const updateData = {
        name: personalForm.name,
        age: personalForm.age,
        phone: personalForm.phone,
        email: personalForm.email,
        address: personalForm.address,
        idType: personalForm.idType,
        idValue: personalForm.idValue || "",
        idProofUrl: idProofUrl || "",
        vehicleNumber: personalForm.vehicleNumber,
      };

      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) throw new Error("Failed to update personal information");

      toast.success("Personal information updated successfully!");
      setEditingPersonal(false);
      setIdProofFile(null);
      setIdProofPreview("");
      fetchCustomerDetails();
    } catch (error) {
      console.error("Error saving personal info:", error);
      toast.error("Failed to update personal information");
    } finally {
      setSavingPersonal(false);
      setUploadingFile(false);
    }
  };

  // Save Booking Information
  const saveBookingInfo = async () => {
    // Validate dates
    const checkIn = new Date(bookingForm.checkIn);
    const checkOut = new Date(bookingForm.checkOut);

    if (checkOut <= checkIn) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    setSavingBooking(true);
    try {
      const updateData = {
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        checkInTime: bookingForm.checkInTime,
        checkOutTime: bookingForm.checkOutTime,
        instructions: bookingForm.instructions || "",
        stayCharges: parseFloat(bookingForm.stayCharges) || 0,
        cuisineCharges: parseFloat(bookingForm.cuisineCharges) || 0,
        advancePaymentMode: bookingForm.advancePaymentMode || "",
      };

      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) throw new Error("Failed to update booking information");

      toast.success("Booking information updated successfully!");
      setEditingBooking(false);
      setConflictWarning("");
      fetchCustomerDetails();
    } catch (error) {
      console.error("Error saving booking info:", error);
      toast.error("Failed to update booking information");
    } finally {
      setSavingBooking(false);
    }
  };

  // Member CRUD Operations
  const openMemberDialog = (member?: GroupMember) => {
    if (member) {
      setEditingMember(member);
      setMemberForm(member);
      setMemberIdProofPreview(member.idProofUrl || "");
    } else {
      setEditingMember(null);
      setMemberForm({ name: "", age: "", idType: "Aadhar", idValue: "" });
      setMemberIdProofPreview("");
    }
    setMemberIdProofFile(null);
    setMemberDialogOpen(true);
  };

  const saveMember = async () => {
    if (!memberForm.name || !memberForm.age || !memberForm.idType) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!memberForm.idValue && !memberForm.idProofUrl && !memberIdProofFile) {
      toast.error("Either ID number or ID proof image is required");
      return;
    }

    setSavingMember(true);
    try {
      let idProofUrl = memberForm.idProofUrl;

      // Upload new ID proof if selected
      if (memberIdProofFile) {
        if (memberForm.idProofUrl) {
          await deleteFile(memberForm.idProofUrl);
        }
        idProofUrl = await uploadFile(memberIdProofFile, "id-proofs");
      }

      const memberData = {
        name: memberForm.name,
        age: parseInt(memberForm.age),
        gender: memberForm.gender || "male",
        idType: memberForm.idType,
        idValue: memberForm.idValue || "",
        idProofUrl: idProofUrl || "",
      };

      if (editingMember) {
        // Update member
        const res = await fetch(`/api/customers/${customerId}/members/${editingMember.uid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberData),
        });

        if (!res.ok) throw new Error("Failed to update member");
        toast.success("Member updated successfully!");
      } else {
        // Add new member
        const res = await fetch(`/api/customers/${customerId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberData),
        });

        if (!res.ok) throw new Error("Failed to add member");
        toast.success("Member added successfully!");
      }

      setMemberDialogOpen(false);
      fetchCustomerDetails();
    } catch (error) {
      console.error("Error saving member:", error);
      toast.error("Failed to save member");
    } finally {
      setSavingMember(false);
    }
  };

  // Payment CRUD Operations
  const openPaymentDialog = (payment?: Payment) => {
    if (payment) {
      setEditingPayment(payment);
      setPaymentForm({ ...payment, amount: payment.amount.toString() });
      setPaymentReceiptPreview(payment.receiptUrl || "");
    } else {
      setEditingPayment(null);
      setPaymentForm({ amount: "", mode: "cash", notes: "" });
      setPaymentReceiptPreview("");
    }
    setPaymentReceiptFile(null);
    setPaymentDialogOpen(true);
  };

  const savePayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSavingPayment(true);
    try {
      let receiptUrl = paymentForm.receiptUrl;

      // Upload new receipt if selected
      if (paymentReceiptFile) {
        if (paymentForm.receiptUrl) {
          await deleteFile(paymentForm.receiptUrl);
        }
        receiptUrl = await uploadFile(paymentReceiptFile, "receipts");
      }

      const paymentData = {
        amount: parseFloat(paymentForm.amount),
        mode: paymentForm.mode,
        type: paymentForm.type || "advance",
        notes: paymentForm.notes || "",
        receiptUrl: receiptUrl || "",
      };

      if (editingPayment) {
        // Update payment
        const res = await fetch(
          `/api/customers/${customerId}/payments/${editingPayment.uid}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(paymentData),
          }
        );

        if (!res.ok) throw new Error("Failed to update payment");
        toast.success("Payment updated successfully!");
      } else {
        // Add new payment
        const res = await fetch(`/api/customers/${customerId}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentData),
        });

        if (!res.ok) throw new Error("Failed to add payment");
        toast.success("Payment added successfully!");
      }

      setPaymentDialogOpen(false);
      fetchCustomerDetails();
    } catch (error) {
      console.error("Error saving payment:", error);
      toast.error("Failed to save payment");
    } finally {
      setSavingPayment(false);
    }
  };

  // Charge CRUD Operations
  const openChargeDialog = (charge?: ExtraCharge) => {
    if (charge) {
      setEditingCharge(charge);
      setChargeForm({ ...charge, amount: charge.amount.toString() });
      setRecordInExpenses(charge.recordInExpenses ?? true);
    } else {
      setEditingCharge(null);
      setChargeForm({ description: "", amount: "" });
      setRecordInExpenses(true); // Default to true
    }
    setChargeDialogOpen(true);
  };

  const saveCharge = async () => {
    if (!chargeForm.description || !chargeForm.amount || parseFloat(chargeForm.amount) <= 0) {
      toast.error("Please fill all fields with valid values");
      return;
    }

    setSavingCharge(true);
    try {
      const chargeData = {
        description: chargeForm.description,
        amount: parseFloat(chargeForm.amount),
        recordInExpenses,
      };

      if (editingCharge) {
        // Update charge
        const res = await fetch(`/api/customers/${customerId}/charges/${editingCharge.uid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chargeData),
        });

        if (!res.ok) throw new Error("Failed to update charge");
        toast.success("Charge updated successfully!");
      } else {
        // Add new charge
        const res = await fetch(`/api/customers/${customerId}/charges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chargeData),
        });

        if (!res.ok) throw new Error("Failed to add charge");
        toast.success("Charge added successfully!");
      }

      setChargeDialogOpen(false);
      fetchCustomerDetails();
    } catch (error) {
      console.error("Error saving charge:", error);
      toast.error("Failed to save charge");
    } finally {
      setSavingCharge(false);
    }
  };

  // Delete Operations
  const confirmDelete = (type: string, id: string) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      const { type, id } = itemToDelete;
      let endpoint = "";

      if (type === "member") {
        endpoint = `/api/customers/${customerId}/members/${id}`;
      } else if (type === "payment") {
        endpoint = `/api/customers/${customerId}/payments/${id}`;
      } else if (type === "charge") {
        endpoint = `/api/customers/${customerId}/charges/${id}`;
      }

      const res = await fetch(endpoint, { method: "DELETE" });

      if (!res.ok) throw new Error(`Failed to delete ${type}`);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchCustomerDetails();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error(`Failed to delete ${itemToDelete.type}`);
    } finally {
      setDeleting(false);
    }
  };

  // Handle cancellation
  const handleCancellation = async () => {
    if (!refundForm.amount || parseFloat(refundForm.amount) < 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }

    if (parseFloat(refundForm.amount) > (customer?.receivedAmount || 0)) {
      toast.error("Refund amount cannot exceed received amount");
      return;
    }

    setProcessingCancellation(true);
    try {
      let receiptUrl = refundForm.receiptUrl;

      // Upload refund receipt if selected
      if (refundReceiptFile) {
        receiptUrl = await uploadFile(refundReceiptFile, "receipts");
      }

      const refundData = {
        amount: parseFloat(refundForm.amount),
        method: refundForm.method || "cash",
        reason: refundForm.reason || "",
        receiptUrl: receiptUrl || "",
      };

      const res = await fetch(`/api/customers/${customerId}/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refundData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process cancellation");
      }

      toast.success("Booking cancelled successfully!");
      setCancelDialogOpen(false);
      setRefundForm({});
      setRefundReceiptFile(null);
      setRefundReceiptPreview("");
      fetchCustomerDetails();
    } catch (error: any) {
      console.error("Error processing cancellation:", error);
      toast.error(error.message || "Failed to cancel booking");
    } finally {
      setProcessingCancellation(false);
    }
  };

  const handleWhatsApp = () => {
    if (!customer) return;
    const message = encodeURIComponent(
      `Hello ${customer.name}, this is regarding your booking at Devlata Villa from ${toDate(
        customer.checkIn
      ).toLocaleDateString()} to ${toDate(customer.checkOut).toLocaleDateString()}.`
    );
    window.open(`https://wa.me/${customer.phone.replace(/\D/g, "")}?text=${message}`, "_blank");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!customer) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Customer not found</p>
          <Button onClick={() => router.push("/customers")} className="mt-4">
            Back to Customers
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/customers")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{customer.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Booking ID: {customer.uid.slice(0, 8)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className={getStatusColor(customer.status)}>{customer.status}</Badge>
            {customer.status === "active" &&
              session?.user?.permissions?.some((p: string) => ["bookings.delete", "bookings.edit"].includes(p)) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setRefundForm({
                      amount: customer.receivedAmount.toString(),
                      method: "cash",
                      reason: "",
                    });
                    setCancelDialogOpen(true);
                  }}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Cancel Booking
                </Button>
              )}
            <Button variant="outline" size="sm" onClick={handleWhatsApp}>
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>

        {customer.status === "cancelled" && customer.cancelledAt && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Ban className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm text-red-900 dark:text-red-100 font-semibold">
                    Booking Cancelled
                  </p>
                  <p className="text-xs text-red-800 dark:text-red-200 mt-1">
                    Cancelled on {toDate(customer.cancelledAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {customer.refundAmount && customer.refundAmount > 0 && (
                    <p className="text-xs text-red-800 dark:text-red-200 mt-1">
                      Refund Amount: ₹{customer.refundAmount.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <IndianRupee className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold">₹{totals.total.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Received</p>
                  <p className="text-lg font-bold text-green-600">
                    ₹{totals.received.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${totals.balance > 0 ? "bg-red-100" : "bg-green-100"
                    }`}
                >
                  <IndianRupee
                    className={`w-5 h-5 ${totals.balance > 0 ? "text-red-600" : "text-green-600"
                      }`}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p
                    className={`text-lg font-bold ${totals.balance > 0 ? "text-red-600" : "text-green-600"
                      }`}
                  >
                    ₹{totals.balance.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-lg font-bold">
                    {Math.ceil(
                      (toDate(customer.checkOut).getTime() -
                        toDate(customer.checkIn).getTime()) /
                      (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="members">Members ({groupMembers.length})</TabsTrigger>
            <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
            <TabsTrigger value="charges">Charges ({extraCharges.length})</TabsTrigger>
            {refunds.length > 0 && <TabsTrigger value="refunds">Refunds ({refunds.length})</TabsTrigger>}
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                    {!editingPersonal ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPersonal(true)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPersonal(false);
                            setPersonalForm(customer);
                            setIdProofFile(null);
                            setIdProofPreview("");
                          }}
                          disabled={savingPersonal}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={savePersonalInfo}
                          disabled={savingPersonal || uploadingFile}
                        >
                          {savingPersonal || uploadingFile ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingPersonal ? (
                    <>
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          value={personalForm.name || ""}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, name: e.target.value })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">

                        <div className="space-y-2">
                          <Label>Age *</Label>
                          <Input
                            type="number"
                            value={personalForm.age || ""}
                            onChange={(e) =>
                              setPersonalForm({
                                ...personalForm,
                                age: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone *</Label>
                          <Input
                            value={personalForm.phone || ""}
                            onChange={(e) =>
                              setPersonalForm({ ...personalForm, phone: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={personalForm.email || ""}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, email: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Address *</Label>
                        <Textarea
                          value={personalForm.address || ""}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, address: e.target.value })
                          }
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>ID Type *</Label>
                        <Select
                          value={personalForm.idType}
                          onValueChange={(value) =>
                            setPersonalForm({ ...personalForm, idType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Aadhar">Aadhar Card</SelectItem>
                            <SelectItem value="PAN">PAN Card</SelectItem>
                            <SelectItem value="Driving License">Driving License</SelectItem>
                            <SelectItem value="Passport">Passport</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>ID Number</Label>
                        <Input
                          value={personalForm.idValue || ""}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, idValue: e.target.value })
                          }
                          placeholder="Optional if uploading ID proof"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>ID Proof</Label>
                        {personalForm.idProofUrl && !idProofFile && (
                          <div className="flex items-center gap-2 mb-2">
                            <a
                              href={personalForm.idProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View Current ID Proof
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPersonalForm({ ...personalForm, idProofUrl: "" });
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                        <div className="border-2 border-dashed rounded-lg p-4">
                          <input
                            type="file"
                            id="idProof"
                            accept="image/*,.pdf"
                            onChange={(e) =>
                              handleFileChange(e, setIdProofFile, setIdProofPreview)
                            }
                            className="hidden"
                          />
                          <label
                            htmlFor="idProof"
                            className="cursor-pointer flex flex-col items-center gap-2"
                          >
                            <Upload className="w-8 h-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Upload new ID proof
                            </span>
                          </label>
                        </div>
                        {idProofPreview && (
                          <img
                            src={idProofPreview}
                            alt="ID Preview"
                            className="mt-2 max-w-full h-32 object-contain rounded border"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Vehicle Number *</Label>
                        <Input
                          value={personalForm.vehicleNumber || ""}
                          onChange={(e) =>
                            setPersonalForm({
                              ...personalForm,
                              vehicleNumber: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="font-medium">{customer.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium">{customer.email}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="font-medium">{customer.address}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-xs text-muted-foreground">ID Proof</p>
                          <p className="font-medium">
                            {customer.idType} {customer.idValue && `- ${customer.idValue}`}
                          </p>
                          {customer.idProofUrl && (
                            <a
                              href={customer.idProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              View ID Proof
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Car className="w-5 h-5 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-xs text-muted-foreground">Vehicle Number</p>
                          <p className="font-medium">{customer.vehicleNumber}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Booking Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Booking Information</CardTitle>
                    {!editingBooking ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingBooking(true)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingBooking(false);
                            setBookingForm(customer);
                            setConflictWarning("");
                          }}
                          disabled={savingBooking}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveBookingInfo}
                          disabled={savingBooking}
                        >
                          {savingBooking ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingBooking ? (
                    <>
                      {conflictWarning && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
                          <p className="text-sm text-yellow-800">{conflictWarning}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Check-In Date *</Label>
                          <Input
                            type="date"
                            value={
                              bookingForm.checkIn
                                ? new Date(bookingForm.checkIn).toISOString().split("T")[0]
                                : ""
                            }
                            onChange={(e) => {
                              setBookingForm({
                                ...bookingForm,
                                checkIn: new Date(e.target.value),
                              });
                              if (bookingForm.checkOut) {
                                checkConflicts(new Date(e.target.value), bookingForm.checkOut);
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Check-In Time</Label>
                          <Input
                            type="time"
                            value={bookingForm.checkInTime || ""}
                            onChange={(e) =>
                              setBookingForm({
                                ...bookingForm,
                                checkInTime: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Check-Out Date *</Label>
                          <Input
                            type="date"
                            value={
                              bookingForm.checkOut
                                ? new Date(bookingForm.checkOut).toISOString().split("T")[0]
                                : ""
                            }
                            onChange={(e) => {
                              setBookingForm({
                                ...bookingForm,
                                checkOut: new Date(e.target.value),
                              });
                              if (bookingForm.checkIn) {
                                checkConflicts(bookingForm.checkIn, new Date(e.target.value));
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Check-Out Time</Label>
                          <Input
                            type="time"
                            value={bookingForm.checkOutTime || ""}
                            onChange={(e) =>
                              setBookingForm({
                                ...bookingForm,
                                checkOutTime: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Special Instructions</Label>
                        <Textarea
                          value={bookingForm.instructions || ""}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              instructions: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder="Any special requests..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Stay Charges (₹) *</Label>
                          <Input
                            type="number"
                            value={bookingForm.stayCharges || ""}
                            onChange={(e) =>
                              setBookingForm({
                                ...bookingForm,
                                stayCharges: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cuisine Charges (₹)</Label>
                          <Input
                            type="number"
                            value={bookingForm.cuisineCharges || ""}
                            onChange={(e) =>
                              setBookingForm({
                                ...bookingForm,
                                cuisineCharges: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Advance Payment Mode</Label>
                        <Select
                          value={bookingForm.advancePaymentMode || ""}
                          onValueChange={(value) =>
                            setBookingForm({
                              ...bookingForm,
                              advancePaymentMode: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="bank">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-xs text-muted-foreground">Check-In</p>
                          <p className="font-medium">
                            {toDate(customer.checkIn).toLocaleDateString("en-IN", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            at {customer.checkInTime}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-xs text-muted-foreground">Check-Out</p>
                          <p className="font-medium">
                            {toDate(customer.checkOut).toLocaleDateString("en-IN", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            at {customer.checkOutTime}
                          </p>
                        </div>
                      </div>

                      {customer.instructions && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Special Instructions
                          </p>
                          <p className="text-sm bg-slate-50 p-3 rounded-lg">
                            {customer.instructions}
                          </p>
                        </div>
                      )}

                      <div className="pt-4 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Stay Charges:</span>
                          <span className="font-medium">
                            ₹{customer.stayCharges.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Cuisine Charges:</span>
                          <span className="font-medium">
                            ₹{customer.cuisineCharges.toLocaleString()}
                          </span>
                        </div>
                        {/* {customer.advancePaymentMode && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Payment Mode:</span>
                            <span className="font-medium">{customer.advancePaymentMode}</span>
                          </div>
                        )} 
                         */}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Group Members</h3>
              <Button onClick={() => openMemberDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>

            {groupMembers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No group members added</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupMembers.map((member) => (
                  <Card key={member.uid}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold">{member.name}</h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openMemberDialog(member)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete("member", member.uid)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-muted-foreground">Age:</span> {member.age}
                        </div>
                        <div>
                          <span className="text-muted-foreground">ID Type:</span>{" "}
                          {member.idType}
                        </div>
                        {member.idValue && (
                          <div>
                            <span className="text-muted-foreground">ID Number:</span>{" "}
                            {member.idValue}
                          </div>
                        )}
                        {member.idProofUrl && (
                          <a
                            href={member.idProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-xs flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View ID Proof
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Payment History</h3>
              <Button onClick={() => openPaymentDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Payment
              </Button>
            </div>

            {payments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No payments recorded</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <Card key={payment.uid}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">
                              ₹{payment.amount.toLocaleString()}
                            </span>
                            <Badge variant="outline">{payment.mode}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {toDate(payment.date).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {payment.notes && (
                            <p className="text-sm text-muted-foreground">{payment.notes}</p>
                          )}
                          {payment.receiptUrl && (
                            <a
                              href={payment.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View Receipt
                            </a>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPaymentDialog(payment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete("payment", payment.uid)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Extra Charges Tab */}
          <TabsContent value="charges" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Extra Charges</h3>
              <Button onClick={() => openChargeDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Charge
              </Button>
            </div>

            {extraCharges.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <IndianRupee className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No extra charges added</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {extraCharges.map((charge) => (
                  <Card key={charge.uid}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold">{charge.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {toDate(charge.date).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">
                            ₹{charge.amount.toLocaleString()}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openChargeDialog(charge)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete("charge", charge.uid)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Refunds Tab */}
          <TabsContent value="refunds" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Refund History</h3>
            </div>

            {refunds.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No refunds processed</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {refunds.map((refund: any) => (
                  <Card key={refund.uid} className="border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg text-red-600">
                              -₹{refund.amount.toLocaleString()}
                            </span>
                            <Badge variant="outline">{refund.method}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {toDate(refund.date).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {refund.reason && (
                            <p className="text-sm text-muted-foreground">
                              Reason: {refund.reason}
                            </p>
                          )}
                          {refund.processedBy && (
                            <p className="text-xs text-muted-foreground">
                              Processed by: {refund.processedBy}
                            </p>
                          )}
                          {refund.receiptUrl && (
                            <a
                              href={refund.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View Receipt
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Member Dialog */}
        <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? "Edit Member" : "Add Group Member"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={memberForm.name || ""}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Age *</Label>
                  <Input
                    type="number"
                    value={memberForm.age || ""}
                    onChange={(e) => setMemberForm({ ...memberForm, age: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>ID Type *</Label>
                <Select
                  value={memberForm.idType}
                  onValueChange={(value) => setMemberForm({ ...memberForm, idType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aadhar">Aadhar Card</SelectItem>
                    <SelectItem value="PAN">PAN Card</SelectItem>
                    <SelectItem value="Driving License">Driving License</SelectItem>
                    <SelectItem value="Passport">Passport</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ID Number</Label>
                <Input
                  value={memberForm.idValue || ""}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, idValue: e.target.value })
                  }
                  placeholder="Optional if uploading ID proof"
                />
              </div>

              <div className="space-y-2">
                <Label>ID Proof</Label>
                {memberForm.idProofUrl && !memberIdProofFile && (
                  <div className="flex items-center gap-2 mb-2">
                    <a
                      href={memberForm.idProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Current ID Proof
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMemberForm({ ...memberForm, idProofUrl: "" });
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                )}
                <div className="border-2 border-dashed rounded-lg p-4">
                  <input
                    type="file"
                    id="memberIdProof"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      handleFileChange(e, setMemberIdProofFile, setMemberIdProofPreview)
                    }
                    className="hidden"
                  />
                  <label
                    htmlFor="memberIdProof"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload ID proof</span>
                  </label>
                </div>
                {memberIdProofPreview && (
                  <img
                    src={memberIdProofPreview}
                    alt="ID Preview"
                    className="mt-2 max-w-full h-32 object-contain rounded border"
                  />
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setMemberDialogOpen(false)}
                  disabled={savingMember}
                >
                  Cancel
                </Button>
                <Button onClick={saveMember} disabled={savingMember}>
                  {savingMember ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Member"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? "Edit Payment" : "Add Payment"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="space-y-2">
  <Label>Amount (₹) *</Label>
  <Input
    type="number"
    value={paymentForm.amount || ""}
    onChange={(e) =>
      setPaymentForm({ ...paymentForm, amount: e.target.value })
    }
  />
</div>

<div className="space-y-2">
  <Label>Payment Mode *</Label>
  <Select
    value={paymentForm.mode}
    onValueChange={(value) =>
      setPaymentForm({ ...paymentForm, mode: value })
    }
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

<div className="space-y-2">
  <Label>Type *</Label>
  <Select
    value={paymentForm.type}
    onValueChange={(value) =>
      setPaymentForm({ ...paymentForm, type: value as "advance" | "final" | "part" })
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Select type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="advance">Advance</SelectItem>
      <SelectItem value="final">Final</SelectItem>
      <SelectItem value="part">Part</SelectItem>
    </SelectContent>
  </Select>
</div>

              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={paymentForm.notes || ""}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="space-y-2">
                <Label>Receipt</Label>
                {paymentForm.receiptUrl && !paymentReceiptFile && (
                  <div className="flex items-center gap-2 mb-2">
                    <a
                      href={paymentForm.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Current Receipt
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPaymentForm({ ...paymentForm, receiptUrl: "" });
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                )}
                <div className="border-2 border-dashed rounded-lg p-4">
                  <input
                    type="file"
                    id="paymentReceipt"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      handleFileChange(e, setPaymentReceiptFile, setPaymentReceiptPreview)
                    }
                    className="hidden"
                  />
                  <label
                    htmlFor="paymentReceipt"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload receipt</span>
                  </label>
                </div>
                {paymentReceiptPreview && (
                  <img
                    src={paymentReceiptPreview}
                    alt="Receipt Preview"
                    className="mt-2 max-w-full h-32 object-contain rounded border"
                  />
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setPaymentDialogOpen(false)}
                  disabled={savingPayment}
                >
                  Cancel
                </Button>
                <Button onClick={savePayment} disabled={savingPayment}>
                  {savingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Payment"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Charge Dialog */}
        <Dialog open={chargeDialogOpen} onOpenChange={setChargeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCharge ? "Edit Extra Charge" : "Add Extra Charge"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input
                  value={chargeForm.description || ""}
                  onChange={(e) =>
                    setChargeForm({ ...chargeForm, description: e.target.value })
                  }
                  placeholder="e.g., Laundry, Extra bed"
                />
              </div>

              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  value={chargeForm.amount || ""}
                  onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recordInExpenses"
                  checked={recordInExpenses}
                  onCheckedChange={(checked) => setRecordInExpenses(checked as boolean)}
                />
                <Label
                  htmlFor="recordInExpenses"
                  className="text-sm font-normal cursor-pointer"
                >
                  Record in Expenses Ledger
                </Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setChargeDialogOpen(false)}
                  disabled={savingCharge}
                >
                  Cancel
                </Button>
                <Button onClick={saveCharge} disabled={savingCharge}>
                  {savingCharge ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Charge"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancellation Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Ban className="w-5 h-5" />
                Cancel Booking
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-900">
                  <strong>Warning:</strong> This action will permanently cancel the booking.
                  The customer will receive an email notification with refund details.
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-semibold">Booking Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Amount:</span>{" "}
                    ₹{customer?.totalAmount.toLocaleString()}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Received Amount:</span>{" "}
                    <span className="font-semibold">₹{customer?.receivedAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Refund Amount (₹) *</Label>
                  <Input
                    type="number"
                    value={refundForm.amount || ""}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                    placeholder="0"
                    max={customer?.receivedAmount}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum: ₹{customer?.receivedAmount.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Refund Method *</Label>
                  <Select
                    value={refundForm.method}
                    onValueChange={(value) => setRefundForm({ ...refundForm, method: value })}
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

              <div className="space-y-2">
                <Label>Cancellation Reason (Optional)</Label>
                <Textarea
                  value={refundForm.reason || ""}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  rows={3}
                  placeholder="Reason for cancellation..."
                />
              </div>

              <div className="space-y-2">
                <Label>Refund Receipt (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <input
                    type="file"
                    id="refundReceipt"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      handleFileChange(e, setRefundReceiptFile, setRefundReceiptPreview)
                    }
                    className="hidden"
                  />
                  <label
                    htmlFor="refundReceipt"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload refund receipt</span>
                  </label>
                </div>
                {refundReceiptPreview && (
                  <img
                    src={refundReceiptPreview}
                    alt="Receipt Preview"
                    className="mt-2 max-w-full h-32 object-contain rounded border"
                  />
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setCancelDialogOpen(false)}
                  disabled={processingCancellation}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancellation}
                  disabled={processingCancellation}
                >
                  {processingCancellation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4 mr-2" />
                      Confirm Cancellation
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this {itemToDelete?.type}. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Footer />
    </AppShell>
  );
}