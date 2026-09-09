import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Inventory, StockMovement, Product, Warehouse, Tenant } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { from_warehouse_id, to_warehouse_id, product_id, quantity, reason = "Inter-warehouse stock transfer" } = body;

    if (!from_warehouse_id || !to_warehouse_id || !product_id || !quantity || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: "from_warehouse_id, to_warehouse_id, product_id, and positive quantity required" },
        { status: 400 }
      );
    }

    if (from_warehouse_id === to_warehouse_id) {
      return NextResponse.json({ success: false, error: "Source and destination warehouses cannot be the same" }, { status: 400 });
    }

    const tenant = await Tenant.findOne();
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant context not found" }, { status: 404 });
    }

    const product = await Product.findById(product_id);
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const [fromWh, toWh] = await Promise.all([
      Warehouse.findById(from_warehouse_id),
      Warehouse.findById(to_warehouse_id),
    ]);

    if (!fromWh || !toWh) {
      return NextResponse.json({ success: false, error: "Source or destination warehouse not found" }, { status: 404 });
    }

    // Check source warehouse stock
    let sourceInv = await Inventory.findOne({
      tenant_id: tenant._id,
      warehouse_id: from_warehouse_id,
      product_id,
    });

    const availableStock = sourceInv ? sourceInv.quantities?.current || 0 : product.inventory?.current_stock || 0;

    if (availableStock < quantity) {
      return NextResponse.json(
        { success: false, error: `Insufficient stock in ${fromWh.warehouse_name}. Available: ${availableStock}, Requested: ${quantity}` },
        { status: 400 }
      );
    }

    // Deduct stock from source warehouse
    if (sourceInv) {
      sourceInv.quantities.current = Math.max(0, sourceInv.quantities.current - quantity);
      sourceInv.quantities.available = Math.max(0, sourceInv.quantities.available - quantity);
      await sourceInv.save();
    }

    // Add stock to destination warehouse
    let destInv = await Inventory.findOne({
      tenant_id: tenant._id,
      warehouse_id: to_warehouse_id,
      product_id,
    });

    if (!destInv) {
      destInv = await Inventory.create({
        tenant_id: tenant._id,
        warehouse_id: to_warehouse_id,
        product_id,
        quantities: {
          current: quantity,
          available: quantity,
        },
      });
    } else {
      destInv.quantities.current = (destInv.quantities.current || 0) + quantity;
      destInv.quantities.available = (destInv.quantities.available || 0) + quantity;
      await destInv.save();
    }

    // Record Stock Movement Logs
    await StockMovement.create({
      tenant_id: tenant._id,
      movement_type: "transfer_out",
      product_id,
      from_warehouse: from_warehouse_id,
      to_warehouse: to_warehouse_id,
      quantity,
      previous_stock: availableStock,
      new_stock: availableStock - quantity,
      unit_cost: product.pricing?.base_cost || 0,
      total_cost: (product.pricing?.base_cost || 0) * quantity,
      reason: `Transfer OUT to ${toWh.warehouse_name} (${reason})`,
    });

    await StockMovement.create({
      tenant_id: tenant._id,
      movement_type: "transfer_in",
      product_id,
      from_warehouse: from_warehouse_id,
      to_warehouse: to_warehouse_id,
      quantity,
      previous_stock: destInv.quantities.current - quantity,
      new_stock: destInv.quantities.current,
      unit_cost: product.pricing?.base_cost || 0,
      total_cost: (product.pricing?.base_cost || 0) * quantity,
      reason: `Transfer IN from ${fromWh.warehouse_name} (${reason})`,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${quantity} unit(s) of '${product.product_name}' from ${fromWh.warehouse_name} to ${toWh.warehouse_name}`,
    });
  } catch (error: any) {
    console.error("Error in stock transfer:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
