"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, Compass, Store as StoreIcon, Users } from "lucide-react";
import { GlobalGeoFilter, GeoFilterState } from "@/components/global-geo-filter";
import { RouteLeafletMap } from "@/components/route-leaflet-map";
import { DeleteRouteButton } from "../territories/delete-route-button";
import { matchesProvince } from "@/lib/data/citiesData";
import { BulkImportDialog } from "@/components/bulk-import-dialog";

interface RouteItem {
  _id: string;
  route_name: string;
  route_code: string;
  description?: string;
  distance_km?: number;
  start_point: { name?: string; latitude: number; longitude: number };
  end_point: { name?: string; latitude: number; longitude: number };
  waypoints?: Array<{ name?: string; latitude: number; longitude: number }>;
  territory_id?: { _id?: string; territory_name: string; territory_code: string; region?: string; city?: string };
  assigned_agent_ids?: Array<{ _id: string; first_name: string; last_name: string; agent_code: string }>;
  assigned_store_ids?: Array<{ store_name: string }>;
}

export function RoutesClientView({
  routes = [],
  territories = [],
  agents = [],
  stores = [],
}: {
  routes: RouteItem[];
  territories: any[];
  agents: any[];
  stores: any[];
}) {
  const [geoFilters, setGeoFilters] = useState<GeoFilterState>({
    region: "all",
    city: "all",
    domain: "all",
    territoryId: "all",
    distributorId: "all",
    search: "",
  });

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(routes[0]?._id || null);

  const filteredRoutes = routes.filter((r) => {
    // 1. Search
    if (geoFilters.search) {
      const q = geoFilters.search.toLowerCase();
      const matchName = r.route_name?.toLowerCase().includes(q);
      const matchCode = r.route_code?.toLowerCase().includes(q);
      const matchDesc = r.description?.toLowerCase().includes(q);
      const matchTerr = r.territory_id?.territory_name?.toLowerCase().includes(q);
      const matchStart = r.start_point?.name?.toLowerCase().includes(q);
      const matchEnd = r.end_point?.name?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDesc && !matchTerr && !matchStart && !matchEnd) return false;
    }

    // 2. Region / Province
    if (geoFilters.region !== "all" && r.territory_id) {
      if (!matchesProvince(geoFilters.region, r.territory_id.region, r.territory_id.city || r.start_point?.name)) {
        return false;
      }
    }

    // 3. City
    if (geoFilters.city !== "all") {
      const startName = r.start_point?.name?.toLowerCase() || "";
      const terrCity = r.territory_id?.city?.toLowerCase() || "";
      if (!startName.includes(geoFilters.city.toLowerCase()) && !terrCity.includes(geoFilters.city.toLowerCase())) {
        return false;
      }
    }

    // 4. Territory ID
    if (geoFilters.territoryId !== "all") {
      const tId = (r.territory_id as any)?._id || (r.territory_id as any);
      if (tId !== geoFilters.territoryId) return false;
    }

    return true;
  });

  const selectedRoute = routes.find((r) => r._id === selectedRouteId) || filteredRoutes[0] || null;

  return (
    <div className="space-y-6 w-full">
      <GlobalGeoFilter
        onFilterChange={setGeoFilters}
        territories={territories}
        placeholderSearch="Search routes by code, route name, start/end area…"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Routes Table */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Active Sales Routes ({filteredRoutes.length})</CardTitle>
                <CardDescription>Click any route row to visualize start/end points and waypoints on Leaflet Map.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <BulkImportDialog entityType="routes" onImportSuccess={() => window.location.reload()} />
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300">
                  {filteredRoutes.length} Matching
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredRoutes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No sales routes matching your geographic filters.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Route Details</TableHead>
                    <TableHead>Territory</TableHead>
                    <TableHead>Assigned Agent</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoutes.map((r) => {
                    const isSelected = r._id === selectedRoute?._id;
                    return (
                      <TableRow
                        key={r._id}
                        onClick={() => setSelectedRouteId(r._id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-emerald-50/80 font-medium" : "hover:bg-slate-50"
                        }`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Navigation className="size-4 text-emerald-600 shrink-0" />
                            <div>
                              <div className="font-semibold text-slate-900">{r.route_name}</div>
                              <div className="text-xs font-mono text-slate-500">{r.route_code}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {r.territory_id?.territory_name || "General Territory"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {r.assigned_agent_ids && r.assigned_agent_ids.length > 0 ? (
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                              <Users className="size-3" />
                              {r.assigned_agent_ids.map((a) => `${a.first_name} ${a.last_name}`).join(", ")}
                            </span>
                          ) : (
                            <span className="text-slate-400">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-900">
                          {r.distance_km ? `${r.distance_km} km` : "N/A"}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DeleteRouteButton routeId={r._id} routeName={r.route_name} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Leaflet Map */}
        <Card className="border-slate-200 shadow-sm flex flex-col min-h-[420px]">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <Compass className="size-5 text-emerald-600" />
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  {selectedRoute ? selectedRoute.route_name : "Live Route Map"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedRoute ? `Code: ${selectedRoute.route_code}` : "Select a route to view details"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 relative min-h-[350px]">
            {selectedRoute ? (
              <RouteLeafletMap
                startPoint={selectedRoute.start_point}
                endPoint={selectedRoute.end_point}
                waypoints={selectedRoute.waypoints}
                routeName={selectedRoute.route_name}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                <MapPin className="size-10 mb-2 opacity-40" />
                <p className="text-sm">Select a route from the list to display interactive GPS path.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
