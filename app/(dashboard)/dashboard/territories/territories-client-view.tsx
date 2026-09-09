"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Compass, MapPin, Globe2, Building2, Store as StoreIcon, Plus } from "lucide-react";
import { GlobalGeoFilter, GeoFilterState } from "@/components/global-geo-filter";
import { TerritoryForm } from "./territory-form";
import { RouteLeafletMap } from "@/components/route-leaflet-map";
import { matchesProvince } from "@/lib/data/citiesData";
import { BulkImportDialog } from "@/components/bulk-import-dialog";

interface TerritoryItem {
  _id: string;
  territory_name: string;
  territory_code: string;
  description?: string;
  province_region?: string;
  city?: string;
  country?: string;
  target_stores?: number;
  pincodes?: string[];
}

export function TerritoriesClientView({
  territories = [],
  routes = [],
  agents = [],
  stores = [],
}: {
  territories: TerritoryItem[];
  routes: any[];
  agents: any[];
  stores: any[];
}) {
  const [geoFilters, setGeoFilters] = useState<GeoFilterState>({
    region: "all",
    city: "all",
    territoryId: "all",
    distributorId: "all",
    search: "",
  });

  const filteredTerritories = territories.filter((t) => {
    if (geoFilters.search) {
      const q = geoFilters.search.toLowerCase();
      const matchName = t.territory_name?.toLowerCase().includes(q);
      const matchCode = t.territory_code?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchRegion = t.province_region?.toLowerCase().includes(q);
      const matchCity = t.city?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDesc && !matchRegion && !matchCity) return false;
    }

    if (geoFilters.region !== "all") {
      if (!matchesProvince(geoFilters.region, t.province_region, t.city)) return false;
    }

    if (geoFilters.city !== "all") {
      const c = t.city || "";
      if (!c.toLowerCase().includes(geoFilters.city.toLowerCase())) return false;
    }

    if (geoFilters.territoryId !== "all" && t._id !== geoFilters.territoryId) return false;
    return true;
  });

  return (
    <div className="space-y-6 w-full">
      <GlobalGeoFilter
        onFilterChange={setGeoFilters}
        territories={territories}
        placeholderSearch="Search territories by KPK, Punjab, Sindh, city, code or name…"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Configured Territories ({filteredTerritories.length})</CardTitle>
              <CardDescription>Territory bounds with province, city & target outlets mapping.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <BulkImportDialog entityType="territories" onImportSuccess={() => window.location.reload()} />
              <TerritoryForm
                trigger={
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs shadow-xs">
                    <Plus className="size-3.5" /> Add Territory
                  </Button>
                }
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredTerritories.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No territories match the selected filter.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Territory & Code</TableHead>
                    <TableHead>Province / Region</TableHead>
                    <TableHead>City Center</TableHead>
                    <TableHead>Target Outlets</TableHead>
                    <TableHead>Scope / Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTerritories.map((t) => (
                    <TableRow key={t._id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900">{t.territory_name}</div>
                          <Badge variant="outline" className="font-mono bg-slate-50 text-[10px]">
                            {t.territory_code}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200">
                          <Globe2 className="size-3 mr-1" />
                          {t.province_region || "KPK"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3 text-sky-600" />
                          <span>{t.city || "Peshawar"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">
                        {t.target_stores ? `${t.target_stores} Outlets` : "50 Outlets"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                        {t.description || `${t.city || "Peshawar"} market distribution zone`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Territory Stores Map View */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">Territory Outlet Density Map</CardTitle>
            <CardDescription className="text-xs">Plotted retail store touchpoints across active territorial boundaries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <RouteLeafletMap stores={stores} readOnly={true} height="340px" />
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-900">📊 Geographical Summary:</p>
              <p>Total {filteredTerritories.length} territories defined in active region.</p>
              <p>Total {stores.length} retail shopkeepers plotted on map.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
