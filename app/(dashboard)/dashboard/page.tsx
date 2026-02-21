import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Store, Package, ShoppingCart, ArrowRight, Warehouse } from "lucide-react";

interface DashboardData {
  data: {
    counts: {
      distributors: number;
      agents: number;
      stores: number;
      warehouses: number;
      orders: number;
      products: number;
      pending_orders: number;
    };
    revenue: number;
    recent_orders: Array<{
      _id: string;
      order_number: string;
      grand_total: number;
      status: string;
      order_date: string;
    }>;
  };
}

async function getDashboard() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/dashboard`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json() as Promise<DashboardData>;
}

export default async function DashboardPage() {
  const { data } = await getDashboard();
  const { counts, revenue, recent_orders } = data;

  const cards = [
    { title: "Distributors", value: counts.distributors, href: "/dashboard/distributors", icon: Building2 },
    { title: "Agents", value: counts.agents, href: "/dashboard/agents", icon: Users },
    { title: "Stores", value: counts.stores, href: "/dashboard/stores", icon: Store },
    { title: "Warehouses", value: counts.warehouses, href: "/dashboard/warehouses", icon: Warehouse },
    { title: "Products", value: counts.products, href: "/dashboard/products", icon: Package },
    { title: "Orders", value: counts.orders, href: "/dashboard/orders", icon: ShoppingCart },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your distribution network</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
                <c.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{c.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  View <ArrowRight className="size-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Total from confirmed orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Rs.{revenue.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {counts.pending_orders} orders pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Latest 5 orders</CardDescription>
          </CardHeader>
          <CardContent>
            {recent_orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet</p>
            ) : (
              <ul className="space-y-2">
                {recent_orders.map((o) => (
                  <li key={o._id} className="flex items-center justify-between text-sm">
                    <span className="font-mono">{o.order_number}</span>
                    <span>Rs.{o.grand_total?.toLocaleString()}</span>
                    <Badge variant="secondary">{o.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/dashboard/orders">View all orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
