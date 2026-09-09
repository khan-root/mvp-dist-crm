import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Product, Agent } from "@/lib/models";
import { getSession } from "@/lib/auth";

const AssignProductsSchema = z.object({
  product_ids: z.array(z.string()),
});

/** GET: fetch assigned and all catalog products for an agent */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: agentId } = await params;
    await dbConnect();

    const agent = await Agent.findOne({ _id: agentId, tenant_id: session.tenantId })
      .select("assigned_product_ids distributor_id")
      .lean();
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const query: Record<string, unknown> = {
      tenant_id: session.tenantId,
      "status.is_active": true,
    };
    if (agent.distributor_id) {
      query.distributor_id = agent.distributor_id;
    }

    const allProducts = await Product.find(query)
      .select("product_name product_code sku pricing unit_of_measure")
      .sort({ product_name: 1 })
      .lean();

    const assignedIds = (agent.assigned_product_ids || []).map((id: any) => id.toString());

    return NextResponse.json({
      data: {
        agent_id: agentId,
        assigned_product_ids: assignedIds,
        all_products: allProducts,
      },
    });
  } catch (e) {
    console.error("Fetch assign-products error:", e);
    return NextResponse.json({ error: "Failed to fetch product assignments" }, { status: 500 });
  }
}

/** PUT: update product assignments for an agent */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: agentId } = await params;
    const body = await request.json();
    const parsed = AssignProductsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid product_ids list", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    const updated = await Agent.findOneAndUpdate(
      { _id: agentId, tenant_id: session.tenantId },
      { $set: { assigned_product_ids: parsed.data.product_ids } },
      { new: true }
    );

    if (!updated) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    return NextResponse.json({
      success: true,
      message: `Assigned ${parsed.data.product_ids.length} products to agent`,
    });
  } catch (e) {
    console.error("Update assign-products error:", e);
    return NextResponse.json({ error: "Failed to update product assignments" }, { status: 500 });
  }
}
