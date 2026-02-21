import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Territory } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const CreateSchema = z.object({
  territory_name: z.string().min(1),
  territory_code: z.string().min(1),
  description: z.string().optional(),
  pincodes: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(),
  country: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    await dbConnect();
    const list = await Territory.find({ tenant_id: session.tenantId, is_active: true }).sort({ territory_name: 1 }).lean();
    return NextResponse.json({ data: list });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to list territories" }, { status: 500 });
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
    const existing = await Territory.findOne({
      tenant_id: session.tenantId,
      territory_code: parsed.data.territory_code,
    });
    if (existing) return NextResponse.json({ error: "Territory code already exists" }, { status: 409 });
    const doc = await Territory.create({
      ...parsed.data,
      tenant_id: session.tenantId,
      created_by: session.userId,
    });
    return NextResponse.json({ data: doc });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to create territory" }, { status: 500 });
  }
}
