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
import { Compass, Search, Check, CheckSquare, Square, MapPin } from "lucide-react";

interface RouteItem {
  _id: string;
  route_code: string;
  route_name: string;
  description?: string;
  distance_km?: number;
  start_point?: { name?: string; latitude: number; longitude: number };
  end_point?: { name?: string; latitude: number; longitude: number };
}

export function AgentRouteAssignmentDialog({
  agentId,
  agentName,
  trigger,
}: {
  agentId: string;
  agentName: string;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [allRoutes, setAllRoutes] = useState<RouteItem[]>([]);
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setFetching(true);
    fetch(`/api/agents/${agentId}/assign-routes`, { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          const routes: RouteItem[] = res.data.all_routes || [];
          const assignedIds: string[] = res.data.assigned_route_ids || [];
          setAllRoutes(routes);
          setSelectedRouteIds(assignedIds);
        }
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [open, agentId]);

  function toggleRoute(routeId: string) {
    setSelectedRouteIds((prev) =>
      prev.includes(routeId) ? prev.filter((id) => id !== routeId) : [...prev, routeId]
    );
  }

  function selectAll() {
    setSelectedRouteIds(allRoutes.map((r) => r._id));
  }

  function deselectAll() {
    setSelectedRouteIds([]);
  }

  async function handleSave() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/assign-routes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ route_ids: selectedRouteIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update route assignments");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error saving route assignments");
    } finally {
      setLoading(false);
    }
  }

  const filteredRoutes = allRoutes.filter((r) =>
    `${r.route_name} ${r.route_code} ${r.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-slate-900">
            <Compass className="size-5 text-emerald-600" />
            <DialogTitle>Assign Multiple Sales Routes to {agentName}</DialogTitle>
          </div>
          <DialogDescription>
            Select multiple market routes and territories for this agent to visit and book orders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search routes by name or code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={selectAll} className="text-xs">
              Select All
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={deselectAll} className="text-xs">
              Deselect All
            </Button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Assigned Routes: <span className="font-bold text-slate-900">{selectedRouteIds.length}</span> of {allRoutes.length} routes
          </div>

          {fetching ? (
            <p className="text-sm text-slate-500 py-6 text-center">Loading sales routes…</p>
          ) : filteredRoutes.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No matching sales routes found.</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 border rounded-xl p-2 bg-slate-50/50 border-slate-200">
              {filteredRoutes.map((route) => {
                const isSelected = selectedRouteIds.includes(route._id);
                return (
                  <div
                    key={route._id}
                    onClick={() => toggleRoute(route._id)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                        : "bg-white text-slate-900 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <CheckSquare className="size-5 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="size-5 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-sm">{route.route_name}</div>
                        <div className={`text-xs ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          Code: {route.route_code} · {route.distance_km ? `${route.distance_km} km` : "Custom Route"}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                        <Check className="size-3" /> Assigned
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={loading || fetching}>
            {loading ? "Saving Route Assignments…" : `Save (${selectedRouteIds.length}) Route Assignments`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
