export const dynamic = "force-dynamic";

import { dbConnect } from "@/lib/db";
import { TransportBilty, Warehouse, Product, PortShipment, User } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BiltiesClientView } from "./bilties-client-view";

import { getFacilityScopeFilter } from "@/lib/user";

export const metadata = {
  title: "Transport Bilties Ledger | RoutePro CRM",
  description: "Manage bilty allocations, remaining tonnage, transporter fleets, and shipment deductions.",
};

export default async function TransportBiltiesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await dbConnect();

  const biltyFilter = await getFacilityScopeFilter(session.userId, session.tenantId, "warehouse_id");
  const shipmentFilter = await getFacilityScopeFilter(session.userId, session.tenantId, "warehouse_id");

  const [transportBilties, warehouses, products, portShipments, currentUser] = await Promise.all([
    TransportBilty.find(biltyFilter)
      .populate("warehouse_id", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .populate("port_shipment_id", "shipment_number vessel_name origin_country")
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean(),
    Warehouse.find({ tenant_id: session.tenantId, is_active: true }).select("warehouse_name warehouse_code").lean(),
    Product.find({ tenant_id: session.tenantId }).select("product_name sku unit_of_measure").lean(),
    PortShipment.find(shipmentFilter).select("shipment_number vessel_name origin_country").lean(),
    User.findById(session.userId).populate("role_id", "name code").populate("assigned_warehouse_id", "warehouse_name warehouse_code").lean(),
  ]);

  return (
    <BiltiesClientView
      initialBilties={JSON.parse(JSON.stringify(transportBilties))}
      warehouses={JSON.parse(JSON.stringify(warehouses))}
      products={JSON.parse(JSON.stringify(products))}
      portShipments={JSON.parse(JSON.stringify(portShipments))}
      currentUser={JSON.parse(JSON.stringify(currentUser))}
    />
  );
}
