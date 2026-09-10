"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlobalGeoFilter, GeoFilterState } from "@/components/global-geo-filter";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Boxes,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

import { PermissionGuard } from "@/components/permission-guard";

interface InventoryItem {
  _id: string;
  product_name: string;
  product_code: string;
  sku: string;
  unit_of_measure: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  cost_price: number;
  mrp: number;
  total_value: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

interface SummaryData {
  total_skus: number;
  total_units: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_valuation: number;
}

interface StockMovementData {
  _id: string;
  movement_type: string;
  product_id?: { product_name?: string; sku?: string };
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost?: number;
  total_cost?: number;
  created_at?: string;
}

export function InventoryClientView({
  initialSummary,
  initialItems,
  initialMovements,
}: {
  initialSummary: SummaryData;
  initialItems: InventoryItem[];
  initialMovements: StockMovementData[];
}) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [summary, setSummary] = useState<SummaryData>(initialSummary);
  const [movements, setMovements] = useState<StockMovementData[]>(initialMovements);

  // Pagination state
  const [matrixPage, setMatrixPage] = useState(1);
  const [movementsPage, setMovementsPage] = useState(1);
  const pageSize = 10;

  const [geoFilters, setGeoFilters] = useState<GeoFilterState>({
    region: "all",
    city: "all",
    domain: "all",
    territoryId: "all",
    distributorId: "all",
    search: "",
  });

  // Modal State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"receipt" | "adjustment_in" | "adjustment_out" | "damage">("receipt");
  const [quantity, setQuantity] = useState("10");
  const [notes, setNotes] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredItems = items.filter((item) => {
    if (geoFilters.search) {
      const q = geoFilters.search.toLowerCase();
      const matchName = item.product_name.toLowerCase().includes(q);
      const matchCode = item.product_code?.toLowerCase().includes(q);
      const matchSku = item.sku?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchSku) return false;
    }
    return true;
  });

  const matrixTotalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedMatrixItems = filteredItems.slice((matrixPage - 1) * pageSize, matrixPage * pageSize);

  const movementsTotalPages = Math.ceil(movements.length / pageSize) || 1;
  const paginatedMovements = movements.slice((movementsPage - 1) * pageSize, movementsPage * pageSize);

  async function handleAdjustStock(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProductId) {
      setError("Please select a product");
      return;
    }
    setError("");
    setModalLoading(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          product_id: selectedProductId,
          adjustment_type: adjustmentType,
          quantity: Number(quantity),
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to adjust stock");
        return;
      }

      // Refresh inventory data
      const refRes = await fetch("/api/inventory", { credentials: "include" });
      const refData = await refRes.json();
      if (refData.data) {
        setItems(refData.data.items || []);
        setSummary(refData.data.summary || summary);
        setMovements(refData.data.recent_movements || []);
      }

      setDialogOpen(false);
      setSelectedProductId("");
      setQuantity("10");
      setNotes("");
    } catch {
      setError("Network error occurred");
    } finally {
      setModalLoading(false);
    }
  }

  function openAdjustmentFor(prodId: string) {
    setSelectedProductId(prodId);
    setDialogOpen(true);
  }

  return (
    <PermissionGuard module="inventory">
      <div className="space-y-6 w-full">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory & Stock Management</h1>
          <p className="text-sm text-slate-500">
            Real-time stock level matrix, low-stock warnings, and warehouse movements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const res = await fetch("/api/inventory", { credentials: "include" });
              const d = await res.json();
              if (d.data) {
                setItems(d.data.items || []);
                setSummary(d.data.summary || summary);
                setMovements(d.data.recent_movements || []);
              }
            }}
            className="gap-2 text-xs cursor-pointer"
          >
            <RefreshCw className="size-3.5" /> Refresh
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-xs cursor-pointer">
                <Plus className="size-4" /> Adjust Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Stock Level Adjustment</DialogTitle>
                <DialogDescription>
                  Record stock receipts, manual stock updates, or damage write-offs.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAdjustStock} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Target Product SKU *</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId} required>
                    <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                    <SelectContent className="max-h-60 bg-white">
                      {items.map((i) => (
                        <SelectItem key={i._id} value={i._id}>
                          {i.product_name} ({i.sku}) - Stock: {i.current_stock}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Action Type *</Label>
                    <Select
                      value={adjustmentType}
                      onValueChange={(val: any) => setAdjustmentType(val)}
                    >
                      <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="receipt">Stock Intake / Receipt (+)</SelectItem>
                        <SelectItem value="adjustment_in">Correction Add (+)</SelectItem>
                        <SelectItem value="adjustment_out">Correction Deduct (-)</SelectItem>
                        <SelectItem value="damage">Damage / Expiry (-)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Remarks / Batch / Reference</Label>
                  <Input
                    id="notes"
                    placeholder="e.g. PO #1082 or Damage Audit Log"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

                <DialogFooter className="pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={modalLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    {modalLoading ? "Saving…" : "Confirm Stock Adjustment"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total SKUs & Units</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Boxes className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">{summary.total_units.toLocaleString()} Units</div>
            <p className="text-xs text-slate-500 mt-1">Across {summary.total_skus} total catalog SKUs</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Alerts</CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-600">{summary.low_stock_count} SKUs</div>
            <p className="text-xs text-slate-500 mt-1">Items at or below minimum reorder threshold</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Out of Stock</CardTitle>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <XCircle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-rose-600">{summary.out_of_stock_count} SKUs</div>
            <p className="text-xs text-slate-500 mt-1">Products requiring immediate replenishment</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory Valuation</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">
              Rs. {summary.total_valuation.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">Valued at base cost price</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs (Live Matrix vs Audit Logs) */}
      <Tabs defaultValue="matrix" className="w-full space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="matrix" className="gap-2 text-xs font-semibold cursor-pointer">
            <Boxes className="size-3.5" /> Stock Matrix ({filteredItems.length})
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2 text-xs font-semibold cursor-pointer">
            <SlidersHorizontal className="size-3.5" /> Stock Movement Log ({movements.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: LIVE MATRIX */}
        <TabsContent value="matrix" className="space-y-4">
          <GlobalGeoFilter
            onFilterChange={(filters) => {
              setGeoFilters(filters);
              setMatrixPage(1);
            }}
            placeholderSearch="Filter inventory by SKU, product code or name…"
          />

          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4 space-y-4">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No inventory items match your search.</div>
              ) : (
                <>
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>SKU & Code</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Threshold</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Total Valuation</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMatrixItems.map((item) => {
                        return (
                          <TableRow key={item._id} className="hover:bg-slate-50">
                            <TableCell className="font-mono text-xs font-bold text-slate-900">
                              {item.sku}
                              <span className="block text-[10px] text-slate-500 font-normal">{item.product_code}</span>
                            </TableCell>
                            <TableCell className="font-semibold text-slate-900">{item.product_name}</TableCell>
                            <TableCell className="text-xs text-slate-600">{item.unit_of_measure}</TableCell>
                            <TableCell>
                              <div className="font-bold text-slate-900 text-sm font-mono">{item.current_stock}</div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">
                              Min: <span className="font-semibold">{item.minimum_stock}</span>
                            </TableCell>
                            <TableCell className="text-xs font-mono text-slate-700">Rs. {item.cost_price.toLocaleString()}</TableCell>
                            <TableCell className="text-xs font-mono font-bold text-slate-900">
                              Rs. {item.total_value.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {item.status === "in_stock" && (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                  In Stock
                                </Badge>
                              )}
                              {item.status === "low_stock" && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                  Low Stock
                                </Badge>
                              )}
                              {item.status === "out_of_stock" && (
                                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs">
                                  Out of Stock
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openAdjustmentFor(item._id)}
                                className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                              >
                                Adjust Stock
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  <PaginationControls
                    currentPage={matrixPage}
                    totalPages={matrixTotalPages}
                    onPageChange={(p) => setMatrixPage(p)}
                    totalItems={filteredItems.length}
                    pageSize={pageSize}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: AUDIT LOG MOVEMENTS */}
        <TabsContent value="movements" className="space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">Recent Stock Movements</CardTitle>
              <CardDescription className="text-xs">Audit log of stock receipts, transfers, and adjustments</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {movements.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No stock movements recorded yet.</div>
              ) : (
                <>
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Product SKU</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Previous Stock</TableHead>
                        <TableHead>New Stock</TableHead>
                        <TableHead>Cost Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMovements.map((m) => (
                        <TableRow key={m._id} className="hover:bg-slate-50">
                          <TableCell className="text-xs font-semibold capitalize text-slate-900">
                            {m.movement_type.replace("_", " ")}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-slate-900">
                            {m.product_id?.product_name || "Product"} ({m.product_id?.sku || "SKU"})
                          </TableCell>
                          <TableCell className="font-bold text-xs text-slate-900 font-mono">
                            {m.movement_type.includes("receipt") || m.movement_type.includes("in") ? (
                              <span className="text-emerald-600 inline-flex items-center gap-0.5">
                                <ArrowUpRight className="size-3" /> +{m.quantity}
                              </span>
                            ) : (
                              <span className="text-rose-600 inline-flex items-center gap-0.5">
                                <ArrowDownRight className="size-3" /> -{m.quantity}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-slate-600">{m.previous_stock}</TableCell>
                          <TableCell className="text-xs font-bold font-mono text-slate-900">{m.new_stock}</TableCell>
                          <TableCell className="text-xs font-mono text-slate-600">
                            Rs. {(m.total_cost || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <PaginationControls
                    currentPage={movementsPage}
                    totalPages={movementsTotalPages}
                    onPageChange={(p) => setMovementsPage(p)}
                    totalItems={movements.length}
                    pageSize={pageSize}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </PermissionGuard>
  );
}
