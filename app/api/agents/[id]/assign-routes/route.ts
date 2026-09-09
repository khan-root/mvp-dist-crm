import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { SalesRoute, Agent } from "@/lib/models";
import { getSession } from "@/lib/auth";

const AssignRoutesSchema = z.object({
  route_ids: z.array(z.string()),
});

/** GET: fetch assigned and available routes for an agent */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: agentId } = await params;
    await dbConnect();

    const agent = await Agent.findOne({ _id: agentId, tenant_id: session.tenantId })
      .select("assigned_route_ids")
      .lean();
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const allRoutes = await SalesRoute.find({
      tenant_id: session.tenantId,
      is_active: true,
    })
      .select("route_name route_code description start_point end_point distance_km assigned_agent_ids")
      .sort({ route_name: 1 })
      .lean();

    const agentRouteIds = (agent?.assigned_route_ids || []).map((rid: any) => rid.toString());
    const assignedRouteIds = Array.from(
      new Set([
        ...agentRouteIds,
        ...(allRoutes || [])
          .filter((r: any) => r.assigned_agent_ids?.some((a: any) => a.toString() === agentId))
          .map((r: any) => r._id.toString()),
      ])
    );

    return NextResponse.json({
      data: {
        agent_id: agentId,
        assigned_route_ids: assignedRouteIds,
        all_routes: allRoutes,
      },
    });
  } catch (e) {
    console.error("Fetch assign-routes error:", e);
    return NextResponse.json({ error: "Failed to fetch route assignments" }, { status: 500 });
  }
}

/** PUT: update route assignments for an agent (multiple routes to one agent) */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: agentId } = await params;
    const body = await request.json();
    const parsed = AssignRoutesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid route_ids list", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    const newRouteIds = parsed.data.route_ids;

    // 1. Remove agent from routes previously assigned but not in new list
    await SalesRoute.updateMany(
      { tenant_id: session.tenantId, assigned_agent_ids: agentId, _id: { $nin: newRouteIds } },
      { $pull: { assigned_agent_ids: agentId } }
    );

    // 2. Add agent to selected routes
    if (newRouteIds.length > 0) {
      await SalesRoute.updateMany(
        { tenant_id: session.tenantId, _id: { $in: newRouteIds } },
        { $addToSet: { assigned_agent_ids: agentId } }
      );
    }

    // 3. Update Agent document assigned_route_ids array
    await Agent.updateOne(
      { _id: agentId, tenant_id: session.tenantId },
      { $set: { assigned_route_ids: newRouteIds } }
    );

    return NextResponse.json({
      success: true,
      message: `Assigned ${newRouteIds.length} routes to agent`,
    });
  } catch (e) {
    console.error("Update assign-routes error:", e);
    return NextResponse.json({ error: "Failed to update route assignments" }, { status: 500 });
  }
}
