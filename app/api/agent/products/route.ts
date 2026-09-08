import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Product, Agent, User } from "@/lib/models";
import { getSession } from "@/lib/auth";

/** Agent: list products from my distributor (to offer to shop keepers and place orders). */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const user = await User.findById(session.userId).lean();
    const agentAssoc = user?.domain_associations?.find((a: { domain_type?: string }) => a.domain_type === "agent");
    const agentId = agentAssoc?.domain_id?.toString?.();
    if (!agentId) return NextResponse.json({ error: "Not an agent account" }, { status: 403 });

    const agent = await Agent.findById(agentId).select("distributor_id assigned_product_ids").lean();
    if (!agent?.distributor_id) return NextResponse.json({ data: [] });

    const query: Record<string, unknown> = {
      tenant_id: session.tenantId,
      distributor_id: agent.distributor_id,
      "status.is_active": true,
    };

    if (agent.assigned_product_ids && agent.assigned_product_ids.length > 0) {
      query._id = { $in: agent.assigned_product_ids };
    }

    const list = await Product.find(query)
      .select("product_name product_code sku pricing unit_of_measure")
      .sort({ product_name: 1 })
      .lean();

    return NextResponse.json({ data: list });
  } catch (e) {
    console.error("Agent products error:", e);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
