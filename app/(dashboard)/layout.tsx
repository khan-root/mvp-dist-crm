import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { getCurrentUser } from "@/lib/user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.user_type === "agent") redirect("/agent");
  if (user.user_type === "store") redirect("/store");

  return (
    <DashboardSidebar companyName={user.company_name || "CRM"}>
      <main className="flex-1 p-6">{children}</main>
    </DashboardSidebar>
  );
}
