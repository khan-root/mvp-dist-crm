export const dynamic = "force-dynamic";

import { dbConnect } from "@/lib/db";
import { StockMovement, TransportBilty, Warehouse, Product, Distributor, User } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OutboundClientView } from "./outbound-client-view";

export const metadata = {
  title: "Outbound Dealer Fulfillment (MvT 601) | RoutePro CRM",
  description: "Manage dealer sales dispatches, delivery challans, bilty remaining balance deductions, and SAP SD goods issue.",
};

export default async function OutboundPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await dbConnect();

  const [stockMovements, transportBilties, warehouses, products, distributors, currentUser] = await Promise.all([
    StockMovement.find({ tenant_id: session.tenantId, movement_type: "outbound" })
      .populate("from_warehouse", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .populate({ path: "bilty_id", select: "bilty_number transporter_name remaining_quantity initial_quantity", strictPopulate: false })
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean(),
    TransportBilty.find({ tenant_id: session.tenantId, status: "active" })
      .populate("warehouse_id", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .sort({ created_at: -1 })
      .lean(),
    Warehouse.find({ tenant_id: session.tenantId, is_active: true }).select("warehouse_name warehouse_code").lean(),
    Product.find({ tenant_id: session.tenantId }).select("product_name sku unit_of_measure").lean(),
    Distributor.find({ tenant_id: session.tenantId }).select("name business_name phone address").lean(),
    User.findById(session.userId).populate("role_id", "name code").populate("assigned_warehouse_id", "warehouse_name warehouse_code").lean(),
  ]);

  return (
    <OutboundClientView
      initialOutbounds={JSON.parse(JSON.stringify(stockMovements))}
      transportBilties={JSON.parse(JSON.stringify(transportBilties))}
      warehouses={JSON.parse(JSON.stringify(warehouses))}
      products={JSON.parse(JSON.stringify(products))}
      distributors={JSON.parse(JSON.stringify(distributors))}
      currentUser={JSON.parse(JSON.stringify(currentUser))}
    />
  );
}
