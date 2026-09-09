"use client";

import { useState, useEffect } from "react";
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
  Warehouse as WarehouseIcon,
  LogOut,
  Compass,
  Zap,
  ShieldCheck,
  Navigation,
  ChevronDown,
  ChevronRight,
  Boxes,
  UserPlus,
  PlusCircle,
  FolderTree,
  Shield,
  UserCheck,
  Radio,
  Clock,
  Ship,
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

interface NavSubItem {
  title: string;
  href: string;
  icon: any;
  module?: string;
}

interface NavItem {
  title: string;
  href?: string;
  icon: any;
  module?: string;
  subItems?: NavSubItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const rawNavGroups: NavGroup[] = [
  {
    label: "Core Operations",
    items: [
      {
        title: "Overview & Analytics",
        icon: LayoutDashboard,
        subItems: [
          { title: "Main Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ],
      },
      {
        title: "Orders & Fulfillment",
        icon: ShoppingCart,
        subItems: [
          { title: "All Sales Orders", href: "/dashboard/orders", icon: ShoppingCart, module: "orders" },
        ],
      },
      {
        title: "Territories & Routes",
        icon: MapPin,
        subItems: [
          { title: "Configure Territories", href: "/dashboard/territories", icon: Compass, module: "routes" },
          { title: "Sales Routes", href: "/dashboard/routes", icon: Navigation, module: "routes" },
        ],
      },
    ],
  },
  {
    label: "Inventory & Logistics",
    items: [
      {
        title: "Stock & Warehousing",
        icon: Boxes,
        subItems: [
          { title: "Inventory & Stock Levels", href: "/dashboard/inventory", icon: Boxes, module: "inventory" },
          { title: "Warehouse Hubs", href: "/dashboard/warehouses", icon: WarehouseIcon, module: "inventory" },
          { title: "Supply Chain & Repackaging", href: "/dashboard/supply-chain", icon: Ship, module: "inventory" },
        ],
      },
    ],
  },
  {
    label: "Network & Distribution",
    items: [
      {
        title: "Distribution Hubs",
        icon: Building2,
        subItems: [
          { title: "All Distributors", href: "/dashboard/distributors", icon: Building2, module: "distributors" },
          { title: "Onboard Distributor", href: "/dashboard/distributors/new", icon: PlusCircle, module: "distributors" },
        ],
      },
      {
        title: "Field Force Fleet",
        icon: Users,
        subItems: [
          { title: "All Field Agents", href: "/dashboard/agents", icon: Users, module: "agents" },
          { title: "Onboard Field Agent", href: "/dashboard/agents/new", icon: UserPlus, module: "agents" },
          { title: "Live Telematics & Radar", href: "/dashboard/telematics", icon: Radio, module: "agents" },
        ],
      },
      {
        title: "Outlets & Retail",
        icon: Store,
        subItems: [
          { title: "Retail Stores & Outlets", href: "/dashboard/stores", icon: Store, module: "stores" },
        ],
      },
    ],
  },
  {
    label: "Catalog & Governance",
    items: [
      {
        title: "Products & Master SKUs",
        icon: Package,
        subItems: [
          { title: "Product Matrix", href: "/dashboard/products", icon: Package, module: "products" },
          { title: "Add New Product", href: "/dashboard/products/new", icon: PlusCircle, module: "products" },
          { title: "Categories & Rules", href: "/dashboard/catalog", icon: FolderTree, module: "products" },
        ],
      },
      {
        title: "Governance & SOPs",
        icon: ShieldCheck,
        subItems: [
          { title: "Field Force Policies", href: "/dashboard/policies", icon: ShieldCheck, module: "policies" },
          { title: "RBAC Roles & Governance", href: "/dashboard/roles", icon: ShieldCheck, module: "roles" },
        ],
      },
    ],
  },
  {
    label: "Human Resources (HR)",
    items: [
      {
        title: "HR & Team Operations",
        icon: Building2,
        subItems: [
          { title: "Teams & Agent Groups", href: "/dashboard/hr?tab=teams", icon: Users, module: "agents" },
          { title: "Shift Roster Logs", href: "/dashboard/hr?tab=attendance", icon: Clock, module: "agents" },
          { title: "Shift Policy Studio", href: "/dashboard/hr?tab=policies", icon: ShieldCheck, module: "policies" },
          { title: "Monthly Payroll Studio", href: "/dashboard/hr?tab=payroll", icon: Zap, module: "policies" },
        ],
      },
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    "Overview & Analytics": true,
    "Orders & Fulfillment": true,
    "Territories & Routes": true,
    "Stock & Warehousing": true,
    "Distribution Hubs": true,
    "Field Force Fleet": true,
    "Outlets & Retail": true,
    "Products & Master SKUs": true,
    "Governance & SOPs": true,
    "HR & Team Operations": true,
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  function toggleSubmenu(title: string) {
    setOpenSubmenus((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  // Filter menu items by permissions
  function isAllowed(moduleName?: string) {
    if (!moduleName) return true;
    if (!currentUser) return true; // Show all while fetching/default
    if (currentUser.role_code === "admin") return true;
    if (!currentUser.permissions || !currentUser.permissions.modules) return true;
    const modules: any[] = currentUser.permissions.modules;
    const mod = modules.find((m) => m.module_name === moduleName || m.module_name === "all");
    if (!mod) return false;
    return mod.actions?.includes("read") || mod.actions?.includes("all");
  }

  const navGroups = rawNavGroups
    .map((group) => {
      const filteredItems = group.items
        .map((item) => {
          if (item.subItems) {
            const filteredSubs = item.subItems.filter((sub) => isAllowed(sub.module));
            if (filteredSubs.length === 0) return null;
            return { ...item, subItems: filteredSubs };
          }
          if (!isAllowed(item.module)) return null;
          return item;
        })
        .filter(Boolean) as NavItem[];

      if (filteredItems.length === 0) return null;
      return { ...group, items: filteredItems };
    })
    .filter(Boolean) as NavGroup[];

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
                <span className="font-bold text-base tracking-tight text-slate-900">
                  Route<span className="text-emerald-600">Pro</span>
                </span>
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
                    const hasSub = item.subItems && item.subItems.length > 0;
                    const isOpen = openSubmenus[item.title] ?? false;
                    const isAnySubActive = hasSub && item.subItems?.some((sub) => pathname === sub.href);
                    const isActive = item.href ? pathname === item.href : false;

                    if (hasSub) {
                      return (
                        <div key={item.title} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => toggleSubmenu(item.title)}
                            className={`w-full flex items-center justify-between h-9 rounded-lg px-3 text-sm cursor-pointer transition-all duration-200 ${
                              isAnySubActive
                                ? "bg-slate-100 text-slate-900 font-semibold border-l-2 border-emerald-500"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className={`size-4 ${isAnySubActive ? "text-emerald-600" : "text-slate-500"}`} />
                              <span>{item.title}</span>
                            </div>
                            {isOpen ? <ChevronDown className="size-3.5 text-slate-400" /> : <ChevronRight className="size-3.5 text-slate-400" />}
                          </button>

                          {isOpen && (
                            <div className="pl-6 space-y-1 border-l border-slate-200 ml-4 py-1">
                              {item.subItems?.map((sub) => {
                                const isSubActive = pathname === sub.href;
                                return (
                                  <SidebarMenuItem key={sub.href}>
                                    <SidebarMenuButton
                                      asChild
                                      isActive={isSubActive}
                                      className={`w-full h-8 rounded-md px-2.5 text-xs transition-all cursor-pointer ${
                                        isSubActive
                                          ? "bg-slate-900 text-white font-semibold shadow-2xs"
                                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                      }`}
                                    >
                                      <Link href={sub.href} className="flex items-center gap-2">
                                        <sub.icon className={`size-3.5 ${isSubActive ? "text-emerald-400" : "text-slate-400"}`} />
                                        <span>{sub.title}</span>
                                      </Link>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={`w-full h-9 rounded-lg px-3 transition-all duration-200 cursor-pointer ${
                            isActive
                              ? "bg-slate-900 text-white font-semibold shadow-xs border-l-4 border-emerald-500"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                        >
                          <Link href={item.href!} className="flex items-center gap-3">
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
          {currentUser && (
            <div className="px-3 py-2 rounded-lg bg-slate-900/90 text-white border border-slate-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 truncate">
                <Shield className="size-3.5 text-emerald-400 shrink-0" />
                <div className="flex flex-col truncate">
                  <span className="text-[11px] font-bold text-slate-200 truncate">{currentUser.role_name || "Administrator"}</span>
                  <span className="text-[9px] text-emerald-400 font-medium tracking-tight">Active Role Authorization</span>
                </div>
              </div>
            </div>
          )}

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
                className="w-full justify-start gap-2.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 h-9 text-sm font-medium cursor-pointer"
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
