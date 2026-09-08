import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { SalesRoute, Agent } from "@/lib/models";
import { getSession } from "@/lib/auth";

const PointSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
});

const WaypointSchema = z.object({
  name: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  order: z.number().optional(),
});

const CreateRouteSchema = z.object({
  route_name: z.string().min(1),
  route_code: z.string().min(1),
  description: z.string().optional(),
  territory_id: z.string().optional(),
  distributor_id: z.string().optional(),
  start_point: PointSchema,
  end_point: PointSchema,
  waypoints: z.array(WaypointSchema).optional(),
  assigned_agent_ids: z.array(z.string()).optional(),
  assigned_store_ids: z.array(z.string()).optional(),
  distance_km: z.number().optional(),
});

/** GET: List all sales routes */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const routes = await SalesRoute.find({
      tenant_id: session.tenantId,
      is_active: true,
    })
      .populate("assigned_agent_ids", "first_name last_name agent_code")
      .populate("territory_id", "territory_name territory_code")
      .populate("assigned_store_ids", "store_name store_code owner_info address")
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ data: routes });
  } catch (e: any) {
    console.error("Fetch routes error:", e);
    return NextResponse.json({ error: e?.message || "Failed to load routes" }, { status: 500 });
  }
}

/** POST: Create a new sales route */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = CreateRouteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    const exists = await SalesRoute.findOne({
      tenant_id: session.tenantId,
      route_code: parsed.data.route_code,
    });
    if (exists) {
      return NextResponse.json({ error: `Route code ${parsed.data.route_code} already exists` }, { status: 400 });
    }

    const territoryIdClean =
      parsed.data.territory_id && parsed.data.territory_id.trim() !== ""
        ? parsed.data.territory_id
        : undefined;

    const distributorIdClean =
      parsed.data.distributor_id && parsed.data.distributor_id.trim() !== ""
        ? parsed.data.distributor_id
        : undefined;

    const doc = await SalesRoute.create({
      tenant_id: session.tenantId,
      route_name: parsed.data.route_name,
      route_code: parsed.data.route_code,
      description: parsed.data.description,
      territory_id: territoryIdClean,
      distributor_id: distributorIdClean,
      start_point: parsed.data.start_point,
      end_point: parsed.data.end_point,
      waypoints: parsed.data.waypoints || [],
      assigned_agent_ids: parsed.data.assigned_agent_ids || [],
      assigned_store_ids: parsed.data.assigned_store_ids || [],
      distance_km: parsed.data.distance_km || 0,
      created_by: session.userId,
    });

    if (parsed.data.assigned_agent_ids && parsed.data.assigned_agent_ids.length > 0) {
      await Agent.updateMany(
        { _id: { $in: parsed.data.assigned_agent_ids }, tenant_id: session.tenantId },
        { $addToSet: { assigned_route_ids: doc._id } }
      );
    }

    return NextResponse.json({ data: doc });
  } catch (e: any) {
    console.error("Create route error:", e);
    return NextResponse.json({ error: e?.message || "Failed to create sales route" }, { status: 500 });
  }
}
