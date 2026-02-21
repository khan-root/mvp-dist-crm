import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Product, Store, User } from "@/lib/models";
import { getSession } from "@/lib/auth";

/** List products for the logged-in store. Optional distributor_id = order from that distributor (direct order). */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const distributorId = searchParams.get("distributor_id");

    await dbConnect();

    const user = await User.findById(session.userId).lean();
    const storeAssoc = user?.domain_associations?.find((a: { domain_type?: string }) => a.domain_type === "store");
    const storeId = storeAssoc?.domain_id?.toString?.();
    if (!storeId) return NextResponse.json({ error: "Not a store account" }, { status: 403 });

    const store = await Store.findById(storeId).select("distributor_id").lean();
    const effectiveDistributorId = distributorId || store?.distributor_id?.toString?.();
    if (!effectiveDistributorId) return NextResponse.json({ data: [] });

    const list = await Product.find({
      tenant_id: session.tenantId,
      distributor_id: effectiveDistributorId,
      "status.is_active": true,
    })
      .select("product_name product_code sku pricing unit_of_measure")
      .sort({ product_name: 1 })
      .lean();

    return NextResponse.json({ data: list });
  } catch (e) {
    console.error("Store products error:", e);
    return NextResponse.json({ error: "Failed to list products" }, { status: 500 });
  }
}
