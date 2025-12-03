"use client"

import { type ReactNode, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LayoutDashboard, Users, Wallet, Calendar, Settings, Menu, Building2, TrendingUp, Shield, UserCog } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Customer Entry", href: "/customers", icon: Users },
  { name: "Monthly Expenses", href: "/monthly-expenses", icon: Wallet },
  { name: "Yearly Expenses", href: "/yearly-expenses", icon: TrendingUp },
  { name: "Booking Calendar", href: "/bookings", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
]

const adminNavigation = [
  { name: "User Management", href: "/admin/users", icon: UserCog, permission: "users.view" },
  { name: "Roles & Permissions", href: "/admin/roles", icon: Shield, permission: "roles.view" },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSession()

  // Filter admin navigation based on permissions
  const visibleAdminNav = adminNavigation.filter(item => 
    session?.user?.permissions?.includes(item.permission)
  )

  const allNavigation = [...navigation, ...visibleAdminNav]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-card">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Property</h1>
              <p className="text-xs text-muted-foreground">Management</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}

          {/* Admin Section */}
          {visibleAdminNav.length > 0 && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administration
                </p>
              </div>
              {visibleAdminNav.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                )
              })}
            </>
          )}
        </nav>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden border-b bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold">Property Manager</span>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="p-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg leading-tight">Property</h1>
                    <p className="text-xs text-muted-foreground">Management</p>
                  </div>
                </div>
              </div>
              <nav className="p-4 space-y-1">
                {allNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}