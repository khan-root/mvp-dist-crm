import { dbConnect } from "@/lib/db";
import { PortShipment, Warehouse, Product, User } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShipmentsClientView } from "./shipments-client-view";

export const metadata = {
  title: "Inbound Cargo Shipments | RoutePro CRM",
  description: "Record inbound cargo arrivals, split bulk tonnage across transporter bilties, and log warehouse receipts.",
};

export default async function ShipmentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await dbConnect();

  const [portShipments, warehouses, products, currentUser] = await Promise.all([
    PortShipment.find({ tenant_id: session.tenantId })
      .populate("warehouse_id", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean(),
    Warehouse.find({ tenant_id: session.tenantId, is_active: true }).select("warehouse_name warehouse_code").lean(),
    Product.find({ tenant_id: session.tenantId }).select("product_name sku unit_of_measure").lean(),
    User.findById(session.userId).populate("role_id", "name code").populate("assigned_warehouse_id", "warehouse_name warehouse_code").lean(),
  ]);

  return (
    <ShipmentsClientView
      initialShipments={JSON.parse(JSON.stringify(portShipments))}
      warehouses={JSON.parse(JSON.stringify(warehouses))}
      products={JSON.parse(JSON.stringify(products))}
      currentUser={JSON.parse(JSON.stringify(currentUser))}
    />
  );
}
