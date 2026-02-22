import { redirect } from "next/navigation";
import { StorePortalNav } from "@/components/store-portal-nav";
import { getCurrentUser } from "@/lib/user";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.user_type !== "store") redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <StorePortalNav companyName={user.company_name || "CRM"} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
