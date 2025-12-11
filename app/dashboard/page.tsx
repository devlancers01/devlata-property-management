"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
  Receipt,
  Plus,
  Edit,
  Trash2,
  IndianRupee,
  CalendarDays,
  UserCog,
  Upload,
  Eye,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DonutChart } from "@/components/ui/donut-chart"
import { BarChart } from "@/components/ui/bar-chart"
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns"
import { toast } from "sonner"
import Footer from "@/components/footer"

// Helper function to convert UTC to IST
function toIST(date: Date): Date {
  const utcDate = new Date(date);
  // Add 5 hours 30 minutes for IST
  return new Date(utcDate.getTime());
}

// Helper function to format date in dd-mm-yyyy
function formatDateIST(date: Date): string {
  const istDate = toIST(date);
  const day = String(istDate.getDate()).padStart(2, '0');
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const year = istDate.getFullYear();
  return `${day}-${month}-${year}`;
}

// Helper function to format date and time in IST
function formatDateTimeIST(date: Date): string {
  const istDate = toIST(date);
  const day = String(istDate.getDate()).padStart(2, '0');
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const year = istDate.getFullYear();
  let hours = istDate.getHours();
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  return `${day}-${month}-${year}, ${hours}:${minutes} ${ampm}`;
}

// Types
interface AnalyticsSummary {
  sales: {
    total: number
    byCategory: Record<string, number>
    byPaymentMode: Record<string, number>
    count: number
  }
  expenses: {
    total: number
    byCategory: Record<string, number>
    count: number
  }
  profit: {
    net: number
    margin: number
  }
  activeBookings: number
  completedBookings: number
  totalStaff: number
  activeStaff: number
}

interface Sale {
  uid: string
  date: Date
  amount: number
  category: string
  description: string
  paymentMode: string
  sourceType: string
  customerId?: string
  financialYear: string
  receiptUrls?: string[]
}

interface Expense {
  uid: string
  date: string | Date
  amount: number
  category: string
  description?: string
  paymentMode?: string
  mode?: string
}

interface QuickStat {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: any
  color: string
  bgColor: string
  darkBgColor: string
}

type PeriodType = "today" | "week" | "month" | "year" | "fy" | "custom"

export default function DashboardPage() {
  const { data: session } = useSession();

  // State
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [recentCustomers, setRecentCustomers] = useState<any[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseLedgerOpen, setExpenseLedgerOpen] = useState(false)
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [upcomingCheckouts, setUpcomingCheckouts] = useState<any[]>([])
  const [period, setPeriod] = useState<PeriodType>("month")
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [showSaleDialog, setShowSaleDialog] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)

  // Sale form state
  const [saleForm, setSaleForm] = useState({
    amount: "",
    category: "stay",
    description: "",
    paymentMode: "cash",
    date: "",
    time: "",
    receiptUrl: "",
  })
  const [saleReceiptFile, setSaleReceiptFile] = useState<File | null>(null)
  const [saleReceiptPreview, setSaleReceiptPreview] = useState<string>("")
  const [uploadingSaleReceipt, setUploadingSaleReceipt] = useState(false)

  // Fetch data
  useEffect(() => {
    fetchAnalytics()
    fetchSales()
    fetchRecentCustomers()
  }, [dateRange])

  // Period change handler
  useEffect(() => {
    const now = new Date()
    switch (period) {
      case "today":
        setDateRange({ from: now, to: now })
        break
      case "week":
        setDateRange({ from: subDays(now, 7), to: now })
        break
      case "month":
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) })
        break
      case "year":
        setDateRange({ from: startOfYear(now), to: now })
        break
      case "fy":
        const fyStart = new Date(now.getFullYear(), 3, 1)
        if (now.getMonth() < 3) {
          fyStart.setFullYear(now.getFullYear() - 1)
        }
        const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31)
        setDateRange({ from: fyStart, to: fyEnd })
        break
    }
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (dateRange.from) {
        params.append("startDate", dateRange.from.toISOString())
      }
      if (dateRange.to) {
        params.append("endDate", dateRange.to.toISOString())
      }

      const res = await fetch(`/api/analytics/summary?${params}`)
      if (!res.ok) throw new Error("Failed to fetch analytics")

      const data = await res.json()
      setAnalytics(data)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast.error("Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  const fetchSales = async () => {
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append("startDate", dateRange.from.toISOString())
      if (dateRange.to) params.append("endDate", dateRange.to.toISOString())

      const res = await fetch(`/api/sales?${params}`)
      if (!res.ok) throw new Error("Failed to fetch sales")

      const data = await res.json()
      setSales(data.sales || [])
    } catch (error) {
      console.error("Error fetching sales:", error)
    }
  }

  const fetchExpensesLedger = async () => {
    try {
      setLoadingExpenses(true)

      const params = new URLSearchParams()
      if (dateRange.from) params.append("startDate", dateRange.from.toISOString())
      if (dateRange.to) params.append("endDate", dateRange.to.toISOString())

      const res = await fetch(`/api/expenses?${params}`)
      if (!res.ok) throw new Error("Failed to fetch expenses")

      const data = await res.json()

      const items: Expense[] = (data.expenses || [])
        .map((e: any) => ({
          ...e,
          // normalize payment mode here
          paymentMode: e.paymentMode ?? e.mode ?? "",
        }))
        .sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )

      setExpenses(items)
    } catch (error) {
      console.error("Error fetching expenses:", error)
      toast.error("Failed to load expenses")
    } finally {
      setLoadingExpenses(false)
    }
  }

  const handleOpenExpenseLedger = () => {
    setExpenseLedgerOpen(true)
    fetchExpensesLedger()
  }

  const fetchRecentCustomers = async () => {
    try {
      const res = await fetch("/api/customers?status=active")
      if (!res.ok) throw new Error("Failed to fetch customers")

      const data = await res.json()
      const customers = data.customers || []

      // Get recent check-ins (last 3)
      const recent = customers
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
      setRecentCustomers(recent)

      // Get upcoming checkouts (today and tomorrow)
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const upcoming = customers
        .filter((c: any) => {
          const checkOut = new Date(c.checkOut)
          return checkOut >= now && checkOut <= tomorrow
        })
        .slice(0, 2)
      setUpcomingCheckouts(upcoming)
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }

  const handleCreateSale = async () => {
    try {
      if (!saleForm.amount || !saleForm.description || !saleForm.date || !saleForm.time) {
        toast.error("Please fill in all required fields")
        return
      }

      let receiptUrl = saleForm.receiptUrl

      // Upload receipt if new file selected
      if (saleReceiptFile) {
        setUploadingSaleReceipt(true)
        try {
          receiptUrl = await uploadReceipt(saleReceiptFile)
        } catch (error) {
          console.error("Error uploading receipt:", error)
          toast.error("Failed to upload receipt")
          setUploadingSaleReceipt(false)
          return
        }
        setUploadingSaleReceipt(false)
      }

      // Convert date and time to UTC
      const saleDate = formDateTimeToDate(saleForm.date, saleForm.time)

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(saleForm.amount),
          category: saleForm.category,
          description: saleForm.description,
          paymentMode: saleForm.paymentMode,
          sourceType: "manual",
          date: saleDate.toISOString(),
          receiptUrls: receiptUrl ? [receiptUrl] : [],
        }),
      })

      if (!res.ok) throw new Error("Failed to create sale")

      toast.success("Sale created successfully")
      setShowSaleDialog(false)
      setSaleForm({
        amount: "",
        category: "stay",
        description: "",
        paymentMode: "cash",
        date: "",
        time: "",
        receiptUrl: "",
      })
      setSaleReceiptFile(null)
      setSaleReceiptPreview("")
      fetchAnalytics()
      fetchSales()
    } catch (error) {
      console.error("Error creating sale:", error)
      toast.error("Failed to create sale")
    }
  }

  const handleUpdateSale = async () => {
    if (!editingSale) return

    try {
      if (!saleForm.amount || !saleForm.description || !saleForm.date || !saleForm.time) {
        toast.error("Please fill in all required fields")
        return
      }

      let receiptUrl = saleForm.receiptUrl

      // Upload receipt if new file selected
      if (saleReceiptFile) {
        setUploadingSaleReceipt(true)
        try {
          receiptUrl = await uploadReceipt(saleReceiptFile)
        } catch (error) {
          console.error("Error uploading receipt:", error)
          toast.error("Failed to upload receipt")
          setUploadingSaleReceipt(false)
          return
        }
        setUploadingSaleReceipt(false)
      }

      // Convert date and time to UTC
      const saleDate = formDateTimeToDate(saleForm.date, saleForm.time)

      const res = await fetch(`/api/sales/${editingSale.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(saleForm.amount),
          category: saleForm.category,
          description: saleForm.description,
          paymentMode: saleForm.paymentMode,
          date: saleDate.toISOString(),
          receiptUrls: receiptUrl ? [receiptUrl] : [],
        }),
      })

      if (!res.ok) throw new Error("Failed to update sale")

      toast.success("Sale updated successfully")
      setShowSaleDialog(false)
      setEditingSale(null)
      setSaleForm({
        amount: "",
        category: "stay",
        description: "",
        paymentMode: "cash",
        date: "",
        time: "",
        receiptUrl: "",
      })
      setSaleReceiptFile(null)
      setSaleReceiptPreview("")
      fetchAnalytics()
      fetchSales()
    } catch (error) {
      console.error("Error updating sale:", error)
      toast.error("Failed to update sale")
    }
  }

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return

    try {
      const res = await fetch(`/api/sales/${saleId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete sale")

      toast.success("Sale deleted successfully")
      fetchAnalytics()
      fetchSales()
    } catch (error) {
      console.error("Error deleting sale:", error)
      toast.error("Failed to delete sale")
    }
  }

  const openEditDialog = (sale: Sale) => {
    setEditingSale(sale)

    // Convert sale date to IST and extract date/time
    const saleDate = new Date(sale.date)
    const istDate = toIST(saleDate)

    const year = istDate.getFullYear()
    const month = String(istDate.getMonth() + 1).padStart(2, '0')
    const day = String(istDate.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    let hours = istDate.getHours()
    const minutes = String(istDate.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`

    setSaleForm({
      amount: sale.amount.toString(),
      category: sale.category,
      description: sale.description,
      paymentMode: sale.paymentMode,
      date: dateStr,
      time: timeStr,
      receiptUrl: sale.receiptUrls?.[0] || "",
    })
    setSaleReceiptFile(null)
    setSaleReceiptPreview("")
    setShowSaleDialog(true)
  }

  const openCreateDialog = () => {
    setEditingSale(null)
    const { date, time } = getCurrentISTDateTime()
    setSaleForm({
      amount: "",
      category: "stay",
      description: "",
      paymentMode: "cash",
      date,
      time,
      receiptUrl: "",
    })
    setSaleReceiptFile(null)
    setSaleReceiptPreview("")
    setShowSaleDialog(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // File upload handler
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (preview: string) => void
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      setFile(file)
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreview("")
      }
    }
  }

  // Upload receipt to Firebase Storage
  const uploadReceipt = async (file: File): Promise<string> => {
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage")
    const storage = getStorage()

    const timestamp = Date.now()
    const filename = `${timestamp}_${file.name}`
    const storageRef = ref(storage, `receipts/${filename}`)

    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)

    return downloadURL
  }

  // Get current IST date and time for form
  const getCurrentISTDateTime = () => {
    const now = new Date()
    const istDate = toIST(now)

    const year = istDate.getFullYear()
    const month = String(istDate.getMonth() + 1).padStart(2, '0')
    const day = String(istDate.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    let hours = istDate.getHours()
    const minutes = String(istDate.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`

    return { date: dateStr, time: timeStr }
  }

  // Convert form date and time to Date object
  const formDateTimeToDate = (dateStr: string, timeStr: string): Date => {
    // Parse date (yyyy-mm-dd)
    const [year, month, day] = dateStr.split('-').map(Number)

    // Parse time (hh:mm AM/PM)
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!timeMatch) {
      return new Date() // Fallback to current date
    }

    let hours = parseInt(timeMatch[1])
    const minutes = parseInt(timeMatch[2])
    const ampm = timeMatch[3].toUpperCase()

    // Convert to 24-hour format
    if (ampm === 'PM' && hours !== 12) {
      hours += 12
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0
    }

    // Create date in IST
    const istDate = new Date(year, month - 1, day, hours, minutes, 0, 0)

    // Convert IST to UTC by subtracting 5.5 hours
    const utcDate = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000))

    return utcDate
  }

  // Prepare chart data - only show non-zero values
  const salesByCategoryData = analytics?.sales.byCategory
    ? Object.entries(analytics.sales.byCategory)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, " "),
        value,
      }))
    : []

  const salesByPaymentData = analytics?.sales.byPaymentMode
    ? Object.entries(analytics.sales.byPaymentMode)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.toUpperCase(),
        value,
      }))
    : []

  const expensesByCategoryData = analytics?.expenses.byCategory
    ? Object.entries(analytics.expenses.byCategory)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, " "),
        value,
      }))
    : []

  const comparisonData = analytics
    ? [
      { category: "Revenue", Sales: analytics.sales.total, Expenses: 0 },
      { category: "Expenses", Sales: 0, Expenses: analytics.expenses.total },
      {
        category: "Profit",
        Sales: Math.max(0, analytics.profit.net),
        Expenses: 0,
      },
    ]
    : []

  // Quick stats
  const stats: QuickStat[] = analytics
    ? [
      {
        title: "Total Revenue",
        value: formatCurrency(analytics.sales.total),
        change: `${analytics.sales.count} sales`,
        trend: "up",
        icon: DollarSign,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        darkBgColor: "dark:bg-blue-950/30",
      },
      {
        title: "Total Expenses",
        value: formatCurrency(analytics.expenses.total),
        change: `${analytics.expenses.count} items`,
        trend: "down",
        icon: Receipt,
        color: "text-red-600",
        bgColor: "bg-red-50",
        darkBgColor: "dark:bg-red-950/30",
      },
      {
        title: "Net Profit",
        value: formatCurrency(Math.abs(analytics.profit.net)),
        change: `${analytics.profit.margin.toFixed(1)}% margin`,
        trend: analytics.profit.net >= 0 ? "up" : "down",
        icon: TrendingUp,
        color: analytics.profit.net >= 0 ? "text-emerald-600" : "text-red-600",
        bgColor: analytics.profit.net >= 0 ? "bg-emerald-50" : "bg-red-50",
        darkBgColor: analytics.profit.net >= 0 ? "dark:bg-emerald-950/30" : "dark:bg-red-950/30",
      },
      {
        title: "Active Bookings",
        value: analytics.activeBookings.toString(),
        change: `${analytics.completedBookings} completed`,
        trend: "up",
        icon: Calendar,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        darkBgColor: "dark:bg-purple-950/30",
      },
      {
        title: "Staff Members",
        value: analytics.totalStaff.toString(),
        change: `${analytics.activeStaff} active`,
        trend: "up",
        icon: UserCog,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        darkBgColor: "dark:bg-amber-950/30",
      },
    ]
    : []

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-200 dark:border-blue-900 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
                <div className="w-20 h-20 border-4 border-purple-200 dark:border-purple-900 rounded-full animate-ping absolute top-0 left-1/2 -translate-x-1/2 opacity-20"></div>
              </div>
              <p className="text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Loading Analytics...
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-900 dark:from-slate-100 dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatDateTimeIST(new Date())}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="fy">Financial Year</SelectItem>
                  </SelectContent>
                </Select>

                {session?.user?.permissions.includes("sales.create") && <Button onClick={openCreateDialog} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Sale
                </Button>}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat) => (
              <Card
                key={stat.title}
                className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div
                  className={cn(
                    "absolute inset-0 opacity-50 transition-opacity group-hover:opacity-70",
                    stat.bgColor,
                    stat.darkBgColor
                  )}
                />
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                        stat.bgColor,
                        stat.darkBgColor
                      )}
                    >
                      <stat.icon className={cn("w-6 h-6", stat.color)} />
                    </div>

                    <div className="flex items-center gap-1">
                      {stat.title === "Total Expenses" && (
                        <button
                          type="button"
                          onClick={handleOpenExpenseLedger}
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full border text-[10px] font-semibold text-muted-foreground hover:bg-background/60"
                          aria-label="View expense ledger"
                        >
                          i
                        </button>
                      )}

                      {stat.trend === "up" ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Category */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Revenue by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesByCategoryData.length > 0 ? (
                  <DonutChart
                    data={salesByCategoryData}
                    category="value"
                    index="name"
                    valueFormatter={formatCurrency}
                    colors={["blue", "cyan", "indigo", "violet", "purple"]}
                    className="h-60"
                    showAnimation={true}
                    showLabel={true}
                  />
                ) : (
                  <div className="h-60 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expenses by Category */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="w-5 h-5 text-red-600" />
                  Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expensesByCategoryData.length > 0 ? (
                  <DonutChart
                    data={expensesByCategoryData}
                    category="value"
                    index="name"
                    valueFormatter={formatCurrency}
                    colors={["rose", "red", "orange", "amber", "yellow"]}
                    className="h-60"
                    showAnimation={true}
                    showLabel={true}
                  />
                ) : (
                  <div className="h-60 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesByPaymentData.length > 0 ? (
                  <DonutChart
                    data={salesByPaymentData}
                    category="value"
                    index="name"
                    valueFormatter={formatCurrency}
                    colors={["emerald", "teal", "green"]}
                    className="h-60"
                    showAnimation={true}
                    showLabel={true}
                  />
                ) : (
                  <div className="h-60 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue vs Expenses */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Revenue vs Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={comparisonData}
                  index="category"
                  categories={["Sales", "Expenses"]}
                  colors={["blue", "red"]}
                  valueFormatter={formatCurrency}
                  className="h-60"
                  yAxisWidth={80}
                  showAnimation={true}
                  showLegend={true}
                  showGridLines={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Upcoming */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Check-ins */}
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                  Recent Check-ins
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentCustomers.length > 0 ? (
                  recentCustomers.map((customer) => (
                    <div
                      key={customer.uid}
                      className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/30 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateIST(new Date(customer.checkIn))} - {formatDateIST(new Date(customer.checkOut))}
                          </p>
                        </div>
                      </div>
                      <Badge>{formatCurrency(customer.totalAmount)}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No recent check-ins</p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Checkouts */}
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="w-5 h-5 text-emerald-600" />
                  Upcoming Checkouts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingCheckouts.length > 0 ? (
                  upcomingCheckouts.map((customer) => (
                    <div
                      key={customer.uid}
                      className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-slate-50 to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/30 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Checkout: {formatDateTimeIST(new Date(customer.checkOut))}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={customer.balanceAmount > 0 ? "destructive" : "default"}
                      >
                        {customer.balanceAmount > 0 ? "Pending" : "Paid"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No upcoming checkouts</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Sales */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="w-5 h-5 text-purple-600" />
                Recent Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                        Description
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                        Payment
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                        Source
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.length > 0 ? (
                      sales.slice(0, 10).map((sale) => (
                        <tr key={sale.uid} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            {formatDateIST(new Date(sale.date))}
                          </td>
                          <td className="py-3 px-4">{sale.description}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">
                              {sale.category.charAt(0).toUpperCase() +
                                sale.category.slice(1).replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {formatCurrency(sale.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge>{sale.paymentMode.toUpperCase()}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary">
                              {sale.sourceType.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              {session?.user?.permissions.includes("sales.edit") && <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(sale)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>}
                              { session?.user?.permissions.includes("sales.delete") &&<Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSale(sale.uid)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No sales found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expense Ledger Dialog */}
      <Dialog open={expenseLedgerOpen} onOpenChange={setExpenseLedgerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Expense Ledger</DialogTitle>
            <DialogDescription>
              Showing expenses for{" "}
              {formatDateIST(dateRange.from)} – {formatDateIST(dateRange.to)} (latest first)
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {loadingExpenses ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Loading expenses...
              </div>
            ) : expenses.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No expenses in this range
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground">
                      Mode
                    </th>
                    <th className="text-right py-2 pl-3 font-medium text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => {
                    const paymentModeLabel = exp.mode
                      ? String(exp.mode).toUpperCase()
                      : "N/A"

                    const categoryLabel = exp.category
                      ? exp.category.charAt(0).toUpperCase() +
                      exp.category.slice(1).replace(/_/g, " ")
                      : "Uncategorized"

                    return (
                      <tr key={exp.uid} className="border-b last:border-0">
                        <td className="py-2 pr-3 w-24">
                          {exp.date ? formatDateIST(new Date(exp.date)) : "-"}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant="outline">{categoryLabel}</Badge>
                        </td>
                        <td className="py-2 pr-3 w-64 text-muted-foreground">
                          {exp.description || "-"}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge>{paymentModeLabel}</Badge>
                        </td>
                        <td className="py-2 pl-3 text-right font-medium">
                          {formatCurrency(exp.amount || 0)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sale Dialog */}
      <Dialog open={showSaleDialog} onOpenChange={setShowSaleDialog}>
        <DialogContent className="max-w-3xl max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSale ? "Edit Sale" : "Add New Sale"}</DialogTitle>
            <DialogDescription>
              {editingSale ? "Update sale details" : "Create a new manual sale entry"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={saleForm.amount}
                  onChange={(e) => setSaleForm({ ...saleForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={saleForm.category}
                  onValueChange={(v) => setSaleForm({ ...saleForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stay">Stay</SelectItem>
                    <SelectItem value="cuisine">Cuisine</SelectItem>
                    <SelectItem value="extra_services">Extra Services</SelectItem>
                    <SelectItem value="advance">Advance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={saleForm.date}
                  onChange={(e) => setSaleForm({ ...saleForm, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time (IST) *</Label>
                <Input
                  id="time"
                  type="text"
                  value={saleForm.time}
                  onChange={(e) => setSaleForm({ ...saleForm, time: e.target.value })}
                  placeholder="12:00 PM"
                />
                <p className="text-xs text-muted-foreground">Format: HH:MM AM/PM</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMode">Payment Mode *</Label>
              <Select
                value={saleForm.paymentMode}
                onValueChange={(v) => setSaleForm({ ...saleForm, paymentMode: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={saleForm.description}
                onChange={(e) => setSaleForm({ ...saleForm, description: e.target.value })}
                placeholder="Enter description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Receipt (Optional)</Label>
              {saleForm.receiptUrl && !saleReceiptFile && (
                <div className="flex items-center gap-2 mb-2">
                  <a
                    href={saleForm.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Current Receipt
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSaleForm({ ...saleForm, receiptUrl: "" })
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              )}
              <div className="border-2 border-dashed rounded-lg p-4">
                <input
                  type="file"
                  id="saleReceipt"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    handleFileChange(e, setSaleReceiptFile, setSaleReceiptPreview)
                  }
                  className="hidden"
                />
                <label
                  htmlFor="saleReceipt"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload receipt (optional)
                  </span>
                </label>
              </div>
              {saleReceiptPreview && (
                <img
                  src={saleReceiptPreview}
                  alt="Receipt Preview"
                  className="mt-2 max-w-full h-32 object-contain rounded border"
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaleDialog(false)
                setSaleReceiptFile(null)
                setSaleReceiptPreview("")
              }}
              disabled={uploadingSaleReceipt}
            >
              Cancel
            </Button>
            <Button
              onClick={editingSale ? handleUpdateSale : handleCreateSale}
              disabled={uploadingSaleReceipt}
            >
              {uploadingSaleReceipt ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                editingSale ? "Update" : "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </AppShell>
  )
}