"use client"

import type React from "react"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, Calendar } from "lucide-react"

type YearlyExpense = {
  id: number
  category: string
  amount: number
  year: string
  notes: string
}

const categories = ["Property Tax", "Water Tax", "GST", "Boating Fees", "Other"]

export default function YearlyExpensesPage() {
  const [expenses, setExpenses] = useState<YearlyExpense[]>([
    {
      id: 1,
      category: "Property Tax",
      amount: 25000,
      year: "2025",
      notes: "Annual property tax",
    },
  ])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    category: "Property Tax",
    amount: "",
    year: new Date().getFullYear().toString(),
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newExpense: YearlyExpense = {
      id: Date.now(),
      category: formData.category,
      amount: Number.parseFloat(formData.amount),
      year: formData.year,
      notes: formData.notes,
    }
    setExpenses([...expenses, newExpense])
    setDialogOpen(false)
    setFormData({
      category: "Property Tax",
      amount: "",
      year: new Date().getFullYear().toString(),
      notes: "",
    })
  }

  const handleDelete = (id: number) => {
    setExpenses(expenses.filter((e) => e.id !== id))
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-balance">Yearly Expenses</h1>
            <p className="text-muted-foreground mt-1">Manage annual fixed expenses</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Yearly Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2025"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Expense</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Total Card */}
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Total Yearly Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">₹{totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <div className="grid gap-4">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{expense.category}</h3>
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-medium">
                        {expense.year}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-primary mb-1">₹{expense.amount.toLocaleString()}</p>
                    {expense.notes && <p className="text-sm text-muted-foreground">{expense.notes}</p>}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(expense.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
