import { dbConnect } from "@/lib/db";
import { DeliveryVehicle, Warehouse, User } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VehiclesClientView } from "./vehicles-client-view";

export const metadata = {
  title: "Fleet & Transport Vehicles | RoutePro CRM",
  description: "Manage heavy transport trucks, trailers, tankers, capacity allocation, driver profiles, and terminal assignments.",
};

export default async function VehiclesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await dbConnect();

  const [vehicles, warehouses, currentUser] = await Promise.all([
    DeliveryVehicle.find({ tenant_id: session.tenantId, is_active: true })
      .populate("warehouse_id", "warehouse_name warehouse_code")
      .sort({ created_at: -1 })
      .lean(),
    Warehouse.find({ tenant_id: session.tenantId, is_active: true }).select("warehouse_name warehouse_code").lean(),
    User.findById(session.userId).populate("role_id", "name code").populate("assigned_warehouse_id", "warehouse_name warehouse_code").lean(),
  ]);

  return (
    <VehiclesClientView
      initialVehicles={JSON.parse(JSON.stringify(vehicles))}
      warehouses={JSON.parse(JSON.stringify(warehouses))}
      currentUser={JSON.parse(JSON.stringify(currentUser))}
    />
  );
}
