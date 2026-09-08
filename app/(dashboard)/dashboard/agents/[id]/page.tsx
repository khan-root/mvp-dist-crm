import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Store as StoreIcon, Truck, ClipboardList, Settings2, Compass, MapPin } from "lucide-react";
import { getServerApiBaseUrl } from "@/lib/api";
import { AgentStoreAssignmentDialog } from "@/components/agent-store-assignment-dialog";
import { AgentProductAssignmentDialog } from "@/components/agent-product-assignment-dialog";
import { AgentRouteAssignmentDialog } from "@/components/agent-route-assignment-dialog";

async function getAgent(id: string) {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/agents/${id}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json() as Promise<{
    data: {
      _id: string;
      agent_code: string;
      first_name: string;
      last_name: string;
      personal_info?: { email: string; phone: string };
      distributor_id?: { company_name: string };
      territory_id?: { territory_name: string };
      assigned_product_ids?: string[];
      assigned_route_ids?: string[];
      assigned_routes?: Array<{ _id: string; route_name: string; route_code: string; distance_km?: number }>;
      stats: {
        assigned_stores: number;
        orders_total: number;
        orders_delivered: number;
        orders_pending: number;
        orders_in_progress: number;
        product_units_assigned: number;
        trips_completed: number;
        trips_remaining: number;
      };
    };
  }>;
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAgent(id);
  if (!result?.data) notFound();
  const { data: agent } = result;
  const name = [agent.first_name, agent.last_name].filter(Boolean).join(" ");
  const s = agent.stats;
  const authorizedSkuCount = agent.assigned_product_ids?.length || 0;
  const assignedRouteCount = agent.assigned_route_ids?.length || 0;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 text-white shadow-md">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-white hover:bg-slate-800">
            <Link href="/dashboard/agents"><ArrowLeft className="size-5" /></Link>
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">{name}</h1>
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">
                Active Field Agent
              </Badge>
            </div>
            <p className="text-sm text-slate-300">
              Code: <span className="font-mono text-emerald-400">{agent.agent_code}</span> · {agent.distributor_id?.company_name || "Distributor"} · {agent.territory_id?.territory_name || "Territory"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AgentRouteAssignmentDialog
            agentId={agent._id}
            agentName={name}
            trigger={
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-semibold shadow-md">
                <Compass className="size-4" /> Assign Sales Routes ({assignedRouteCount})
              </Button>
            }
          />

          <AgentStoreAssignmentDialog
            agentId={agent._id}
            agentName={name}
            trigger={
              <Button variant="outline" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 gap-2">
                <StoreIcon className="size-4 text-emerald-400" /> Assign Stores
              </Button>
            }
          />

          <AgentProductAssignmentDialog
            agentId={agent._id}
            agentName={name}
            trigger={
              <Button variant="outline" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 gap-2">
                <Package className="size-4 text-emerald-400" /> Assign Products
              </Button>
            }
          />
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Routes</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Compass className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">{assignedRouteCount}</div>
            <p className="text-xs text-slate-500 mt-1">Active market routes for agent</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Stores</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <StoreIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">{s.assigned_stores}</div>
            <p className="text-xs text-slate-500 mt-1">Shops under this agent's route</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Authorized SKUs</CardTitle>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
              <Package className="size-4 text-slate-900" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">
              {authorizedSkuCount > 0 ? authorizedSkuCount : "All Catalog"}
            </div>
            <p className="text-xs text-slate-500 mt-1">Products agent can sell</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trips Completed</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Truck className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">{s.trips_completed}</div>
            <p className="text-xs text-slate-500 mt-1">Delivered market orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Management Cards (3-Column Grid) */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Multiple Routes Assignment Card */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Assigned Routes</CardTitle>
              <CardDescription className="text-xs">Multiple sales routes for this agent</CardDescription>
            </div>
            <AgentRouteAssignmentDialog
              agentId={agent._id}
              agentName={name}
              trigger={
                <Button size="sm" variant="outline" className="gap-1 text-xs">
                  <Settings2 className="size-3.5 text-emerald-600" /> Manage ({assignedRouteCount})
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-xs">Assigned Routes</span>
                <span className="font-bold text-slate-900 text-xs">{assignedRouteCount} Routes</span>
              </div>
              {agent.assigned_routes && agent.assigned_routes.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {agent.assigned_routes.map((r) => (
                    <div key={r._id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200">
                      <span className="font-bold text-slate-900">{r.route_name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono bg-slate-50">{r.route_code}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No spatial sales routes currently assigned to this agent's daily market schedule.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stores Assignment Card */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Outlet Assignments</CardTitle>
              <CardDescription className="text-xs">Retail stores assigned to agent</CardDescription>
            </div>
            <AgentStoreAssignmentDialog
              agentId={agent._id}
              agentName={name}
              trigger={
                <Button size="sm" variant="outline" className="gap-1 text-xs">
                  <Settings2 className="size-3.5 text-emerald-600" /> Manage ({s.assigned_stores})
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-xs">Active Outlets</span>
                <span className="font-bold text-slate-900 text-xs">{s.assigned_stores} Outlets</span>
              </div>
              <p className="text-xs text-slate-500">
                Stores visible on agent app for visits and order booking.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Product Catalog Assignment Card */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Product Authorization</CardTitle>
              <CardDescription className="text-xs">Allowed SKUs agent can sell</CardDescription>
            </div>
            <AgentProductAssignmentDialog
              agentId={agent._id}
              agentName={name}
              trigger={
                <Button size="sm" variant="outline" className="gap-1 text-xs">
                  <Settings2 className="size-3.5 text-emerald-600" /> Manage SKUs
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-xs">Authorized SKUs</span>
                <span className="font-bold text-slate-900 text-xs">
                  {authorizedSkuCount > 0 ? `${authorizedSkuCount} SKUs` : "Full Catalog"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Products this agent is permitted to offer to shopkeepers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile & Order Activity Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900">Agent Profile & Activity</CardTitle>
          <CardDescription>Contact info and historical performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs text-slate-500 block font-medium">Agent Code</span>
              <span className="font-bold text-slate-900 font-mono">{agent.agent_code}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Email</span>
              <span className="font-semibold text-slate-900">{agent.personal_info?.email || "N/A"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Phone</span>
              <span className="font-semibold text-slate-900">{agent.personal_info?.phone || "N/A"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Territory</span>
              <span className="font-semibold text-slate-900">{agent.territory_id?.territory_name || "Unassigned"}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Total Orders: {s.orders_total}</Badge>
              <Badge variant="outline">Delivered: {s.orders_delivered}</Badge>
              <Badge variant="outline">Pending: {s.orders_pending}</Badge>
              <Badge variant="outline">In Progress: {s.orders_in_progress}</Badge>
            </div>

            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/orders?agent_id=${agent._id}`}>View All Orders by Agent →</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
