import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { TransportBilty } from "@/lib/models";
import { requireSession } from "@/lib/auth";
import { getFacilityScopeFilter } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const warehouse_id = searchParams.get("warehouse_id");
    const product_id = searchParams.get("product_id");
    const status = searchParams.get("status");

    const scopeFilter = await getFacilityScopeFilter(session.userId, session.tenantId, "warehouse_id");
    const query: any = { ...scopeFilter };
    if (warehouse_id) query.warehouse_id = warehouse_id;
    if (product_id) query.product_id = product_id;
    if (status) query.status = status;

    const bilties = await TransportBilty.find(query)
      .populate("warehouse_id", "warehouse_name warehouse_code")
      .populate("product_id", "product_name sku unit_of_measure")
      .populate("port_shipment_id", "shipment_number vessel_name origin_country")
      .populate("created_by", "name email")
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ data: bilties });
  } catch (e: any) {
    if (e instanceof Response) throw e;
    return NextResponse.json({ error: e?.message || "Failed to list transport bilties" }, { status: 500 });
  }
}
