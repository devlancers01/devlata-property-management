import { adminDb } from "./admin";
import { RoleModel, RoleCreateInput, RoleUpdateInput } from "@/models/role.model";
import { Permission } from "@/types/roles";
import { Timestamp } from "firebase-admin/firestore";

// Helper to convert Timestamp to Date
function toDate(value: Date | Timestamp): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as any).toDate();
  }
  return value as Date;
}

// ==================== ROLE OPERATIONS ====================

export async function getRoleByName(name: string): Promise<RoleModel | null> {
  try {
    const snapshot = await adminDb
      .collection("roles")
      .where("name", "==", name)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      uid: doc.id,
      ...data,
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
    } as RoleModel;
  } catch (error) {
    console.error("Error getting role by name:", error);
    throw error;
  }
}

export async function getRoleById(uid: string): Promise<RoleModel | null> {
  try {
    const doc = await adminDb.collection("roles").doc(uid).get();
    if (!doc.exists) return null;

    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      createdAt: data!.createdAt ? toDate(data!.createdAt) : new Date(),
      updatedAt: data!.updatedAt ? toDate(data!.updatedAt) : new Date(),
    } as RoleModel;
  } catch (error) {
    console.error("Error getting role by ID:", error);
    throw error;
  }
}

export async function getAllRoles(): Promise<RoleModel[]> {
  try {
    const snapshot = await adminDb
      .collection("roles")
      .orderBy("createdAt", "asc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
      } as RoleModel;
    });
  } catch (error) {
    console.error("Error getting all roles:", error);
    throw error;
  }
}

export async function createRole(data: RoleCreateInput): Promise<RoleModel> {
  try {
    // Check if role name already exists
    const existing = await getRoleByName(data.name);
    if (existing) {
      throw new Error("Role with this name already exists");
    }

    const roleRef = adminDb.collection("roles").doc();
    const now = Timestamp.now();

    const roleData: Omit<RoleModel, "uid"> = {
      name: data.name.toLowerCase(),
      displayName: data.displayName,
      permissions: data.permissions,
      isSystemRole: false,
      createdAt: now,
      updatedAt: now,
    };

    await roleRef.set(roleData);

    return {
      uid: roleRef.id,
      ...roleData,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
}

export async function updateRole(
  uid: string,
  data: RoleUpdateInput
): Promise<void> {
  try {
    const role = await getRoleById(uid);
    if (!role) {
      throw new Error("Role not found");
    }

    if (role.isSystemRole) {
      throw new Error("Cannot modify system roles");
    }

    const updateData: any = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    await adminDb.collection("roles").doc(uid).update(updateData);
  } catch (error) {
    console.error("Error updating role:", error);
    throw error;
  }
}

export async function deleteRole(uid: string): Promise<void> {
  try {
    const role = await getRoleById(uid);
    if (!role) {
      throw new Error("Role not found");
    }

    if (role.isSystemRole) {
      throw new Error("Cannot delete system roles (admin, staff)");
    }

    // Check if any users have this role
    const usersWithRole = await adminDb
      .collection("users")
      .where("role", "==", role.name)
      .limit(1)
      .get();

    if (!usersWithRole.empty) {
      throw new Error(
        "Cannot delete role that is assigned to users. Reassign users first."
      );
    }

    await adminDb.collection("roles").doc(uid).delete();
  } catch (error) {
    console.error("Error deleting role:", error);
    throw error;
  }
}

export async function getRolePermissions(roleName: string): Promise<Permission[]> {
  try {
    const role = await getRoleByName(roleName);
    if (!role) return [];
    return role.permissions;
  } catch (error) {
    console.error("Error getting role permissions:", error);
    return [];
  }
}

// ==================== INITIALIZATION ====================

export async function initializeSystemRoles(): Promise<void> {
  try {
    const adminRole = await getRoleByName("admin");
    const staffRole = await getRoleByName("staff");

    const now = Timestamp.now();

    // Create admin role if doesn't exist
    if (!adminRole) {
      await adminDb.collection("roles").doc().set({
        name: "admin",
        displayName: "Administrator",
        permissions: [
          "customers.view",
          "customers.create",
          "customers.edit",
          "customers.delete",
          "bookings.view",
          "bookings.create",
          "bookings.edit",
          "bookings.delete",
          "payments.view",
          "payments.create",
          "sales.view",
          "expenses.view",
          "expenses.create",
          "staff.view",
          "settings.view",
          "settings.edit",
          "users.view",
          "users.create",
          "users.edit",
          "users.delete",
          "roles.view",
          "roles.create",
          "roles.edit",
          "roles.delete",
        ] as Permission[],
        isSystemRole: true,
        createdAt: now,
        updatedAt: now,
      });
      console.log("✅ Admin role created");
    }

    // Create staff role if doesn't exist
    if (!staffRole) {
      await adminDb.collection("roles").doc().set({
        name: "staff",
        displayName: "Staff Member",
        permissions: [
          "customers.view",
          "bookings.view",
          "payments.view",
        ] as Permission[],
        isSystemRole: true,
        createdAt: now,
        updatedAt: now,
      });
      console.log("✅ Staff role created");
    }
  } catch (error) {
    console.error("Error initializing system roles:", error);
    throw error;
  }
}