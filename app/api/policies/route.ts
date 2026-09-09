import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Policy } from "@/lib/models";
import { getSession } from "@/lib/auth";

const DEFAULT_UNIVERSAL_POLICY = {
  name: "Universal Field Force Automation Policy (SOP Standard)",
  description: "Cross-Industry Order Governance, Fraud Prevention & Credit Risk Guardrails Framework",
  industry_type: "universal",
  is_active: true,
  is_default: true,
  tiered_matrix: [
    {
      tier: 1,
      name: "Tier 1: Routine",
      min_value: 0,
      max_value: 4999,
      systemic_action: "Auto-approved; routed directly to warehouse ERP for packing and delivery.",
      approval_sla_hours: 0,
      authentication_required: "gps_50m",
    },
    {
      tier: 2,
      name: "Tier 2: Intermediate",
      min_value: 5000,
      max_value: 9999,
      systemic_action: "Automated credit ceiling validation; soft payment terms check.",
      approval_sla_hours: 2,
      authentication_required: "gps_signature",
    },
    {
      tier: 3,
      name: "Tier 3: High-Value Baseline",
      min_value: 10000,
      max_value: 24999,
      systemic_action: "Mandatory Manager review queue; stock reservation lock; full credit audit.",
      approval_sla_hours: 4,
      authentication_required: "gps_otp_or_esign",
    },
    {
      tier: 4,
      name: "Tier 4: Enterprise Bulk",
      min_value: 25000,
      max_value: 999999,
      systemic_action: "Distributor Principal / Commercial Lead dual-signoff; verified credit clearance.",
      approval_sla_hours: 8,
      authentication_required: "dual_signoff_deposit",
    },
  ],
  credit_guardrails: {
    hard_credit_freeze_days: 30,
    exposure_ceiling_enabled: true,
    collection_linked_booking: true,
    max_discretionary_discount_pct: 5,
  },
  antifraud_guardrails: {
    geofence_radius_meters: 50,
    buyer_verification_threshold_rs: 10000,
    allow_geotag_update_request: true,
  },
  inventory_sync: {
    active_stock_reservation_mins: 15,
    backorder_workflow_enabled: true,
  },
  commission_rules: {
    agent_commission_pct: 3.0,
    agent_flat_bonus_rs: 150,
    store_rebate_pct: 2.0,
    store_cashback_flat_rs: 100,
    min_order_value_eligible: 5000,
    max_order_value_eligible: 100000,
    applicable_scope: "order_value_range",
  },
};

/** GET: List tenant policies. If none exist, seeds default Universal Policy */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    let policies = await Policy.find({ tenant_id: session.tenantId }).sort({ created_at: -1 }).lean();

    if (policies.length === 0) {
      const seeded = await Policy.create({
        ...DEFAULT_UNIVERSAL_POLICY,
        tenant_id: session.tenantId,
        created_by: session.userId,
      });
      policies = [seeded.toObject()];
    }

    return NextResponse.json({ data: policies });
  } catch (e: any) {
    console.error("GET /api/policies error:", e);
    return NextResponse.json({ error: e?.message || "Failed to fetch policies" }, { status: 500 });
  }
}

/** POST: Create or clone a new field force policy */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    await dbConnect();

    if (body.is_default) {
      await Policy.updateMany({ tenant_id: session.tenantId }, { is_default: false });
    }

    const doc = await Policy.create({
      ...body,
      tenant_id: session.tenantId,
      created_by: session.userId,
    });

    return NextResponse.json({ data: doc });
  } catch (e: any) {
    console.error("POST /api/policies error:", e);
    return NextResponse.json({ error: e?.message || "Failed to create policy" }, { status: 500 });
  }
}
