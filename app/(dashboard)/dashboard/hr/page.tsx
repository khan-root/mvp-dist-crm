export const dynamic = "force-dynamic";

import connectDB from "@/lib/db";
import { Agent, AttendanceRecord, AttendancePolicy, Payroll, AgentTeam } from "@/lib/models";
import HRClientView from "./hr-client-view";

export default async function HRDashboardPage() {
  await connectDB();
  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [agents, todayRecords, policies, payrolls, teams] = await Promise.all([
    Agent.find({ is_active: true })
      .select("first_name last_name agent_code designation employment personal_info")
      .lean(),
    AttendanceRecord.find({ date: todayStr }).populate("agent_id").sort({ shift_number: 1 }).lean(),
    AttendancePolicy.find().sort({ created_at: -1 }).lean(),
    Payroll.find({ payroll_month: currentMonth }).populate("agent_id").sort({ net_payable_salary: -1 }).lean(),
    AgentTeam.find()
      .populate("assigned_policy_id")
      .populate("assigned_agent_ids", "first_name last_name agent_code")
      .populate("team_lead_id", "first_name last_name agent_code")
      .sort({ team_name: 1 })
      .lean(),
  ]);

  const policyMap = new Map(policies.map((p: any) => [p._id.toString(), p.policy_name]));

  // Map teams by agent for easy team policy lookup
  const agentTeamMap = new Map<string, string>();
  teams.forEach((t: any) => {
    (t.assigned_agent_ids || []).forEach((ag: any) => {
      const agId = ag._id ? ag._id.toString() : ag.toString();
      if (t.assigned_policy_id) {
        const polName = t.assigned_policy_id.policy_name || policyMap.get(t.assigned_policy_id.toString());
        if (polName) agentTeamMap.set(agId, `${t.team_name} (${polName})`);
      }
    });
  });

  const serializedAgents = agents.map((a: any) => {
    const agentIdStr = a._id.toString();
    const assignedPolicyId = a.employment?.assigned_policy_id ? a.employment.assigned_policy_id.toString() : null;
    let assignedPolicyName = "Default Shift Policy";

    if (assignedPolicyId) {
      assignedPolicyName = policyMap.get(assignedPolicyId) || "Custom Assigned Policy";
    } else if (agentTeamMap.has(agentIdStr)) {
      assignedPolicyName = agentTeamMap.get(agentIdStr)!;
    }

    return {
      _id: agentIdStr,
      name: [a.first_name, a.last_name].filter(Boolean).join(" "),
      agent_code: a.agent_code,
      designation: a.designation || "Sales Booker",
      base_salary: a.employment?.base_salary || 50000,
      commission_rate: a.employment?.commission_rate || 2.5,
      assigned_policy_id: assignedPolicyId,
      assigned_policy_name: assignedPolicyName,
      phone: a.personal_info?.phone || "",
    };
  });

  const serializedRecords = todayRecords.map((r: any) => ({
    _id: r._id.toString(),
    agent_id: r.agent_id?._id?.toString() || r.agent_id?.toString(),
    agent_name: r.agent_id ? [r.agent_id.first_name, r.agent_id.last_name].filter(Boolean).join(" ") : "Agent",
    agent_code: r.agent_id?.agent_code || "",
    date: r.date,
    shift_number: r.shift_number || 1,
    shift_name: r.shift_name || `Shift ${r.shift_number || 1}`,
    clock_in: r.clock_in ? new Date(r.clock_in).toISOString() : null,
    clock_out: r.clock_out ? new Date(r.clock_out).toISOString() : null,
    status: r.status,
    total_hours_worked: r.total_hours_worked || 0,
    effective_work_hours: r.effective_work_hours || 0,
    late_minutes: r.late_minutes || 0,
    overtime_minutes: r.overtime_minutes || 0,
    is_compensated: r.is_compensated || false,
    clock_in_address: r.clock_in_location?.address || "",
    clock_out_address: r.clock_out_location?.address || "",
  }));

  const serializedPolicies = policies.map((p: any) => ({
    _id: p._id.toString(),
    policy_name: p.policy_name,
    shift_start_time: p.shift_start_time,
    shift_end_time: p.shift_end_time,
    grace_period_mins: p.grace_period_mins,
    allow_late_evening_compensation: p.allow_late_evening_compensation,
    early_clockin_overtime: p.early_clockin_overtime,
    overtime_rate_multiplier: p.overtime_rate_multiplier,
    late_deduction_rate_per_hour: p.late_deduction_rate_per_hour,
    is_default: p.is_default,
    is_active: p.is_active,
  }));

  const serializedPayrolls = payrolls.map((pr: any) => ({
    _id: pr._id.toString(),
    agent_id: pr.agent_id?._id?.toString() || pr.agent_id?.toString(),
    agent_name: pr.agent_id ? [pr.agent_id.first_name, pr.agent_id.last_name].filter(Boolean).join(" ") : "Agent",
    agent_code: pr.agent_id?.agent_code || "",
    designation: pr.agent_id?.designation || "Sales Booker",
    payroll_month: pr.payroll_month,
    base_salary: pr.base_salary,
    days_present: pr.days_present,
    days_absent: pr.days_absent,
    late_days: pr.late_days,
    total_overtime_hours: pr.total_overtime_hours,
    overtime_pay: pr.overtime_pay,
    commission_earnings: pr.commission_earnings,
    late_deductions: pr.late_deductions,
    absent_deductions: pr.absent_deductions,
    gross_salary: pr.gross_salary,
    net_payable_salary: pr.net_payable_salary,
    payment_status: pr.payment_status,
    paid_at: pr.paid_at ? new Date(pr.paid_at).toISOString() : null,
    payment_reference: pr.payment_reference || "",
  }));

  const serializedTeams = teams.map((t: any) => ({
    _id: t._id.toString(),
    team_name: t.team_name,
    team_code: t.team_code,
    description: t.description || "",
    assigned_policy_id: t.assigned_policy_id?._id?.toString() || t.assigned_policy_id?.toString() || null,
    assigned_policy_name: t.assigned_policy_id?.policy_name || "No Policy Assigned",
    assigned_agent_ids: (t.assigned_agent_ids || []).map((a: any) => a._id?.toString() || a.toString()),
    agent_count: (t.assigned_agent_ids || []).length,
    team_lead_name: t.team_lead_id ? [t.team_lead_id.first_name, t.team_lead_id.last_name].filter(Boolean).join(" ") : "Unassigned",
  }));

  return (
    <HRClientView
      initialAgents={serializedAgents}
      initialRecords={serializedRecords}
      initialPolicies={serializedPolicies}
      initialPayrolls={serializedPayrolls}
      initialTeams={serializedTeams}
      currentMonth={currentMonth}
      todayStr={todayStr}
    />
  );
}
