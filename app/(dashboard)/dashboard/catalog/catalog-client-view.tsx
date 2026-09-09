"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CategoryForm } from "./category-form";
import { BrandForm } from "./brand-form";
import { Button } from "@/components/ui/button";
import { Plus, Tags, Award, Layers } from "lucide-react";
import { GlobalGeoFilter, GeoFilterState } from "@/components/global-geo-filter";

interface CategoryItem {
  _id: string;
  category_name: string;
  category_code: string;
  distributor_id: string;
  industry_domain?: string;
  default_gst_rate?: number;
  default_margin_percentage?: number;
}

interface BrandItem {
  _id: string;
  brand_name: string;
  brand_code: string;
  distributor_id: string;
  industry_domain?: string;
  principal_owner?: string;
  brand_details?: { country_of_origin?: string; certifications?: string[] };
}

interface DistributorItem {
  _id: string;
  company_name: string;
}

export function CatalogClientView({
  categories = [],
  brands = [],
  distributors = [],
}: {
  categories: CategoryItem[];
  brands: BrandItem[];
  distributors: DistributorItem[];
}) {
  const [geoFilters, setGeoFilters] = useState<GeoFilterState>({
    region: "all",
    city: "all",
    domain: "all",
    territoryId: "all",
    distributorId: "all",
    search: "",
  });

  const distMap = Object.fromEntries(distributors.map((d) => [d._id, d.company_name]));

  // Filter Categories
  const filteredCategories = categories.filter((c) => {
    if (geoFilters.search) {
      const q = geoFilters.search.toLowerCase();
      const matchName = c.category_name?.toLowerCase().includes(q);
      const matchCode = c.category_code?.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    if (geoFilters.domain !== "all") {
      const cDomain = c.industry_domain?.toLowerCase() || "general";
      if (cDomain !== geoFilters.domain.toLowerCase()) return false;
    }
    if (geoFilters.distributorId !== "all" && c.distributor_id !== geoFilters.distributorId) {
      return false;
    }
    return true;
  });

  // Filter Brands
  const filteredBrands = brands.filter((b) => {
    if (geoFilters.search) {
      const q = geoFilters.search.toLowerCase();
      const matchName = b.brand_name?.toLowerCase().includes(q);
      const matchCode = b.brand_code?.toLowerCase().includes(q);
      const matchOwner = b.principal_owner?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchOwner) return false;
    }
    if (geoFilters.domain !== "all") {
      const bDomain = b.industry_domain?.toLowerCase() || "general";
      if (bDomain !== geoFilters.domain.toLowerCase()) return false;
    }
    if (geoFilters.distributorId !== "all" && b.distributor_id !== geoFilters.distributorId) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Universal Catalog Matrix</h1>
        <CardDescription>Configure domain-specific categories, tax rates, trade margins, and brand compliance</CardDescription>
      </div>

      <GlobalGeoFilter
        onFilterChange={setGeoFilters}
        distributors={distributors.map(d => ({ _id: d._id, company_name: d.company_name, distributor_code: d._id }))}
        placeholderSearch="Filter catalog by category name, brand code, or owner…"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* CATEGORIES CARD */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Categories ({filteredCategories.length} / {categories.length})</CardTitle>
                <CardDescription>Domain categories & tax presets</CardDescription>
              </div>
            </div>
            <CategoryForm
              distributors={distributors}
              trigger={
                <Button size="sm" className="shadow-sm">
                  <Plus className="size-4 mr-1" /> Add Category
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="pt-4">
            {filteredCategories.length === 0 ? (
              <div className="py-8 text-center">
                <Layers className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-muted-foreground text-sm">No categories match your filters.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Domain</TableHead>
                    <TableHead className="font-semibold">GST / Margin</TableHead>
                    <TableHead className="font-semibold">Hub</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((c) => (
                    <TableRow key={c._id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {c.category_code}
                      </TableCell>
                      <TableCell className="font-medium">{c.category_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs font-normal border-primary/20 bg-primary/5 text-primary">
                          {c.industry_domain?.replace("_", " ") || "general"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium text-foreground">{c.default_gst_rate ?? 18}% GST</span>
                        {c.default_margin_percentage && (
                          <span className="text-muted-foreground ml-1.5">({c.default_margin_percentage}% margin)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {distMap[c.distributor_id] ?? c.distributor_id}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* BRANDS CARD */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Brands ({filteredBrands.length} / {brands.length})</CardTitle>
                <CardDescription>Brand owners, origin & compliance</CardDescription>
              </div>
            </div>
            <BrandForm
              distributors={distributors}
              trigger={
                <Button size="sm" className="shadow-sm">
                  <Plus className="size-4 mr-1" /> Add Brand
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="pt-4">
            {filteredBrands.length === 0 ? (
              <div className="py-8 text-center">
                <Award className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-muted-foreground text-sm">No brands match your filters.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Brand / Owner</TableHead>
                    <TableHead className="font-semibold">Domain</TableHead>
                    <TableHead className="font-semibold">Origin</TableHead>
                    <TableHead className="font-semibold">Hub</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBrands.map((b) => (
                    <TableRow key={b._id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {b.brand_code}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{b.brand_name}</div>
                        {b.principal_owner && (
                          <div className="text-[11px] text-muted-foreground">{b.principal_owner}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs font-normal border-primary/20 bg-primary/5 text-primary">
                          {b.industry_domain?.replace("_", " ") || "general"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {b.brand_details?.country_of_origin ?? "Pakistan"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {distMap[b.distributor_id] ?? b.distributor_id}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
