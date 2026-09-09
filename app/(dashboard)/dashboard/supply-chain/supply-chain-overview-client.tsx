"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Ship,
  Boxes,
  Truck,
  ShoppingCart,
  History,
  Plus,
  ArrowRight,
  RefreshCw,
  Building2,
  FileSpreadsheet,
  Trash2,
  Sparkles,
  TrendingUp,
  Layers,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  Phone,
} from "lucide-react";
import { PermissionGuard } from "@/components/permission-guard";

interface ExecutiveOverviewProps {
  initialProducts: any[];
  initialWarehouses: any[];
  initialPortShipments: any[];
  initialRepackagingOrders: any[];
  initialStockMovements: any[];
  initialTransportBilties: any[];
  initialVehicles: any[];
  currentUser: any;
}

interface BiltyInputRow {
  bilty_number: string;
  transporter_name: string;
  vehicle_number: string;
  quantity: string;
}

export function SupplyChainOverviewClient({
  initialProducts,
  initialWarehouses,
  initialPortShipments,
  initialRepackagingOrders,
  initialStockMovements,
  initialTransportBilties,
  initialVehicles,
  currentUser,
}: ExecutiveOverviewProps) {
  const [products] = useState(initialProducts);
  const [warehouses] = useState(initialWarehouses);
  const [portShipments, setPortShipments] = useState(initialPortShipments);
  const [repackagingOrders, setRepackagingOrders] = useState(initialRepackagingOrders);
  const [stockMovements, setStockMovements] = useState(initialStockMovements);
  const [transportBilties, setTransportBilties] = useState(initialTransportBilties);
  const [vehicles, setVehicles] = useState(initialVehicles);

  // Modals state
  const [isPortModalOpen, setIsPortModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isRepackageModalOpen, setIsRepackageModalOpen] = useState(false);
  const [isOutboundModalOpen, setIsOutboundModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Form states
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

  // Vehicle form
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("truck");
  const [transporterCompany, setTransporterCompany] = useState("");
  const [capacityTons, setCapacityTons] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehicleWhId, setVehicleWhId] = useState("");

  // Outbound Dispatch form
  const [selectedBiltyId, setSelectedBiltyId] = useState("");
  const [dispatchQuantity, setDispatchQuantity] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [outboundNotes, setOutboundNotes] = useState("");

  // Transfer form
  const [transferFromWh, setTransferFromWh] = useState("");
  const [transferToWh, setTransferToWh] = useState("");
  const [transferProduct, setTransferProduct] = useState("");
  const [transferQty, setTransferQty] = useState("");

  // Repackage form
  const [repWhId, setRepWhId] = useState("");
  const [repSourceProd, setRepSourceProd] = useState("");
  const [repSourceQty, setRepSourceQty] = useState("");
  const [repTargetProd, setRepTargetProd] = useState("");
  const [repTargetQty, setRepTargetQty] = useState("");
  const [repOperator, setRepOperator] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWarehouseUser = currentUser?.role_id?.code === "warehouse_manager" || currentUser?.role_id?.code === "warehouse_operator";
  const userWarehouseId = currentUser?.assigned_warehouse_id?._id || currentUser?.assigned_warehouse_id;

  // Filter bilties for warehouse users if scoped
  const activeBilties = transportBilties.filter((b) => {
    if (isWarehouseUser && userWarehouseId && b.warehouse_id?._id !== userWarehouseId) return false;
    return b.status === "active";
  });

  const totalBiltyStockRemaining = transportBilties.reduce((sum, b) => {
    if (isWarehouseUser && userWarehouseId && b.warehouse_id?._id !== userWarehouseId) return 0;
    return sum + (b.remaining_quantity || 0);
  }, 0);

  const totalBiltyInitial = transportBilties.reduce((sum, b) => {
    if (isWarehouseUser && userWarehouseId && b.warehouse_id?._id !== userWarehouseId) return 0;
    return sum + (b.initial_quantity || 0);
  }, 0);

  const totalFleetCapacity = vehicles.reduce((sum, v) => sum + (v.capacity_tons || 0), 0);
  const totalInboundVolume = portShipments.reduce((sum, s) => sum + (s.quantity_received || 0), 0);
  const totalRepackagedUnits = repackagingOrders.reduce((sum, r) => sum + (r.target_quantity_produced || 0), 0);

  const refreshData = async () => {
    try {
      const [resB, resV, resS, resR, resM] = await Promise.all([
        fetch("/api/supply-chain/bilties"),
        fetch("/api/supply-chain/vehicles"),
        fetch("/api/supply-chain/shipments"),
        fetch("/api/supply-chain/repackaging"),
        fetch("/api/supply-chain/audit"),
      ]);
      if (resB.ok) setTransportBilties(await resB.json());
      if (resV.ok) setVehicles(await resV.json());
      if (resS.ok) setPortShipments(await resS.json());
      if (resR.ok) setRepackagingOrders(await resR.json());
      if (resM.ok) setStockMovements(await resM.json());
    } catch (e) {
      console.error(e);
    }
  };

  // Record Inbound Shipment & Bilties
  const handleRecordShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetWhId = isWarehouseUser ? userWarehouseId : warehouseId;
    if (!shipmentNumber || !targetWhId || !productId || !quantityReceived) return;

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
          origin_country: originCountry || "Supplier Origin",
          port_facility_name: terminalName || "Inbound Receiving Bay",
          warehouse_id: targetWhId,
          product_id: productId,
          quantity_received: Number(quantityReceived),
          unit_of_measure: unitOfMeasure,
          bilties: formattedBilties,
        }),
      });

      if (res.ok) {
        setIsPortModalOpen(false);
        setShipmentNumber("");
        setVesselName("");
        setQuantityReceived("");
        setBiltyRows([{ bilty_number: "", transporter_name: "", vehicle_number: "", quantity: "" }]);
        refreshData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Register Vehicle
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
          driver: { name: driverName, phone: driverPhone },
          warehouse_id: vehicleWhId || (isWarehouseUser ? userWarehouseId : undefined),
        }),
      });

      if (res.ok) {
        setIsVehicleModalOpen(false);
        setVehicleNumber("");
        setTransporterCompany("");
        setCapacityTons("");
        setDriverName("");
        setDriverPhone("");
        refreshData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Outbound Dispatch
  const handleOutboundDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiltyId || !dispatchQuantity) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/supply-chain/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bilty_id: selectedBiltyId,
          dispatch_quantity: Number(dispatchQuantity),
          destination_address: destinationAddress,
          notes: outboundNotes,
        }),
      });

      if (res.ok) {
        setIsOutboundModalOpen(false);
        setSelectedBiltyId("");
        setDispatchQuantity("");
        setDestinationAddress("");
        setOutboundNotes("");
        refreshData();
      } else {
        const err = await res.json();
        alert(err.error || "Dispatch failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Repackaging
  const handleRepackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetWhId = isWarehouseUser ? userWarehouseId : repWhId;
    if (!targetWhId || !repSourceProd || !repSourceQty || !repTargetProd || !repTargetQty) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/supply-chain/repackaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_warehouse_id: targetWhId,
          source_product_id: repSourceProd,
          source_quantity_used: Number(repSourceQty),
          target_product_id: repTargetProd,
          target_quantity_produced: Number(repTargetQty),
          operator_name: repOperator || currentUser?.name,
        }),
      });

      if (res.ok) {
        setIsRepackageModalOpen(false);
        setRepSourceQty("");
        setRepTargetQty("");
        refreshData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Executive Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-4 sm:p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 -mb-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 backdrop-blur-md px-3 py-1 font-semibold text-xs">
                <Activity className="mr-1.5 h-3.5 w-3.5 text-blue-400 animate-pulse" /> Supply Chain Operations Center
              </Badge>
              {isWarehouseUser && (
                <Badge variant="outline" className="border-amber-400/40 text-amber-300 bg-amber-950/40 font-mono text-xs">
                  Facility: {currentUser?.assigned_warehouse_id?.warehouse_name || "Assigned Warehouse"}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl text-white">
              Supply Chain & Logistics Studio
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Real-time monitoring of bulk cargo receiving, transport bilty balances, fleet capacity telematics, packet conversion yields, and stock ledger audits across all warehouses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <PermissionGuard module="inventory" action="create">
              <Button
                onClick={() => setIsPortModalOpen(true)}
                className="bg-emerald-600 font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 text-xs sm:text-sm"
              >
                <Plus className="mr-1.5 sm:mr-2 h-4 w-4" /> Record Cargo
              </Button>
            </PermissionGuard>
            <PermissionGuard module="inventory" action="create">
              <Button
                onClick={() => setIsOutboundModalOpen(true)}
                className="bg-amber-600 font-semibold text-white hover:bg-amber-500 shadow-lg shadow-amber-900/40 text-xs sm:text-sm"
              >
                <ShoppingCart className="mr-1.5 sm:mr-2 h-4 w-4" /> Dispatch Bilty
              </Button>
            </PermissionGuard>
            <Button
              variant="outline"
              onClick={refreshData}
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Executive Metric Cards Grid */}
        <div className="relative z-10 mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 border-t border-slate-800/80 pt-6">
          <Card className="border-slate-800/80 bg-slate-900/60 text-white backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Active Bilties</span>
                <FileSpreadsheet className="h-4 w-4 text-blue-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{activeBilties.length}</span>
                <span className="text-xs font-semibold text-blue-400">{totalBiltyStockRemaining.toLocaleString()} Tons Stock</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${totalBiltyInitial ? Math.min(100, (totalBiltyStockRemaining / totalBiltyInitial) * 100) : 0}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800/80 bg-slate-900/60 text-white backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Transport Fleet</span>
                <Truck className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{vehicles.length} Units</span>
                <span className="text-xs font-semibold text-amber-400">{totalFleetCapacity.toLocaleString()} Tons Haulage</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>{vehicles.filter((v) => v.status === "active").length} Active</span>
                <span>{vehicles.filter((v) => v.status === "in_transit").length} In Transit</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800/80 bg-slate-900/60 text-white backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Inbound Cargo</span>
                <Boxes className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{portShipments.length} Arrivals</span>
                <span className="text-xs font-semibold text-emerald-400">+{totalInboundVolume.toLocaleString()} Tons</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 font-mono">
                {warehouses.length} Warehouse Hubs
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800/80 bg-slate-900/60 text-white backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Repackaging Yield</span>
                <Layers className="h-4 w-4 text-purple-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{repackagingOrders.length} Orders</span>
                <span className="text-xs font-semibold text-purple-400">{totalRepackagedUnits.toLocaleString()} Packets</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 font-mono">
                Bulk-to-Retail Conversions
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800/80 bg-slate-900/60 text-white backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Audited Movements</span>
                <History className="h-4 w-4 text-teal-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{stockMovements.length} Logs</span>
                <span className="text-xs font-semibold text-teal-400">Audited Ledger</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 font-mono">
                100% Immutability
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sub-Menu Operational Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Link href="/dashboard/supply-chain/bilties" className="group">
          <Card className="h-full border-slate-200 transition-all hover:border-blue-500 hover:shadow-lg dark:border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-base mt-2">Transport Bilties</CardTitle>
              <CardDescription className="text-xs">
                Manage bilty numbers, transporter tonnage splits, and remaining stock balance.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-xs font-semibold text-blue-600 dark:text-blue-400">
              {transportBilties.length} Bilties Logged &rarr;
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/supply-chain/vehicles" className="group">
          <Card className="h-full border-slate-200 transition-all hover:border-amber-500 hover:shadow-lg dark:border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Truck className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-base mt-2">Fleet Vehicles</CardTitle>
              <CardDescription className="text-xs">
                Heavy transport trucks, multi-axle trailers, tankers, drivers, and terminal status.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-xs font-semibold text-amber-600 dark:text-amber-400">
              {vehicles.length} Fleet Vehicles &rarr;
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/supply-chain/shipments" className="group">
          <Card className="h-full border-slate-200 transition-all hover:border-emerald-500 hover:shadow-lg dark:border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Boxes className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-base mt-2">Inbound Shipments</CardTitle>
              <CardDescription className="text-xs">
                Record incoming bulk freight arrivals, bilty allocations, and receiving dock logs.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {portShipments.length} Inbound Consignments &rarr;
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/supply-chain/repackaging" className="group">
          <Card className="h-full border-slate-200 transition-all hover:border-purple-500 hover:shadow-lg dark:border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Layers className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-base mt-2">Packet Repackaging</CardTitle>
              <CardDescription className="text-xs">
                Convert bulk raw commodities into retail consumer packets with automated yields.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-xs font-semibold text-purple-600 dark:text-purple-400">
              {repackagingOrders.length} Conversion Orders &rarr;
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/supply-chain/audit" className="group">
          <Card className="h-full border-slate-200 transition-all hover:border-teal-500 hover:shadow-lg dark:border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-teal-500/10 p-2.5 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <History className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-base mt-2">Movement Audit</CardTitle>
              <CardDescription className="text-xs">
                Immutable audit ledger tracking all stock transactions, timestamps, and operators.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-xs font-semibold text-teal-600 dark:text-teal-400">
              {stockMovements.length} Audited Logs &rarr;
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Bilties Tonnage Status Widget */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" /> Active Bilty Stock Balances
              </CardTitle>
              <CardDescription>Consignment bilty allocation meters and remaining stock tonnage</CardDescription>
            </div>
            <Link href="/dashboard/supply-chain/bilties">
              <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                View All ({transportBilties.length}) &rarr;
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {activeBilties.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No active transport bilties. Click "Record Inbound Cargo" to log a consignment and assign bilties.
              </div>
            ) : (
              <div className="space-y-4">
                {activeBilties.slice(0, 5).map((bilty) => {
                  const init = bilty.initial_quantity || 1;
                  const rem = bilty.remaining_quantity || 0;
                  const pctRemaining = Math.round((rem / init) * 100);

                  return (
                    <div key={bilty._id} className="rounded-lg border p-3.5 space-y-2 hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-primary">{bilty.bilty_number}</span>
                          <Badge variant="outline" className="text-[10px] font-medium">
                            {bilty.warehouse_id?.warehouse_name || "Facility"}
                          </Badge>
                        </div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {rem.toLocaleString()} / {init.toLocaleString()} {bilty.unit_of_measure || "Tons"} Remaining
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Transporter: <strong className="text-slate-800 dark:text-slate-200">{bilty.transporter_name}</strong></span>
                        <span>SKU: <strong className="text-slate-800 dark:text-slate-200">{bilty.product_id?.product_name || "N/A"}</strong></span>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className={`h-full transition-all duration-300 ${
                            pctRemaining <= 20
                              ? "bg-rose-500"
                              : pctRemaining <= 50
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${pctRemaining}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Action Shortcuts Panel */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" /> Operational Action Center
              </CardTitle>
              <CardDescription>Execute common supply chain tasks directly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <PermissionGuard module="inventory" action="create">
                <Button
                  onClick={() => setIsPortModalOpen(true)}
                  variant="outline"
                  className="w-full justify-start text-left font-semibold hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                >
                  <div className="mr-3 rounded-md bg-emerald-500/10 p-2 text-emerald-600">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm">Record Inbound Cargo</div>
                    <div className="text-[11px] text-muted-foreground font-normal">Log bulk arrival & split bilties</div>
                  </div>
                </Button>
              </PermissionGuard>

              <PermissionGuard module="inventory" action="create">
                <Button
                  onClick={() => setIsVehicleModalOpen(true)}
                  variant="outline"
                  className="w-full justify-start text-left font-semibold hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                >
                  <div className="mr-3 rounded-md bg-blue-500/10 p-2 text-blue-600">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm">Register Transport Vehicle</div>
                    <div className="text-[11px] text-muted-foreground font-normal">Add truck, trailer or tanker to fleet</div>
                  </div>
                </Button>
              </PermissionGuard>

              <PermissionGuard module="inventory" action="create">
                <Button
                  onClick={() => setIsOutboundModalOpen(true)}
                  variant="outline"
                  className="w-full justify-start text-left font-semibold hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                >
                  <div className="mr-3 rounded-md bg-amber-500/10 p-2 text-amber-600">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm">Dispatch Goods By Bilty</div>
                    <div className="text-[11px] text-muted-foreground font-normal">Deduct stock balance from active bilty</div>
                  </div>
                </Button>
              </PermissionGuard>

              <PermissionGuard module="inventory" action="create">
                <Button
                  onClick={() => setIsRepackageModalOpen(true)}
                  variant="outline"
                  className="w-full justify-start text-left font-semibold hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20"
                >
                  <div className="mr-3 rounded-md bg-purple-500/10 p-2 text-purple-600">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm">Execute Packet Repackaging</div>
                    <div className="text-[11px] text-muted-foreground font-normal">Convert bulk raw tonnage into packets</div>
                  </div>
                </Button>
              </PermissionGuard>
            </CardContent>
          </div>

          <div className="p-6 border-t bg-slate-50 dark:bg-slate-900/40 rounded-b-xl">
            <div className="text-xs text-muted-foreground font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Multi-Warehouse RBAC Scoping Active
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Actions are automatically tagged and scoped to your assigned warehouse facility.
            </p>
          </div>
        </Card>
      </div>

      {/* Recent Stock Movement Stream Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-teal-600" /> Live Movement & Audit Stream
            </CardTitle>
            <CardDescription>Most recent stock receipts, dispatches, and repackaging events</CardDescription>
          </div>
          <Link href="/dashboard/supply-chain/audit">
            <Button variant="outline" size="sm" className="text-xs">
              View Audit Ledger &rarr;
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                  <TableHead className="font-semibold">Event</TableHead>
                  <TableHead className="font-semibold">SKU / Material</TableHead>
                  <TableHead className="font-semibold">Warehouse Hub</TableHead>
                  <TableHead className="font-semibold">Bilty # Ref</TableHead>
                  <TableHead className="font-semibold text-right">Quantity</TableHead>
                  <TableHead className="font-semibold">Logged By</TableHead>
                  <TableHead className="font-semibold">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No stock movement audit records logged yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  stockMovements.slice(0, 6).map((mov) => {
                    const isPositive = mov.quantity > 0;
                    const biltyNum = mov.bilty_id?.bilty_number || mov.bilty_number;

                    return (
                      <TableRow key={mov._id} className="hover:bg-muted/40 text-xs">
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              mov.movement_type.includes("inbound") || mov.movement_type.includes("in")
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 font-semibold"
                                : mov.movement_type.includes("outbound") || mov.movement_type.includes("out")
                                ? "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400 font-semibold"
                                : "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400 font-semibold"
                            }
                          >
                            {mov.movement_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">{mov.product_id?.product_name || "N/A"}</TableCell>
                        <TableCell>
                          {mov.to_warehouse?.warehouse_name || mov.from_warehouse?.warehouse_name || "Warehouse"}
                        </TableCell>
                        <TableCell className="font-mono text-blue-600 font-semibold">
                          {biltyNum || "—"}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          <span className={isPositive ? "text-emerald-600" : "text-rose-600"}>
                            {isPositive ? `+${mov.quantity}` : mov.quantity} {mov.product_id?.unit_of_measure || "Units"}
                          </span>
                        </TableCell>
                        <TableCell>{mov.created_by?.name || "System"}</TableCell>
                        <TableCell className="text-muted-foreground font-mono">
                          {new Date(mov.created_at).toLocaleDateString()} {new Date(mov.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

      {/* Record Inbound Modal */}
      <Dialog open={isPortModalOpen} onOpenChange={setIsPortModalOpen}>
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
                    placeholder="e.g. Domestic Supplier"
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
                    <Input disabled value={warehouses.find((w) => w._id === userWarehouseId)?.warehouse_name || "Your Warehouse"} />
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
                    <p className="text-xs text-muted-foreground">Divide total weight across transport bilties.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setBiltyRows([...biltyRows, { bilty_number: "", transporter_name: "", vehicle_number: "", quantity: "" }])}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Bilty
                  </Button>
                </div>

                <div className="space-y-2">
                  {biltyRows.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-background p-2 rounded-lg border text-xs">
                      <div className="col-span-3">
                        <Input
                          placeholder="Bilty #"
                          value={row.bilty_number}
                          onChange={(e) => {
                            const updated = [...biltyRows];
                            updated[idx].bilty_number = e.target.value;
                            setBiltyRows(updated);
                          }}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Transporter Name"
                          value={row.transporter_name}
                          onChange={(e) => {
                            const updated = [...biltyRows];
                            updated[idx].transporter_name = e.target.value;
                            setBiltyRows(updated);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Vehicle #"
                          value={row.vehicle_number}
                          onChange={(e) => {
                            const updated = [...biltyRows];
                            updated[idx].vehicle_number = e.target.value;
                            setBiltyRows(updated);
                          }}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Qty"
                          value={row.quantity}
                          onChange={(e) => {
                            const updated = [...biltyRows];
                            updated[idx].quantity = e.target.value;
                            setBiltyRows(updated);
                          }}
                          className="h-8 text-xs font-bold"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        {biltyRows.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setBiltyRows(biltyRows.filter((_, i) => i !== idx))}
                            className="h-7 w-7 text-rose-500 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsPortModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 font-semibold text-white hover:bg-emerald-500">
                {isSubmitting ? "Processing..." : "Record Inbound Cargo & Bilties"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Vehicle Modal */}
      <Dialog open={isVehicleModalOpen} onOpenChange={setIsVehicleModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <form onSubmit={handleRegisterVehicle}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Truck className="h-5 w-5 text-blue-600" /> Register Fleet Transport Vehicle
              </DialogTitle>
              <DialogDescription>Add a truck, trailer or tanker to your transport fleet pool.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="v_num" className="font-semibold">Vehicle Registration # *</Label>
                  <Input
                    id="v_num"
                    placeholder="e.g. KBL-8821"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="v_type" className="font-semibold">Vehicle Category *</Label>
                  <Select value={vehicleType} onValueChange={(val) => setVehicleType(val)}>
                    <SelectTrigger id="v_type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="truck">Heavy Freight Truck</SelectItem>
                      <SelectItem value="trailer">Multi-Axle Flatbed Trailer</SelectItem>
                      <SelectItem value="container">Cargo Container Truck</SelectItem>
                      <SelectItem value="tanker">Liquid Bulk Tanker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="v_comp" className="font-semibold">Transporter Company *</Label>
                  <Input
                    id="v_comp"
                    placeholder="e.g. Express Freight"
                    value={transporterCompany}
                    onChange={(e) => setTransporterCompany(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="v_cap" className="font-semibold">Payload Capacity (Tons)</Label>
                  <Input
                    id="v_cap"
                    type="number"
                    placeholder="e.g. 30"
                    value={capacityTons}
                    onChange={(e) => setCapacityTons(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="d_name" className="font-semibold">Driver Name</Label>
                  <Input
                    id="d_name"
                    placeholder="e.g. Muhammad Ali"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="d_phone" className="font-semibold">Driver Phone</Label>
                  <Input
                    id="d_phone"
                    placeholder="e.g. +92 300 1234567"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsVehicleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 font-semibold text-white hover:bg-blue-500">
                {isSubmitting ? "Registering..." : "Register Vehicle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Outbound Dispatch Modal */}
      <Dialog open={isOutboundModalOpen} onOpenChange={setIsOutboundModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <form onSubmit={handleOutboundDispatch}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <ShoppingCart className="h-5 w-5 text-amber-600" /> Outbound Dispatch By Transport Bilty
              </DialogTitle>
              <DialogDescription>
                Deduct quantity from an active bilty and update stock ledger upon dispatch.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="out_bilty" className="font-semibold">Select Active Transport Bilty *</Label>
                <Select value={selectedBiltyId} onValueChange={(val) => setSelectedBiltyId(val)} required>
                  <SelectTrigger id="out_bilty">
                    <SelectValue placeholder="Choose active bilty number" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBilties.map((b) => (
                      <SelectItem key={b._id} value={b._id}>
                        {b.bilty_number} — {b.product_id?.product_name} ({b.remaining_quantity} {b.unit_of_measure} Remaining)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="out_qty" className="font-semibold">Dispatch Quantity *</Label>
                <Input
                  id="out_qty"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 5.0"
                  value={dispatchQuantity}
                  onChange={(e) => setDispatchQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="out_dest" className="font-semibold">Destination Address / Market Hub</Label>
                <Input
                  id="out_dest"
                  placeholder="e.g. Metro Wholesale Hub, Store 4"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="out_notes" className="font-semibold">Dispatch Notes / Gate Pass #</Label>
                <Input
                  id="out_notes"
                  placeholder="e.g. Gate Pass GP-9941"
                  value={outboundNotes}
                  onChange={(e) => setOutboundNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsOutboundModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-amber-600 font-semibold text-white hover:bg-amber-500">
                {isSubmitting ? "Dispatching..." : "Execute Bilty Dispatch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Packet Repackaging Modal */}
      <Dialog open={isRepackageModalOpen} onOpenChange={setIsRepackageModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleRepackage}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Layers className="h-5 w-5 text-purple-600" /> Bulk-to-Packet Repackaging
              </DialogTitle>
              <DialogDescription>Convert bulk tonnage into packaged retail SKUs.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {!isWarehouseUser ? (
                <div className="space-y-2">
                  <Label htmlFor="r_wh" className="font-semibold">Warehouse Hub *</Label>
                  <Select value={repWhId} onValueChange={(val) => setRepWhId(val)} required>
                    <SelectTrigger id="r_wh">
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
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="r_src" className="font-semibold text-rose-600">Source Bulk Product *</Label>
                  <Select value={repSourceProd} onValueChange={(val) => setRepSourceProd(val)} required>
                    <SelectTrigger id="r_src">
                      <SelectValue placeholder="Select Bulk Material" />
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
                <div className="space-y-2">
                  <Label htmlFor="r_src_q" className="font-semibold text-rose-600">Bulk Qty Consumed *</Label>
                  <Input
                    id="r_src_q"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 2.0 (Tons)"
                    value={repSourceQty}
                    onChange={(e) => setRepSourceQty(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="r_tgt" className="font-semibold text-emerald-600">Target Retail Packet SKU *</Label>
                  <Select value={repTargetProd} onValueChange={(val) => setRepTargetProd(val)} required>
                    <SelectTrigger id="r_tgt">
                      <SelectValue placeholder="Select Packet Product" />
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
                <div className="space-y-2">
                  <Label htmlFor="r_tgt_q" className="font-semibold text-emerald-600">Packets Produced *</Label>
                  <Input
                    id="r_tgt_q"
                    type="number"
                    placeholder="e.g. 2000"
                    value={repTargetQty}
                    onChange={(e) => setRepTargetQty(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsRepackageModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-purple-600 font-semibold text-white hover:bg-purple-500">
                {isSubmitting ? "Converting..." : "Execute Repackaging"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
