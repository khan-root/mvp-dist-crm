"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewProductPage() {
  const router = useRouter();
  const [distributors, setDistributors] = useState<Array<{ _id: string; company_name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ _id: string; category_name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ _id: string; brand_name: string }>>([]);
  const [distributor_id, setDistributorId] = useState("");
  const [category_id, setCategoryId] = useState("");
  const [brand_id, setBrandId] = useState("");
  const [product_name, setProductName] = useState("");
  const [product_code, setProductCode] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [hsn_code, setHsnCode] = useState("");
  const [description, setDescription] = useState("");
  const [short_description, setShortDescription] = useState("");
  const [unit_of_measure, setUnitOfMeasure] = useState("PCS");
  const [base_cost, setBaseCost] = useState("");
  const [mrp, setMrp] = useState("");
  const [wholesale_price, setWholesalePrice] = useState("");
  const [retail_price, setRetailPrice] = useState("");
  const [gst_rate, setGstRate] = useState("");
  const [cess, setCess] = useState("");
  const [minimum_stock, setMinimumStock] = useState("");
  const [reorder_level, setReorderLevel] = useState("");
  const [reorder_quantity, setReorderQuantity] = useState("");
  const [lead_time_days, setLeadTimeDays] = useState("");
  const [is_featured, setIsFeatured] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/distributors", { credentials: "include" }).then((r) => r.json()).then((d) => setDistributors(d.data || []));
  }, []);

  useEffect(() => {
    if (!distributor_id) {
      setCategories([]);
      setBrands([]);
      setCategoryId("");
      setBrandId("");
      return;
    }
    fetch(`/api/categories?distributor_id=${distributor_id}`, { credentials: "include" }).then((r) => r.json()).then((d) => setCategories(d.data || []));
    fetch(`/api/brands?distributor_id=${distributor_id}`, { credentials: "include" }).then((r) => r.json()).then((d) => setBrands(d.data || []));
  }, [distributor_id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
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
          description: description || undefined,
          short_description: short_description || undefined,
          unit_of_measure,
          pricing: {
            base_cost: Number(base_cost),
            mrp: Number(mrp),
            wholesale_price: wholesale_price ? Number(wholesale_price) : undefined,
            retail_price: retail_price ? Number(retail_price) : undefined,
            gst_rate: gst_rate ? Number(gst_rate) : undefined,
            cess: cess ? Number(cess) : undefined,
          },
          inventory: minimum_stock || reorder_level || reorder_quantity || lead_time_days
            ? {
                minimum_stock: minimum_stock ? Number(minimum_stock) : undefined,
                reorder_level: reorder_level ? Number(reorder_level) : undefined,
                reorder_quantity: reorder_quantity ? Number(reorder_quantity) : undefined,
                lead_time_days: lead_time_days ? Number(lead_time_days) : undefined,
              }
            : undefined,
          status: { is_featured },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create");
        return;
      }
      router.push("/dashboard/products");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Add product</CardTitle>
          <CardDescription>Add a new product to the catalog</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Distributor</Label>
              <Select value={distributor_id} onValueChange={setDistributorId} required>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {distributors.map((d) => (
                    <SelectItem key={d._id} value={d._id}>{d.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category_id} onValueChange={setCategoryId} required>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.category_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={brand_id} onValueChange={setBrandId} required>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b._id} value={b._id}>{b.brand_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_name">Product name</Label>
              <Input id="product_name" value={product_name} onChange={(e) => setProductName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_code">Product code</Label>
                <Input id="product_code" value={product_code} onChange={(e) => setProductCode(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hsn_code">HSN code</Label>
                <Input id="hsn_code" value={hsn_code} onChange={(e) => setHsnCode(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="short_description">Short description</Label>
              <Input id="short_description" value={short_description} onChange={(e) => setShortDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Pricing</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Input type="number" step="0.01" min="0" placeholder="Cost" value={base_cost} onChange={(e) => setBaseCost(e.target.value)} required />
                <Input type="number" step="0.01" min="0" placeholder="MRP" value={mrp} onChange={(e) => setMrp(e.target.value)} required />
                <Input type="number" step="0.01" min="0" placeholder="Wholesale" value={wholesale_price} onChange={(e) => setWholesalePrice(e.target.value)} />
                <Input type="number" step="0.01" min="0" placeholder="Retail" value={retail_price} onChange={(e) => setRetailPrice(e.target.value)} />
                <Input type="number" step="0.01" min="0" placeholder="GST %" value={gst_rate} onChange={(e) => setGstRate(e.target.value)} />
                <Input type="number" step="0.01" min="0" placeholder="Cess" value={cess} onChange={(e) => setCess(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_of_measure">UOM</Label>
                <Select value={unit_of_measure} onValueChange={setUnitOfMeasure}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PCS">PCS</SelectItem>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="BOX">BOX</SelectItem>
                    <SelectItem value="CTN">CTN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Inventory (optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" min="0" placeholder="Min stock" value={minimum_stock} onChange={(e) => setMinimumStock(e.target.value)} />
                  <Input type="number" min="0" placeholder="Reorder level" value={reorder_level} onChange={(e) => setReorderLevel(e.target.value)} />
                  <Input type="number" min="0" placeholder="Reorder qty" value={reorder_quantity} onChange={(e) => setReorderQuantity(e.target.value)} />
                  <Input type="number" min="0" placeholder="Lead time (days)" value={lead_time_days} onChange={(e) => setLeadTimeDays(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_featured" checked={is_featured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded border-input" />
              <Label htmlFor="is_featured" className="font-normal">Featured product</Label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="gap-2">
            <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create"}</Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/products">Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
