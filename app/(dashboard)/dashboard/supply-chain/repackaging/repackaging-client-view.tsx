"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Boxes, Plus, RefreshCw, Building2, ArrowRight, Layers, Sparkles } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PermissionGuard } from "@/components/permission-guard";

interface RepackagingClientViewProps {
  initialOrders: any[];
  warehouses: any[];
  products: any[];
  currentUser: any;
}

const PAGE_SIZE = 10;

export function RepackagingClientView({ initialOrders, warehouses, products, currentUser }: RepackagingClientViewProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form State
  const [warehouseId, setWarehouseId] = useState("");
  const [sourceProductId, setSourceProductId] = useState("");
  const [sourceQuantity, setSourceQuantity] = useState("");
  const [targetProductId, setTargetProductId] = useState("");
  const [targetQuantity, setTargetQuantity] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWarehouseUser = currentUser?.role_id?.code === "warehouse_manager" || currentUser?.role_id?.code === "warehouse_operator";
  const userWarehouseId = currentUser?.assigned_warehouse_id?._id || currentUser?.assigned_warehouse_id;

  const filteredOrders = orders.filter((ord) => {
    if (isWarehouseUser && userWarehouseId) {
      if (ord.source_warehouse_id?._id !== userWarehouseId) return false;
    }
    if (warehouseFilter !== "all" && ord.source_warehouse_id?._id !== warehouseFilter) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      ord.order_number?.toLowerCase().includes(term) ||
      ord.source_product_id?.product_name?.toLowerCase().includes(term) ||
      ord.target_product_id?.product_name?.toLowerCase().includes(term) ||
      ord.source_warehouse_id?.warehouse_name?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE) || 1;
  const paginatedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supply-chain/repackaging");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepackaging = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetWhId = isWarehouseUser ? userWarehouseId : warehouseId;
    if (!targetWhId || !sourceProductId || !sourceQuantity || !targetProductId || !targetQuantity) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/supply-chain/repackaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_warehouse_id: targetWhId,
          source_product_id: sourceProductId,
          source_quantity_used: Number(sourceQuantity),
          target_product_id: targetProductId,
          target_quantity_produced: Number(targetQuantity),
          operator_name: operatorName || currentUser?.name,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setSourceQuantity("");
        setTargetQuantity("");
        setOperatorName("");
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to process repackaging");
      }
    } catch (e) {
      console.error(e);
      alert("Error submitting repackaging order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalConvertedVolume = orders.reduce((sum, o) => sum + (o.source_quantity_used || 0), 0);
  const totalProducedUnits = orders.reduce((sum, o) => sum + (o.target_quantity_produced || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 p-4 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300 backdrop-blur-md">
              <Layers className="h-3.5 w-3.5" /> Bulk-to-Packet Conversion Studio
            </div>
            <h1 className="mt-2 text-xl sm:text-3xl font-extrabold tracking-tight">Packet Repackaging Studio</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Convert raw bulk raw materials into retail consumer-ready packets, bags, and cartons with automatic stock ledger updates.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              disabled={loading}
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <PermissionGuard module="inventory" action="create">
              <Button onClick={() => setIsModalOpen(true)} className="bg-purple-600 font-semibold text-white hover:bg-purple-500 text-xs sm:text-sm">
                <Plus className="mr-1.5 sm:mr-2 h-4 w-4" /> New Repackaging
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-slate-800/80 pt-5">
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Total Repackaging Orders</div>
            <div className="text-xl font-bold text-white">{orders.length} Batch Executions</div>
          </div>
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Bulk Stock Processed</div>
            <div className="text-xl font-bold text-purple-400">{totalConvertedVolume.toLocaleString()} Tons</div>
          </div>
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Packets / Units Produced</div>
            <div className="text-xl font-bold text-emerald-400">{totalProducedUnits.toLocaleString()} Packets</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search order #, source bulk material, target packet SKU or facility..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            {!isWarehouseUser && (
              <Select
                value={warehouseFilter}
                onValueChange={(val) => {
                  setWarehouseFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Warehouse Hub" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w._id} value={w._id}>
                      {w.warehouse_name} ({w.warehouse_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Packet Repackaging Batch Ledger</CardTitle>
              <CardDescription>Historical conversions from bulk materials into retail packaged SKUs</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Showing {filteredOrders.length} orders
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                  <TableHead className="font-semibold">Order #</TableHead>
                  <TableHead className="font-semibold">Facility / Warehouse</TableHead>
                  <TableHead className="font-semibold">Source Bulk Material</TableHead>
                  <TableHead className="font-semibold">Conversion</TableHead>
                  <TableHead className="font-semibold">Target Packaged Product</TableHead>
                  <TableHead className="font-semibold">Conversion Yield</TableHead>
                  <TableHead className="font-semibold">Date & Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No repackaging order history found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((ord) => (
                    <TableRow key={ord._id} className="hover:bg-muted/40">
                      <TableCell className="font-mono font-bold text-primary">
                        {ord.order_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {ord.source_warehouse_id?.warehouse_name || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {ord.source_warehouse_id?.warehouse_code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {ord.source_product_id?.product_name || "Bulk Stock"}
                        </div>
                        <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                          -{ord.source_quantity_used} {ord.source_product_id?.unit_of_measure || "Tons"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40 p-1.5 text-purple-600 dark:text-purple-300">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {ord.target_product_id?.product_name || "Consumer Packet"}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          +{ord.target_quantity_produced} Packets
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs border-purple-500/30 text-purple-700 dark:text-purple-300">
                          {ord.conversion_ratio || "1 Bulk : Packets"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono text-slate-700 dark:text-slate-300">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ord.operator_name || "System Operator"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t p-4">
            <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </CardContent>
      </Card>

      {/* Repackaging Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleCreateRepackaging}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Layers className="h-5 w-5 text-purple-600" /> Execute Bulk-to-Packet Repackaging
              </DialogTitle>
              <DialogDescription>
                Deduct bulk raw material from stock and create packaged retail consumer products.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {!isWarehouseUser ? (
                <div className="space-y-2">
                  <Label htmlFor="rep_warehouse" className="font-semibold">Warehouse Hub *</Label>
                  <Select value={warehouseId} onValueChange={(val) => setWarehouseId(val)} required>
                    <SelectTrigger id="rep_warehouse">
                      <SelectValue placeholder="Select Warehouse Hub" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w._id} value={w._id}>
                          {w.warehouse_name} ({w.warehouse_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="font-semibold">Assigned Facility</Label>
                  <Input disabled value={warehouses.find((w) => w._id === userWarehouseId)?.warehouse_name || "Your Warehouse"} />
                </div>
              )}

              {/* Conversion Block */}
              <div className="rounded-xl border bg-gradient-to-r from-purple-500/5 to-indigo-500/5 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source_product" className="font-semibold text-rose-700 dark:text-rose-400">
                      Source Bulk Material *
                    </Label>
                    <Select value={sourceProductId} onValueChange={(val) => setSourceProductId(val)} required>
                      <SelectTrigger id="source_product">
                        <SelectValue placeholder="Select Bulk Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p._id} value={p._id}>
                            {p.product_name} ({p.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source_qty" className="font-semibold text-rose-700 dark:text-rose-400">
                      Bulk Quantity to Consume *
                    </Label>
                    <Input
                      id="source_qty"
                      type="number"
                      step="0.01"
                      placeholder="e.g. 2.5 (Tons)"
                      value={sourceQuantity}
                      onChange={(e) => setSourceQuantity(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="h-px bg-purple-200 dark:bg-purple-800 flex-1" />
                  <span className="px-3 text-xs font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Converts Into
                  </span>
                  <div className="h-px bg-purple-200 dark:bg-purple-800 flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_product" className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Target Retail Packet SKU *
                    </Label>
                    <Select value={targetProductId} onValueChange={(val) => setTargetProductId(val)} required>
                      <SelectTrigger id="target_product">
                        <SelectValue placeholder="Select Packet Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p._id} value={p._id}>
                            {p.product_name} ({p.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_qty" className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Packets / Units Produced *
                    </Label>
                    <Input
                      id="target_qty"
                      type="number"
                      placeholder="e.g. 2500 (Packets)"
                      value={targetQuantity}
                      onChange={(e) => setTargetQuantity(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operator_name" className="font-semibold">Repackaging Machine / Operator Name</Label>
                <Input
                  id="operator_name"
                  placeholder="e.g. Line-B Auto Packer / Operator Name"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-purple-600 font-semibold text-white hover:bg-purple-500">
                {isSubmitting ? "Converting..." : "Execute Repackaging"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
