import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Order } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const ProcessApprovalSchema = z.object({
  order_id: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    await dbConnect();

    // Fetch orders flagged for discount manager approval (>15% discount)
    const pendingApprovals = await Order.find({
      tenant_id: session.tenantId,
      status: "pending_approval",
    })
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ data: pendingApprovals });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to list discount approvals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = ProcessApprovalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();
    const order = await Order.findOne({
      _id: parsed.data.order_id,
      tenant_id: session.tenantId,
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (parsed.data.action === "approve") {
      order.status = "approved";
      order.workflow_history = order.workflow_history || [];
      order.workflow_history.push({
        status: "approved",
        updated_by: session.userId,
        timestamp: new Date(),
        notes: parsed.data.reason || "Discount approved by manager",
      });
    } else {
      order.status = "cancelled";
      order.workflow_history = order.workflow_history || [];
      order.workflow_history.push({
        status: "cancelled",
        updated_by: session.userId,
        timestamp: new Date(),
        notes: parsed.data.reason || "Discount rejected by manager",
      });
    }

    await order.save();
    return NextResponse.json({ data: order });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to process discount approval" }, { status: 500 });
  }
}
