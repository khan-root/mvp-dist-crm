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
      .lean();
    const tenant = await Tenant.findById(session.tenantId).lean();
    if (!user || !tenant) return null;
    const roleContext = getRoleContext(user);
    return {
      ...user,
      id: user._id,
      company_name: tenant.company_name,
      subdomain: tenant.subdomain,
      tenant_id: session.tenantId,
      ...roleContext,
    } as CurrentUser;
  } catch {
    return null;
  }
}
