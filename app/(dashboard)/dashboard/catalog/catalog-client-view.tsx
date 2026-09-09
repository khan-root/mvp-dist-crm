"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CategoryForm } from "./category-form";
import { BrandForm } from "./brand-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Tags, Award, Layers, Trash2, Edit } from "lucide-react";
import { GlobalGeoFilter, GeoFilterState } from "@/components/global-geo-filter";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { toast } from "sonner";

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
  categories: initialCategories = [],
  brands: initialBrands = [],
  distributors = [],
}: {
  categories: CategoryItem[];
  brands: BrandItem[];
  distributors: DistributorItem[];
}) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [brands, setBrands] = useState<BrandItem[]>(initialBrands);

  const [catPage, setCatPage] = useState(1);
  const [brandPage, setBrandPage] = useState(1);
  const pageSize = 10;

  // Edit Category State
  const [editCat, setEditCat] = useState<CategoryItem | null>(null);
  const [isEditCatModalOpen, setIsEditCatModalOpen] = useState(false);

  // Edit Brand State
  const [editBrand, setEditBrand] = useState<BrandItem | null>(null);
  const [isEditBrandModalOpen, setIsEditBrandModalOpen] = useState(false);

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
    if (geoFilters.domain && geoFilters.domain !== "all") {
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
    if (geoFilters.domain && geoFilters.domain !== "all") {
      const bDomain = b.industry_domain?.toLowerCase() || "general";
      if (bDomain !== geoFilters.domain.toLowerCase()) return false;
    }
    if (geoFilters.distributorId !== "all" && b.distributor_id !== geoFilters.distributorId) {
      return false;
    }
    return true;
  });

  const handleUpdateCategory = async () => {
    if (!editCat) return;
    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editCat),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Category updated successfully");
        setCategories((prev) => prev.map((c) => (c._id === editCat._id ? { ...c, ...editCat } : c)));
        setIsEditCatModalOpen(false);
      } else {
        toast.error(data.error || "Failed to update category");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Category deleted");
        setCategories((prev) => prev.filter((c) => c._id !== id));
      } else {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateBrand = async () => {
    if (!editBrand) return;
    try {
      const res = await fetch("/api/brands", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editBrand),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Brand updated successfully");
        setBrands((prev) => prev.map((b) => (b._id === editBrand._id ? { ...b, ...editBrand } : b)));
        setIsEditBrandModalOpen(false);
      } else {
        toast.error(data.error || "Failed to update brand");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;
    try {
      const res = await fetch(`/api/brands?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Brand deleted");
        setBrands((prev) => prev.filter((b) => b._id !== id));
      } else {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const catTotalPages = Math.ceil(filteredCategories.length / pageSize) || 1;
  const paginatedCategories = filteredCategories.slice((catPage - 1) * pageSize, catPage * pageSize);

  const brandTotalPages = Math.ceil(filteredBrands.length / pageSize) || 1;
  const paginatedBrands = filteredBrands.slice((brandPage - 1) * pageSize, brandPage * pageSize);

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Universal Catalog & Master Data Studio</h1>
        <CardDescription>Full lifecycle management for domain-specific categories, tax presets, margins, and brand compliance</CardDescription>
      </div>

      <GlobalGeoFilter
        onFilterChange={(filters) => {
          setGeoFilters(filters);
          setCatPage(1);
          setBrandPage(1);
        }}
        distributors={distributors.map((d) => ({ _id: d._id, company_name: d.company_name, distributor_code: d._id }))}
        placeholderSearch="Filter catalog by category name, brand code, or owner…"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* CATEGORIES CARD */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-emerald-600" />
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Categories ({filteredCategories.length} / {categories.length})</CardTitle>
                <CardDescription>Domain categories & tax presets</CardDescription>
              </div>
            </div>
            <CategoryForm
              distributors={distributors}
              trigger={
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer">
                  <Plus className="size-4 mr-1" /> Add Category
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {filteredCategories.length === 0 ? (
              <div className="py-8 text-center">
                <Layers className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm">No categories match your filters.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold">Code</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Domain</TableHead>
                      <TableHead className="font-semibold">GST / Margin</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCategories.map((c) => (
                      <TableRow key={c._id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-emerald-700">
                          {c.category_code}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">{c.category_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs font-normal border-emerald-200 bg-emerald-50 text-emerald-800">
                            {c.industry_domain?.replace("_", " ") || "general"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          <span className="font-semibold text-slate-900">{c.default_gst_rate ?? 18}% GST</span>
                          {c.default_margin_percentage && (
                            <span className="text-slate-500 ml-1.5">({c.default_margin_percentage}% margin)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditCat(c);
                                setIsEditCatModalOpen(true);
                              }}
                              className="h-7 w-7 p-0 text-slate-600 hover:text-emerald-600 cursor-pointer"
                            >
                              <Edit className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(c._id)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <PaginationControls
                  currentPage={catPage}
                  totalPages={catTotalPages}
                  onPageChange={(p) => setCatPage(p)}
                  totalItems={filteredCategories.length}
                  pageSize={pageSize}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* BRANDS CARD */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Brands ({filteredBrands.length} / {brands.length})</CardTitle>
                <CardDescription>Brand owners, origin & compliance</CardDescription>
              </div>
            </div>
            <BrandForm
              distributors={distributors}
              trigger={
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer">
                  <Plus className="size-4 mr-1" /> Add Brand
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {filteredBrands.length === 0 ? (
              <div className="py-8 text-center">
                <Award className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm">No brands match your filters.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold">Code</TableHead>
                      <TableHead className="font-semibold">Brand / Owner</TableHead>
                      <TableHead className="font-semibold">Domain</TableHead>
                      <TableHead className="font-semibold">Origin</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBrands.map((b) => (
                      <TableRow key={b._id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-emerald-700">
                          {b.brand_code}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-900">{b.brand_name}</div>
                          {b.principal_owner && (
                            <div className="text-[11px] text-slate-500">{b.principal_owner}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs font-normal border-emerald-200 bg-emerald-50 text-emerald-800">
                            {b.industry_domain?.replace("_", " ") || "general"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-700">
                          {b.brand_details?.country_of_origin ?? "Pakistan"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditBrand(b);
                                setIsEditBrandModalOpen(true);
                              }}
                              className="h-7 w-7 p-0 text-slate-600 hover:text-emerald-600 cursor-pointer"
                            >
                              <Edit className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBrand(b._id)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <PaginationControls
                  currentPage={brandPage}
                  totalPages={brandTotalPages}
                  onPageChange={(p) => setBrandPage(p)}
                  totalItems={filteredBrands.length}
                  pageSize={pageSize}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Category Modal */}
      <Dialog open={isEditCatModalOpen} onOpenChange={setIsEditCatModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Edit Category Details</DialogTitle>
            <DialogDescription>Update tax rates and trade margin presets</DialogDescription>
          </DialogHeader>

          {editCat && (
            <div className="space-y-4 py-2 text-sm">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Category Name</Label>
                <Input
                  value={editCat.category_name}
                  onChange={(e) => setEditCat({ ...editCat, category_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Default GST Rate (%)</Label>
                  <Input
                    type="number"
                    value={editCat.default_gst_rate ?? 18}
                    onChange={(e) => setEditCat({ ...editCat, default_gst_rate: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Default Trade Margin (%)</Label>
                  <Input
                    type="number"
                    value={editCat.default_margin_percentage ?? 10}
                    onChange={(e) => setEditCat({ ...editCat, default_margin_percentage: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setIsEditCatModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} className="bg-emerald-600 text-white font-bold cursor-pointer">
              Save Category Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Brand Modal */}
      <Dialog open={isEditBrandModalOpen} onOpenChange={setIsEditBrandModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Edit Brand Profile</DialogTitle>
            <DialogDescription>Update principal owner and country of origin details</DialogDescription>
          </DialogHeader>

          {editBrand && (
            <div className="space-y-4 py-2 text-sm">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Brand Name</Label>
                <Input
                  value={editBrand.brand_name}
                  onChange={(e) => setEditBrand({ ...editBrand, brand_name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Principal Owner / Manufacturer</Label>
                <Input
                  value={editBrand.principal_owner || ""}
                  onChange={(e) => setEditBrand({ ...editBrand, principal_owner: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setIsEditBrandModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBrand} className="bg-emerald-600 text-white font-bold cursor-pointer">
              Save Brand Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
