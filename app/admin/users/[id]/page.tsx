"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Loader2, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/footer";

interface User {
  uid: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  active: boolean;
  customPermissions: string[];
}

interface Role {
  uid: string;
  name: string;
  displayName: string;
  permissions: string[];
}

interface PermissionMeta {
  key: string;
  displayName: string;
  category: string;
  description: string;
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionMeta[]>([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState<Record<string, PermissionMeta[]>>({});

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "",
    active: true,
    customPermissions: [] as string[],
  });

  const [originalRole, setOriginalRole] = useState("");

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch user
      const userRes = await fetch(`/api/admin/users/${userId}`);
      const userData = await userRes.json();

      // Fetch roles
      const rolesRes = await fetch("/api/admin/roles");
      const rolesData = await rolesRes.json();

      // Fetch permissions
      const permsRes = await fetch("/api/admin/permissions");
      const permsData = await permsRes.json();

      setUser(userData.user);
      setRoles(rolesData.roles || []);
      setAllPermissions(permsData.permissions || []);
      setPermissionsByCategory(permsData.permissionsByCategory || {});

      setFormData({
        name: userData.user.name,
        phone: userData.user.phone || "",
        role: userData.user.role,
        active: userData.user.active,
        customPermissions: userData.user.customPermissions || [],
      });

      setOriginalRole(userData.user.role);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user");
      }

      toast.success("User updated successfully!");

      // If role changed, show additional message
      if (formData.role !== originalRole) {
        toast.info("User will need to log out and log back in for role changes to take effect");
      }

      router.push("/admin/users");
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const toggleCustomPermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      customPermissions: prev.customPermissions.includes(permission)
        ? prev.customPermissions.filter((p) => p !== permission)
        : [...prev.customPermissions, permission],
    }));
  };

  const selectAllInCategory = (category: string) => {
    const categoryPerms = permissionsByCategory[category]?.map((p) => p.key) || [];
    const allSelected = categoryPerms.every((p) => formData.customPermissions.includes(p));

    if (allSelected) {
      // Deselect all in category
      setFormData((prev) => ({
        ...prev,
        customPermissions: prev.customPermissions.filter((p) => !categoryPerms.includes(p)),
      }));
    } else {
      // Select all in category
      setFormData((prev) => ({
        ...prev,
        customPermissions: [...new Set([...prev.customPermissions, ...categoryPerms])],
      }));
    }
  };

  const selectedRole = roles.find((r) => r.name === formData.role);
  const rolePermissions = selectedRole?.permissions || [];

  // Check if a permission is granted by role (not custom)
  const isRolePermission = (permission: string) => {
    return rolePermissions.includes(permission);
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

  if (!user) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">User not found</p>
          <Button onClick={() => router.push("/admin/users")} className="mt-4">
            Back to Users
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Edit User</h1>
            <p className="text-muted-foreground mt-1">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={user.email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+91 98765 43210"
                />
              </div>
            </CardContent>
          </Card>

          {/* Role & Status */}
          <Card>
            <CardHeader>
              <CardTitle>Role & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">User Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.uid} value={role.name}>
                        {role.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {formData.role !== originalRole && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <p className="text-sm text-yellow-900 dark:text-yellow-100">
                      Role change detected. User will need to log out and log back in
                      for changes to take effect.
                    </p>
                  </div>
                )}
              </div>

              {selectedRole && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">
                    {selectedRole.displayName} Permissions ({rolePermissions.length}):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {rolePermissions.slice(0, 10).map((perm) => (
                      <span
                        key={perm}
                        className="text-xs px-2 py-1 bg-background rounded border"
                      >
                        {perm}
                      </span>
                    ))}
                    {rolePermissions.length > 10 && (
                      <span className="text-xs px-2 py-1 text-muted-foreground">
                        +{rolePermissions.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Checkbox
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, active: checked as boolean })
                  }
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Active (User can log in)
                </Label>
              </div>

              {formData.active !== user.active && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    Account status will be {formData.active ? "activated" : "deactivated"}.
                    User will be notified via email.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Permissions (Optional)</CardTitle>
              <CardDescription>
                Grant additional permissions beyond this user's role. Permissions
                already granted by the role are marked and cannot be removed here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {Object.entries(permissionsByCategory).map(([category, perms]) => {
                  const categoryPerms = perms.map((p) => p.key);
                  const customInCategory = categoryPerms.filter(
                    (p) => formData.customPermissions.includes(p) && !isRolePermission(p)
                  );

                  return (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-semibold capitalize">
                            {category.replace(/_/g, " ")}
                          </span>
                          {customInCategory.length > 0 && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                              {customInCategory.length} custom
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => selectAllInCategory(category)}
                            className="mb-2"
                          >
                            {categoryPerms.every((p) =>
                              formData.customPermissions.includes(p)
                            )
                              ? "Deselect All"
                              : "Select All"}
                          </Button>

                          {perms.map((perm) => {
                            const isFromRole = isRolePermission(perm.key);
                            const isCustom = formData.customPermissions.includes(perm.key);

                            return (
                              <div
                                key={perm.key}
                                className={`flex items-start gap-3 p-3 rounded-lg border ${
                                  isFromRole
                                    ? "bg-muted/50 border-muted"
                                    : "bg-background"
                                }`}
                              >
                                <Checkbox
                                  id={perm.key}
                                  checked={isCustom || isFromRole}
                                  disabled={isFromRole}
                                  onCheckedChange={() =>
                                    !isFromRole && toggleCustomPermission(perm.key)
                                  }
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={perm.key}
                                    className={`font-medium ${
                                      isFromRole ? "cursor-not-allowed" : "cursor-pointer"
                                    }`}
                                  >
                                    {perm.displayName}
                                    {isFromRole && (
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        (from role)
                                      </span>
                                    )}
                                  </Label>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {perm.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>

              {formData.customPermissions.filter((p) => !isRolePermission(p))
                .length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>
                      {
                        formData.customPermissions.filter((p) => !isRolePermission(p))
                          .length
                      }{" "}
                      custom permission(s)
                    </strong>{" "}
                    granted beyond the user's role.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Self-Edit Warning */}
          {user.uid === session?.user?.id && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    You are editing your own account. Changes to your role or
                    permissions will require you to log out and log back in.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
      <Footer />
    </AppShell>
  );
}