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
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Ship,
  Boxes,
  Truck,
  ShoppingCart,
  History,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  PackageCheck,
  Building2,
  FileSpreadsheet,
} from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PermissionGuard } from "@/components/permission-guard";

interface ProductData {
  _id: string;
  product_name: string;
  sku: string;
  unit_of_measure: string;
}

interface WarehouseData {
  _id: string;
  warehouse_name: string;
  warehouse_code: string;
}

interface PortShipmentData {
  _id: string;
  shipment_number: string;
  vessel_name: string;
  origin_country: string;
  port_facility_name: string;
  warehouse_id: { _id: string; warehouse_name: string; warehouse_code: string };
  product_id: { _id: string; product_name: string; sku: string; unit_of_measure: string };
  quantity_received: number;
  unit_of_measure: string;
  received_by_name?: string;
  created_at: string;
}

interface RepackagingOrderData {
  _id: string;
  order_number: string;
  port_facility_name: string;
  source_warehouse_id: { _id: string; warehouse_name: string; warehouse_code: string };
  source_product_id: { _id: string; product_name: string; sku: string; unit_of_measure: string };
  source_quantity_used: number;
  target_product_id: { _id: string; product_name: string; sku: string; unit_of_measure: string };
  target_quantity_produced: number;
  conversion_ratio: string;
  operator_name?: string;
  created_at: string;
}

interface StockMovementData {
  _id: string;
  movement_type: string;
  product_id: { _id: string; product_name: string; sku: string; unit_of_measure: string };
  from_warehouse?: { _id: string; warehouse_name: string; warehouse_code: string };
  to_warehouse?: { _id: string; warehouse_name: string; warehouse_code: string };
  quantity: number;
  previous_stock?: number;
  new_stock?: number;
  reason?: string;
  notes?: string;
  created_by?: { name: string; email: string };
  created_at: string;
}

const PAGE_SIZE = 10;

export function SupplyChainClientView({
  initialProducts,
  initialWarehouses,
  initialPortShipments,
  initialRepackagingOrders,
  initialStockMovements,
  initialUsers,
}: {
  initialProducts: ProductData[];
  initialWarehouses: WarehouseData[];
  initialPortShipments: PortShipmentData[];
  initialRepackagingOrders: RepackagingOrderData[];
  initialStockMovements: StockMovementData[];
  initialUsers: any[];
}) {
  const [products] = useState<ProductData[]>(initialProducts);
  const [warehouses] = useState<WarehouseData[]>(initialWarehouses);
  const [portShipments, setPortShipments] = useState<PortShipmentData[]>(initialPortShipments);
  const [repackagingOrders, setRepackagingOrders] = useState<RepackagingOrderData[]>(initialRepackagingOrders);
  const [stockMovements, setStockMovements] = useState<StockMovementData[]>(initialStockMovements);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal States
  const [shipmentModalOpen, setShipmentModalOpen] = useState(false);
  const [repackageModalOpen, setRepackageModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [outboundModalOpen, setOutboundModalOpen] = useState(false);

  // Port Shipment Form State
  const [vesselName, setVesselName] = useState("");
  const [originCountry, setOriginCountry] = useState("International Sea Port");
  const [portFacilityName, setPortFacilityName] = useState("Karachi Port Terminal Facility");
  const [shipmentWarehouseId, setShipmentWarehouseId] = useState("");
  const [shipmentProductId, setShipmentProductId] = useState("");
  const [shipmentQty, setShipmentQty] = useState("");
  const [submittingShipment, setSubmittingShipment] = useState(false);

  // Repackaging Form State
  const [repackageWarehouseId, setRepackageWarehouseId] = useState("");
  const [sourceProductId, setSourceProductId] = useState("");
  const [sourceQty, setSourceQty] = useState("");
  const [targetProductId, setTargetProductId] = useState("");
  const [targetQty, setTargetQty] = useState("");
  const [conversionRatioText, setConversionRatioText] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [submittingRepackage, setSubmittingRepackage] = useState(false);

  // Transfer Form State
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [transferProductId, setTransferProductId] = useState("");
  const [transferQty, setTransferQty] = useState("");
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  // Outbound Form State
  const [outboundWarehouseId, setOutboundWarehouseId] = useState("");
  const [outboundProductId, setOutboundProductId] = useState("");
  const [outboundQty, setOutboundQty] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [submittingOutbound, setSubmittingOutbound] = useState(false);

  // Pagination states
  const [shipmentPage, setShipmentPage] = useState(1);
  const [repackagePage, setRepackagePage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);

  // Search/Filter for Audit Trail
  const [auditQuery, setAuditQuery] = useState("");
  const [auditTypeFilter, setAuditTypeFilter] = useState("all");

  // Handlers
  async function handleCreatePortShipment(e: React.FormEvent) {
    e.preventDefault();
    if (!vesselName.trim() || !shipmentWarehouseId || !shipmentProductId || !shipmentQty) return;

    setSubmittingShipment(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/supply-chain/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          vessel_name: vesselName.trim(),
          origin_country: originCountry.trim() || "International Sea Port",
          port_facility_name: portFacilityName.trim() || "Karachi Port Terminal Facility",
          warehouse_id: shipmentWarehouseId,
          product_id: shipmentProductId,
          quantity_received: parseFloat(shipmentQty),
          unit_of_measure: products.find((p) => p._id === shipmentProductId)?.unit_of_measure || "Tons",
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: d.error || "Failed to record port shipment" });
        return;
      }

      setFeedback({ type: "success", text: `Inbound Port Shipment "${d.data.shipment_number}" recorded successfully!` });
      setShipmentModalOpen(false);
      setVesselName("");
      setShipmentQty("");
      refreshData();
    } catch {
      setFeedback({ type: "error", text: "Network error recording shipment" });
    } finally {
      setSubmittingShipment(false);
    }
  }

  async function handleCreateRepackage(e: React.FormEvent) {
    e.preventDefault();
    if (!repackageWarehouseId || !sourceProductId || !sourceQty || !targetProductId || !targetQty) return;

    setSubmittingRepackage(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/supply-chain/repackage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          port_facility_name: portFacilityName,
          source_warehouse_id: repackageWarehouseId,
          source_product_id: sourceProductId,
          source_quantity_used: parseFloat(sourceQty),
          target_product_id: targetProductId,
          target_quantity_produced: parseFloat(targetQty),
          conversion_ratio: conversionRatioText || `1 Bulk Unit -> ${(parseFloat(targetQty) / parseFloat(sourceQty)).toFixed(1)} Packets`,
          operator_name: operatorName || "Port Repackaging Specialist",
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: d.error || "Failed to execute repackaging operation" });
        return;
      }

      setFeedback({ type: "success", text: `Repackaging Order "${d.data.order_number}" completed! Stock updated in real-time.` });
      setRepackageModalOpen(false);
      setSourceQty("");
      setTargetQty("");
      refreshData();
    } catch {
      setFeedback({ type: "error", text: "Network error executing repackaging operation" });
    } finally {
      setSubmittingRepackage(false);
    }
  }

  async function handleCreateTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!fromWarehouseId || !toWarehouseId || !transferProductId || !transferQty) return;
    if (fromWarehouseId === toWarehouseId) {
      setFeedback({ type: "error", text: "Source and destination warehouses cannot be the same." });
      return;
    }

    setSubmittingTransfer(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          from_warehouse_id: fromWarehouseId,
          to_warehouse_id: toWarehouseId,
          product_id: transferProductId,
          quantity: parseFloat(transferQty),
          notes: "Inter-Warehouse Packet Stock Distribution",
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: d.error || "Failed to execute inter-warehouse transfer" });
        return;
      }

      setFeedback({ type: "success", text: `Transfer completed successfully! Packet stock moved from origin to target warehouse.` });
      setTransferModalOpen(false);
      setTransferQty("");
      refreshData();
    } catch {
      setFeedback({ type: "error", text: "Network error executing transfer" });
    } finally {
      setSubmittingTransfer(false);
    }
  }

  async function handleCreateOutbound(e: React.FormEvent) {
    e.preventDefault();
    if (!outboundWarehouseId || !outboundProductId || !outboundQty || !buyerName.trim()) return;

    setSubmittingOutbound(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/supply-chain/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          warehouse_id: outboundWarehouseId,
          product_id: outboundProductId,
          quantity: parseFloat(outboundQty),
          destination_buyer_market: buyerName.trim(),
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: d.error || "Failed to execute outbound sales dispatch" });
        return;
      }

      setFeedback({ type: "success", text: `Outbound sales dispatch completed cleanly!` });
      setOutboundModalOpen(false);
      setOutboundQty("");
      setBuyerName("");
      refreshData();
    } catch {
      setFeedback({ type: "error", text: "Network error executing outbound sales dispatch" });
    } finally {
      setSubmittingOutbound(false);
    }
  }

  async function refreshData() {
    try {
      const [shipRes, repRes, movRes] = await Promise.all([
        fetch("/api/supply-chain/shipments", { credentials: "include" }),
        fetch("/api/supply-chain/repackage", { credentials: "include" }),
        fetch("/api/inventory/movement", { credentials: "include" }),
      ]);

      const [shipData, repData, movData] = await Promise.all([shipRes.json(), repRes.json(), movRes.json()]);

      if (shipData.data) setPortShipments(shipData.data);
      if (repData.data) setRepackagingOrders(repData.data);
      if (movData.data) setStockMovements(movData.data);
    } catch (e) {
      console.error("Error refreshing data:", e);
    }
  }

  // Audit Filter
  const filteredAudit = stockMovements.filter((m) => {
    const matchesType = auditTypeFilter === "all" || m.movement_type === auditTypeFilter;
    const q = auditQuery.toLowerCase().trim();
    const pName = m.product_id?.product_name?.toLowerCase() || "";
    const pSku = m.product_id?.sku?.toLowerCase() || "";
    const fWh = m.from_warehouse?.warehouse_name?.toLowerCase() || "";
    const tWh = m.to_warehouse?.warehouse_name?.toLowerCase() || "";
    const matchesSearch = !q || pName.includes(q) || pSku.includes(q) || fWh.includes(q) || tWh.includes(q);
    return matchesType && matchesSearch;
  });

  // Paginated Slices
  const paginatedShipments = portShipments.slice((shipmentPage - 1) * PAGE_SIZE, shipmentPage * PAGE_SIZE);
  const paginatedRepackaging = repackagingOrders.slice((repackagePage - 1) * PAGE_SIZE, repackagePage * PAGE_SIZE);
  const paginatedAudit = filteredAudit.slice((auditPage - 1) * PAGE_SIZE, auditPage * PAGE_SIZE);

  return (
    <PermissionGuard module="supply_chain">
      <div className="space-y-8 w-full">
        {/* Banner */}
        <div className="rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl border border-blue-800/40">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-400/30 uppercase tracking-widest text-xs px-3 py-1">
                  Global Supply Chain & Repackaging Hub
                </Badge>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Supply Chain, Port & Warehousing Studio</h1>
              <p className="text-blue-200/80 text-sm mt-1 max-w-3xl">
                Port bulk receiving (Urea/Chemicals/Grains), automated packet conversion, multi-warehouse distribution, outbound sales dispatches, and negative-inventory protected transaction ledgers.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShipmentModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg">
                <Ship className="w-4 h-4 mr-2" />
                Record Port Bulk Shipment
              </Button>
              <Button onClick={() => setRepackageModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg">
                <Boxes className="w-4 h-4 mr-2" />
                Repackage / Packet Conversion
              </Button>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-lg flex items-center justify-between border ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
              <span className="text-sm font-medium">{feedback.text}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setFeedback(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {/* Executive KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-600 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Port Bulk Shipments
                <Ship className="w-4 h-4 text-blue-600" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold">{portShipments.length}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">Inbound international vessels recorded</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-600 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Repackaging Orders
                <Boxes className="w-4 h-4 text-emerald-600" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold">{repackagingOrders.length}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">Bulk-to-Packet conversions completed</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Warehouse Transfers
                <Truck className="w-4 h-4 text-purple-600" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold">
                {stockMovements.filter((m) => m.movement_type === "transfer_out").length}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">Inter-facility packet movements</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-600 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Outbound Market Dispatches
                <ShoppingCart className="w-4 h-4 text-amber-600" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold">
                {stockMovements.filter((m) => m.movement_type === "sales_issue").length}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">Sales issues to buyers & retail outlets</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1 font-mono text-xs">
              Tenant Active Operations
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setTransferModalOpen(true)} variant="outline" size="sm">
              <Truck className="w-4 h-4 mr-2 text-purple-600" />
              Inter-Warehouse Transfer
            </Button>
            <Button onClick={() => setOutboundModalOpen(true)} variant="outline" size="sm">
              <ShoppingCart className="w-4 h-4 mr-2 text-amber-600" />
              Outbound Market Dispatch
            </Button>
            <Button onClick={refreshData} variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Ledger
            </Button>
          </div>
        </div>

        {/* Studio Tabs */}
        <Tabs defaultValue="repackaging" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1">
            <TabsTrigger value="repackaging" className="py-2 flex items-center gap-2">
              <Boxes className="w-4 h-4" />
              <span>Packet Repackaging</span>
            </TabsTrigger>
            <TabsTrigger value="port" className="py-2 flex items-center gap-2">
              <Ship className="w-4 h-4" />
              <span>Port Bulk Inbound</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="py-2 flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Supply Chain Audit Trail</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="py-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>Assigned Facility Staff</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Packet Repackaging */}
          <TabsContent value="repackaging" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-emerald-600" />
                    Bulk-to-Packet Repackaging Log
                  </CardTitle>
                  <CardDescription>
                    Records of bulk commodities (e.g. Urea Tons) converted into standardized packets at Port/Warehouse facilities.
                  </CardDescription>
                </div>
                <Button onClick={() => setRepackageModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Repackaging Order
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Facility / Warehouse</TableHead>
                        <TableHead>Bulk Source Consumed</TableHead>
                        <TableHead>Target Packets Generated</TableHead>
                        <TableHead>Ratio</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Date & Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRepackaging.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No repackaging orders recorded yet. Click "New Repackaging Order" to convert bulk stock into packets.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedRepackaging.map((r) => (
                          <TableRow key={r._id} className="hover:bg-muted/40 transition-colors">
                            <TableCell className="font-mono font-bold text-xs">{r.order_number}</TableCell>
                            <TableCell>
                              <div className="font-medium text-xs">{r.port_facility_name}</div>
                              <div className="text-[11px] text-muted-foreground">{r.source_warehouse_id?.warehouse_name}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                -{r.source_quantity_used} {r.source_product_id?.unit_of_measure || "Units"}
                              </Badge>
                              <div className="text-xs font-semibold mt-1">{r.source_product_id?.product_name}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                                +{r.target_quantity_produced} Packets
                              </Badge>
                              <div className="text-xs font-semibold mt-1">{r.target_product_id?.product_name}</div>
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">{r.conversion_ratio}</TableCell>
                            <TableCell className="text-xs">{r.operator_name || "Port Specialist"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(r.created_at).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4">
                  <PaginationControls
                    currentPage={repackagePage}
                    totalRecords={repackagingOrders.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setRepackagePage}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Port Bulk Inbound */}
          <TabsContent value="port" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Ship className="w-5 h-5 text-blue-600" />
                    International Port Vessel Arrivals
                  </CardTitle>
                  <CardDescription>
                    Inbound vessel bulk cargo receipts recorded by Port Logistics Officers upon arrival at sea port facilities.
                  </CardDescription>
                </div>
                <Button onClick={() => setShipmentModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Record Inbound Vessel
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Shipment #</TableHead>
                        <TableHead>Vessel Name</TableHead>
                        <TableHead>Origin</TableHead>
                        <TableHead>Port Facility & Warehouse</TableHead>
                        <TableHead>Bulk Cargo Product</TableHead>
                        <TableHead>Quantity Received</TableHead>
                        <TableHead>Officer</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedShipments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No port shipments recorded yet. Click "Record Inbound Vessel" to record international bulk shipments.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedShipments.map((s) => (
                          <TableRow key={s._id} className="hover:bg-muted/40 transition-colors">
                            <TableCell className="font-mono font-bold text-xs">{s.shipment_number}</TableCell>
                            <TableCell className="font-semibold text-xs text-blue-700">{s.vessel_name}</TableCell>
                            <TableCell className="text-xs">{s.origin_country}</TableCell>
                            <TableCell>
                              <div className="font-medium text-xs">{s.port_facility_name}</div>
                              <div className="text-[11px] text-muted-foreground">{s.warehouse_id?.warehouse_name}</div>
                            </TableCell>
                            <TableCell className="text-xs font-semibold">{s.product_id?.product_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold">
                                +{s.quantity_received} {s.unit_of_measure}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{s.received_by_name || "Port Logistics Officer"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(s.created_at).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4">
                  <PaginationControls
                    currentPage={shipmentPage}
                    totalRecords={portShipments.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setShipmentPage}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Audit Trail & Ledger */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-600" />
                      Complete Supply Chain Audit Trail
                    </CardTitle>
                    <CardDescription>
                      Full transactional ledger showing every stock addition, repackaging conversion, transfer, and outbound dispatch.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-64">
                      <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Search product or warehouse..."
                        value={auditQuery}
                        onChange={(e) => {
                          setAuditQuery(e.target.value);
                          setAuditPage(1);
                        }}
                        className="pl-8 text-xs h-9"
                      />
                    </div>
                    <Select
                      value={auditTypeFilter}
                      onValueChange={(v) => {
                        setAuditTypeFilter(v);
                        setAuditPage(1);
                      }}
                    >
                      <SelectTrigger className="w-44 text-xs h-9">
                        <SelectValue placeholder="All Movement Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Movement Types</SelectItem>
                        <SelectItem value="purchase_receipt">Port Inbound Receipts</SelectItem>
                        <SelectItem value="production">Packet Productions</SelectItem>
                        <SelectItem value="consumption">Bulk Consumptions</SelectItem>
                        <SelectItem value="transfer_out">Inter-Warehouse Transfers</SelectItem>
                        <SelectItem value="sales_issue">Outbound Sales Dispatches</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>From Facility</TableHead>
                        <TableHead>To Facility</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Stock Level Diff</TableHead>
                        <TableHead>Reason / Notes</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAudit.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No matching stock movement audit records found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedAudit.map((m) => (
                          <TableRow key={m._id} className="hover:bg-muted/40 transition-colors">
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[11px] font-semibold uppercase ${
                                  m.movement_type === "purchase_receipt" || m.movement_type === "production"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : m.movement_type === "consumption"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : m.movement_type === "transfer_out" || m.movement_type === "transfer_in"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                {m.movement_type.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-xs">{m.product_id?.product_name || "N/A"}</div>
                              <div className="text-[11px] text-muted-foreground">SKU: {m.product_id?.sku}</div>
                            </TableCell>
                            <TableCell className="text-xs">{m.from_warehouse?.warehouse_name || "—"}</TableCell>
                            <TableCell className="text-xs">{m.to_warehouse?.warehouse_name || "—"}</TableCell>
                            <TableCell className="font-bold text-xs">{m.quantity}</TableCell>
                            <TableCell className="text-xs font-mono">
                              {m.previous_stock !== undefined && m.new_stock !== undefined ? (
                                <span>
                                  {m.previous_stock} $\rightarrow$ <span className="font-bold text-foreground">{m.new_stock}</span>
                                </span>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="text-xs max-w-xs truncate">{m.notes || m.reason || "Standard supply chain movement"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(m.created_at).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4">
                  <PaginationControls
                    currentPage={auditPage}
                    totalRecords={filteredAudit.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setAuditPage}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Assigned Facility Staff */}
          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-slate-700" />
                  Assigned Port & Warehouse Staff
                </CardTitle>
                <CardDescription>
                  List of company team members with assigned facility and role scopes (Port Officers, Warehouse Clerks, Repackaging Operators).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role Title</TableHead>
                        <TableHead>Assigned Facility Scope</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {initialUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            No employee accounts created yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        initialUsers.map((u) => (
                          <TableRow key={u._id}>
                            <TableCell className="font-semibold text-xs">{u.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs bg-slate-100">
                                {u.role_id?.name || "Employee"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-medium text-blue-700">
                              {u.assigned_facility || "Main Port Facility"}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                                Active
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal 1: Record Port Shipment */}
        <Dialog open={shipmentModalOpen} onOpenChange={setShipmentModalOpen}>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleCreatePortShipment}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <Ship className="w-5 h-5 text-blue-600" />
                  Record Inbound Port Vessel Arrival
                </DialogTitle>
                <DialogDescription>
                  Record bulk commodity shipments arriving via international cargo vessels at port terminals.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Vessel / Carrier Name</Label>
                    <Input
                      placeholder="e.g. MV ocean Star IX"
                      value={vesselName}
                      onChange={(e) => setVesselName(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Origin Country</Label>
                    <Input
                      placeholder="e.g. Saudi Arabia / Qatar"
                      value={originCountry}
                      onChange={(e) => setOriginCountry(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold">Port Facility / Terminal</Label>
                  <Input
                    placeholder="e.g. Karachi Port Terminal 2"
                    value={portFacilityName}
                    onChange={(e) => setPortFacilityName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Destination Port Warehouse</Label>
                    <Select value={shipmentWarehouseId} onValueChange={setShipmentWarehouseId} required>
                      <SelectTrigger className="mt-1">
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

                  <div>
                    <Label className="text-xs font-bold">Bulk Commodity Product</Label>
                    <Select value={shipmentProductId} onValueChange={setShipmentProductId} required>
                      <SelectTrigger className="mt-1">
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
                </div>

                <div>
                  <Label className="text-xs font-bold">Quantity Received (Bulk Units / Tons)</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 500"
                    value={shipmentQty}
                    onChange={(e) => setShipmentQty(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setShipmentModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingShipment} className="bg-blue-600 hover:bg-blue-500">
                  {submittingShipment ? "Recording..." : "Record Inbound Bulk Arrival"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal 2: Repackage / Packet Conversion */}
        <Dialog open={repackageModalOpen} onOpenChange={setRepackageModalOpen}>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleCreateRepackage}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <Boxes className="w-5 h-5 text-emerald-600" />
                  Bulk-to-Packet Repackaging Studio
                </DialogTitle>
                <DialogDescription>
                  Convert bulk commodities into standardized packets/units. Stock level will be updated in real-time.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-xs font-bold">Processing Facility / Warehouse</Label>
                  <Select value={repackageWarehouseId} onValueChange={setRepackageWarehouseId} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Processing Facility" />
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Source Bulk Product</Label>
                    <Select value={sourceProductId} onValueChange={setSourceProductId} required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select Bulk Item" />
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

                  <div>
                    <Label className="text-xs font-bold">Bulk Qty Consumed</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g. 5 Tons"
                      value={sourceQty}
                      onChange={(e) => setSourceQty(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center py-1">
                  <ArrowRight className="w-5 h-5 text-emerald-600 animate-pulse" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Target Packet Product</Label>
                    <Select value={targetProductId} onValueChange={setTargetProductId} required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select Packet Item" />
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

                  <div>
                    <Label className="text-xs font-bold">Packets Generated</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g. 100 Packets"
                      value={targetQty}
                      onChange={(e) => setTargetQty(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold">Conversion Ratio Description</Label>
                  <Input
                    placeholder="e.g. 1 Ton = 20 Packets of 50kg Urea"
                    value={conversionRatioText}
                    onChange={(e) => setConversionRatioText(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setRepackageModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingRepackage} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  {submittingRepackage ? "Executing Conversion..." : "Execute Repackaging Conversion"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal 3: Inter-Warehouse Transfer */}
        <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleCreateTransfer}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <Truck className="w-5 h-5 text-purple-600" />
                  Inter-Warehouse Stock Distribution
                </DialogTitle>
                <DialogDescription>
                  Distribute packet stock from Port/Central facility to regional warehouses.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Source Facility / Port</Label>
                    <Select value={fromWarehouseId} onValueChange={setFromWarehouseId} required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="From Facility" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w) => (
                          <SelectItem key={w._id} value={w._id}>
                            {w.warehouse_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Destination Warehouse</Label>
                    <Select value={toWarehouseId} onValueChange={setToWarehouseId} required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="To Warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w) => (
                          <SelectItem key={w._id} value={w._id}>
                            {w.warehouse_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold">Packet Product</Label>
                  <Select value={transferProductId} onValueChange={setTransferProductId} required>
                    <SelectTrigger className="mt-1">
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

                <div>
                  <Label className="text-xs font-bold">Quantity to Transfer</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 50"
                    value={transferQty}
                    onChange={(e) => setTransferQty(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setTransferModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingTransfer} className="bg-purple-600 hover:bg-purple-500 text-white">
                  {submittingTransfer ? "Executing Transfer..." : "Execute Stock Transfer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal 4: Outbound Market Sales Dispatch */}
        <Dialog open={outboundModalOpen} onOpenChange={setOutboundModalOpen}>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleCreateOutbound}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <ShoppingCart className="w-5 h-5 text-amber-600" />
                  Outbound Market & Buyer Dispatch
                </DialogTitle>
                <DialogDescription>
                  Dispatch packet inventory from regional warehouse to market distributors or buyers. Validates stock to prevent negative inventory.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-xs font-bold">Origin Warehouse</Label>
                  <Select value={outboundWarehouseId} onValueChange={setOutboundWarehouseId} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w._id} value={w._id}>
                          {w.warehouse_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Packet Product</Label>
                    <Select value={outboundProductId} onValueChange={setOutboundProductId} required>
                      <SelectTrigger className="mt-1">
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

                  <div>
                    <Label className="text-xs font-bold">Quantity Dispatched</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g. 25"
                      value={outboundQty}
                      onChange={(e) => setOutboundQty(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold">Destination Market / Buyer Name</Label>
                  <Input
                    placeholder="e.g. Multan Grain Market Outlet #4 / Farmers Cooperative"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    required
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOutboundModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingOutbound} className="bg-amber-600 hover:bg-amber-500 text-white">
                  {submittingOutbound ? "Dispatching..." : "Execute Outbound Dispatch"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
