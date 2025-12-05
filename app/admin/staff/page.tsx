"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Loader2, Users } from "lucide-react";
import type { StaffModel, STAFF_DESIGNATIONS } from "@/models/staff.model";

function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return value.toDate();
  }
  if (typeof value === "string") return new Date(value);
  return new Date();
}

export default function StaffPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [staff, setStaff] = useState<StaffModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [designationFilter, setDesignationFilter] = useState<string>("all");

  useEffect(() => {
    fetchStaff();
  }, [statusFilter, designationFilter]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      
      if (designationFilter !== "all") {
        params.set("designation", designationFilter);
      }

      const res = await fetch(`/api/staff?${params}`);
      const data = await res.json();
      setStaff(data.staff || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter((member) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.phone.toLowerCase().includes(query) ||
      member.alternatePhone?.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "on_leave":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "resigned":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "terminated":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getDesignationDisplay = (member: StaffModel) => {
    return member.designation === "Other" && member.customDesignation
      ? member.customDesignation
      : member.designation;
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Users className="w-8 h-8" />
              Staff Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage staff members and their records
            </p>
          </div>
          {session?.user?.permissions?.includes("staff.create") && (
            <Button onClick={() => router.push("/admin/staff/new")} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Add Staff
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="resigned">Resigned</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={designationFilter} onValueChange={setDesignationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by designation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designations</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Cook">Cook</SelectItem>
                <SelectItem value="Cleaner">Cleaner</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Receptionist">Receptionist</SelectItem>
                <SelectItem value="Accountant">Accountant</SelectItem>
                <SelectItem value="Driver">Driver</SelectItem>
                <SelectItem value="Gardener">Gardener</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredStaff.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No staff members found</p>
              {session?.user?.permissions?.includes("staff.create") && (
                <Button
                  onClick={() => router.push("/admin/staff/new")}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Staff Member
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredStaff.map((member) => (
              <Card
                key={member.uid}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/admin/staff/${member.uid}`)}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">{member.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {getDesignationDisplay(member)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(member.status)}>
                          {member.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Phone:</span>{" "}
                          {member.phone}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Joined:</span>{" "}
                          {toDate(member.joiningDate).toLocaleDateString()}
                        </div>
                        {member.monthlySalary && (
                          <div>
                            <span className="text-muted-foreground">Salary:</span> ₹
                            {member.monthlySalary.toLocaleString()}
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Total Paid:</span> ₹
                          {member.totalPayments.toLocaleString()}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Expenses:</span> ₹
                          {member.totalExpenses.toLocaleString()}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Age:</span> {member.age}
                        </div>
                      </div>
                    </div>

                    {session?.user?.permissions?.includes("staff.view") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/staff/${member.uid}`);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    )}
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