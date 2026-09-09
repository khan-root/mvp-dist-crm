import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Inventory, StockMovement } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const OutboundDispatchSchema = z.object({
  warehouse_id: z.string().min(1),
  product_id: z.string().min(1),
  quantity: z.number().positive(),
  destination_buyer_market: z.string().min(1),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    await dbConnect();

    const movements = await StockMovement.find({
      tenant_id: session.tenantId,
      movement_type: "sales_issue",
    })
      .populate("from_warehouse", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ data: movements });
  } catch (e: any) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: e?.message || "Failed to list outbound dispatches" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = OutboundDispatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    const { warehouse_id, product_id, quantity, destination_buyer_market, notes } = parsed.data;

    let inv = await Inventory.findOne({
      tenant_id: session.tenantId,
      warehouse_id,
      product_id,
    });

    const currentAvail = inv?.quantities?.available ?? 0;
    if (!inv || currentAvail < quantity) {
      return NextResponse.json(
        {
          error: `Outbound transaction rejected: Insufficient warehouse inventory. Available: ${currentAvail}, Requested: ${quantity}`,
        },
        { status: 400 }
      );
    }

    const prevStock = inv.quantities.current;
    const newStock = Math.max(0, prevStock - quantity);
    inv.quantities.current = newStock;
    inv.quantities.available = Math.max(0, inv.quantities.available - quantity);
    inv.last_updated_at = new Date();
    inv.last_updated_by = session.userId;
    await inv.save();

    const movement = await StockMovement.create({
      tenant_id: session.tenantId,
      movement_type: "sales_issue",
      product_id,
      from_warehouse: warehouse_id,
      quantity,
      previous_stock: prevStock,
      new_stock: newStock,
      reason: "Market & Individual Buyer Outbound Sales Dispatch",
      notes: `Dispatched to: ${destination_buyer_market}. ${notes || ""}`,
      created_by: session.userId,
    });

    return NextResponse.json({ data: movement });
  } catch (e: any) {
    console.error("Outbound Dispatch API Error:", e);
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: e?.message || "Failed to execute outbound dispatch" }, { status: 500 });
  }
}
