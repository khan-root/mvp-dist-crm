import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Agent, AttendancePolicy } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { agent_ids, policy_id } = body; // agent_ids can be string or array of strings

    if (!policy_id) {
      return NextResponse.json({ success: false, error: "policy_id is required" }, { status: 400 });
    }

    const policy = await AttendancePolicy.findById(policy_id);
    if (!policy) {
      return NextResponse.json({ success: false, error: "Attendance policy not found" }, { status: 404 });
    }

    const targetAgentIds = Array.isArray(agent_ids) ? agent_ids : [agent_ids];

    await Agent.updateMany(
      { _id: { $in: targetAgentIds } },
      { "employment.assigned_policy_id": policy._id }
    );

    return NextResponse.json({
      success: true,
      message: `Shift Policy '${policy.policy_name}' assigned to ${targetAgentIds.length} Agent(s)`,
    });
  } catch (error: any) {
    console.error("Error assigning shift policy:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
