import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getServerApiBaseUrl } from "@/lib/api";

export default async function HomePage() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/auth/me`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  const data = await res.json();
  if (data.user) {
    const t = data.user.user_type;
    if (t === "agent") redirect("/agent");
    if (t === "store") redirect("/store");
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-muted/30 p-4">
      <h1 className="text-3xl font-bold">Distribution CRM</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Manage distributors, agents, stores, products and orders in one place.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/register">Register</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/register-store">Register your shop</Link>
        </Button>
      </div>
    </div>
  );
}
