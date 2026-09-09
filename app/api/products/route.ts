import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Product } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const CreateSchema = z.object({
  distributor_id: z.string().min(1),
  category_id: z.string().min(1),
  brand_id: z.string().min(1),
  product_name: z.string().min(1),
  product_code: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  hsn_code: z.string().optional(),
  industry_domain: z.string().optional(),
  domain_attributes: z
    .object({
      batch_number: z.string().optional(),
      expiry_date: z.string().optional(),
      rx_required: z.boolean().optional(),
      warranty_months: z.number().optional(),
      serial_number: z.string().optional(),
      size: z.string().optional(),
      color: z.string().optional(),
      material: z.string().optional(),
      dimension: z.string().optional(),
    })
    .optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
  unit_of_measure: z.string().min(1),
  packaging: z
    .object({
      type: z.enum(["piece", "box", "carton", "packet", "bottle"]).optional(),
      quantity_per_case: z.number().optional(),
      weight: z.number().optional(),
      weight_unit: z.enum(["g", "kg", "lb"]).optional(),
    })
    .optional(),
  pricing: z.object({
    base_cost: z.number().min(0),
    mrp: z.number().min(0),
    wholesale_price: z.number().optional(),
    retail_price: z.number().optional(),
    gst_rate: z.number().optional(),
    cess: z.number().optional(),
  }),
  inventory: z
    .object({
      current_stock: z.number().optional(),
      minimum_stock: z.number().optional(),
      maximum_stock: z.number().optional(),
      reorder_level: z.number().optional(),
      reorder_quantity: z.number().optional(),
      lead_time_days: z.number().optional(),
    })
    .optional(),
  status: z
    .object({
      is_active: z.boolean().optional(),
      is_featured: z.boolean().optional(),
      is_new: z.boolean().optional(),
      is_on_sale: z.boolean().optional(),
    })
    .optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const distributorId = searchParams.get("distributor_id");
    const categoryId = searchParams.get("category_id");
    await dbConnect();
    const filter: Record<string, unknown> = { tenant_id: session.tenantId, "status.is_active": true };
    if (distributorId) filter.distributor_id = distributorId;
    if (categoryId) filter.category_id = categoryId;
    const list = await Product.find(filter).sort({ product_name: 1 }).lean();
    return NextResponse.json({ data: list });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to list products" }, { status: 500 });
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
    await dbConnect();
    const existing = await Product.findOne({
      tenant_id: session.tenantId,
      $or: [{ product_code: parsed.data.product_code }, { sku: parsed.data.sku }],
    });
    if (existing) return NextResponse.json({ error: "Product code or SKU already exists" }, { status: 409 });
    const doc = await Product.create({
      ...parsed.data,
      inventory: {
        current_stock: 0,
        minimum_stock: 0,
        maximum_stock: 0,
        reorder_level: 0,
        reorder_quantity: 0,
        lead_time_days: 0,
        ...parsed.data.inventory,
      },
      status: { is_active: true, is_featured: false, is_new: false, is_on_sale: false, ...parsed.data.status },
      tenant_id: session.tenantId,
      created_by: session.userId,
    });
    return NextResponse.json({ data: doc });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
