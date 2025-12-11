"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MoreVertical, Loader2, UserCog, Shield } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/footer";

interface User {
  uid: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  active: boolean;
  createdAt: string;
}

interface Role {
  uid: string;
  name: string;
  displayName: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersRes = await fetch("/api/admin/users");
      const usersData = await usersRes.json();
      
      // Fetch roles
      const rolesRes = await fetch("/api/admin/roles");
      const rolesData = await rolesRes.json();
      
      setUsers(usersData.users || []);
      setRoles(rolesData.roles || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(`User ${!user.active ? "activated" : "deactivated"} successfully`);
      fetchData();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.uid}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Role filter
    if (roleFilter !== "all" && user.role !== roleFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active" && !user.active) return false;
      if (statusFilter === "inactive" && user.active) return false;
    }

    return true;
  });

  const getRoleDisplayName = (roleName: string) => {
    const role = roles.find((r) => r.name === roleName);
    return role?.displayName || roleName;
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <UserCog className="w-8 h-8" />
              User Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage system users and their access
            </p>
          </div>
          <div className="flex gap-2">
            {session?.user?.permissions?.includes("roles.view") && <Button
              variant="outline"
              onClick={() => router.push("/admin/roles")}
            >
              <Shield className="w-4 h-4 mr-2" />
              Roles & Permissions
            </Button>}
            {session?.user?.permissions?.includes("users.create") && (
              <Button onClick={() => router.push("/admin/users/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.uid} value={role.name}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* User List */}
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UserCog className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                  ? "No users found matching your filters"
                  : "No users yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.uid} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <Badge
                          variant={user.active ? "default" : "secondary"}
                          className={
                            user.active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }
                        >
                          {user.active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          {getRoleDisplayName(user.role)}
                        </Badge>
                        {user.uid === session?.user?.id && (
                          <Badge variant="secondary">You</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Email:</span>{" "}
                          {user.email}
                        </div>
                        {user.phone && (
                          <div>
                            <span className="text-muted-foreground">Phone:</span>{" "}
                            {user.phone}
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Created:</span>{" "}
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {session?.user?.permissions?.includes("users.edit") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          { session?.user?.permissions?.includes("users.edit") && <DropdownMenuItem
                            onClick={() => {
                              router.push(`/admin/users/${user.uid}`)
                            }}
                          >
                            Edit User
                          </DropdownMenuItem>}
                          { session?.user?.permissions?.includes("users.edit") && <DropdownMenuItem
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>}
                          {session?.user?.permissions?.includes("users.delete") &&
                            user.uid !== session?.user?.id && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  Delete User
                                </DropdownMenuItem>
                              </>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the user account for{" "}
                <strong>{userToDelete?.name}</strong>. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete User"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Footer />
    </AppShell>
  );
}