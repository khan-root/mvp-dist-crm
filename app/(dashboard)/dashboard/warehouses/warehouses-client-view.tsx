"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Warehouse as WarehouseIcon, Plus, ArrowLeftRight, Building2, MapPin, Phone, ShieldCheck, Thermometer, Loader2 } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { toast } from "sonner";

import { toastApiError } from "@/lib/utils";

import { PermissionGuard } from "@/components/permission-guard";

interface WarehouseItem {
  _id: string;
  warehouse_code: string;
  warehouse_name: string;
  distributor_id?: string;
  address?: { line1?: string; city?: string; state?: string };
  contact?: { manager_name?: string; phone?: string; email?: string };
  capacity?: { total_area_sqft?: number; max_pallets?: number; temperature_controlled?: boolean };
}

interface WarehousesClientViewProps {
  initialWarehouses: WarehouseItem[];
  initialTotalRecords?: number;
  distributors: any[];
  products: any[];
}

export function WarehousesClientView({
  initialWarehouses = [],
  initialTotalRecords = 0,
  distributors = [],
  products = [],
}: WarehousesClientViewProps) {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>(initialWarehouses);
  const [totalRecords, setTotalRecords] = useState<number>(initialTotalRecords || initialWarehouses.length);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Add Warehouse Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({
    distributor_id: distributors[0]?._id || "",
    warehouse_name: "",
    warehouse_code: "",
    line1: "",
    city: "Peshawar",
    state: "KPK",
    manager_name: "",
    phone: "",
    email: "",
    total_area_sqft: 5000,
    max_pallets: 100,
    temperature_controlled: false,
  });

  // Inter-warehouse Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    from_warehouse_id: "",
    to_warehouse_id: "",
    product_id: "",
    quantity: 10,
    reason: "Inter-warehouse stock rebalancing",
  });
  const [transferring, setTransferring] = useState(false);

  const fetchPage = async (page: number) => {
    try {
      const res = await fetch(`/api/warehouses?page=${page}&limit=${pageSize}`);
      const data = await res.json();
      if (res.ok) {
        setWarehouses(data.data || []);
        if (typeof data.total === "number") setTotalRecords(data.total);
      } else {
        toastApiError(toast, data, "Failed to load warehouses");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch page");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchPage(page);
  };

  const [creating, setCreating] = useState(false);

  const handleCreateWarehouse = async () => {
    if (!warehouseForm.warehouse_name || !warehouseForm.warehouse_code) {
      toast.error("Warehouse name and code are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distributor_id: warehouseForm.distributor_id || distributors[0]?._id || "",
          warehouse_name: warehouseForm.warehouse_name,
          warehouse_code: warehouseForm.warehouse_code,
          address: { line1: warehouseForm.line1 || "Market Hub", city: warehouseForm.city, state: warehouseForm.state },
          contact: { manager_name: warehouseForm.manager_name, phone: warehouseForm.phone, email: warehouseForm.email },
          capacity: {
            total_area_sqft: Number(warehouseForm.total_area_sqft),
            max_pallets: Number(warehouseForm.max_pallets),
            temperature_controlled: warehouseForm.temperature_controlled,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Warehouse Hub created successfully");
        fetchPage(currentPage);
        setIsAddModalOpen(false);
      } else {
        toastApiError(toast, data, "Failed to create warehouse");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleTransferStock = async () => {
    if (!transferForm.from_warehouse_id || !transferForm.to_warehouse_id || !transferForm.product_id) {
      toast.error("Please select source, destination warehouse and product");
      return;
    }
    setTransferring(true);
    try {
      const res = await fetch("/api/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setIsTransferModalOpen(false);
      } else {
        toastApiError(toast, data, "Stock transfer failed");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTransferring(false);
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  const totalArea = warehouses.reduce((acc, w) => acc + (w.capacity?.total_area_sqft || 0), 0);
  const tempControlledCount = warehouses.filter((w) => w.capacity?.temperature_controlled).length;

  return (
    <PermissionGuard module="inventory">
      <div className="space-y-6 w-full">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <WarehouseIcon className="size-6 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight">Enterprise Warehouse Hub Studio</h1>
          </div>
          <p className="text-sm text-slate-300">
            Multi-warehouse logistics, inter-hub stock transfers, capacity monitoring & cold chain management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 font-semibold gap-2 cursor-pointer">
                <ArrowLeftRight className="size-4 text-emerald-400" /> Inter-Warehouse Transfer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Inter-Warehouse Stock Transfer</DialogTitle>
                <DialogDescription>Rebalance inventory levels between primary distribution hubs</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Select Target Product SKU</Label>
                  <select
                    value={transferForm.product_id}
                    onChange={(e) => setTransferForm({ ...transferForm, product_id: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-medium"
                  >
                    <option value="">-- Choose Product SKU --</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.product_name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">From Warehouse (Source)</Label>
                    <select
                      value={transferForm.from_warehouse_id}
                      onChange={(e) => setTransferForm({ ...transferForm, from_warehouse_id: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-medium"
                    >
                      <option value="">-- Source --</option>
                      {warehouses.map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.warehouse_name} ({w.warehouse_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">To Warehouse (Dest)</Label>
                    <select
                      value={transferForm.to_warehouse_id}
                      onChange={(e) => setTransferForm({ ...transferForm, to_warehouse_id: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-medium"
                    >
                      <option value="">-- Destination --</option>
                      {warehouses.map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.warehouse_name} ({w.warehouse_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Transfer Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={transferForm.quantity}
                    onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Reason / Audit Note</Label>
                  <Input
                    value={transferForm.reason}
                    onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setIsTransferModalOpen(false)} disabled={transferring}>
                  Cancel
                </Button>
                <Button onClick={handleTransferStock} disabled={transferring} className="bg-emerald-600 text-white font-bold cursor-pointer">
                  {transferring ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" /> Processing...
                    </span>
                  ) : (
                    "Confirm Stock Transfer"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2 shadow-md cursor-pointer">
                <Plus className="size-4" /> Add Warehouse Hub
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Add Warehouse Hub</DialogTitle>
                <DialogDescription>Register a new storage hub, fulfillment center, or cold storage facility</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Warehouse Name *</Label>
                    <Input
                      placeholder="e.g. Peshawar Central Hub"
                      value={warehouseForm.warehouse_name}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, warehouse_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Warehouse Code *</Label>
                    <Input
                      placeholder="e.g. WH-PEW-01"
                      value={warehouseForm.warehouse_code}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, warehouse_code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">City</Label>
                    <Input
                      value={warehouseForm.city}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">State / Province</Label>
                    <Input
                      value={warehouseForm.state}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Manager Name</Label>
                    <Input
                      value={warehouseForm.manager_name}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, manager_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Manager Phone</Label>
                    <Input
                      value={warehouseForm.phone}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Capacity (sqft)</Label>
                    <Input
                      type="number"
                      value={warehouseForm.total_area_sqft}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, total_area_sqft: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Max Pallets</Label>
                    <Input
                      type="number"
                      value={warehouseForm.max_pallets}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, max_pallets: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-slate-900">Cold Storage / Temp Controlled</Label>
                    <p className="text-[11px] text-slate-500">Requires temperature monitoring for pharma/perishables</p>
                  </div>
                  <Switch
                    checked={warehouseForm.temperature_controlled}
                    onCheckedChange={(checked) => setWarehouseForm({ ...warehouseForm, temperature_controlled: checked })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={creating}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWarehouse} disabled={creating} className="bg-emerald-600 text-white font-bold cursor-pointer">
                  {creating ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" /> Saving Hub...
                    </span>
                  ) : (
                    "Save Warehouse Hub"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Warehouse Hubs</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Building2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">{warehouses.length}</div>
            <p className="text-xs text-slate-500 mt-1">Active storage & distribution centers</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Storage Capacity</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <WarehouseIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">{totalArea.toLocaleString()} sqft</div>
            <p className="text-xs text-slate-500 mt-1">Combined floor area across all hubs</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cold Chain Hubs</CardTitle>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
              <Thermometer className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-sky-600">{tempControlledCount} Hubs</div>
            <p className="text-xs text-slate-500 mt-1">Temperature controlled facilities</p>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Hub Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900">All Registered Warehouse Hubs ({totalRecords})</CardTitle>
          <CardDescription>Primary storage facilities, manager contact info, and capacity presets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {warehouses.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No warehouses registered yet. Click Add Warehouse Hub to create one.</div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Warehouse Name</TableHead>
                    <TableHead className="font-semibold">Location / City</TableHead>
                    <TableHead className="font-semibold">Manager Contact</TableHead>
                    <TableHead className="font-semibold">Capacity (sqft)</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((w) => (
                    <TableRow key={w._id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-emerald-700">{w.warehouse_code}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{w.warehouse_name}</TableCell>
                      <TableCell className="text-xs text-slate-600">
                        📍 {[w.address?.line1, w.address?.city, w.address?.state].filter(Boolean).join(", ") || "Market Hub"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        👤 {w.contact?.manager_name || "Manager"} {w.contact?.phone ? `(📞 ${w.contact.phone})` : ""}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold text-slate-800">
                        {w.capacity?.total_area_sqft?.toLocaleString() || "5,000"} sqft ({w.capacity?.max_pallets || 100} pallets)
                      </TableCell>
                      <TableCell>
                        {w.capacity?.temperature_controlled ? (
                          <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-300 gap-1 text-xs">
                            <Thermometer className="size-3" /> Cold Chain
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs">
                            Standard
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTransferForm((prev) => ({ ...prev, from_warehouse_id: w._id }));
                            setIsTransferModalOpen(true);
                          }}
                          className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 cursor-pointer gap-1"
                        >
                          <ArrowLeftRight className="size-3" /> Transfer Stock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalRecords={totalRecords}
                pageSize={pageSize}
              />
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </PermissionGuard>
  );
}
