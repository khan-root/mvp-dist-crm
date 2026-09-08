import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Order, CreditNote } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const ProcessReturnSchema = z.object({
  order_id: z.string().min(1),
  return_reason: z.enum(["damaged", "expired", "customer_change_of_mind", "manufacturer_defect"]),
  items: z.array(
    z.object({
      product_id: z.string(),
      quantity: z.number().min(1),
      unit_price: z.number().min(0),
    })
  ),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = ProcessReturnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();
    const order = await Order.findOne({ _id: parsed.data.order_id, tenant_id: session.tenantId }).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const now = new Date();
    const orderDate = new Date(order.created_at);
    const diffTime = now.getTime() - orderDate.getTime();
    const daysSinceDelivery = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const totalReturnSubtotal = parsed.data.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

    // PRD Tiered Refund Logic:
    // Days 0-7: 100% refund
    // Days 8-15: 50% refund
    // Days 15+: 0% refund
    // Defect / Expired: 100% refund always, 0% restocking fee
    let refundPercentage = 100;
    let restockingFeePercentage = 0;

    if (parsed.data.return_reason === "manufacturer_defect" || parsed.data.return_reason === "expired") {
      refundPercentage = 100;
      restockingFeePercentage = 0;
    } else {
      if (daysSinceDelivery <= 7) {
        refundPercentage = 100;
        restockingFeePercentage = parsed.data.return_reason === "customer_change_of_mind" ? 15 : 10;
      } else if (daysSinceDelivery <= 15) {
        refundPercentage = 50;
        restockingFeePercentage = 10;
      } else {
        refundPercentage = 0;
        restockingFeePercentage = 0;
      }
    }

    const grossRefund = (totalReturnSubtotal * refundPercentage) / 100;
    const restockingFee = (grossRefund * restockingFeePercentage) / 100;
    const netRefundAmount = Math.max(0, Math.round((grossRefund - restockingFee) * 100) / 100);

    // Issue Credit Note
    const creditNoteNumber = `CN-${Date.now().toString(36).toUpperCase()}`;
    const creditNote = await CreditNote.create({
      tenant_id: session.tenantId,
      order_id: order._id,
      credit_note_number: creditNoteNumber,
      amount: netRefundAmount,
      reason: parsed.data.return_reason,
      status: "issued",
      created_by: session.userId,
    });

    return NextResponse.json({
      data: {
        credit_note_number: creditNoteNumber,
        net_refund_amount: netRefundAmount,
        refund_percentage: refundPercentage,
        restocking_fee_amount: restockingFee,
        days_since_delivery: daysSinceDelivery,
      },
    });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to process return" }, { status: 500 });
  }
}
