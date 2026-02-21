import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { OrdersTable } from "./orders-table";

async function getOrders(searchParams: Record<string, string | undefined>) {
  const cookieStore = await cookies();
  const q = new URLSearchParams();
  q.set("limit", "50");
  if (searchParams.status) q.set("status", searchParams.status);
  if (searchParams.store_id) q.set("store_id", searchParams.store_id);
  if (searchParams.agent_id) q.set("agent_id", searchParams.agent_id);
  if (searchParams.delivery_status) q.set("delivery_status", searchParams.delivery_status);
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/orders?${q.toString()}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load orders");
  return res.json() as Promise<{ data: unknown[]; total: number }>;
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

async function getStores() {
  const cookieStore = await cookies();
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/stores`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load stores");
  const j = await res.json();
  return (j.data || []) as Array<{ _id: string; store_code: string; store_name: string }>;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; store_id?: string; agent_id?: string; delivery_status?: string }>;
}) {
  const params = await searchParams;
  const [{ data: list, total }, agents, stores] = await Promise.all([
    getOrders(params),
    getAgents(),
    getStores(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <CardDescription>Orders by store and agent — status, delivery, and payment</CardDescription>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/orders/new">
            <Plus className="size-4" />
            New order
          </Link>
        </Button>
      </div>

      <OrdersTable orders={list as Parameters<typeof OrdersTable>[0]["orders"]} total={total} agents={agents} stores={stores} />
    </div>
  );
}
