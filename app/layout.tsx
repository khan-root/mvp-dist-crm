import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RoutePro — Field Sales & Route Operations Platform",
  description: "Enterprise multi-tenant solution for journey planning, order booking, real-time geo-tracking, and logistics reconciliation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakartaSans.variable} ${geistMono.variable} antialiased min-h-screen relative font-sans selection:bg-indigo-500/20 selection:text-indigo-600 bg-slate-50/60`}>
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(79,70,229,0.08),rgba(248,250,252,0))]" />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
