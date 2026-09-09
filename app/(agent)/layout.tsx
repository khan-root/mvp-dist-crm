import { redirect } from "next/navigation";
import { AgentPortalNav } from "@/components/agent-portal-nav";
import { getCurrentUser } from "@/lib/user";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.user_type !== "agent") redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60">
      <AgentPortalNav companyName={user.company_name || "CRM"} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">{children}</main>
    </div>
  );
}
