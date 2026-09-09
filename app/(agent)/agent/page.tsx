import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dbConnect } from "@/lib/db";
import { Agent, Store, Order, SalesRoute } from "@/lib/models";
import { getCurrentUser } from "@/lib/user";
import mongoose from "mongoose";
import {
  Store as StoreIcon,
  ShoppingCart,
  MapPin,
  PackageCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  Navigation,
  ArrowRight,
  Compass,
  Plus,
} from "lucide-react";
import { LogVisitDialog } from "@/components/log-visit-dialog";
import { RouteGoogleMap } from "@/components/route-google-map";
import { AgentClockInWidget } from "@/components/agent-clock-in-widget";

function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getAgentData(agentId: string, tenantId: string) {
  await dbConnect();
  const agent = await Agent.findById(agentId).lean();
  if (!agent) return null;
  const tenantObjId = new mongoose.Types.ObjectId(tenantId);
  const agentObjId = new mongoose.Types.ObjectId(agentId);

  const assignedRoutesList = await SalesRoute.find({
    tenant_id: tenantId,
    assigned_agent_ids: agentId,
    is_active: true,
  })
    .populate("territory_id", "territory_name territory_code")
    .sort({ route_name: 1 })
    .lean();

  const routeIds = assignedRoutesList.map((r) => r._id.toString());
  const storeIdsFromRoutes = assignedRoutesList.flatMap((r: any) => r.assigned_store_ids || []).map((id: any) => id.toString()).filter(Boolean);
  const territoryIdsFromRoutes = assignedRoutesList.map((r: any) => (r.territory_id?._id || r.territory_id)?.toString()).filter(Boolean);

  const routeCenters: Array<{ lat: number; lng: number }> = [];
  assignedRoutesList.forEach((r: any) => {
    if (r.start_point?.latitude && r.start_point?.longitude) {
      routeCenters.push({ lat: r.start_point.latitude, lng: r.start_point.longitude });
    }
    if (r.end_point?.latitude && r.end_point?.longitude) {
      routeCenters.push({ lat: r.end_point.latitude, lng: r.end_point.longitude });
    }
  });

  const allStores = await Store.find({
    tenant_id: tenantId,
    is_active: true,
  })
    .select("store_code store_name store_type owner_info contact_person contact phone owner_name owner_phone address latitude longitude assigned_agent_id assigned_route_id territory_id")
    .lean();

  const filteredStores = allStores.filter((s: any) => {
    const sId = s._id.toString();
    const sAgent = s.assigned_agent_id?.toString();
    const sRoute = s.assigned_route_id?.toString();
    const sTerritory = s.territory_id?.toString();

    if (sAgent === agentId) return true;
    if (sRoute && routeIds.includes(sRoute)) return true;
    if (storeIdsFromRoutes.includes(sId)) return true;
    if (sTerritory && territoryIdsFromRoutes.includes(sTerritory)) return true;

    const storeLat = s.address?.latitude || s.latitude || 0;
    const storeLng = s.address?.longitude || s.longitude || 0;

    if (storeLat && storeLng && routeCenters.length > 0) {
      const isNearby = routeCenters.some((rc) => getHaversineDistanceKm(storeLat, storeLng, rc.lat, rc.lng) <= 25);
      if (isNearby) return true;
    }

    return false;
  });

  const storesCount = filteredStores.length;
  const assignedStores = filteredStores.slice(0, 12);

  const [
    ordersCount,
    ordersDelivered,
    ordersPendingOrInProgress,
    recentOrders,
    productUnitsAgg,
  ] = await Promise.all([
    Order.countDocuments({ tenant_id: tenantId, agent_id: agentId }),
    Order.countDocuments({ tenant_id: tenantId, agent_id: agentId, status: "delivered" }),
    Order.countDocuments({
      tenant_id: tenantId,
      agent_id: agentId,
      status: { $in: ["draft", "pending", "confirmed", "processing", "shipped"] },
    }),
    Order.find({ tenant_id: tenantId, agent_id: agentId })
      .populate("store_id", "store_name store_code")
      .sort({ order_date: -1 })
      .limit(10)
      .lean(),
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
    assignedRoutes: (assignedRoutesList || []).map((r: any) => ({
      _id: r._id.toString(),
      route_name: r.route_name,
      route_code: r.route_code,
      description: r.description,
      start_point: r.start_point,
      end_point: r.end_point,
      waypoints: r.waypoints || [],
      distance_km: r.distance_km,
      territory_name: r.territory_id?.territory_name,
    })),
    storesCount,
    assignedStores: (assignedStores || []).map((s: any) => {
      const ownerName =
        s.owner_info?.name ||
        s.contact_person?.name ||
        s.owner_name ||
        "Shopkeeper";
      const ownerPhone =
        s.owner_info?.phone ||
        s.contact_person?.phone ||
        s.contact?.phone ||
        s.owner_phone ||
        s.phone ||
        "";
      return {
        _id: s._id.toString(),
        store_code: s.store_code,
        store_name: s.store_name,
        store_type: s.store_type,
        owner_name: ownerName,
        owner_phone: ownerPhone,
        owner_info: { name: ownerName, phone: ownerPhone },
        latitude: s.address?.latitude || s.latitude || 0,
        longitude: s.address?.longitude || s.longitude || 0,
        city: s.address?.city,
        address: s.address,
      };
    }),
    ordersCount,
    ordersDelivered,
    tripsRemaining,
    productUnitsAssigned,
    recentOrders: (recentOrders || []).map((o) => ({
      _id: o._id.toString(),
      order_number: o.order_number,
      grand_total: o.grand_total,
      status: o.status,
      delivery_status: o.delivery_status,
      order_date: o.order_date,
      store: o.store_id as unknown as { store_name?: string; store_code?: string },
    })),
  };
}

export default async function AgentPortalPage() {
  const user = await getCurrentUser();
  if (!user?.agent_id) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          <p className="font-semibold text-base">Agent Account Not Linked</p>
          <p className="text-xs mt-1">Your user login is not associated with a Field Agent record. Please ask your administrator to link your account.</p>
        </div>
      </div>
    );
  }

  const data = await getAgentData(user.agent_id, user.tenant_id);
  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Agent profile record not found.</p>
      </div>
    );
  }

  const { agent, assignedRoutes, storesCount, assignedStores, ordersDelivered, tripsRemaining, productUnitsAssigned, recentOrders } = data;
  const name = [agent.first_name, agent.last_name].filter(Boolean).join(" ") || "Field Agent";
  const primaryRoute = assignedRoutes[0] || null;

  return (
    <div className="space-y-8 w-full">
      {/* Field Operations Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Navigation className="size-5 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back, {name}</h1>
          </div>
          <p className="text-sm text-slate-300">
            Market Field Operations · Code: <span className="font-mono text-emerald-400">{agent.agent_code || "AGT-01"}</span> · {assignedRoutes.length} Assigned Routes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md gap-2 font-semibold">
            <Link href="/agent/shops/new">
              <Plus className="size-4" /> Onboard New Store
            </Link>
          </Button>

          <Button variant="outline" asChild className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 gap-2">
            <Link href="/agent/place-order">
              <ShoppingCart className="size-4 text-emerald-400" /> Book Order
            </Link>
          </Button>

          <LogVisitDialog
            stores={assignedStores}
            trigger={
              <Button variant="outline" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 gap-2">
                <MapPin className="size-4 text-emerald-400" /> Log Visit
              </Button>
            }
          />
        </div>
      </div>

      {/* Agent Live Attendance Clock-In Widget */}
      <AgentClockInWidget agentId={user.agent_id} />

      {/* Operational Metrics Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 hover:border-slate-300 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Routes</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Compass className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">{assignedRoutes.length}</div>
            <p className="text-xs text-slate-500 mt-1">Active market routes assigned to you</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:border-slate-300 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Shops</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <StoreIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">{storesCount}</div>
            <p className="text-xs text-slate-500 mt-1">Retail outlets in your market route</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:border-slate-300 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Units Sold</CardTitle>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
              <TrendingUp className="size-4 text-slate-900" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">{productUnitsAssigned.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Total units booked from retailers</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:border-slate-300 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Orders</CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">{tripsRemaining}</div>
            <p className="text-xs text-slate-500 mt-1">Orders processing in warehouse</p>
          </CardContent>
        </Card>
      </div>

      {/* Field Agent Assigned Routes & Google Map View */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">My Daily Sales Routes ({assignedRoutes.length})</CardTitle>
            <CardDescription>
              Market areas and sales routes assigned to your daily schedule with interactive Google Map (📍) and Shop Outlets (🏪).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {assignedRoutes.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-slate-200">
              No sales routes assigned to your agent account yet. Please contact your manager to assign routes.
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {assignedRoutes.map((r) => (
                  <div key={r._id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-base">{r.route_name}</span>
                      <Badge variant="outline" className="font-mono bg-slate-50">{r.route_code}</Badge>
                    </div>
                    {r.territory_name && (
                      <p className="text-xs text-slate-500">Region: <span className="font-semibold text-slate-700">{r.territory_name}</span></p>
                    )}
                    <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded-lg space-y-1">
                      <p className="truncate font-semibold text-sky-800">
                        📍 Target Area: {r.start_point?.name || r.end_point?.name || "Market Area Zone"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {primaryRoute && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span>Google Route Map Overlay — {primaryRoute.route_name}</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300">
                      {assignedStores.length} Shops Plotted
                    </Badge>
                  </div>
                  <RouteGoogleMap
                    startPoint={primaryRoute.start_point || null}
                    endPoint={primaryRoute.end_point || null}
                    waypoints={primaryRoute.waypoints || []}
                    stores={assignedStores}
                    readOnly={true}
                    height="350px"
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Market Action Section: Assigned Shops */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">My Market Outlets & Shopkeepers</CardTitle>
            <CardDescription>Visit shopkeepers in your area, take product orders, or log visit feedback.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-1">
            <Link href="/agent/shops">
              View All ({storesCount}) <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {assignedStores.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              No market outlets currently assigned to your route.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignedStores.map((s) => (
                <div
                  key={s._id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-base">{s.store_name}</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono bg-slate-50">
                        {s.store_code}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      👤 {s.owner_name || s.owner_info?.name || "Shopkeeper"} · 📞 {s.owner_phone || s.owner_info?.phone || "No phone"}
                    </p>
                    <p className="text-xs text-slate-500">
                      📍 {[s.address?.city, s.address?.state].filter(Boolean).join(", ") || "Market Outlet"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button size="sm" className="flex-1 bg-slate-900 text-white hover:bg-slate-800 text-xs gap-1.5" asChild>
                      <Link href={`/agent/place-order?store_id=${s._id}`}>
                        <ShoppingCart className="size-3.5" /> Take Order
                      </Link>
                    </Button>

                    <LogVisitDialog
                      stores={assignedStores}
                      initialStoreId={s._id}
                      trigger={
                        <Button size="sm" variant="outline" className="text-xs gap-1">
                          <MapPin className="size-3.5 text-emerald-600" /> Log Visit
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Market Orders Feed */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900">Recent Route Orders Booked</CardTitle>
          <CardDescription>Latest orders submitted from field visits to shopkeepers</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500 p-4 text-center">No recent market orders recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Shopkeeper Outlet</th>
                    <th className="px-4 py-3">Grand Total</th>
                    <th className="px-4 py-3">Order Status</th>
                    <th className="px-4 py-3">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">{o.order_number}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {o.store?.store_name || "Market Outlet"}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">Rs. {o.grand_total?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Badge variant={o.status === "confirmed" || o.status === "delivered" ? "success" : "default"}>
                          {o.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">
                          {o.delivery_status || "pending"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
