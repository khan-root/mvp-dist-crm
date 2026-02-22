import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/user";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    if (user.user_type === "agent") redirect("/agent");
    if (user.user_type === "store") redirect("/store");
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
