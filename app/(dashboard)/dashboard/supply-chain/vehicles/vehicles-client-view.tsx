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
import { Search, Truck, Plus, RefreshCw, Building2, User, Phone, CheckCircle2, ShieldCheck } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PermissionGuard } from "@/components/permission-guard";

interface VehiclesClientViewProps {
  initialVehicles: any[];
  warehouses: any[];
  currentUser: any;
}

const PAGE_SIZE = 10;

export function VehiclesClientView({ initialVehicles, warehouses, currentUser }: VehiclesClientViewProps) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New vehicle form state
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<string>("truck");
  const [transporterCompany, setTransporterCompany] = useState("");
  const [capacityTons, setCapacityTons] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWarehouseUser = currentUser?.role_id?.code === "warehouse_manager" || currentUser?.role_id?.code === "warehouse_operator";
  const userWarehouseId = currentUser?.assigned_warehouse_id?._id || currentUser?.assigned_warehouse_id;

  const filteredVehicles = vehicles.filter((veh) => {
    if (isWarehouseUser && userWarehouseId) {
      if (veh.warehouse_id?._id !== userWarehouseId) return false;
    }
    if (typeFilter !== "all" && veh.vehicle_type !== typeFilter) return false;
    if (statusFilter !== "all" && veh.status !== statusFilter) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      veh.vehicle_number?.toLowerCase().includes(term) ||
      veh.transporter_company?.toLowerCase().includes(term) ||
      veh.driver?.name?.toLowerCase().includes(term) ||
      veh.driver?.phone?.toLowerCase().includes(term) ||
      veh.warehouse_id?.warehouse_name?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredVehicles.length / PAGE_SIZE) || 1;
  const paginatedVehicles = filteredVehicles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supply-chain/vehicles");
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber || !transporterCompany) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/supply-chain/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_number: vehicleNumber,
          vehicle_type: vehicleType,
          transporter_company: transporterCompany,
          capacity_tons: Number(capacityTons) || 0,
          driver: {
            name: driverName,
            phone: driverPhone,
            license_number: driverLicense,
          },
          warehouse_id: warehouseId || (isWarehouseUser ? userWarehouseId : undefined),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setVehicleNumber("");
        setTransporterCompany("");
        setCapacityTons("");
        setDriverName("");
        setDriverPhone("");
        setDriverLicense("");
        fetchVehicles();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to register vehicle");
      }
    } catch (e) {
      console.error(e);
      alert("Error submitting vehicle registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCapacity = vehicles.reduce((sum, v) => sum + (v.capacity_tons || 0), 0);
  const activeCount = vehicles.filter((v) => v.status === "active").length;
  const inTransitCount = vehicles.filter((v) => v.status === "in_transit").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-4 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md">
              <Truck className="h-3.5 w-3.5" /> Transporter & Fleet Telematics
            </div>
            <h1 className="mt-2 text-xl sm:text-3xl font-extrabold tracking-tight">Supply Chain Fleet Vehicles</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Manage heavy transport trucks, trailers, tankers, containers, assigned drivers, and warehouse hub logistics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchVehicles}
              disabled={loading}
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <PermissionGuard module="inventory" action="create">
              <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 font-semibold text-white hover:bg-blue-500 text-xs sm:text-sm">
                <Plus className="mr-1.5 sm:mr-2 h-4 w-4" /> Register Vehicle
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Fleet KPI Grid */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 border-t border-slate-800/80 pt-5">
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Total Registered Fleet</div>
            <div className="text-xl font-bold text-white">{vehicles.length} Vehicles</div>
          </div>
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Active & Ready</div>
            <div className="text-xl font-bold text-emerald-400">{activeCount} Vehicles</div>
          </div>
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">In-Transit Carrying Cargo</div>
            <div className="text-xl font-bold text-amber-400">{inTransitCount} Vehicles</div>
          </div>
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Total Fleet Haulage Capacity</div>
            <div className="text-xl font-bold text-blue-400">{totalCapacity.toLocaleString()} Tons</div>
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
                placeholder="Search vehicle reg #, transporter company, driver name or phone..."
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
                value={typeFilter}
                onValueChange={(val) => {
                  setTypeFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Vehicle Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicle Types</SelectItem>
                  <SelectItem value="truck">Heavy Truck</SelectItem>
                  <SelectItem value="trailer">Multi-Axle Trailer</SelectItem>
                  <SelectItem value="container">Cargo Container</SelectItem>
                  <SelectItem value="tanker">Liquid Tanker</SelectItem>
                  <SelectItem value="van">Commercial Van</SelectItem>
                </SelectContent>
              </Select>

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
                  <SelectItem value="in_transit">In-Transit</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Fleet Vehicles Registry</CardTitle>
              <CardDescription>All registered transport vehicles, capacity metrics, and driver assignments</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Showing {filteredVehicles.length} vehicles
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                  <TableHead className="font-semibold">Vehicle Reg #</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Transporter Company</TableHead>
                  <TableHead className="font-semibold text-right">Payload Capacity</TableHead>
                  <TableHead className="font-semibold">Assigned Driver</TableHead>
                  <TableHead className="font-semibold">Home Terminal / Warehouse</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No vehicles found matching your criteria. Click "Register Vehicle" to add fleet transport units.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVehicles.map((veh) => (
                    <TableRow key={veh._id} className="hover:bg-muted/40">
                      <TableCell className="font-mono font-bold text-primary">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-blue-600" />
                          {veh.vehicle_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs font-semibold">
                          {veh.vehicle_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                        {veh.transporter_company}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                        {veh.capacity_tons} Tons
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                            {veh.driver?.name || "Unassigned"}
                          </span>
                          {veh.driver?.phone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                              <Phone className="h-3 w-3" /> {veh.driver.phone}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {veh.warehouse_id ? (
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {veh.warehouse_id.warehouse_name}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Global Fleet Pool</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            veh.status === "active"
                              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                              : veh.status === "in_transit"
                              ? "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }
                        >
                          {veh.status === "active" ? "Active" : veh.status === "in_transit" ? "In Transit" : veh.status}
                        </Badge>
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

      {/* Register Vehicle Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <form onSubmit={handleRegisterVehicle}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Truck className="h-5 w-5 text-blue-600" /> Register Fleet Transport Vehicle
              </DialogTitle>
              <DialogDescription>
                Add a heavy truck, trailer, tanker, or cargo container to your logistics network pool.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_number" className="font-semibold">Vehicle Registration # *</Label>
                  <Input
                    id="vehicle_number"
                    placeholder="e.g. KBL-8821, T-4921"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type" className="font-semibold">Vehicle Category *</Label>
                  <Select value={vehicleType} onValueChange={(val) => setVehicleType(val)}>
                    <SelectTrigger id="vehicle_type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="truck">Heavy Freight Truck</SelectItem>
                      <SelectItem value="trailer">Multi-Axle Flatbed Trailer</SelectItem>
                      <SelectItem value="container">Cargo Container Truck</SelectItem>
                      <SelectItem value="tanker">Liquid Bulk Tanker</SelectItem>
                      <SelectItem value="van">Commercial Freight Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transporter_company" className="font-semibold">Transporter Company / Fleet *</Label>
                  <Input
                    id="transporter_company"
                    placeholder="e.g. Express Freight Logistics"
                    value={transporterCompany}
                    onChange={(e) => setTransporterCompany(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity_tons" className="font-semibold">Payload Capacity (Tons)</Label>
                  <Input
                    id="capacity_tons"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 30"
                    value={capacityTons}
                    onChange={(e) => setCapacityTons(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-lg border p-3 bg-muted/30 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Assigned Driver Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="driver_name" className="text-xs">Driver Full Name</Label>
                    <Input
                      id="driver_name"
                      placeholder="e.g. Muhammad Ali"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver_phone" className="text-xs">Driver Contact Phone</Label>
                    <Input
                      id="driver_phone"
                      placeholder="e.g. +92 300 1234567"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              {!isWarehouseUser && (
                <div className="space-y-2">
                  <Label htmlFor="warehouse_id" className="font-semibold">Home Terminal / Warehouse Hub</Label>
                  <Select value={warehouseId} onValueChange={(val) => setWarehouseId(val)}>
                    <SelectTrigger id="warehouse_id">
                      <SelectValue placeholder="Select home warehouse (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Facilities (Global Fleet Pool)</SelectItem>
                      {warehouses.map((w) => (
                        <SelectItem key={w._id} value={w._id}>
                          {w.warehouse_name} ({w.warehouse_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 font-semibold text-white hover:bg-blue-500">
                {isSubmitting ? "Registering..." : "Register Vehicle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
