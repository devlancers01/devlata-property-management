"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, Wallet, AlertCircle } from "lucide-react"

const stats = [
  {
    title: "Total Guests Today",
    value: "24",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Upcoming Reservations",
    value: "12",
    icon: Calendar,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    title: "Monthly Expenses",
    value: "₹45,280",
    icon: Wallet,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    title: "Alerts / Reminders",
    value: "3",
    icon: AlertCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
]

const alerts = [
  { id: 1, message: "Room 101 checkout today at 11:00 AM", type: "info" },
  { id: 2, message: "Electricity bill payment due in 3 days", type: "warning" },
  { id: 3, message: "Staff salary pending for 2 employees", type: "urgent" },
]

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-balance">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                  </div>
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", stat.bgColor)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alerts & Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Alerts & Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-4 rounded-lg border-l-4",
                  alert.type === "urgent" && "bg-destructive/10 border-destructive",
                  alert.type === "warning" && "bg-chart-3/10 border-chart-3",
                  alert.type === "info" && "bg-primary/10 border-primary",
                )}
              >
                <p className="text-sm font-medium">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
