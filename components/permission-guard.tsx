"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PermissionGuardProps {
  module: string;
  action?: "read" | "write" | "update" | "delete" | "create";
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideIfNoAccess?: boolean;
}

export function PermissionGuard({
  module,
  action = "read",
  children,
  fallback,
  hideIfNoAccess,
}: PermissionGuardProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    if (action !== "read" || hideIfNoAccess || fallback !== undefined) {
      return null;
    }
    return (
      <div className="p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
        <Lock className="size-4 animate-pulse text-emerald-500" />
        <span>Verifying Security Clearance...</span>
      </div>
    );
  }

  // Admin always has full access
  if (!user || user.role_code === "admin") {
    return <>{children}</>;
  }

  // Check permissions array
  const userModules = user.permissions?.modules || [];
  const modulePerm = userModules.find(
    (m: any) => m.module_name === module || m.module_name === "all"
  );

  const hasPermission =
    modulePerm &&
    (modulePerm.actions?.includes(action) || modulePerm.actions?.includes("all"));

  if (!hasPermission) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    if (hideIfNoAccess || action !== "read") {
      return null;
    }
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 text-center space-y-6 bg-slate-900/90 text-white rounded-2xl border border-rose-500/30 shadow-2xl backdrop-blur-xl">
        <div className="size-16 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
          <ShieldAlert className="size-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">Access Restricted</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Your role (<span className="text-emerald-400 font-semibold">{user.role_name || user.role_code}</span>) does not have{" "}
            <span className="text-rose-400 font-semibold uppercase">{action}</span> authorization for the{" "}
            <span className="text-amber-400 font-semibold uppercase">{module}</span> module.
          </p>
        </div>

        <div className="pt-4 flex justify-center gap-3">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="size-4" />
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
