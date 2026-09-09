import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Promotion, Product } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const EvaluateSchema = z.object({
  items: z.array(
    z.object({
      product_id: z.string(),
      quantity: z.number().min(1),
      unit_price: z.number().min(0),
    })
  ),
  subtotal: z.number(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = EvaluateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();
    const activePromos = await Promotion.find({
      tenant_id: session.tenantId,
      is_active: true,
      start_date: { $lte: new Date() },
      end_date: { $gte: new Date() },
    }).lean();

    const freeItems: Array<{ product_id: string; product_name: string; quantity: number; reason: string }> = [];
    let totalDiscount = 0;
    let supplierReimbursement = 0;
    const appliedPromos: string[] = [];

    // Priority 1: BOGO Offers
    const bogoPromos = activePromos.filter((p: any) => p.promo_type === "bogo" && p.bogo_rules);
    for (const promo of bogoPromos) {
      const rule = promo.bogo_rules;
      if (!rule) continue;
      const cartItem = parsed.data.items.find((i) => i.product_id === rule.buy_product_id);
      if (cartItem && cartItem.quantity >= rule.buy_quantity) {
        const timesApplied = Math.floor(cartItem.quantity / rule.buy_quantity);
        let freeQty = timesApplied * rule.get_quantity;
        if (rule.max_free_per_order && freeQty > rule.max_free_per_order) {
          freeQty = rule.max_free_per_order;
        }

        const getProd = await Product.findById(rule.get_product_id).select("product_name pricing").lean();
        if (getProd && freeQty > 0) {
          freeItems.push({
            product_id: rule.get_product_id,
            product_name: getProd.product_name,
            quantity: freeQty,
            reason: `BOGO: ${promo.name}`,
          });
          appliedPromos.push(promo.name);

          if (promo.is_supplier_funded) {
            const itemCost = (getProd.pricing?.base_cost || 0) * freeQty;
            supplierReimbursement += (itemCost * (promo.supplier_reimbursement_percent || 100)) / 100;
          }
        }
      }
    }

    // Priority 2: Slab Discounts
    const slabPromos = activePromos.filter((p: any) => p.promo_type === "slab" && p.slab_rules);
    for (const item of parsed.data.items) {
      for (const promo of slabPromos) {
        const matchingSlab = promo.slab_rules?.find(
          (s: any) => item.quantity >= s.min_quantity && item.quantity <= s.max_quantity
        );
        if (matchingSlab) {
          const itemTotal = item.quantity * item.unit_price;
          const disc = (itemTotal * matchingSlab.discount_percentage) / 100;
          totalDiscount += disc;
          appliedPromos.push(`${promo.name} (${matchingSlab.discount_percentage}% off)`);
        }
      }
    }

    // Priority 3: Bill-Level Discounts
    const billPromos = activePromos.filter((p) => p.promo_type === "bill_level" && p.bill_rules);
    for (const promo of billPromos) {
      const rule = promo.bill_rules;
      if (rule && parsed.data.subtotal >= rule.min_bill_amount) {
        let billDisc = (parsed.data.subtotal * rule.discount_percentage) / 100;
        if (rule.max_discount_cap && billDisc > rule.max_discount_cap) {
          billDisc = rule.max_discount_cap;
        }
        totalDiscount += billDisc;
        appliedPromos.push(`${promo.name} (Bill ${rule.discount_percentage}%)`);
      }
    }

    // Enforce Maximum Total Discount Cap (30% of cart value)
    const maxAllowedDiscount = (parsed.data.subtotal * 30) / 100;
    if (totalDiscount > maxAllowedDiscount) {
      totalDiscount = maxAllowedDiscount;
    }

    return NextResponse.json({
      data: {
        subtotal: parsed.data.subtotal,
        discount_amount: Math.round(totalDiscount * 100) / 100,
        supplier_reimbursement: Math.round(supplierReimbursement * 100) / 100,
        free_items: freeItems,
        applied_promotions: Array.from(new Set(appliedPromos)),
        payable_total: Math.max(0, Math.round((parsed.data.subtotal - totalDiscount) * 100) / 100),
      },
    });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to evaluate promotions" }, { status: 500 });
  }
}
