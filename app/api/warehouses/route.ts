import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Warehouse } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const CreateSchema = z.object({
  distributor_id: z.string().min(1),
  warehouse_name: z.string().min(1),
  warehouse_code: z.string().min(1),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  contact: z
    .object({
      manager_name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().or(z.literal("")).optional(),
    })
    .optional(),
  capacity: z
    .object({
      total_area_sqft: z.number().optional(),
      max_pallets: z.number().optional(),
      temperature_controlled: z.boolean().optional(),
      min_temperature: z.number().optional(),
      max_temperature: z.number().optional(),
    })
    .optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const distributorId = searchParams.get("distributor_id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    await dbConnect();
    const filter: Record<string, unknown> = { tenant_id: session.tenantId, is_active: true };
    if (distributorId) filter.distributor_id = distributorId;

    const [list, total] = await Promise.all([
      Warehouse.find(filter).sort({ warehouse_name: 1 }).skip(skip).limit(limit).lean(),
      Warehouse.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: list,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to list warehouses" }, { status: 500 });
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
    const existing = await Warehouse.findOne({
      tenant_id: session.tenantId,
      warehouse_code: parsed.data.warehouse_code,
    });
    if (existing) return NextResponse.json({ error: "Warehouse code already exists" }, { status: 409 });
    const doc = await Warehouse.create({
      ...parsed.data,
      tenant_id: session.tenantId,
      created_by: session.userId,
    });
    return NextResponse.json({ data: doc });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to create warehouse" }, { status: 500 });
  }
}
