import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Product, StockMovement } from "@/lib/models";
import { requireSession } from "@/lib/auth";

const AdjustmentSchema = z.object({
  product_id: z.string().min(1),
  adjustment_type: z.enum(["receipt", "adjustment_in", "adjustment_out", "damage", "transfer"]),
  quantity: z.number().min(1),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    await dbConnect();

    const productFilter: Record<string, unknown> = {
      tenant_id: session.tenantId,
      "status.is_active": true,
    };

    if (search) {
      const q = search.toLowerCase();
      productFilter.$or = [
        { product_name: { $regex: q, $options: "i" } },
        { product_code: { $regex: q, $options: "i" } },
        { sku: { $regex: q, $options: "i" } },
      ];
    }

    const products = await Product.find(productFilter).sort({ product_name: 1 }).lean();

    let total_units = 0;
    let low_stock_count = 0;
    let out_of_stock_count = 0;
    let total_valuation = 0;

    const items = products.map((p) => {
      const currentStock = p.inventory?.current_stock ?? 0;
      const minStock = p.inventory?.minimum_stock ?? 10;
      const costPrice = p.pricing?.base_cost ?? p.pricing?.mrp ?? 0;
      const itemValuation = currentStock * costPrice;

      total_units += currentStock;
      total_valuation += itemValuation;

      if (currentStock === 0) {
        out_of_stock_count++;
      } else if (currentStock <= minStock) {
        low_stock_count++;
      }

      return {
        _id: p._id.toString(),
        product_name: p.product_name,
        product_code: p.product_code,
        sku: p.sku,
        unit_of_measure: p.unit_of_measure,
        category_id: p.category_id,
        current_stock: currentStock,
        minimum_stock: minStock,
        maximum_stock: p.inventory?.maximum_stock ?? 100,
        cost_price: costPrice,
        mrp: p.pricing?.mrp ?? 0,
        total_value: itemValuation,
        status:
          currentStock === 0
            ? "out_of_stock"
            : currentStock <= minStock
            ? "low_stock"
            : "in_stock",
      };
    });

    const recentMovements = await StockMovement.find({ tenant_id: session.tenantId })
      .populate("product_id", "product_name sku")
      .sort({ created_at: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      data: {
        summary: {
          total_skus: products.length,
          total_units,
          low_stock_count,
          out_of_stock_count,
          total_valuation,
        },
        items,
        recent_movements: recentMovements,
      },
    });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to fetch inventory data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = AdjustmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await dbConnect();
    const product = await Product.findOne({
      _id: parsed.data.product_id,
      tenant_id: session.tenantId,
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const previousStock = product.inventory?.current_stock ?? 0;
    let newStock = previousStock;

    if (parsed.data.adjustment_type === "receipt" || parsed.data.adjustment_type === "adjustment_in") {
      newStock = previousStock + parsed.data.quantity;
    } else {
      newStock = Math.max(0, previousStock - parsed.data.quantity);
    }

    await Product.updateOne(
      { _id: product._id },
      { $set: { "inventory.current_stock": newStock } }
    );

    const movementTypeMap: Record<string, string> = {
      receipt: "purchase_receipt",
      adjustment_in: "adjustment_in",
      adjustment_out: "adjustment_out",
      damage: "damage",
      transfer: "transfer_out",
    };

    const movementDoc = await StockMovement.create({
      tenant_id: session.tenantId,
      movement_type: movementTypeMap[parsed.data.adjustment_type] || "adjustment_in",
      product_id: product._id,
      quantity: parsed.data.quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      unit_cost: product.pricing?.base_cost ?? 0,
      total_cost: (product.pricing?.base_cost ?? 0) * parsed.data.quantity,
      created_by: session.userId,
    });

    return NextResponse.json({
      data: {
        product_id: product._id,
        previous_stock: previousStock,
        new_stock: newStock,
        movement: movementDoc,
      },
    });
  } catch (e) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: "Failed to record inventory adjustment" }, { status: 500 });
  }
}
