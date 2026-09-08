"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Store,
  Package,
  ShoppingCart,
  MapPin,
  Layers,
  Warehouse as WarehouseIcon,
  LogOut,
  Compass,
  Zap,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navGroups = [
  {
    label: "Core Operations",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
      { title: "Territories & Routes", href: "/dashboard/territories", icon: MapPin },
    ],
  },
  {
    label: "Fleet & Network",
    items: [
      { title: "Distributors", href: "/dashboard/distributors", icon: Building2 },
      { title: "Field Agents", href: "/dashboard/agents", icon: Users },
      { title: "Stores & Outlets", href: "/dashboard/stores", icon: Store },
      { title: "Warehouses", href: "/dashboard/warehouses", icon: WarehouseIcon },
    ],
  },
  {
    label: "Catalog & Products",
    items: [
      { title: "Categories & Rules", href: "/dashboard/catalog", icon: Layers },
      { title: "Products & SKUs", href: "/dashboard/products", icon: Package },
    ],
  },
];

export function DashboardSidebar({
  children,
  companyName,
}: {
  children: React.ReactNode;
  companyName: string;
}) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-sidebar-border/40 glass-sidebar">
        <SidebarHeader className="border-b border-sidebar-border/40 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 shadow-md">
              <Compass className="size-5" />
            </div>
            <div className="flex flex-col truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900">Route<span className="text-emerald-600">Pro</span></span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-200 text-slate-700 font-semibold bg-slate-100">
                  v2.0
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground truncate font-medium">{companyName}</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3 space-y-4">
          {navGroups.map((group) => (
            <SidebarGroup key={group.label} className="p-0">
              <SidebarGroupLabel className="px-3 text-[11px] font-bold tracking-wider uppercase text-muted-foreground/70 mb-1">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={`w-full h-9 rounded-lg px-3 transition-all duration-200 ${
                            isActive
                              ? "bg-slate-900 text-white font-semibold shadow-xs border-l-4 border-emerald-500"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                        >
                          <Link href={item.href} className="flex items-center gap-3">
                            <item.icon className={`size-4 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                            <span className="text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/40 p-3 space-y-3">
          <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 status-pulse-active" />
              <span className="text-xs font-medium text-emerald-400">Route Engine Active</span>
            </div>
            <Zap className="size-3 text-emerald-400" />
          </div>

          <SidebarMenu>
            <SidebarMenuItem>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 h-9 text-sm font-medium"
                onClick={logout}
              >
                <LogOut className="size-4" />
                <span>Sign out</span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">{children}</SidebarInset>
    </SidebarProvider>
  );
}
