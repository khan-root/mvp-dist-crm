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
    <div className="min-h-screen flex flex-col">
      <AgentPortalNav companyName={user.company_name || "CRM"} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
