import { dbConnect } from "@/lib/db";
import { Product, Warehouse, PortShipment, RepackagingOrder, StockMovement, User } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SupplyChainClientView } from "./supply-chain-client-view";

export const metadata = {
  title: "Supply Chain & Repackaging Hub | RoutePro CRM",
  description: "Port Inbound Shipments, Bulk-to-Packet Repackaging, Multi-Warehouse Distribution & Outbound Market Sales",
};

export default async function SupplyChainPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await dbConnect();

  const [products, warehouses, portShipments, repackagingOrders, stockMovements, users] = await Promise.all([
    Product.find({ tenant_id: session.tenantId }).select("product_name sku unit_of_measure category_id brand_id pricing").lean(),
    Warehouse.find({ tenant_id: session.tenantId, is_active: true }).select("warehouse_name warehouse_code address").lean(),
    PortShipment.find({ tenant_id: session.tenantId })
      .populate("warehouse_id", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean(),
    RepackagingOrder.find({ tenant_id: session.tenantId })
      .populate("source_warehouse_id", "warehouse_name warehouse_code")
      .populate("source_product_id", "product_name sku unit_of_measure")
      .populate("target_product_id", "product_name sku unit_of_measure")
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean(),
    StockMovement.find({ tenant_id: session.tenantId })
      .populate("from_warehouse", "warehouse_name warehouse_code")
      .populate("to_warehouse", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean(),
    User.find({ tenant_id: session.tenantId }).select("name email role_id assigned_facility").populate("role_id", "name code").lean(),
  ]);

  return (
    <SupplyChainClientView
      initialProducts={JSON.parse(JSON.stringify(products))}
      initialWarehouses={JSON.parse(JSON.stringify(warehouses))}
      initialPortShipments={JSON.parse(JSON.stringify(portShipments))}
      initialRepackagingOrders={JSON.parse(JSON.stringify(repackagingOrders))}
      initialStockMovements={JSON.parse(JSON.stringify(stockMovements))}
      initialUsers={JSON.parse(JSON.stringify(users))}
    />
  );
}
