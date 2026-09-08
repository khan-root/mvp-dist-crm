import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { SalesRoute, Agent, Store } from "@/lib/models";
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

const UpdateRouteSchema = z.object({
  route_name: z.string().optional(),
  route_code: z.string().optional(),
  description: z.string().optional(),
  territory_id: z.string().optional(),
  start_point: PointSchema.optional(),
  end_point: PointSchema.optional(),
  waypoints: z.array(WaypointSchema).optional(),
  assigned_agent_ids: z.array(z.string()).optional(),
  assigned_store_ids: z.array(z.string()).optional(),
  distance_km: z.number().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const route = await SalesRoute.findOne({ _id: id, tenant_id: session.tenantId })
      .populate("assigned_agent_ids", "first_name last_name agent_code")
      .populate("territory_id", "territory_name territory_code")
      .populate("assigned_store_ids", "store_name store_code owner_info address")
      .lean();

    if (!route) return NextResponse.json({ error: "Route not found" }, { status: 404 });

    return NextResponse.json({ data: route });
  } catch (e) {
    console.error("Fetch route error:", e);
    return NextResponse.json({ error: "Failed to load route" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateRouteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    const updated = await SalesRoute.findOneAndUpdate(
      { _id: id, tenant_id: session.tenantId },
      { $set: parsed.data },
      { new: true }
    );

    if (!updated) return NextResponse.json({ error: "Route not found" }, { status: 404 });

    // Sync Agent.assigned_route_ids if updated
    if (parsed.data.assigned_agent_ids) {
      await Agent.updateMany(
        { tenant_id: session.tenantId, assigned_route_ids: id, _id: { $nin: parsed.data.assigned_agent_ids } },
        { $pull: { assigned_route_ids: id } }
      );
      if (parsed.data.assigned_agent_ids.length > 0) {
        await Agent.updateMany(
          { tenant_id: session.tenantId, _id: { $in: parsed.data.assigned_agent_ids } },
          { $addToSet: { assigned_route_ids: id } }
        );
      }
    }

    // Sync Store.assigned_route_id if updated
    if (parsed.data.assigned_store_ids && parsed.data.assigned_store_ids.length > 0) {
      await Store.updateMany(
        { tenant_id: session.tenantId, _id: { $in: parsed.data.assigned_store_ids } },
        { $set: { assigned_route_id: id } }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error("Update route error:", e);
    return NextResponse.json({ error: "Failed to update route" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    await SalesRoute.findOneAndUpdate(
      { _id: id, tenant_id: session.tenantId },
      { $set: { is_active: false } }
    );

    // Sync agents and stores
    await Agent.updateMany(
      { tenant_id: session.tenantId, assigned_route_ids: id },
      { $pull: { assigned_route_ids: id } }
    );
    await Store.updateMany(
      { tenant_id: session.tenantId, assigned_route_id: id },
      { $unset: { assigned_route_id: "" } }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Delete route error:", e);
    return NextResponse.json({ error: "Failed to delete route" }, { status: 500 });
  }
}

