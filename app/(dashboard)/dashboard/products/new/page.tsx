"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toastApiError } from "@/lib/utils";
import { BulkImportDialog } from "@/components/bulk-import-dialog";
import {
  Package,
  ArrowLeft,
  Building2,
  Tag,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Boxes,
  Barcode,
  DollarSign,
  Calendar,
  Wrench,
  Shirt,
  Cpu,
  Pill,
  ShoppingBag,
  Loader2,
  Sprout,
} from "lucide-react";

const DOMAIN_OPTIONS = [
  { id: "agriculture", label: "Agriculture & Fertilizers", icon: Sprout, desc: "Fertilizers, Agro-Chemicals, Pesticides, Seeds & Bulk Crops" },
  { id: "general", label: "General Retail / Wholesale", icon: Package, desc: "Universal products, general merchandise, items" },
  { id: "fmcg", label: "FMCG & Grocery", icon: ShoppingBag, desc: "Fast-moving packaged goods, groceries, batch & expiry" },
  { id: "pharma", label: "Pharmaceuticals & Healthcare", icon: Pill, desc: "Medicines, Rx drugs, medical supplies" },
  { id: "electronics", label: "Electronics & Appliances", icon: Cpu, desc: "Gadgets, appliances, warranty & serial/IMEI" },
  { id: "construction", label: "Hardware & Construction", icon: Wrench, desc: "Building materials, tools, dimensions & materials" },
  { id: "apparel", label: "Apparel & Fashion", icon: Shirt, desc: "Clothing, footwear, size & color variants" },
  { id: "food_beverage", label: "Food & Beverage", icon: Package, desc: "Dairy, beverages, perishable foods" },
  { id: "auto_parts", label: "Auto Spare Parts & Lubricants", icon: Wrench, desc: "Engine oils, filters, spare parts, vehicle models" },
  { id: "cosmetics", label: "Cosmetics & Personal Care", icon: Sparkles, desc: "Skincare, haircare, beauty products" },
];

const UOM_OPTIONS = [
  { value: "PCS", label: "Pieces (PCS)" },
  { value: "BOX", label: "Box (BOX)" },
  { value: "CTN", label: "Carton / Case (CTN)" },
  { value: "PACK", label: "Packet / Pack (PACK)" },
  { value: "KG", label: "Kilograms (KG)" },
  { value: "G", label: "Grams (G)" },
  { value: "L", label: "Liters (L)" },
  { value: "ML", label: "Milliliters (ML)" },
  { value: "DOZEN", label: "Dozen (DZ)" },
  { value: "BOTTLE", label: "Bottle (BTL)" },
  { value: "CAN", label: "Can (CAN)" },
  { value: "M", label: "Meters (M)" },
  { value: "FT", label: "Feet (FT)" },
  { value: "SET", label: "Set (SET)" },
  { value: "ROLL", label: "Roll (ROLL)" },
  { value: "BUNDLE", label: "Bundle (BDL)" },
  { value: "PALLET", label: "Pallet (PLT)" },
  { value: "UNIT", label: "Unit (UNT)" },
];

export default function NewProductPage() {
  const router = useRouter();
  const [distributors, setDistributors] = useState<Array<{ _id: string; company_name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ _id: string; category_name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ _id: string; brand_name: string }>>([]);

  const [distributor_id, setDistributorId] = useState("");
  const [category_id, setCategoryId] = useState("");
  const [brand_id, setBrandId] = useState("");
  const [industry_domain, setIndustryDomain] = useState("general");

  const [product_name, setProductName] = useState("");
  const [product_code, setProductCode] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [hsn_code, setHsnCode] = useState("");

  const [short_description, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [unit_of_measure, setUnitOfMeasure] = useState("PCS");
  const [quantity_per_case, setQuantityPerCase] = useState("1");

  // Pricing
  const [base_cost, setBaseCost] = useState("");
  const [mrp, setMrp] = useState("");
  const [wholesale_price, setWholesalePrice] = useState("");
  const [retail_price, setRetailPrice] = useState("");
  const [gst_rate, setGstRate] = useState("18");
  const [cess, setCess] = useState("0");

  // Domain attributes
  const [batch_number, setBatchNumber] = useState("");
  const [expiry_date, setExpiryDate] = useState("");
  const [rx_required, setRxRequired] = useState(false);
  const [warranty_months, setWarrantyMonths] = useState("");
  const [serial_number, setSerialNumber] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [material, setMaterial] = useState("");
  const [dimension, setDimension] = useState("");

  // Specifications key-value pairs
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([
    { key: "Country of Origin", value: "Pakistan" },
  ]);

  // Inventory
  const [minimum_stock, setMinimumStock] = useState("10");
  const [reorder_level, setReorderLevel] = useState("20");
  const [reorder_quantity, setReorderQuantity] = useState("50");
  const [lead_time_days, setLeadTimeDays] = useState("3");
  const [is_featured, setIsFeatured] = useState(false);

  // Quick modals state
  const [newCatName, setNewCatName] = useState("");
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandOpen, setNewBrandOpen] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/distributors", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setDistributors(list);
        if (list.length > 0) setDistributorId(list[0]._id);
      });
  }, []);

  useEffect(() => {
    if (!distributor_id) return;
    fetch(`/api/categories?distributor_id=${distributor_id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCategories(d.data || []));
    fetch(`/api/brands?distributor_id=${distributor_id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setBrands(d.data || []));
  }, [distributor_id]);

  function autoGenCode(name: string) {
    if (!product_code || product_code.startsWith("SKU-")) {
      const clean = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "PRD");
      const rand = Math.floor(1000 + Math.random() * 9000);
      setProductCode(`${clean}-${rand}`);
      setSku(`SKU-${clean}-${rand}`);
    }
  }

  function addSpecRow() {
    setSpecs([...specs, { key: "", value: "" }]);
  }

  function removeSpecRow(idx: number) {
    setSpecs(specs.filter((_, i) => i !== idx));
  }

  function updateSpecRow(idx: number, field: "key" | "value", val: string) {
    const updated = [...specs];
    updated[idx][field] = val;
    setSpecs(updated);
  }

  async function handleQuickAddCategory() {
    if (!newCatName || !distributor_id) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ distributor_id, category_name: newCatName, category_code: `CAT-${Date.now().toString(36).toUpperCase()}` }),
      });
      const d = await res.json();
      if (res.ok && d.data) {
        setCategories([...categories, d.data]);
        setCategoryId(d.data._id);
        setNewCatName("");
        setNewCatOpen(false);
      }
    } catch (e) {
      console.error("Create category error:", e);
    }
  }

  async function handleQuickAddBrand() {
    if (!newBrandName || !distributor_id) return;
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ distributor_id, brand_name: newBrandName, brand_code: `BRD-${Date.now().toString(36).toUpperCase()}` }),
      });
      const d = await res.json();
      if (res.ok && d.data) {
        setBrands([...brands, d.data]);
        setBrandId(d.data._id);
        setNewBrandName("");
        setNewBrandOpen(false);
      }
    } catch (e) {
      console.error("Create brand error:", e);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!distributor_id || !category_id || !brand_id) {
      const msg = "Please select Distributor, Category, and Brand.";
      toastApiError(msg);
      setError(msg);
      setLoading(false);
      return;
    }

    const specificationsObj: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim()) specificationsObj[s.key.trim()] = s.value;
    });

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          distributor_id,
          category_id,
          brand_id,
          product_name,
          product_code,
          sku,
          barcode: barcode || undefined,
          hsn_code: hsn_code || undefined,
          industry_domain,
          domain_attributes: {
            batch_number: batch_number || undefined,
            expiry_date: expiry_date || undefined,
            rx_required: rx_required || undefined,
            warranty_months: warranty_months ? Number(warranty_months) : undefined,
            serial_number: serial_number || undefined,
            size: size || undefined,
            color: color || undefined,
            material: material || undefined,
            dimension: dimension || undefined,
          },
          description: description || undefined,
          short_description: short_description || undefined,
          specifications: specificationsObj,
          unit_of_measure,
          packaging: {
            quantity_per_case: Number(quantity_per_case) || 1,
          },
          pricing: {
            base_cost: Number(base_cost) || 0,
            mrp: Number(mrp) || 0,
            wholesale_price: wholesale_price ? Number(wholesale_price) : undefined,
            retail_price: retail_price ? Number(retail_price) : undefined,
            gst_rate: gst_rate ? Number(gst_rate) : undefined,
            cess: cess ? Number(cess) : undefined,
          },
          inventory: {
            minimum_stock: minimum_stock ? Number(minimum_stock) : 0,
            reorder_level: reorder_level ? Number(reorder_level) : 0,
            reorder_quantity: reorder_quantity ? Number(reorder_quantity) : 0,
            lead_time_days: lead_time_days ? Number(lead_time_days) : 0,
          },
          status: { is_featured },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastApiError(data, "Failed to create product");
        setError(data.error || "Failed to create product");
        return;
      }
      router.push("/dashboard/products");
      router.refresh();
    } catch (err: any) {
      toastApiError(err, "Network error while creating product");
      setError("Network error while creating product");
    } finally {
      setLoading(false);
    }
  }

  const currentDomainObj = DOMAIN_OPTIONS.find((d) => d.id === industry_domain) || DOMAIN_OPTIONS[0];
  const DomainIcon = currentDomainObj.icon;

  return (
    <div className="w-full space-y-6 pt-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-900 w-fit">
          <Link href="/dashboard/products">
            <ArrowLeft className="size-4 mr-1.5" /> Back to Products Catalog
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <BulkImportDialog entityType="products" buttonText="Bulk Import Products / Fertilizers" onImportSuccess={() => router.push("/dashboard/products")} />
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-3 py-1.5">
            <Sparkles className="size-3.5" />
            <span>Universal Domain Engine Active</span>
          </Badge>
        </div>
      </div>

      <Card className="border-slate-200 shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-none m-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Package className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">Universal Product Onboarding</CardTitle>
              <CardDescription className="text-slate-300 text-xs">
                Add single or bulk products for any industry domain (Agriculture & Fertilizers, FMCG, Pharma, Electronics, Hardware, Apparel, Wholesale) with domain attributes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
                {error}
              </div>
            )}

            {/* STEP 1: Select Industry Domain */}
            <div className="space-y-3 border-b pb-5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                1. Select Industry Domain / Product Category Preset *
              </Label>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Select value={industry_domain} onValueChange={setIndustryDomain} required>
                  <SelectTrigger className="bg-white border-slate-300 h-10 px-3.5 rounded-xl font-semibold text-slate-900 w-full sm:w-80 shadow-xs hover:border-slate-400">
                    <SelectValue placeholder="Select Industry Domain" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {DOMAIN_OPTIONS.map((d) => {
                      const IconComp = d.icon;
                      return (
                        <SelectItem key={d.id} value={d.id} className="py-2 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <IconComp className="size-4 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-slate-900">{d.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {currentDomainObj && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex-1 min-w-0">
                    <DomainIcon className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-900">{currentDomainObj.label}:</span>
                    <span className="text-slate-500 truncate">{currentDomainObj.desc}</span>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2: Classification (Distributor, Category, Brand) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b pb-2 text-slate-900 font-semibold text-sm">
                <Building2 className="size-4 text-emerald-600" />
                <span>Distributor & Classification</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Distributor Node <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={distributor_id} onValueChange={setDistributorId} required>
                    <SelectTrigger className="bg-slate-50 border-slate-200 text-xs">
                      <SelectValue placeholder="Select Distributor" />
                    </SelectTrigger>
                    <SelectContent>
                      {distributors.map((d) => (
                        <SelectItem key={d._id} value={d._id} className="text-xs">
                          {d.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-700">
                      Product Category <span className="text-rose-500">*</span>
                    </Label>
                    <Dialog open={newCatOpen} onOpenChange={setNewCatOpen}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-[11px] text-emerald-600 hover:underline flex items-center gap-0.5">
                          <Plus className="size-3" /> Quick Add
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-base">Add New Category</DialogTitle>
                          <DialogDescription className="text-xs">Create a new category under active distributor.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 pt-2">
                          <Input
                            placeholder="Category Name (e.g. Dairy Products, Analgesics, Mobile Cables)"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            className="text-xs"
                          />
                        </div>
                        <DialogFooter className="pt-2">
                          <Button size="sm" onClick={handleQuickAddCategory} className="bg-slate-900 text-white">Save Category</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Select value={category_id} onValueChange={setCategoryId} required>
                    <SelectTrigger className="bg-slate-50 border-slate-200 text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c._id} value={c._id} className="text-xs">
                          {c.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-700">
                      Brand / Manufacturer <span className="text-rose-500">*</span>
                    </Label>
                    <Dialog open={newBrandOpen} onOpenChange={setNewBrandOpen}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-[11px] text-emerald-600 hover:underline flex items-center gap-0.5">
                          <Plus className="size-3" /> Quick Add
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-base">Add New Brand</DialogTitle>
                          <DialogDescription className="text-xs">Create a new brand manufacturer label.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 pt-2">
                          <Input
                            placeholder="Brand Name (e.g. Nestlé, Pfizer, Samsung, Honda)"
                            value={newBrandName}
                            onChange={(e) => setNewBrandName(e.target.value)}
                            className="text-xs"
                          />
                        </div>
                        <DialogFooter className="pt-2">
                          <Button size="sm" onClick={handleQuickAddBrand} className="bg-slate-900 text-white">Save Brand</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Select value={brand_id} onValueChange={setBrandId} required>
                    <SelectTrigger className="bg-slate-50 border-slate-200 text-xs">
                      <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b._id} value={b._id} className="text-xs">
                          {b.brand_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* STEP 3: Identity & Codes */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b pb-2 text-slate-900 font-semibold text-sm">
                <Tag className="size-4 text-emerald-600" />
                <span>Product Identity & Barcodes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="product_name" className="text-xs font-semibold text-slate-700">
                    Product Title / SKU Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="product_name"
                    placeholder="e.g. Nestlé Milkpak 1L / Panadol Extra 500mg / Samsung Galaxy Charger 25W"
                    value={product_name}
                    onChange={(e) => {
                      setProductName(e.target.value);
                      autoGenCode(e.target.value);
                    }}
                    required
                    className="bg-slate-50 border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="product_code" className="text-xs font-semibold text-slate-700">
                    Product Code <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="product_code"
                    placeholder="e.g. PRD-9218"
                    value={product_code}
                    onChange={(e) => setProductCode(e.target.value)}
                    required
                    className="font-mono text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sku" className="text-xs font-semibold text-slate-700">
                    SKU Code <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="sku"
                    placeholder="e.g. SKU-NES-1001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    className="font-mono text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="barcode" className="text-xs font-semibold text-slate-700">
                    EAN / Barcode (Optional)
                  </Label>
                  <Input
                    id="barcode"
                    placeholder="e.g. 8964000192811"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="font-mono text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="hsn_code" className="text-xs font-semibold text-slate-700">
                    HSN / Tax Tariff Code (Optional)
                  </Label>
                  <Input
                    id="hsn_code"
                    placeholder="e.g. HSN-0401.20"
                    value={hsn_code}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="font-mono text-xs bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* STEP 4: Pricing & Taxes */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b pb-2 text-slate-900 font-semibold text-sm">
                <DollarSign className="size-4 text-emerald-600" />
                <span>Pricing, Wholesale & Tax Rules</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="base_cost" className="text-xs font-semibold text-slate-700">
                    Base Cost (Rs) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="base_cost"
                    type="number"
                    step="0.01"
                    placeholder="Cost"
                    value={base_cost}
                    onChange={(e) => setBaseCost(e.target.value)}
                    required
                    className="font-mono text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mrp" className="text-xs font-semibold text-slate-700">
                    MRP / List Price <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="mrp"
                    type="number"
                    step="0.01"
                    placeholder="MRP"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    required
                    className="font-mono text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="wholesale_price" className="text-xs font-semibold text-slate-700">
                    Wholesale Price
                  </Label>
                  <Input
                    id="wholesale_price"
                    type="number"
                    step="0.01"
                    placeholder="Wholesale"
                    value={wholesale_price}
                    onChange={(e) => setWholesalePrice(e.target.value)}
                    className="font-mono text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="retail_price" className="text-xs font-semibold text-slate-700">
                    Retail Price
                  </Label>
                  <Input
                    id="retail_price"
                    type="number"
                    step="0.01"
                    placeholder="Retail"
                    value={retail_price}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    className="font-mono text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gst_rate" className="text-xs font-semibold text-slate-700">
                    Tax / GST %
                  </Label>
                  <Input
                    id="gst_rate"
                    type="number"
                    step="0.01"
                    placeholder="18"
                    value={gst_rate}
                    onChange={(e) => setGstRate(e.target.value)}
                    className="font-mono text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cess" className="text-xs font-semibold text-slate-700">
                    Cess / Surcharge
                  </Label>
                  <Input
                    id="cess"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={cess}
                    onChange={(e) => setCess(e.target.value)}
                    className="font-mono text-xs bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* STEP 5: Units of Measure & Domain Attributes */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b pb-2 text-slate-900 font-semibold text-sm">
                <Boxes className="size-4 text-emerald-600" />
                <span>Units of Measure (UOM) & Domain Attributes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Unit of Measure (UOM) <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={unit_of_measure} onValueChange={setUnitOfMeasure}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 text-xs">
                      <SelectValue placeholder="Select UOM" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {UOM_OPTIONS.map((u) => (
                        <SelectItem key={u.value} value={u.value} className="text-xs">
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quantity_per_case" className="text-xs font-semibold text-slate-700">
                    Items / Units per Master Carton
                  </Label>
                  <Input
                    id="quantity_per_case"
                    type="number"
                    placeholder="e.g. 12 or 24"
                    value={quantity_per_case}
                    onChange={(e) => setQuantityPerCase(e.target.value)}
                    className="text-xs bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              {/* Dynamic Domain Attributes based on selected Industry Domain */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-emerald-600" />
                  <span>Domain Attribute Safeguards ({industry_domain.toUpperCase()})</span>
                </p>

                {(industry_domain === "fmcg" || industry_domain === "food_beverage" || industry_domain === "pharma") && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="batch_number" className="text-xs font-semibold text-slate-700">Batch / Lot Number</Label>
                      <Input id="batch_number" placeholder="e.g. BATCH-2026-09A" value={batch_number} onChange={(e) => setBatchNumber(e.target.value)} className="bg-white text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="expiry_date" className="text-xs font-semibold text-slate-700">Expiry Date</Label>
                      <Input id="expiry_date" type="date" value={expiry_date} onChange={(e) => setExpiryDate(e.target.value)} className="bg-white text-xs" />
                    </div>
                    {industry_domain === "pharma" && (
                      <div className="flex items-center gap-2 pt-6">
                        <input type="checkbox" id="rx_required" checked={rx_required} onChange={(e) => setRxRequired(e.target.checked)} className="rounded border-slate-300" />
                        <Label htmlFor="rx_required" className="text-xs font-medium text-slate-800">Requires Prescription (Rx)</Label>
                      </div>
                    )}
                  </div>
                )}

                {industry_domain === "electronics" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="warranty_months" className="text-xs font-semibold text-slate-700">Warranty (Months)</Label>
                      <Input id="warranty_months" type="number" placeholder="e.g. 12 or 24" value={warranty_months} onChange={(e) => setWarrantyMonths(e.target.value)} className="bg-white text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="serial_number" className="text-xs font-semibold text-slate-700">Serial Number / IMEI</Label>
                      <Input id="serial_number" placeholder="e.g. SN-892811902" value={serial_number} onChange={(e) => setSerialNumber(e.target.value)} className="bg-white text-xs" />
                    </div>
                  </div>
                )}

                {industry_domain === "apparel" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="size" className="text-xs font-semibold text-slate-700">Size Variant</Label>
                      <Input id="size" placeholder="e.g. S, M, L, XL, XXL, 42" value={size} onChange={(e) => setSize(e.target.value)} className="bg-white text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="color" className="text-xs font-semibold text-slate-700">Color Variant</Label>
                      <Input id="color" placeholder="e.g. Navy Blue, Black, Olive Green" value={color} onChange={(e) => setColor(e.target.value)} className="bg-white text-xs" />
                    </div>
                  </div>
                )}

                {industry_domain === "construction" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="material" className="text-xs font-semibold text-slate-700">Material Grade / Type</Label>
                      <Input id="material" placeholder="e.g. Grade 60 Steel / PVC / Brass" value={material} onChange={(e) => setMaterial(e.target.value)} className="bg-white text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dimension" className="text-xs font-semibold text-slate-700">Dimensions / Gauge</Label>
                      <Input id="dimension" placeholder="e.g. 12mm x 20ft / 4 inch x 8 inch" value={dimension} onChange={(e) => setDimension(e.target.value)} className="bg-white text-xs" />
                    </div>
                  </div>
                )}

                {industry_domain === "general" && (
                  <p className="text-xs text-slate-500">Universal general mode active. You can add custom specifications below.</p>
                )}
              </div>
            </div>

            {/* STEP 6: Dynamic Key-Value Specifications */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                  <Layers className="size-4 text-emerald-600" />
                  <span>Custom Product Specifications</span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addSpecRow} className="h-7 text-xs gap-1">
                  <Plus className="size-3" /> Add Specification
                </Button>
              </div>

              <div className="space-y-2">
                {specs.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Property Name (e.g. Voltage, Origin, Weight)"
                      value={s.key}
                      onChange={(e) => updateSpecRow(idx, "key", e.target.value)}
                      className="text-xs bg-slate-50 border-slate-200 flex-1"
                    />
                    <Input
                      placeholder="Value (e.g. 220V, Pakistan, 500g)"
                      value={s.value}
                      onChange={(e) => updateSpecRow(idx, "value", e.target.value)}
                      className="text-xs bg-slate-50 border-slate-200 flex-1"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSpecRow(idx)} className="h-8 w-8 p-0 text-rose-500">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 7: Inventory Safeguards & Options */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b pb-2 text-slate-900 font-semibold text-sm">
                <Boxes className="size-4 text-emerald-600" />
                <span>Reorder Rules & Options</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="minimum_stock" className="text-xs font-semibold text-slate-700">Minimum Stock</Label>
                  <Input id="minimum_stock" type="number" placeholder="10" value={minimum_stock} onChange={(e) => setMinimumStock(e.target.value)} className="text-xs bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reorder_level" className="text-xs font-semibold text-slate-700">Reorder Level</Label>
                  <Input id="reorder_level" type="number" placeholder="20" value={reorder_level} onChange={(e) => setReorderLevel(e.target.value)} className="text-xs bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reorder_quantity" className="text-xs font-semibold text-slate-700">Reorder Qty</Label>
                  <Input id="reorder_quantity" type="number" placeholder="50" value={reorder_quantity} onChange={(e) => setReorderQuantity(e.target.value)} className="text-xs bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lead_time_days" className="text-xs font-semibold text-slate-700">Lead Time (Days)</Label>
                  <Input id="lead_time_days" type="number" placeholder="3" value={lead_time_days} onChange={(e) => setLeadTimeDays(e.target.value)} className="text-xs bg-slate-50 border-slate-200" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="is_featured" checked={is_featured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded border-slate-300" />
                <Label htmlFor="is_featured" className="text-xs font-medium text-slate-800">Featured in Catalog & Agent Quick Booking</Label>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-end gap-3 p-6 bg-slate-50 border-t border-slate-200 rounded-b-xl">
            <Button variant="outline" type="button" asChild disabled={loading}>
              <Link href="/dashboard/products">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white min-w-[160px]">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Product…
                </>
              ) : (
                "Save & Add Product"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
