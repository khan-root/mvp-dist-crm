"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AgentPortalNav({ companyName }: { companyName: string }) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  return (
    <header className="border-b bg-card">
      <div className="flex h-14 items-center px-4 gap-4">
        <span className="font-semibold">{companyName} — Agent</span>
        <nav className="flex gap-2">
          <Button variant={pathname === "/agent" ? "secondary" : "ghost"} size="sm" asChild>
            <Link href="/agent" className="flex items-center gap-2">
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant={pathname === "/agent/shops" ? "secondary" : "ghost"} size="sm" asChild>
            <Link href="/agent/shops" className="flex items-center gap-2">
              <Store className="size-4" />
              My shops
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
