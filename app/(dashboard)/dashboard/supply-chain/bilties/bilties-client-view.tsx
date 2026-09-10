"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileSpreadsheet, RefreshCw, Truck, ArrowRight, ShieldCheck, Building2 } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PermissionGuard } from "@/components/permission-guard";

interface BiltiesClientViewProps {
  initialBilties: any[];
  warehouses: any[];
  products: any[];
  portShipments: any[];
  currentUser: any;
}

const PAGE_SIZE = 10;

const ensureArray = <T = any,>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export function BiltiesClientView({
  initialBilties,
  warehouses,
  products,
  portShipments,
  currentUser,
}: BiltiesClientViewProps) {
  const [bilties, setBilties] = useState<any[]>(() => ensureArray(initialBilties));
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFromWh, setTransferFromWh] = useState("");
  const [transferToWh, setTransferToWh] = useState("");
  const [transferProduct, setTransferProduct] = useState("");
  const [transferQty, setTransferQty] = useState("");
  const [selectedBiltyId, setSelectedBiltyId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWarehouseUser = currentUser?.role_id?.code === "warehouse_manager" || currentUser?.role_id?.code === "warehouse_operator";
  const userWarehouseId = currentUser?.assigned_warehouse_id?._id || currentUser?.assigned_warehouse_id;

  const safeBilties = ensureArray(bilties);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFromWh || !transferToWh || !transferProduct || !transferQty) {
      alert("Please fill in all required fields (Origin, Destination, Product, Quantity)");
      return;
    }

    if (transferFromWh === transferToWh) {
      alert("Origin and Destination facilities must be different");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/supply-chain/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_warehouse_id: transferFromWh,
          to_warehouse_id: transferToWh,
          product_id: transferProduct,
          quantity: Number(transferQty),
          bilty_id: selectedBiltyId || undefined,
        }),
      });

      if (res.ok) {
        setIsTransferModalOpen(false);
        setTransferFromWh("");
        setTransferToWh("");
        setTransferProduct("");
        setTransferQty("");
        setSelectedBiltyId("");
        fetchBilties();
      } else {
        const err = await res.json();
        alert(err.error || "Inter-warehouse transfer failed");
      }
    } catch (e) {
      console.error(e);
      alert("Error executing stock transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter bilties
  const filteredBilties = safeBilties.filter((bilty) => {
    if (isWarehouseUser && userWarehouseId) {
      if (bilty.warehouse_id?._id !== userWarehouseId) return false;
    }
    if (statusFilter !== "all" && bilty.status !== statusFilter) return false;
    if (warehouseFilter !== "all" && bilty.warehouse_id?._id !== warehouseFilter) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      bilty.bilty_number?.toLowerCase().includes(term) ||
      bilty.transporter_name?.toLowerCase().includes(term) ||
      bilty.vehicle_number?.toLowerCase().includes(term) ||
      bilty.product_id?.product_name?.toLowerCase().includes(term) ||
      bilty.warehouse_id?.warehouse_name?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredBilties.length / PAGE_SIZE) || 1;
  const paginatedBilties = filteredBilties.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchBilties = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supply-chain/bilties");
      if (res.ok) {
        const data = await res.json();
        setBilties(ensureArray(data));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = safeBilties.filter((b) => b.status === "active").length;
  const exhaustedCount = safeBilties.filter((b) => b.status === "exhausted").length;
  const totalBiltyVolume = safeBilties.reduce((sum, b) => sum + (b.initial_quantity || 0), 0);
  const remainingBiltyVolume = safeBilties.reduce((sum, b) => sum + (b.remaining_quantity || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-4 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Freight Allocation Ledgers
            </div>
            <h1 className="mt-2 text-xl sm:text-3xl font-extrabold tracking-tight">Transport Bilties Management</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Track bulk consignment bilty allocations, vehicle freight splits, real-time balance deductions, and facility stock assignments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBilties}
              disabled={loading}
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <PermissionGuard module={["supply_chain", "inventory"]} action="create">
              <Button
                onClick={() => setIsTransferModalOpen(true)}
                className="bg-blue-600 font-semibold text-white hover:bg-blue-500 text-xs sm:text-sm"
              >
                <Truck className="mr-1.5 sm:mr-2 h-4 w-4" /> Transfer Stock to Warehouse
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 border-t border-slate-800/80 pt-5">
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Total Bilty Count</div>
            <div className="text-xl font-bold text-white">{bilties.length}</div>
          </div>
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Active Bilties</div>
            <div className="text-xl font-bold text-emerald-400">{activeCount}</div>
          </div>
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Total Stock Allocated</div>
            <div className="text-xl font-bold text-blue-400">{totalBiltyVolume.toLocaleString()} Tons</div>
          </div>
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Remaining Bilty Stock</div>
            <div className="text-xl font-bold text-amber-400">{remainingBiltyVolume.toLocaleString()} Tons</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="shadow-xs border-slate-200/90 dark:border-slate-800">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by bilty #, transporter, vehicle, SKU or warehouse..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="exhausted">Exhausted</SelectItem>
                </SelectContent>
              </Select>

              {!isWarehouseUser && (
                <Select
                  value={warehouseFilter}
                  onValueChange={(val) => {
                    setWarehouseFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Warehouse Hub" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {warehouses.map((w) => w._id ? (
                      <SelectItem key={w._id} value={w._id}>
                        {w.warehouse_name} ({w.warehouse_code})
                      </SelectItem>
                    ) : null)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Transport Bilty Ledgers</CardTitle>
              <CardDescription>Individual consignment bilty tracking and balance remaining</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Showing {filteredBilties.length} records
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                  <TableHead className="font-semibold">Bilty #</TableHead>
                  <TableHead className="font-semibold">Inbound Cargo Shipment</TableHead>
                  <TableHead className="font-semibold">Receiving Warehouse</TableHead>
                  <TableHead className="font-semibold">Transporter & Vehicle</TableHead>
                  <TableHead className="font-semibold">Product SKU</TableHead>
                  <TableHead className="font-semibold text-right">Tonnage Allocated</TableHead>
                  <TableHead className="font-semibold text-right">Remaining Balance</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBilties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No transport bilties found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBilties.map((bilty) => {
                    const isFullyDispatched = bilty.remaining_quantity === 0;
                    return (
                      <TableRow key={bilty._id} className="hover:bg-muted/40">
                        <TableCell className="font-mono font-bold text-primary">
                          {bilty.bilty_number}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900 dark:text-slate-100 font-mono text-xs">
                            {bilty.port_shipment_id?.shipment_number || "Bulk Cargo"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {bilty.port_shipment_id?.vessel_name} ({bilty.port_shipment_id?.origin_country})
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 font-medium">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {bilty.warehouse_id?.warehouse_name || "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {bilty.warehouse_id?.warehouse_code}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            {bilty.transporter_name || "Standard Carrier"}
                          </div>
                          <div className="text-xs font-mono text-muted-foreground">
                            Vehicle: {bilty.vehicle_number || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {bilty.product_id?.product_name || "N/A"}
                          </div>
                          <div className="text-xs font-mono text-muted-foreground">
                            {bilty.product_id?.sku}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {bilty.initial_quantity?.toLocaleString()} {bilty.unit_of_measure || "Tons"}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          <span
                            className={
                              isFullyDispatched
                                ? "text-slate-400 line-through"
                                : "text-emerald-600 dark:text-emerald-400"
                            }
                          >
                            {bilty.remaining_quantity?.toLocaleString()} {bilty.unit_of_measure || "Tons"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={bilty.status === "active" ? "default" : "secondary"}
                            className={
                              bilty.status === "active"
                                ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/30 dark:text-emerald-400"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }
                          >
                            {bilty.status === "active" ? "Active Stock" : "Exhausted"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t p-4">
            <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </CardContent>
      </Card>
      {/* Inter-Warehouse Transfer Modal */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleTransfer}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Truck className="h-5 w-5 text-blue-600" /> Inter-Warehouse Stock Freight Transfer
              </DialogTitle>
              <DialogDescription>
                Transfer packaged or bulk stock from Port/Central Hub to Regional Destination Warehouses.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="t_from" className="font-semibold text-rose-600">Origin Facility (From Port/Hub) *</Label>
                  <Select value={transferFromWh} onValueChange={(val) => setTransferFromWh(val)} required>
                    <SelectTrigger id="t_from">
                      <SelectValue placeholder="Source Warehouse / Port" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => w._id ? (
                        <SelectItem key={w._id} value={w._id}>
                          {w.warehouse_name} ({w.warehouse_code})
                        </SelectItem>
                      ) : null)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t_to" className="font-semibold text-emerald-600">Destination Warehouse (To) *</Label>
                  <Select value={transferToWh} onValueChange={(val) => setTransferToWh(val)} required>
                    <SelectTrigger id="t_to">
                      <SelectValue placeholder="Destination Warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => w._id ? (
                        <SelectItem key={w._id} value={w._id}>
                          {w.warehouse_name} ({w.warehouse_code})
                        </SelectItem>
                      ) : null)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="t_prod" className="font-semibold">Product SKU *</Label>
                  <Select value={transferProduct} onValueChange={(val) => setTransferProduct(val)} required>
                    <SelectTrigger id="t_prod">
                      <SelectValue placeholder="Select Packaged Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => p._id ? (
                        <SelectItem key={p._id} value={p._id}>
                          {p.product_name} ({p.sku})
                        </SelectItem>
                      ) : null)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t_qty" className="font-semibold">Quantity / Packets to Transfer *</Label>
                  <Input
                    id="t_qty"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 12000 (Bags) or 600 (Tons)"
                    value={transferQty}
                    onChange={(e) => setTransferQty(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="t_bilty" className="font-semibold">Link Transport Bilty (Optional)</Label>
                <Select value={selectedBiltyId} onValueChange={(val) => setSelectedBiltyId(val)}>
                  <SelectTrigger id="t_bilty">
                    <SelectValue placeholder="Select Transport Bilty Number" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No Bilty (Direct Freight)</SelectItem>
                    {safeBilties.map((b) => b._id ? (
                      <SelectItem key={b._id} value={b._id}>
                        {b.bilty_number} — {b.transporter_name} ({b.remaining_quantity} {b.unit_of_measure} Remaining)
                      </SelectItem>
                    ) : null)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsTransferModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 font-semibold text-white hover:bg-blue-500">
                {isSubmitting ? "Transferring..." : "Execute Freight Transfer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
