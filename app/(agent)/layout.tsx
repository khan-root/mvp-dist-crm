import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AgentPortalNav } from "@/components/agent-portal-nav";
import { getServerApiBaseUrl } from "@/lib/api";

interface MeResponse {
  user: { user_type?: string; agent_id?: string; company_name?: string } | null;
}

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/auth/me`, {
    headers: { Cookie: cookieStore.toString() },
  });
  const data: MeResponse = await res.json();
  if (!data.user) redirect("/login");
  if (data.user.user_type !== "agent") redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <AgentPortalNav companyName={data.user.company_name || "CRM"} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
