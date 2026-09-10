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
  ShoppingCart,
  Plus,
  RefreshCw,
  Search,
  Building2,
  FileSpreadsheet,
  Layers,
  MapPin,
  User,
  CheckCircle2,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { PermissionGuard } from "@/components/permission-guard";

interface OutboundClientViewProps {
  initialOutbounds: any[];
  transportBilties: any[];
  warehouses: any[];
  products: any[];
  distributors: any[];
  currentUser: any;
}

const ensureArray = <T = any,>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export function OutboundClientView({
  initialOutbounds,
  transportBilties,
  warehouses,
  products,
  distributors,
  currentUser,
}: OutboundClientViewProps) {
  const [outbounds, setOutbounds] = useState<any[]>(() => ensureArray(initialOutbounds));
  const [bilties, setBilties] = useState<any[]>(() => ensureArray(transportBilties));
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form state
  const [selectedBiltyId, setSelectedBiltyId] = useState("");
  const [dispatchQuantity, setDispatchQuantity] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [outboundNotes, setOutboundNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWarehouseUser = currentUser?.role_id?.code === "warehouse_manager" || currentUser?.role_id?.code === "warehouse_operator";
  const userWarehouseId = currentUser?.assigned_warehouse_id?._id || currentUser?.assigned_warehouse_id;

  const refreshData = async () => {
    try {
      const [resOut, resBilty] = await Promise.all([
        fetch("/api/supply-chain/outbound"),
        fetch("/api/supply-chain/bilties"),
      ]);
      if (resOut.ok) setOutbounds(ensureArray(await resOut.json()));
      if (resBilty.ok) setBilties(ensureArray(await resBilty.json()));
    } catch {
      // Ignore
    }
  };

  const selectedBiltyObj = bilties.find((b) => b._id === selectedBiltyId);

  const handleOutboundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiltyId || !dispatchQuantity) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/supply-chain/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bilty_id: selectedBiltyId,
          quantity: parseFloat(dispatchQuantity),
          destination_address: destinationAddress,
          notes: outboundNotes,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setSelectedBiltyId("");
        setDispatchQuantity("");
        setDestinationAddress("");
        setOutboundNotes("");
        refreshData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to process outbound dispatch.");
      }
    } catch (err: any) {
      alert("Error submitting outbound dispatch: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOutbounds = outbounds.filter((out) => {
    if (isWarehouseUser && userWarehouseId) {
      if (out.from_warehouse?._id !== userWarehouseId) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const prodName = out.product_id?.product_name?.toLowerCase() || "";
      const notes = out.notes?.toLowerCase() || "";
      const biltyNum = out.bilty_id?.bilty_number?.toLowerCase() || "";
      return prodName.includes(term) || notes.includes(term) || biltyNum.includes(term);
    }

    return true;
  });

  const totalDispatchedVolume = outbounds.reduce((sum, o) => sum + (o.quantity || 0), 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Executive Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-950 via-slate-900 to-amber-950 p-6 text-white shadow-xl border border-amber-900/40">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30 text-xs">
                <ShoppingCart className="mr-1.5 h-3.5 w-3.5 text-amber-400" /> SAP SD Outbound Delivery Engine
              </Badge>
              <Badge variant="outline" className="border-emerald-400/30 text-emerald-300 text-xs">
                MvT 601 (Goods Issue)
              </Badge>
            </div>
            <h1 className="text-2xl font-black text-white sm:text-3xl flex items-center gap-2">
              <span>Outbound Dealer Fulfillment (MvT 601)</span>
            </h1>
            <p className="text-amber-100/80 text-xs sm:text-sm max-w-2xl mt-1">
              Dispatch sales orders to market dealers, retail outlets, and direct clients. Deducts stock from warehouse inventory and active transport bilties (`MvT 601`).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <PermissionGuard module="inventory" action="create">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-amber-600 font-semibold text-white hover:bg-amber-500 shadow-lg shadow-amber-900/40 text-xs sm:text-sm"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Dispatch to Dealer
              </Button>
            </PermissionGuard>
            <Button variant="outline" onClick={refreshData} className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-slate-800/80 pt-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-slate-400 text-xs uppercase font-semibold">Total Outbound Sales Dispatched</span>
              <div className="text-xl font-black text-amber-400 mt-1">{totalDispatchedVolume.toLocaleString()} Units</div>
            </div>
            <ArrowUpRight className="h-6 w-6 text-amber-400" />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-slate-400 text-xs uppercase font-semibold">Total Dealer Dispatch Records</span>
              <div className="text-xl font-black text-white mt-1">{outbounds.length} Sales Logs</div>
            </div>
            <ShoppingCart className="h-6 w-6 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-amber-600" /> Goods Issue Sales Ledger (MvT 601)
              </CardTitle>
              <CardDescription className="text-xs">
                Audited record of all outbound sales shipments sent to regional market dealers and clients.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search product, bilty, destination..."
                className="pl-8 text-xs h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                  <TableHead className="font-semibold text-xs">Dispatching Warehouse</TableHead>
                  <TableHead className="text-right font-semibold text-xs">Dispatched Quantity</TableHead>
                  <TableHead className="font-semibold text-xs">Bilty / Transporter</TableHead>
                  <TableHead className="font-semibold text-xs">Destination / Notes</TableHead>
                  <TableHead className="font-semibold text-xs">Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOutbounds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                      No outbound dealer sales dispatches recorded matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOutbounds.map((out) => (
                    <TableRow key={out._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <TableCell>
                        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] font-mono">
                          MvT 601 (Goods Issue)
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-xs">
                        <div>{out.product_id?.product_name || "Material SKU"}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{out.product_id?.sku}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium">{out.from_warehouse?.warehouse_name || "Central Warehouse"}</span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-rose-600 dark:text-rose-400">
                        -{out.quantity?.toLocaleString()} {out.product_id?.unit_of_measure || "Units"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {out.bilty_id ? (
                          <div>
                            <span className="font-mono text-[11px]">Bilty #{out.bilty_id.bilty_number}</span>
                            <div className="text-[10px] text-muted-foreground">{out.bilty_id.transporter_name}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{out.notes || "Market Dealer Fulfillment"}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(out.created_at || Date.now()).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Outbound Dispatch Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleOutboundSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5 text-amber-600" /> Execute Dealer Sales Dispatch (MvT 601)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select an active transport bilty and dispatch stock to a regional market dealer or customer.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-xs">
              <div className="space-y-1.5">
                <Label className="font-semibold">Select Active Transport Bilty</Label>
                <Select value={selectedBiltyId} onValueChange={setSelectedBiltyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Bilty..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bilties
                      .filter((b) => b.status === "active" && (b.remaining_quantity || 0) > 0)
                      .map((b) => (
                        <SelectItem key={b._id} value={b._id}>
                          Bilty #{b.bilty_number} — {b.product_id?.product_name} ({b.remaining_quantity} {b.unit_of_measure} Remaining)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedBiltyObj && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                    Available Balance: {selectedBiltyObj.remaining_quantity?.toLocaleString()} {selectedBiltyObj.unit_of_measure} ({selectedBiltyObj.transporter_name})
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Dispatch Quantity</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 100"
                  value={dispatchQuantity}
                  onChange={(e) => setDispatchQuantity(e.target.value)}
                  max={selectedBiltyObj?.remaining_quantity || undefined}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Destination Address / Dealer Market</Label>
                <Input
                  placeholder="e.g. Dealer X Warehouse, Main Commercial Market"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Delivery Challan Notes / Invoice Ref</Label>
                <Input
                  placeholder="e.g. Sales Order #1002 - Urgent Dispatch"
                  value={outboundNotes}
                  onChange={(e) => setOutboundNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-amber-600 text-white hover:bg-amber-500">
                {isSubmitting ? "Dispatching..." : "Confirm Dispatch (MvT 601)"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
