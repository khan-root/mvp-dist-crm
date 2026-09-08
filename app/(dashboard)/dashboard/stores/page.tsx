import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { AssignAgentDropdown } from "@/components/assign-agent-dropdown";
import { dbConnect } from "@/lib/db";
import { Store, Agent } from "@/lib/models";
import { getCurrentUser } from "@/lib/user";

async function getStoresData() {
  await dbConnect();
  const user = await getCurrentUser();
  const tenantId = user?.tenant_id;
  if (!tenantId) return { list: [], agents: [] };

  const [stores, agents] = await Promise.all([
    Store.find({ tenant_id: tenantId, is_active: true })
      .sort({ created_at: -1 })
      .populate("assigned_agent_id", "agent_code first_name last_name personal_info")
      .lean(),
    Agent.find({ tenant_id: tenantId, is_active: true })
      .sort({ first_name: 1 })
      .lean(),
  ]);

  return {
    list: (stores || []).map((s: any) => ({
      _id: s._id.toString(),
      store_code: s.store_code,
      store_name: s.store_name,
      store_type: s.store_type,
      owner_info: s.owner_info,
      address: s.address,
      assigned_agent_id: s.assigned_agent_id
        ? {
            _id: s.assigned_agent_id._id.toString(),
            agent_code: s.assigned_agent_id.agent_code,
            first_name: s.assigned_agent_id.first_name,
            last_name: s.assigned_agent_id.last_name,
          }
        : null,
    })),
    agents: (agents || []).map((a: any) => ({
      _id: a._id.toString(),
      agent_code: a.agent_code,
      first_name: a.first_name,
      last_name: a.last_name,
    })),
  };
}

export default async function StoresPage() {
  const { list, agents } = await getStoresData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stores</h1>
        <CardDescription>Retail stores — assign agents for orders and delivery</CardDescription>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All stores</CardTitle>
          <Button asChild size="sm">
            <Link href="/dashboard/stores/new">
              <Plus className="size-4" />
              Add store
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No stores yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Store name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned agent</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell className="font-mono">{s.store_code}</TableCell>
                    <TableCell>{s.store_name}</TableCell>
                    <TableCell>{s.store_type}</TableCell>
                    <TableCell>
                      <AssignAgentDropdown
                        storeId={s._id}
                        currentAgentId={s.assigned_agent_id?._id ?? null}
                        agents={agents}
                      />
                    </TableCell>
                    <TableCell>{s.owner_info?.name} ({s.owner_info?.phone})</TableCell>
                    <TableCell>{[s.address?.city, s.address?.state].filter(Boolean).join(", ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
