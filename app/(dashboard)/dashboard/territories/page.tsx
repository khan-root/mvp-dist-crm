import { cookies } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Compass, MapPin, Navigation, Store as StoreIcon, Users } from "lucide-react";
import { TerritoryForm } from "./territory-form";
import { RouteForm } from "@/components/route-form";
import { RouteLeafletMap } from "@/components/route-leaflet-map";
import { DeleteRouteButton } from "./delete-route-button";
import { getServerApiBaseUrl } from "@/lib/api";

async function getTerritories() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/territories`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return { data: [] };
  return res.json() as Promise<{ data: Array<{ _id: string; territory_name: string; territory_code: string; description?: string }> }>;
}

async function getRoutes() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/routes`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return { data: [] };
  return res.json() as Promise<{
    data: Array<{
      _id: string;
      route_name: string;
      route_code: string;
      description?: string;
      distance_km?: number;
      start_point: { name?: string; latitude: number; longitude: number };
      end_point: { name?: string; latitude: number; longitude: number };
      waypoints?: Array<{ name?: string; latitude: number; longitude: number }>;
      territory_id?: { territory_name: string; territory_code: string };
      assigned_agent_ids?: Array<{ _id: string; first_name: string; last_name: string; agent_code: string }>;
      assigned_store_ids?: Array<{ store_name: string }>;
    }>;
  }>;
}

async function getAgents() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/agents`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const j = await res.json();
  return (j.data || []) as Array<{ _id: string; first_name: string; last_name: string; agent_code: string }>;
}

async function getStores() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/stores`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const j = await res.json();
  return (j.data || []).map((s: any) => ({
    _id: s._id,
    store_code: s.store_code,
    store_name: s.store_name,
    owner_name: s.owner_info?.name,
    owner_phone: s.owner_info?.phone,
    latitude: s.address?.latitude || 0,
    longitude: s.address?.longitude || 0,
    city: s.address?.city,
  }));
}

export default async function TerritoriesPage() {
  const [{ data: territories }, { data: routes }, agents, stores] = await Promise.all([
    getTerritories(),
    getRoutes(),
    getAgents(),
    getStores(),
  ]);

  const activeStoresWithCoords = stores.filter((s) => s.latitude && s.longitude);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="size-5 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Territories & Sales Routes</h1>
          </div>
          <p className="text-sm text-slate-300">
            Define spatial routes with starting/ending areas, assign field agents, and plot market outlets on Google Maps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <RouteForm
            territories={territories}
            agents={agents}
            stores={activeStoresWithCoords}
            trigger={
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-semibold shadow-md">
                <Navigation className="size-4" /> Create Sales Route (Google Map)
              </Button>
            }
          />

          <TerritoryForm
            trigger={
              <Button variant="outline" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 gap-2">
                <Plus className="size-4" /> Add Territory Region
              </Button>
            }
          />
        </div>
      </div>

      {/* Leaflet Visual Map Overview */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">Live Territory & Sales Route Map</CardTitle>
            <CardDescription>
              Shows created sales routes, start/end points, and market stores falling within territories.
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-300 gap-1.5">
            <StoreIcon className="size-3.5 text-emerald-600" />
            <span>{activeStoresWithCoords.length} Stores Plotted</span>
          </Badge>
        </CardHeader>
        <CardContent>
          <RouteLeafletMap
            startPoint={routes[0]?.start_point || null}
            endPoint={routes[0]?.end_point || null}
            waypoints={routes[0]?.waypoints || []}
            stores={activeStoresWithCoords}
            readOnly={true}
            height="400px"
          />
        </CardContent>
      </Card>

      {/* Sales Routes Table */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">Configured Sales Routes ({routes.length})</CardTitle>
            <CardDescription>Routes assigned to field agents with start and end points</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <p className="text-slate-500 py-8 text-center text-sm">
              No sales routes created yet. Click <b>"Create Sales Route"</b> above to point starting and ending locations on Leaflet map.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Route Code</TableHead>
                  <TableHead>Route Name</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead>Start → End Coordinates</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Assigned Agents</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((r) => (
                  <TableRow key={r._id} className="hover:bg-slate-50/80">
                    <TableCell className="font-mono font-bold text-slate-900">{r.route_code}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{r.route_name}</TableCell>
                    <TableCell>{r.territory_id?.territory_name || "—"}</TableCell>
                    <TableCell className="text-xs font-mono text-slate-700">
                      📍 {r.start_point?.name || r.end_point?.name || `${r.start_point?.latitude || 0}, ${r.start_point?.longitude || 0}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-100 text-slate-800">
                        {r.distance_km ? `${r.distance_km} km` : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.assigned_agent_ids && r.assigned_agent_ids.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.assigned_agent_ids.map((a) => (
                            <Badge key={a._id} variant="secondary" className="text-xs">
                              <Users className="size-3 mr-1 text-slate-500" />
                              {a.first_name} {a.last_name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteRouteButton routeId={r._id} routeName={r.route_name} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Territories List Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900">Territory Regions ({territories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {territories.length === 0 ? (
            <p className="text-slate-500 py-6 text-center text-sm">No territories created yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {territories.map((t) => (
                  <TableRow key={t._id}>
                    <TableCell className="font-mono font-bold text-slate-900">{t.territory_code}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{t.territory_name}</TableCell>
                    <TableCell className="text-slate-500">{t.description || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
