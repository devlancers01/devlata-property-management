"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Shield, MoreVertical, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

interface Role {
  uid: string;
  name: string;
  displayName: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
}

export default function RolesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/roles");
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/roles/${roleToDelete.uid}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete role");
      }

      toast.success("Role deleted successfully");
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
      fetchRoles();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast.error(error.message || "Failed to delete role");
    } finally {
      setDeleting(false);
    }
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
              <Shield className="w-8 h-8" />
              Roles & Permissions
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage user roles and their permissions
            </p>
          </div>
          {session?.user?.permissions?.includes("roles.create") && (
            <Button onClick={() => router.push("/admin/roles/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          )}
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>System Roles:</strong> Admin and Staff roles are protected
                  system roles and cannot be deleted. You can edit their permissions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roles Grid */}
        {roles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No roles found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card
                key={role.uid}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {role.displayName}
                        {role.isSystemRole && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            System
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {role.name}
                      </p>
                    </div>

                    {session?.user?.permissions?.includes("roles.edit") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/roles/${role.uid}`)
                            }
                          >
                            Edit Permissions
                          </DropdownMenuItem>
                          {!role.isSystemRole &&
                            session?.user?.permissions?.includes(
                              "roles.delete"
                            ) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setRoleToDelete(role);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  Delete Role
                                </DropdownMenuItem>
                              </>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Permissions:</span>
                    <Badge variant="outline">{role.permissions.length}</Badge>
                  </div>

                  {role.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 6).map((perm) => (
                        <span
                          key={perm}
                          className="text-xs px-2 py-1 bg-muted rounded"
                        >
                          {perm.split(".")[0]}
                        </span>
                      ))}
                      {role.permissions.length > 6 && (
                        <span className="text-xs px-2 py-1 text-muted-foreground">
                          +{role.permissions.length - 6}
                        </span>
                      )}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => router.push(`/admin/roles/${role.uid}`)}
                  >
                    View Details
                  </Button>
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
                This will permanently delete the role{" "}
                <strong>{roleToDelete?.displayName}</strong>. Users with this role
                will need to be reassigned. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteRole}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Role"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
}