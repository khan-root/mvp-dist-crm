import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Product, Store, User } from "@/lib/models";
import { getSession } from "@/lib/auth";

/**
 * Shop keeper: search products across all distributors (warehouses).
 * Returns product name, distributor/warehouse name, and price so shop keeper
 * can order directly from any distributor without an agent.
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    await dbConnect();

    const user = await User.findById(session.userId).lean();
    const storeAssoc = user?.domain_associations?.find((a: { domain_type?: string }) => a.domain_type === "store");
    const storeId = storeAssoc?.domain_id?.toString?.();
    if (!storeId) return NextResponse.json({ error: "Not a store account" }, { status: 403 });

    const filter: Record<string, unknown> = {
      tenant_id: session.tenantId,
      "status.is_active": true,
    };
    if (q.length > 0) {
      filter.$or = [
        { product_name: new RegExp(q, "i") },
        { product_code: new RegExp(q, "i") },
        { sku: new RegExp(q, "i") },
      ];
    }

    const list = await Product.find(filter)
      .select("product_name product_code sku pricing unit_of_measure distributor_id")
      .populate("distributor_id", "company_name distributor_code")
      .sort({ product_name: 1 })
      .limit(limit)
      .lean();

    const data = list.map((p: { _id: string; product_name: string; product_code: string; pricing?: { mrp?: number; retail_price?: number; wholesale_price?: number }; distributor_id?: { _id: string; company_name: string; distributor_code?: string } }) => ({
      _id: p._id,
      product_name: p.product_name,
      product_code: p.product_code,
      unit_price: p.pricing?.retail_price ?? p.pricing?.wholesale_price ?? p.pricing?.mrp ?? 0,
      distributor_id: p.distributor_id?._id ?? p.distributor_id,
      distributor_name: typeof p.distributor_id === "object" && p.distributor_id ? (p.distributor_id as { company_name?: string }).company_name : "",
      distributor_code: typeof p.distributor_id === "object" && p.distributor_id ? (p.distributor_id as { distributor_code?: string }).distributor_code : "",
    }));

    return NextResponse.json({ data });
  } catch (e) {
    console.error("Store products search error:", e);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
