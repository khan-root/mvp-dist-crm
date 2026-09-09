import { dbConnect } from "@/lib/db";
import { StockMovement, Warehouse, Product, User } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuditClientView } from "./audit-client-view";

export const metadata = {
  title: "Stock Movement Audit Trail | RoutePro CRM",
  description: "Comprehensive audited record of all stock receipts, bilty dispatches, repackaging conversions, and inter-facility transfers.",
};

export default async function MovementAuditPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await dbConnect();

  const [stockMovements, warehouses, products, currentUser] = await Promise.all([
    StockMovement.find({ tenant_id: session.tenantId })
      .populate("from_warehouse", "warehouse_name warehouse_code")
      .populate("to_warehouse", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .populate({ path: "bilty_id", select: "bilty_number transporter_name remaining_quantity initial_quantity", strictPopulate: false })
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean(),
    Warehouse.find({ tenant_id: session.tenantId, is_active: true }).select("warehouse_name warehouse_code").lean(),
    Product.find({ tenant_id: session.tenantId }).select("product_name sku unit_of_measure").lean(),
    User.findById(session.userId).populate("role_id", "name code").populate("assigned_warehouse_id", "warehouse_name warehouse_code").lean(),
  ]);

  return (
    <AuditClientView
      initialMovements={JSON.parse(JSON.stringify(stockMovements))}
      warehouses={JSON.parse(JSON.stringify(warehouses))}
      products={JSON.parse(JSON.stringify(products))}
      currentUser={JSON.parse(JSON.stringify(currentUser))}
    />
  );
}
