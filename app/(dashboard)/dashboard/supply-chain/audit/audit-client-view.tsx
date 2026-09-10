"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, History, RefreshCw, Building2, ArrowRight, FileSpreadsheet, ShieldCheck, UserCheck } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface AuditClientViewProps {
  initialMovements: any[];
  warehouses: any[];
  products: any[];
  currentUser: any;
}

const PAGE_SIZE = 12;

const ensureArray = <T = any,>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export function AuditClientView({ initialMovements, warehouses, products, currentUser }: AuditClientViewProps) {
  const [movements, setMovements] = useState<any[]>(() => ensureArray(initialMovements));
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const isWarehouseUser = currentUser?.role_id?.code === "warehouse_manager" || currentUser?.role_id?.code === "warehouse_operator";
  const userWarehouseId = currentUser?.assigned_warehouse_id?._id || currentUser?.assigned_warehouse_id;

  const safeMovements = ensureArray(movements);

  const filteredMovements = safeMovements.filter((mov) => {
    if (isWarehouseUser && userWarehouseId) {
      const fromId = mov.from_warehouse?._id || mov.from_warehouse;
      const toId = mov.to_warehouse?._id || mov.to_warehouse;
      if (fromId !== userWarehouseId && toId !== userWarehouseId) return false;
    }

    if (typeFilter !== "all" && mov.movement_type !== typeFilter) return false;
    if (warehouseFilter !== "all") {
      const fromId = mov.from_warehouse?._id || mov.from_warehouse;
      const toId = mov.to_warehouse?._id || mov.to_warehouse;
      if (fromId !== warehouseFilter && toId !== warehouseFilter) return false;
    }

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      mov.product_id?.product_name?.toLowerCase().includes(term) ||
      mov.product_id?.sku?.toLowerCase().includes(term) ||
      mov.bilty_number?.toLowerCase().includes(term) ||
      mov.bilty_id?.bilty_number?.toLowerCase().includes(term) ||
      mov.reason?.toLowerCase().includes(term) ||
      mov.notes?.toLowerCase().includes(term) ||
      mov.created_by?.name?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredMovements.length / PAGE_SIZE) || 1;
  const paginatedMovements = filteredMovements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supply-chain/audit");
      if (res.ok) {
        const data = await res.json();
        setMovements(ensureArray(data));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-950 p-4 sm:p-6 text-white shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-700/50 px-3 py-1 text-xs font-semibold text-slate-300 backdrop-blur-md">
              <History className="h-3.5 w-3.5" /> Irreversible Stock Audit Ledger
            </div>
            <h1 className="mt-2 text-xl sm:text-3xl font-extrabold tracking-tight">Stock Movement Audit Trail</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Complete immutably logged trail of all inbound arrivals, bilty dispatches, repackaging conversions, and transfers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMovements}
              disabled={loading}
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 border-t border-slate-800/80 pt-5">
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Total Audited Events</div>
            <div className="text-xl font-bold text-white">{safeMovements.length} Events</div>
          </div>
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Inbound Arrivals</div>
            <div className="text-xl font-bold text-emerald-400">
              {safeMovements.filter((m) => m.movement_type === "inbound_port" || m.movement_type === "inbound_cargo" || m.movement_type === "purchase_receive").length} Events
            </div>
          </div>
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Bilty Sales Dispatches</div>
            <div className="text-xl font-bold text-rose-400">
              {safeMovements.filter((m) => m.movement_type === "outbound_sale" || m.movement_type === "bilty_dispatch").length} Events
            </div>
          </div>
          <div className="rounded-lg bg-slate-800/40 p-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400">Repackaging Conversions</div>
            <div className="text-xl font-bold text-purple-400">
              {safeMovements.filter((m) => m.movement_type === "repackaging_out" || m.movement_type === "repackaging_in").length} Events
            </div>
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
                placeholder="Search by SKU, product name, bilty #, operator or notes..."
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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Movement Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Movement Types</SelectItem>
                  <SelectItem value="inbound_port">Inbound Cargo Arrival</SelectItem>
                  <SelectItem value="outbound_sale">Outbound Bilty Dispatch</SelectItem>
                  <SelectItem value="repackaging_out">Repackaging Source (Out)</SelectItem>
                  <SelectItem value="repackaging_in">Repackaging Yield (In)</SelectItem>
                  <SelectItem value="transfer_in">Transfer Receipt</SelectItem>
                  <SelectItem value="transfer_out">Transfer Dispatch</SelectItem>
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
                    <SelectValue placeholder="Facility Hub" />
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

      {/* Audit Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Stock Movement Ledger</CardTitle>
              <CardDescription>Timestamped stock transactions with before & after audit balances</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Showing {filteredMovements.length} audit entries
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Product SKU</TableHead>
                  <TableHead className="font-semibold">Facility / Location</TableHead>
                  <TableHead className="font-semibold">Bilty # Reference</TableHead>
                  <TableHead className="font-semibold text-right">Qty Movement</TableHead>
                  <TableHead className="font-semibold text-right">Audit Balance</TableHead>
                  <TableHead className="font-semibold">Log Notes & User</TableHead>
                  <TableHead className="font-semibold">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No stock movement audit records found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMovements.map((mov) => {
                    const isPositive = mov.quantity > 0;
                    const biltyNum = mov.bilty_id?.bilty_number || mov.bilty_number;

                    return (
                      <TableRow key={mov._id} className="hover:bg-muted/40 text-xs">
                        <TableCell>
                          {(() => {
                            const type = mov.movement_type;
                            let sapMvt = "MvT 311";
                            if (type === "inbound") sapMvt = "MvT 101 (GRN)";
                            else if (type === "repackage") sapMvt = "MvT 261/309 (Yield)";
                            else if (type === "transfer_out") sapMvt = "MvT 351 (STO Dispatch)";
                            else if (type === "transfer_in") sapMvt = "MvT 101 (STO Receipt)";
                            else if (type === "outbound") sapMvt = "MvT 601 (Goods Issue)";
                            else if (type === "adjustment") sapMvt = "MvT 701/702 (Phys Inv)";

                            return (
                              <div className="flex flex-col gap-1">
                                <Badge
                                  variant="outline"
                                  className={
                                    type.includes("inbound") || type.includes("in")
                                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 font-semibold text-[10px]"
                                      : type.includes("outbound") || type.includes("out")
                                      ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400 font-semibold text-[10px]"
                                      : "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400 font-semibold text-[10px]"
                                  }
                                >
                                  {sapMvt}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-mono">{type}</span>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {mov.product_id?.product_name || "N/A"}
                          </div>
                          <div className="font-mono text-muted-foreground">{mov.product_id?.sku}</div>
                        </TableCell>
                        <TableCell>
                          {mov.to_warehouse && (
                            <div className="flex items-center gap-1 font-medium">
                              <Building2 className="h-3 w-3 text-emerald-600" />
                              {mov.to_warehouse.warehouse_name}
                            </div>
                          )}
                          {mov.from_warehouse && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Building2 className="h-3 w-3 text-rose-500" />
                              From: {mov.from_warehouse.warehouse_name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {biltyNum ? (
                            <div className="inline-flex items-center gap-1 font-mono font-bold text-blue-600 dark:text-blue-400">
                              <FileSpreadsheet className="h-3.5 w-3.5" /> {biltyNum}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          <span className={isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                            {isPositive ? `+${mov.quantity}` : mov.quantity} {mov.product_id?.unit_of_measure || "Units"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {mov.previous_stock !== undefined && mov.new_stock !== undefined ? (
                            <span>
                              {mov.previous_stock} <ArrowRight className="inline h-3 w-3 text-muted-foreground" />{" "}
                              <span className="font-bold text-slate-900 dark:text-slate-100">{mov.new_stock}</span>
                            </span>
                          ) : (
                            <span>—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {mov.reason || mov.notes || "Standard Ledger Entry"}
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1">
                            <UserCheck className="h-3 w-3" /> {mov.created_by?.name || "System"}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(mov.created_at).toLocaleDateString()} {new Date(mov.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
