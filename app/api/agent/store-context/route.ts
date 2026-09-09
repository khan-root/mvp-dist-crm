import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Agent, SalesRoute, User, Territory, Distributor } from "@/lib/models";
import { getSession } from "@/lib/auth";

/** GET: Fetch context data needed for an agent to onboard a new store */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const user = await User.findById(session.userId).lean();
    const agentAssoc = user?.domain_associations?.find((a: { domain_type?: string }) => a.domain_type === "agent");
    const agentId = agentAssoc?.domain_id?.toString?.();

    if (!agentId) return NextResponse.json({ error: "Not an agent account" }, { status: 403 });

    const agent = await Agent.findById(agentId)
      .populate("territory_id", "territory_name territory_code")
      .populate("distributor_id", "company_name distributor_code")
      .lean();

    if (!agent) return NextResponse.json({ error: "Agent record not found" }, { status: 404 });

    const routes = await SalesRoute.find({
      tenant_id: session.tenantId,
      assigned_agent_ids: agentId,
      is_active: true,
    })
      .populate("territory_id", "territory_name territory_code")
      .populate("distributor_id", "company_name distributor_code")
      .sort({ route_name: 1 })
      .lean();

    const territories = await Territory.find({ tenant_id: session.tenantId, is_active: true })
      .select("territory_name territory_code")
      .lean();

    const distributors = await Distributor.find({ tenant_id: session.tenantId, is_active: true })
      .select("company_name distributor_code")
      .lean();

    // Generate suggested store code
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const suggestedStoreCode = `STR-${randomSuffix}`;

    return NextResponse.json({
      data: {
        agent: {
          _id: agent._id.toString(),
          agent_code: agent.agent_code,
          first_name: agent.first_name,
          last_name: agent.last_name,
          distributor_id: (agent.distributor_id as any)?._id?.toString() || agent.distributor_id?.toString(),
          distributor_name: (agent.distributor_id as any)?.company_name,
          territory_id: (agent.territory_id as any)?._id?.toString() || agent.territory_id?.toString(),
          territory_name: (agent.territory_id as any)?.territory_name,
        },
        routes: routes.map((r: any) => ({
          _id: r._id.toString(),
          route_name: r.route_name,
          route_code: r.route_code,
          territory_id: (r.territory_id?._id || r.territory_id)?.toString(),
          territory_name: r.territory_id?.territory_name,
          distributor_id: (r.distributor_id?._id || r.distributor_id)?.toString(),
          distributor_name: r.distributor_id?.company_name,
          start_point: r.start_point,
          end_point: r.end_point,
        })),
        territories: territories.map((t: any) => ({
          _id: t._id.toString(),
          territory_name: t.territory_name,
          territory_code: t.territory_code,
        })),
        distributors: distributors.map((d: any) => ({
          _id: d._id.toString(),
          company_name: d.company_name,
          distributor_code: d.distributor_code,
        })),
        suggested_store_code: suggestedStoreCode,
      },
    });
  } catch (e: any) {
    console.error("Agent store-context error:", e);
    return NextResponse.json({ error: e?.message || "Failed to load store context" }, { status: 500 });
  }
}
