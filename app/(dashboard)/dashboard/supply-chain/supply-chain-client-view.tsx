"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  Building2,
  FileSpreadsheet,
  Trash2,
  FileText,
  ShieldCheck,
  UserCheck,
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

interface TransportBiltyData {
  _id: string;
  bilty_number: string;
  port_shipment_id?: { _id: string; shipment_number: string; vessel_name: string; origin_country: string };
  warehouse_id: { _id: string; warehouse_name: string; warehouse_code: string };
  product_id: { _id: string; product_name: string; sku: string; unit_of_measure: string };
  transporter_name: string;
  vehicle_number?: string;
  driver_name?: string;
  initial_quantity: number;
  dispatched_quantity: number;
  remaining_quantity: number;
  unit_of_measure: string;
  status: "active" | "exhausted";
  created_at: string;
}

interface VehicleData {
  _id: string;
  vehicle_number: string;
  vehicle_type: "truck" | "trailer" | "container" | "tanker" | "van" | "tempo" | "motorcycle" | "bicycle";
  transporter_company: string;
  capacity_tons: number;
  driver: { name: string; phone: string; license_number?: string };
  warehouse_id?: { _id: string; warehouse_name: string; warehouse_code: string };
  status: "active" | "in_transit" | "inactive" | "maintenance";
  is_active: boolean;
  created_at: string;
}

interface StockMovementData {
  _id: string;
  movement_type: string;
  product_id: { _id: string; product_name: string; sku: string; unit_of_measure: string };
  from_warehouse?: { _id: string; warehouse_name: string; warehouse_code: string };
  to_warehouse?: { _id: string; warehouse_name: string; warehouse_code: string };
  bilty_id?: { _id: string; bilty_number: string; transporter_name: string; remaining_quantity: number; initial_quantity: number };
  bilty_number?: string;
  quantity: number;
  previous_stock?: number;
  new_stock?: number;
  reason?: string;
  notes?: string;
  created_by?: { name: string; email: string };
  created_at: string;
}

const PAGE_SIZE = 10;

interface BiltyInputRow {
  bilty_number: string;
  transporter_name: string;
  vehicle_number: string;
  quantity: string;
}

export function SupplyChainClientView({
  initialProducts,
  initialWarehouses,
  initialPortShipments,
  initialRepackagingOrders,
  initialStockMovements,
  initialUsers,
  initialTransportBilties = [],
  initialVehicles = [],
  currentUser,
}: {
  initialProducts: ProductData[];
  initialWarehouses: WarehouseData[];
  initialPortShipments: PortShipmentData[];
  initialRepackagingOrders: RepackagingOrderData[];
  initialStockMovements: StockMovementData[];
  initialUsers: any[];
  initialTransportBilties?: TransportBiltyData[];
  initialVehicles?: VehicleData[];
  currentUser?: any;
}) {
  const searchParams = useSearchParams();
  const activeTabParam = searchParams.get("tab") || "bilties";

  const [activeTab, setActiveTab] = useState(activeTabParam);

  useEffect(() => {
    if (searchParams.get("tab")) {
      setActiveTab(searchParams.get("tab") || "bilties");
    }
  }, [searchParams]);

  const [products] = useState<ProductData[]>(initialProducts);
  const [warehouses] = useState<WarehouseData[]>(initialWarehouses);
  const [portShipments, setPortShipments] = useState<PortShipmentData[]>(initialPortShipments);
  const [repackagingOrders, setRepackagingOrders] = useState<RepackagingOrderData[]>(initialRepackagingOrders);
  const [stockMovements, setStockMovements] = useState<StockMovementData[]>(initialStockMovements);
  const [transportBilties, setTransportBilties] = useState<TransportBiltyData[]>(initialTransportBilties);
  const [vehicles, setVehicles] = useState<VehicleData[]>(initialVehicles);

  const defaultWhId = currentUser?.assigned_warehouse_id?._id || "";

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal States
  const [shipmentModalOpen, setShipmentModalOpen] = useState(false);
  const [repackageModalOpen, setRepackageModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [outboundModalOpen, setOutboundModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  // Port Shipment Form State
  const [vesselName, setVesselName] = useState("");
  const [originCountry, setOriginCountry] = useState("International Sea Port");
  const [portFacilityName, setPortFacilityName] = useState("Karachi Port Terminal Facility");
  const [shipmentWarehouseId, setShipmentWarehouseId] = useState(defaultWhId);
  const [shipmentProductId, setShipmentProductId] = useState("");
  const [shipmentQty, setShipmentQty] = useState("");
  const [biltyInputs, setBiltyInputs] = useState<BiltyInputRow[]>([
    { bilty_number: "BL-" + Math.floor(1000 + Math.random() * 9000), transporter_name: "", vehicle_number: "", quantity: "" },
  ]);
  const [submittingShipment, setSubmittingShipment] = useState(false);

  // Vehicle Form State
  const [vehRegNum, setVehRegNum] = useState("");
  const [vehType, setVehType] = useState<string>("truck");
  const [vehTransporter, setVehTransporter] = useState("In-House Logistics");
  const [vehCapacityTons, setVehCapacityTons] = useState("30");
  const [vehDriverName, setVehDriverName] = useState("");
  const [vehDriverPhone, setVehDriverPhone] = useState("");
  const [vehWarehouseId, setVehWarehouseId] = useState(defaultWhId);
  const [submittingVehicle, setSubmittingVehicle] = useState(false);

  // Repackaging Form State
  const [repackageWarehouseId, setRepackageWarehouseId] = useState(defaultWhId);
  const [sourceProductId, setSourceProductId] = useState("");
  const [sourceQty, setSourceQty] = useState("");
  const [targetProductId, setTargetProductId] = useState("");
  const [targetQty, setTargetQty] = useState("");
  const [conversionRatioText, setConversionRatioText] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [submittingRepackage, setSubmittingRepackage] = useState(false);

  // Transfer Form State
  const [fromWarehouseId, setFromWarehouseId] = useState(defaultWhId);
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [transferProductId, setTransferProductId] = useState("");
  const [transferQty, setTransferQty] = useState("");
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  // Outbound Form State
  const [outboundWarehouseId, setOutboundWarehouseId] = useState(defaultWhId);
  const [outboundProductId, setOutboundProductId] = useState("");
  const [outboundBiltyId, setOutboundBiltyId] = useState("");
  const [outboundQty, setOutboundQty] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [submittingOutbound, setSubmittingOutbound] = useState(false);

  // Pagination states
  const [shipmentPage, setShipmentPage] = useState(1);
  const [repackagePage, setRepackagePage] = useState(1);
  const [biltyPage, setBiltyPage] = useState(1);
  const [vehiclePage, setVehiclePage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);

  // Filters
  const [auditQuery, setAuditQuery] = useState("");
  const [auditTypeFilter, setAuditTypeFilter] = useState("all");
  const [biltyQuery, setBiltyQuery] = useState("");
  const [biltyStatusFilter, setBiltyStatusFilter] = useState("all");
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState("all");

  // Bilty input helpers
  const handleAddBiltyRow = () => {
    setBiltyInputs((prev) => [
      ...prev,
      { bilty_number: "BL-" + Math.floor(1000 + Math.random() * 9000), transporter_name: "", vehicle_number: "", quantity: "" },
    ]);
  };

  const handleRemoveBiltyRow = (index: number) => {
    if (biltyInputs.length === 1) return;
    setBiltyInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateBiltyRow = (index: number, field: keyof BiltyInputRow, value: string) => {
    setBiltyInputs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Handlers
  async function handleCreateVehicle(e: React.FormEvent) {
    e.preventDefault();
    if (!vehRegNum.trim() || !vehDriverName.trim() || !vehDriverPhone.trim() || !vehCapacityTons) return;

    setSubmittingVehicle(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/supply-chain/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          vehicle_number: vehRegNum.trim().toUpperCase(),
          vehicle_type: vehType,
          transporter_company: vehTransporter.trim() || "In-House Fleet",
          capacity_tons: parseFloat(vehCapacityTons),
          driver_name: vehDriverName.trim(),
          driver_phone: vehDriverPhone.trim(),
          warehouse_id: vehWarehouseId || undefined,
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: d.error || "Failed to register transport vehicle" });
        return;
      }

      setFeedback({
        type: "success",
        text: `Transport Vehicle "${d.data.vehicle_number}" (${d.data.vehicle_type.toUpperCase()}) registered successfully!`,
      });
      setVehicleModalOpen(false);
      setVehRegNum("");
      setVehDriverName("");
      setVehDriverPhone("");
      refreshData();
    } catch {
      setFeedback({ type: "error", text: "Network error registering vehicle" });
    } finally {
      setSubmittingVehicle(false);
    }
  }

  async function handleCreatePortShipment(e: React.FormEvent) {
    e.preventDefault();
    if (!vesselName.trim() || !shipmentWarehouseId || !shipmentProductId || !shipmentQty) return;

    const totalQty = parseFloat(shipmentQty);
    const validBilties = biltyInputs
      .filter((b) => b.bilty_number.trim() && parseFloat(b.quantity) > 0)
      .map((b) => ({
        bilty_number: b.bilty_number.trim(),
        transporter_name: b.transporter_name.trim() || "Standard Logistics",
        vehicle_number: b.vehicle_number.trim() || "",
        quantity: parseFloat(b.quantity),
      }));

    if (validBilties.length > 0) {
      const sumBiltyQty = validBilties.reduce((acc, curr) => acc + curr.quantity, 0);
      if (Math.abs(sumBiltyQty - totalQty) > 0.01) {
        setFeedback({
          type: "error",
          text: `Sum of Transport Bilties (${sumBiltyQty} Tons) must match Total Shipment Quantity (${totalQty} Tons).`,
        });
        return;
      }
    }

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
          quantity_received: totalQty,
          unit_of_measure: products.find((p) => p._id === shipmentProductId)?.unit_of_measure || "Tons",
          bilties: validBilties.length > 0 ? validBilties : undefined,
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: d.error || "Failed to record port shipment" });
        return;
      }

      setFeedback({
        type: "success",
        text: `Inbound Port Shipment "${d.data.shipment?.shipment_number || 'Record'}" with ${d.data.bilties?.length || 1} Transport Bilties recorded successfully!`,
      });
      setShipmentModalOpen(false);
      setVesselName("");
      setShipmentQty("");
      setBiltyInputs([{ bilty_number: "BL-" + Math.floor(1000 + Math.random() * 9000), transporter_name: "", vehicle_number: "", quantity: "" }]);
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
          bilty_id: outboundBiltyId || undefined,
          quantity: parseFloat(outboundQty),
          destination_buyer_market: buyerName.trim(),
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: d.error || "Failed to execute outbound sales dispatch" });
        return;
      }

      setFeedback({ type: "success", text: `Outbound sales dispatch completed cleanly! Bilty balance updated.` });
      setOutboundModalOpen(false);
      setOutboundQty("");
      setBuyerName("");
      setOutboundBiltyId("");
      refreshData();
    } catch {
      setFeedback({ type: "error", text: "Network error executing outbound sales dispatch" });
    } finally {
      setSubmittingOutbound(false);
    }
  }

  async function refreshData() {
    try {
      const [shipRes, repRes, movRes, biltyRes, vehRes] = await Promise.all([
        fetch("/api/supply-chain/shipments", { credentials: "include" }),
        fetch("/api/supply-chain/repackage", { credentials: "include" }),
        fetch("/api/inventory/movement", { credentials: "include" }),
        fetch("/api/supply-chain/bilties", { credentials: "include" }),
        fetch("/api/supply-chain/vehicles", { credentials: "include" }),
      ]);

      const [shipData, repData, movData, biltyData, vehData] = await Promise.all([
        shipRes.json(),
        repRes.json(),
        movRes.json(),
        biltyRes.json(),
        vehRes.json(),
      ]);

      if (shipData.data) setPortShipments(shipData.data);
      if (repData.data) setRepackagingOrders(repData.data);
      if (movData.data) setStockMovements(movData.data);
      if (biltyData.data) setTransportBilties(biltyData.data);
      if (vehData.data) setVehicles(vehData.data);
    } catch (e) {
      console.error("Error refreshing data:", e);
    }
  }

  // Filtered Bilties
  const filteredBilties = transportBilties.filter((b) => {
    const matchesStatus = biltyStatusFilter === "all" || b.status === biltyStatusFilter;
    const q = biltyQuery.toLowerCase().trim();
    const bNum = b.bilty_number.toLowerCase();
    const trans = b.transporter_name?.toLowerCase() || "";
    const pName = b.product_id?.product_name?.toLowerCase() || "";
    const whName = b.warehouse_id?.warehouse_name?.toLowerCase() || "";
    const matchesSearch = !q || bNum.includes(q) || trans.includes(q) || pName.includes(q) || whName.includes(q);
    return matchesStatus && matchesSearch;
  });

  // Filtered Vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesStatus = vehicleStatusFilter === "all" || v.status === vehicleStatusFilter;
    const q = vehicleQuery.toLowerCase().trim();
    const vNum = v.vehicle_number.toLowerCase();
    const trans = v.transporter_company?.toLowerCase() || "";
    const dName = v.driver?.name?.toLowerCase() || "";
    const matchesSearch = !q || vNum.includes(q) || trans.includes(q) || dName.includes(q);
    return matchesStatus && matchesSearch;
  });

  // Active Bilties for Outbound Dispatch
  const activeOutboundBilties = transportBilties.filter((b) => {
    const matchWh = !outboundWarehouseId || b.warehouse_id?._id === outboundWarehouseId;
    const matchProd = !outboundProductId || b.product_id?._id === outboundProductId;
    return matchWh && matchProd && b.status === "active" && b.remaining_quantity > 0;
  });

  // Selected Bilty preview
  const selectedOutboundBilty = transportBilties.find((b) => b._id === outboundBiltyId);

  // Audit Filter
  const filteredAudit = stockMovements.filter((m) => {
    const matchesType = auditTypeFilter === "all" || m.movement_type === auditTypeFilter;
    const q = auditQuery.toLowerCase().trim();
    const pName = m.product_id?.product_name?.toLowerCase() || "";
    const pSku = m.product_id?.sku?.toLowerCase() || "";
    const fWh = m.from_warehouse?.warehouse_name?.toLowerCase() || "";
    const tWh = m.to_warehouse?.warehouse_name?.toLowerCase() || "";
    const bNum = m.bilty_number?.toLowerCase() || "";
    const matchesSearch = !q || pName.includes(q) || pSku.includes(q) || fWh.includes(q) || tWh.includes(q) || bNum.includes(q);
    return matchesType && matchesSearch;
  });

  // Paginated Slices
  const paginatedShipments = portShipments.slice((shipmentPage - 1) * PAGE_SIZE, shipmentPage * PAGE_SIZE);
  const paginatedRepackaging = repackagingOrders.slice((repackagePage - 1) * PAGE_SIZE, repackagePage * PAGE_SIZE);
  const paginatedBilties = filteredBilties.slice((biltyPage - 1) * PAGE_SIZE, biltyPage * PAGE_SIZE);
  const paginatedVehicles = filteredVehicles.slice((vehiclePage - 1) * PAGE_SIZE, vehiclePage * PAGE_SIZE);
  const paginatedAudit = filteredAudit.slice((auditPage - 1) * PAGE_SIZE, auditPage * PAGE_SIZE);

  // KPI Calculations
  const activeBiltiesCount = transportBilties.filter((b) => b.status === "active").length;
  const totalBiltyRemainingTons = transportBilties
    .filter((b) => b.status === "active")
    .reduce((acc, b) => acc + (b.remaining_quantity || 0), 0);
  const activeVehiclesCount = vehicles.filter((v) => v.status === "active" || v.status === "in_transit").length;
  const totalFleetCapacityTons = vehicles.reduce((acc, v) => acc + (v.capacity_tons || 0), 0);

  return (
    <PermissionGuard module="supply_chain">
      <div className="space-y-8 w-full">
        {/* Banner */}
        <div className="rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl border border-blue-800/40">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-400/30 uppercase tracking-widest text-xs px-3 py-1">
                  Global Supply Chain & Fleet Logistics Studio
                </Badge>
                {currentUser?.assigned_warehouse_id?.warehouse_name ? (
                  <Badge className="bg-emerald-500/30 text-emerald-300 border-emerald-400/30 text-xs px-3 py-1 font-semibold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    Facility Scope: {currentUser.assigned_warehouse_id.warehouse_name} ({currentUser.assigned_warehouse_id.warehouse_code})
                  </Badge>
                ) : (
                  <Badge className="bg-purple-500/30 text-purple-200 border-purple-400/30 text-xs px-3 py-1 font-semibold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    Scope: All Facilities & Warehouses (Global Admin)
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Supply Chain, Bilty & Fleet Management Studio</h1>
              <p className="text-blue-200/80 text-sm mt-1 max-w-3xl">
                Inbound shipment receiving with Transport Bilty allocation, fleet vehicle management, real-time Bilty deduction on market dispatches, bulk-to-packet repackaging, and audited stock ledgers.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setVehicleModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg">
                <Truck className="w-4 h-4 mr-2" />
                Register Transport Vehicle
              </Button>
              <Button onClick={() => setShipmentModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg">
                <Boxes className="w-4 h-4 mr-2" />
                Record Inbound Cargo & Bilties
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-blue-600 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Active Bilties
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold">{activeBiltiesCount}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">{totalBiltyRemainingTons.toFixed(1)} Tons in bilty stock</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-600 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Fleet Vehicles
                <Truck className="w-4 h-4 text-indigo-600" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold">{activeVehiclesCount}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">{totalFleetCapacityTons} Tons transport capacity</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-600 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Inbound Shipments
                <Boxes className="w-4 h-4 text-emerald-600" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold">{portShipments.length}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">Bulk freight & supplier receipts</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                Repackaging Orders
                <Boxes className="w-4 h-4 text-purple-600" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold">{repackagingOrders.length}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">Bulk-to-packet conversions</p>
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
              <p className="text-xs text-muted-foreground">Dispatches linked to bilties</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1 font-mono text-xs">
              Live Logistics Management
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setVehicleModalOpen(true)} variant="outline" size="sm">
              <Truck className="w-4 h-4 mr-2 text-indigo-600" />
              Add Transport Vehicle
            </Button>
            <Button onClick={() => setTransferModalOpen(true)} variant="outline" size="sm">
              <Truck className="w-4 h-4 mr-2 text-purple-600" />
              Inter-Warehouse Transfer
            </Button>
            <Button onClick={() => setOutboundModalOpen(true)} variant="outline" size="sm">
              <ShoppingCart className="w-4 h-4 mr-2 text-amber-600" />
              Outbound Dispatch (By Bilty)
            </Button>
            <Button onClick={refreshData} variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Ledger
            </Button>
          </div>
        </div>

        {/* Studio Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full h-auto p-1">
            <TabsTrigger value="bilties" className="py-2 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Transport Bilties</span>
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="py-2 flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Fleet Vehicles</span>
            </TabsTrigger>
            <TabsTrigger value="port" className="py-2 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-600" />
              <span>Inbound Shipments</span>
            </TabsTrigger>
            <TabsTrigger value="repackaging" className="py-2 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-purple-600" />
              <span>Packet Repackaging</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="py-2 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              <span>Audit Trail</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="py-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>Facility Staff</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Transport Bilties Ledger */}
          <TabsContent value="bilties" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                      Transport Bilty Management Ledger
                    </CardTitle>
                    <CardDescription>
                      Tracks bulk commodity quantities allocated per transport vehicle bilty number. Remaining balances decrease automatically upon outbound dispatches.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-64">
                      <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Search bilty #, transporter..."
                        value={biltyQuery}
                        onChange={(e) => {
                          setBiltyQuery(e.target.value);
                          setBiltyPage(1);
                        }}
                        className="pl-8 text-xs h-9"
                      />
                    </div>
                    <Select
                      value={biltyStatusFilter}
                      onValueChange={(v) => {
                        setBiltyStatusFilter(v);
                        setBiltyPage(1);
                      }}
                    >
                      <SelectTrigger className="w-36 text-xs h-9">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active (In Stock)</SelectItem>
                        <SelectItem value="exhausted">Exhausted (0 Balance)</SelectItem>
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
                        <TableHead>Bilty #</TableHead>
                        <TableHead>Warehouse & Product</TableHead>
                        <TableHead>Transporter & Vehicle</TableHead>
                        <TableHead>Port Vessel Shipment</TableHead>
                        <TableHead>Initial Weight</TableHead>
                        <TableHead>Dispatched Weight</TableHead>
                        <TableHead>Remaining Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedBilties.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No transport bilties recorded yet. Record a Port Bulk Shipment to allocate transport bilty numbers.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedBilties.map((b) => (
                          <TableRow key={b._id} className="hover:bg-muted/40 transition-colors">
                            <TableCell className="font-mono font-bold text-xs text-blue-700">{b.bilty_number}</TableCell>
                            <TableCell>
                              <div className="font-semibold text-xs">{b.product_id?.product_name || "N/A"}</div>
                              <div className="text-[11px] text-muted-foreground">{b.warehouse_id?.warehouse_name}</div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="font-medium">{b.transporter_name || "Standard Carrier"}</div>
                              {b.vehicle_number && <div className="text-[11px] font-mono text-muted-foreground">Truck: {b.vehicle_number}</div>}
                            </TableCell>
                            <TableCell className="text-xs">
                              {b.port_shipment_id ? (
                                <div>
                                  <div className="font-mono text-[11px] font-bold">{b.port_shipment_id.shipment_number}</div>
                                  <div className="text-[11px] text-muted-foreground">{b.port_shipment_id.vessel_name}</div>
                                </div>
                              ) : (
                                "Direct Receipt"
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-semibold">{b.initial_quantity} {b.unit_of_measure}</TableCell>
                            <TableCell className="text-xs font-medium text-amber-700">{b.dispatched_quantity} {b.unit_of_measure}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`font-bold text-xs ${
                                  b.remaining_quantity > 0
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                }`}
                              >
                                {b.remaining_quantity} {b.unit_of_measure}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`text-xs ${
                                  b.status === "active"
                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                    : "bg-gray-400 text-white"
                                }`}
                              >
                                {b.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(b.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4">
                  <PaginationControls
                    currentPage={biltyPage}
                    totalRecords={filteredBilties.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setBiltyPage}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Fleet & Vehicle Management */}
          <TabsContent value="vehicles" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Truck className="w-5 h-5 text-indigo-600" />
                    Supply Chain Transport Vehicle Fleet
                  </CardTitle>
                  <CardDescription>
                    Manage heavy transport trucks, trailers, tankers, and containers carrying bulk cargo and bilty consignments.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-56">
                    <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Search vehicle #, driver..."
                      value={vehicleQuery}
                      onChange={(e) => {
                        setVehicleQuery(e.target.value);
                        setVehiclePage(1);
                      }}
                      className="pl-8 text-xs h-9"
                    />
                  </div>
                  <Button onClick={() => setVehicleModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Register Transport Vehicle
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Vehicle Reg #</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Transporter Fleet</TableHead>
                        <TableHead>Payload Capacity</TableHead>
                        <TableHead>Assigned Driver</TableHead>
                        <TableHead>Home Warehouse / Terminal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedVehicles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No supply chain vehicles registered yet. Click "Register Transport Vehicle" to add fleet trucks and trailers.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedVehicles.map((v) => (
                          <TableRow key={v._id} className="hover:bg-muted/40 transition-colors">
                            <TableCell className="font-mono font-bold text-xs text-indigo-700">{v.vehicle_number}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="uppercase text-[11px] font-semibold bg-indigo-50 text-indigo-800 border-indigo-200">
                                {v.vehicle_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-medium">{v.transporter_company}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-bold text-xs bg-slate-100">
                                {v.capacity_tons || 20} Tons
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="font-semibold flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                {v.driver?.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono">{v.driver?.phone}</div>
                            </TableCell>
                            <TableCell className="text-xs">{v.warehouse_id?.warehouse_name || "Central Logistics Pool"}</TableCell>
                            <TableCell>
                              <Badge
                                className={`text-xs ${
                                  v.status === "active"
                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                    : v.status === "in_transit"
                                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                                    : v.status === "maintenance"
                                    ? "bg-amber-600 text-white"
                                    : "bg-gray-400 text-white"
                                }`}
                              >
                                {v.status.replace("_", " ").toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(v.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4">
                  <PaginationControls
                    currentPage={vehiclePage}
                    totalRecords={filteredVehicles.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setVehiclePage}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Port Bulk Inbound */}
          <TabsContent value="port" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Ship className="w-5 h-5 text-emerald-600" />
                    International Port Vessel Arrivals
                  </CardTitle>
                  <CardDescription>
                    Inbound vessel bulk cargo receipts recorded by Port Logistics Officers upon arrival at sea port facilities.
                  </CardDescription>
                </div>
                <Button onClick={() => setShipmentModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Record Inbound Vessel & Bilties
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
                        <TableHead>Total Quantity Received</TableHead>
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

          {/* Tab 4: Packet Repackaging */}
          <TabsContent value="repackaging" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-purple-600" />
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

          {/* Tab 5: Audit Trail & Ledger */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <History className="w-5 h-5 text-amber-600" />
                      Complete Supply Chain Audit Trail
                    </CardTitle>
                    <CardDescription>
                      Full transactional ledger showing every stock addition, Bilty deduction, repackaging conversion, transfer, and outbound dispatch.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-64">
                      <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Search product, warehouse, bilty #..."
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
                        <TableHead>Bilty #</TableHead>
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
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
                            <TableCell className="text-xs">
                              {m.bilty_number || m.bilty_id?.bilty_number ? (
                                <Badge variant="outline" className="font-mono text-[11px] bg-blue-50 text-blue-700 border-blue-200">
                                  {m.bilty_number || m.bilty_id?.bilty_number}
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="text-xs">{m.from_warehouse?.warehouse_name || "—"}</TableCell>
                            <TableCell className="text-xs">{m.to_warehouse?.warehouse_name || "—"}</TableCell>
                            <TableCell className="font-bold text-xs">{m.quantity}</TableCell>
                            <TableCell className="text-xs font-mono">
                              {m.previous_stock !== undefined && m.new_stock !== undefined ? (
                                <span>
                                  {m.previous_stock} &rarr; <span className="font-bold text-foreground">{m.new_stock}</span>
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

          {/* Tab 6: Assigned Facility Staff */}
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

        {/* Modal 0: Register Transport Vehicle */}
        <Dialog open={vehicleModalOpen} onOpenChange={setVehicleModalOpen}>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleCreateVehicle}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <Truck className="w-5 h-5 text-indigo-600" />
                  Register Supply Chain Transport Vehicle
                </DialogTitle>
                <DialogDescription>
                  Add transport trucks, trailers, tankers, and bulk carriers to your logistics fleet.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Vehicle Reg / Plate #</Label>
                    <Input
                      placeholder="e.g. KBL-9842"
                      value={vehRegNum}
                      onChange={(e) => setVehRegNum(e.target.value)}
                      required
                      className="mt-1 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Vehicle Type</Label>
                    <Select value={vehType} onValueChange={setVehType} required>
                      <SelectTrigger className="mt-1 uppercase text-xs font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="truck">Truck (6-Wheeler)</SelectItem>
                        <SelectItem value="trailer">Trailer (18-Wheeler Heavy)</SelectItem>
                        <SelectItem value="container">Container Truck</SelectItem>
                        <SelectItem value="tanker">Liquid Tanker</SelectItem>
                        <SelectItem value="van">Delivery Van</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Transporter / Goods Company</Label>
                    <Input
                      placeholder="e.g. Niazi Goods Transport"
                      value={vehTransporter}
                      onChange={(e) => setVehTransporter(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Payload Capacity (Tons)</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g. 30"
                      value={vehCapacityTons}
                      onChange={(e) => setVehCapacityTons(e.target.value)}
                      required
                      className="mt-1 font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Driver Full Name</Label>
                    <Input
                      placeholder="e.g. Muhammad Akram"
                      value={vehDriverName}
                      onChange={(e) => setVehDriverName(e.target.value)}
                      required
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Driver Phone Number</Label>
                    <Input
                      placeholder="e.g. 0300-1234567"
                      value={vehDriverPhone}
                      onChange={(e) => setVehDriverPhone(e.target.value)}
                      required
                      className="mt-1 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold">Home Warehouse Hub (Optional)</Label>
                  <Select value={vehWarehouseId} onValueChange={setVehWarehouseId}>
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue placeholder="Central Fleet Pool" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pool">Central Logistics Pool</SelectItem>
                      {warehouses.map((w) => (
                        <SelectItem key={w._id} value={w._id}>
                          {w.warehouse_name} ({w.warehouse_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setVehicleModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingVehicle} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  {submittingVehicle ? "Registering..." : "Register Transport Vehicle"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal 1: Record Port Shipment with Transport Bilties */}
        <Dialog open={shipmentModalOpen} onOpenChange={setShipmentModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreatePortShipment}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <Ship className="w-5 h-5 text-blue-600" />
                  Record Port Cargo Arrival & Transport Bilties
                </DialogTitle>
                <DialogDescription>
                  Record international vessel arrival and divide bulk tonnage across transport vehicle bilty numbers (e.g. 100 Tons split into 30T, 10T, etc.).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Vessel / Carrier Name</Label>
                    <Input
                      placeholder="e.g. MV Ocean Star IX"
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
                  <Label className="text-xs font-bold">Port Terminal Facility</Label>
                  <Input
                    placeholder="e.g. Karachi Port Terminal Facility"
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
                  <Label className="text-xs font-bold">Total Shipment Tonnage (Tons)</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 100"
                    value={shipmentQty}
                    onChange={(e) => setShipmentQty(e.target.value)}
                    required
                    className="mt-1 font-bold text-lg"
                  />
                </div>

                {/* Bilty Breakdown Section */}
                <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold flex items-center gap-1">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Transport Bilties Breakdown (Multiple Transport Vehicles)
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Allocate the total weight across transport bilty numbers.
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddBiltyRow} className="text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Bilty Line
                    </Button>
                  </div>

                  {biltyInputs.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-background p-2.5 rounded border text-xs">
                      <div className="col-span-3">
                        <Input
                          placeholder="Bilty #"
                          value={row.bilty_number}
                          onChange={(e) => handleUpdateBiltyRow(idx, "bilty_number", e.target.value)}
                          required
                          className="h-8 font-mono text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Transporter Name"
                          value={row.transporter_name}
                          onChange={(e) => handleUpdateBiltyRow(idx, "transporter_name", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        {vehicles.length > 0 ? (
                          <Select
                            value={row.vehicle_number}
                            onValueChange={(val) => {
                              handleUpdateBiltyRow(idx, "vehicle_number", val);
                              const foundVeh = vehicles.find((v) => v.vehicle_number === val);
                              if (foundVeh) {
                                handleUpdateBiltyRow(idx, "transporter_name", foundVeh.transporter_company);
                                if (foundVeh.capacity_tons && !row.quantity) {
                                  handleUpdateBiltyRow(idx, "quantity", foundVeh.capacity_tons.toString());
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs font-mono">
                              <SelectValue placeholder="Pick Fleet Vehicle" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicles.map((v) => (
                                <SelectItem key={v._id} value={v.vehicle_number}>
                                  {v.vehicle_number} ({v.capacity_tons}T - {v.transporter_company})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="Vehicle #"
                            value={row.vehicle_number}
                            onChange={(e) => handleUpdateBiltyRow(idx, "vehicle_number", e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        )}
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="any"
                          placeholder="Weight (Tons)"
                          value={row.quantity}
                          onChange={(e) => handleUpdateBiltyRow(idx, "quantity", e.target.value)}
                          required
                          className="h-8 font-bold text-xs"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        {biltyInputs.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveBiltyRow(idx)}
                            className="h-7 w-7 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {shipmentQty && (
                    <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t">
                      <span>Assigned Bilty Total:</span>
                      <span
                        className={
                          Math.abs(
                            biltyInputs.reduce((acc, r) => acc + (parseFloat(r.quantity) || 0), 0) - (parseFloat(shipmentQty) || 0)
                          ) < 0.01
                            ? "text-emerald-600 font-bold"
                            : "text-amber-600 font-bold"
                        }
                      >
                        {biltyInputs.reduce((acc, r) => acc + (parseFloat(r.quantity) || 0), 0)} / {shipmentQty} Tons
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setShipmentModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingShipment} className="bg-blue-600 hover:bg-blue-500">
                  {submittingShipment ? "Recording..." : "Record Cargo & Transport Bilties"}
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

        {/* Modal 4: Outbound Market Sales Dispatch with Bilty Selection */}
        <Dialog open={outboundModalOpen} onOpenChange={setOutboundModalOpen}>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleCreateOutbound}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <ShoppingCart className="w-5 h-5 text-amber-600" />
                  Outbound Market & Buyer Sales Dispatch
                </DialogTitle>
                <DialogDescription>
                  Dispatch goods from warehouse to market buyers. Selecting a Transport Bilty automatically deducts the dispatched tonnage from that bilty's remaining balance and warehouse stock.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
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

                  <div>
                    <Label className="text-xs font-bold">Product</Label>
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
                </div>

                {/* Bilty Selection */}
                <div>
                  <Label className="text-xs font-bold flex items-center justify-between">
                    <span>Transport Bilty Number (Select Source Bilty)</span>
                    <span className="text-[11px] text-muted-foreground font-normal">Optional / Auto-deducts</span>
                  </Label>
                  <Select value={outboundBiltyId} onValueChange={setOutboundBiltyId}>
                    <SelectTrigger className="mt-1 font-mono text-xs">
                      <SelectValue placeholder="-- Select Bilty Number --" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeOutboundBilties.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                          No active bilties available for selected warehouse & product
                        </div>
                      ) : (
                        activeOutboundBilties.map((b) => (
                          <SelectItem key={b._id} value={b._id}>
                            Bilty #{b.bilty_number} ({b.remaining_quantity} {b.unit_of_measure} remaining - {b.transporter_name})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedOutboundBilty && (
                    <div className="mt-2 text-xs bg-blue-50 border border-blue-200 text-blue-800 p-2.5 rounded-md flex items-center justify-between">
                      <div>
                        <span className="font-bold">Bilty #{selectedOutboundBilty.bilty_number}</span>
                        <div className="text-[11px] text-blue-600">Transporter: {selectedOutboundBilty.transporter_name}</div>
                      </div>
                      <Badge className="bg-blue-600 text-white font-bold text-xs">
                        {selectedOutboundBilty.remaining_quantity} {selectedOutboundBilty.unit_of_measure} Available
                      </Badge>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-bold">Quantity Dispatched</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 5 Tons"
                    value={outboundQty}
                    onChange={(e) => setOutboundQty(e.target.value)}
                    required
                    className="mt-1 font-bold"
                  />
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
                  {submittingOutbound ? "Dispatching..." : "Execute Outbound Dispatch & Deduct Bilty"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
