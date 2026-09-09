"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  _id: string;
  product_name: string;
  product_code: string;
  pricing: { mrp: number; base_cost: number };
}

export default function NewOrderPage() {
  const router = useRouter();
  const [distributors, setDistributors] = useState<Array<{ _id: string; company_name: string }>>([]);
  const [stores, setStores] = useState<Array<{ _id: string; store_name: string; store_code: string }>>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [distributor_id, setDistributorId] = useState("");
  const [store_id, setStoreId] = useState("");
  const [order_type] = useState<"store_order">("store_order");
  const [items, setItems] = useState<Array<{ product_id: string; product_name: string; quantity: number; unit_price: number; discount_percentage?: number; tax_rate?: number; notes?: string }>>([]);
  const [notes, setNotes] = useState("");
  const [payment_method, setPaymentMethod] = useState<string>("cash");
  const [source, setSource] = useState<string>("web");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/distributors", { credentials: "include" }).then((r) => r.json()).then((d) => setDistributors(d.data || []));
  }, []);

  useEffect(() => {
    if (!distributor_id) {
      setStores([]);
      setProducts([]);
      setStoreId("");
      return;
    }
    fetch(`/api/stores?distributor_id=${distributor_id}`, { credentials: "include" }).then((r) => r.json()).then((d) => setStores(d.data || []));
    fetch(`/api/products?distributor_id=${distributor_id}`, { credentials: "include" }).then((r) => r.json()).then((d) => setProducts(d.data || []));
  }, [distributor_id]);

  function addLine() {
    if (products.length === 0) return;
    const p = products[0];
    setItems((prev) => [...prev, { product_id: p._id, product_name: p.product_name, quantity: 1, unit_price: p.pricing?.mrp ?? 0, tax_rate: 0 }]);
  }

  function updateLine(index: number, field: "quantity" | "unit_price" | "discount_percentage" | "tax_rate", value: number) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function updateLineNotes(index: number, value: string) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], notes: value };
      return next;
    });
  }

  function setLineProduct(index: number, productId: string) {
    const p = products.find((x) => x._id === productId);
    if (!p) return;
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], product_id: p._id, product_name: p.product_name, unit_price: p.pricing?.mrp ?? 0 };
      return next;
    });
  }

  function removeLine(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      setError("Add at least one item");
      return;
    }
    if (!store_id || !distributor_id) {
      setError("Select distributor and store");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          order_type,
          distributor_id,
          store_id,
          from_type: "store",
          from_id: store_id,
          to_type: "distributor",
          to_id: distributor_id,
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: i.unit_price,
            discount_percentage: i.discount_percentage,
            tax_rate: i.tax_rate,
            notes: i.notes,
          })),
          notes: notes || undefined,
          payment_method: payment_method as "cash" | "card" | "upi" | "bank_transfer" | "wallet" | "credit",
          source: source as "app" | "web" | "whatsapp" | "phone" | "manual",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create order");
        return;
      }
      router.push("/dashboard/orders");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const totalDiscount = items.reduce((s, i) => s + (i.quantity * i.unit_price * (i.discount_percentage ?? 0)) / 100, 0);
  const totalTax = items.reduce((s, i) => s + (i.quantity * i.unit_price * (1 - (i.discount_percentage ?? 0) / 100) * (i.tax_rate ?? 0)) / 100, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>New order</CardTitle>
          <CardDescription>Create a store order</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label>Store</Label>
                <Select value={store_id} onValueChange={setStoreId} required>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s._id} value={s._id}>{s.store_name} ({s.store_code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={products.length === 0}>
                  Add line
                </Button>
              </div>
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground">Select distributor first, then add items.</p>
              )}
              {items.length > 0 && (
                <div className="border rounded-md divide-y">
                  {items.map((line, idx) => {
                    const lineTotal = line.quantity * line.unit_price;
                    const disc = (lineTotal * (line.discount_percentage ?? 0)) / 100;
                    const afterDisc = lineTotal - disc;
                    const tax = (afterDisc * (line.tax_rate ?? 0)) / 100;
                    const finalLineTotal = afterDisc + tax;
                    return (
                      <div key={idx} className="p-2 space-y-1">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4">
                            <Select value={line.product_id} onValueChange={(v) => setLineProduct(idx, v)}>
                              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p._id} value={p._id}>{p.product_name} (Rs.{p.pricing?.mrp})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-1">
                            <Input type="number" min={1} value={line.quantity} onChange={(e) => updateLine(idx, "quantity", Number(e.target.value) || 1)} />
                          </div>
                          <div className="col-span-1">
                            <Input type="number" min={0} step="0.01" value={line.unit_price} onChange={(e) => updateLine(idx, "unit_price", Number(e.target.value) || 0)} />
                          </div>
                          <div className="col-span-1">
                            <Input type="number" min={0} max={100} step="0.5" placeholder="Disc%" value={line.discount_percentage ?? ""} onChange={(e) => updateLine(idx, "discount_percentage", e.target.value ? Number(e.target.value) : 0)} />
                          </div>
                          <div className="col-span-1">
                            <Input type="number" min={0} step="0.01" placeholder="Tax%" value={line.tax_rate ?? ""} onChange={(e) => updateLine(idx, "tax_rate", e.target.value ? Number(e.target.value) : 0)} />
                          </div>
                          <div className="col-span-2 text-sm">Rs.{finalLineTotal.toFixed(2)}</div>
                          <div className="col-span-1">
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(idx)}>×</Button>
                          </div>
                        </div>
                        <Input className="h-8 text-xs" placeholder="Line notes" value={line.notes ?? ""} onChange={(e) => updateLineNotes(idx, e.target.value)} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="text-right space-y-0.5">
              <p className="font-medium">Subtotal: Rs.{subtotal.toFixed(2)}</p>
              {totalDiscount > 0 && <p className="text-muted-foreground">Discount: -Rs.{totalDiscount.toFixed(2)}</p>}
              {totalTax > 0 && <p className="text-muted-foreground">Tax: Rs.{totalTax.toFixed(2)}</p>}
              <p className="font-semibold">Grand total: Rs.{grandTotal.toFixed(2)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment method</Label>
                <Select value={payment_method} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="app">App</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Order notes</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading || items.length === 0}>{loading ? "Creating…" : "Create order"}</Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/orders">Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
