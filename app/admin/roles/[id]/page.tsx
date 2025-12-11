"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Loader2, Save, Shield, Lock } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/footer";

interface PermissionMeta {
  key: string;
  displayName: string;
  category: string;
  description: string;
}

interface Role {
  uid: string;
  name: string;
  displayName: string;
  permissions: string[];
  isSystemRole: boolean;
}

export default function RoleFormPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.id as string;
  const isEditMode = !!roleId && roleId !== "new";

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<PermissionMeta[]>([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState<
    Record<string, PermissionMeta[]>
  >({});

  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchPermissions();
    if (isEditMode) {
      fetchRole();
    }
  }, [roleId]);

  const fetchPermissions = async () => {
    try {
      const res = await fetch("/api/admin/permissions");
      const data = await res.json();
      setAllPermissions(data.permissions || []);
      setPermissionsByCategory(data.permissionsByCategory || {});
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Failed to load permissions");
    }
  };

  const fetchRole = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/roles/${roleId}`);
      const data = await res.json();

      setRole(data.role);
      setFormData({
        name: data.role.name,
        displayName: data.role.displayName,
        permissions: data.role.permissions || [],
      });
    } catch (error) {
      console.error("Error fetching role:", error);
      toast.error("Failed to load role");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.displayName) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate role name format
    if (!/^[a-z_]+$/.test(formData.name)) {
      toast.error("Role name must be lowercase with underscores only");
      return;
    }

    if (formData.permissions.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    setSaving(true);

    try {
      const url = isEditMode
        ? `/api/admin/roles/${roleId}`
        : "/api/admin/roles";
      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save role");
      }

      toast.success(
        isEditMode
          ? "Role updated successfully!"
          : "Role created successfully!"
      );
      router.push("/admin/roles");
    } catch (error: any) {
      console.error("Error saving role:", error);
      toast.error(error.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const selectAllInCategory = (category: string) => {
    const categoryPerms =
      permissionsByCategory[category]?.map((p) => p.key) || [];
    const allSelected = categoryPerms.every((p) =>
      formData.permissions.includes(p)
    );

    if (allSelected) {
      setFormData((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((p) => !categoryPerms.includes(p)),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...categoryPerms])],
      }));
    }
  };

  const selectAll = () => {
    const allPerms = allPermissions.map((p) => p.key);
    const allSelected = allPerms.every((p) => formData.permissions.includes(p));

    if (allSelected) {
      setFormData((prev) => ({ ...prev, permissions: [] }));
    } else {
      setFormData((prev) => ({ ...prev, permissions: allPerms }));
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

  const isSystemRole = role?.isSystemRole || false;

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8" />
              {isEditMode ? "Edit Role" : "Create New Role"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode
                ? `Manage permissions for ${role?.displayName}`
                : "Define a new role with specific permissions"}
            </p>
          </div>
        </div>

        {isSystemRole && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  This is a system role. You can modify permissions but cannot
                  change the role name or delete it.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Role Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value.toLowerCase() })
                    }
                    placeholder="manager"
                    disabled={isSystemRole}
                    className={isSystemRole ? "bg-muted" : ""}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters and underscores only (e.g., senior_staff)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">
                    Display Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    placeholder="Manager"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    User-friendly name shown in the UI
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Matrix */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Permissions</CardTitle>
                  <CardDescription>
                    Select permissions for this role ({formData.permissions.length}{" "}
                    selected)
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                >
                  {formData.permissions.length === allPermissions.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {Object.entries(permissionsByCategory).map(
                  ([category, perms]) => {
                    const categoryPerms = perms.map((p) => p.key);
                    const selectedInCategory = categoryPerms.filter((p) =>
                      formData.permissions.includes(p)
                    );

                    return (
                      <AccordionItem key={category} value={category}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <span className="font-semibold capitalize">
                              {category.replace(/_/g, " ")}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {selectedInCategory.length} / {categoryPerms.length}
                            </span>
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
                                formData.permissions.includes(p)
                              )
                                ? "Deselect All"
                                : "Select All"}
                            </Button>

                            {perms.map((perm) => (
                              <div
                                key={perm.key}
                                className="flex items-start gap-3 p-3 rounded-lg border bg-background"
                              >
                                <Checkbox
                                  id={perm.key}
                                  checked={formData.permissions.includes(perm.key)}
                                  onCheckedChange={() =>
                                    togglePermission(perm.key)
                                  }
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={perm.key}
                                    className="font-medium cursor-pointer"
                                  >
                                    {perm.displayName}
                                  </Label>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {perm.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  }
                )}
              </Accordion>
            </CardContent>
          </Card>

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
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditMode ? "Update Role" : "Create Role"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
      <Footer/>
    </AppShell>
  );
}