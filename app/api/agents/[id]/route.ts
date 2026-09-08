import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { Agent, Store, Order, SalesRoute } from "@/lib/models";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const agent = await Agent.findOne({
      _id: id,
      tenant_id: session.tenantId,
    })
      .populate("distributor_id", "company_name distributor_code")
      .populate("territory_id", "territory_name territory_code")
      .lean();
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const [assignedStoresCount, ordersTotal, ordersDelivered, ordersPending, ordersInProgress, assignedRoutes] = await Promise.all([
      Store.countDocuments({ tenant_id: session.tenantId, assigned_agent_id: id, is_active: true }),
      Order.countDocuments({ tenant_id: session.tenantId, agent_id: id }),
      Order.countDocuments({ tenant_id: session.tenantId, agent_id: id, status: "delivered" }),
      Order.countDocuments({
        tenant_id: session.tenantId,
        agent_id: id,
        status: { $in: ["draft", "pending", "confirmed"] },
      }),
      Order.countDocuments({
        tenant_id: session.tenantId,
        agent_id: id,
        status: { $in: ["processing", "shipped"] },
        delivery_status: { $in: ["processing", "shipped", "out_for_delivery"] },
      }),
      SalesRoute.find({
        tenant_id: session.tenantId,
        assigned_agent_ids: id,
        is_active: true,
      })
        .select("route_name route_code start_point end_point distance_km")
        .lean(),
    ]);

    const productUnitsAssigned = await Order.aggregate([
      { $match: { tenant_id: session.tenantId, agent_id: new mongoose.Types.ObjectId(id), status: { $nin: ["cancelled", "returned"] } } },
      { $unwind: "$items" },
      { $group: { _id: null, total: { $sum: "$items.quantity" } } },
    ]);
    const totalUnitsAssigned = productUnitsAssigned[0]?.total ?? 0;

    const assignedRouteIds = (assignedRoutes || []).map((r) => r._id.toString());

    return NextResponse.json({
      data: {
        ...agent,
        assigned_route_ids: assignedRouteIds,
        assigned_routes: assignedRoutes,
        stats: {
          assigned_stores: assignedStoresCount,
          orders_total: ordersTotal,
          orders_delivered: ordersDelivered,
          orders_pending: ordersPending,
          orders_in_progress: ordersInProgress,
          product_units_assigned: totalUnitsAssigned,
          trips_completed: ordersDelivered,
          trips_remaining: ordersPending + ordersInProgress,
        },
      },
    });
  } catch (e: any) {
    console.error("Fetch agent error:", e);
    return NextResponse.json({ error: e?.message || "Failed to load agent" }, { status: 500 });
  }
}
