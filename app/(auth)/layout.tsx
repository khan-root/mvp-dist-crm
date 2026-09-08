import { Compass } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background ambient radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] bg-slate-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Header Logo link */}
      <Link href="/" className="mb-6 flex items-center gap-3 group">
        <div className="size-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 shadow-md group-hover:scale-105 transition-transform">
          <Compass className="size-5" />
        </div>
        <span className="font-extrabold text-2xl tracking-tight text-slate-900">
          Route<span className="text-emerald-600">Pro</span>
        </span>
      </Link>

      <div className="w-full max-w-md z-10">{children}</div>
    </div>
  );
}
