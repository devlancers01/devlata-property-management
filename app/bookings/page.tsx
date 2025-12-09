"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Loader2, Ban, Users, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Booking } from "@/models/booking.model";
import type { CustomerModel } from "@/models/customer.model";
import Footer from "@/components/footer";

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Block dates dialog
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({ checkIn: "", checkOut: "", reason: "" });
  const [blockingDates, setBlockingDates] = useState(false);

  // Date detail dialog
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateBookings, setDateBookings] = useState<Array<Booking & { customer?: CustomerModel }>>([]);
  const [loadingDateDetails, setLoadingDateDetails] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [currentMonth]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      const res = await fetch(`/api/bookings?year=${year}&month=${month}`);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockDates = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!blockForm.checkIn || !blockForm.checkOut) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    const checkIn = new Date(blockForm.checkIn);
    const checkOut = new Date(blockForm.checkOut);

    if (checkOut <= checkIn) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    setBlockingDates(true);
    try {
      const res = await fetch("/api/bookings/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          reason: blockForm.reason,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to block dates");
      }

      toast.success("Dates blocked successfully!");
      setBlockDialogOpen(false);
      setBlockForm({ checkIn: "", checkOut: "", reason: "" });
      fetchBookings();
    } catch (error: any) {
      console.error("Error blocking dates:", error);
      toast.error(error.message || "Failed to block dates");
    } finally {
      setBlockingDates(false);
    }
  };

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    setDateDialogOpen(true);
    setLoadingDateDetails(true);

    try {
      const dateKey = formatDateKey(date);
      const dayBookings = bookings.filter((b) => b.uid === dateKey);

      // Fetch customer details for each booking
      const bookingsWithCustomers = await Promise.all(
        dayBookings.map(async (booking) => {
          if (booking.customerId) {
            try {
              const res = await fetch(`/api/customers/${booking.customerId}`);
              const data = await res.json();
              return { ...booking, customer: data.customer };
            } catch (error) {
              return booking;
            }
          }
          return booking;
        })
      );

      setDateBookings(bookingsWithCustomers);
    } catch (error) {
      console.error("Error loading date details:", error);
      toast.error("Failed to load booking details");
    } finally {
      setLoadingDateDetails(false);
    }
  };

  const handleUnblock = async (booking: Booking) => {
    if (booking.type !== "blocked") return;

    try {
      const res = await fetch("/api/bookings/unblock", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn: new Date(booking.checkIn).toISOString(),
          checkOut: new Date(booking.checkOut).toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to unblock dates");
      }

      toast.success("Dates unblocked successfully!");
      setDateDialogOpen(false);
      fetchBookings();
    } catch (error) {
      console.error("Error unblocking dates:", error);
      toast.error("Failed to unblock dates");
    }
  };

  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getDateStatus = (date: Date) => {
    const dateKey = formatDateKey(date);
    const booking = bookings.find((b) => b.uid === dateKey);
    
    if (!booking) return { status: "available", count: 0 };
    
    if (booking.type === "blocked") return { status: "blocked", count: 0 };
    
    return { status: "booked", count: booking.membersCount || 1 };
  };

  const getDateBookingNames = (date: Date): string[] => {
    const dateKey = formatDateKey(date);
    const dayBookings = bookings.filter((b) => b.uid === dateKey);
    return dayBookings.map((b) => b.type === "blocked" ? "Blocked" : `Booking #${b.customerId?.slice(0, 8)}`);
  };

  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Booking Calendar</h1>
            <p className="text-muted-foreground mt-1">View and manage reservations</p>
          </div>
          <Button onClick={() => setBlockDialogOpen(true)}>
            <Ban className="w-4 h-4 mr-2" />
            Block Dates
          </Button>
        </div>

        {/* Legend */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-background border" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span>Blocked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-400" />
                <span>Past Date</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center justify-between">
              <CardTitle>{monthName}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={prevMonth}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  Next
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-hidden">
                <div className="min-w-max grid grid-cols-7 gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="text-center font-semibold text-sm p-2 text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}

                  {Array.from({ length: startingDayOfWeek }, (_, i) => (
                    <div key={`empty-${i}`} className="p-2" />
                  ))}

                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const date = new Date(year, month, day);
                    const { status, count } = getDateStatus(date);
                    const isPast = isPastDate(date);
                    const bookingNames = getDateBookingNames(date);

                    return (
                      <div
                        key={day}
                        onClick={() => handleDateClick(date)}
                        className={`p-3 text-center rounded-lg border cursor-pointer transition-all relative group ${
                          isPast
                            ? "bg-gray-100 text-gray-400 border-gray-200"
                            : status === "blocked"
                            ? "bg-red-500 text-white border-red-600 hover:bg-red-600"
                            : status === "booked"
                            ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
                            : "bg-background hover:bg-accent border-border"
                        }`}
                        title={bookingNames.join(", ")}
                      >
                        <div className="text-sm font-medium">{day}</div>
                        {status === "booked" && count > 0 && (
                          <div className="text-xs mt-1 flex items-center justify-center gap-1">
                            <Users className="w-3 h-3" />
                            {count}
                          </div>
                        )}
                        {status === "blocked" && (
                          <div className="text-xs mt-1">
                            <Ban className="w-3 h-3 mx-auto" />
                          </div>
                        )}
                        
                        {/* Tooltip on hover */}
                        {bookingNames.length > 0 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                            <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                              {bookingNames.join(", ")}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Block Dates Dialog */}
        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Block Dates</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBlockDates} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="checkIn">Check-In Date *</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={blockForm.checkIn}
                  onChange={(e) => setBlockForm({ ...blockForm, checkIn: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut">Check-Out Date *</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={blockForm.checkOut}
                  onChange={(e) => setBlockForm({ ...blockForm, checkOut: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                  placeholder="Maintenance, personal use, etc."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBlockDialogOpen(false)}
                  disabled={blockingDates}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={blockingDates}>
                  {blockingDates ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Blocking...
                    </>
                  ) : (
                    "Block Dates"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Date Details Dialog */}
        <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Bookings for {selectedDate?.toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </DialogTitle>
            </DialogHeader>
            
            {loadingDateDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : dateBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No bookings for this date</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {dateBookings.map((booking) => (
                  <Card key={booking.uid} className="border-2">
                    <CardContent className="p-4">
                      {booking.type === "blocked" ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <Ban className="w-3 h-3" />
                              Blocked Dates
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnblock(booking)}
                            >
                              Unblock
                            </Button>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="text-muted-foreground">Period:</span>{" "}
                              {new Date(booking.checkIn).toLocaleDateString()} -{" "}
                              {new Date(booking.checkOut).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">
                                {booking.customer?.name || "Loading..."}
                              </h4>
                              <Badge className="mt-1">Customer Booking</Badge>
                            </div>
                            <Button className="cursor-pointer"
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/customers/${booking.customerId}`)}
                            >
                              <Eye className="w-4 h-4 mr-2 " />
                              View Details
                            </Button>
                          </div>
                          
                          {booking.customer && (
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Phone:</span>{" "}
                                {booking.customer.phone}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Email:</span>{" "}
                                {booking.customer.email}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Check-In:</span>{" "}
                                {new Date(booking.checkIn).toLocaleDateString()}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Check-Out:</span>{" "}
                                {new Date(booking.checkOut).toLocaleDateString()}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Total Guests:</span>{" "}
                                {booking.membersCount}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Vehicle:</span>{" "}
                                {booking.customer.vehicleNumber}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </AppShell>
  );
}