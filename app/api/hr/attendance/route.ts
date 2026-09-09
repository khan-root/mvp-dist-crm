import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { AttendanceRecord, Agent } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const agentId = searchParams.get("agent_id");
    const month = searchParams.get("month"); // YYYY-MM

    const query: any = {};

    if (agentId) query.agent_id = agentId;
    if (date) query.date = date;
    if (month) query.date = { $regex: `^${month}` };

    const records = await AttendanceRecord.find(query)
      .populate("agent_id", "first_name last_name agent_code designation personal_info.phone")
      .populate("policy_id")
      .sort({ date: -1, clock_in: -1 })
      .lean();

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    console.error("Error listing attendance records:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
