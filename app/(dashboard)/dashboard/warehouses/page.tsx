export const dynamic = "force-dynamic";

import connectDB from "@/lib/db";
import { Warehouse, Distributor, Product } from "@/lib/models";
import { WarehousesClientView } from "./warehouses-client-view";

export default async function WarehousesPage() {
  await connectDB();

  const [warehouses, distributors, products] = await Promise.all([
    Warehouse.find({ is_active: true }).sort({ warehouse_name: 1 }).lean(),
    Distributor.find({ is_active: true }).select("company_name distributor_code").lean(),
    Product.find({ "status.is_active": true }).select("product_name product_code sku pricing inventory").lean(),
  ]);

  const serializedWarehouses = warehouses.map((w: any) => ({
    _id: w._id.toString(),
    warehouse_code: w.warehouse_code,
    warehouse_name: w.warehouse_name,
    distributor_id: w.distributor_id?.toString(),
    address: w.address,
    contact: w.contact,
    capacity: w.capacity,
  }));

  const serializedDistributors = distributors.map((d: any) => ({
    _id: d._id.toString(),
    company_name: d.company_name,
    distributor_code: d.distributor_code,
  }));

  const serializedProducts = products.map((p: any) => ({
    _id: p._id.toString(),
    product_name: p.product_name,
    product_code: p.product_code,
    sku: p.sku,
  }));

  return (
    <WarehousesClientView
      initialWarehouses={serializedWarehouses}
      distributors={serializedDistributors}
      products={serializedProducts}
    />
  );
}
