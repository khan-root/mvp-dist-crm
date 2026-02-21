import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Store, User } from "@/lib/models";
import { getSession } from "@/lib/auth";

/** Agent: list shops assigned to me (my task list to visit and take orders). */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const user = await User.findById(session.userId).lean();
    const agentAssoc = user?.domain_associations?.find((a: { domain_type?: string }) => a.domain_type === "agent");
    const agentId = agentAssoc?.domain_id?.toString?.();
    if (!agentId) return NextResponse.json({ error: "Not an agent account" }, { status: 403 });

    const list = await Store.find({
      tenant_id: session.tenantId,
      assigned_agent_id: agentId,
      is_active: true,
    })
      .select("store_code store_name store_type owner_info address")
      .sort({ store_name: 1 })
      .lean();

    return NextResponse.json({ data: list });
  } catch (e) {
    console.error("Agent assigned-stores error:", e);
    return NextResponse.json({ error: "Failed to load stores" }, { status: 500 });
  }
}
