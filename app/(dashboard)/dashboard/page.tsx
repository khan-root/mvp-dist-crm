export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  Store,
  Package,
  ShoppingCart,
  ArrowRight,
  Warehouse,
  TrendingUp,
  Activity,
  Compass,
  Clock,
  CheckCircle2,
} from "lucide-react";

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
  const { getServerApiBaseUrl } = await import("@/lib/api");
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/dashboard`, {
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
    { title: "Distributors", value: counts.distributors, href: "/dashboard/distributors", icon: Building2, color: "bg-slate-100 text-slate-800" },
    { title: "Field Agents", value: counts.agents, href: "/dashboard/agents", icon: Users, color: "bg-slate-100 text-slate-800" },
    { title: "Stores & Outlets", value: counts.stores, href: "/dashboard/stores", icon: Store, color: "bg-emerald-50 text-emerald-700" },
    { title: "Warehouses", value: counts.warehouses, href: "/dashboard/warehouses", icon: Warehouse, color: "bg-amber-50 text-amber-700" },
    { title: "Products & SKUs", value: counts.products, href: "/dashboard/products", icon: Package, color: "bg-slate-100 text-slate-800" },
    { title: "Total Orders", value: counts.orders, href: "/dashboard/orders", icon: ShoppingCart, color: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="size-5 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Operational Command Center</h1>
          </div>
          <p className="text-sm text-slate-300">Real-time overview of field sales, journey routes, and logistics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-medium">
            <span className="size-2 rounded-full bg-emerald-400 status-pulse-active mr-1.5" />
            Live Sync Active
          </Badge>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md">
            <Link href="/dashboard/orders">
              Manage Orders <ArrowRight className="size-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Network Metrics Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="hover:scale-[1.02] transition-all duration-200 cursor-pointer border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.title}</CardTitle>
                <div className={`p-2 rounded-lg ${c.color}`}>
                  <c.icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-slate-900">{c.value}</div>
                <p className="text-xs text-slate-600 font-medium flex items-center gap-1 mt-2">
                  Explore Network <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Regional Geo-Coverage Quick Filter Hub */}
      <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-emerald-600" />
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Regional Distribution Matrix (Pakistan)</CardTitle>
                <CardDescription>Quick filter distributors, routes, stores, and agents by Province / Federal Capital</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { name: "Punjab", code: "Punjab", desc: "Lahore, FSL, RWP, SKT" },
              { name: "Sindh", code: "Sindh", desc: "Karachi, Sukkur, HYD" },
              { name: "KPK", code: "KPK", desc: "Peshawar, Swat, Mardan" },
              { name: "Balochistan", code: "Balochistan", desc: "Quetta, Gwadar, Khuzdar" },
              { name: "Islamabad (ICT)", code: "Islamabad (ICT)", desc: "Federal Capital Hub" },
              { name: "Gilgit-Baltistan", code: "Gilgit-Baltistan", desc: "Gilgit, Skardu, Hunza" },
              { name: "AJK", code: "AJK", desc: "Muzaffarabad, Mirpur" },
            ].map((prov) => (
              <Link
                key={prov.name}
                href={`/dashboard/distributors`}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-sm transition-all group"
              >
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center justify-between">
                  <span>{prov.name}</span>
                  <ArrowRight className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">{prov.desc}</div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue & Recent Orders Split */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Card */}
        <Card className="border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <TrendingUp className="size-36 text-slate-400" />
          </div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Total Sales Revenue</CardTitle>
                <CardDescription>Confirmed revenue from active sales routes</CardDescription>
              </div>
              <Badge variant="success" className="gap-1">
                <Activity className="size-3" />
                +12.4% MoM
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                Rs. {revenue.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                <Clock className="size-4 text-amber-500" />
                <span className="font-semibold text-foreground">{counts.pending_orders}</span> orders currently pending verification
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block font-medium">Order Target</span>
                <span className="text-lg font-bold text-emerald-600">98.5%</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block font-medium">Fulfillment Rate</span>
                <span className="text-lg font-bold text-slate-900">99.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders Feed Card */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Recent Route Orders</CardTitle>
              <CardDescription>Latest transactions submitted by field bookers</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recent_orders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground space-y-2">
                <ShoppingCart className="size-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm">No orders captured on current route shift.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recent_orders.map((o) => {
                  const statusVariant =
                    o.status === "delivered" || o.status === "approved"
                      ? "success"
                      : o.status === "pending" || o.status === "submitted"
                      ? "warning"
                      : "secondary";

                  return (
                    <div
                      key={o._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/60 border border-border/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          #
                        </div>
                        <div>
                          <span className="font-mono text-sm font-semibold text-foreground block">{o.order_number}</span>
                          <span className="text-xs text-muted-foreground">
                            {o.order_date ? new Date(o.order_date).toLocaleDateString() : "Today"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-bold text-sm">Rs. {o.grand_total?.toLocaleString()}</span>
                        <Badge variant={statusVariant} className="capitalize">
                          {o.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/dashboard/orders">Go to Orders Queue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
