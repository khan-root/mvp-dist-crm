"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShieldCheck,
  Users,
  Plus,
  Lock,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Key,
  Shield,
  Building2,
  Ship,
  Boxes,
  Truck,
} from "lucide-react";
import { PermissionGuard } from "@/components/permission-guard";

interface ModulePermission {
  module_name: string;
  actions: string[];
}

interface RoleData {
  _id: string;
  name: string;
  code: string;
  description?: string;
  is_default?: boolean;
  permissions?: {
    modules?: ModulePermission[];
  };
}

interface WarehouseData {
  _id: string;
  warehouse_name: string;
  warehouse_code: string;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role_id?: { name: string; code: string };
  assigned_facility?: string;
  assigned_warehouse_id?: { _id: string; warehouse_name: string; warehouse_code: string };
  status: string;
}

const MODULE_DEFINITIONS = [
  { key: "supply_chain", label: "Inbound Cargo Receipts & Transport Bilties" },
  { key: "inventory", label: "Stock Levels & Warehouse Management" },
  { key: "repackaging", label: "Bulk-to-Packet Repackaging Operations" },
  { key: "dispatch", label: "Outbound Buyer & Market Sales Dispatches" },
  { key: "products", label: "Products & SKUs Catalog" },
  { key: "routes", label: "Sales Routes & Waypoints" },
  { key: "territories", label: "Territories & Geographical Zones" },
  { key: "distributors", label: "Distributors & Partners" },
  { key: "agents", label: "Field Force Agents & Telematics" },
  { key: "stores", label: "Retail Stores & Outlets" },
  { key: "orders", label: "Sales Orders & Approvals" },
  { key: "roles", label: "RBAC Governance & Team Accounts" },
];

const ACTIONS = ["read", "write", "update", "delete"];

export function RolesClientView({
  initialRoles,
  initialUsers,
  initialWarehouses = [],
}: {
  initialRoles: RoleData[];
  initialUsers: UserData[];
  initialWarehouses?: WarehouseData[];
}) {
  const [roles, setRoles] = useState<RoleData[]>(initialRoles);
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [warehouses] = useState<WarehouseData[]>(initialWarehouses);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Role Modal state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({
    supply_chain: ["read", "write", "update"],
    inventory: ["read", "write"],
  });
  const [creatingRole, setCreatingRole] = useState(false);

  // User Modal state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [userWarehouseId, setUserWarehouseId] = useState("all");
  const [creatingUser, setCreatingUser] = useState(false);

  function applyRolePreset(preset: "receiving_officer" | "warehouse_manager" | "supply_admin") {
    if (preset === "receiving_officer") {
      setRoleName("Logistics & Receiving Officer");
      setRoleCode("receiving_officer");
      setRoleDesc("Manages inbound freight shipments, supplier deliveries, and transport bilties.");
      setSelectedPermissions({
        supply_chain: ["read", "write", "update"],
        inventory: ["read"],
      });
    } else if (preset === "warehouse_manager") {
      setRoleName("Warehouse Manager");
      setRoleCode("warehouse_manager");
      setRoleDesc("Manages inventory, repackaging orders, stock transfers, and outbound dispatches for assigned facility.");
      setSelectedPermissions({
        inventory: ["read", "write", "update"],
        repackaging: ["read", "write", "update"],
        dispatch: ["read", "write", "update"],
        supply_chain: ["read"],
      });
    } else if (preset === "supply_admin") {
      setRoleName("Supply Chain Director");
      setRoleCode("supply_chain_admin");
      setRoleDesc("Full authority over global supply chain, bilties, all warehouses, repackaging, and outbound dispatches.");
      const allPerms: Record<string, string[]> = {};
      MODULE_DEFINITIONS.forEach((m) => {
        allPerms[m.key] = ["read", "write", "update", "delete"];
      });
      setSelectedPermissions(allPerms);
    }
  }

  function toggleAction(moduleKey: string, action: string) {
    setSelectedPermissions((prev) => {
      const current = prev[moduleKey] || [];
      const updated = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      return { ...prev, [moduleKey]: updated };
    });
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!roleName.trim()) return;

    setCreatingRole(true);
    setFeedback(null);

    const modules = Object.entries(selectedPermissions)
      .filter(([_, actions]) => actions.length > 0)
      .map(([module_name, actions]) => ({ module_name, actions }));

    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: roleName.trim(),
          code: roleCode.trim() || roleName.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
          description: roleDesc.trim(),
          permissions: { modules },
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: d.error || "Failed to create role" });
        return;
      }

      setRoleModalOpen(false);
      setRoleName("");
      setRoleCode("");
      setRoleDesc("");
      setFeedback({ type: "success", text: `Role "${d.data.name}" created successfully!` });

      // Refresh roles
      const refRes = await fetch("/api/roles", { credentials: "include" });
      const refData = await refRes.json();
      if (refData.data) setRoles(refData.data);
    } catch {
      setFeedback({ type: "error", text: "Network error creating role" });
    } finally {
      setCreatingRole(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim() || !selectedRoleId) return;

    setCreatingUser(true);
    setFeedback(null);

    const selectedWh = warehouses.find((w) => w._id === userWarehouseId);
    const assignedFacilityName = userWarehouseId === "all" || !selectedWh
      ? "All Warehouses & Facilities (Global Scope)"
      : selectedWh.warehouse_name;

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: userName.trim(),
          email: userEmail.trim(),
          phone: userPhone.trim() || undefined,
          password: userPassword || "ManagerPassword123",
          role_id: selectedRoleId,
          assigned_facility: assignedFacilityName,
          assigned_warehouse_id: userWarehouseId !== "all" ? userWarehouseId : undefined,
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: d.error || "Failed to onboard manager account" });
        return;
      }

      setUserModalOpen(false);
      setUserName("");
      setUserEmail("");
      setUserPhone("");
      setUserPassword("");
      setUserWarehouseId("all");
      setFeedback({ type: "success", text: `Manager user "${d.data.name}" onboarded successfully!` });

      // Refresh users
      const refRes = await fetch("/api/users", { credentials: "include" });
      const refData = await refRes.json();
      if (refData.data) setUsers(refData.data);
    } catch {
      setFeedback({ type: "error", text: "Network error onboarding manager" });
    } finally {
      setCreatingUser(false);
    }
  }

  return (
    <PermissionGuard module="roles">
      <div className="space-y-8 w-full">
        {/* Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-md">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-6 text-emerald-400" />
              <h1 className="text-2xl font-extrabold tracking-tight">Role-Based Access Control (RBAC) & Facility Scoping</h1>
            </div>
            <p className="text-sm text-slate-300">
              Define custom supply chain roles (Receiving Officers, Warehouse Managers) and assign granular facility/warehouse access scopes to employee accounts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Create Custom Role Dialog */}
            <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 font-semibold">
                  <Plus className="size-4" /> Create Custom Role
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    Create Custom RBAC Role
                  </DialogTitle>
                  <DialogDescription>
                    Configure module permissions for supply chain, receiving operations, and warehouse management.
                  </DialogDescription>
                </DialogHeader>

                <div className="bg-slate-100 p-3 rounded-lg border flex flex-wrap items-center justify-between gap-2 my-2">
                  <span className="text-xs font-bold text-slate-700">Quick Role Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <Button type="button" variant="outline" size="sm" onClick={() => applyRolePreset("receiving_officer")} className="text-xs bg-white">
                      <Truck className="w-3.5 h-3.5 mr-1 text-blue-600" /> Receiving Officer
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => applyRolePreset("warehouse_manager")} className="text-xs bg-white">
                      <Boxes className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Warehouse Manager
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => applyRolePreset("supply_admin")} className="text-xs bg-white">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-600" /> Supply Director
                    </Button>
                  </div>
                </div>

                <form onSubmit={handleCreateRole} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role_name">Role Title *</Label>
                      <Input
                        id="role_name"
                        placeholder="e.g. Warehouse Manager - Multan"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role_code">Role System Code *</Label>
                      <Input
                        id="role_code"
                        placeholder="e.g. warehouse_manager_multan"
                        value={roleCode}
                        onChange={(e) => setRoleCode(e.target.value)}
                        required
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role_desc">Role Description</Label>
                    <Input
                      id="role_desc"
                      placeholder="e.g. Full authority over inventory, repackaging, and outbound dispatches at assigned facility."
                      value={roleDesc}
                      onChange={(e) => setRoleDesc(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="font-bold text-sm">Module Action Permissions Matrix</Label>
                    <div className="border rounded-xl divide-y bg-slate-50/50 overflow-hidden">
                      {MODULE_DEFINITIONS.map((m) => {
                        const currentActions = selectedPermissions[m.key] || [];
                        return (
                          <div key={m.key} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-100/50 transition-colors">
                            <span className="text-xs font-semibold text-slate-800">{m.label}</span>
                            <div className="flex items-center gap-4">
                              {ACTIONS.map((act) => {
                                const checked = currentActions.includes(act);
                                return (
                                  <label key={act} className="flex items-center gap-1.5 text-xs text-slate-600 capitalize cursor-pointer">
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={() => toggleAction(m.key, act)}
                                    />
                                    {act}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setRoleModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creatingRole} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                      {creatingRole ? "Creating Role…" : "Save Custom Role"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Onboard Team User Dialog */}
            <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 gap-1.5">
                  <UserPlus className="size-4 text-emerald-400" /> Onboard Manager Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 font-bold text-xl">
                    <UserPlus className="w-5 h-5 text-emerald-600" />
                    Onboard Team Manager Account
                  </DialogTitle>
                  <DialogDescription>
                    Create employee login credentials, select an RBAC role, and scope their account to a specific warehouse or port facility.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="user_name">Full Name *</Label>
                    <Input
                      id="user_name"
                      placeholder="e.g. Muhammad Hassan"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user_email">Official Email *</Label>
                    <Input
                      id="user_email"
                      type="email"
                      placeholder="hassan.warehouse@company.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="user_phone">Mobile Phone</Label>
                      <Input
                        id="user_phone"
                        type="tel"
                        placeholder="0300 1234567"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user_password">Login Password *</Label>
                      <Input
                        id="user_password"
                        type="password"
                        minLength={6}
                        placeholder="Min 6 chars"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Assigned Role & Authority *</Label>
                    <Select value={selectedRoleId} onValueChange={setSelectedRoleId} required>
                      <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r._id} value={r._id}>
                            {r.name} ({r.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 border-t pt-3">
                    <Label className="font-bold text-xs flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      Assigned Facility / Warehouse Scope *
                    </Label>
                    <Select value={userWarehouseId} onValueChange={setUserWarehouseId} required>
                      <SelectTrigger><SelectValue placeholder="Select Facility Scope" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Facilities & Ports (Global Scope)</SelectItem>
                        {warehouses.map((w) => (
                          <SelectItem key={w._id} value={w._id}>
                            {w.warehouse_name} ({w.warehouse_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Restricts this user's view, inventory dispatches, and bilties strictly to the selected warehouse hub.
                    </p>
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setUserModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creatingUser} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                      {creatingUser ? "Creating Account…" : "Onboard Employee Account"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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

        {/* Main Tabs (Roles Matrix vs Team Users) */}
        <Tabs defaultValue="roles" className="w-full space-y-4">
          <TabsList className="bg-slate-100 p-1 border border-slate-200">
            <TabsTrigger value="roles" className="gap-2 text-xs font-semibold">
              <Shield className="size-3.5 text-emerald-600" /> Defined Roles ({roles.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 text-xs font-semibold">
              <Users className="size-3.5 text-sky-600" /> Employee Accounts & Scopes ({users.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: ROLES & PERMISSIONS MATRIX */}
          <TabsContent value="roles" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((r) => {
                const modulesList = r.permissions?.modules || [];
                return (
                  <Card key={r._id} className="border-slate-200 shadow-xs flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold text-slate-900">{r.name}</CardTitle>
                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-50">
                          {r.code}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        {r.description || "Custom role with specific module authority."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs pt-0">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                          Authorized Modules ({modulesList.length})
                        </span>
                        {modulesList.length === 0 ? (
                          <p className="text-slate-500">No permissions configured.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {modulesList.map((m) => (
                              <Badge key={m.module_name} variant="secondary" className="text-[10px] capitalize">
                                {m.module_name.replace("_", " ")} ({m.actions.join(", ")})
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 2: TEAM MANAGERS & USERS */}
          <TabsContent value="users" className="space-y-4">
            <Card className="border-slate-200 shadow-xs">
              <CardContent className="p-0">
                {users.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No manager accounts onboarded yet.</div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>Email & Phone</TableHead>
                        <TableHead>Assigned Role</TableHead>
                        <TableHead>Assigned Warehouse Facility Scope</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u._id} className="hover:bg-slate-50">
                          <TableCell className="font-semibold text-slate-900">{u.name}</TableCell>
                          <TableCell className="text-xs text-slate-600">
                            <div>{u.email}</div>
                            {u.phone && <div className="text-[11px] text-muted-foreground font-mono">{u.phone}</div>}
                          </TableCell>
                          <TableCell className="font-bold text-xs text-emerald-700">
                            {u.role_id?.name || "System Admin"}
                            <div className="font-mono text-[10px] text-slate-500 font-normal">{u.role_id?.code || "admin"}</div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 font-medium">
                              <Building2 className="w-3 h-3 mr-1 text-blue-600" />
                              {u.assigned_warehouse_id?.warehouse_name || u.assigned_facility || "All Facilities (Global)"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs capitalize">
                              {u.status || "active"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}
