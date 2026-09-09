import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { Compass, Plus, Navigation } from "lucide-react";
import { TerritoryForm } from "./territory-form";
import { RouteForm } from "@/components/route-form";
import { TerritoriesClientView } from "./territories-client-view";
import { getServerApiBaseUrl } from "@/lib/api";

async function getTerritories() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/territories`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  return res.json() as Promise<{
    data: Array<{
      _id: string;
      territory_name: string;
      territory_code: string;
      description?: string;
      province_region?: string;
      city?: string;
      country?: string;
      target_stores?: number;
      pincodes?: string[];
    }>;
  }>;
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

  return (
    <div className="space-y-8 w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="size-5 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Configure Territories</h1>
          </div>
          <p className="text-sm text-slate-300">
            Define spatial boundaries, regional provinces (KPK, Punjab, Sindh, Balochistan, Islamabad), and assigned distributor nodes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <RouteForm
            territories={territories}
            agents={agents}
            stores={stores}
            trigger={
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-semibold shadow-md">
                <Navigation className="size-4" /> Create Sales Route
              </Button>
            }
          />

          <TerritoryForm
            trigger={
              <Button variant="outline" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 gap-2">
                <Plus className="size-4" /> Add Territory
              </Button>
            }
          />
        </div>
      </div>

      <TerritoriesClientView
        territories={territories}
        routes={routes}
        agents={agents}
        stores={stores}
      />
    </div>
  );
}
