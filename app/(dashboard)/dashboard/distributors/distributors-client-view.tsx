"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin } from "lucide-react";
import { GlobalGeoFilter, GeoFilterState } from "@/components/global-geo-filter";
import { matchesProvince } from "@/lib/data/citiesData";
import { BulkImportDialog } from "@/components/bulk-import-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { toast } from "sonner";
import { toastApiError } from "@/lib/utils";

export interface DistributorItem {
  _id: string;
  company_name: string;
  distributor_code: string;
  industry_domain?: string;
  operating_model?: string;
  gst_number: string;
  address?: { city?: string; province?: string };
  contact: { email: string; phone: string };
}

export function DistributorsClientView({
  initialDistributors = [],
  initialTotalRecords = 0,
}: {
  initialDistributors?: DistributorItem[];
  initialTotalRecords?: number;
}) {
  const [distributors, setDistributors] = useState<DistributorItem[]>(initialDistributors);
  const [totalRecords, setTotalRecords] = useState<number>(initialTotalRecords || initialDistributors.length);
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

  const fetchPage = async (page: number) => {
    try {
      const res = await fetch(`/api/distributors?page=${page}&limit=${pageSize}`);
      const data = await res.json();
      if (res.ok) {
        setDistributors(data.data || []);
        if (typeof data.total === "number") setTotalRecords(data.total);
      } else {
        toastApiError(toast, data, "Failed to load distributors");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch distributors");
    }
  };

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    fetchPage(p);
  };

  const filteredDistributors = distributors.filter((d) => {
    // 1. Search filter
    if (geoFilters.search) {
      const q = geoFilters.search.toLowerCase();
      const matchName = d.company_name?.toLowerCase().includes(q);
      const matchCode = d.distributor_code?.toLowerCase().includes(q);
      const matchGst = d.gst_number?.toLowerCase().includes(q);
      const matchCity = d.address?.city?.toLowerCase().includes(q);
      const matchEmail = d.contact?.email?.toLowerCase().includes(q);
      const matchPhone = d.contact?.phone?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchGst && !matchCity && !matchEmail && !matchPhone) {
        return false;
      }
    }

    // 2. Region / Province filter
    if (geoFilters.region !== "all") {
      if (!matchesProvince(geoFilters.region, d.address?.province, d.address?.city)) {
        return false;
      }
    }

    // 3. City filter
    if (geoFilters.city !== "all") {
      const dCity = d.address?.city?.toLowerCase() || "";
      if (!dCity.includes(geoFilters.city.toLowerCase())) {
        return false;
      }
    }

    // 4. Industry Domain filter
    if (geoFilters.domain !== "all") {
      const dDomain = d.industry_domain?.toLowerCase() || "general";
      if (dDomain !== geoFilters.domain.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  return (
    <div className="space-y-6 w-full">
      <GlobalGeoFilter
        onFilterChange={(filters) => setGeoFilters(filters)}
        placeholderSearch="Search distributors by name, code, GST, phone or city…"
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">Distributor Entities ({totalRecords})</CardTitle>
            <CardDescription>Multi-tenant organization network of wholesale and distribution partners.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <BulkImportDialog entityType="distributors" onImportSuccess={() => fetchPage(currentPage)} />
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-xs cursor-pointer">
              <Link href="/dashboard/distributors/new">
                <Plus className="size-4" /> Add Distributor
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {filteredDistributors.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No distributors match your filter criteria.</div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Company Name</TableHead>
                    <TableHead className="font-semibold">Domain & Model</TableHead>
                    <TableHead className="font-semibold">City / Location</TableHead>
                    <TableHead className="font-semibold">GST / NTN</TableHead>
                    <TableHead className="font-semibold">Contact Info</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDistributors.map((d) => (
                    <TableRow key={d._id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {d.distributor_code}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {d.company_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant="outline" className="capitalize text-xs font-normal border-primary/20 bg-primary/5 text-primary">
                            {d.industry_domain?.replace("_", " ") || "general"}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground capitalize font-medium">
                            {d.operating_model?.replace("_", " ") || "distributor"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {d.address?.city || d.address?.province ? (
                          <div className="flex items-center gap-1 text-sm text-foreground">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{d.address?.city ?? "N/A"}{d.address?.province ? `, ${d.address.province}` : ""}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {d.gst_number}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">{d.contact?.phone}</div>
                        <div className="text-muted-foreground">{d.contact?.email}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalRecords={totalRecords}
                pageSize={pageSize}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
