"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store as StoreIcon, ShoppingCart, Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage, toastApiError } from "@/lib/utils";

interface Product {
  _id: string;
  product_name: string;
  product_code: string;
  pricing?: { mrp?: number; retail_price?: number; wholesale_price?: number };
}

interface AssignedStore {
  _id: string;
  store_code: string;
  store_name: string;
  store_type?: string;
  owner_info?: { name?: string; phone?: string };
  address?: { city?: string; state?: string };
}

interface LineItem {
  product_id: string;
  product_label: string;
  quantity: number;
  unit_price: number;
  [key: string]: unknown;
}

export default function AgentPlaceOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeIdParam = searchParams.get("store_id");
  
  const [selectedStoreId, setSelectedStoreId] = useState<string>(storeIdParam || "");
  const [stores, setStores] = useState<AssignedStore[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<LineItem[]>([{ product_id: "", product_label: "", quantity: 1, unit_price: 0 }]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/agent/assigned-stores", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/agent/products", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([storesRes, productsRes]) => {
        const loadedStores = storesRes.data || [];
        setStores(loadedStores);
        setProducts(productsRes.data || []);
        if (storeIdParam && loadedStores.length > 0) {
          setSelectedStoreId(storeIdParam);
        } else if (loadedStores.length > 0 && !selectedStoreId) {
          setSelectedStoreId(loadedStores[0]._id);
        }
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [storeIdParam]);

  const activeStore = stores.find((s) => s._id === selectedStoreId);

  function addLine() {
    setLines((prev) => [...prev, { product_id: "", product_label: "", quantity: 1, unit_price: 0 }]);
  }

  function updateLine(index: number, field: keyof LineItem, value: string | number) {
    setLines((prev) => {
      const next = [...prev];
      (next[index] as Record<string, unknown>)[field] = value;
      if (field === "product_id" && value) {
        const p = products.find((x) => x._id === value);
        if (p) {
          next[index].product_label = `${p.product_name} (${p.product_code})`;
          next[index].unit_price = p.pricing?.retail_price ?? p.pricing?.wholesale_price ?? p.pricing?.mrp ?? 0;
        }
      }
      return next;
    });
  }

  function removeLine(index: number) {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStoreId) {
      setError("Please select a store first.");
      return;
    }
    setError("");
    const validLines = lines.filter((l) => l.product_id && l.quantity > 0);
    if (validLines.length === 0) {
      setError("Add at least one product with quantity.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders/from-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          store_id: selectedStoreId,
          items: validLines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to place order");
        return;
      }
      router.push("/agent");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const total = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/agent/shops">
            <ArrowLeft className="size-4 mr-1.5" /> Back to My Shops
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-slate-900">
            <ShoppingCart className="size-5 text-emerald-600" />
            <CardTitle>Book Order from Market Shopkeeper</CardTitle>
          </div>
          <CardDescription>
            Record product order placed during your market visit. The distributor warehouse will fulfill and deliver directly to the retailer.
          </CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-6">
            {fetching ? (
              <p className="text-sm text-slate-500">Loading catalog & assigned market outlets…</p>
            ) : stores.length === 0 ? (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                No stores assigned to your agent account. Please ask your administrator to assign shops to your territory.
              </div>
            ) : (
              <>
                {/* Store Selection Dropdown */}
                <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <Label className="font-semibold text-slate-900 flex items-center gap-2">
                    <StoreIcon className="size-4 text-slate-600" /> Select Shopkeeper / Market Outlet
                  </Label>
                  <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Choose a shop" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.store_name} ({s.store_code}) — {s.owner_info?.name || "Owner"} ({s.address?.city || "Market"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {activeStore && (
                    <div className="mt-3 text-xs text-slate-600 grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                      <div><span className="font-medium text-slate-900">Owner:</span> {activeStore.owner_info?.name || "N/A"} ({activeStore.owner_info?.phone || "No phone"})</div>
                      <div><span className="font-medium text-slate-900">City:</span> {activeStore.address?.city || "N/A"} ({activeStore.store_type || "Retail"})</div>
                    </div>
                  )}
                </div>

                {/* Line Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-slate-900">Order Product Line Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLine} className="h-8 gap-1">
                      <Plus className="size-3.5" /> Add Product Line
                    </Button>
                  </div>

                  {lines.map((line, index) => (
                    <div key={index} className="flex flex-wrap items-end gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <div className="flex-1 min-w-[220px] space-y-1">
                        <Label className="text-xs text-slate-600">Product</Label>
                        <Select
                          value={line.product_id || "_"}
                          onValueChange={(v) => updateLine(index, "product_id", v)}
                        >
                          <SelectTrigger><SelectValue placeholder="Select SKU / Item" /></SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p._id} value={p._id}>
                                {p.product_name} · {p.product_code} · Rs.{(p.pricing?.retail_price ?? p.pricing?.wholesale_price ?? p.pricing?.mrp ?? 0).toLocaleString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs text-slate-600">Qty</Label>
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity || ""}
                          onChange={(e) => updateLine(index, "quantity", parseInt(e.target.value, 10) || 0)}
                        />
                      </div>
                      <div className="w-28 text-sm font-semibold text-slate-900 pb-2">
                        Rs.{(line.quantity * line.unit_price).toLocaleString()}
                      </div>
                      {lines.length > 1 && (
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeLine(index)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Summary & Notes */}
                <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                  <span className="text-sm font-medium">Grand Total</span>
                  <span className="text-2xl font-bold text-emerald-400">Rs. {total.toLocaleString()}</span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Visit Notes / Special Instructions</Label>
                  <Input id="notes" placeholder="e.g. Delivery requested on Monday morning" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </>
            )}

            {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}
          </CardContent>

          <CardFooter className="flex items-center gap-3">
            <Button type="submit" disabled={loading || fetching || products.length === 0 || stores.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Placing Order...
                </span>
              ) : (
                "Submit Order to Distributor"
              )}
            </Button>
            <Button type="button" variant="outline" asChild disabled={loading}>
              <Link href="/agent">Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
