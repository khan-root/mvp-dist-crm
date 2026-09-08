import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Promotion } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const PromotionSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  promo_type: z.enum(["bogo", "slab", "combo", "bill_level", "free_gift"]),
  description: z.string().optional(),
  start_date: z.string().or(z.date()),
  end_date: z.string().or(z.date()),
  is_supplier_funded: z.boolean().default(false),
  supplier_reimbursement_percent: z.number().default(0),
  bogo_rules: z
    .object({
      buy_product_id: z.string(),
      buy_quantity: z.number().min(1),
      get_product_id: z.string(),
      get_quantity: z.number().min(1),
      max_free_per_order: z.number().optional(),
    })
    .optional(),
  slab_rules: z
    .array(
      z.object({
        min_quantity: z.number(),
        max_quantity: z.number(),
        discount_percentage: z.number(),
      })
    )
    .optional(),
  combo_rules: z
    .object({
      required_product_ids: z.array(z.string()),
      combo_discount_percentage: z.number(),
    })
    .optional(),
  bill_rules: z
    .object({
      min_bill_amount: z.number(),
      discount_percentage: z.number(),
      max_discount_cap: z.number(),
    })
    .optional(),
  gift_rules: z
    .object({
      trigger_product_id: z.string(),
      trigger_quantity: z.number(),
      gift_product_id: z.string(),
      gift_quantity: z.number(),
    })
    .optional(),
  max_cart_discount_cap_percent: z.number().default(30),
});

export async function GET() {
  try {
    const session = await requireSession();
    await dbConnect();
    const list = await Promotion.find({ tenant_id: session.tenantId, is_active: true })
      .sort({ created_at: -1 })
      .lean();
    return NextResponse.json({ data: list });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to list promotions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = PromotionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();
    const doc = await Promotion.create({
      ...parsed.data,
      start_date: new Date(parsed.data.start_date),
      end_date: new Date(parsed.data.end_date),
      tenant_id: session.tenantId,
      created_by: session.userId,
      is_active: true,
    });

    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 });
  }
}
