import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { RepackagingOrder, Inventory, Product, Warehouse, StockMovement } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const CreateRepackagingSchema = z.object({
  port_facility_name: z.string().min(1).default("Karachi Port Terminal Facility"),
  source_warehouse_id: z.string().min(1),
  source_product_id: z.string().min(1),
  source_quantity_used: z.number().positive(),
  target_product_id: z.string().min(1),
  target_quantity_produced: z.number().positive(),
  conversion_ratio: z.string().optional(),
  operator_name: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    await dbConnect();

    const orders = await RepackagingOrder.find({ tenant_id: session.tenantId })
      .populate("source_warehouse_id", "warehouse_name warehouse_code")
      .populate("source_product_id", "product_name sku unit_of_measure")
      .populate("target_product_id", "product_name sku unit_of_measure")
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ data: orders });
  } catch (e: any) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: e?.message || "Failed to list repackaging orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = CreateRepackagingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    const {
      port_facility_name,
      source_warehouse_id,
      source_product_id,
      source_quantity_used,
      target_product_id,
      target_quantity_produced,
      conversion_ratio,
      operator_name,
      notes,
    } = parsed.data;

    // Verify source bulk inventory available
    let sourceInv = await Inventory.findOne({
      tenant_id: session.tenantId,
      warehouse_id: source_warehouse_id,
      product_id: source_product_id,
    });

    const currentSourceAvail = sourceInv?.quantities?.available ?? 0;
    if (currentSourceAvail < source_quantity_used) {
      return NextResponse.json(
        {
          error: `Insufficient bulk inventory at facility. Available: ${currentSourceAvail}, Required: ${source_quantity_used}`,
        },
        { status: 400 }
      );
    }

    // 1. Deduct bulk stock
    const prevSourceStock = sourceInv.quantities.current;
    const newSourceStock = prevSourceStock - source_quantity_used;
    sourceInv.quantities.current = Math.max(0, newSourceStock);
    sourceInv.quantities.available = Math.max(0, sourceInv.quantities.available - source_quantity_used);
    sourceInv.last_updated_at = new Date();
    sourceInv.last_updated_by = session.userId;
    await sourceInv.save();

    // 2. Increment target packet stock
    let targetInv = await Inventory.findOne({
      tenant_id: session.tenantId,
      warehouse_id: source_warehouse_id,
      product_id: target_product_id,
    });

    if (!targetInv) {
      targetInv = new Inventory({
        tenant_id: session.tenantId,
        warehouse_id: source_warehouse_id,
        product_id: target_product_id,
        quantities: {
          current: 0,
          reserved: 0,
          available: 0,
        },
      });
    }

    const prevTargetStock = targetInv.quantities.current;
    const newTargetStock = prevTargetStock + target_quantity_produced;
    targetInv.quantities.current = newTargetStock;
    targetInv.quantities.available += target_quantity_produced;
    targetInv.last_updated_at = new Date();
    targetInv.last_updated_by = session.userId;
    await targetInv.save();

    // 3. Log Stock Movement for Consumption (Bulk Product)
    await StockMovement.create({
      tenant_id: session.tenantId,
      movement_type: "consumption",
      product_id: source_product_id,
      from_warehouse: source_warehouse_id,
      quantity: source_quantity_used,
      previous_stock: prevSourceStock,
      new_stock: newSourceStock,
      reason: "Bulk Repackaging / Packet Generation",
      notes: `Converted ${source_quantity_used} bulk units into ${target_quantity_produced} packets at ${port_facility_name}`,
      created_by: session.userId,
    });

    // 4. Log Stock Movement for Production (Packet Product)
    await StockMovement.create({
      tenant_id: session.tenantId,
      movement_type: "production",
      product_id: target_product_id,
      to_warehouse: source_warehouse_id,
      quantity: target_quantity_produced,
      previous_stock: prevTargetStock,
      new_stock: newTargetStock,
      reason: "Bulk Repackaging Output",
      notes: `Generated ${target_quantity_produced} standardized packets from bulk shipment at ${port_facility_name}`,
      created_by: session.userId,
    });

    // 5. Create Repackaging Order record
    const orderNumber = `REPKG-${Date.now().toString().slice(-6)}`;
    const newOrder = await RepackagingOrder.create({
      tenant_id: session.tenantId,
      order_number: orderNumber,
      port_facility_name,
      source_warehouse_id,
      source_product_id,
      source_quantity_used,
      target_product_id,
      target_quantity_produced,
      conversion_ratio: conversion_ratio || `1 Bulk Unit -> ${(target_quantity_produced / source_quantity_used).toFixed(1)} Packets`,
      operator_name: operator_name || "Port Operator",
      notes,
      created_by: session.userId,
    });

    return NextResponse.json({ data: newOrder });
  } catch (e: any) {
    console.error("Repackaging API Error:", e);
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: e?.message || "Failed to execute repackaging operation" }, { status: 500 });
  }
}
