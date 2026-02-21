import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { AssignAgentDropdown } from "@/components/assign-agent-dropdown";

async function getStores() {
  const cookieStore = await cookies();
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/stores`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load stores");
  return res.json() as Promise<{
    data: Array<{
      _id: string;
      store_code: string;
      store_name: string;
      store_type: string;
      owner_info?: { name: string; phone: string };
      address?: { city: string; state: string };
      assigned_agent_id?: { _id: string; agent_code: string; first_name: string; last_name: string } | null;
    }>;
  }>;
}

async function getAgents() {
  const cookieStore = await cookies();
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/agents`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load agents");
  const j = await res.json();
  return (j.data || []) as Array<{ _id: string; agent_code: string; first_name: string; last_name: string }>;
}

export default async function StoresPage() {
  const [{ data: list }, agents] = await Promise.all([getStores(), getAgents()]);

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
