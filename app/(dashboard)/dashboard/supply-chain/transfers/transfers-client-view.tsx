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
import {
  Truck,
  Plus,
  ArrowRight,
  RefreshCw,
  Search,
  Building2,
  Package,
  FileSpreadsheet,
  Layers,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { PermissionGuard } from "@/components/permission-guard";

interface TransfersClientViewProps {
  initialMovements: any[];
  warehouses: any[];
  products: any[];
  transportBilties: any[];
  vehicles: any[];
  currentUser: any;
}

const ensureArray = <T = any,>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export function TransfersClientView({
  initialMovements,
  warehouses,
  products,
  transportBilties,
  vehicles,
  currentUser,
}: TransfersClientViewProps) {
  const [movements, setMovements] = useState<any[]>(() => ensureArray(initialMovements));
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Form state
  const [fromWhId, setFromWhId] = useState("");
  const [toWhId, setToWhId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [biltyId, setBiltyId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWarehouseUser = currentUser?.role_id?.code === "warehouse_manager" || currentUser?.role_id?.code === "warehouse_operator";
  const userWarehouseId = currentUser?.assigned_warehouse_id?._id || currentUser?.assigned_warehouse_id;

  const refreshData = async () => {
    try {
      const res = await fetch("/api/supply-chain/audit");
      if (res.ok) setMovements(ensureArray(await res.json()));
    } catch {
      // Ignore
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromWhId || !toWhId || !productId || !quantity) return;

    if (fromWhId === toWhId) {
      alert("Source and Destination warehouses must be different.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/supply-chain/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_warehouse: fromWhId,
          to_warehouse: toWhId,
          product_id: productId,
          quantity: parseFloat(quantity),
          bilty_id: biltyId || undefined,
          vehicle_number: vehicleNumber || undefined,
        }),
      });

      if (res.ok) {
        setIsTransferModalOpen(false);
        setFromWhId("");
        setToWhId("");
        setProductId("");
        setQuantity("");
        setBiltyId("");
        setVehicleNumber("");
        refreshData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to execute stock transfer.");
      }
    } catch (err: any) {
      alert("Error submitting stock transfer: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter transfers
  const transferMovements = movements.filter((m) => {
    const isTransfer = m.movement_type === "transfer_out" || m.movement_type === "transfer_in";
    if (!isTransfer) return false;

    if (isWarehouseUser && userWarehouseId) {
      const matchFrom = m.from_warehouse?._id === userWarehouseId;
      const matchTo = m.to_warehouse?._id === userWarehouseId;
      if (!matchFrom && !matchTo) return false;
    }

    if (statusFilter === "transfer_out" && m.movement_type !== "transfer_out") return false;
    if (statusFilter === "transfer_in" && m.movement_type !== "transfer_in") return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const prodName = m.product_id?.product_name?.toLowerCase() || "";
      const fromName = m.from_warehouse?.warehouse_name?.toLowerCase() || "";
      const toName = m.to_warehouse?.warehouse_name?.toLowerCase() || "";
      return prodName.includes(term) || fromName.includes(term) || toName.includes(term);
    }

    return true;
  });

  const totalTransferOut = movements
    .filter((m) => m.movement_type === "transfer_out")
    .reduce((sum, m) => sum + (m.quantity || 0), 0);

  const totalTransferIn = movements
    .filter((m) => m.movement_type === "transfer_in")
    .reduce((sum, m) => sum + (m.quantity || 0), 0);

  const activeBilties = ensureArray(transportBilties).filter((b) => b.status === "active" && (b.remaining_quantity || 0) > 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Executive Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                <Truck className="mr-1.5 h-3.5 w-3.5 text-blue-400" /> SAP MM/TM STO Engine
              </Badge>
              <Badge variant="outline" className="border-emerald-400/30 text-emerald-300 text-xs">
                MvT 351 / 641 / 101
              </Badge>
            </div>
            <h1 className="text-2xl font-black text-white sm:text-3xl flex items-center gap-2">
              <span>Stock Transfer Orders (STO) & In-Transit</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-1">
              Multi-echelon inter-warehouse freight transfer matrix. Dual-entry inventory balance updates (`MvT 351` STO dispatch, `MvT 641` Stock In-Transit, `MvT 101` Goods Receipt).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <PermissionGuard module="inventory" action="create">
              <Button
                onClick={() => setIsTransferModalOpen(true)}
                className="bg-blue-600 font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-900/40 text-xs sm:text-sm"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Create Transfer Order
              </Button>
            </PermissionGuard>
            <Button variant="outline" onClick={refreshData} className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-slate-800/80 pt-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-slate-400 text-xs uppercase font-semibold">Total Dispatched (MvT 351)</span>
              <div className="text-xl font-black text-white mt-1">{totalTransferOut.toLocaleString()} Units</div>
            </div>
            <Truck className="h-6 w-6 text-blue-400" />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-slate-400 text-xs uppercase font-semibold">Received at Target (MvT 101)</span>
              <div className="text-xl font-black text-emerald-400 mt-1">{totalTransferIn.toLocaleString()} Units</div>
            </div>
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-slate-400 text-xs uppercase font-semibold">Net In-Transit Delta</span>
              <div className="text-xl font-black text-amber-400 mt-1">{Math.max(0, totalTransferOut - totalTransferIn).toLocaleString()} Units</div>
            </div>
            <Clock className="h-6 w-6 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" /> Inter-Warehouse Transfer Ledger
              </CardTitle>
              <CardDescription className="text-xs">
                Audited stock dispatches between ports, hubs, and regional warehouses.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search product, warehouse..."
                  className="pl-8 text-xs h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 text-xs h-9">
                  <SelectValue placeholder="All Movements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Movements</SelectItem>
                  <SelectItem value="transfer_out">STO Dispatch (MvT 351)</SelectItem>
                  <SelectItem value="transfer_in">Target Receipt (MvT 101)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                  <TableHead className="font-semibold text-xs">SAP Movement</TableHead>
                  <TableHead className="font-semibold text-xs">Product SKU</TableHead>
                  <TableHead className="font-semibold text-xs">Origin Location</TableHead>
                  <TableHead className="font-semibold text-xs">Destination Location</TableHead>
                  <TableHead className="text-right font-semibold text-xs">Quantity</TableHead>
                  <TableHead className="font-semibold text-xs">Vehicle / Bilty</TableHead>
                  <TableHead className="font-semibold text-xs">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transferMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                      No stock transfer orders recorded matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  transferMovements.map((mov) => {
                    const isOut = mov.movement_type === "transfer_out";

                    return (
                      <TableRow key={mov._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <TableCell>
                          {isOut ? (
                            <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-[10px] font-mono">
                              MvT 351 (STO Dispatch)
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-mono">
                              MvT 101 (Receipt Confirm)
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-xs">
                          <div>{mov.product_id?.product_name || "Material SKU"}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{mov.product_id?.sku}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-medium">{mov.from_warehouse?.warehouse_name || "Port / Dock Intake"}</span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {mov.to_warehouse?.warehouse_name || "Destination Hub"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs">
                          <span className={isOut ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
                            {isOut ? `-${mov.quantity}` : `+${mov.quantity}`} {mov.product_id?.unit_of_measure || "Units"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {mov.bilty_id?.bilty_number ? (
                            <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              Bilty #{mov.bilty_id.bilty_number}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {new Date(mov.created_at || Date.now()).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Stock Modal */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <form onSubmit={handleTransferSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5 text-blue-600" /> Create Stock Transfer Order (STO MvT 351)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Dispatch stock from one warehouse/port facility to another with vehicle assignment and bilty balance updates.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-semibold">Source Facility (MvT 351)</Label>
                  <Select value={fromWhId} onValueChange={setFromWhId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Origin" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((wh) => (
                        <SelectItem key={wh._id} value={wh._id}>
                          {wh.warehouse_name} ({wh.warehouse_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Destination Facility (MvT 101)</Label>
                  <Select value={toWhId} onValueChange={setToWhId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses
                        .filter((wh) => wh._id !== fromWhId)
                        .map((wh) => (
                          <SelectItem key={wh._id} value={wh._id}>
                            {wh.warehouse_name} ({wh.warehouse_code})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-semibold">Product / Commodity SKU</Label>
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Product" />
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

                <div className="space-y-1.5">
                  <Label className="font-semibold">Quantity to Transfer</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 500"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-semibold">Link Transport Bilty (Optional)</Label>
                  <Select value={biltyId} onValueChange={setBiltyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned Bilty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">No Bilty (Direct)</SelectItem>
                      {activeBilties.map((b) => (
                        <SelectItem key={b._id} value={b._id}>
                          Bilty #{b.bilty_number} ({b.remaining_quantity} {b.unit_of_measure} remaining)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Assigned Fleet Vehicle (Optional)</Label>
                  <Input
                    placeholder="e.g. KHI-9988"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTransferModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-500">
                {isSubmitting ? "Dispatching STO..." : "Confirm Transfer (MvT 351)"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
