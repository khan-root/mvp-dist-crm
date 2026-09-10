export const dynamic = "force-dynamic";

import { dbConnect } from "@/lib/db";
import { StockMovement, Warehouse, Product, TransportBilty, DeliveryVehicle, User } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TransfersClientView } from "./transfers-client-view";

export const metadata = {
  title: "Stock Transfer Orders (STO MvT 351/641) | RoutePro CRM",
  description: "Manage inter-warehouse stock transfers, in-transit cargo, transport bilty deductions, and SAP movement types.",
};

export default async function TransfersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await dbConnect();

  const [stockMovements, warehouses, products, transportBilties, vehicles, currentUser] = await Promise.all([
    StockMovement.find({ tenant_id: session.tenantId })
      .populate("from_warehouse", "warehouse_name warehouse_code")
      .populate("to_warehouse", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .populate({ path: "bilty_id", select: "bilty_number transporter_name remaining_quantity initial_quantity", strictPopulate: false })
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean(),
    Warehouse.find({ tenant_id: session.tenantId, is_active: true }).select("warehouse_name warehouse_code address").lean(),
    Product.find({ tenant_id: session.tenantId }).select("product_name sku unit_of_measure").lean(),
    TransportBilty.find({ tenant_id: session.tenantId })
      .populate("warehouse_id", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .sort({ created_at: -1 })
      .lean(),
    DeliveryVehicle.find({ tenant_id: session.tenantId, is_active: true }).select("vehicle_number vehicle_type driver_name transporter_company capacity_tons status").lean(),
    User.findById(session.userId).populate("role_id", "name code").populate("assigned_warehouse_id", "warehouse_name warehouse_code").lean(),
  ]);

  return (
    <TransfersClientView
      initialMovements={JSON.parse(JSON.stringify(stockMovements))}
      warehouses={JSON.parse(JSON.stringify(warehouses))}
      products={JSON.parse(JSON.stringify(products))}
      transportBilties={JSON.parse(JSON.stringify(transportBilties))}
      vehicles={JSON.parse(JSON.stringify(vehicles))}
      currentUser={JSON.parse(JSON.stringify(currentUser))}
    />
  );
}
