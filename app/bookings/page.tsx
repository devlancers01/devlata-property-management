"use client"

import type React from "react"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

type Booking = {
  id: number
  name: string
  startDate: string
  endDate: string
  notes: string
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 1,
      name: "Smith Family",
      startDate: "2025-01-25",
      endDate: "2025-01-28",
      notes: "Room 101 - Early check-in requested",
    },
    {
      id: 2,
      name: "Johnson Wedding Party",
      startDate: "2025-02-10",
      endDate: "2025-02-12",
      notes: "Multiple rooms booked",
    },
  ])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    notes: "",
  })

  const [currentMonth, setCurrentMonth] = useState(new Date())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newBooking: Booking = {
      id: Date.now(),
      ...formData,
    }
    setBookings([...bookings, newBooking])
    setDialogOpen(false)
    setFormData({ name: "", startDate: "", endDate: "", notes: "" })
  }

  const handleDelete = (id: number) => {
    setBookings(bookings.filter((b) => b.id !== id))
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const isDateBooked = (date: Date) => {
    return bookings.some((booking) => {
      const start = new Date(booking.startDate)
      const end = new Date(booking.endDate)
      return date >= start && date <= end
    })
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-balance">Booking Calendar</h1>
            <p className="text-muted-foreground mt-1">View and manage reservations</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Booking
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Reservation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Guest Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter guest name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Check-In Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Check-Out Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Room number, special requests, etc."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Booking</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

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
  <div className="overflow-x-auto overflow-y-hidden">
    <div className="min-w-max grid grid-cols-7 gap-2">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day} className="text-center font-semibold text-sm p-2 text-muted-foreground">
          {day}
        </div>
      ))}

      {Array.from({ length: startingDayOfWeek }, (_, i) => (
        <div key={`empty-${i}`} className="p-2" />
      ))}

      {Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1
        const date = new Date(year, month, day)
        const isBooked = isDateBooked(date)

        return (
          <div
            key={day}
            className={`p-2 text-center rounded-lg border ${
              isBooked
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent"
            }`}
          >
            <div className="text-sm font-medium">{day}</div>
          </div>
        )
      })}
    </div>
  </div>
</CardContent>

        </Card>

        {/* Bookings List */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Reservations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No bookings yet</p>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{booking.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.startDate).toLocaleDateString()} -{" "}
                      {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                    {booking.notes && <p className="text-sm text-muted-foreground mt-1">{booking.notes}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(booking.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
