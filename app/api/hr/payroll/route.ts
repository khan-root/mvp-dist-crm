import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Payroll, Agent, AttendanceRecord, Order, AttendancePolicy, Tenant } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);
    const agentId = searchParams.get("agent_id");

    const query: any = { payroll_month: month };
    if (agentId) query.agent_id = agentId;

    const payrolls = await Payroll.find(query)
      .populate("agent_id", "first_name last_name agent_code designation employment personal_info.phone")
      .sort({ net_payable_salary: -1 })
      .lean();

    return NextResponse.json({ success: true, data: payrolls });
  } catch (error: any) {
    console.error("Error fetching payroll records:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { month = new Date().toISOString().slice(0, 7), agent_id } = body;

    const tenant = await Tenant.findOne();
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    // Get active default policy for calculation rates
    const defaultPolicy = await AttendancePolicy.findOne({ tenant_id: tenant._id, is_active: true });
    if (!defaultPolicy) {
      return NextResponse.json(
        { success: false, error: "No active shift policy found in HR Studio. Please configure a shift policy first." },
        { status: 400 }
      );
    }

    // Find target agents (either specific agent or all active agents)
    const agentQuery: any = { is_active: true };
    if (agent_id) agentQuery._id = agent_id;

    const agents = await Agent.find(agentQuery).populate("employment.assigned_policy_id").lean();
    if (!agents.length) {
      return NextResponse.json({ success: false, error: "No active agents found" }, { status: 404 });
    }

    const generatedPayrolls = [];

    for (const agent of agents) {
      const policy = agent.employment?.assigned_policy_id || defaultPolicy;
      const baseSalary = agent.employment?.base_salary || 50000;
      const commissionRate = agent.employment?.commission_rate || 2.5;

      // 1. Fetch attendance records for this agent in month (YYYY-MM)
      const attendanceRecords = await AttendanceRecord.find({
        agent_id: agent._id,
        date: { $regex: `^${month}` },
      }).lean();

      const daysPresent = attendanceRecords.filter((r) => r.status === "present" || r.status === "late").length;
      const daysAbsent = Math.max(0, 30 - daysPresent);
      const uncompensatedLateDays = attendanceRecords.filter((r) => r.status === "late" && !r.is_compensated).length;

      const totalOvertimeMins = attendanceRecords.reduce((acc, r) => acc + (r.overtime_minutes || 0), 0);
      const totalOvertimeHours = parseFloat((totalOvertimeMins / 60).toFixed(2));

      // 2. Calculate sales commission from completed/delivered orders in month
      const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);

      const agentOrders = await Order.find({
        assigned_agent_id: agent._id,
        created_at: { $gte: startOfMonth, $lte: endOfMonth },
        order_status: { $in: ["delivered", "confirmed", "completed"] },
      }).lean();

      const totalSalesValue = agentOrders.reduce((acc, o) => acc + (o.pricing?.total_amount || 0), 0);
      const commissionEarnings = Math.round((totalSalesValue * commissionRate) / 100);

      // 3. Rate & Deductions Math
      const hourlyBaseRate = baseSalary / (30 * 8); // 8-hour workday standard
      const overtimePay = Math.round(totalOvertimeHours * hourlyBaseRate * (policy.overtime_rate_multiplier || 1.5));

      const absentDeductions = Math.round((baseSalary / 30) * daysAbsent);
      const lateDeductions = uncompensatedLateDays * (policy.late_deduction_rate_per_hour || 200);

      const grossSalary = Math.round(baseSalary + overtimePay + commissionEarnings);
      const netPayableSalary = Math.max(0, Math.round(grossSalary - absentDeductions - lateDeductions));

      // Upsert payroll record
      const payrollRecord = await Payroll.findOneAndUpdate(
        { tenant_id: tenant._id, agent_id: agent._id, payroll_month: month },
        {
          tenant_id: tenant._id,
          agent_id: agent._id,
          payroll_month: month,
          base_salary: baseSalary,
          days_in_month: 30,
          days_present: daysPresent,
          days_absent: daysAbsent,
          late_days: uncompensatedLateDays,
          total_overtime_hours: totalOvertimeHours,
          overtime_pay: overtimePay,
          commission_earnings: commissionEarnings,
          late_deductions: lateDeductions,
          absent_deductions: absentDeductions,
          gross_salary: grossSalary,
          net_payable_salary: netPayableSalary,
          payment_status: "draft",
        },
        { upsert: true, new: true }
      );

      generatedPayrolls.push(payrollRecord);
    }

    return NextResponse.json({
      success: true,
      message: `Generated Payroll for ${generatedPayrolls.length} Agent(s) for ${month}`,
      data: generatedPayrolls,
    });
  } catch (error: any) {
    console.error("Error generating monthly payroll:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, payment_status, payment_reference, remarks } = body;

    if (!_id) {
      return NextResponse.json({ success: false, error: "Payroll ID required" }, { status: 400 });
    }

    const update: any = { payment_status, remarks };
    if (payment_reference) update.payment_reference = payment_reference;
    if (payment_status === "paid") update.paid_at = new Date();

    const updated = await Payroll.findByIdAndUpdate(_id, update, { new: true });
    return NextResponse.json({ success: true, message: "Payroll status updated", data: updated });
  } catch (error: any) {
    console.error("Error updating payroll status:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
