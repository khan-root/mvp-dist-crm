"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { toast } from "sonner";

export function DeleteRouteButton({ routeId, routeName }: { routeId: string; routeName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirmDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/routes/${routeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success(`Sales route "${routeName}" deleted`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to delete route");
      }
    } catch {
      toast.error("Error deleting route");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        disabled={loading}
        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 size-8"
        title="Delete Route"
      >
        <Trash2 className="size-4" />
      </Button>

      <ConfirmDeleteModal
        open={open}
        onOpenChange={setOpen}
        title="Delete Sales Route"
        description="Are you sure you want to delete this sales route? Agents assigned to this route will lose route navigation waypoints."
        itemName={routeName}
        confirmText="Delete Route"
        onConfirm={handleConfirmDelete}
        loading={loading}
      />
    </>
  );
}

