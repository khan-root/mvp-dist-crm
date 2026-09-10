export const dynamic = "force-dynamic";

import { dbConnect } from "@/lib/db";
import { Product, Warehouse, PortShipment, RepackagingOrder, StockMovement, User, TransportBilty, DeliveryVehicle } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { getFacilityScopeFilter } from "@/lib/user";
import { redirect } from "next/navigation";
import { SupplyChainOverviewClient } from "./supply-chain-overview-client";

export const metadata = {
  title: "Supply Chain & Logistics Studio | RoutePro CRM",
  description: "Executive Logistics Analytics, Inbound Shipments, Transport Bilties, Fleet Vehicles, Repackaging & Audit Ledgers",
};

export default async function SupplyChainPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await dbConnect();

  const shipmentFilter = await getFacilityScopeFilter(session.userId, session.tenantId, "warehouse_id");
  const repackageFilter = await getFacilityScopeFilter(session.userId, session.tenantId, "repackaging");
  const movementFilter = await getFacilityScopeFilter(session.userId, session.tenantId, "movements");
  const biltyFilter = await getFacilityScopeFilter(session.userId, session.tenantId, "warehouse_id");
  const vehicleFilter = await getFacilityScopeFilter(session.userId, session.tenantId, "warehouse_id");

  const [products, warehouses, portShipments, repackagingOrders, stockMovements, users, transportBilties, vehicles, currentUser] = await Promise.all([
    Product.find({ tenant_id: session.tenantId }).select("product_name sku unit_of_measure category_id brand_id pricing").lean(),
    Warehouse.find({ tenant_id: session.tenantId, is_active: true }).select("warehouse_name warehouse_code address").lean(),
    PortShipment.find(shipmentFilter)
      .populate("warehouse_id", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean(),
    RepackagingOrder.find(repackageFilter)
      .populate("source_warehouse_id", "warehouse_name warehouse_code")
      .populate("source_product_id", "product_name sku unit_of_measure")
      .populate("target_product_id", "product_name sku unit_of_measure")
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean(),
    StockMovement.find(movementFilter)
      .populate("from_warehouse", "warehouse_name warehouse_code")
      .populate("to_warehouse", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .populate({ path: "bilty_id", select: "bilty_number transporter_name remaining_quantity initial_quantity", strictPopulate: false })
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean(),
    User.find({ tenant_id: session.tenantId }).select("name email role_id assigned_facility assigned_warehouse_id").populate("role_id", "name code").populate("assigned_warehouse_id", "warehouse_name warehouse_code").lean(),
    TransportBilty.find(biltyFilter)
      .populate("warehouse_id", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .populate("port_shipment_id", "shipment_number vessel_name origin_country")
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean(),
    DeliveryVehicle.find({ ...vehicleFilter, is_active: true })
      .populate("warehouse_id", "warehouse_name warehouse_code")
      .sort({ created_at: -1 })
      .lean(),
    User.findById(session.userId).populate("role_id", "name code").populate("assigned_warehouse_id", "warehouse_name warehouse_code").lean(),
  ]);

  return (
    <SupplyChainOverviewClient
      initialProducts={JSON.parse(JSON.stringify(products))}
      initialWarehouses={JSON.parse(JSON.stringify(warehouses))}
      initialPortShipments={JSON.parse(JSON.stringify(portShipments))}
      initialRepackagingOrders={JSON.parse(JSON.stringify(repackagingOrders))}
      initialStockMovements={JSON.parse(JSON.stringify(stockMovements))}
      initialTransportBilties={JSON.parse(JSON.stringify(transportBilties))}
      initialVehicles={JSON.parse(JSON.stringify(vehicles))}
      currentUser={JSON.parse(JSON.stringify(currentUser))}
    />
  );
}

