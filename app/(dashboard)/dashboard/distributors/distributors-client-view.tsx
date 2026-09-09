"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MapPin, Globe } from "lucide-react";
import { GlobalGeoFilter, GeoFilterState } from "@/components/global-geo-filter";
import { matchesProvince } from "@/lib/data/citiesData";
import { BulkImportDialog } from "@/components/bulk-import-dialog";

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

export function DistributorsClientView({ distributors = [] }: { distributors: DistributorItem[] }) {
  const [geoFilters, setGeoFilters] = useState<GeoFilterState>({
    region: "all",
    city: "all",
    domain: "all",
    territoryId: "all",
    distributorId: "all",
    search: "",
  });

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

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Distribution Network & Hubs</h1>
          <CardDescription>Filter primary distributors, super stockists, and C&F agents by Province, City, and Vertical</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <BulkImportDialog entityType="distributors" onImportSuccess={() => window.location.reload()} />
          <Button asChild size="default" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-xs">
            <Link href="/dashboard/distributors/new">
              <Plus className="size-4 mr-1.5" />
              Add Distributor Hub
            </Link>
          </Button>
        </div>
      </div>

      <GlobalGeoFilter
        onFilterChange={setGeoFilters}
        placeholderSearch="Search distributors by name, hub code, GST, city, or phone…"
      />

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Distributor Network ({filteredDistributors.length} / {distributors.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {filteredDistributors.length === 0 ? (
            <div className="py-12 text-center">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-lg font-medium text-foreground">No distributors match your filters</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1 mb-4">
                Try selecting &ldquo;All Provinces &amp; Regions&rdquo; or resetting your filter criteria.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Hub Code</TableHead>
                  <TableHead className="font-semibold">Company Name</TableHead>
                  <TableHead className="font-semibold">Domain / Model</TableHead>
                  <TableHead className="font-semibold">Location / Region</TableHead>
                  <TableHead className="font-semibold">GST / Reg #</TableHead>
                  <TableHead className="font-semibold">Contact Info</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDistributors.map((d) => (
                  <TableRow key={d._id} className="hover:bg-muted/40 transition-colors">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
