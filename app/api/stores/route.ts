import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Store, SalesRoute } from "@/lib/models";
import { getSession, requireSession } from "@/lib/auth";

const STORE_TYPES = ["kirana", "supermarket", "departmental", "pharmacy", "electronics", "clothing", "other"] as const;
const PAYMENT_TERMS = ["cash", "credit_7", "credit_15", "credit_30", "credit_45"] as const;
const CREDIT_RATINGS = ["excellent", "good", "average", "poor"] as const;

const CreateSchema = z.object({
  distributor_id: z.string().min(1),
  territory_id: z.string().min(1),
  assigned_agent_id: z.string().optional(),
  assigned_route_id: z.string().optional(),
  store_code: z.string().min(1),
  store_name: z.string().min(1),
  store_type: z.enum(STORE_TYPES),
  owner_info: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional(),
    alternate_phone: z.string().optional(),
  }),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(1),
    country: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    landmark: z.string().optional(),
  }),
  business_info: z
    .object({
      gst_number: z.string().optional(),
      pan_number: z.string().optional(),
      established_date: z.string().optional(),
      store_size_sqft: z.number().optional(),
      monthly_turnover: z.number().optional(),
      employee_count: z.number().optional(),
    })
    .optional(),
  credit_info: z
    .object({
      credit_limit: z.number().optional(),
      credit_days: z.number().optional(),
      used_credit: z.number().optional(),
      available_credit: z.number().optional(),
      payment_terms: z.enum(PAYMENT_TERMS).optional(),
      credit_rating: z.enum(CREDIT_RATINGS).optional(),
    })
    .optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const distributorId = searchParams.get("distributor_id");
    const agentId = searchParams.get("agent_id");
    await dbConnect();

    // Touch SalesRoute to ensure model is registered in Mongoose
    if (SalesRoute) {
      // Model registered
    }

    const filter: Record<string, unknown> = { tenant_id: session.tenantId, is_active: true };
    if (distributorId) filter.distributor_id = distributorId;
    if (agentId) filter.assigned_agent_id = agentId;

    const list = await Store.find(filter)
      .sort({ created_at: -1 })
      .populate("assigned_agent_id", "agent_code first_name last_name personal_info")
      .populate("assigned_route_id", "route_code route_name")
      .lean();
    return NextResponse.json({ data: list });
  } catch (e) {
    console.error("GET /api/stores error:", e);
    return NextResponse.json({ error: "Failed to list stores", details: String(e) }, { status: 500 });
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
    const existing = await Store.findOne({
      tenant_id: session.tenantId,
      store_code: parsed.data.store_code,
    });
    if (existing) return NextResponse.json({ error: "Store code already exists" }, { status: 409 });
    const doc = await Store.create({
      ...parsed.data,
      tenant_id: session.tenantId,
      created_by: session.userId,
    });

    if (parsed.data.assigned_route_id) {
      await SalesRoute.updateOne(
        { _id: parsed.data.assigned_route_id, tenant_id: session.tenantId },
        { $addToSet: { assigned_store_ids: doc._id } }
      );
    }

    return NextResponse.json({ data: doc });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to create store" }, { status: 500 });
  }
}
