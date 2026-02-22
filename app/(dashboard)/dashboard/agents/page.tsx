import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { getServerApiBaseUrl } from "@/lib/api";

async function getAgents() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/agents`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load agents");
  return res.json() as Promise<{
    data: Array<{
      _id: string;
      agent_code: string;
      first_name: string;
      last_name: string;
      personal_info?: { email: string; phone: string };
    }>;
  }>;
}

export default async function AgentsPage() {
  const { data: list } = await getAgents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <CardDescription>Field agents under your distributors</CardDescription>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All agents</CardTitle>
          <Button asChild size="sm">
            <Link href="/dashboard/agents/new">
              <Plus className="size-4" />
              Add agent
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No agents yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((a) => (
                  <TableRow key={a._id}>
                    <TableCell className="font-mono">{a.agent_code}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/agents/${a._id}`} className="font-medium hover:underline">
                        {[a.first_name, a.last_name].filter(Boolean).join(" ")}
                      </Link>
                    </TableCell>
                    <TableCell>{a.personal_info?.email}</TableCell>
                    <TableCell>{a.personal_info?.phone}</TableCell>
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
