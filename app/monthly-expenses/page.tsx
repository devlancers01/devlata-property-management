"use client"

import type React from "react"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

type Expense = {
  id: number
  name: string
  amount: number
  date: string
}

type ExpenseCategory = {
  title: string
  key: string
  expenses: Expense[]
}

export default function MonthlyExpensesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([
    {
      title: "Food Items",
      key: "food",
      expenses: [{ id: 1, name: "Rice & Grains", amount: 5000, date: "2025-01-15" }],
    },
    { title: "Vegetables", key: "vegetables", expenses: [] },
    { title: "Milk", key: "milk", expenses: [] },
    { title: "Dessert / Ice Cream", key: "dessert", expenses: [] },
    { title: "Mineral Water", key: "water", expenses: [] },
    { title: "Chicken / Mutton / Fish", key: "meat", expenses: [] },
    { title: "Spices", key: "spices", expenses: [] },
    { title: "Oil", key: "oil", expenses: [] },
    { title: "Other Food Items", key: "other-food", expenses: [] },
    { title: "Staff Salary", key: "salary", expenses: [] },
    { title: "Staff Advance", key: "advance", expenses: [] },
    { title: "Fuel for Bike", key: "fuel", expenses: [] },
    { title: "Travel Expenses", key: "travel", expenses: [] },
    { title: "Other Staff Expenses", key: "other-staff", expenses: [] },
    { title: "Electricity Bill", key: "electricity", expenses: [] },
    { title: "Gas for Geyser", key: "gas", expenses: [] },
    { title: "Diesel for Generator", key: "diesel", expenses: [] },
    { title: "Maintenance (Garden, Plumbing, etc.)", key: "maintenance", expenses: [] },
  ])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expenseForm, setExpenseForm] = useState({ name: "", amount: "", date: "" })

  const addExpense = (categoryKey: string) => {
    setSelectedCategory(categoryKey)
    setExpenseForm({ name: "", amount: "", date: new Date().toISOString().split("T")[0] })
    setDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory) return

    const newExpense: Expense = {
      id: Date.now(),
      name: expenseForm.name,
      amount: Number.parseFloat(expenseForm.amount),
      date: expenseForm.date,
    }

    setCategories(
      categories.map((cat) =>
        cat.key === selectedCategory ? { ...cat, expenses: [...cat.expenses, newExpense] } : cat,
      ),
    )

    setDialogOpen(false)
    setExpenseForm({ name: "", amount: "", date: "" })
  }

  const deleteExpense = (categoryKey: string, expenseId: number) => {
    setCategories(
      categories.map((cat) =>
        cat.key === categoryKey ? { ...cat, expenses: cat.expenses.filter((e) => e.id !== expenseId) } : cat,
      ),
    )
  }

  const totalExpenses = categories.reduce(
    (total, cat) => total + cat.expenses.reduce((sum, exp) => sum + exp.amount, 0),
    0,
  )

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-2 md:items-center items-start justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-balance">Monthly Expenditure</h1>
            <p className="text-muted-foreground mt-1">Track all monthly expenses</p>
          </div>
          <Card className="px-6 py-3 w-full md:w-[auto]">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold text-primary">₹{totalExpenses.toLocaleString()}</div>
          </Card>
        </div>

        <Accordion type="multiple" className="space-y-4">
          {categories.map((category) => {
            const categoryTotal = category.expenses.reduce((sum, exp) => sum + exp.amount, 0)
            return (
              <AccordionItem key={category.key} value={category.key} className="border rounded-lg">
                <Card>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex flex-col md:flex-row gap-2 items-start md:items-center justify-between w-full pr-4">
                      <span className="font-semibold">{category.title}</span>
                      <span className="text-sm text-muted-foreground">
                        ₹{categoryTotal.toLocaleString()} ({category.expenses.length} items)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-3 pt-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => addExpense(category.key)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Entry
                      </Button>
                      {category.expenses.length > 0 && (
                        <div className="space-y-2">
                          {category.expenses.map((expense) => (
                            <div
                              key={expense.id}
                              className="flex flex-col md:flex-row gap-2 items-start md:items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{expense.name}</p>
                                <p className="text-xs text-muted-foreground">{expense.date}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold">₹{expense.amount.toLocaleString()}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteExpense(category.key, expense.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            )
          })}
        </Accordion>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Description</Label>
                <Input
                  id="name"
                  value={expenseForm.name}
                  onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                  placeholder="Enter expense description"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  required
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
    </AppShell>
  )
}
