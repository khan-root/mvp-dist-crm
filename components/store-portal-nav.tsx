"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutDashboard, Search, ShoppingCart, LogOut, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function StorePortalNav({ companyName }: { companyName: string }) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  return (
    <header className="border-b border-border/40 glass-card sticky top-0 z-40">
      <div className="flex h-14 items-center px-4 gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-slate-900 flex items-center justify-center text-emerald-400 shadow-md">
            <Compass className="size-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-slate-900">Route<span className="text-emerald-600">Pro</span></span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs font-medium text-muted-foreground truncate">{companyName}</span>
          </div>
          <Badge variant="outline" className="hidden sm:flex items-center gap-1 text-xs bg-slate-100 text-slate-700 border-slate-200">
            <Store className="size-3 text-emerald-600" />
            <span>Retailer Outlet</span>
          </Badge>
        </div>

        <nav className="flex items-center gap-1.5">
          <Button
            variant={pathname === "/store" ? "default" : "ghost"}
            size="sm"
            asChild
            className={pathname === "/store" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:text-slate-900"}
          >
            <Link href="/store" className="flex items-center gap-2">
              <LayoutDashboard className="size-4" />
              <span>Overview</span>
            </Link>
          </Button>
          <Button
            variant={pathname === "/store/search-products" ? "default" : "ghost"}
            size="sm"
            asChild
            className={pathname === "/store/search-products" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:text-slate-900"}
          >
            <Link href="/store/search-products" className="flex items-center gap-2">
              <Search className="size-4" />
              <span>Browse Catalog</span>
            </Link>
          </Button>
          <Button
            variant={pathname === "/store/place-order" ? "default" : "ghost"}
            size="sm"
            asChild
            className={pathname === "/store/place-order" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:text-slate-900"}
          >
            <Link href="/store/place-order" className="flex items-center gap-2">
              <ShoppingCart className="size-4" />
              <span>Order Cart</span>
            </Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10">
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
