import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Store, Agent } from "@/lib/models";
import { getSession } from "@/lib/auth";

const AssignStoresSchema = z.object({
  store_ids: z.array(z.string()),
});

/** GET: fetch assigned and available stores for an agent */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: agentId } = await params;
    await dbConnect();

    const agent = await Agent.findOne({ _id: agentId, tenant_id: session.tenantId }).lean();
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const [assignedStores, availableStores] = await Promise.all([
      Store.find({ tenant_id: session.tenantId, assigned_agent_id: agentId, is_active: true })
        .select("store_code store_name store_type owner_info address")
        .sort({ store_name: 1 })
        .lean(),
      Store.find({
        tenant_id: session.tenantId,
        is_active: true,
        $or: [{ assigned_agent_id: { $ne: agentId } }, { assigned_agent_id: { $exists: false } }],
      })
        .select("store_code store_name store_type owner_info address assigned_agent_id")
        .sort({ store_name: 1 })
        .lean(),
    ]);

    return NextResponse.json({
      data: {
        agent_id: agentId,
        assigned_stores: assignedStores,
        available_stores: availableStores,
      },
    });
  } catch (e) {
    console.error("Fetch assign-stores error:", e);
    return NextResponse.json({ error: "Failed to fetch store assignments" }, { status: 500 });
  }
}

/** PUT: update store assignments for an agent */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: agentId } = await params;
    const body = await request.json();
    const parsed = AssignStoresSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid store_ids list", details: parsed.error.flatten() }, { status: 400 });
    }

    await dbConnect();

    const agent = await Agent.findOne({ _id: agentId, tenant_id: session.tenantId }).lean();
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const newStoreIds = parsed.data.store_ids;

    // 1. Remove agent assignment from stores previously assigned to this agent but NOT in newStoreIds
    await Store.updateMany(
      { tenant_id: session.tenantId, assigned_agent_id: agentId, _id: { $nin: newStoreIds } },
      { $unset: { assigned_agent_id: 1 } }
    );

    // 2. Assign selected stores to this agent
    if (newStoreIds.length > 0) {
      await Store.updateMany(
        { tenant_id: session.tenantId, _id: { $in: newStoreIds } },
        { $set: { assigned_agent_id: agentId } }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Assigned ${newStoreIds.length} stores to agent`,
    });
  } catch (e) {
    console.error("Update assign-stores error:", e);
    return NextResponse.json({ error: "Failed to update store assignments" }, { status: 500 });
  }
}
