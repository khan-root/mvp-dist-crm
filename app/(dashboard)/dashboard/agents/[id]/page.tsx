import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Store, Truck, ClipboardList } from "lucide-react";

async function getAgent(id: string) {
  const cookieStore = await cookies();
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/agents/${id}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json() as Promise<{
    data: {
      _id: string;
      agent_code: string;
      first_name: string;
      last_name: string;
      personal_info?: { email: string; phone: string };
      distributor_id?: { company_name: string };
      territory_id?: { territory_name: string };
      stats: {
        assigned_stores: number;
        orders_total: number;
        orders_delivered: number;
        orders_pending: number;
        orders_in_progress: number;
        product_units_assigned: number;
        trips_completed: number;
        trips_remaining: number;
      };
    };
  }>;
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAgent(id);
  if (!result?.data) notFound();
  const { data: agent } = result;
  const name = [agent.first_name, agent.last_name].filter(Boolean).join(" ");
  const s = agent.stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/agents"><ArrowLeft className="size-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="text-muted-foreground">Agent · {agent.agent_code} · {agent.distributor_id?.company_name}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assigned stores</CardTitle>
            <Store className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.assigned_stores}</div>
            <p className="text-xs text-muted-foreground">Shops under this agent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Product assigned</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.product_units_assigned}</div>
            <p className="text-xs text-muted-foreground">Total units in orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trips completed</CardTitle>
            <Truck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.trips_completed}</div>
            <p className="text-xs text-muted-foreground">Delivered orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <ClipboardList className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.trips_remaining}</div>
            <p className="text-xs text-muted-foreground">Pending + in progress</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Contact and assignment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="font-medium">Code:</span> {agent.agent_code}</p>
          <p><span className="font-medium">Email:</span> {agent.personal_info?.email}</p>
          <p><span className="font-medium">Phone:</span> {agent.personal_info?.phone}</p>
          {agent.territory_id && <p><span className="font-medium">Territory:</span> {agent.territory_id.territory_name}</p>}
          <div className="pt-2">
            <p className="font-medium mb-1">Order summary</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Total: {s.orders_total}</Badge>
              <Badge variant="outline">Delivered: {s.orders_delivered}</Badge>
              <Badge variant="outline">Pending: {s.orders_pending}</Badge>
              <Badge variant="outline">In progress: {s.orders_in_progress}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link href={`/dashboard/orders?agent_id=${agent._id}`}>View all orders by this agent</Link>
      </Button>
    </div>
  );
}
