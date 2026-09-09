import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { AgentTeam, Tenant } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const teams = await AgentTeam.find()
      .populate("assigned_policy_id")
      .populate("assigned_agent_ids", "first_name last_name agent_code designation personal_info")
      .populate("team_lead_id", "first_name last_name agent_code")
      .sort({ team_name: 1 })
      .lean();

    return NextResponse.json({ success: true, data: teams });
  } catch (error: any) {
    console.error("Error fetching agent teams:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const tenant = await Tenant.findOne();
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    const team = await AgentTeam.create({
      tenant_id: tenant._id,
      ...body,
    });

    return NextResponse.json({ success: true, message: `Team '${team.team_name}' created successfully`, data: team });
  } catch (error: any) {
    console.error("Error creating agent team:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ success: false, error: "Team ID required" }, { status: 400 });
    }

    const updated = await AgentTeam.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ success: true, message: "Team updated successfully", data: updated });
  } catch (error: any) {
    console.error("Error updating agent team:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
