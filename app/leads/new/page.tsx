"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/footer";

export default function NewLeadPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    checkInDate: "",
    checkOutDate: "",
    numberOfGuests: "",
    source: "website" as const,
    notes: "",
    budget: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.source) {
      toast.error("Please fill all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Phone validation (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ""))) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        source: formData.source,
      };

      if (formData.checkInDate) payload.checkInDate = formData.checkInDate;
      if (formData.checkOutDate) payload.checkOutDate = formData.checkOutDate;
      if (formData.numberOfGuests) payload.numberOfGuests = parseInt(formData.numberOfGuests);
      if (formData.notes) payload.notes = formData.notes;
      if (formData.budget) payload.budget = parseFloat(formData.budget);

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create lead");
      }

      const data = await res.json();
      toast.success("Lead created successfully!");
      router.push(`/leads/${data.leadId}`);
    } catch (error: any) {
      console.error("Error creating lead:", error);
      toast.error(error.message || "Failed to create lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/leads")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">New Lead</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create a new booking inquiry
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10-digit phone number"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              {/* Booking Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Booking Requirements</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkInDate">Desired Check-in Date</Label>
                    <Input
                      id="checkInDate"
                      type="date"
                      value={formData.checkInDate}
                      onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkOutDate">Desired Check-out Date</Label>
                    <Input
                      id="checkOutDate"
                      type="date"
                      value={formData.checkOutDate}
                      onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numberOfGuests">Number of Guests</Label>
                    <Input
                      id="numberOfGuests"
                      type="number"
                      min="1"
                      value={formData.numberOfGuests}
                      onChange={(e) => setFormData({ ...formData, numberOfGuests: e.target.value })}
                      placeholder="e.g., 4"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (₹)</Label>
                    <Input
                      id="budget"
                      type="number"
                      min="0"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="e.g., 15000"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="source">Lead Source *</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value: any) => setFormData({ ...formData, source: value })}
                  >
                    <SelectTrigger id="source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="walk-in">Walk-in</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special requests or additional information..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/leads")}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Lead
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
      <Footer />
    </AppShell>
  );
}