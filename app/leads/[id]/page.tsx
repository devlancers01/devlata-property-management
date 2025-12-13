"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  Users,
  DollarSign,
  Loader2,
  Save,
  Trash2,
  Edit,
  X,
  Check,
} from "lucide-react";
import { Lead } from "@/models/lead.model";
import { toast } from "sonner";
import Footer from "@/components/footer";

// Helper to safely convert to Date
function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return value.toDate();
  }
  if (typeof value === "string") return new Date(value);
  return new Date();
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leads/${leadId}`);
      
      if (!res.ok) {
        throw new Error("Failed to fetch lead");
      }

      const data = await res.json();
      setLead(data.lead);
      setFormData(data.lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      toast.error("Failed to load lead details");
      router.push("/leads");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.source) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        source: formData.source,
        status: formData.status,
      };

      if (formData.checkInDate) payload.checkInDate = formData.checkInDate;
      if (formData.checkOutDate) payload.checkOutDate = formData.checkOutDate;
      if (formData.numberOfGuests) payload.numberOfGuests = parseInt(formData.numberOfGuests);
      if (formData.notes) payload.notes = formData.notes;
      if (formData.budget) payload.budget = parseFloat(formData.budget);

      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update lead");
      }

      toast.success("Lead updated successfully!");
      setEditing(false);
      fetchLead();
    } catch (error: any) {
      console.error("Error updating lead:", error);
      toast.error(error.message || "Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete lead");
      }

      toast.success("Lead deleted successfully!");
      router.push("/leads");
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Failed to delete lead");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "contacted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "qualified":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "converted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "lost":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "website":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
      case "phone":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "email":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "referral":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
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

  if (!lead) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Lead not found</p>
          <Button onClick={() => router.push("/leads")} className="mt-4">
            Back to Leads
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/leads")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{lead.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Lead ID: {lead.uid.slice(0, 8)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className={getStatusColor(lead.status)}>
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </Badge>
            <Badge variant="outline" className={getSourceColor(lead.source)}>
              {lead.source.charAt(0).toUpperCase() + lead.source.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {!editing && session?.user?.permissions?.includes("leads.edit") && (
            <Button onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Lead
            </Button>
          )}
          {editing && (
            <>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setFormData(lead);
                }}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
          {session?.user?.permissions?.includes("leads.delete") && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={editing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Lead
            </Button>
          )}
        </div>

        {/* Lead Information */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {editing ? (
              <>
                {/* Contact Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone *</Label>
                      <Input
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Booking Requirements */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Booking Requirements</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Check-in Date</Label>
                      <Input
                        type="date"
                        value={formData.checkInDate || ""}
                        onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Check-out Date</Label>
                      <Input
                        type="date"
                        value={formData.checkOutDate || ""}
                        onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Number of Guests</Label>
                      <Input
                        type="number"
                        value={formData.numberOfGuests || ""}
                        onChange={(e) => setFormData({ ...formData, numberOfGuests: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Budget (₹)</Label>
                      <Input
                        type="number"
                        value={formData.budget || ""}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Lead Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Lead Management</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status *</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Source *</Label>
                      <Select
                        value={formData.source}
                        onValueChange={(value) => setFormData({ ...formData, source: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="walk-in">Walk-in</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes || ""}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* View Mode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{lead.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{lead.email}</p>
                    </div>
                  </div>

                  {lead.checkInDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Desired Check-in</p>
                        <p className="font-medium">{lead.checkInDate}</p>
                      </div>
                    </div>
                  )}

                  {lead.checkOutDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Desired Check-out</p>
                        <p className="font-medium">{lead.checkOutDate}</p>
                      </div>
                    </div>
                  )}

                  {lead.numberOfGuests && (
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Guests</p>
                        <p className="font-medium">{lead.numberOfGuests}</p>
                      </div>
                    </div>
                  )}

                  {lead.budget && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="font-medium">₹{lead.budget.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {lead.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                      {lead.notes}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                  <p>
                    Created: {toDate(lead.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p>
                    Last Updated: {toDate(lead.updatedAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this lead. This action cannot be undone.
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
                  "Delete Lead"
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