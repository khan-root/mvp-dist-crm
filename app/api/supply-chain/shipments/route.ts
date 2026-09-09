import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { PortShipment, Inventory, StockMovement } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const CreateShipmentSchema = z.object({
  vessel_name: z.string().min(1),
  origin_country: z.string().default("International Port"),
  port_facility_name: z.string().min(1).default("Karachi Port Terminal Facility"),
  warehouse_id: z.string().min(1),
  product_id: z.string().min(1),
  quantity_received: z.number().positive(),
  unit_of_measure: z.string().default("Tons"),
  received_by_name: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    await dbConnect();

    const shipments = await PortShipment.find({ tenant_id: session.tenantId })
      .populate("warehouse_id", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ data: shipments });
  } catch (e: any) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: e?.message || "Failed to list port shipments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = CreateShipmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    const {
      vessel_name,
      origin_country,
      port_facility_name,
      warehouse_id,
      product_id,
      quantity_received,
      unit_of_measure,
      received_by_name,
    } = parsed.data;

    // Upsert Inventory at port/warehouse
    let inv = await Inventory.findOne({
      tenant_id: session.tenantId,
      warehouse_id,
      product_id,
    });

    if (!inv) {
      inv = new Inventory({
        tenant_id: session.tenantId,
        warehouse_id,
        product_id,
        quantities: {
          current: 0,
          reserved: 0,
          available: 0,
        },
      });
    }

    const prevStock = inv.quantities.current;
    const newStock = prevStock + quantity_received;
    inv.quantities.current = newStock;
    inv.quantities.available += quantity_received;
    inv.last_updated_at = new Date();
    inv.last_updated_by = session.userId;
    await inv.save();

    // Log Stock Movement
    const shipmentNumber = `SHIP-${Date.now().toString().slice(-6)}`;
    await StockMovement.create({
      tenant_id: session.tenantId,
      movement_type: "purchase_receipt",
      product_id,
      to_warehouse: warehouse_id,
      quantity: quantity_received,
      previous_stock: prevStock,
      new_stock: newStock,
      reason: "International Port Inbound Bulk Arrival",
      notes: `Vessel: ${vessel_name} (${origin_country}) landed at ${port_facility_name}`,
      created_by: session.userId,
    });

    // Create Port Shipment record
    const newShipment = await PortShipment.create({
      tenant_id: session.tenantId,
      shipment_number: shipmentNumber,
      vessel_name,
      origin_country,
      port_facility_name,
      warehouse_id,
      product_id,
      quantity_received,
      unit_of_measure,
      received_by_name: received_by_name || "Port Logistics Officer",
      created_by: session.userId,
    });

    return NextResponse.json({ data: newShipment });
  } catch (e: any) {
    console.error("Port Shipment API Error:", e);
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: e?.message || "Failed to record port shipment" }, { status: 500 });
  }
}
