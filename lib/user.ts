import { dbConnect } from "@/lib/db";
import { Tenant, User } from "@/lib/models";
import { getSession } from "@/lib/auth";

/** Derive user type and linked entity from domain_associations. */
function getRoleContext(user: {
  domain_associations?: Array<{ domain_type: string; domain_id: unknown; is_primary?: boolean }>;
  role_id?: unknown;
}) {
  const associations = user.domain_associations || [];
  const primary = associations.find((a) => a.is_primary && a.domain_id);
  const fallback = associations.find((a) => a.domain_id);
  const assoc = primary || fallback;
  if (assoc?.domain_type === "agent") {
    return { user_type: "agent" as const, agent_id: assoc.domain_id?.toString?.() ?? null, store_id: null };
  }
  if (assoc?.domain_type === "store") {
    return { user_type: "store" as const, agent_id: null, store_id: assoc.domain_id?.toString?.() ?? null };
  }
  return { user_type: "admin" as const, agent_id: null, store_id: null };
}

export interface CurrentUser {
  _id: unknown;
  id: unknown;
  email: string;
  first_name?: string;
  last_name?: string;
  company_name: string;
  subdomain?: string;
  user_type: "admin" | "agent" | "store";
  role_code?: string;
  role_name?: string;
  permissions?: {
    modules?: Array<{
      module_name: string;
      actions: string[];
    }>;
  } | null;
  agent_id: string | null;
  store_id: string | null;
  tenant_id: string;
}

/**
 * Get current user from session. Use in server components instead of fetching /api/auth/me.
 * Returns null if not logged in or on any error (graceful degradation for Vercel/serverless).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const session = await getSession();
    if (!session) return null;
    await dbConnect();
    const user = await User.findById(session.userId)
      .select("-password_hash")
      .populate("role_id", "name code permissions")
      .lean();
    const tenant = await Tenant.findById(session.tenantId).lean();
    if (!user || !tenant) return null;
    const roleContext = getRoleContext(user);
    const roleDoc = user.role_id as any;
    return {
      ...user,
      id: user._id,
      company_name: tenant.company_name,
      subdomain: tenant.subdomain,
      tenant_id: session.tenantId,
      role_code: roleDoc?.code || "admin",
      role_name: roleDoc?.name || "Administrator",
      permissions: roleDoc?.permissions || null,
      ...roleContext,
    } as CurrentUser;
  } catch {
    return null;
  }
}

/**
 * Returns a MongoDB query filter object to enforce facility/warehouse scoping per user role.
 * - System Admin: Sees all records across the tenant.
 * - Scoped Port/Warehouse Admin: Sees records linked to their assigned_warehouse_id or created by them.
 */
export async function getFacilityScopeFilter(
  sessionUserId: string,
  tenantId: string,
  warehouseField: string = "warehouse_id"
) {
  await dbConnect();
  const user = await User.findById(sessionUserId).populate("role_id", "code").lean();
  const roleCode = (user?.role_id as any)?.code || "admin";

  if (roleCode === "admin") {
    return { tenant_id: tenantId };
  }

  const assignedWhId = user?.assigned_warehouse_id;
  if (assignedWhId) {
    if (warehouseField === "movements") {
      return {
        tenant_id: tenantId,
        $or: [
          { from_warehouse: assignedWhId },
          { to_warehouse: assignedWhId },
          { created_by: sessionUserId },
        ],
      };
    }
    if (warehouseField === "repackaging") {
      return {
        tenant_id: tenantId,
        $or: [
          { source_warehouse_id: assignedWhId },
          { target_warehouse_id: assignedWhId },
          { created_by: sessionUserId },
        ],
      };
    }
    return {
      tenant_id: tenantId,
      $or: [{ [warehouseField]: assignedWhId }, { created_by: sessionUserId }],
    };
  }

  return { tenant_id: tenantId, created_by: sessionUserId };
}
