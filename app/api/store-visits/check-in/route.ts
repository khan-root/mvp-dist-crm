import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { StoreVisit, Store } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const CheckInSchema = z.object({
  store_id: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  photo_url: z.string().optional(),
  owner_photo_url: z.string().optional(),
  notes: z.string().optional(),
});

/** Haversine formula to compute distance in meters between two lat/lng points */
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = CheckInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();
    const store = await Store.findById(parsed.data.store_id).lean();
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const storeLat = store.address?.latitude || 0;
    const storeLng = store.address?.longitude || 0;

    const distanceMeters =
      storeLat && storeLng
        ? calculateDistanceMeters(parsed.data.latitude, parsed.data.longitude, storeLat, storeLng)
        : 0;

    // Geofence Rule: 100-meter radius requirement for auto-verification
    const isWithinGeofence = distanceMeters <= 100;
    const isRouteDeviation = distanceMeters > 1000;
    const isFlagged = !isWithinGeofence || isRouteDeviation;

    let flagReason = "";
    if (!isWithinGeofence) flagReason += `Outside 100m Geofence (${Math.round(distanceMeters)}m away). `;
    if (isRouteDeviation) flagReason += "Major Route Deviation (>1km). ";

    const visit = await StoreVisit.create({
      tenant_id: session.tenantId,
      agent_id: session.userId,
      store_id: parsed.data.store_id,
      visit_date: new Date(),
      check_in_time: new Date(),
      location: {
        check_in_lat: parsed.data.latitude,
        check_in_lng: parsed.data.longitude,
        accuracy: Math.round(distanceMeters),
      },
      check_in: {
        timestamp: new Date(),
        location: { latitude: parsed.data.latitude, longitude: parsed.data.longitude },
        photo_url: parsed.data.photo_url,
        verified_by_geofence: isWithinGeofence,
        distance_meters: Math.round(distanceMeters),
      },
      visit_status: isFlagged ? "planned" : "completed",
      status: isFlagged ? "flagged" : "completed",
      flags: isFlagged
        ? {
            is_flagged: true,
            reason: flagReason.trim(),
            requires_admin_approval: true,
          }
        : { is_flagged: false },
      notes: parsed.data.notes,
    });

    return NextResponse.json({
      data: {
        visit_id: visit._id,
        status: visit.status,
        distance_meters: Math.round(distanceMeters),
        verified_by_geofence: isWithinGeofence,
        is_flagged: isFlagged,
        flag_reason: flagReason.trim() || undefined,
      },
    });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to process store check-in" }, { status: 500 });
  }
}
