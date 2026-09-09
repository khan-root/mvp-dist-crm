"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { AssignAgentDropdown } from "@/components/assign-agent-dropdown";
import { GlobalGeoFilter, GeoFilterState } from "@/components/global-geo-filter";
import { matchesProvince } from "@/lib/data/citiesData";
import { BulkImportDialog } from "@/components/bulk-import-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface StoreItem {
  _id: string;
  store_code: string;
  store_name: string;
  store_type?: string;
  owner_info?: { name?: string; phone?: string };
  address?: { city?: string; state?: string; province?: string; line1?: string };
  assigned_agent_id?: { _id: string; agent_code: string; first_name: string; last_name: string } | null;
}

export function StoresClientView({
  stores = [],
  agents = [],
  territories = [],
}: {
  stores: StoreItem[];
  agents: any[];
  territories?: any[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [geoFilters, setGeoFilters] = useState<GeoFilterState>({
    region: "all",
    city: "all",
    domain: "all",
    territoryId: "all",
    distributorId: "all",
    search: "",
  });

  const filteredStores = stores.filter((s) => {
    // 1. Search
    if (geoFilters.search) {
      const q = geoFilters.search.toLowerCase();
      const matchName = s.store_name?.toLowerCase().includes(q);
      const matchCode = s.store_code?.toLowerCase().includes(q);
      const matchOwner = s.owner_info?.name?.toLowerCase().includes(q);
      const matchCity = s.address?.city?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchOwner && !matchCity) return false;
    }

    // 2. Region / Province
    if (geoFilters.region !== "all") {
      if (!matchesProvince(geoFilters.region, s.address?.province || s.address?.state, s.address?.city)) {
        return false;
      }
    }

    // 3. City
    if (geoFilters.city !== "all") {
      const sCity = s.address?.city?.toLowerCase() || "";
      if (!sCity.includes(geoFilters.city.toLowerCase())) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredStores.length / pageSize) || 1;
  const paginatedStores = filteredStores.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 w-full">
      <GlobalGeoFilter
        onFilterChange={(filters) => {
          setGeoFilters(filters);
          setCurrentPage(1);
        }}
        territories={territories}
        placeholderSearch="Search stores by shop name, code, owner or city…"
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">Retail Outlets & Stores ({filteredStores.length})</CardTitle>
            <CardDescription>Assign field agents for order booking and delivery routes.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <BulkImportDialog entityType="stores" onImportSuccess={() => window.location.reload()} />
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs cursor-pointer">
              <Link href="/dashboard/stores/new">
                <Plus className="size-4" /> Add Store
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {filteredStores.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No stores matching your geographic filters.</div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Store Name</TableHead>
                    <TableHead className="font-semibold">Category / Type</TableHead>
                    <TableHead className="font-semibold">Assigned Agent</TableHead>
                    <TableHead className="font-semibold">Owner Info</TableHead>
                    <TableHead className="font-semibold">Location / City</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStores.map((s) => (
                    <TableRow key={s._id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-emerald-700">{s.store_code}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{s.store_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs bg-slate-50 border-slate-200">
                          {s.store_type || "Kirana"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <AssignAgentDropdown
                          storeId={s._id}
                          currentAgentId={s.assigned_agent_id?._id ?? null}
                          agents={agents}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-medium">
                        👤 {s.owner_info?.name || "Shopkeeper"} {s.owner_info?.phone ? `(📞 ${s.owner_info.phone})` : ""}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        📍 {[s.address?.line1, s.address?.city].filter(Boolean).join(", ") || "Market Outlet"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={filteredStores.length}
                pageSize={pageSize}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
