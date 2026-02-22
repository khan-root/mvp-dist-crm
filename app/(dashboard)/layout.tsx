import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { getServerApiBaseUrl } from "@/lib/api";

interface MeResponse {
  user: { company_name?: string; user_type?: string } | null;
}

export default async function DashboardLayout({
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
  if (data.user.user_type === "agent") redirect("/agent");
  if (data.user.user_type === "store") redirect("/store");

  return (
    <DashboardSidebar companyName={data.user.company_name || "CRM"}>
      <main className="flex-1 p-6">{children}</main>
    </DashboardSidebar>
  );
}
