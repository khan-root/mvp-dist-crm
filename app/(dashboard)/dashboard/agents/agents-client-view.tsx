"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ArrowRight } from "lucide-react";
import { GlobalGeoFilter, GeoFilterState } from "@/components/global-geo-filter";
import { matchesProvince } from "@/lib/data/citiesData";
import { BulkImportDialog } from "@/components/bulk-import-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface AgentItem {
  _id: string;
  agent_code: string;
  first_name: string;
  last_name: string;
  personal_info?: { email: string; phone: string };
  address?: { city?: string; state?: string; province?: string };
}

export function AgentsClientView({ agents = [] }: { agents: AgentItem[] }) {
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

  const filteredAgents = agents.filter((a) => {
    // 1. Search
    if (geoFilters.search) {
      const q = geoFilters.search.toLowerCase();
      const matchName = `${a.first_name} ${a.last_name}`.toLowerCase().includes(q);
      const matchCode = a.agent_code?.toLowerCase().includes(q);
      const matchPhone = a.personal_info?.phone?.toLowerCase().includes(q);
      const matchEmail = a.personal_info?.email?.toLowerCase().includes(q);
      const matchCity = a.address?.city?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchPhone && !matchEmail && !matchCity) return false;
    }

    // 2. Region / Province
    if (geoFilters.region !== "all" && a.address) {
      if (!matchesProvince(geoFilters.region, a.address.province || a.address.state, a.address.city)) {
        return false;
      }
    }

    // 3. City
    if (geoFilters.city !== "all" && a.address?.city) {
      if (!a.address.city.toLowerCase().includes(geoFilters.city.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const totalPages = Math.ceil(filteredAgents.length / pageSize) || 1;
  const paginatedAgents = filteredAgents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 w-full">
      <GlobalGeoFilter
        onFilterChange={(filters) => {
          setGeoFilters(filters);
          setCurrentPage(1);
        }}
        placeholderSearch="Search agents by agent code, name, phone or email…"
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">Field Agents & Sales Fleet ({filteredAgents.length})</CardTitle>
            <CardDescription>Field booking representatives operating across assigned distributor territories.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <BulkImportDialog entityType="agents" onImportSuccess={() => window.location.reload()} />
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-xs cursor-pointer">
              <Link href="/dashboard/agents/new">
                <Plus className="size-4" /> Add Agent
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {filteredAgents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No agents match your filter criteria.</div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold">Agent Code</TableHead>
                    <TableHead className="font-semibold">Agent Name</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Phone Number</TableHead>
                    <TableHead className="text-right font-semibold">Profile</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAgents.map((a) => (
                    <TableRow key={a._id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-emerald-700">{a.agent_code}</TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        <Link href={`/dashboard/agents/${a._id}`} className="hover:text-emerald-600 hover:underline cursor-pointer">
                          {[a.first_name, a.last_name].filter(Boolean).join(" ")}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{a.personal_info?.email || "N/A"}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">{a.personal_info?.phone || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-emerald-600 hover:text-emerald-700 gap-1 cursor-pointer">
                          <Link href={`/dashboard/agents/${a._id}`}>
                            View <ArrowRight className="size-3" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={filteredAgents.length}
                pageSize={pageSize}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
