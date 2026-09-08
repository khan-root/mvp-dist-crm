"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Package, Search, Check, CheckSquare, Square } from "lucide-react";

interface ProductItem {
  _id: string;
  product_code: string;
  product_name: string;
  sku?: string;
  pricing?: { mrp?: number; retail_price?: number };
  unit_of_measure?: string;
}

export function AgentProductAssignmentDialog({
  agentId,
  agentName,
  trigger,
}: {
  agentId: string;
  agentName: string;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setFetching(true);
    fetch(`/api/agents/${agentId}/assign-products`, { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          const products: ProductItem[] = res.data.all_products || [];
          const assignedIds: string[] = res.data.assigned_product_ids || [];
          setAllProducts(products);
          // If no specific product IDs assigned yet, default to all catalog products
          setSelectedProductIds(assignedIds.length > 0 ? assignedIds : products.map((p) => p._id));
        }
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [open, agentId]);

  function toggleProduct(productId: string) {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }

  function selectAll() {
    setSelectedProductIds(allProducts.map((p) => p._id));
  }

  function deselectAll() {
    setSelectedProductIds([]);
  }

  async function handleSave() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/assign-products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_ids: selectedProductIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update product assignments");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error saving product assignments");
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = allProducts.filter((p) =>
    `${p.product_name} ${p.product_code} ${p.sku || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-slate-900">
            <Package className="size-5 text-emerald-600" />
            <DialogTitle>Assign Products / SKUs to {agentName}</DialogTitle>
          </div>
          <DialogDescription>
            Select which product catalog items this agent is authorized to sell and book orders for.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search products by name, code, SKU…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={selectAll} className="text-xs">
              Select All
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={deselectAll} className="text-xs">
              Deselect All
            </Button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Authorized SKUs: <span className="font-bold text-slate-900">{selectedProductIds.length}</span> of {allProducts.length} items
          </div>

          {fetching ? (
            <p className="text-sm text-slate-500 py-6 text-center">Loading product catalog…</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No matching products found.</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 border rounded-xl p-2 bg-slate-50/50 border-slate-200">
              {filteredProducts.map((product) => {
                const isSelected = selectedProductIds.includes(product._id);
                return (
                  <div
                    key={product._id}
                    onClick={() => toggleProduct(product._id)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                        : "bg-white text-slate-900 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <CheckSquare className="size-5 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="size-5 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-sm">{product.product_name}</div>
                        <div className={`text-xs ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          Code: {product.product_code} · Price: Rs.{(product.pricing?.retail_price ?? product.pricing?.mrp ?? 0).toLocaleString()} · UOM: {product.unit_of_measure || "PCS"}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                        <Check className="size-3" /> Authorized
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={loading || fetching}>
            {loading ? "Saving Product Authorization…" : `Save (${selectedProductIds.length}) Authorized SKUs`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
