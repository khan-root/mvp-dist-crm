"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  Clock,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Plus,
  FileSpreadsheet,
  FileText,
  Building2,
  RefreshCw,
  Search,
  CreditCard,
  UserCheck,
  FolderPlus,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

interface HRClientViewProps {
  initialAgents: any[];
  initialRecords: any[];
  initialPolicies: any[];
  initialPayrolls: any[];
  initialTeams: any[];
  currentMonth: string;
  todayStr: string;
}

export default function HRClientView({
  initialAgents,
  initialRecords,
  initialPolicies,
  initialPayrolls,
  initialTeams,
  currentMonth,
  todayStr,
}: HRClientViewProps) {
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get("tab") || "teams";

  const [activeTab, setActiveTab] = useState(initialTabParam);
  const [agents, setAgents] = useState(initialAgents);
  const [records, setRecords] = useState(initialRecords);
  const [policies, setPolicies] = useState(initialPolicies);
  const [payrolls, setPayrolls] = useState(initialPayrolls);
  const [teams, setTeams] = useState(initialTeams);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [searchParams]);

  // Filters
  const [filterDate, setFilterDate] = useState(todayStr);
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [searchAgent, setSearchAgent] = useState("");

  // Create Shift Policy Form Modal
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    policy_name: "Standard Field Shift",
    shift_start_time: "10:00",
    shift_end_time: "19:00",
    grace_period_mins: 15,
    allow_late_evening_compensation: true,
    early_clockin_overtime: false,
    overtime_rate_multiplier: 1.5,
    late_deduction_rate_per_hour: 200,
    is_default: true,
  });

  // Assign Policy Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState("");

  // Create Team Modal State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamForm, setTeamForm] = useState({
    team_name: "",
    team_code: "",
    description: "",
    assigned_policy_id: "",
    team_lead_id: "",
    assigned_agent_ids: [] as string[],
  });

  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const [selectedPaySlip, setSelectedPaySlip] = useState<any>(null);
  const [isPaySlipModalOpen, setIsPaySlipModalOpen] = useState(false);
  const [paymentRefInput, setPaymentRefInput] = useState("");

  // Fetch Attendance Records for Filter Date
  const handleFetchAttendance = async (dateVal: string) => {
    setFilterDate(dateVal);
    try {
      const res = await fetch(`/api/hr/attendance?date=${dateVal}`);
      const data = await res.json();
      if (data.success) {
        const formatted = data.data.map((r: any) => ({
          _id: r._id,
          agent_id: r.agent_id?._id || r.agent_id,
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
        setRecords(formatted);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance for date");
    }
  };

  // Save HR Shift Policy
  const handleSavePolicy = async () => {
    try {
      const res = await fetch("/api/hr/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policyForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setPolicies([data.data, ...policies]);
        setIsPolicyModalOpen(false);
      } else {
        toast.error(data.error || "Failed to save policy");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Create Agent Team & Assign Policy to Team
  const handleCreateTeam = async () => {
    if (!teamForm.team_name || !teamForm.team_code) {
      toast.error("Team name and team code are required");
      return;
    }
    try {
      const res = await fetch("/api/hr/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        const policyObj = policies.find((p) => p._id === teamForm.assigned_policy_id);
        const newTeamObj = {
          _id: data.data._id,
          team_name: data.data.team_name,
          team_code: data.data.team_code,
          description: data.data.description || "",
          assigned_policy_id: teamForm.assigned_policy_id,
          assigned_policy_name: policyObj?.policy_name || "No Policy Assigned",
          assigned_agent_ids: teamForm.assigned_agent_ids,
          agent_count: teamForm.assigned_agent_ids.length,
          team_lead_name: "Assigned Lead",
        };
        setTeams([newTeamObj, ...teams]);
        setIsTeamModalOpen(false);
        setTeamForm({
          team_name: "",
          team_code: "",
          description: "",
          assigned_policy_id: "",
          team_lead_id: "",
          assigned_agent_ids: [],
        });
      } else {
        toast.error(data.error || "Failed to create team");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Assign Policy to Individual Agent
  const handleAssignPolicy = async () => {
    if (!selectedAgentId || !selectedPolicyId) {
      toast.error("Please select both an Agent and a Shift Policy");
      return;
    }
    try {
      const res = await fetch("/api/hr/policies/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_ids: [selectedAgentId], policy_id: selectedPolicyId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        const policyObj = policies.find((p) => p._id === selectedPolicyId);
        setAgents((prev) =>
          prev.map((a) =>
            a._id === selectedAgentId
              ? { ...a, assigned_policy_id: selectedPolicyId, assigned_policy_name: policyObj?.policy_name || "Assigned Shift" }
              : a
          )
        );
        setIsAssignModalOpen(false);
      } else {
        toast.error(data.error || "Failed to assign policy");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Generate Monthly Payroll
  const handleGeneratePayroll = async () => {
    setGeneratingPayroll(true);
    toast.info(`Calculating salary, team shift attendance & sales commissions for ${filterMonth}...`);
    try {
      const res = await fetch("/api/hr/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: filterMonth }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        const fetchRes = await fetch(`/api/hr/payroll?month=${filterMonth}`);
        const fetchData = await fetchRes.json();
        if (fetchData.success) {
          const formatted = fetchData.data.map((pr: any) => ({
            _id: pr._id,
            agent_id: pr.agent_id?._id || pr.agent_id,
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
          setPayrolls(formatted);
        }
      } else {
        toast.error(data.error || "Payroll calculation failed");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGeneratingPayroll(false);
    }
  };

  // Update Payroll Status (Mark as Paid)
  const handleUpdatePayrollStatus = async (payrollId: string, status: string) => {
    try {
      const res = await fetch("/api/hr/payroll", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: payrollId,
          payment_status: status,
          payment_reference: paymentRefInput || `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Payroll marked as ${status.toUpperCase()}`);
        setPayrolls((prev) =>
          prev.map((p) => (p._id === payrollId ? { ...p, payment_status: status, payment_reference: data.data.payment_reference } : p))
        );
        setIsPaySlipModalOpen(false);
      } else {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // KPI calculations
  const clockedInCount = records.filter((r) => r.clock_in).length;
  const lateCount = records.filter((r) => r.status === "late" && !r.is_compensated).length;
  const compensatedCount = records.filter((r) => r.is_compensated).length;

  const totalNetPayroll = payrolls.reduce((acc, p) => acc + (p.net_payable_salary || 0), 0);
  const totalCommissions = payrolls.reduce((acc, p) => acc + (p.commission_earnings || 0), 0);
  const totalOvertimePaid = payrolls.reduce((acc, p) => acc + (p.overtime_pay || 0), 0);

  const filteredRecords = records.filter(
    (r) =>
      r.agent_name.toLowerCase().includes(searchAgent.toLowerCase()) ||
      r.agent_code.toLowerCase().includes(searchAgent.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="size-6 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight">Human Resources (HR) & Teams Management</h1>
          </div>
          <p className="text-sm text-slate-300">
            Agent Teams & Groups · Batch Policy Inheritance · Multi-Shift Attendance Rosters · Automated Monthly Payroll
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Dialog open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2 shadow-md cursor-pointer">
                <FolderPlus className="size-4" /> Create Agent Team
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Create Field Agent Team / Group</DialogTitle>
                <DialogDescription>Group field agents into teams and assign a shift policy to all members at once</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Team Name</Label>
                    <Input
                      placeholder="e.g. North Order Bookers"
                      value={teamForm.team_name}
                      onChange={(e) => setTeamForm({ ...teamForm, team_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Team Code</Label>
                    <Input
                      placeholder="e.g. TEAM-NORTH-01"
                      value={teamForm.team_code}
                      onChange={(e) => setTeamForm({ ...teamForm, team_code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Assign Team Shift Policy</Label>
                  <select
                    value={teamForm.assigned_policy_id}
                    onChange={(e) => setTeamForm({ ...teamForm, assigned_policy_id: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Shift Policy to Inherit --</option>
                    {policies.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.policy_name} ({p.shift_start_time} - {p.shift_end_time})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Select Member Agents ({teamForm.assigned_agent_ids.length} selected)</Label>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                    {agents.map((a) => {
                      const isSelected = teamForm.assigned_agent_ids.includes(a._id);
                      return (
                        <div
                          key={a._id}
                          onClick={() => {
                            if (isSelected) {
                              setTeamForm({ ...teamForm, assigned_agent_ids: teamForm.assigned_agent_ids.filter((id) => id !== a._id) });
                            } else {
                              setTeamForm({ ...teamForm, assigned_agent_ids: [...teamForm.assigned_agent_ids, a._id] });
                            }
                          }}
                          className={`p-2 rounded-md text-xs flex items-center justify-between cursor-pointer border ${
                            isSelected ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span>{a.name} ({a.agent_code})</span>
                          {isSelected && <CheckCircle2 className="size-4 text-emerald-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setIsTeamModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTeam} className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold cursor-pointer">
                  Save Team & Apply Policy
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleGeneratePayroll}
            disabled={generatingPayroll}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold gap-2 shadow-md cursor-pointer border border-slate-700"
          >
            <RefreshCw className={`size-4 ${generatingPayroll ? "animate-spin" : ""}`} />
            {generatingPayroll ? "Calculating..." : "Run Monthly Payroll"}
          </Button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="teams" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="teams" className="rounded-lg font-semibold gap-2 cursor-pointer">
            <UsersRound className="size-4" /> Teams & Groups ({teams.length})
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg font-semibold gap-2 cursor-pointer">
            <Clock className="size-4" /> Shift Roster Logs
          </TabsTrigger>
          <TabsTrigger value="policies" className="rounded-lg font-semibold gap-2 cursor-pointer">
            <ShieldCheck className="size-4" /> Shift Policy Studio
          </TabsTrigger>
          <TabsTrigger value="payroll" className="rounded-lg font-semibold gap-2 cursor-pointer">
            <DollarSign className="size-4" /> Monthly Payroll Studio
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: TEAMS & AGENT GROUPS */}
        <TabsContent value="teams" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Field Agent Teams & Groups</h2>
              <p className="text-sm text-slate-500">Organize order bookers into teams so shift policies automatically apply to all team members</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.length === 0 ? (
              <Card className="col-span-full border-slate-200 p-8 text-center bg-white">
                <p className="text-slate-500 text-sm">No Agent Teams created yet. Click <b>Create Agent Team</b> above to group your agents!</p>
              </Card>
            ) : (
              teams.map((t) => (
                <Card key={t._id} className="border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-slate-900">{t.team_name}</CardTitle>
                      <Badge variant="outline" className="font-mono bg-slate-50">{t.team_code}</Badge>
                    </div>
                    <CardDescription className="text-xs">{t.description || "Field Operations Group"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 space-y-1 text-xs">
                      <span className="font-semibold text-emerald-900">Inherited Shift Policy:</span>
                      <div className="font-bold text-emerald-700 font-mono text-sm">{t.assigned_policy_name}</div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span>Group Members:</span>
                      <span className="font-bold text-slate-900 text-sm">{t.agent_count} Agent(s)</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 2: SHIFT ATTENDANCE ROSTER */}
        <TabsContent value="attendance" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Field Agents</CardTitle>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <Users className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-slate-900">{agents.length}</div>
                <p className="text-xs text-slate-500 mt-1">Total onboarded order bookers</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shifts Active Today</CardTitle>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-emerald-600">{clockedInCount}</div>
                <p className="text-xs text-slate-500 mt-1">Clocked-in shifts on field</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Uncompensated Late</CardTitle>
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                  <AlertTriangle className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-amber-600">{lateCount}</div>
                <p className="text-xs text-slate-500 mt-1">Late arrivals past grace period</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evening Restored</CardTitle>
                <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
                  <ShieldCheck className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-sky-600">{compensatedCount}</div>
                <p className="text-xs text-slate-500 mt-1">Late penalty forgiven via net shift</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Daily Multi-Shift Market Roster Logs</CardTitle>
                <CardDescription>Tracks Shift 1 & Shift 2 clock-ins, assigned policies, and GPS location markers</CardDescription>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-slate-500" />
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => handleFetchAttendance(e.target.value)}
                    className="w-40 text-sm font-semibold"
                  />
                </div>

                <div className="relative">
                  <Search className="size-4 absolute left-3 top-3 text-slate-400" />
                  <Input
                    placeholder="Search agent..."
                    value={searchAgent}
                    onChange={(e) => setSearchAgent(e.target.value)}
                    className="pl-9 w-48 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Agent</th>
                      <th className="px-4 py-3">Shift Roster Name</th>
                      <th className="px-4 py-3">Clock-In Time & GPS</th>
                      <th className="px-4 py-3">Clock-Out Time</th>
                      <th className="px-4 py-3">Worked / Effective</th>
                      <th className="px-4 py-3">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No attendance records found for {filterDate}.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r) => (
                        <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{r.agent_name}</div>
                            <div className="text-xs font-mono text-slate-500">{r.agent_code}</div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            <Badge variant="outline" className="bg-slate-50 font-mono text-xs">
                              {r.shift_name || `Shift #${r.shift_number || 1}`}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {r.clock_in ? (
                              <div>
                                <div className="font-semibold text-emerald-700 font-mono">
                                  {new Date(r.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{r.clock_in_address || "Market GPS Logged"}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 font-mono">Not Clocked In</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {r.clock_out ? (
                              <div>
                                <div className="font-semibold text-amber-700 font-mono">
                                  {new Date(r.clock_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{r.clock_out_address || "Market GPS Logged"}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 font-mono">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono">
                            <div className="font-bold text-slate-900">{r.total_hours_worked} hrs</div>
                            <div className="text-xs text-slate-500">Eff: {r.effective_work_hours} hrs</div>
                          </td>
                          <td className="px-4 py-3">
                            {r.status === "present" && !r.is_compensated && (
                              <Badge variant="success">On-Time Present</Badge>
                            )}
                            {r.status === "late" && !r.is_compensated && (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                Late ({r.late_minutes}m)
                              </Badge>
                            )}
                            {r.is_compensated && (
                              <Badge className="bg-sky-100 text-sky-800 border-sky-300 gap-1">
                                <ShieldCheck className="size-3" /> Compensated
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: SHIFT POLICY STUDIO */}
        <TabsContent value="policies" className="space-y-6 mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Configured Field Shift Policies</h2>
              <p className="text-sm text-slate-500">Rules governing shift timings, grace periods, evening compensation, and overtime multipliers</p>
            </div>

            <div className="flex items-center gap-3">
              <Dialog open={isPolicyModalOpen} onOpenChange={setIsPolicyModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-semibold cursor-pointer">
                    <Plus className="size-4" /> Create Shift Policy
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white">
                  <DialogHeader>
                    <DialogTitle>Configure New Shift Policy</DialogTitle>
                    <DialogDescription>Define field operational shift hours and compensation rules</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Policy Name</Label>
                      <Input
                        value={policyForm.policy_name}
                        onChange={(e) => setPolicyForm({ ...policyForm, policy_name: e.target.value })}
                        placeholder="e.g. Evening Shift / Split Shift"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Shift Start (24hr)</Label>
                        <Input
                          type="time"
                          value={policyForm.shift_start_time}
                          onChange={(e) => setPolicyForm({ ...policyForm, shift_start_time: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Shift End (24hr)</Label>
                        <Input
                          type="time"
                          value={policyForm.shift_end_time}
                          onChange={(e) => setPolicyForm({ ...policyForm, shift_end_time: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Grace Period (Mins)</Label>
                        <Input
                          type="number"
                          value={policyForm.grace_period_mins}
                          onChange={(e) => setPolicyForm({ ...policyForm, grace_period_mins: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Late Penalty (Rs/hr)</Label>
                        <Input
                          type="number"
                          value={policyForm.late_deduction_rate_per_hour}
                          onChange={(e) => setPolicyForm({ ...policyForm, late_deduction_rate_per_hour: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-slate-900">Late Evening Compensation</Label>
                        <p className="text-[11px] text-slate-500">Forgive late arrival if agent completes net 9.0 hrs shift in evening</p>
                      </div>
                      <Switch
                        checked={policyForm.allow_late_evening_compensation}
                        onCheckedChange={(checked) => setPolicyForm({ ...policyForm, allow_late_evening_compensation: checked })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" onClick={() => setIsPolicyModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSavePolicy} className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold">
                      Save Shift Policy
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {policies.map((p) => (
              <Card key={p._id} className="border-slate-200 bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">{p.policy_name}</CardTitle>
                    <CardDescription>Shift Window: {p.shift_start_time} – {p.shift_end_time}</CardDescription>
                  </div>
                  {p.is_default && <Badge variant="success">Default Active</Badge>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-500">Grace Period:</span> <span className="font-bold text-slate-900">{p.grace_period_mins} mins</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Late Penalty:</span> <span className="font-bold text-amber-700">Rs. {p.late_deduction_rate_per_hour}/hr</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Overtime Multiplier:</span> <span className="font-bold text-emerald-700">{p.overtime_rate_multiplier}x</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Evening Comp:</span>{" "}
                      <span className={`font-bold ${p.allow_late_evening_compensation ? "text-emerald-600" : "text-slate-400"}`}>
                        {p.allow_late_evening_compensation ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">Current Agent Shift Assignments</CardTitle>
              <CardDescription>Active policy assigned to each field agent's roster profile or inherited via Agent Team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Agent</th>
                      <th className="px-4 py-3">Agent Code</th>
                      <th className="px-4 py-3">Designation</th>
                      <th className="px-4 py-3">Assigned / Inherited Shift Policy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agents.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-bold text-slate-900">{a.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{a.agent_code}</td>
                        <td className="px-4 py-3 text-slate-700">{a.designation}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold">
                            {a.assigned_policy_name || "Default Shift Policy"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: MONTHLY PAYROLL STUDIO */}
        <TabsContent value="payroll" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Monthly Payroll</CardTitle>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <DollarSign className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900">Rs. {totalNetPayroll.toLocaleString()}</div>
                <p className="text-xs text-slate-500 mt-1">Net salary payable for {filterMonth}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sales Commissions Synced</CardTitle>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <FileSpreadsheet className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-emerald-600">Rs. {totalCommissions.toLocaleString()}</div>
                <p className="text-xs text-slate-500 mt-1">Calculated from completed route orders</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Overtime Disbursed</CardTitle>
                <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
                  <Clock className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900">Rs. {totalOvertimePaid.toLocaleString()}</div>
                <p className="text-xs text-slate-500 mt-1">Extra field hours & multi-shift compensation</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Monthly Agent Salary & Pay Slips</CardTitle>
                <CardDescription>Itemized breakdown of base salary, overtime, sales commissions, and deductions</CardDescription>
              </div>

              <div className="flex items-center gap-3">
                <Input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-40 font-semibold"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Agent</th>
                      <th className="px-4 py-3">Base Salary</th>
                      <th className="px-4 py-3">Days (Pres / Abs / Late)</th>
                      <th className="px-4 py-3">Commissions</th>
                      <th className="px-4 py-3">Deductions</th>
                      <th className="px-4 py-3">Net Salary</th>
                      <th className="px-4 py-3">Payment Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payrolls.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          No payroll records generated for {filterMonth}. Click <b>Run Monthly Payroll</b> to process.
                        </td>
                      </tr>
                    ) : (
                      payrolls.map((pr) => (
                        <tr key={pr._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{pr.agent_name}</div>
                            <div className="text-xs text-slate-500 font-mono">{pr.agent_code} · {pr.designation}</div>
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                            Rs. {pr.base_salary?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            <span className="font-bold text-emerald-700">{pr.days_present}d Present</span> ·{" "}
                            <span className="text-rose-600">{pr.days_absent}d Abs</span> ·{" "}
                            <span className="text-amber-700">{pr.late_days}d Late</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                            +Rs. {pr.commission_earnings?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-mono text-rose-600 font-semibold">
                            -Rs. {(pr.late_deductions + pr.absent_deductions).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-mono font-extrabold text-slate-900 text-base">
                            Rs. {pr.net_payable_salary?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={
                                pr.payment_status === "paid"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-slate-100 text-slate-700"
                              }
                            >
                              {pr.payment_status?.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPaySlip(pr);
                                setPaymentRefInput(pr.payment_reference || "");
                                setIsPaySlipModalOpen(true);
                              }}
                              className="text-xs gap-1 cursor-pointer"
                            >
                              <FileText className="size-3.5 text-emerald-600" /> Pay Slip
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={isPaySlipModalOpen} onOpenChange={setIsPaySlipModalOpen}>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader className="border-b pb-3">
                <DialogTitle className="flex items-center justify-between text-lg font-black text-slate-900">
                  <span>Salary Slip Preview</span>
                  <Badge variant="outline" className="font-mono">{selectedPaySlip?.payroll_month}</Badge>
                </DialogTitle>
                <DialogDescription>
                  Official Itemized Pay Slip for <span className="font-bold text-slate-900">{selectedPaySlip?.agent_name}</span>
                </DialogDescription>
              </DialogHeader>

              {selectedPaySlip && (
                <div className="space-y-4 py-2 font-mono text-sm">
                  <div className="space-y-1.5 p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Gross Earnings</p>
                    <div className="flex justify-between text-slate-700">
                      <span>Base Salary:</span>
                      <span className="font-bold">Rs. {selectedPaySlip.base_salary?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Overtime Pay ({selectedPaySlip.total_overtime_hours} hrs):</span>
                      <span className="font-bold text-emerald-700">+Rs. {selectedPaySlip.overtime_pay?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Sales Commission Earned:</span>
                      <span className="font-bold text-emerald-700">+Rs. {selectedPaySlip.commission_earnings?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-emerald-200 pt-1 text-slate-900 font-extrabold">
                      <span>Gross Total:</span>
                      <span>Rs. {selectedPaySlip.gross_salary?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-lg bg-rose-50/60 border border-rose-100">
                    <p className="text-xs font-bold text-rose-900 uppercase tracking-wider">Deductions</p>
                    <div className="flex justify-between text-slate-700">
                      <span>Absent Days ({selectedPaySlip.days_absent}d):</span>
                      <span className="text-rose-600">-Rs. {selectedPaySlip.absent_deductions?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Late Penalty ({selectedPaySlip.late_days}d):</span>
                      <span className="text-rose-600">-Rs. {selectedPaySlip.late_deductions?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-rose-200 pt-1 text-slate-900 font-extrabold">
                      <span>Total Deductions:</span>
                      <span className="text-rose-700">
                        -Rs. {(selectedPaySlip.late_deductions + selectedPaySlip.absent_deductions)?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Net Payable Amount</p>
                      <p className="text-2xl font-black text-emerald-400">Rs. {selectedPaySlip.net_payable_salary?.toLocaleString()}</p>
                    </div>
                    <Badge variant={selectedPaySlip.payment_status === "paid" ? "success" : "default"}>
                      {selectedPaySlip.payment_status?.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Bank Transfer / Check Reference</Label>
                    <Input
                      placeholder="e.g. TRX-982143"
                      value={paymentRefInput}
                      onChange={(e) => setPaymentRefInput(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-3">
                <Button variant="outline" onClick={() => setIsPaySlipModalOpen(false)}>
                  Close
                </Button>
                {selectedPaySlip?.payment_status !== "paid" && (
                  <Button
                    onClick={() => handleUpdatePayrollStatus(selectedPaySlip._id, "paid")}
                    className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold gap-2 cursor-pointer"
                  >
                    <CreditCard className="size-4" /> Disburse & Mark Paid
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
