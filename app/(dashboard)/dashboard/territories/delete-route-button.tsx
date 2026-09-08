"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteRouteButton({ routeId, routeName }: { routeId: string; routeName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete sales route "${routeName}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/routes/${routeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete route");
      }
    } catch {
      alert("Error deleting route");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={loading}
      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 size-8"
      title="Delete Route"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
