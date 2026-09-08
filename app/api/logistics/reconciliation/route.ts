import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { AuditLog } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const ReconciliationSchema = z.object({
  driver_id: z.string().min(1),
  route_id: z.string().min(1),
  reconciliation_date: z.string().or(z.date()),
  items: z.array(
    z.object({
      product_id: z.string(),
      sku: z.string(),
      expected_loaded_qty: z.number(),
      delivered_qty: z.number(),
      returned_qty: z.number(),
      scanned_van_qty: z.number(),
    })
  ),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = ReconciliationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    let totalExpectedVanRemaining = 0;
    let totalActualVanScanned = 0;

    const auditDetails = parsed.data.items.map((i) => {
      const expectedRemaining = i.expected_loaded_qty - i.delivered_qty + i.returned_qty;
      const variance = i.scanned_van_qty - expectedRemaining;

      totalExpectedVanRemaining += expectedRemaining;
      totalActualVanScanned += i.scanned_van_qty;

      return {
        product_id: i.product_id,
        sku: i.sku,
        expected_remaining: expectedRemaining,
        actual_scanned: i.scanned_van_qty,
        variance,
        is_discrepancy: variance !== 0,
      };
    });

    const netVariance = totalActualVanScanned - totalExpectedVanRemaining;
    const totalLoaded = parsed.data.items.reduce((sum, item) => sum + item.expected_loaded_qty, 0);
    const variancePercentage = totalLoaded > 0 ? (Math.abs(netVariance) / totalLoaded) * 100 : 0;

    // PRD Rule: Flag audit investigation if inventory shrinkage exceeds 1% of total
    const requiresAuditFlag = variancePercentage > 1.0;

    if (requiresAuditFlag) {
      await AuditLog.create({
        tenant_id: session.tenantId,
        user_id: session.userId,
        action: "VAN_RECONCILIATION_SHRINKAGE_ALERT",
        entity_type: "Logistics",
        entity_id: parsed.data.route_id,
        details: {
          driver_id: parsed.data.driver_id,
          total_loaded: totalLoaded,
          expected_remaining: totalExpectedVanRemaining,
          actual_scanned: totalActualVanScanned,
          net_variance: netVariance,
          variance_percentage: Math.round(variancePercentage * 100) / 100,
        },
      });
    }

    return NextResponse.json({
      data: {
        reconciliation_status: netVariance === 0 ? "RECONCILED" : "VARIANCE_DETECTED",
        total_loaded: totalLoaded,
        expected_remaining: totalExpectedVanRemaining,
        actual_scanned: totalActualVanScanned,
        net_variance: netVariance,
        variance_percentage: Math.round(variancePercentage * 100) / 100,
        requires_audit_flag: requiresAuditFlag,
        item_details: auditDetails,
      },
    });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to process logistics reconciliation" }, { status: 500 });
  }
}
