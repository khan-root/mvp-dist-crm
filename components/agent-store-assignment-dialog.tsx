"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toastApiError } from "@/lib/utils";
import { Store, Search, Check, CheckSquare, Square, Loader2 } from "lucide-react";

interface StoreItem {
  _id: string;
  store_code: string;
  store_name: string;
  store_type?: string;
  owner_info?: { name?: string; phone?: string };
  address?: { city?: string };
  assigned_agent_id?: string;
}

export function AgentStoreAssignmentDialog({
  agentId,
  agentName,
  trigger,
}: {
  agentId: string;
  agentName: string;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [allStores, setAllStores] = useState<StoreItem[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setFetching(true);
    fetch(`/api/agents/${agentId}/assign-stores`, { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          const assigned: StoreItem[] = res.data.assigned_stores || [];
          const available: StoreItem[] = res.data.available_stores || [];
          const combined = [...assigned, ...available];
          setAllStores(combined);
          setSelectedStoreIds(assigned.map((s) => s._id));
        }
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [open, agentId]);

  function toggleStore(storeId: string) {
    setSelectedStoreIds((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  }

  function selectAll() {
    setSelectedStoreIds(allStores.map((s) => s._id));
  }

  function deselectAll() {
    setSelectedStoreIds([]);
  }

  async function handleSave() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/assign-stores`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ store_ids: selectedStoreIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastApiError(data, "Failed to update assignments");
        setError(data.error || "Failed to update assignments");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toastApiError(err, "Network error saving assignments");
      setError("Network error saving assignments");
    } finally {
      setLoading(false);
    }
  }

  const filteredStores = allStores.filter((s) =>
    `${s.store_name} ${s.store_code} ${s.owner_info?.name || ""} ${s.address?.city || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-slate-900">
            <Store className="size-5 text-emerald-600" />
            <DialogTitle>Assign Market Outlets to {agentName}</DialogTitle>
          </div>
          <DialogDescription>
            Select retail stores and market shopkeepers to assign to this agent's sales route.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search shops by name, code, owner, city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={selectAll} className="text-xs">
              Select All
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={deselectAll} className="text-xs">
              Deselect All
            </Button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Selected: <span className="font-bold text-slate-900">{selectedStoreIds.length}</span> of {allStores.length} stores
          </div>

          {fetching ? (
            <p className="text-sm text-slate-500 py-6 text-center">Loading market stores…</p>
          ) : filteredStores.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No matching market stores found.</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 border rounded-xl p-2 bg-slate-50/50 border-slate-200">
              {filteredStores.map((store) => {
                const isSelected = selectedStoreIds.includes(store._id);
                return (
                  <div
                    key={store._id}
                    onClick={() => toggleStore(store._id)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                        : "bg-white text-slate-900 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <CheckSquare className="size-5 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="size-5 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-sm">{store.store_name}</div>
                        <div className={`text-xs ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          Code: {store.store_code} · Owner: {store.owner_info?.name || "N/A"} · City: {store.address?.city || "N/A"}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                        <Check className="size-3" /> Assigned
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={loading || fetching}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Assignments…
              </>
            ) : (
              `Save (${selectedStoreIds.length}) Store Assignments`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
