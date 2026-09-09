"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Package, Layers, Eye, TrendingUp, AlertTriangle, CheckCircle2, ShieldCheck, Tag } from "lucide-react";
import { GlobalGeoFilter, GeoFilterState } from "@/components/global-geo-filter";
import { matchesProvince } from "@/lib/data/citiesData";
import { BulkImportDialog } from "@/components/bulk-import-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";

export interface ProductItem {
  _id: string;
  product_code: string;
  product_name: string;
  sku: string;
  barcode?: string;
  unit_of_measure: string;
  industry_domain?: string;
  distributor_id?: string | { _id: string; company_name: string; address?: { city?: string; province?: string } };
  pricing?: { mrp: number; base_cost: number; wholesale_price?: number; retail_price?: number; gst_rate?: number };
  inventory?: { current_stock: number; minimum_stock?: number; reorder_level?: number };
  packaging?: { quantity_per_case?: number; weight?: number };
  domain_attributes?: { batch_number?: string; expiry_date?: string; rx_required?: boolean; warranty_months?: number };
}

export function ProductsClientView({ products = [] }: { products: ProductItem[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [geoFilters, setGeoFilters] = useState<GeoFilterState>({
    region: "all",
    city: "all",
    domain: "all",
    territoryId: "all",
    distributorId: "all",
    search: "",
  });

  const filteredProducts = products.filter((p) => {
    if (geoFilters.search) {
      const q = geoFilters.search.toLowerCase();
      const matchName = p.product_name?.toLowerCase().includes(q);
      const matchCode = p.product_code?.toLowerCase().includes(q);
      const matchSku = p.sku?.toLowerCase().includes(q);
      const matchUom = p.unit_of_measure?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchSku && !matchUom) return false;
    }

    if (geoFilters.domain !== "all") {
      const pDomain = p.industry_domain?.toLowerCase() || "general";
      if (pDomain !== geoFilters.domain.toLowerCase()) return false;
    }

    if (geoFilters.region !== "all" && typeof p.distributor_id === "object" && p.distributor_id?.address) {
      if (!matchesProvince(geoFilters.region, p.distributor_id.address.province, p.distributor_id.address.city)) {
        return false;
      }
    }

    if (geoFilters.city !== "all" && typeof p.distributor_id === "object" && p.distributor_id?.address?.city) {
      if (!p.distributor_id.address.city.toLowerCase().includes(geoFilters.city.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // High-level KPI metrics (Shopify / QuickBooks Commerce style)
  const totalCatalogSKUs = products.length;
  const totalValuation = products.reduce((acc, p) => acc + (p.inventory?.current_stock || 0) * (p.pricing?.base_cost || 0), 0);
  const reorderCount = products.filter((p) => (p.inventory?.current_stock || 0) <= (p.inventory?.minimum_stock || 10)).length;

  return (
    <div className="space-y-6 w-full">
      {/* Odoo / Shopify Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="size-6 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight">Odoo & Shopify Grade Product Master Studio</h1>
          </div>
          <p className="text-sm text-slate-300">
            Multi-domain SKU Catalog · Cost vs. MRP Profit Margins · Automated Reorder Point Warnings & Barcode Metadata
          </p>
        </div>

        <div className="flex items-center gap-3">
          <BulkImportDialog entityType="products" onImportSuccess={() => window.location.reload()} />
          <Button asChild size="default" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 shadow-md cursor-pointer">
            <Link href="/dashboard/products/new">
              <Plus className="size-4 mr-1" /> Add Master SKU
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Financial Metric Cards (QuickBooks Commerce style) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Catalog SKUs</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Package className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{totalCatalogSKUs}</div>
            <p className="text-xs text-slate-500 mt-1">Active master products in warehouse catalog</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Catalog Valuation</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">Rs. {totalValuation.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Valued at base cost price</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reorder Point Warnings (ROP)</CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">{reorderCount} SKUs</div>
            <p className="text-xs text-slate-500 mt-1">Items at or below safety stock threshold</p>
          </CardContent>
        </Card>
      </div>

      <GlobalGeoFilter
        onFilterChange={(filters) => {
          setGeoFilters(filters);
          setCurrentPage(1);
        }}
        placeholderSearch="Search products by code, SKU, name, or UOM…"
      />

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg font-bold text-slate-900">Product Master Matrix ({filteredProducts.length} / {products.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Layers className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-900">No products match your filters</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-4">
                Try clearing your search query or selecting &ldquo;All Industry Domains&rdquo;.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/products/new">
                  <Plus className="size-4 mr-2" /> Add Product
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold">Code / SKU</TableHead>
                    <TableHead className="font-semibold">Product Name</TableHead>
                    <TableHead className="font-semibold">Domain</TableHead>
                    <TableHead className="font-semibold">Cost vs. MRP</TableHead>
                    <TableHead className="font-semibold">Profit Margin %</TableHead>
                    <TableHead className="font-semibold text-right">Stock Level</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((p) => {
                    const cost = p.pricing?.base_cost || 0;
                    const mrp = p.pricing?.mrp || 0;
                    const margin = mrp > 0 ? (((mrp - cost) / mrp) * 100).toFixed(1) : "0.0";
                    const isLow = (p.inventory?.current_stock || 0) <= (p.inventory?.minimum_stock || 10);

                    return (
                      <TableRow key={p._id} className="hover:bg-slate-50 transition-colors">
                        <TableCell>
                          <div className="font-mono text-xs font-bold text-emerald-700">{p.product_code}</div>
                          <div className="font-mono text-[11px] text-slate-500">{p.sku}</div>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          <span
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsDetailModalOpen(true);
                            }}
                            className="hover:text-emerald-600 hover:underline cursor-pointer"
                          >
                            {p.product_name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs font-normal border-emerald-200 bg-emerald-50 text-emerald-800">
                            {p.industry_domain?.replace("_", " ") || "general"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          <span className="text-slate-500">Cost: Rs.{cost.toLocaleString()}</span>
                          <div className="font-bold text-slate-900">MRP: Rs.{mrp.toLocaleString()}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-mono text-xs font-bold">
                            +{margin}% Margin
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${
                              (p.inventory?.current_stock ?? 0) > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}>
                              {p.inventory?.current_stock ?? 0} Units
                            </span>
                            {isLow && (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                                ROP Alert
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsDetailModalOpen(true);
                            }}
                            className="h-7 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 gap-1 cursor-pointer"
                          >
                            <Eye className="size-3 text-emerald-600" /> Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={filteredProducts.length}
                pageSize={pageSize}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Product Specification Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center justify-between text-lg font-bold text-slate-900">
              <span>{selectedProduct?.product_name}</span>
              <Badge variant="outline" className="font-mono bg-emerald-50 text-emerald-800 border-emerald-300">
                {selectedProduct?.product_code}
              </Badge>
            </DialogTitle>
            <DialogDescription>Odoo / Shopify Grade Master SKU Specification & Profit Breakdown</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4 py-2 text-sm font-mono">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Master SKU:</span> <span className="font-bold text-slate-900">{selectedProduct.sku}</span>
                </div>
                <div>
                  <span className="text-slate-500">Barcode:</span> <span className="font-bold text-slate-900">{selectedProduct.barcode || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500">Unit of Measure:</span> <span className="font-bold text-slate-900">{selectedProduct.unit_of_measure}</span>
                </div>
                <div>
                  <span className="text-slate-500">Industry Domain:</span> <span className="font-bold text-emerald-700 capitalize">{selectedProduct.industry_domain || "General"}</span>
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Pricing & Profit Margin Structure</p>
                <div className="flex justify-between text-slate-700">
                  <span>Base Cost Price:</span>
                  <span className="font-bold">Rs. {selectedProduct.pricing?.base_cost?.toLocaleString() ?? 0}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Wholesale Price:</span>
                  <span className="font-bold text-emerald-700">Rs. {selectedProduct.pricing?.wholesale_price?.toLocaleString() ?? 0}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Maximum Retail Price (MRP):</span>
                  <span className="font-extrabold text-slate-900">Rs. {selectedProduct.pricing?.mrp?.toLocaleString() ?? 0}</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 pt-1 text-slate-900 font-extrabold">
                  <span>Gross Profit Margin %:</span>
                  <span className="text-emerald-700">
                    +{selectedProduct.pricing?.mrp ? (((selectedProduct.pricing.mrp - (selectedProduct.pricing.base_cost || 0)) / selectedProduct.pricing.mrp) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-sky-50/60 border border-sky-100 text-xs">
                <div>
                  <span className="text-sky-900 font-semibold">Current Stock:</span> <span className="font-bold text-slate-900">{selectedProduct.inventory?.current_stock ?? 0} Units</span>
                </div>
                <div>
                  <span className="text-sky-900 font-semibold">Case Packaging:</span> <span className="font-bold text-slate-900">{selectedProduct.packaging?.quantity_per_case || 1} pcs/case</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              Close
            </Button>
            <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold">
              <Link href="/dashboard/inventory">Go to Stock Matrix</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
