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

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role_id?: { name: string; code: string };
  status: string;
}

const MODULE_DEFINITIONS = [
  { key: "products", label: "Products & SKUs Matrix" },
  { key: "routes", label: "Sales Routes & Waypoints" },
  { key: "territories", label: "Territories & Boundaries" },
  { key: "inventory", label: "Stock & Warehousing" },
  { key: "supply_chain", label: "Port Inbound & Bulk Repackaging" },
  { key: "distributors", label: "Distributors & Partners" },
  { key: "agents", label: "Field Agents & Fleet" },
  { key: "stores", label: "Retail Stores & Outlets" },
  { key: "orders", label: "Sales Orders & Approvals" },
  { key: "policies", label: "SOP & Field Policies" },
];

const ACTIONS = ["read", "write", "update", "delete"];

export function RolesClientView({
  initialRoles,
  initialUsers,
}: {
  initialRoles: RoleData[];
  initialUsers: UserData[];
}) {
  const [roles, setRoles] = useState<RoleData[]>(initialRoles);
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Role Modal state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({
    products: ["read", "write", "update", "delete"],
  });
  const [creatingRole, setCreatingRole] = useState(false);

  // User Modal state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

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
            <h1 className="text-2xl font-extrabold tracking-tight">Role-Based Access Control (RBAC) & Team Governance</h1>
          </div>
          <p className="text-sm text-slate-300">
            Define custom manager roles (e.g. Product Manager A, Route Manager B) and assign granular module permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Create Custom Role Dialog */}
          <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold shadow-xs">
                <Plus className="size-4" /> Create Custom Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Create Custom Manager Role</DialogTitle>
                <DialogDescription>
                  Configure granular module access (Read, Write, Update, Delete) for team members.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateRole} className="space-y-4 pt-2 overflow-y-auto pr-1 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role_name">Role Title *</Label>
                    <Input
                      id="role_name"
                      placeholder="e.g. Product Manager A"
                      value={roleName}
                      onChange={(e) => {
                        setRoleName(e.target.value);
                        if (!roleCode) {
                          setRoleCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"));
                        }
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role_code">Role System Code *</Label>
                    <Input
                      id="role_code"
                      placeholder="e.g. product_manager_a"
                      value={roleCode}
                      onChange={(e) => setRoleCode(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role_desc">Authority Scope / Description</Label>
                  <Input
                    id="role_desc"
                    placeholder="e.g. Full authority over product matrix, SKUs and inventory"
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                    Module Rights & Action Matrix
                  </Label>
                  <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-200">
                    {MODULE_DEFINITIONS.map((m) => {
                      const currentActions = selectedPermissions[m.key] || [];
                      return (
                        <div key={m.key} className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-slate-900 w-48">{m.label}</span>
                          <div className="flex items-center gap-4">
                            {ACTIONS.map((action) => {
                              const isChecked = currentActions.includes(action);
                              return (
                                <label key={action} className="flex items-center gap-1.5 cursor-pointer text-slate-700 capitalize">
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => toggleAction(m.key, action)}
                                  />
                                  <span>{action}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setRoleModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creatingRole} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    {creatingRole ? "Saving Role…" : "Create Role"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Onboard Team User Dialog */}
          <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 gap-1.5">
                <UserPlus className="size-4 text-emerald-400" /> Onboard Team Manager
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Onboard Team Manager Account</DialogTitle>
                <DialogDescription>
                  Create login credentials for a manager and assign them an RBAC role.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="user_name">Full Name *</Label>
                  <Input
                    id="user_name"
                    placeholder="e.g. Manager A"
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
                    placeholder="manager.a@company.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_phone">Mobile Phone</Label>
                  <Input
                    id="user_phone"
                    type="tel"
                    placeholder="+92 300 1234567"
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
                    placeholder="At least 6 characters"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    required
                  />
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

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setUserModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creatingUser} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    {creatingUser ? "Creating Account…" : "Onboard Manager"}
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
            <Users className="size-3.5 text-sky-600" /> Team Managers & Accounts ({users.length})
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
                              {m.module_name} ({m.actions.join(", ")})
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
                      <TableHead>Manager Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Assigned Role</TableHead>
                      <TableHead>Role Code</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u._id} className="hover:bg-slate-50">
                        <TableCell className="font-semibold text-slate-900">{u.name}</TableCell>
                        <TableCell className="text-xs text-slate-600">{u.email}</TableCell>
                        <TableCell className="font-bold text-xs text-emerald-700">
                          {u.role_id?.name || "System Admin"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {u.role_id?.code || "admin"}
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
