import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { Distributor, Agent, Store, Order, Product, Warehouse } from "@/lib/models";
import { requireSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireSession();
    await dbConnect();
    const tenantId = new mongoose.Types.ObjectId(session.tenantId);

    const [distributorsCount, agentsCount, storesCount, warehousesCount, ordersCount, productsCount, recentOrders, pendingOrdersCount] = await Promise.all([
      Distributor.countDocuments({ tenant_id: tenantId, is_active: true }),
      Agent.countDocuments({ tenant_id: tenantId, is_active: true }),
      Store.countDocuments({ tenant_id: tenantId, is_active: true }),
      Warehouse.countDocuments({ tenant_id: tenantId, is_active: true }),
      Order.countDocuments({ tenant_id: tenantId }),
      Product.countDocuments({ tenant_id: tenantId, "status.is_active": true }),
      Order.find({ tenant_id: tenantId }).sort({ order_date: -1 }).limit(5).lean(),
      Order.countDocuments({ tenant_id: tenantId, status: "pending" }),
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { tenant_id: tenantId, status: { $in: ["confirmed", "processing", "shipped", "delivered"] } } },
      { $group: { _id: null, total: { $sum: "$grand_total" } } },
    ]);
    const revenue = totalRevenue[0]?.total ?? 0;

    return NextResponse.json({
      data: {
        counts: {
          distributors: distributorsCount,
          agents: agentsCount,
          stores: storesCount,
          warehouses: warehousesCount,
          orders: ordersCount,
          products: productsCount,
          pending_orders: pendingOrdersCount,
        },
        revenue: Math.round(revenue * 100) / 100,
        recent_orders: recentOrders,
      },
    });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
