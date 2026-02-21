import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Order, Store, Product, Agent, User } from "@/lib/models";
import { getSession } from "@/lib/auth";

const ItemSchema = z.object({
  product_id: z.string().min(1),
  quantity: z.number().min(1),
});

const CreateFromAgentSchema = z.object({
  store_id: z.string().min(1),
  items: z.array(ItemSchema).min(1),
  notes: z.string().optional(),
});

function generateOrderNumber(tenantId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const short = tenantId.slice(-6).toUpperCase();
  return `ORD-${short}-${ts}`;
}

/** Agent places an order on behalf of an assigned shop (after visiting and shop keeper said yes). */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = CreateFromAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(session.userId).lean();
    const agentAssoc = user?.domain_associations?.find((a: { domain_type?: string }) => a.domain_type === "agent");
    const agentId = agentAssoc?.domain_id?.toString?.();
    if (!agentId) return NextResponse.json({ error: "Not an agent account" }, { status: 403 });

    const agent = await Agent.findById(agentId).select("distributor_id").lean();
    if (!agent?.distributor_id) return NextResponse.json({ error: "Agent has no distributor" }, { status: 400 });

    const store = await Store.findOne({
      _id: parsed.data.store_id,
      tenant_id: session.tenantId,
      assigned_agent_id: agentId,
    }).lean();
    if (!store) return NextResponse.json({ error: "Store not found or not assigned to you" }, { status: 404 });

    const distributorId = agent.distributor_id.toString();

    const itemsWithPrice: Array<{ product_id: string; quantity: number; unit_price: number }> = [];
    for (const item of parsed.data.items) {
      const product = await Product.findById(item.product_id).lean();
      if (!product || product.tenant_id.toString() !== session.tenantId) {
        return NextResponse.json({ error: `Product ${item.product_id} not found` }, { status: 404 });
      }
      const productDistId = product.distributor_id?.toString?.() ?? product.distributor_id;
      if (productDistId !== distributorId) {
        return NextResponse.json({ error: `Product ${product.product_name} is not from your distributor` }, { status: 400 });
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
      agent_id: agentId,
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
    console.error("From-agent order error:", e);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
