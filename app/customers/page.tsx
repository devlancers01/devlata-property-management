"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Search, Eye, Loader2, Calendar, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { CustomerModel } from "@/models/customer.model";

// Helper to safely convert to Date in IST
function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return value.toDate();
  }
  if (typeof value === "string") return new Date(value);
  return new Date();
}

// Helper to format date as dd-mm-yyyy in IST
function formatDateIST(date: Date): string {
  const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = String(istDate.getDate()).padStart(2, "0");
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const year = istDate.getFullYear();
  return `${day}-${month}-${year}`;
}

// Helper to format date for input (yyyy-mm-dd)
function formatDateForInput(date: Date): string {
  const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = String(istDate.getDate()).padStart(2, "0");
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const year = istDate.getFullYear();
  return `${year}-${month}-${day}`;
}

// Helper to get IST date start (00:00:00)
function getISTDateStart(date: Date): Date {
  const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  istDate.setHours(0, 0, 0, 0);
  return istDate;
}

// Helper to get IST date end (23:59:59)
function getISTDateEnd(date: Date): Date {
  const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  istDate.setHours(23, 59, 59, 999);
  return istDate;
}

// Helper to get current IST date
function getISTToday(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerModel[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState(() => {
  const today = new Date();
  return today.toISOString().split("T")[0];  // "yyyy-mm-dd"
  });

  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Set default filter to show bookings from today onwards
  useEffect(() => {
    const today = getISTToday();
    setStartDate(formatDateForInput(today));
  }, []);

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

      // Fetch member counts for all customers
      const counts: Record<string, number> = {};
      await Promise.all(
        (data.customers || []).map(async (customer: CustomerModel) => {
          try {
            const memberRes = await fetch(`/api/customers/${customer.uid}/members`);
            const memberData = await memberRes.json();
            counts[customer.uid] = (memberData.members?.length || 0) + 1;
          } catch (error) {
            console.error(`Error fetching members for ${customer.uid}:`, error);
            counts[customer.uid] = 1;
          }
        })
      );
      setMemberCounts(counts);
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

  // Sort customers: ascending by check-in date starting from today
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const dateA = toDate(a.checkIn).getTime();
    const dateB = toDate(b.checkIn).getTime();
    return dateA - dateB;
  });

  // Pagination
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
  const paginatedCustomers = sortedCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearDateFilters = () => {
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const setDateFilterToday = () => {
    const today = getISTToday();
    setStartDate(formatDateForInput(today));
    setEndDate(formatDateForInput(today));
    setCurrentPage(1);
  };

  const setDateFilterThisWeek = () => {
    const today = getISTToday();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
    setStartDate(formatDateForInput(today));
    setEndDate(formatDateForInput(endOfWeek));
    setCurrentPage(1);
  };

  const setDateFilterThisMonth = () => {
    const today = getISTToday();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setStartDate(formatDateForInput(today));
    setEndDate(formatDateForInput(endOfMonth));
    setCurrentPage(1);
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          <Button 
            onClick={() => router.push("/customers/new")} 
            size="lg"
            className="cursor-pointer"
          >
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
              className="cursor-pointer"
            >
              All
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              onClick={() => setStatusFilter("active")}
              size="sm"
              className="cursor-pointer"
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              onClick={() => setStatusFilter("completed")}
              size="sm"
              className="cursor-pointer"
            >
              Completed
            </Button>
            <Button
              variant={statusFilter === "cancelled" ? "default" : "outline"}
              onClick={() => setStatusFilter("cancelled")}
              size="sm"
              className="cursor-pointer"
            >
              Cancelled
            </Button>
          </div>

          {/* Date Range Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Date Filter Shortcuts */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setDateFilterToday}
                    className="cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setDateFilterThisWeek}
                    className="cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    This Week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setDateFilterThisMonth}
                    className="cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    This Month
                  </Button>
                </div>

                {/* Date Range Inputs */}
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
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
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
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  {(startDate || endDate) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearDateFilters}
                      className="whitespace-nowrap cursor-pointer"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Dates
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : paginatedCustomers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No customers found</p>
              <Button
                onClick={() => router.push("/customers/new")}
                className="mt-4 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Booking
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4">
              {paginatedCustomers.map((customer) => (
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
                            {formatDateIST(toDate(customer.checkIn))} at {customer.checkInTime} 
                          </div>
                          <div>
                            <span className="text-muted-foreground">Check-Out:</span>{" "}
                            {formatDateIST(toDate(customer.checkOut))} at {customer.checkOutTime}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total:</span> ₹
                            {customer.totalAmount.toLocaleString()}
                          </div>
                          <div>
                            <span className="text-muted-foreground">{(customer.status === `active` || customer.status === `completed`) ? `Balance:` : `Refund:`}</span>{" "}
                            <span
                              className={
                                customer.balanceAmount > 0
                                  ? "text-red-600 font-semibold"
                                  : "text-green-600 font-semibold"
                              }
                            >
                              ₹{(customer.status === `active` || customer.status === `completed`) ? customer.balanceAmount.toLocaleString() : (customer.refundAmount || 0).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">No. of Members:</span>{" "}
                            {memberCounts[customer.uid] || 1}
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
                        className="cursor-pointer"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="cursor-pointer min-w-[40px]"
                        >
                          {page}
                        </Button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-1">...</span>;
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Results info */}
        {!loading && sortedCustomers.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedCustomers.length)} of {sortedCustomers.length} bookings
          </div>
        )}
      </div>
    </AppShell>
  );
}