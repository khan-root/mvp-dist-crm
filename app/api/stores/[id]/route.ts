import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Store } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const PATCHSchema = z.object({
  assigned_agent_id: z.string().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await dbConnect();
    const store = await Store.findOne({
      _id: id,
      tenant_id: session.tenantId,
    })
      .populate("assigned_agent_id", "agent_code first_name last_name personal_info")
      .lean();
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
    return NextResponse.json({ data: store });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to load store" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();
    const parsed = PATCHSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    await dbConnect();
    const store = await Store.findOneAndUpdate(
      { _id: id, tenant_id: session.tenantId },
      { assigned_agent_id: parsed.data.assigned_agent_id || undefined },
      { new: true }
    )
      .populate("assigned_agent_id", "agent_code first_name last_name personal_info")
      .lean();
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
    return NextResponse.json({ data: store });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to update store" }, { status: 500 });
  }
}
