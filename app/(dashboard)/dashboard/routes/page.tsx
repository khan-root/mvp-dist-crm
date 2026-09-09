import { cookies } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Navigation, MapPin, Compass, Store as StoreIcon, Users, Layers } from "lucide-react";
import { RouteForm } from "@/components/route-form";
import { DeleteRouteButton } from "../territories/delete-route-button";
import { RouteLeafletMap } from "@/components/route-leaflet-map";
import { RoutesClientView } from "./routes-client-view";
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

export default async function SalesRoutesPage() {
  const [{ data: territories }, { data: routes }, agents, stores] = await Promise.all([
    getTerritories(),
    getRoutes(),
    getAgents(),
    getStores(),
  ]);

  return (
    <div className="space-y-8 w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Navigation className="size-5 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Sales Routes & Beat Planning</h1>
          </div>
          <p className="text-sm text-slate-300">
            Configure field agent daily visit routes, waypoints, and retail store beat maps across KPK, Punjab, Sindh & Pakistan regions.
          </p>
        </div>

        <RouteForm
          territories={territories}
          agents={agents}
          stores={stores}
          trigger={
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md gap-2 font-semibold">
              <Plus className="size-4" /> Create Sales Route
            </Button>
          }
        />
      </div>

      <RoutesClientView
        routes={routes}
        territories={territories}
        agents={agents}
        stores={stores}
      />
    </div>
  );
}
