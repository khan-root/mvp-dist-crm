import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dbConnect } from "@/lib/db";
import { Store, Order } from "@/lib/models";
import { getCurrentUser } from "@/lib/user";

async function getStoreData(storeId: string, tenantId: string) {
  await dbConnect();
  const store = await Store.findById(storeId).lean();
  if (!store) return null;
  const ordersCount = await Order.countDocuments({ tenant_id: tenantId, store_id: storeId });
  const recentOrders = await Order.find({ tenant_id: tenantId, store_id: storeId })
    .sort({ order_date: -1 })
    .limit(10)
    .populate("agent_id", "agent_code first_name last_name personal_info")
    .lean();
  return { store, ordersCount, recentOrders };
}

export default async function StorePortalPage() {
  const user = await getCurrentUser();
  if (!user?.store_id) {
    return (
      <div className="p-6">
        <p>Store account not linked. Please contact support.</p>
      </div>
    );
  }

  const data = await getStoreData(user.store_id, user.tenant_id);
  if (!data) {
    return (
      <div className="p-6">
        <p>Store not found.</p>
      </div>
    );
  }

  const { store, ordersCount, recentOrders } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{store.store_name}</h1>
        <p className="text-muted-foreground">Shop keeper dashboard — view your store and orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store details</CardTitle>
          <CardDescription>Your registered shop</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="font-medium">Code:</span> {store.store_code}</p>
          <p><span className="font-medium">Type:</span> {store.store_type}</p>
          {store.owner_info && (
            <p>
              <span className="font-medium">Owner:</span> {store.owner_info.name} · {store.owner_info.phone} · {store.owner_info.email}
            </p>
          )}
          {store.address?.line1 && (
            <p>
              <span className="font-medium">Address:</span> {store.address.line1}, {store.address.city}, {store.address.state} {store.address.pincode}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{ordersCount}</div>
          <p className="text-xs text-muted-foreground">Orders placed for this store</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My orders</CardTitle>
            <CardDescription>Received from company · by agent · status & delivery</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/store/place-order">Place order</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet. Place an order to get started.</p>
          ) : (
            <ul className="space-y-3">
              {recentOrders.map((o: {
                _id: string;
                order_number: string;
                grand_total: number;
                status: string;
                delivery_status?: string;
                agent_id?: { agent_code: string; first_name: string; last_name: string } | null;
              }) => (
                <li key={o._id} className="flex flex-wrap items-center justify-between gap-2 text-sm border-b pb-2 last:border-0">
                  <span className="font-mono">{o.order_number}</span>
                  <span>Rs.{o.grand_total?.toLocaleString()}</span>
                  <span className="text-muted-foreground">
                    By: {o.agent_id
                      ? `${(o.agent_id as { agent_code?: string; first_name?: string; last_name?: string }).agent_code} · ${[(o.agent_id as { first_name?: string }).first_name, (o.agent_id as { last_name?: string }).last_name].filter(Boolean).join(" ")}`
                      : "—"}
                  </span>
                  <Badge variant="secondary">{o.status}</Badge>
                  <Badge variant="outline">{o.delivery_status || "pending"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
