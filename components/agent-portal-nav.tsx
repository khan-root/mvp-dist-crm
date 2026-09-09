"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutDashboard, Store, LogOut, Navigation, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AgentPortalNav({ companyName }: { companyName: string }) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  return (
    <header className="border-b border-border/40 glass-card bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="w-full max-w-7xl mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8 gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-slate-900 flex items-center justify-center text-emerald-400 shadow-md">
            <Compass className="size-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-slate-900">Route<span className="text-emerald-600">Pro</span></span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs font-medium text-muted-foreground truncate">{companyName}</span>
          </div>
          <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-500 status-pulse-active" />
            <Navigation className="size-3" />
            <span>GPS Tracking Active</span>
          </Badge>
        </div>

        <nav className="flex items-center gap-1.5">
          <Button
            variant={pathname === "/agent" ? "default" : "ghost"}
            size="sm"
            asChild
            className={pathname === "/agent" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:text-slate-900"}
          >
            <Link href="/agent" className="flex items-center gap-2">
              <LayoutDashboard className="size-4" />
              <span>Shift Dashboard</span>
            </Link>
          </Button>
          <Button
            variant={pathname === "/agent/shops" ? "default" : "ghost"}
            size="sm"
            asChild
            className={pathname === "/agent/shops" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:text-slate-900"}
          >
            <Link href="/agent/shops" className="flex items-center gap-2">
              <Store className="size-4" />
              <span>Assigned Route</span>
            </Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden md:flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 border-slate-200">
            <Wifi className="size-3 text-emerald-600" />
            <span>Offline Sync Ready</span>
          </Badge>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10">
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
