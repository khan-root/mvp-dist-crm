import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Order } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const OrderItemSchema = z.object({
  product_id: z.string().min(1),
  variant_id: z.string().optional(),
  batch_id: z.string().optional(),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
  cost_price: z.number().optional(),
  discount_percentage: z.number().optional(),
  discount_amount: z.number().optional(),
  tax_rate: z.number().optional(),
  notes: z.string().optional(),
});

const CreateSchema = z.object({
  order_type: z.enum(["store_order", "agent_order", "distributor_order"]),
  store_id: z.string().optional(),
  agent_id: z.string().optional(),
  distributor_id: z.string().min(1),
  from_type: z.enum(["store", "agent", "distributor"]),
  from_id: z.string().min(1),
  to_type: z.enum(["agent", "distributor", "store"]),
  to_id: z.string().min(1),
  items: z.array(OrderItemSchema).min(1),
  notes: z.string().optional(),
  source: z.enum(["app", "web", "whatsapp", "phone", "manual"]).optional(),
  payment_method: z.enum(["cash", "card", "upi", "bank_transfer", "wallet", "credit"]).optional(),
  delivery_address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      contact_person: z.string().optional(),
      contact_phone: z.string().optional(),
    })
    .optional(),
});

function generateOrderNumber(tenantId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const short = tenantId.slice(-6).toUpperCase();
  return `ORD-${short}-${ts}`;
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const storeId = searchParams.get("store_id");
    const agentId = searchParams.get("agent_id");
    const deliveryStatus = searchParams.get("delivery_status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    await dbConnect();
    const filter: Record<string, unknown> = { tenant_id: session.tenantId };
    if (status) filter.status = status;
    if (storeId) filter.store_id = storeId;
    if (agentId) filter.agent_id = agentId;
    if (deliveryStatus) filter.delivery_status = deliveryStatus;
    const [list, total] = await Promise.all([
      Order.find(filter)
        .sort({ order_date: -1 })
        .skip(skip)
        .limit(limit)
        .populate("store_id", "store_code store_name")
        .populate("agent_id", "agent_code first_name last_name personal_info")
        .lean(),
      Order.countDocuments(filter),
    ]);
    return NextResponse.json({ data: list, total });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to list orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const items = parsed.data.items.map((item) => {
      const lineTotal = item.unit_price * item.quantity;
      const discountAmt = item.discount_amount ?? (item.discount_percentage ? (lineTotal * item.discount_percentage) / 100 : 0);
      const afterDiscount = lineTotal - discountAmt;
      const taxAmt = (item.tax_rate ?? 0) * 0.01 * afterDiscount;
      const total = Math.round((afterDiscount + taxAmt) * 100) / 100;
      return {
        product_id: item.product_id,
        variant_id: item.variant_id,
        batch_id: item.batch_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        cost_price: item.cost_price,
        discount_percentage: item.discount_percentage,
        discount_amount: discountAmt,
        tax_rate: item.tax_rate,
        tax_amount: Math.round(taxAmt * 100) / 100,
        total,
        notes: item.notes,
      };
    });
    const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const discount_total = items.reduce((s, i) => s + (i.discount_amount ?? 0), 0);
    const tax_total = items.reduce((s, i) => s + (i.tax_amount ?? 0), 0);
    const grand_total = Math.round((subtotal - discount_total + tax_total) * 100) / 100;

    await dbConnect();
    let orderNumber = generateOrderNumber(session.tenantId);
    let exists = await Order.findOne({ order_number: orderNumber });
    while (exists) {
      orderNumber = generateOrderNumber(session.tenantId);
      exists = await Order.findOne({ order_number: orderNumber });
    }

    const doc = await Order.create({
      tenant_id: session.tenantId,
      order_number: orderNumber,
      order_type: parsed.data.order_type,
      from_type: parsed.data.from_type,
      from_id: parsed.data.from_id,
      to_type: parsed.data.to_type,
      to_id: parsed.data.to_id,
      store_id: parsed.data.store_id,
      agent_id: parsed.data.agent_id,
      distributor_id: parsed.data.distributor_id,
      items,
      subtotal,
      discount_total,
      tax_total,
      grand_total,
      due_amount: grand_total,
      notes: parsed.data.notes,
      source: parsed.data.source ?? "web",
      payment_method: parsed.data.payment_method,
      delivery_address: parsed.data.delivery_address,
      status: "pending",
      created_by: session.userId,
    });
    return NextResponse.json({ data: doc });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
