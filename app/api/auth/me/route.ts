import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Tenant, User } from "@/lib/models";
import { getSession } from "@/lib/auth";

/** Derive user type and linked entity from domain_associations. */
function getRoleContext(user: { domain_associations?: Array<{ domain_type: string; domain_id: unknown; is_primary?: boolean }>; role_id?: unknown }) {
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

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  try {
    await dbConnect();
    const user = await User.findById(session.userId)
      .select("-password_hash")
      .populate("role_id", "name code permissions")
      .lean();
    const tenant = await Tenant.findById(session.tenantId).lean();
    if (!user || !tenant) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    const roleContext = getRoleContext(user);
    const roleDoc = user.role_id as any;

    return NextResponse.json({
      user: {
        ...user,
        id: user._id,
        company_name: tenant.company_name,
        subdomain: tenant.subdomain,
        role_code: roleDoc?.code || "admin",
        role_name: roleDoc?.name || "Administrator",
        permissions: roleDoc?.permissions || null,
        ...roleContext,
      },
    });
  } catch (err) {
    console.error("Me error:", err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
