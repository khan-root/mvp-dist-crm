import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Inventory, StockMovement, TransportBilty } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const InterWarehouseTransferSchema = z.object({
  from_warehouse_id: z.string().min(1),
  to_warehouse_id: z.string().min(1),
  product_id: z.string().min(1),
  quantity: z.number().positive(),
  bilty_id: z.string().optional(),
  vehicle_number: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    await dbConnect();

    const transfers = await StockMovement.find({
      tenant_id: session.tenantId,
      movement_type: { $in: ["transfer_out", "transfer_in"] },
    })
      .populate("from_warehouse", "warehouse_name warehouse_code")
      .populate("to_warehouse", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .populate({ path: "bilty_id", select: "bilty_number transporter_name vehicle_number remaining_quantity", strictPopulate: false })
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ data: transfers });
  } catch (e: any) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: e?.message || "Failed to list inter-warehouse transfers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = InterWarehouseTransferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    const { from_warehouse_id, to_warehouse_id, product_id, quantity, bilty_id, vehicle_number, notes } = parsed.data;

    if (from_warehouse_id === to_warehouse_id) {
      return NextResponse.json({ error: "Source and destination warehouses must be different" }, { status: 400 });
    }

    // 1. Check & deduct source warehouse inventory
    let sourceInv = await Inventory.findOne({
      tenant_id: session.tenantId,
      warehouse_id: from_warehouse_id,
      product_id,
    });

    const currentSourceAvail = sourceInv?.quantities?.available ?? 0;
    if (!sourceInv || currentSourceAvail < quantity) {
      return NextResponse.json(
        {
          error: `Insufficient inventory at source facility. Available: ${currentSourceAvail}, Requested transfer: ${quantity}`,
        },
        { status: 400 }
      );
    }

    // Deduct source stock
    const prevSourceStock = sourceInv.quantities.current;
    const newSourceStock = Math.max(0, prevSourceStock - quantity);
    sourceInv.quantities.current = newSourceStock;
    sourceInv.quantities.available = Math.max(0, sourceInv.quantities.available - quantity);
    sourceInv.last_updated_at = new Date();
    sourceInv.last_updated_by = session.userId;
    await sourceInv.save();

    // 2. Check & increment destination warehouse inventory
    let destInv = await Inventory.findOne({
      tenant_id: session.tenantId,
      warehouse_id: to_warehouse_id,
      product_id,
    });

    if (!destInv) {
      destInv = new Inventory({
        tenant_id: session.tenantId,
        warehouse_id: to_warehouse_id,
        product_id,
        quantities: {
          current: 0,
          reserved: 0,
          available: 0,
        },
      });
    }

    const prevDestStock = destInv.quantities.current;
    const newDestStock = prevDestStock + quantity;
    destInv.quantities.current = newDestStock;
    destInv.quantities.available += quantity;
    destInv.last_updated_at = new Date();
    destInv.last_updated_by = session.userId;
    await destInv.save();

    // 3. Deduct Transport Bilty balance if bilty is linked
    let biltyDoc: any = null;
    if (bilty_id) {
      biltyDoc = await TransportBilty.findOne({
        _id: bilty_id,
        tenant_id: session.tenantId,
      });

      if (biltyDoc) {
        biltyDoc.dispatched_quantity += quantity;
        biltyDoc.remaining_quantity = Math.max(0, biltyDoc.remaining_quantity - quantity);
        if (biltyDoc.remaining_quantity === 0) {
          biltyDoc.status = "exhausted";
        }
        await biltyDoc.save();
      }
    }

    // 4. Log Stock Movements for Transfer Out & Transfer In
    const transferOut = await StockMovement.create({
      tenant_id: session.tenantId,
      movement_type: "transfer_out",
      product_id,
      from_warehouse: from_warehouse_id,
      to_warehouse: to_warehouse_id,
      quantity,
      previous_stock: prevSourceStock,
      new_stock: newSourceStock,
      bilty_id: biltyDoc?._id || undefined,
      bilty_number: biltyDoc?.bilty_number || undefined,
      reason: "Inter-Warehouse Stock Freight Transfer",
      notes: `Dispatched to Destination Warehouse.${biltyDoc ? ` (Bilty #: ${biltyDoc.bilty_number})` : ""} ${vehicle_number ? `Vehicle: ${vehicle_number}` : ""} ${notes || ""}`,
      created_by: session.userId,
    });

    await StockMovement.create({
      tenant_id: session.tenantId,
      movement_type: "transfer_in",
      product_id,
      from_warehouse: from_warehouse_id,
      to_warehouse: to_warehouse_id,
      quantity,
      previous_stock: prevDestStock,
      new_stock: newDestStock,
      bilty_id: biltyDoc?._id || undefined,
      bilty_number: biltyDoc?.bilty_number || undefined,
      reason: "Inter-Warehouse Stock Receipt",
      notes: `Received from Source Facility.${biltyDoc ? ` (Bilty #: ${biltyDoc.bilty_number})` : ""} ${vehicle_number ? `Vehicle: ${vehicle_number}` : ""} ${notes || ""}`,
      created_by: session.userId,
    });

    return NextResponse.json({ data: transferOut });
  } catch (e: any) {
    console.error("Inter-Warehouse Transfer API Error:", e);
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: e?.message || "Failed to execute inter-warehouse transfer" }, { status: 500 });
  }
}
