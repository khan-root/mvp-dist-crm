"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  _id: string;
  product_name: string;
  product_code: string;
  sku?: string;
  pricing?: { mrp?: number; retail_price?: number; wholesale_price?: number };
  unit_of_measure?: string;
}

interface LineItem {
  product_id: string;
  product_label: string;
  quantity: number;
  unit_price: number;
}

export default function PlaceOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const distributorIdFromUrl = searchParams.get("distributor_id");
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<LineItem[]>([{ product_id: "", product_label: "", quantity: 0, unit_price: 0 }]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const url = distributorIdFromUrl
      ? `/api/store/products?distributor_id=${encodeURIComponent(distributorIdFromUrl)}`
      : "/api/store/products";
    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.data || []);
        setFetching(false);
      })
      .catch(() => {
        setError("Failed to load products");
        setFetching(false);
      });
  }, [distributorIdFromUrl]);

  function addLine() {
    setLines((prev) => [...prev, { product_id: "", product_label: "", quantity: 0, unit_price: 0 }]);
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
    setError("");
    const validLines = lines.filter((l) => l.product_id && l.quantity > 0);
    if (validLines.length === 0) {
      setError("Add at least one product with quantity");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders/from-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...(distributorIdFromUrl ? { distributor_id: distributorIdFromUrl } : {}),
          items: validLines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to place order");
        return;
      }
      router.push("/store");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const total = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/store">← Back to dashboard</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Place order</CardTitle>
          <CardDescription>
            {distributorIdFromUrl
              ? "Order from the selected distributor (direct order—no agent)."
              : "Order from your assigned distributor, or search products to order from any warehouse."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            {fetching ? (
              <p className="text-sm text-muted-foreground">Loading products…</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No products available. {distributorIdFromUrl ? "This distributor has no products." : "Search products to order from any warehouse, or contact your distributor."}
              </p>
            ) : (
              <>
                {lines.map((line, index) => (
                  <div key={index} className="flex flex-wrap items-end gap-2 p-2 rounded border">
                    <div className="flex-1 min-w-[200px] space-y-1">
                      <Label>Product</Label>
                      <Select
                        value={line.product_id || "_"}
                        onValueChange={(v) => updateLine(index, "product_id", v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
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
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity || ""}
                        onChange={(e) => updateLine(index, "quantity", parseInt(e.target.value, 10) || 0)}
                      />
                    </div>
                    <div className="w-28 text-sm text-muted-foreground">
                      Rs.{(line.quantity * line.unit_price).toLocaleString()}
                    </div>
                    {lines.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(index)}>Remove</Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addLine}>Add line</Button>
                <div className="pt-2 font-medium">Total: Rs.{total.toLocaleString()}</div>
                <div className="space-y-1">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery instructions, etc." />
                </div>
              </>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading || fetching || products.length === 0}>
                {loading ? "Placing…" : "Place order"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/store">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
