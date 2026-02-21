import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { Agent, Store, Order } from "@/lib/models";
import { requireSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
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

    const [assignedStoresCount, ordersTotal, ordersDelivered, ordersPending, ordersInProgress] = await Promise.all([
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
    ]);

    const productUnitsAssigned = await Order.aggregate([
      { $match: { tenant_id: session.tenantId, agent_id: new mongoose.Types.ObjectId(id), status: { $nin: ["cancelled", "returned"] } } },
      { $unwind: "$items" },
      { $group: { _id: null, total: { $sum: "$items.quantity" } } },
    ]);
    const totalUnitsAssigned = productUnitsAssigned[0]?.total ?? 0;

    return NextResponse.json({
      data: {
        ...agent,
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
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to load agent" }, { status: 500 });
  }
}
