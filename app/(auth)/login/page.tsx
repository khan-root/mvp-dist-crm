"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Building, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage, toastApiError } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, ...(subdomain ? { subdomain } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = getApiErrorMessage(data, "Login failed");
        setError(msg);
        toastApiError(toast, data, "Login failed");
        return;
      }
      toast.success("Login successful!");
      const userType = data.user?.user_type || "admin";
      if (userType === "agent") router.push("/agent");
      else if (userType === "store") router.push("/store");
      else router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error");
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="glass-card border-slate-200 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-extrabold tracking-tight text-slate-900">Sign In to RoutePro</CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Enter your tenant credentials to access your sales workspace
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="subdomain" className="text-xs font-semibold flex items-center gap-1.5 text-slate-700">
              <Building className="size-3.5 text-slate-500" />
              <span>Subdomain</span>
              <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="subdomain"
              placeholder="e.g. acme"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              className="bg-white border-slate-200 focus:border-slate-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold flex items-center gap-1.5 text-slate-700">
              <Mail className="size-3.5 text-slate-500" />
              <span>Email Address</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white border-slate-200 focus:border-slate-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold flex items-center gap-1.5 text-slate-700">
              <Lock className="size-3.5 text-slate-500" />
              <span>Password</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white border-slate-200 focus:border-slate-800"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 mt-6 pt-5 border-t border-slate-200">
          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 shadow-sm mt-2 cursor-pointer" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Authenticating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign In to Workspace <ArrowRight className="size-4" />
              </span>
            )}
          </Button>

          <div className="text-xs text-slate-500 text-center space-y-2 pt-2 w-full">
            <p>
              Need a new workspace?{" "}
              <Link href="/register" className="text-slate-900 font-semibold underline hover:text-slate-700">
                Register Company
              </Link>
            </p>
            <p>
              Are you a retail outlet?{" "}
              <Link href="/register-store" className="text-slate-900 font-semibold underline hover:text-slate-700">
                Register Shop
              </Link>
            </p>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
