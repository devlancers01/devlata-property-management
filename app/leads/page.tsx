"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Loader2, Phone, Mail, Calendar } from "lucide-react";
import { Lead } from "@/models/lead.model";
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

export default function LeadsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      lead.phone.toLowerCase().includes(query)
    );
  });

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

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Leads Management</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage booking inquiries
            </p>
          </div>
          {session?.user?.permissions?.includes("leads.create") && (
            <Button 
              onClick={() => router.push("/leads/new")} 
              size="lg"
              className="cursor-pointer"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Lead
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filters */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              size="sm"
              className="cursor-pointer"
            >
              All
            </Button>
            <Button
              variant={statusFilter === "new" ? "default" : "outline"}
              onClick={() => setStatusFilter("new")}
              size="sm"
              className="cursor-pointer"
            >
              New
            </Button>
            <Button
              variant={statusFilter === "contacted" ? "default" : "outline"}
              onClick={() => setStatusFilter("contacted")}
              size="sm"
              className="cursor-pointer"
            >
              Contacted
            </Button>
            <Button
              variant={statusFilter === "qualified" ? "default" : "outline"}
              onClick={() => setStatusFilter("qualified")}
              size="sm"
              className="cursor-pointer"
            >
              Qualified
            </Button>
            <Button
              variant={statusFilter === "converted" ? "default" : "outline"}
              onClick={() => setStatusFilter("converted")}
              size="sm"
              className="cursor-pointer"
            >
              Converted
            </Button>
            <Button
              variant={statusFilter === "lost" ? "default" : "outline"}
              onClick={() => setStatusFilter("lost")}
              size="sm"
              className="cursor-pointer"
            >
              Lost
            </Button>
          </div>
        </div>

        {/* Leads List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No leads found</p>
              {session?.user?.permissions?.includes("leads.create") && (
                <Button
                  onClick={() => router.push("/leads/new")}
                  className="mt-4 cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Lead
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredLeads.map((lead) => (
              <Card
                key={lead.uid}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (session?.user?.permissions?.includes("leads.edit")) {
                    router.push(`/leads/${lead.uid}`);
                  }
                }}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">{lead.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(lead.status)}>
                              {lead.status}
                            </Badge>
                            <Badge variant="outline" className={getSourceColor(lead.source)}>
                              {lead.source}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{lead.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        {lead.checkInDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {lead.checkInDate}
                              {lead.checkOutDate && ` - ${lead.checkOutDate}`}
                            </span>
                          </div>
                        )}
                        {lead.numberOfGuests && (
                          <div>
                            <span className="text-muted-foreground">Guests:</span>{" "}
                            {lead.numberOfGuests}
                          </div>
                        )}
                        {lead.budget && (
                          <div>
                            <span className="text-muted-foreground">Budget:</span>{" "}
                            ₹{lead.budget.toLocaleString()}
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Created:</span>{" "}
                          {toDate(lead.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>

                      {lead.notes && (
                        <div className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                          <span className="text-muted-foreground">Notes:</span>{" "}
                          {lead.notes}
                        </div>
                      )}
                    </div>

                    {session?.user?.permissions?.includes("leads.edit") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/leads/${lead.uid}`);
                        }}
                        className="cursor-pointer"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </AppShell>
  );
}