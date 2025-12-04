"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Search, Eye, Loader2, Calendar, X } from "lucide-react";
import type { CustomerModel } from "@/models/customer.model";

// Helper to safely convert to Date
function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return value.toDate();
  }
  if (typeof value === "string") return new Date(value);
  return new Date();
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter, startDate, endDate]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      
      if (startDate) {
        params.set("startDate", startDate);
      }
      
      if (endDate) {
        params.set("endDate", endDate);
      }

      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone.toLowerCase().includes(query)
    );
  });

  const clearDateFilters = () => {
    setStartDate("");
    setEndDate("");
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

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Customer Bookings</h1>
            <p className="text-muted-foreground mt-1">
              Manage guest information and reservations
            </p>
          </div>
          <Button onClick={() => router.push("/customers/new")} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Booking
          </Button>
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
            >
              All
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              onClick={() => setStatusFilter("active")}
              size="sm"
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              onClick={() => setStatusFilter("completed")}
              size="sm"
            >
              Completed
            </Button>
            <Button
              variant={statusFilter === "cancelled" ? "default" : "outline"}
              onClick={() => setStatusFilter("cancelled")}
              size="sm"
            >
              Cancelled
            </Button>
          </div>

          {/* Date Range Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="startDate" className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Check-In From
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="endDate" className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Check-In To
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                {(startDate || endDate) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDateFilters}
                    className="whitespace-nowrap"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Dates
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No customers found</p>
              <Button
                onClick={() => router.push("/customers/new")}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Booking
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCustomers.map((customer) => (
              <Card
                key={customer.uid}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/customers/${customer.uid}`)}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">{customer.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {customer.email}
                          </p>
                        </div>
                        <Badge className={getStatusColor(customer.status)}>
                          {customer.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Phone:</span>{" "}
                          {customer.phone}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Check-In:</span>{" "}
                          {toDate(customer.checkIn).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Check-Out:</span>{" "}
                          {toDate(customer.checkOut).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span> ₹
                          {customer.totalAmount.toLocaleString()}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Balance:</span>{" "}
                          <span
                            className={
                              customer.balanceAmount > 0
                                ? "text-red-600 font-semibold"
                                : "text-green-600 font-semibold"
                            }
                          >
                            ₹{customer.balanceAmount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vehicle:</span>{" "}
                          {customer.vehicleNumber}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/customers/${customer.uid}`);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}