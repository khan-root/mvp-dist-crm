"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ShieldCheck,
  Zap,
  Lock,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Building2,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  Coins,
  Percent,
  Calculator,
  Gift,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";

interface GovernanceTier {
  tier: number;
  name: string;
  min_value: number;
  max_value: number;
  systemic_action: string;
  approval_sla_hours: number;
  authentication_required: "gps_50m" | "gps_signature" | "gps_otp_or_esign" | "dual_signoff_deposit";
}

interface CommissionRules {
  agent_commission_pct: number;
  agent_flat_bonus_rs: number;
  store_rebate_pct: number;
  store_cashback_flat_rs: number;
  min_order_value_eligible: number;
  max_order_value_eligible: number;
  applicable_scope: "all_products" | "order_value_range" | "specific_categories";
  applicable_category_name?: string;
}

interface PolicyData {
  _id?: string;
  name: string;
  description: string;
  industry_type: string;
  is_active: boolean;
  is_default: boolean;
  tiered_matrix: GovernanceTier[];
  commission_rules: CommissionRules;
  credit_guardrails: {
    hard_credit_freeze_days: number;
    exposure_ceiling_enabled: boolean;
    collection_linked_booking: boolean;
    max_discretionary_discount_pct: number;
  };
  antifraud_guardrails: {
    geofence_radius_meters: number;
    buyer_verification_threshold_rs: number;
    allow_geotag_update_request: boolean;
  };
  inventory_sync: {
    active_stock_reservation_mins: number;
    backorder_workflow_enabled: boolean;
  };
}

const DEFAULT_COMMISSION_RULES: CommissionRules = {
  agent_commission_pct: 3.0,
  agent_flat_bonus_rs: 150,
  store_rebate_pct: 2.0,
  store_cashback_flat_rs: 100,
  min_order_value_eligible: 5000,
  max_order_value_eligible: 100000,
  applicable_scope: "order_value_range",
  applicable_category_name: "All General Merchandise",
};

const INDUSTRY_PRESETS: Record<string, Partial<PolicyData>> = {
  universal: {
    name: "Universal SOP & Field Incentive Policy",
    description: "Standard Operating Procedure & Financial Commission Rules for Cross-Industry Distribution",
    industry_type: "universal",
    commission_rules: {
      agent_commission_pct: 3.0,
      agent_flat_bonus_rs: 100,
      store_rebate_pct: 2.0,
      store_cashback_flat_rs: 50,
      min_order_value_eligible: 5000,
      max_order_value_eligible: 100000,
      applicable_scope: "order_value_range",
    },
    tiered_matrix: [
      { tier: 1, name: "Tier 1: Routine", min_value: 0, max_value: 4999, systemic_action: "Auto-approved; routed directly to warehouse ERP for packing and delivery.", approval_sla_hours: 0, authentication_required: "gps_50m" },
      { tier: 2, name: "Tier 2: Intermediate", min_value: 5000, max_value: 9999, systemic_action: "Automated credit ceiling validation; soft payment terms check.", approval_sla_hours: 2, authentication_required: "gps_signature" },
      { tier: 3, name: "Tier 3: High-Value Baseline", min_value: 10000, max_value: 24999, systemic_action: "Mandatory Manager review queue; stock reservation lock; full credit audit.", approval_sla_hours: 4, authentication_required: "gps_otp_or_esign" },
      { tier: 4, name: "Tier 4: Enterprise Bulk", min_value: 25000, max_value: 999999, systemic_action: "Distributor Principal / Commercial Lead dual-signoff; verified credit clearance.", approval_sla_hours: 8, authentication_required: "dual_signoff_deposit" },
    ],
    credit_guardrails: { hard_credit_freeze_days: 30, exposure_ceiling_enabled: true, collection_linked_booking: true, max_discretionary_discount_pct: 5 },
    antifraud_guardrails: { geofence_radius_meters: 50, buyer_verification_threshold_rs: 10000, allow_geotag_update_request: true },
    inventory_sync: { active_stock_reservation_mins: 15, backorder_workflow_enabled: true },
  },
  fmcg: {
    name: "FMCG High-Velocity Commission & Rebate Policy",
    description: "Daily route booking incentives with agent volume bonuses and store cashback.",
    industry_type: "fmcg",
    commission_rules: {
      agent_commission_pct: 2.5,
      agent_flat_bonus_rs: 50,
      store_rebate_pct: 1.5,
      store_cashback_flat_rs: 25,
      min_order_value_eligible: 3000,
      max_order_value_eligible: 50000,
      applicable_scope: "order_value_range",
    },
    tiered_matrix: [
      { tier: 1, name: "Tier 1: Small Retail Refill", min_value: 0, max_value: 2999, systemic_action: "Instant auto-approval for delivery vans.", approval_sla_hours: 0, authentication_required: "gps_50m" },
      { tier: 2, name: "Tier 2: Supermarket Order", min_value: 3000, max_value: 7999, systemic_action: "Standard credit window verification.", approval_sla_hours: 1, authentication_required: "gps_signature" },
      { tier: 3, name: "Tier 3: Wholesale Case Booking", min_value: 8000, max_value: 19999, systemic_action: "Territory Sales Lead review queue.", approval_sla_hours: 3, authentication_required: "gps_otp_or_esign" },
      { tier: 4, name: "Tier 4: Distributor Hub Bulk", min_value: 20000, max_value: 999999, systemic_action: "Commercial Manager dual sign-off.", approval_sla_hours: 6, authentication_required: "dual_signoff_deposit" },
    ],
    credit_guardrails: { hard_credit_freeze_days: 14, exposure_ceiling_enabled: true, collection_linked_booking: true, max_discretionary_discount_pct: 3 },
    antifraud_guardrails: { geofence_radius_meters: 30, buyer_verification_threshold_rs: 5000, allow_geotag_update_request: true },
    inventory_sync: { active_stock_reservation_mins: 10, backorder_workflow_enabled: true },
  },
  pharma: {
    name: "Pharma Authorized Channel Incentive & Compliance Policy",
    description: "Strict regulatory compliance policy with licensed pharmacy rebates and rep commissions.",
    industry_type: "pharma",
    commission_rules: {
      agent_commission_pct: 4.0,
      agent_flat_bonus_rs: 250,
      store_rebate_pct: 3.0,
      store_cashback_flat_rs: 200,
      min_order_value_eligible: 10000,
      max_order_value_eligible: 200000,
      applicable_scope: "specific_categories",
      applicable_category_name: "Prescription Drugs & Medical",
    },
    tiered_matrix: [
      { tier: 1, name: "Tier 1: Pharmacy Counter Refill", min_value: 0, max_value: 4999, systemic_action: "License validation & auto-approval.", approval_sla_hours: 0, authentication_required: "gps_50m" },
      { tier: 2, name: "Tier 2: Hospital Retail Store", min_value: 5000, max_value: 14999, systemic_action: "Batch lock & credit clearance.", approval_sla_hours: 2, authentication_required: "gps_signature" },
      { tier: 3, name: "Tier 3: Institutional Bulk Procurement", min_value: 15000, max_value: 49999, systemic_action: "Medical Rep Manager verification.", approval_sla_hours: 4, authentication_required: "gps_otp_or_esign" },
      { tier: 4, name: "Tier 4: National Super-Stockist", min_value: 50000, max_value: 999999, systemic_action: "Compliance Officer & Principal signoff.", approval_sla_hours: 12, authentication_required: "dual_signoff_deposit" },
    ],
    credit_guardrails: { hard_credit_freeze_days: 45, exposure_ceiling_enabled: true, collection_linked_booking: true, max_discretionary_discount_pct: 2 },
    antifraud_guardrails: { geofence_radius_meters: 25, buyer_verification_threshold_rs: 15000, allow_geotag_update_request: false },
    inventory_sync: { active_stock_reservation_mins: 20, backorder_workflow_enabled: false },
  },
};

export default function FieldForcePoliciesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [activePolicy, setActivePolicy] = useState<PolicyData | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Simulator Test State
  const [testOrderAmount, setTestOrderAmount] = useState<number>(25000);

  // New Policy Authoring Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [newPolicyName, setNewPolicyName] = useState("");
  const [newPolicyDesc, setNewPolicyDesc] = useState("");
  const [newPolicyIndustry, setNewPolicyIndustry] = useState("universal");
  const [newPolicyIsDefault, setNewPolicyIsDefault] = useState(false);

  // Wizard Financial Commission Rules
  const [newAgentCommPct, setNewAgentCommPct] = useState("3.5");
  const [newAgentBonusRs, setNewAgentBonusRs] = useState("150");
  const [newStoreRebatePct, setNewStoreRebatePct] = useState("2.0");
  const [newStoreCashbackRs, setNewStoreCashbackRs] = useState("100");
  const [newMinOrderEligible, setNewMinOrderEligible] = useState("5000");
  const [newMaxOrderEligible, setNewMaxOrderEligible] = useState("100000");
  const [newApplicableScope, setNewApplicableScope] = useState<"all_products" | "order_value_range" | "specific_categories">("order_value_range");

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  async function fetchPolicies() {
    setLoading(true);
    try {
      const res = await fetch("/api/policies", { credentials: "include" });
      const d = await res.json();
      if (d.data && d.data.length > 0) {
        setPolicies(d.data);
        const defaultPol = d.data.find((p: PolicyData) => p.is_default) || d.data[0];
        // Ensure commission_rules fallback
        if (!defaultPol.commission_rules) {
          defaultPol.commission_rules = { ...DEFAULT_COMMISSION_RULES };
        }
        setActivePolicy(defaultPol);
      }
    } catch (e) {
      console.error("Fetch policies error:", e);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPolicy(policyId: string) {
    const selected = policies.find((p) => p._id === policyId);
    if (selected) {
      if (!selected.commission_rules) {
        selected.commission_rules = { ...DEFAULT_COMMISSION_RULES };
      }
      setActivePolicy(selected);
      setFeedback(null);
    }
  }

  async function handleCreatePolicy(e: React.FormEvent) {
    e.preventDefault();
    if (!newPolicyName.trim()) return;

    setCreating(true);
    setFeedback(null);
    try {
      const preset = INDUSTRY_PRESETS[newPolicyIndustry] || INDUSTRY_PRESETS.universal;
      const payload = {
        name: newPolicyName.trim(),
        description: newPolicyDesc.trim() || preset.description,
        industry_type: newPolicyIndustry,
        is_active: true,
        is_default: newPolicyIsDefault,
        tiered_matrix: preset.tiered_matrix ? JSON.parse(JSON.stringify(preset.tiered_matrix)) : [],
        commission_rules: {
          agent_commission_pct: Number(newAgentCommPct) || 3.0,
          agent_flat_bonus_rs: Number(newAgentBonusRs) || 0,
          store_rebate_pct: Number(newStoreRebatePct) || 2.0,
          store_cashback_flat_rs: Number(newStoreCashbackRs) || 0,
          min_order_value_eligible: Number(newMinOrderEligible) || 0,
          max_order_value_eligible: Number(newMaxOrderEligible) || 999999,
          applicable_scope: newApplicableScope,
        },
        credit_guardrails: { ...preset.credit_guardrails },
        antifraud_guardrails: { ...preset.antifraud_guardrails },
        inventory_sync: { ...preset.inventory_sync },
      };

      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: d.error || "Failed to create policy" });
        return;
      }

      setCreateModalOpen(false);
      setWizardStep(1);
      setNewPolicyName("");
      setNewPolicyDesc("");
      setFeedback({ type: "success", text: `Successfully created policy "${d.data.name}"!` });

      await fetchPolicies();
      setActivePolicy(d.data);
    } catch {
      setFeedback({ type: "error", text: "Network error creating policy" });
    } finally {
      setCreating(false);
    }
  }

  function handleCommissionRuleChange(field: keyof CommissionRules, value: any) {
    if (!activePolicy) return;
    const currentRules = activePolicy.commission_rules || { ...DEFAULT_COMMISSION_RULES };
    setActivePolicy({
      ...activePolicy,
      commission_rules: { ...currentRules, [field]: value },
    });
  }

  function handleTierChange(index: number, field: keyof GovernanceTier, value: any) {
    if (!activePolicy) return;
    const updatedTiers = [...activePolicy.tiered_matrix];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    setActivePolicy({ ...activePolicy, tiered_matrix: updatedTiers });
  }

  async function handleSavePolicy() {
    if (!activePolicy) return;
    setSaving(true);
    setFeedback(null);
    try {
      const url = activePolicy._id ? `/api/policies/${activePolicy._id}` : "/api/policies";
      const method = activePolicy._id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(activePolicy),
      });
      const d = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: d.error || "Failed to save policy configuration." });
        return;
      }
      setActivePolicy(d.data);
      setFeedback({ type: "success", text: "Governance policy updated & activated across field force!" });
      fetchPolicies();
    } catch (e: any) {
      setFeedback({ type: "error", text: e?.message || "Network error while saving policy." });
    } finally {
      setSaving(false);
    }
  }

  async function handleSetAsDefault() {
    if (!activePolicy || !activePolicy._id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/policies/${activePolicy._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_default: true }),
      });
      const d = await res.json();
      if (res.ok) {
        setActivePolicy({ ...activePolicy, is_default: true });
        setFeedback({ type: "success", text: `"${activePolicy.name}" is now set as the Primary Default SOP Policy!` });
        fetchPolicies();
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to set default policy" });
    } finally {
      setSaving(false);
    }
  }

  const [isDeletePolicyModalOpen, setIsDeletePolicyModalOpen] = useState(false);
  const [deletingPolicy, setDeletingPolicy] = useState(false);

  function onClickDeletePolicy() {
    if (!activePolicy || !activePolicy._id) return;
    if (activePolicy.is_default) {
      setFeedback({ type: "error", text: "Cannot delete the primary default policy." });
      return;
    }
    setIsDeletePolicyModalOpen(true);
  }

  async function confirmDeletePolicy() {
    if (!activePolicy || !activePolicy._id) return;
    setDeletingPolicy(true);

    try {
      const res = await fetch(`/api/policies/${activePolicy._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setIsDeletePolicyModalOpen(false);
        setFeedback({ type: "success", text: "Policy deleted successfully" });
        await fetchPolicies();
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to delete policy" });
    } finally {
      setDeletingPolicy(false);
    }
  }

  // Calculate live simulator values for active policy
  const rules = activePolicy?.commission_rules || DEFAULT_COMMISSION_RULES;
  const isEligible = testOrderAmount >= (rules.min_order_value_eligible || 0) && testOrderAmount <= (rules.max_order_value_eligible || 999999);
  const calculatedAgentComm = isEligible ? (testOrderAmount * (rules.agent_commission_pct || 0)) / 100 : 0;
  const calculatedAgentBonus = isEligible ? rules.agent_flat_bonus_rs || 0 : 0;
  const totalAgentPayout = calculatedAgentComm + calculatedAgentBonus;

  const calculatedStoreRebate = isEligible ? (testOrderAmount * (rules.store_rebate_pct || 0)) / 100 : 0;
  const calculatedStoreCashback = isEligible ? rules.store_cashback_flat_rs || 0 : 0;
  const totalStoreIncentive = calculatedStoreRebate + calculatedStoreCashback;

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="size-10 border-2 border-emerald-600 border-t-transparent animate-spin rounded-full mx-auto" />
        <p className="text-sm text-slate-500">Loading Policy Authoring & Incentive Studio…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      {/* Top Banner & Policy Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-md">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Coins className="size-6 text-emerald-400" />
            <h1 className="text-2xl font-extrabold tracking-tight">Policy Authoring & Incentive Studio</h1>
          </div>
          <p className="text-sm text-slate-300">
            Define item/price range rules, Agent Commissions (%), Store Owner Rebates, and Order Governance Tiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Policy Selector */}
          <Select value={activePolicy?._id || ""} onValueChange={handleSelectPolicy}>
            <SelectTrigger className="w-[240px] bg-slate-800 border-slate-700 text-white text-xs">
              <FileText className="size-3.5 text-emerald-400 mr-2" />
              <SelectValue placeholder="Select Policy" />
            </SelectTrigger>
            <SelectContent>
              {policies.map((p) => (
                <SelectItem key={p._id} value={p._id!}>
                  {p.name} {p.is_default ? "★ (Default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Structured Policy Creation Wizard Dialog */}
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold shadow-xs">
                <Plus className="size-4" /> Author New Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <div className="flex items-center justify-between pr-4">
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="size-5 text-emerald-600" /> Policy Authoring Wizard
                  </DialogTitle>
                  <Badge variant="outline" className="text-xs font-semibold">Step {wizardStep} of 3</Badge>
                </div>
                <DialogDescription>
                  Configure scope targets, item price ranges, agent commissions, and store owner incentives.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreatePolicy} className="space-y-4 pt-2">
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="policy_name">Policy Name *</Label>
                      <Input
                        id="policy_name"
                        placeholder="e.g. Q3 Bulk Order Incentive & High-Value SOP"
                        value={newPolicyName}
                        onChange={(e) => setNewPolicyName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="policy_desc">Scope Description</Label>
                      <Input
                        id="policy_desc"
                        placeholder="e.g. 3.5% Agent commission & 2% store cashback for orders Rs. 5,000 - Rs. 100,000"
                        value={newPolicyDesc}
                        onChange={(e) => setNewPolicyDesc(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Target Scope *</Label>
                        <Select value={newApplicableScope} onValueChange={(val: any) => setNewApplicableScope(val)}>
                          <SelectTrigger><SelectValue placeholder="Scope" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_products">All Products Catalog</SelectItem>
                            <SelectItem value="order_value_range">Order Price Range Target</SelectItem>
                            <SelectItem value="specific_categories">Specific Category Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Baseline Vertical *</Label>
                        <Select value={newPolicyIndustry} onValueChange={setNewPolicyIndustry}>
                          <SelectTrigger><SelectValue placeholder="Vertical" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="universal">Universal SOP</SelectItem>
                            <SelectItem value="fmcg">FMCG Goods & Grocery</SelectItem>
                            <SelectItem value="pharma">Pharmaceuticals & Medical</SelectItem>
                            <SelectItem value="electronics">Electronics & Appliances</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                      Configure Agent Commission & Store Owner Rebate Incentives
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="min_elig">Min Order Value (Rs.)</Label>
                        <Input
                          id="min_elig"
                          type="number"
                          value={newMinOrderEligible}
                          onChange={(e) => setNewMinOrderEligible(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max_elig">Max Order Value (Rs.)</Label>
                        <Input
                          id="max_elig"
                          type="number"
                          value={newMaxOrderEligible}
                          onChange={(e) => setNewMaxOrderEligible(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="agent_comm">Agent Commission (%)</Label>
                        <Input
                          id="agent_comm"
                          type="number"
                          step="0.1"
                          value={newAgentCommPct}
                          onChange={(e) => setNewAgentCommPct(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agent_bonus">Agent Flat Bonus (Rs.)</Label>
                        <Input
                          id="agent_bonus"
                          type="number"
                          value={newAgentBonusRs}
                          onChange={(e) => setNewAgentBonusRs(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="store_rebate">Store Owner Rebate (%)</Label>
                        <Input
                          id="store_rebate"
                          type="number"
                          step="0.1"
                          value={newStoreRebatePct}
                          onChange={(e) => setNewStoreRebatePct(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="store_cashback">Store Flat Cashback (Rs.)</Label>
                        <Input
                          id="store_cashback"
                          type="number"
                          value={newStoreCashbackRs}
                          onChange={(e) => setNewStoreCashbackRs(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 space-y-1 text-xs">
                      <div className="font-bold text-slate-900">Summary Review:</div>
                      <div>Policy Name: <span className="font-semibold">{newPolicyName || "Custom Policy"}</span></div>
                      <div>Price Range: <span className="font-semibold">Rs. {newMinOrderEligible} - Rs. {newMaxOrderEligible}</span></div>
                      <div>Agent Payout: <span className="font-semibold text-emerald-600">{newAgentCommPct}% Commission + Rs. {newAgentBonusRs} Bonus</span></div>
                      <div>Store Incentive: <span className="font-semibold text-sky-600">{newStoreRebatePct}% Rebate + Rs. {newStoreCashbackRs} Cashback</span></div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="is_default_wiz"
                        checked={newPolicyIsDefault}
                        onCheckedChange={(checked) => setNewPolicyIsDefault(!!checked)}
                      />
                      <Label htmlFor="is_default_wiz" className="text-xs cursor-pointer font-medium">
                        Set as Primary Default Organization Policy
                      </Label>
                    </div>
                  </div>
                )}

                <DialogFooter className="pt-4 flex justify-between">
                  {wizardStep > 1 ? (
                    <Button type="button" variant="outline" onClick={() => setWizardStep((s) => (s - 1) as any)}>
                      Back
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                      Cancel
                    </Button>
                  )}

                  {wizardStep < 3 ? (
                    <Button type="button" onClick={() => setWizardStep((s) => (s + 1) as any)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                      Next Step →
                    </Button>
                  ) : (
                    <Button type="submit" disabled={creating} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                      {creating ? "Creating Policy…" : "Publish & Activate Policy"}
                    </Button>
                  )}
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleSavePolicy}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-semibold shadow-xs"
          >
            {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
            <span>Save & Activate SOP</span>
          </Button>

          {activePolicy && !activePolicy.is_default && (
            <Button
              onClick={onClickDeletePolicy}
              variant="outline"
              size="icon"
              className="border-rose-900/50 bg-rose-950/20 text-rose-400 hover:bg-rose-900/40"
              title="Delete Policy"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 className="size-4 text-emerald-600" /> : <AlertTriangle className="size-4 text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setFeedback(null)} className="h-6 text-xs">Dismiss</Button>
        </div>
      )}

      {activePolicy && (
        <div className="space-y-6">
          {/* Policy Overview Meta Card */}
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{activePolicy.name}</h2>
                    {activePolicy.is_default ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs">
                        Primary Default Policy
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSetAsDefault}
                        className="h-6 text-[11px] text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                      >
                        Set as Default
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{activePolicy.description}</p>
                </div>

                <div className="flex items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <Coins className="size-4 text-emerald-600" />
                  <span className="text-slate-600">Eligible Price Range:</span>
                  <span className="font-bold font-mono text-slate-900">
                    Rs. {(rules.min_order_value_eligible || 0).toLocaleString()} - Rs. {(rules.max_order_value_eligible || 999999).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Tabs */}
          <Tabs defaultValue="incentives" className="space-y-6">
            <TabsList className="bg-slate-100 p-1 border border-slate-200">
              <TabsTrigger value="incentives" className="gap-2 text-xs font-semibold">
                <Coins className="size-3.5 text-emerald-600" /> Agent & Store Commissions / Incentives
              </TabsTrigger>
              <TabsTrigger value="tiered_matrix" className="gap-2 text-xs font-semibold">
                <Zap className="size-3.5 text-slate-700" /> Tiered Governance Matrix
              </TabsTrigger>
              <TabsTrigger value="credit_controls" className="gap-2 text-xs font-semibold">
                <DollarSign className="size-3.5 text-sky-600" /> Credit Risk & Overdue Guardrails
              </TabsTrigger>
              <TabsTrigger value="antifraud" className="gap-2 text-xs font-semibold">
                <Lock className="size-3.5 text-rose-600" /> Anti-Fraud & GPS Geofence
              </TabsTrigger>
              <TabsTrigger value="inventory_sync" className="gap-2 text-xs font-semibold">
                <Clock className="size-3.5 text-amber-600" /> Inventory & Reservation Lock
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: FINANCIAL INCENTIVES & COMMISSIONS */}
            <TabsContent value="incentives" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Commission Rules Form */}
                <Card className="lg:col-span-2 border-slate-200 shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-900">Incentive & Commission Rules Configuration</CardTitle>
                    <CardDescription>
                      System automatically calculates agent commission and store owner cashback when orders meet policy scope.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Price Range Eligibility */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Gift className="size-4 text-emerald-600" /> 1. Order Eligibility & Scope Target
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Policy Target Scope</Label>
                          <Select
                            value={rules.applicable_scope || "all_products"}
                            onValueChange={(val: any) => handleCommissionRuleChange("applicable_scope", val)}
                          >
                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all_products">All Catalog Products</SelectItem>
                              <SelectItem value="order_value_range">Order Value Range Target</SelectItem>
                              <SelectItem value="specific_categories">Specific Category Target</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="min_val_rule">Min Order Price (Rs.)</Label>
                          <Input
                            id="min_val_rule"
                            type="number"
                            value={rules.min_order_value_eligible ?? 0}
                            onChange={(e) => handleCommissionRuleChange("min_order_value_eligible", Number(e.target.value))}
                            className="bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max_val_rule">Max Order Price (Rs.)</Label>
                          <Input
                            id="max_val_rule"
                            type="number"
                            value={rules.max_order_value_eligible ?? 999999}
                            onChange={(e) => handleCommissionRuleChange("max_order_value_eligible", Number(e.target.value))}
                            className="bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Agent Commission Rules */}
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                        <Percent className="size-4 text-emerald-600" /> 2. Field Agent Sales Commission & Payout
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="agent_comm_pct" className="font-bold text-slate-900">
                            Agent Sales Commission (%)
                          </Label>
                          <Input
                            id="agent_comm_pct"
                            type="number"
                            step="0.1"
                            value={rules.agent_commission_pct ?? 0}
                            onChange={(e) => handleCommissionRuleChange("agent_commission_pct", Number(e.target.value))}
                            className="bg-white font-mono font-bold"
                          />
                          <p className="text-[11px] text-slate-500">Credited to agent upon order invoice clearance.</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="agent_flat_bonus" className="font-bold text-slate-900">
                            Agent Flat Booking Bonus (Rs.)
                          </Label>
                          <Input
                            id="agent_flat_bonus"
                            type="number"
                            value={rules.agent_flat_bonus_rs ?? 0}
                            onChange={(e) => handleCommissionRuleChange("agent_flat_bonus_rs", Number(e.target.value))}
                            className="bg-white font-mono font-bold"
                          />
                          <p className="text-[11px] text-slate-500">Fixed cash bonus for booking qualifying items/orders.</p>
                        </div>
                      </div>
                    </div>

                    {/* Store Owner Rebate & Cashback */}
                    <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200/60 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                        <Coins className="size-4 text-sky-600" /> 3. Store Owner Cashback & Purchase Rebate
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="store_rebate_pct" className="font-bold text-slate-900">
                            Store Owner Rebate (%)
                          </Label>
                          <Input
                            id="store_rebate_pct"
                            type="number"
                            step="0.1"
                            value={rules.store_rebate_pct ?? 0}
                            onChange={(e) => handleCommissionRuleChange("store_rebate_pct", Number(e.target.value))}
                            className="bg-white font-mono font-bold"
                          />
                          <p className="text-[11px] text-slate-500">Credited to store account balance as purchase discount.</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="store_cashback_flat" className="font-bold text-slate-900">
                            Store Flat Cashback Credit (Rs.)
                          </Label>
                          <Input
                            id="store_cashback_flat"
                            type="number"
                            value={rules.store_cashback_flat_rs ?? 0}
                            onChange={(e) => handleCommissionRuleChange("store_cashback_flat_rs", Number(e.target.value))}
                            className="bg-white font-mono font-bold"
                          />
                          <p className="text-[11px] text-slate-500">Direct wallet credit applied to shopkeeper's account.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Right Column: Live Interactive Commission Calculator */}
                <Card className="border-emerald-200 bg-gradient-to-br from-emerald-950/5 to-white shadow-sm">
                  <CardHeader className="border-b pb-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="size-5 text-emerald-600" />
                      <CardTitle className="text-base font-bold text-slate-900">Live Incentive Simulator</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Test live calculations for any order total under this policy.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="sim_order" className="font-bold text-xs uppercase tracking-wider text-slate-700">
                        Test Order Value (Rs.)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rs.</span>
                        <Input
                          id="sim_order"
                          type="number"
                          value={testOrderAmount}
                          onChange={(e) => setTestOrderAmount(Number(e.target.value) || 0)}
                          className="pl-10 font-mono text-base font-bold bg-white"
                        />
                      </div>
                    </div>

                    {!isEligible ? (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <AlertTriangle className="size-4 text-amber-600" /> Order Not Eligible
                        </div>
                        <p>Order value Rs. {testOrderAmount.toLocaleString()} falls outside policy range (Rs. {(rules.min_order_value_eligible || 0).toLocaleString()} - Rs. {(rules.max_order_value_eligible || 999999).toLocaleString()}).</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Agent Calculation Box */}
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                            Agent Sales Payout
                          </span>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold text-emerald-700 font-mono">
                              Rs. {totalAgentPayout.toLocaleString()}
                            </span>
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800 text-[10px]">
                              {rules.agent_commission_pct}% + Bonus
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-emerald-500/20">
                            <div className="flex justify-between">
                              <span>Commission ({rules.agent_commission_pct}%):</span>
                              <span className="font-mono font-semibold">Rs. {calculatedAgentComm.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Flat Bonus:</span>
                              <span className="font-mono font-semibold">Rs. {calculatedAgentBonus.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Store Calculation Box */}
                        <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-sky-800 block">
                            Store Owner Cashback & Incentive
                          </span>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold text-sky-700 font-mono">
                              Rs. {totalStoreIncentive.toLocaleString()}
                            </span>
                            <Badge variant="outline" className="bg-sky-100 text-sky-800 text-[10px]">
                              {rules.store_rebate_pct}% + Cashback
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-sky-500/20">
                            <div className="flex justify-between">
                              <span>Rebate Discount ({rules.store_rebate_pct}%):</span>
                              <span className="font-mono font-semibold">Rs. {calculatedStoreRebate.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Flat Wallet Cashback:</span>
                              <span className="font-mono font-semibold">Rs. {calculatedStoreCashback.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 2: TIERED GOVERNANCE MATRIX */}
            <TabsContent value="tiered_matrix" className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">Tiered Order Governance Matrix</CardTitle>
                      <CardDescription>
                        System automatically categorizes each agent booking into operational tiers based on order value (Rs).
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {activePolicy.tiered_matrix?.length || 0} Governance Tiers Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Tier</th>
                          <th className="p-3">Order Value Range (Rs)</th>
                          <th className="p-3">System Enforcement Action</th>
                          <th className="p-3">SLA Hours</th>
                          <th className="p-3">Authentication Protocol</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {activePolicy.tiered_matrix?.map((t, idx) => (
                          <tr key={t.tier} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">
                              <Input
                                value={t.name}
                                onChange={(e) => handleTierChange(idx, "name", e.target.value)}
                                className="h-7 text-xs font-semibold w-40"
                              />
                            </td>
                            <td className="p-3 font-mono">
                              <div className="flex items-center gap-1.5">
                                <span>Rs.</span>
                                <Input
                                  type="number"
                                  value={t.min_value}
                                  onChange={(e) => handleTierChange(idx, "min_value", Number(e.target.value))}
                                  className="h-7 text-xs w-24"
                                />
                                <span>to</span>
                                <Input
                                  type="number"
                                  value={t.max_value}
                                  onChange={(e) => handleTierChange(idx, "max_value", Number(e.target.value))}
                                  className="h-7 text-xs w-24"
                                />
                              </div>
                            </td>
                            <td className="p-3 text-slate-700">
                              <Input
                                value={t.systemic_action}
                                onChange={(e) => handleTierChange(idx, "systemic_action", e.target.value)}
                                className="h-7 text-xs w-full"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                value={t.approval_sla_hours}
                                onChange={(e) => handleTierChange(idx, "approval_sla_hours", Number(e.target.value))}
                                className="h-7 text-xs w-16"
                              />
                            </td>
                            <td className="p-3">
                              <Select
                                value={t.authentication_required}
                                onValueChange={(val) => handleTierChange(idx, "authentication_required", val)}
                              >
                                <SelectTrigger className="h-7 text-xs w-44"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="gps_50m">GPS 50m Geofence Only</SelectItem>
                                  <SelectItem value="gps_signature">GPS + Buyer Digital Signature</SelectItem>
                                  <SelectItem value="gps_otp_or_esign">GPS + Buyer Mobile OTP / e-Sign</SelectItem>
                                  <SelectItem value="dual_signoff_deposit">Dual Sign-Off + Deposit Ref</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: CREDIT CONTROLS */}
            <TabsContent value="credit_controls" className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Credit Risk & Exposure Safeguards</CardTitle>
                  <CardDescription>
                    Automated locks to prevent overdue debt accumulation across retail accounts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <Label htmlFor="freeze_days" className="font-bold text-slate-900">
                        Hard Credit Freeze Threshold (Days Overdue)
                      </Label>
                      <Input
                        id="freeze_days"
                        type="number"
                        value={activePolicy.credit_guardrails?.hard_credit_freeze_days ?? 30}
                        onChange={(e) =>
                          setActivePolicy({
                            ...activePolicy,
                            credit_guardrails: {
                              ...activePolicy.credit_guardrails,
                              hard_credit_freeze_days: Number(e.target.value),
                            },
                          })
                        }
                        className="bg-white"
                      />
                      <p className="text-xs text-slate-500">
                        If an outlet has outstanding invoices older than this number of days, the agent app will block new bookings.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <Label htmlFor="max_discount" className="font-bold text-slate-900">
                        Max Discretionary Agent Discount (%)
                      </Label>
                      <Input
                        id="max_discount"
                        type="number"
                        step="0.5"
                        value={activePolicy.credit_guardrails?.max_discretionary_discount_pct ?? 5}
                        onChange={(e) =>
                          setActivePolicy({
                            ...activePolicy,
                            credit_guardrails: {
                              ...activePolicy.credit_guardrails,
                              max_discretionary_discount_pct: Number(e.target.value),
                            },
                          })
                        }
                        className="bg-white"
                      />
                      <p className="text-xs text-slate-500">
                        Maximum percentage discount a field agent can apply without requiring supervisor approval.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: ANTIFRAUD */}
            <TabsContent value="antifraud" className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Anti-Fraud & GPS Geofencing Enforcement</CardTitle>
                  <CardDescription>
                    Ensure agent presence at outlet coordinates during visit check-in and order placement.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <Label htmlFor="geofence_meters" className="font-bold text-slate-900">
                        Geofence Radius (Meters)
                      </Label>
                      <Input
                        id="geofence_meters"
                        type="number"
                        value={activePolicy.antifraud_guardrails?.geofence_radius_meters ?? 50}
                        onChange={(e) =>
                          setActivePolicy({
                            ...activePolicy,
                            antifraud_guardrails: {
                              ...activePolicy.antifraud_guardrails,
                              geofence_radius_meters: Number(e.target.value),
                            },
                          })
                        }
                        className="bg-white"
                      />
                      <p className="text-xs text-slate-500">
                        Agent mobile device must be within this physical distance of the shop's geotag to check in.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <Label htmlFor="verification_threshold" className="font-bold text-slate-900">
                        High-Value Verification Threshold (Rs.)
                      </Label>
                      <Input
                        id="verification_threshold"
                        type="number"
                        value={activePolicy.antifraud_guardrails?.buyer_verification_threshold_rs ?? 10000}
                        onChange={(e) =>
                          setActivePolicy({
                            ...activePolicy,
                            antifraud_guardrails: {
                              ...activePolicy.antifraud_guardrails,
                              buyer_verification_threshold_rs: Number(e.target.value),
                            },
                          })
                        }
                        className="bg-white"
                      />
                      <p className="text-xs text-slate-500">
                        Orders above this amount require OTP or buyer signature verification.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: INVENTORY SYNC */}
            <TabsContent value="inventory_sync" className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Inventory & Stock Reservation Sync</CardTitle>
                  <CardDescription>
                    Prevent stockout disputes with real-time warehouse inventory reservation locks.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 max-w-md">
                    <Label htmlFor="reservation_mins" className="font-bold text-slate-900">
                      Stock Reservation Lock Duration (Minutes)
                    </Label>
                    <Input
                      id="reservation_mins"
                      type="number"
                      value={activePolicy.inventory_sync?.active_stock_reservation_mins ?? 15}
                      onChange={(e) =>
                        setActivePolicy({
                          ...activePolicy,
                          inventory_sync: {
                            ...activePolicy.inventory_sync,
                            active_stock_reservation_mins: Number(e.target.value),
                          },
                        })
                      }
                      className="bg-white"
                    />
                    <p className="text-xs text-slate-500">
                      Duration for which inventory units are locked when an agent initiates a draft order.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Confirm Delete Policy Modal */}
      <ConfirmDeleteModal
        open={isDeletePolicyModalOpen}
        onOpenChange={setIsDeletePolicyModalOpen}
        title="Delete Governance SOP Policy"
        description="Are you sure you want to delete this SOP policy? Operations governed by this policy will revert to the default primary policy."
        itemName={activePolicy?.name}
        confirmText="Delete Policy"
        onConfirm={confirmDeletePolicy}
        loading={deletingPolicy}
      />
    </div>
  );
}
