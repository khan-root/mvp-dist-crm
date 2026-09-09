import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Agent, Store, StoreVisit, SalesRoute, User } from "@/lib/models";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const [agents, stores, visits, routes] = await Promise.all([
      Agent.find({ tenant_id: session.tenantId, is_active: true })
        .select("agent_code first_name last_name personal_info address territory_id assigned_route_ids")
        .populate("territory_id", "territory_name territory_code")
        .lean(),
      Store.find({ tenant_id: session.tenantId, is_active: true })
        .select("store_code store_name store_type owner_info address latitude longitude")
        .lean(),
      StoreVisit.find({ tenant_id: session.tenantId })
        .sort({ created_at: -1 })
        .limit(50)
        .populate("store_id", "store_name store_code owner_info address")
        .lean(),
      SalesRoute.find({ tenant_id: session.tenantId, is_active: true })
        .select("route_name route_code start_point end_point distance_km")
        .lean(),
    ]);

    // Calculate Telematics Metrics
    const totalVisitsToday = visits.length;
    const verifiedVisits = visits.filter(
      (v: any) => v.check_in?.verified_by_geofence || v.status === "completed"
    ).length;
    const flaggedVisits = visits.filter(
      (v: any) => v.status === "flagged" || v.flags?.is_flagged
    ).length;
    const geofencePassRate = totalVisitsToday > 0 ? Math.round((verifiedVisits / totalVisitsToday) * 100) : 100;

    const mappedVisits = visits.map((v: any) => {
      const storeObj = v.store_id as any;
      const checkInLat = v.check_in?.location?.latitude || v.location?.check_in_lat || v.latitude || 0;
      const checkInLng = v.check_in?.location?.longitude || v.location?.check_in_lng || v.longitude || 0;
      const storeLat = storeObj?.address?.latitude || storeObj?.latitude || 0;
      const storeLng = storeObj?.address?.longitude || storeObj?.longitude || 0;
      const distanceMeters = v.check_in?.distance_meters ?? v.location?.accuracy ?? 0;
      const isVerified = v.check_in?.verified_by_geofence ?? (distanceMeters <= 100);

      return {
        _id: v._id.toString(),
        store_name: storeObj?.store_name || "Market Outlet",
        store_code: storeObj?.store_code || "ST-00",
        owner_name: storeObj?.owner_info?.name || "Shopkeeper",
        owner_phone: storeObj?.owner_info?.phone || "N/A",
        check_in_time: v.check_in?.timestamp || v.check_in_time || v.created_at,
        latitude: checkInLat || storeLat,
        longitude: checkInLng || storeLng,
        store_latitude: storeLat,
        store_longitude: storeLng,
        distance_meters: distanceMeters,
        is_geofence_verified: isVerified,
        is_flagged: v.status === "flagged" || v.flags?.is_flagged,
        flag_reason: v.flags?.reason || (isVerified ? "" : `Outside 100m Geofence (${distanceMeters}m away)`),
        notes: v.notes || "",
      };
    });

    const mappedAgents = agents.map((a: any) => ({
      _id: a._id.toString(),
      agent_code: a.agent_code,
      name: [a.first_name, a.last_name].filter(Boolean).join(" "),
      phone: a.personal_info?.phone || "N/A",
      email: a.personal_info?.email || "N/A",
      territory_name: a.territory_id?.territory_name || "Central Region",
      latitude: a.address?.latitude || 33.7182,
      longitude: a.address?.longitude || 73.0714,
    }));

    const mappedStores = stores.map((s: any) => ({
      _id: s._id.toString(),
      store_code: s.store_code,
      store_name: s.store_name,
      owner_name: s.owner_info?.name || "Shopkeeper",
      owner_phone: s.owner_info?.phone || "N/A",
      latitude: s.address?.latitude || s.latitude || 0,
      longitude: s.address?.longitude || s.longitude || 0,
      city: s.address?.city || "Market",
    }));

    return NextResponse.json({
      data: {
        metrics: {
          total_visits_today: totalVisitsToday,
          verified_visits: verifiedVisits,
          flagged_visits: flaggedVisits,
          geofence_pass_rate_pct: geofencePassRate,
          active_agents_count: agents.length,
          assigned_routes_count: routes.length,
        },
        agents: mappedAgents,
        stores: mappedStores,
        visits: mappedVisits,
        routes: routes.map((r: any) => ({
          _id: r._id.toString(),
          route_name: r.route_name,
          route_code: r.route_code,
          distance_km: r.distance_km,
        })),
      },
    });
  } catch (e) {
    console.error("GET /api/telematics error:", e);
    return NextResponse.json({ error: "Failed to load telematics data" }, { status: 500 });
  }
}
