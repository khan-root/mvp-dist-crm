import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { AttendanceRecord, AttendancePolicy, Agent, AgentTeam } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agent_id");
    const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!agentId) {
      return NextResponse.json({ success: false, error: "Agent ID required" }, { status: 400 });
    }

    const records = await AttendanceRecord.find({ agent_id: agentId, date: dateStr })
      .populate("policy_id")
      .sort({ shift_number: 1 })
      .lean();

    const activeRecord = records.find((r) => r.clock_in && !r.clock_out) || null;
    const latestRecord = records[records.length - 1] || null;

    return NextResponse.json({
      success: true,
      data: {
        records,
        activeRecord,
        latestRecord,
        total_shifts_today: records.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching attendance status:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { agent_id, action, latitude, longitude, address } = body;

    if (!agent_id || !action) {
      return NextResponse.json({ success: false, error: "agent_id and action required" }, { status: 400 });
    }

    const agent = await Agent.findById(agent_id);
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    const tenantId = agent.tenant_id;
    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();

    // Determine Policy (Direct Agent Policy -> Team Policy -> Tenant Default Policy)
    let policy: any = null;
    if (agent.employment?.assigned_policy_id) {
      policy = await AttendancePolicy.findById(agent.employment.assigned_policy_id);
    }

    if (!policy || !policy.is_active) {
      const team = await AgentTeam.findOne({ tenant_id: tenantId, assigned_agent_ids: agent._id, is_active: true });
      if (team && team.assigned_policy_id) {
        policy = await AttendancePolicy.findById(team.assigned_policy_id);
      }
    }

    if (!policy || !policy.is_active) {
      policy = await AttendancePolicy.findOne({ tenant_id: tenantId, is_active: true, is_default: true });
    }

    if (!policy) {
      return NextResponse.json(
        {
          success: false,
          error: "No active shift policy configured by HR Administrator. Please create and assign a shift policy in HR Studio first.",
        },
        { status: 400 }
      );
    }

    // Parse shift start time for late calculation
    const [startH, startM] = policy.shift_start_time.split(":").map(Number);
    const [endH, endM] = policy.shift_end_time.split(":").map(Number);

    const shiftStart = new Date(now);
    shiftStart.setHours(startH, startM, 0, 0);

    const shiftEnd = new Date(now);
    shiftEnd.setHours(endH, endM, 0, 0);

    const targetShiftHours = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);

    // Fetch existing shift records for today
    const existingRecords = await AttendanceRecord.find({ tenant_id: tenantId, agent_id, date: todayStr }).sort({
      shift_number: 1,
    });

    const activeShift = existingRecords.find((r) => r.clock_in && !r.clock_out);

    if (action === "clock_in") {
      if (activeShift) {
        return NextResponse.json(
          { success: false, error: `Shift #${activeShift.shift_number} is already active and not clocked out.`, data: activeShift },
          { status: 400 }
        );
      }

      const nextShiftNumber = existingRecords.length + 1;
      const shiftName = nextShiftNumber === 1 ? `Shift 1 (${policy.policy_name})` : `Shift ${nextShiftNumber} (Roster)`;

      // Late calculation with grace period
      const graceEnd = new Date(shiftStart.getTime() + policy.grace_period_mins * 60 * 1000);
      let status = "present";
      let lateMins = 0;

      // Only check late on Shift 1 or if clock_in > shift start
      if (nextShiftNumber === 1 && now > graceEnd) {
        status = "late";
        lateMins = Math.floor((now.getTime() - shiftStart.getTime()) / (1000 * 60));
      }

      const newRecord = await AttendanceRecord.create({
        tenant_id: tenantId,
        agent_id,
        date: todayStr,
        shift_number: nextShiftNumber,
        shift_name: shiftName,
        clock_in: now,
        clock_in_location: { latitude, longitude, address },
        status,
        late_minutes: lateMins,
        policy_id: policy._id,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully Clocked In for Shift #${nextShiftNumber} at ${now.toLocaleTimeString()}`,
        data: newRecord,
      });
    } else if (action === "clock_out") {
      if (!activeShift) {
        return NextResponse.json(
          { success: false, error: "No active shift in progress to clock-out." },
          { status: 400 }
        );
      }

      activeShift.clock_out = now;
      activeShift.clock_out_location = { latitude, longitude, address };

      const diffMs = now.getTime() - new Date(activeShift.clock_in).getTime();
      const totalHours = Math.max(0, diffMs / (1000 * 60 * 60));
      activeShift.total_hours_worked = parseFloat(totalHours.toFixed(2));

      // Evening Compensation Check:
      let isCompensated = false;
      let effectiveHours = totalHours;

      if (activeShift.late_minutes > 0 && policy.allow_late_evening_compensation) {
        if (totalHours >= targetShiftHours) {
          isCompensated = true;
          activeShift.status = "present";
        }
      }

      // Overtime calculation
      let overtimeMins = 0;
      if (totalHours > targetShiftHours) {
        overtimeMins = Math.floor((totalHours - targetShiftHours) * 60);
      }

      activeShift.effective_work_hours = parseFloat(effectiveHours.toFixed(2));
      activeShift.overtime_minutes = overtimeMins;
      activeShift.is_compensated = isCompensated;

      await activeShift.save();

      return NextResponse.json({
        success: true,
        message: `Successfully Clocked Out from Shift #${activeShift.shift_number} at ${now.toLocaleTimeString()}`,
        data: activeShift,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error handling clock-in/out:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
