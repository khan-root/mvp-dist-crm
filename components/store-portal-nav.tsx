"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, ShoppingCart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StorePortalNav({ companyName }: { companyName: string }) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  return (
    <header className="border-b bg-card">
      <div className="flex h-14 items-center px-4 gap-4">
        <span className="font-semibold">{companyName} — My Shop</span>
        <nav className="flex gap-2">
          <Button variant={pathname === "/store" ? "secondary" : "ghost"} size="sm" asChild>
            <Link href="/store" className="flex items-center gap-2">
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant={pathname === "/store/search-products" ? "secondary" : "ghost"} size="sm" asChild>
            <Link href="/store/search-products" className="flex items-center gap-2">
              <Search className="size-4" />
              Search products
            </Link>
          </Button>
          <Button variant={pathname === "/store/place-order" ? "secondary" : "ghost"} size="sm" asChild>
            <Link href="/store/place-order" className="flex items-center gap-2">
              <ShoppingCart className="size-4" />
              Place order
            </Link>
          </Button>
        </nav>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
