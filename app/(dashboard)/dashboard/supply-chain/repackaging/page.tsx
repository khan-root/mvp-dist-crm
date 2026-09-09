export const dynamic = "force-dynamic";

import { dbConnect } from "@/lib/db";
import { RepackagingOrder, Warehouse, Product, User } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RepackagingClientView } from "./repackaging-client-view";

export const metadata = {
  title: "Packet Repackaging Studio | RoutePro CRM",
  description: "Convert raw bulk commodities (Tons) into retail consumer packets (Bags/Boxes) with automated yield calculation.",
};

export default async function RepackagingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await dbConnect();

  const [repackagingOrders, warehouses, products, currentUser] = await Promise.all([
    RepackagingOrder.find({ tenant_id: session.tenantId })
      .populate("source_warehouse_id", "warehouse_name warehouse_code")
      .populate("source_product_id", "product_name sku unit_of_measure")
      .populate("target_product_id", "product_name sku unit_of_measure")
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean(),
    Warehouse.find({ tenant_id: session.tenantId, is_active: true }).select("warehouse_name warehouse_code").lean(),
    Product.find({ tenant_id: session.tenantId }).select("product_name sku unit_of_measure").lean(),
    User.findById(session.userId).populate("role_id", "name code").populate("assigned_warehouse_id", "warehouse_name warehouse_code").lean(),
  ]);

  return (
    <RepackagingClientView
      initialOrders={JSON.parse(JSON.stringify(repackagingOrders))}
      warehouses={JSON.parse(JSON.stringify(warehouses))}
      products={JSON.parse(JSON.stringify(products))}
      currentUser={JSON.parse(JSON.stringify(currentUser))}
    />
  );
}
