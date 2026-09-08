"use client";

import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, CheckCircle2 } from "lucide-react";

interface AssignedStore {
  _id: string;
  store_code: string;
  store_name: string;
  owner_info?: { name?: string };
}

export function LogVisitDialog({
  stores,
  initialStoreId = "",
  trigger,
}: {
  stores: AssignedStore[];
  initialStoreId?: string;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [storeId, setStoreId] = useState(initialStoreId || (stores[0]?._id ?? ""));
  const [visitType, setVisitType] = useState("scheduled");
  const [outcome, setOutcome] = useState("order_taken");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId) {
      setError("Please select a shop");
      return;
    }
    setError("");
    setLoading(true);

    try {
      let lat = 0;
      let lng = 0;
      if (navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              resolve(true);
            },
            () => resolve(false),
            { timeout: 3000 }
          );
        });
      }

      const res = await fetch("/api/store-visits/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          store_id: storeId,
          latitude: lat,
          longitude: lng,
          notes: `${outcome.replace(/_/g, " ").toUpperCase()}: ${notes}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to record visit");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setNotes("");
        router.refresh();
      }, 1200);
    } catch {
      setError("Network error recording visit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-emerald-600" />
            <DialogTitle>Log Market Store Visit</DialogTitle>
          </div>
          <DialogDescription>
            Record store check-in, GPS verification, and market visit feedback when visiting a shopkeeper.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="size-12 text-emerald-600 mx-auto animate-bounce" />
            <p className="font-bold text-slate-900 text-lg">Store Visit Recorded!</p>
            <p className="text-sm text-slate-500">Visit check-in logged to operational database.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Market Outlet / Shopkeeper</Label>
              <Select value={storeId} onValueChange={setStoreId} required>
                <SelectTrigger><SelectValue placeholder="Select Shop" /></SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.store_name} ({s.store_code}) — {s.owner_info?.name || "Shopkeeper"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visit Purpose</Label>
                <Select value={visitType} onValueChange={setVisitType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled Routine</SelectItem>
                    <SelectItem value="emergency">Emergency Stock</SelectItem>
                    <SelectItem value="follow_up">Payment Follow-up</SelectItem>
                    <SelectItem value="collection">Collection Visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visit Outcome</Label>
                <Select value={outcome} onValueChange={setOutcome}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order_taken">Order Booked</SelectItem>
                    <SelectItem value="inventory_checked">Inventory Checked</SelectItem>
                    <SelectItem value="stock_full">No Order — Stock Full</SelectItem>
                    <SelectItem value="owner_absent">No Order — Owner Absent</SelectItem>
                    <SelectItem value="payment_collected">Payment Collected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit_notes">Visit Feedback & Remarks</Label>
              <Input
                id="visit_notes"
                placeholder="e.g. Discussed new SKU promotion with retailer"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Recording Check-in…" : "Log Visit Check-in"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
