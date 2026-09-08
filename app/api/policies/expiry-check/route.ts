import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Batch } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const ExpiryCheckSchema = z.object({
  batch_ids: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = ExpiryCheckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();
    const batches = await Batch.find({
      _id: { $in: parsed.data.batch_ids },
      tenant_id: session.tenantId,
    })
      .select("batch_number expiry_date product_id")
      .lean();

    const now = new Date();
    const results = batches.map((b) => {
      const expiryDate = new Date(b.expiry_date);
      const diffTime = expiryDate.getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // PRD Rule:
      // Block sale if expiry < 30 days
      // Show warning if expiry < 60 days
      const isBlocked = daysUntilExpiry <= 30;
      const isWarning = daysUntilExpiry > 30 && daysUntilExpiry <= 60;

      return {
        batch_id: b._id,
        batch_number: b.batch_number,
        expiry_date: b.expiry_date,
        days_until_expiry: daysUntilExpiry,
        status: isBlocked ? "blocked" : isWarning ? "warning" : "ok",
        message: isBlocked
          ? "CRITICAL: Product expires in less than 30 days. Sale & delivery blocked by Policy."
          : isWarning
          ? "WARNING: Product expires in less than 60 days."
          : "OK: Expiry valid.",
      };
    });

    const hasBlocked = results.some((r) => r.status === "blocked");

    return NextResponse.json({
      data: {
        can_proceed: !hasBlocked,
        results,
      },
    });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to perform expiry check" }, { status: 500 });
  }
}
