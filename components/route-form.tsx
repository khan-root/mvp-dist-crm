"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RouteLeafletMap, LatLngPoint, StorePoint } from "@/components/route-leaflet-map";
import { Compass, MapPin, CheckCircle2 } from "lucide-react";

interface TerritoryOption {
  _id: string;
  territory_name: string;
  territory_code: string;
}

interface AgentOption {
  _id: string;
  first_name: string;
  last_name: string;
  agent_code: string;
}

export function RouteForm({
  territories,
  agents,
  stores = [],
  trigger,
}: {
  territories: TerritoryOption[];
  agents: AgentOption[];
  stores?: StorePoint[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [route_name, setRouteName] = useState("");
  const [route_code, setRouteCode] = useState("");
  const [description, setDescription] = useState("");
  const [territory_id, setTerritoryId] = useState("");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  const [startPoint, setStartPoint] = useState<LatLngPoint | null>(null);
  const [endPoint, setEndPoint] = useState<LatLngPoint | null>(null);
  const [waypoints, setWaypoints] = useState<LatLngPoint[]>([]);
  const [distanceKm, setDistanceKm] = useState<number>(0);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open && !route_code) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setRouteCode(`RT-DEL-${randomNum}`);
    }
  }, [open, route_code]);

  function toggleAgent(agentId: string) {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!route_name.trim() || !route_code.trim()) {
      setError("Please provide Route Name and Route Code.");
      return;
    }

    setError("");
    setLoading(true);

    // Fallback coordinates if map was not explicitly clicked
    const defaultLat = stores[0]?.latitude || 33.6844;
    const defaultLng = stores[0]?.longitude || 73.0479;

    const finalStart: LatLngPoint = startPoint || {
      name: "Start Location",
      latitude: defaultLat,
      longitude: defaultLng,
    };

    const finalEnd: LatLngPoint = endPoint || {
      name: "End Location",
      latitude: defaultLat + 0.03,
      longitude: defaultLng + 0.03,
    };

    try {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          route_name: route_name.trim(),
          route_code: route_code.trim(),
          description: description || undefined,
          territory_id: territory_id || undefined,
          start_point: finalStart,
          end_point: finalEnd,
          waypoints,
          assigned_agent_ids: selectedAgentIds,
          distance_km: distanceKm || 5.0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create sales route");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setRouteName("");
        setRouteCode("");
        setDescription("");
        setStartPoint(null);
        setEndPoint(null);
        setWaypoints([]);
        setSelectedAgentIds([]);
        router.refresh();
      }, 1000);
    } catch {
      setError("Network error creating sales route");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-slate-900">
            <Compass className="size-5 text-emerald-600" />
            <DialogTitle>Create Sales Route & Territory Mapping</DialogTitle>
          </div>
          <DialogDescription>
            Search & select a market area on the Google Map (e.g. Blue Area), plot market stores, and assign agents to the sales route.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="size-14 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-xl font-bold text-slate-900">Sales Route Created Successfully!</h3>
            <p className="text-sm text-slate-500">Route mapping and agent assignments saved to system.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="route_name">Route Name</Label>
                <Input
                  id="route_name"
                  placeholder="e.g. Blue Area Commercial Zone"
                  value={route_name}
                  onChange={(e) => setRouteName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="route_code">Route Code</Label>
                <Input
                  id="route_code"
                  placeholder="e.g. RT-DEL-01"
                  value={route_code}
                  onChange={(e) => setRouteCode(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Territory</Label>
                <Select value={territory_id} onValueChange={setTerritoryId}>
                  <SelectTrigger><SelectValue placeholder="Select Territory" /></SelectTrigger>
                  <SelectContent>
                    {territories.map((t) => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.territory_name} ({t.territory_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Google Maps Canvas */}
            <div className="space-y-2">
              <Label className="font-semibold text-slate-900 flex items-center justify-between">
                <span>Google Map Area Selection — Market Area / Sector</span>
                <span className="text-xs text-slate-500 font-normal">Search any area (e.g. Blue Area) or click map to select target market location</span>
              </Label>

              <RouteLeafletMap
                isOpen={open}
                startPoint={startPoint}
                endPoint={endPoint}
                waypoints={waypoints}
                stores={stores}
                height="360px"
                onPointsChange={(data) => {
                  setStartPoint(data.start);
                  setEndPoint(data.end);
                  setWaypoints(data.waypoints);
                  setDistanceKm(data.distanceKm);
                  if (data.start?.name && !route_name) {
                    setRouteName(`${data.start.name} Route`);
                  }
                }}
              />
            </div>

            {/* Multiple Agent Assignment Selection */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <Label className="font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="size-4 text-emerald-600" /> Assign Agents to this Route (Multiple Agents Allowed)
              </Label>
              <p className="text-xs text-slate-500">
                Check the agents who will cover and book market orders along this route.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2 max-h-[140px] overflow-y-auto">
                {agents.map((a) => {
                  const isSelected = selectedAgentIds.includes(a._id);
                  return (
                    <button
                      key={a._id}
                      type="button"
                      onClick={() => toggleAgent(a._id)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 font-bold"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className={`size-3 rounded-full ${isSelected ? "bg-emerald-400" : "bg-slate-300"}`} />
                      <span className="truncate">{a.first_name} {a.last_name} ({a.agent_code})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating Route…" : "Create Route & Save Mapping"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
