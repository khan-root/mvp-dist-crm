import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Order, Store, Product, User } from "@/lib/models";
import { getSession } from "@/lib/auth";

const ItemSchema = z.object({
  product_id: z.string().min(1),
  quantity: z.number().min(1),
});

const CreateFromStoreSchema = z.object({
  distributor_id: z.string().min(1).optional(),
  items: z.array(ItemSchema).min(1),
  notes: z.string().optional(),
});

function generateOrderNumber(tenantId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const short = tenantId.slice(-6).toUpperCase();
  return `ORD-${short}-${ts}`;
}

/** Store user (shop keeper) places an order. Order is from distributor to store, optional agent. */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = CreateFromStoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(session.userId).lean();
    const storeAssoc = user?.domain_associations?.find((a: { domain_type?: string }) => a.domain_type === "store");
    const storeId = storeAssoc?.domain_id?.toString?.();
    if (!storeId) return NextResponse.json({ error: "Not a store account" }, { status: 403 });

    const store = await Store.findOne({
      _id: storeId,
      tenant_id: session.tenantId,
    }).lean();
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const distributorId = parsed.data.distributor_id
      ? parsed.data.distributor_id
      : (store.distributor_id?.toString?.() ?? store.distributor_id);
    if (!distributorId) return NextResponse.json({ error: "Choose a distributor or assign one to your store" }, { status: 400 });

    const isDirectOrder = !!parsed.data.distributor_id;

    const itemsWithPrice: Array<{ product_id: string; quantity: number; unit_price: number }> = [];
    for (const item of parsed.data.items) {
      const product = await Product.findById(item.product_id).lean();
      if (!product || product.tenant_id.toString() !== session.tenantId) {
        return NextResponse.json({ error: `Product ${item.product_id} not found` }, { status: 404 });
      }
      const productDistId = product.distributor_id?.toString?.() ?? product.distributor_id;
      if (productDistId !== distributorId) {
        return NextResponse.json({ error: `Product ${product.product_name} is not from the selected distributor` }, { status: 400 });
      }
      const unitPrice = product.pricing?.retail_price ?? product.pricing?.wholesale_price ?? product.pricing?.mrp ?? 0;
      itemsWithPrice.push({ product_id: item.product_id, quantity: item.quantity, unit_price: unitPrice });
    }

    const orderItems = itemsWithPrice.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total: i.quantity * i.unit_price,
    }));
    const subtotal = orderItems.reduce((s, i) => s + i.total, 0);
    const grand_total = Math.round(subtotal * 100) / 100;

    let orderNumber = generateOrderNumber(session.tenantId);
    let exists = await Order.findOne({ order_number: orderNumber });
    while (exists) {
      orderNumber = generateOrderNumber(session.tenantId);
      exists = await Order.findOne({ order_number: orderNumber });
    }

    const doc = await Order.create({
      tenant_id: session.tenantId,
      order_number: orderNumber,
      order_type: "store_order",
      from_type: "distributor",
      from_id: distributorId,
      to_type: "store",
      to_id: store._id,
      store_id: store._id,
      agent_id: isDirectOrder ? undefined : (store.assigned_agent_id || undefined),
      distributor_id: distributorId,
      items: orderItems.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.total,
      })),
      subtotal,
      discount_total: 0,
      tax_total: 0,
      grand_total,
      due_amount: grand_total,
      status: "pending",
      delivery_status: "pending",
      notes: parsed.data.notes,
      source: "web",
      created_by: session.userId,
    });

    return NextResponse.json({ data: doc });
  } catch (e) {
    console.error("From-store order error:", e);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
