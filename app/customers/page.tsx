"use client"

import type React from "react"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"

type Customer = {
  id: number
  name: string
  age: string
  address: string
  idType: string
  idNumber: string
  phone: string
  email: string
  vehicle: string
  checkIn: string
  checkOut: string
  paymentMode: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 1,
      name: "John Doe",
      age: "32",
      address: "123 Main St, Mumbai",
      idType: "Aadhaar",
      idNumber: "1234 5678 9012",
      phone: "+91 98765 43210",
      email: "john@example.com",
      vehicle: "MH01AB1234",
      checkIn: "2025-01-20T14:00",
      checkOut: "2025-01-22T11:00",
      paymentMode: "Cash",
    },
  ])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<Partial<Customer>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCustomer) {
      setCustomers(
        customers.map((c) => (c.id === editingCustomer.id ? ({ ...formData, id: editingCustomer.id } as Customer) : c)),
      )
    } else {
      setCustomers([...customers, { ...formData, id: Date.now() } as Customer])
    }
    setDialogOpen(false)
    setFormData({})
    setEditingCustomer(null)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData(customer)
    setDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setCustomers(customers.filter((c) => c.id !== id))
  }

  const openAddDialog = () => {
    setEditingCustomer(null)
    setFormData({})
    setDialogOpen(true)
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-2 md:items-center items-start justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-balance">Customer Entry</h1>
            <p className="text-muted-foreground mt-1">Manage guest information and bookings</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age || ""}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idType">ID Proof Type</Label>
                    <Select
                      value={formData.idType}
                      onValueChange={(value) => setFormData({ ...formData, idType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aadhaar">Aadhaar</SelectItem>
                        <SelectItem value="Driving License">Driving License</SelectItem>
                        <SelectItem value="Voter Card">Voter Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idNumber">ID Number</Label>
                    <Input
                      id="idNumber"
                      value={formData.idNumber || ""}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle">Vehicle Number</Label>
                    <Input
                      id="vehicle"
                      value={formData.vehicle || ""}
                      onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">Check-In Date & Time</Label>
                    <Input
                      id="checkIn"
                      type="datetime-local"
                      value={formData.checkIn || ""}
                      onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOut">Check-Out Date & Time</Label>
                    <Input
                      id="checkOut"
                      type="datetime-local"
                      value={formData.checkOut || ""}
                      onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMode">Payment Mode</Label>
                    <Select
                      value={formData.paymentMode}
                      onValueChange={(value) => setFormData({ ...formData, paymentMode: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Account Pay">Account Pay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingCustomer ? "Update" : "Add"} Customer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Customer List */}
        <div className="grid gap-4">
          {customers.map((customer) => (
            <Card key={customer.id}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Age:</span> {customer.age}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span> {customer.phone}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vehicle:</span> {customer.vehicle}
                      </div>
                      <div>
                        <span className="text-muted-foreground">ID:</span> {customer.idType} - {customer.idNumber}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Payment:</span> {customer.paymentMode}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Check-In:</span>{" "}
                        {new Date(customer.checkIn).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(customer)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(customer.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
