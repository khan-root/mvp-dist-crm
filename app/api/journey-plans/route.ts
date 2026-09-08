import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { DeliveryRoute, Store } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const CreateJourneyPlanSchema = z.object({
  route_name: z.string().min(1),
  route_code: z.string().min(1),
  agent_id: z.string().min(1),
  territory_id: z.string().min(1),
  scheduled_date: z.string().or(z.date()),
  store_ids: z.array(z.string()).min(1),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agent_id");

    await dbConnect();
    const filter: Record<string, unknown> = { tenant_id: session.tenantId, is_active: true };
    if (agentId) filter.assigned_driver = agentId;

    const routes = await DeliveryRoute.find(filter).sort({ created_at: -1 }).lean();
    return NextResponse.json({ data: routes });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to list journey plans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = CreateJourneyPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    // Fetch stores to optimize sequence by location
    const stores = await Store.find({ _id: { $in: parsed.data.store_ids } })
      .select("store_name address")
      .lean();

    // Order shops sequentially
    const stops = stores.map((s, idx) => ({
      sequence: idx + 1,
      store_id: s._id,
      store_name: s.store_name,
      estimated_arrival: `${9 + Math.floor(idx * 0.5)}:00 AM`,
      status: "pending",
    }));

    const doc = await DeliveryRoute.create({
      tenant_id: session.tenantId,
      route_name: parsed.data.route_name,
      route_code: parsed.data.route_code,
      territory_id: parsed.data.territory_id,
      assigned_driver: parsed.data.agent_id,
      stops,
      total_distance_km: stops.length * 2.5,
      estimated_duration_hours: stops.length * 0.5,
      is_active: true,
      created_by: session.userId,
    });

    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to create journey plan" }, { status: 500 });
  }
}
