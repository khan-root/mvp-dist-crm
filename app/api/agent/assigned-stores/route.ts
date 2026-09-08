import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Store, User, SalesRoute } from "@/lib/models";
import { getSession } from "@/lib/auth";

function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Agent: list shops assigned to me (my task list to visit and take orders). */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const user = await User.findById(session.userId).lean();
    const agentAssoc = user?.domain_associations?.find((a: { domain_type?: string }) => a.domain_type === "agent");
    const agentId = agentAssoc?.domain_id?.toString?.();
    if (!agentId) return NextResponse.json({ error: "Not an agent account" }, { status: 403 });

    // Fetch routes assigned to agent
    const assignedRoutes = await SalesRoute.find({
      tenant_id: session.tenantId,
      assigned_agent_ids: agentId,
      is_active: true,
    }).select("_id start_point end_point waypoints assigned_store_ids territory_id").lean();

    const routeIds = assignedRoutes.map((r) => r._id.toString());
    const storeIdsFromRoutes = assignedRoutes.flatMap((r: any) => r.assigned_store_ids || []).map((id: any) => id.toString()).filter(Boolean);
    const territoryIdsFromRoutes = assignedRoutes.map((r: any) => (r.territory_id?._id || r.territory_id)?.toString()).filter(Boolean);

    const routeCenters: Array<{ lat: number; lng: number }> = [];
    assignedRoutes.forEach((r: any) => {
      if (r.start_point?.latitude && r.start_point?.longitude) {
        routeCenters.push({ lat: r.start_point.latitude, lng: r.start_point.longitude });
      }
      if (r.end_point?.latitude && r.end_point?.longitude) {
        routeCenters.push({ lat: r.end_point.latitude, lng: r.end_point.longitude });
      }
    });

    const allStores = await Store.find({
      tenant_id: session.tenantId,
      is_active: true,
    })
      .select("store_code store_name store_type owner_info address latitude longitude assigned_agent_id assigned_route_id territory_id")
      .sort({ store_name: 1 })
      .lean();

    const filtered = allStores.filter((s: any) => {
      const sId = s._id.toString();
      const sAgent = s.assigned_agent_id?.toString();
      const sRoute = s.assigned_route_id?.toString();
      const sTerritory = s.territory_id?.toString();

      if (sAgent === agentId) return true;
      if (sRoute && routeIds.includes(sRoute)) return true;
      if (storeIdsFromRoutes.includes(sId)) return true;
      if (sTerritory && territoryIdsFromRoutes.includes(sTerritory)) return true;

      const storeLat = s.address?.latitude || s.latitude || 0;
      const storeLng = s.address?.longitude || s.longitude || 0;

      if (storeLat && storeLng && routeCenters.length > 0) {
        const isNearby = routeCenters.some((rc) => getHaversineDistanceKm(storeLat, storeLng, rc.lat, rc.lng) <= 25);
        if (isNearby) return true;
      }

      return false;
    });

    return NextResponse.json({ data: filtered });
  } catch (e) {
    console.error("Agent assigned-stores error:", e);
    return NextResponse.json({ error: "Failed to load stores" }, { status: 500 });
  }
}
