export const dynamic = "force-dynamic";

import { dbConnect } from "@/lib/db";
import { Role, User, Warehouse } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RolesClientView } from "./roles-client-view";

export default async function RolesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await dbConnect();

  const [roles, users, warehouses] = await Promise.all([
    Role.find({ tenant_id: session.tenantId }).lean(),
    User.find({ tenant_id: session.tenantId })
      .populate("role_id", "name code permissions")
      .populate("assigned_warehouse_id", "warehouse_name warehouse_code")
      .sort({ created_at: -1 })
      .lean(),
    Warehouse.find({ tenant_id: session.tenantId, is_active: true }).select("warehouse_name warehouse_code address").lean(),
  ]);

  return (
    <RolesClientView
      initialRoles={JSON.parse(JSON.stringify(roles))}
      initialUsers={JSON.parse(JSON.stringify(users))}
      initialWarehouses={JSON.parse(JSON.stringify(warehouses))}
    />
  );
}
