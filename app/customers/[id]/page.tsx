"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  Edit2,
  Save,
  X,
  Trash2,
  Check,
} from "lucide-react";
import type { CustomerModel } from "@/models/customer.model";
import { toast } from "sonner";

function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return value.toDate();
  }
  if (typeof value === "string") return new Date(value);
  return new Date();
}

interface GroupMember {
  uid: string;
  name: string;
  age: number;
  idType: string;
  idValue?: string;
  idProofUrl?: string;
}

interface Payment {
  uid: string;
  amount: number;
  mode: string;
  date: any;
  notes?: string;
  receiptUrl?: string;
}

interface ExtraCharge {
  uid: string;
  description: string;
  amount: number;
  date: any;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerModel | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);

  // Form states for editing
  const [personalForm, setPersonalForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    age: 0,
    idType: "",
    idValue: "",
    vehicleNumber: "",
  });

  const [bookingForm, setBookingForm] = useState({
    checkIn: "",
    checkOut: "",
    checkInTime: "",
    checkOutTime: "",
    instructions: "",
    stayCharges: 0,
    cuisineCharges: 0,
  });

  // Payment Dialog State
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [addingPayment, setAddingPayment] = useState(false);

  // Extra Charge Dialog State
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [chargeDescription, setChargeDescription] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [addingCharge, setAddingCharge] = useState(false);

  // Member Dialog State
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: "",
    age: "",
    idType: "Aadhar",
    idValue: "",
  });
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);

      const customerRes = await fetch(`/api/customers/${customerId}`);
      const customerData = await customerRes.json();
      const cust = customerData.customer;
      setCustomer(cust);

      // Set form values
      setPersonalForm({
        name: cust.name,
        phone: cust.phone,
        email: cust.email,
        address: cust.address,
        age: cust.age,
        idType: cust.idType,
        idValue: cust.idValue || "",
        vehicleNumber: cust.vehicleNumber,
      });

      setBookingForm({
        checkIn: toDate(cust.checkIn).toISOString().split("T")[0],
        checkOut: toDate(cust.checkOut).toISOString().split("T")[0],
        checkInTime: cust.checkInTime,
        checkOutTime: cust.checkOutTime,
        instructions: cust.instructions || "",
        stayCharges: cust.stayCharges,
        cuisineCharges: cust.cuisineCharges,
      });

      const membersRes = await fetch(`/api/customers/${customerId}/members`);
      const membersData = await membersRes.json();
      setGroupMembers(membersData.members || []);

      const paymentsRes = await fetch(`/api/customers/${customerId}/payments`);
      const paymentsData = await paymentsRes.json();
      setPayments(paymentsData.payments || []);

      const chargesRes = await fetch(`/api/customers/${customerId}/charges`);
      const chargesData = await chargesRes.json();
      setExtraCharges(chargesData.charges || []);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast.error("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonal = async () => {
    setSavingPersonal(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personalForm),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Personal information updated!");
      setEditingPersonal(false);
      fetchCustomerDetails();
    } catch (error) {
      toast.error("Failed to update personal information");
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleSaveBooking = async () => {
    setSavingBooking(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingForm,
          checkIn: new Date(bookingForm.checkIn).toISOString(),
          checkOut: new Date(bookingForm.checkOut).toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Booking information updated!");
      setEditingBooking(false);
      fetchCustomerDetails();
    } catch (error) {
      toast.error("Failed to update booking information");
    } finally {
      setSavingBooking(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    setAddingPayment(true);

    try {
      const paymentData: any = {
        amount: parseFloat(paymentAmount),
        mode: paymentMode,
      };

      if (paymentNotes) paymentData.notes = paymentNotes;

      const res = await fetch(`/api/customers/${customerId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (!res.ok) throw new Error("Failed to add payment");

      toast.success("Payment added successfully!");
      setPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentNotes("");
      fetchCustomerDetails();
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Failed to add payment");
    } finally {
      setAddingPayment(false);
    }
  };

  const handleAddCharge = async () => {
    if (!chargeDescription || !chargeAmount || parseFloat(chargeAmount) <= 0) {
      toast.error("Please fill all charge details");
      return;
    }

    setAddingCharge(true);

    try {
      const res = await fetch(`/api/customers/${customerId}/charges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: chargeDescription,
          amount: parseFloat(chargeAmount),
        }),
      });

      if (!res.ok) throw new Error("Failed to add charge");

      toast.success("Extra charge added successfully!");
      setChargeDialogOpen(false);
      setChargeDescription("");
      setChargeAmount("");
      fetchCustomerDetails();
    } catch (error) {
      console.error("Error adding charge:", error);
      toast.error("Failed to add charge");
    } finally {
      setAddingCharge(false);
    }
  };

  const handleAddMember = async () => {
    if (!memberForm.name || !memberForm.age || !memberForm.idType) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!memberForm.idValue) {
      toast.error("ID number is required");
      return;
    }

    setAddingMember(true);

    try {
      const memberData: any = {
        name: memberForm.name,
        age: parseInt(memberForm.age),
        idType: memberForm.idType,
      };

      if (memberForm.idValue) memberData.idValue = memberForm.idValue;

      const res = await fetch(`/api/customers/${customerId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      });

      if (!res.ok) throw new Error("Failed to add member");

      toast.success("Group member added successfully!");
      setMemberDialogOpen(false);
      setMemberForm({ name: "", age: "", idType: "Aadhar", idValue: "" });
      fetchCustomerDetails();
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add group member");
    } finally {
      setAddingMember(false);
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/customers")}
            >
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
            <Button variant="outline" size="sm" onClick={handleWhatsApp}>
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>

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
                  <p className="text-lg font-bold">₹{customer.totalAmount.toLocaleString()}</p>
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
                    ₹{customer.receivedAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${customer.balanceAmount > 0 ? "bg-red-100" : "bg-green-100"}`}>
                  <IndianRupee className={`w-5 h-5 ${customer.balanceAmount > 0 ? "text-red-600" : "text-green-600"}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className={`text-lg font-bold ${customer.balanceAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                    ₹{customer.balanceAmount.toLocaleString()}
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
                      (toDate(customer.checkOut).getTime() - toDate(customer.checkIn).getTime()) /
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
            <TabsTrigger value="members">
              Members ({groupMembers.length})
            </TabsTrigger>
            <TabsTrigger value="payments">
              Payments ({payments.length})
            </TabsTrigger>
            <TabsTrigger value="charges">
              Charges ({extraCharges.length})
            </TabsTrigger>
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
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingPersonal(true)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingPersonal(false);
                            setPersonalForm({
                              name: customer.name,
                              phone: customer.phone,
                              email: customer.email,
                              address: customer.address,
                              age: customer.age,
                              idType: customer.idType,
                              idValue: customer.idValue || "",
                              vehicleNumber: customer.vehicleNumber,
                            });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSavePersonal}
                          disabled={savingPersonal}
                        >
                          {savingPersonal ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
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
                        <Label>Name</Label>
                        <Input
                          value={personalForm.name}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Age</Label>
                        <Input
                          type="number"
                          value={personalForm.age}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, age: parseInt(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={personalForm.phone}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, phone: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={personalForm.email}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, email: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Textarea
                          value={personalForm.address}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, address: e.target.value })
                          }
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ID Type</Label>
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
                          value={personalForm.idValue}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, idValue: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Vehicle Number</Label>
                        <Input
                          value={personalForm.vehicleNumber}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, vehicleNumber: e.target.value })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="font-medium">{customer.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium">{customer.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="font-medium">{customer.address}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
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

                      <div className="flex items-center gap-3">
                        <Car className="w-5 h-5 text-muted-foreground" />
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
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingBooking(true)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingBooking(false);
                            setBookingForm({
                              checkIn: toDate(customer.checkIn).toISOString().split("T")[0],
                              checkOut: toDate(customer.checkOut).toISOString().split("T")[0],
                              checkInTime: customer.checkInTime,
                              checkOutTime: customer.checkOutTime,
                              instructions: customer.instructions || "",
                              stayCharges: customer.stayCharges,
                              cuisineCharges: customer.cuisineCharges,
                            });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveBooking}
                          disabled={savingBooking}
                        >
                          {savingBooking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingBooking ? (
                    <>
                      <div className="space-y-2">
                        <Label>Check-In Date</Label>
                        <Input
                          type="date"
                          value={bookingForm.checkIn}
                          onChange={(e) =>
                            setBookingForm({ ...bookingForm, checkIn: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Check-In Time</Label>
                        <Input
                          type="time"
                          value={bookingForm.checkInTime}
                          onChange={(e) =>
                            setBookingForm({ ...bookingForm, checkInTime: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Check-Out Date</Label>
                        <Input
                          type="date"
                          value={bookingForm.checkOut}
                          onChange={(e) =>
                            setBookingForm({ ...bookingForm, checkOut: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Check-Out Time</Label>
                        <Input
                          type="time"
                          value={bookingForm.checkOutTime}
                          onChange={(e) =>
                            setBookingForm({ ...bookingForm, checkOutTime: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stay Charges (₹)</Label>
                        <Input
                          type="number"
                          value={bookingForm.stayCharges}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              stayCharges: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cuisine Charges (₹)</Label>
                        <Input
                          type="number"
                          value={bookingForm.cuisineCharges}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              cuisineCharges: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Special Instructions</Label>
                        <Textarea
                          value={bookingForm.instructions}
                          onChange={(e) =>
                            setBookingForm({ ...bookingForm, instructions: e.target.value })
                          }
                          rows={3}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
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

                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
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
                        {customer.extraChargesTotal > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Extra Charges:</span>
                            <span className="font-medium">
                              ₹{customer.extraChargesTotal.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Group Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Group Members</h3>
              <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Group Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="memberName">Name</Label>
                      <Input
                        id="memberName"
                        value={memberForm.name}
                        onChange={(e) =>
                          setMemberForm({ ...memberForm, name: e.target.value })
                        }
                        placeholder="Member name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="memberAge">Age</Label>
                      <Input
                        id="memberAge"
                        type="number"
                        value={memberForm.age}
                        onChange={(e) =>
                          setMemberForm({ ...memberForm, age: e.target.value })
                        }
                        placeholder="Age"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="memberIdType">ID Type</Label>
                      <Select
                        value={memberForm.idType}
                        onValueChange={(value) =>
                          setMemberForm({ ...memberForm, idType: value })
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
                      <Label htmlFor="memberIdValue">ID Number</Label>
                      <Input
                        id="memberIdValue"
                        value={memberForm.idValue}
                        onChange={(e) =>
                          setMemberForm({ ...memberForm, idValue: e.target.value })
                        }
                        placeholder="1234 5678 9012"
                      />
                    </div>

                    <Button
                      onClick={handleAddMember}
                      disabled={addingMember}
                      className="w-full"
                    >
                      {addingMember ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Member"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                      <div className="space-y-2">
                        <h4 className="font-semibold">{member.name}</h4>
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
                              className="text-primary hover:underline text-xs"
                            >
                              View ID Proof
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

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Payment History</h3>
              <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Payment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mode">Payment Mode</Label>
                      <Select value={paymentMode} onValueChange={setPaymentMode}>
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
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Input
                        id="notes"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="Add notes"
                      />
                    </div>

                    <Button
                      onClick={handleAddPayment}
                      disabled={addingPayment}
                      className="w-full"
                    >
                      {addingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Payment"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                        <div className="space-y-1">
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
                            <p className="text-sm text-muted-foreground">
                              {payment.notes}
                            </p>
                          )}
                        </div>
                        <CreditCard className="w-8 h-8 text-green-600" />
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
              <Dialog open={chargeDialogOpen} onOpenChange={setChargeDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Charge
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Extra Charge</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={chargeDescription}
                        onChange={(e) => setChargeDescription(e.target.value)}
                        placeholder="e.g., Laundry, Extra bed"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="chargeAmount">Amount (₹)</Label>
                      <Input
                        id="chargeAmount"
                        type="number"
                        value={chargeAmount}
                        onChange={(e) => setChargeAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>

                    <Button
                      onClick={handleAddCharge}
                      disabled={addingCharge}
                      className="w-full"
                    >
                      {addingCharge ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Charge"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                        <div className="space-y-1">
                          <p className="font-semibold">{charge.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {toDate(charge.date).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <span className="font-bold text-lg">
                          ₹{charge.amount.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}