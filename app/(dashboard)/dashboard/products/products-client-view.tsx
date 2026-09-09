"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Layers } from "lucide-react";
import { GlobalGeoFilter, GeoFilterState } from "@/components/global-geo-filter";
import { matchesProvince } from "@/lib/data/citiesData";
import { BulkImportDialog } from "@/components/bulk-import-dialog";

export interface ProductItem {
  _id: string;
  product_code: string;
  product_name: string;
  sku: string;
  unit_of_measure: string;
  industry_domain?: string;
  distributor_id?: string | { _id: string; company_name: string; address?: { city?: string; province?: string } };
  pricing?: { mrp: number; base_cost: number; wholesale_price?: number };
  inventory?: { current_stock: number };
}

export function ProductsClientView({ products = [] }: { products: ProductItem[] }) {
  const [geoFilters, setGeoFilters] = useState<GeoFilterState>({
    region: "all",
    city: "all",
    domain: "all",
    territoryId: "all",
    distributorId: "all",
    search: "",
  });

  const filteredProducts = products.filter((p) => {
    // 1. Search query
    if (geoFilters.search) {
      const q = geoFilters.search.toLowerCase();
      const matchName = p.product_name?.toLowerCase().includes(q);
      const matchCode = p.product_code?.toLowerCase().includes(q);
      const matchSku = p.sku?.toLowerCase().includes(q);
      const matchUom = p.unit_of_measure?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchSku && !matchUom) return false;
    }

    // 2. Industry Domain filter
    if (geoFilters.domain !== "all") {
      const pDomain = p.industry_domain?.toLowerCase() || "general";
      if (pDomain !== geoFilters.domain.toLowerCase()) return false;
    }

    // 3. Province / Region filter (via distributor address if available)
    if (geoFilters.region !== "all" && typeof p.distributor_id === "object" && p.distributor_id?.address) {
      if (!matchesProvince(geoFilters.region, p.distributor_id.address.province, p.distributor_id.address.city)) {
        return false;
      }
    }

    // 4. City filter
    if (geoFilters.city !== "all" && typeof p.distributor_id === "object" && p.distributor_id?.address?.city) {
      if (!p.distributor_id.address.city.toLowerCase().includes(geoFilters.city.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Universal Product Catalog</h1>
          <CardDescription>Multi-domain inventory and product matrix filtered by Domain, Region, and Specs</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <BulkImportDialog entityType="products" onImportSuccess={() => window.location.reload()} />
          <Button asChild size="default" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-xs">
            <Link href="/dashboard/products/new">
              <Plus className="size-4 mr-1.5" />
              Add New Product
            </Link>
          </Button>
        </div>
      </div>

      <GlobalGeoFilter
        onFilterChange={setGeoFilters}
        placeholderSearch="Search products by code, SKU, name, or UOM…"
      />

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle>Catalog Products ({filteredProducts.length} / {products.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Layers className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-lg font-medium text-foreground">No products match your filters</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1 mb-4">
                Try clearing your search query or selecting &ldquo;All Industry Domains&rdquo;.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/products/new">
                  <Plus className="size-4 mr-2" /> Add Product
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Code / SKU</TableHead>
                  <TableHead className="font-semibold">Product Name</TableHead>
                  <TableHead className="font-semibold">Domain</TableHead>
                  <TableHead className="font-semibold">UOM</TableHead>
                  <TableHead className="font-semibold text-right">MRP (Rs.)</TableHead>
                  <TableHead className="font-semibold text-right">Current Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p) => (
                  <TableRow key={p._id} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="font-mono text-xs font-semibold text-primary">{p.product_code}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{p.sku}</div>
                    </TableCell>
                    <TableCell className="font-medium">{p.product_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs font-normal border-primary/20 bg-primary/5 text-primary">
                        {p.industry_domain?.replace("_", " ") || "general"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.unit_of_measure}</TableCell>
                    <TableCell className="text-right font-medium">Rs. {p.pricing?.mrp?.toLocaleString() ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        (p.inventory?.current_stock ?? 0) > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}>
                        {p.inventory?.current_stock ?? 0}
                      </span>
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
