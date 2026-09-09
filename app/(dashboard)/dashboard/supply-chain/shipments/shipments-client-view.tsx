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
import { Search, Boxes, Plus, RefreshCw, Building2, Truck, FileSpreadsheet, Trash2, ArrowRight, ShieldCheck } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PermissionGuard } from "@/components/permission-guard";

interface ShipmentsClientViewProps {
  initialShipments: any[];
  warehouses: any[];
  products: any[];
  currentUser: any;
}

interface BiltyInputRow {
  bilty_number: string;
  transporter_name: string;
  vehicle_number: string;
  quantity: string;
}

const PAGE_SIZE = 10;

export function ShipmentsClientView({ initialShipments, warehouses, products, currentUser }: ShipmentsClientViewProps) {
  const [shipments, setShipments] = useState(initialShipments);
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Shipment Form
  const [shipmentNumber, setShipmentNumber] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [originCountry, setOriginCountry] = useState("");
  const [terminalName, setTerminalName] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantityReceived, setQuantityReceived] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("Tons");
  const [biltyRows, setBiltyRows] = useState<BiltyInputRow[]>([
    { bilty_number: "", transporter_name: "", vehicle_number: "", quantity: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWarehouseUser = currentUser?.role_id?.code === "warehouse_manager" || currentUser?.role_id?.code === "warehouse_operator";
  const userWarehouseId = currentUser?.assigned_warehouse_id?._id || currentUser?.assigned_warehouse_id;

  const filteredShipments = shipments.filter((shp) => {
    if (isWarehouseUser && userWarehouseId) {
      if (shp.warehouse_id?._id !== userWarehouseId) return false;
    }
    if (warehouseFilter !== "all" && shp.warehouse_id?._id !== warehouseFilter) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      shp.shipment_number?.toLowerCase().includes(term) ||
      shp.vessel_name?.toLowerCase().includes(term) ||
      shp.origin_country?.toLowerCase().includes(term) ||
      shp.product_id?.product_name?.toLowerCase().includes(term) ||
      shp.warehouse_id?.warehouse_name?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredShipments.length / PAGE_SIZE) || 1;
  const paginatedShipments = filteredShipments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supply-chain/shipments");
      if (res.ok) {
        const data = await res.json();
        setShipments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBiltyRow = () => {
    setBiltyRows([...biltyRows, { bilty_number: "", transporter_name: "", vehicle_number: "", quantity: "" }]);
  };

  const handleRemoveBiltyRow = (index: number) => {
    setBiltyRows(biltyRows.filter((_, i) => i !== index));
  };

  const handleBiltyRowChange = (index: number, field: keyof BiltyInputRow, value: string) => {
    const updated = [...biltyRows];
    updated[index][field] = value;
    setBiltyRows(updated);
  };

  const totalBiltyAllocated = biltyRows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);

  const handleRecordShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetWhId = isWarehouseUser ? userWarehouseId : warehouseId;
    if (!shipmentNumber || !targetWhId || !productId || !quantityReceived) {
      alert("Please fill in all required fields (Shipment #, Warehouse, Product, Quantity)");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedBilties = biltyRows
        .filter((r) => r.bilty_number && r.transporter_name && r.quantity)
        .map((r) => ({
          bilty_number: r.bilty_number,
          transporter_name: r.transporter_name,
          vehicle_number: r.vehicle_number,
          quantity: Number(r.quantity),
        }));

      const res = await fetch("/api/supply-chain/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipment_number: shipmentNumber,
          vessel_name: vesselName || "Bulk Cargo",
          origin_country: originCountry || "Domestic Supplier",
          port_facility_name: terminalName || "Inbound Receiving Bay",
          warehouse_id: targetWhId,
          product_id: productId,
          quantity_received: Number(quantityReceived),
          unit_of_measure: unitOfMeasure,
          bilties: formattedBilties,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setShipmentNumber("");
        setVesselName("");
        setOriginCountry("");
        setTerminalName("");
        setQuantityReceived("");
        setBiltyRows([{ bilty_number: "", transporter_name: "", vehicle_number: "", quantity: "" }]);
        fetchShipments();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to record shipment");
      }
    } catch (e) {
      console.error(e);
      alert("Error recording cargo arrival");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalReceivedVolume = shipments.reduce((sum, s) => sum + (s.quantity_received || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 p-4 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
              <Boxes className="h-3.5 w-3.5" /> Inbound Receiving & Bilty Splitting
            </div>
            <h1 className="mt-2 text-xl sm:text-3xl font-extrabold tracking-tight">Inbound Cargo Shipments</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Record bulk consignment arrivals, allocate bilties across transporters, and automatically credit stock balances.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchShipments}
              disabled={loading}
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <PermissionGuard module="inventory" action="create">
              <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 font-semibold text-white hover:bg-emerald-500 text-xs sm:text-sm">
                <Plus className="mr-1.5 sm:mr-2 h-4 w-4" /> Record Cargo
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-slate-800/80 pt-5">
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Total Cargo Shipments</div>
            <div className="text-xl font-bold text-white">{shipments.length} Arrivals</div>
          </div>
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Total Bulk Stock Received</div>
            <div className="text-xl font-bold text-emerald-400">{totalReceivedVolume.toLocaleString()} Tons</div>
          </div>
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Active Warehouses</div>
            <div className="text-xl font-bold text-teal-300">{warehouses.length} Facilities</div>
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
                placeholder="Search by shipment #, carrier, supplier origin, SKU or facility..."
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

      {/* Shipments Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Inbound Cargo Arrival Ledger</CardTitle>
              <CardDescription>All bulk consignment receipts, assigned facilities, and allocated bilties</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Showing {filteredShipments.length} shipments
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                  <TableHead className="font-semibold">Shipment #</TableHead>
                  <TableHead className="font-semibold">Carrier / Origin</TableHead>
                  <TableHead className="font-semibold">Receiving Warehouse</TableHead>
                  <TableHead className="font-semibold">Product SKU</TableHead>
                  <TableHead className="font-semibold text-right">Quantity Received</TableHead>
                  <TableHead className="font-semibold">Arrival Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedShipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No inbound cargo shipments found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedShipments.map((shp) => (
                    <TableRow key={shp._id} className="hover:bg-muted/40">
                      <TableCell className="font-mono font-bold text-primary">
                        {shp.shipment_number}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{shp.vessel_name || "Bulk Carrier"}</div>
                        <div className="text-xs text-muted-foreground">{shp.origin_country || "Supplier Origin"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {shp.warehouse_id?.warehouse_name || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {shp.warehouse_id?.warehouse_code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {shp.product_id?.product_name || "N/A"}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {shp.product_id?.sku}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {shp.quantity_received?.toLocaleString()} {shp.unit_of_measure || "Tons"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(shp.created_at).toLocaleDateString()} {new Date(shp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

      {/* Record Inbound Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleRecordShipment}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Boxes className="h-5 w-5 text-emerald-600" /> Record Inbound Cargo Arrival & Allocate Bilties
              </DialogTitle>
              <DialogDescription>
                Log incoming bulk tonnage and split total weight across transport bilties.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shipment_number" className="font-semibold">Shipment / Receipt # *</Label>
                  <Input
                    id="shipment_number"
                    placeholder="e.g. SHP-2026-001"
                    value={shipmentNumber}
                    onChange={(e) => setShipmentNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vessel_name" className="font-semibold">Carrier / Transport Truck Company</Label>
                  <Input
                    id="vessel_name"
                    placeholder="e.g. Asia Express Logistics"
                    value={vesselName}
                    onChange={(e) => setVesselName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin_country" className="font-semibold">Origin / Supplier</Label>
                  <Input
                    id="origin_country"
                    placeholder="e.g. Domestic Refinery / Port Hub"
                    value={originCountry}
                    onChange={(e) => setOriginCountry(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terminal_name" className="font-semibold">Receiving Dock / Gate</Label>
                  <Input
                    id="terminal_name"
                    placeholder="e.g. Gate 4 - Bulk Bay"
                    value={terminalName}
                    onChange={(e) => setTerminalName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {!isWarehouseUser ? (
                  <div className="space-y-2">
                    <Label htmlFor="warehouse_id" className="font-semibold">Receiving Warehouse Hub *</Label>
                    <Select value={warehouseId} onValueChange={(val) => setWarehouseId(val)} required>
                      <SelectTrigger id="warehouse_id">
                        <SelectValue placeholder="Select Warehouse" />
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
                    <Label className="font-semibold">Assigned Warehouse</Label>
                    <Input
                      disabled
                      value={
                        warehouses.find((w) => w._id === userWarehouseId)?.warehouse_name || "Your Assigned Warehouse"
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="product_id" className="font-semibold">Product SKU *</Label>
                  <Select value={productId} onValueChange={(val) => setProductId(val)} required>
                    <SelectTrigger id="product_id">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity_received" className="font-semibold">Total Quantity Received *</Label>
                  <Input
                    id="quantity_received"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 100"
                    value={quantityReceived}
                    onChange={(e) => setQuantityReceived(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_of_measure" className="font-semibold">Unit of Measure</Label>
                  <Select value={unitOfMeasure} onValueChange={(val) => setUnitOfMeasure(val)}>
                    <SelectTrigger id="unit_of_measure">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tons">Tons</SelectItem>
                      <SelectItem value="KG">Kilograms (KG)</SelectItem>
                      <SelectItem value="Bags">Bags (50KG)</SelectItem>
                      <SelectItem value="Cartons">Cartons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bilties Section */}
              <div className="rounded-xl border bg-slate-50 p-4 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-1.5">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Allocate Transport Bilties
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Divide the total quantity across multiple transport bilty numbers.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddBiltyRow}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Bilty
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {biltyRows.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-background p-2 rounded-lg border text-xs">
                      <div className="col-span-3">
                        <Input
                          placeholder="Bilty #"
                          value={row.bilty_number}
                          onChange={(e) => handleBiltyRowChange(idx, "bilty_number", e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Transporter Name"
                          value={row.transporter_name}
                          onChange={(e) => handleBiltyRowChange(idx, "transporter_name", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Vehicle #"
                          value={row.vehicle_number}
                          onChange={(e) => handleBiltyRowChange(idx, "vehicle_number", e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Qty"
                          value={row.quantity}
                          onChange={(e) => handleBiltyRowChange(idx, "quantity", e.target.value)}
                          className="h-8 text-xs font-bold"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        {biltyRows.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveBiltyRow(idx)}
                            className="h-7 w-7 text-rose-500 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {quantityReceived && (
                  <div className="flex justify-between items-center text-xs font-semibold pt-2 border-t">
                    <span className="text-muted-foreground">Total Bilty Allocated:</span>
                    <span
                      className={
                        totalBiltyAllocated === Number(quantityReceived)
                          ? "text-emerald-600 font-bold"
                          : totalBiltyAllocated > Number(quantityReceived)
                          ? "text-rose-600 font-bold"
                          : "text-amber-600 font-bold"
                      }
                    >
                      {totalBiltyAllocated} / {quantityReceived} {unitOfMeasure}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 font-semibold text-white hover:bg-emerald-500">
                {isSubmitting ? "Processing..." : "Record Inbound Cargo & Bilties"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
