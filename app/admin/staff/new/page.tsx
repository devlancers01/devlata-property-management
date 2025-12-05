"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { StaffDesignation, StaffStatus, IDProofType } from "@/models/staff.model";

interface StaffFormState {
  name: string;
  age: number | undefined;
  gender: "male" | "female" | "other";
  phone: string;
  alternatePhone: string;
  idProofType: IDProofType | "";
  idProofValue: string;
  idProofDocument: string;
  designation: StaffDesignation | "";
  customDesignation: string;
  monthlySalary: number | undefined;
  joiningDate: string;
  leavingDate: string;
  status: StaffStatus;
  notes: string;
}

export default function NewStaffPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<StaffFormState>({
    name: "",
    age: undefined,
    gender: "male",
    phone: "",
    alternatePhone: "",
    idProofType: "",
    idProofValue: "",
    idProofDocument: "",
    designation: "",
    customDesignation: "",
    monthlySalary: undefined,
    joiningDate: new Date().toISOString().split("T")[0],
    leavingDate: "",
    status: "active",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.permissions?.includes("staff.create")) {
      toast.error("You don't have permission to create staff");
      return;
    }

    if (!formData.name || !formData.phone || !formData.age || !formData.designation || !formData.joiningDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.designation === "Other" && !formData.customDesignation) {
      toast.error("Please specify custom designation");
      return;
    }

    if (formData.age < 18 || formData.age > 70) {
      toast.error("Age must be between 18 and 70");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        phone: formData.phone,
        alternatePhone: formData.alternatePhone || undefined,
        designation: formData.designation,
        customDesignation: formData.designation === "Other" ? formData.customDesignation : undefined,
        monthlySalary: formData.monthlySalary || undefined,
        joiningDate: formData.joiningDate,
        leavingDate: formData.leavingDate || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
      };

      if (formData.idProofType) {
        payload.idProofType = formData.idProofType;
        if (formData.idProofDocument) {
          payload.idProofUrl = formData.idProofDocument;
        } else if (formData.idProofValue) {
          payload.idProofValue = formData.idProofValue;
        }
      }

      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create staff");
      }

      const data = await res.json();
      toast.success("Staff member created successfully");
      router.push(`/admin/staff/${data.staff.uid}`);
    } catch (error: any) {
      console.error("Error creating staff:", error);
      toast.error(error.message || "Failed to create staff");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setFormData((prev) => ({ ...prev, idProofDocument: data.url }));
      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Add New Staff Member</h1>
            <p className="text-muted-foreground mt-1">Fill in the details to add a new staff member</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Staff Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">
                    Age <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="70"
                    value={formData.age || ""}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                    placeholder="Enter age"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value: "male" | "female" | "other") => setFormData({ ...formData, gender: value })}>
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
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alternatePhone">Alternate Phone</Label>
                  <Input
                    id="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    placeholder="Enter alternate phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">
                    Designation <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.designation} onValueChange={(value: StaffDesignation) => setFormData({ ...formData, designation: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select designation" />
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

                {formData.designation === "Other" && (
                  <div className="space-y-2">
                    <Label htmlFor="customDesignation">
                      Custom Designation <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="customDesignation"
                      value={formData.customDesignation}
                      onChange={(e) => setFormData({ ...formData, customDesignation: e.target.value })}
                      placeholder="Specify designation"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="monthlySalary">Monthly Salary</Label>
                  <Input
                    id="monthlySalary"
                    type="number"
                    min="0"
                    value={formData.monthlySalary || ""}
                    onChange={(e) => setFormData({ ...formData, monthlySalary: parseFloat(e.target.value) })}
                    placeholder="Enter monthly salary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joiningDate">
                    Joining Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="joiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: StaffStatus) => setFormData({ ...formData, status: value })}>
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

                {(formData.status === "resigned" || formData.status === "terminated") && (
                  <div className="space-y-2">
                    <Label htmlFor="leavingDate">Leaving Date</Label>
                    <Input
                      id="leavingDate"
                      type="date"
                      value={formData.leavingDate}
                      onChange={(e) => setFormData({ ...formData, leavingDate: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">ID Proof (Optional)</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="idProofType">ID Proof Type</Label>
                  <Select value={formData.idProofType} onValueChange={(value: IDProofType) => setFormData({ ...formData, idProofType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID proof type" />
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

                {formData.idProofType && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="idProofValue">ID Proof Number</Label>
                      <Input
                        id="idProofValue"
                        value={formData.idProofValue}
                        onChange={(e) => setFormData({ ...formData, idProofValue: e.target.value })}
                        placeholder="Enter ID proof number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="idProofDocument">Upload ID Proof Document</Label>
                      <div className="flex gap-2">
                        <Input
                          id="idProofDocument"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                        {formData.idProofDocument && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setFormData({ ...formData, idProofDocument: "" })}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                      {formData.idProofDocument && (
                        <p className="text-sm text-green-600">Document uploaded successfully</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Staff Member"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}