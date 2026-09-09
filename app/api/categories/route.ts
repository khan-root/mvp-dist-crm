import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Category } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const CreateSchema = z.object({
  distributor_id: z.string().min(1),
  category_name: z.string().min(1),
  category_code: z.string().min(1),
  industry_domain: z.string().optional(),
  default_gst_rate: z.number().optional(),
  default_margin_percentage: z.number().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  parent_category_id: z.string().optional(),
  sort_order: z.number().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const distributorId = searchParams.get("distributor_id");
    await dbConnect();
    const filter: Record<string, unknown> = { tenant_id: session.tenantId, is_active: true };
    if (distributorId) filter.distributor_id = distributorId;
    const list = await Category.find(filter).sort({ sort_order: 1, category_name: 1 }).lean();
    return NextResponse.json({ data: list });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to list categories" }, { status: 500 });
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
    const existing = await Category.findOne({
      tenant_id: session.tenantId,
      distributor_id: parsed.data.distributor_id,
      category_code: parsed.data.category_code,
    });
    if (existing) return NextResponse.json({ error: "Category code already exists for this distributor" }, { status: 409 });
    const doc = await Category.create({
      ...parsed.data,
      tenant_id: session.tenantId,
      created_by: session.userId,
    });
    return NextResponse.json({ data: doc });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
