import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/user";
import {
  Compass,
  MapPin,
  ShoppingBag,
  Zap,
  ShieldCheck,
  ArrowRight,
  Store,
  Users,
  Building2,
  CheckCircle2,
} from "lucide-react";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    if (user.user_type === "agent") redirect("/agent");
    if (user.user_type === "store") redirect("/store");
    redirect("/dashboard");
  }

  const features = [
    {
      icon: MapPin,
      title: "Journey Planning & Geo-Tracking",
      description: "Optimize daily visit routes, 20m geofence check-ins, and GPS photo verification.",
    },
    {
      icon: ShoppingBag,
      title: "Offline-First Order Capture",
      description: "Full mobile offline ordering with automatic background sync & zero data loss.",
    },
    {
      icon: Zap,
      title: "Intelligent Promotion Engine",
      description: "BOGO, quantity slabs, combo offers, and supplier-funded promo reimbursements.",
    },
    {
      icon: ShieldCheck,
      title: "Logistics & Van Reconciliation",
      description: "End-of-day stock manifest verification, return processing, and variance audit trails.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50/50 relative overflow-hidden">
      {/* Header */}
      <header className="border-b border-slate-200 glass-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md">
              <Compass className="size-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              RoutePro
            </span>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-slate-300 text-slate-700 font-semibold bg-slate-100">
              v2.0 Enterprise
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-200/70 border border-slate-300 text-slate-800 text-xs font-semibold">
          <Zap className="size-3.5 text-emerald-600" />
          <span>Next-Gen Field Force Operations Platform</span>
        </div>

        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-slate-900">
            Revolutionize Field Sales & <span className="text-emerald-700">Route Operations</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Unified multi-tenant SaaS for journey planning, real-time geo-verified order booking, complex promotions, and logistics reconciliation.
          </p>
        </div>

        {/* CTA Buttons with ample margins */}
        <div className="flex flex-wrap justify-center gap-5 mt-6 mb-4">
          <Button asChild size="lg" className="bg-slate-900 hover:bg-slate-800 text-white shadow-md px-8 font-bold">
            <Link href="/login" className="flex items-center gap-2">
              Sign In to Organization <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="px-6 border-slate-300 hover:bg-slate-100 text-slate-900 font-semibold">
            <Link href="/register">Register New Company</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="px-6 bg-slate-200/80 hover:bg-slate-200 text-slate-900 font-semibold">
            <Link href="/register-store" className="flex items-center gap-2">
              <Store className="size-4 text-slate-700" />
              <span>Register Retail Outlet</span>
            </Link>
          </Button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-10 text-left w-full">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all duration-200 shadow-sm space-y-3"
            >
              <div className="size-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <f.icon className="size-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-base text-slate-900">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 RoutePro Enterprise. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Multi-Tenant Data Isolated
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-slate-700" />
              Audit Trail Verified
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
