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
import { PermissionGuard } from "@/components/permission-guard";

interface BiltiesClientViewProps {
  initialBilties: any[];
  warehouses: any[];
  products: any[];
  portShipments: any[];
  currentUser: any;
}

const PAGE_SIZE = 10;

export function BiltiesClientView({
  initialBilties,
  warehouses,
  products,
  portShipments,
  currentUser,
}: BiltiesClientViewProps) {
  const [bilties, setBilties] = useState(initialBilties);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const isWarehouseUser = currentUser?.role_id?.code === "warehouse_manager" || currentUser?.role_id?.code === "warehouse_operator";
  const userWarehouseId = currentUser?.assigned_warehouse_id?._id || currentUser?.assigned_warehouse_id;

  // Filter bilties
  const filteredBilties = bilties.filter((bilty) => {
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
        setBilties(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = bilties.filter((b) => b.status === "active").length;
  const exhaustedCount = bilties.filter((b) => b.status === "exhausted").length;
  const totalBiltyVolume = bilties.reduce((sum, b) => sum + (b.initial_quantity || 0), 0);
  const remainingBiltyVolume = bilties.reduce((sum, b) => sum + (b.remaining_quantity || 0), 0);

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
      <Card>
        <CardContent className="pt-6">
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
                    {warehouses.map((w) => (
                      <SelectItem key={w._id} value={w._id}>
                        {w.warehouse_name} ({w.warehouse_code})
                      </SelectItem>
                    ))}
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
                  <TableHead className="font-semibold">Facility / Warehouse</TableHead>
                  <TableHead className="font-semibold">Product SKU</TableHead>
                  <TableHead className="font-semibold">Transporter & Vehicle</TableHead>
                  <TableHead className="font-semibold text-right">Initial Stock</TableHead>
                  <TableHead className="font-semibold text-right">Dispatched</TableHead>
                  <TableHead className="font-semibold text-right">Remaining Balance</TableHead>
                  <TableHead className="font-semibold">Utilization</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBilties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      No transport bilty records found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBilties.map((bilty) => {
                    const init = bilty.initial_quantity || 1;
                    const rem = bilty.remaining_quantity || 0;
                    const usedPct = Math.min(100, Math.max(0, Math.round(((init - rem) / init) * 100)));

                    return (
                      <TableRow key={bilty._id} className="hover:bg-muted/40">
                        <TableCell className="font-mono font-bold text-primary">
                          {bilty.bilty_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 font-medium">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {bilty.warehouse_id?.warehouse_name || "Unassigned"}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {bilty.warehouse_id?.warehouse_code}
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
                        <TableCell>
                          <div className="font-medium">{bilty.transporter_name}</div>
                          {bilty.vehicle_number && (
                            <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <Truck className="h-3 w-3" /> {bilty.vehicle_number}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {bilty.initial_quantity?.toLocaleString()} {bilty.unit_of_measure || "Tons"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-rose-600 dark:text-rose-400">
                          {bilty.dispatched_quantity?.toLocaleString() || 0} {bilty.unit_of_measure || "Tons"}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {bilty.remaining_quantity?.toLocaleString()} {bilty.unit_of_measure || "Tons"}
                        </TableCell>
                        <TableCell className="w-[140px]">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground font-medium">
                              <span>{usedPct}% shipped</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  usedPct >= 90
                                    ? "bg-rose-500"
                                    : usedPct >= 50
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${usedPct}%` }}
                              />
                            </div>
                          </div>
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
    </div>
  );
}
