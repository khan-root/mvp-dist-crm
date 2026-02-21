import { cookies } from "next/headers";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dbConnect } from "@/lib/db";
import { Agent, Store, Order } from "@/lib/models";
import mongoose from "mongoose";

async function getAgentData(agentId: string, tenantId: string) {
  await dbConnect();
  const agent = await Agent.findById(agentId).lean();
  if (!agent) return null;
  const tenantObjId = new mongoose.Types.ObjectId(tenantId);
  const agentObjId = new mongoose.Types.ObjectId(agentId);
  const [storesCount, ordersCount, ordersDelivered, ordersPendingOrInProgress, recentOrders, productUnitsAgg] = await Promise.all([
    Store.countDocuments({ tenant_id: tenantId, assigned_agent_id: agentId, is_active: true }),
    Order.countDocuments({ tenant_id: tenantId, agent_id: agentId }),
    Order.countDocuments({ tenant_id: tenantId, agent_id: agentId, status: "delivered" }),
    Order.countDocuments({
      tenant_id: tenantId,
      agent_id: agentId,
      status: { $in: ["draft", "pending", "confirmed", "processing", "shipped"] },
    }),
    Order.find({ tenant_id: tenantId, agent_id: agentId }).sort({ order_date: -1 }).limit(10).lean(),
    Order.aggregate([
      { $match: { tenant_id: tenantObjId, agent_id: agentObjId, status: { $nin: ["cancelled", "returned"] } } },
      { $unwind: "$items" },
      { $group: { _id: null, total: { $sum: "$items.quantity" } } },
    ]),
  ]);
  const productUnitsAssigned = productUnitsAgg[0]?.total ?? 0;
  const tripsRemaining = ordersPendingOrInProgress;
  return {
    agent,
    storesCount,
    ordersCount,
    ordersDelivered,
    tripsRemaining,
    productUnitsAssigned,
    recentOrders,
  };
}

export default async function AgentPortalPage() {
  const cookieStore = await cookies();
  const meRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/me`, {
    headers: { Cookie: cookieStore.toString() },
  });
  const meData = await meRes.json();
  const user = meData.user;
  if (!user?.agent_id) {
    return (
      <div className="p-6">
        <p>Agent account not linked. Please contact admin.</p>
      </div>
    );
  }

  const data = await getAgentData(user.agent_id, user.tenant_id);
  if (!data) {
    return (
      <div className="p-6">
        <p>Agent profile not found.</p>
      </div>
    );
  }

  const { agent, storesCount, ordersCount, ordersDelivered, tripsRemaining, productUnitsAssigned, recentOrders } = data;
  const name = [agent.first_name, agent.last_name].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {name}</h1>
        <p className="text-muted-foreground">Agent dashboard — products assigned, trips, and orders</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:bg-muted/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assigned stores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storesCount}</div>
            <p className="text-xs text-muted-foreground">Visit these shops and place orders</p>
            {storesCount > 0 && (
              <Link href="/agent/shops" className="text-xs text-primary underline mt-1 inline-block">View my shops →</Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Product assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productUnitsAssigned}</div>
            <p className="text-xs text-muted-foreground">Total units in your orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trips completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersDelivered}</div>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tripsRemaining}</div>
            <p className="text-xs text-muted-foreground">Pending / in progress</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My orders</CardTitle>
          <CardDescription>Orders you are responsible for — latest 10</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentOrders.map((o: { _id: string; order_number: string; grand_total: number; status: string; delivery_status?: string }) => (
                <li key={o._id} className="flex justify-between items-center text-sm">
                  <span className="font-mono">{o.order_number}</span>
                  <span>Rs.{o.grand_total?.toLocaleString()}</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{o.status}</Badge>
                    <Badge variant="outline">{o.delivery_status || "pending"}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
