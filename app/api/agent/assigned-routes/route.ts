import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { SalesRoute, User } from "@/lib/models";
import { getSession } from "@/lib/auth";

/** GET: Fetch active sales routes assigned to the logged-in field agent */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const user = await User.findById(session.userId).lean();
    const agentAssoc = user?.domain_associations?.find((a: { domain_type?: string }) => a.domain_type === "agent");
    const agentId = agentAssoc?.domain_id?.toString?.();
    if (!agentId) return NextResponse.json({ error: "Not an agent account" }, { status: 403 });

    const routes = await SalesRoute.find({
      tenant_id: session.tenantId,
      assigned_agent_ids: agentId,
      is_active: true,
    })
      .populate("territory_id", "territory_name territory_code")
      .populate("assigned_store_ids", "store_name store_code owner_info address")
      .sort({ route_name: 1 })
      .lean();

    return NextResponse.json({ data: routes });
  } catch (e: any) {
    console.error("Agent assigned-routes error:", e);
    return NextResponse.json({ error: e?.message || "Failed to load assigned routes" }, { status: 500 });
  }
}
