"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { MapPin, CheckCircle2, ShieldCheck, AlertTriangle, Navigation, Crosshair } from "lucide-react";

interface AssignedStore {
  _id: string;
  store_code: string;
  store_name: string;
  owner_info?: { name?: string; phone?: string };
  latitude?: number;
  longitude?: number;
  address?: { latitude?: number; longitude?: number; city?: string; state?: string } | any;
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
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

  // Live GPS Radar state
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geofenceDistance, setGeofenceDistance] = useState<number | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);

  const selectedStore = stores.find((s) => s._id === storeId) || stores[0];

  // Fetch live GPS and compute distance against selected store
  function refreshGeofenceRadar(store = selectedStore) {
    if (!typeof window || !navigator.geolocation) return;
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(current);
        setIsGettingGps(false);

        const storeLat = store?.latitude || store?.address?.latitude || 0;
        const storeLng = store?.longitude || store?.address?.longitude || 0;

        if (storeLat && storeLng) {
          const dist = calculateDistanceMeters(current.lat, current.lng, storeLat, storeLng);
          setGeofenceDistance(dist);
        } else {
          setGeofenceDistance(0); // If store lat/lng not set yet, fallback
        }
      },
      () => {
        setIsGettingGps(false);
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  }

  useEffect(() => {
    if (open) {
      refreshGeofenceRadar(selectedStore);
    }
  }, [open, storeId]);

  function handleStoreChange(id: string) {
    setStoreId(id);
    const target = stores.find((s) => s._id === id);
    if (target) {
      refreshGeofenceRadar(target);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId) {
      setError("Please select a shop");
      return;
    }
    setError("");
    setLoading(true);

    try {
      let lat = userCoords?.lat || 0;
      let lng = userCoords?.lng || 0;

      if (!lat && navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              resolve(true);
            },
            () => resolve(false),
            { timeout: 4000 }
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

  const isVerified = geofenceDistance !== null && geofenceDistance <= 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-emerald-600" />
            <DialogTitle>Log Market Store Visit Check-in</DialogTitle>
          </div>
          <DialogDescription>
            Record store check-in, GPS geofence radar verification, and market visit feedback.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="size-12 text-emerald-600 mx-auto animate-bounce" />
            <p className="font-bold text-slate-900 text-lg">Store Visit Recorded!</p>
            <p className="text-sm text-slate-500">Visit check-in logged to operational database with GPS verification badge.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">Market Outlet / Shopkeeper</Label>
                <button
                  type="button"
                  onClick={() => refreshGeofenceRadar(selectedStore)}
                  className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Crosshair className={`size-3 ${isGettingGps ? "animate-spin" : ""}`} /> Refresh GPS Radar
                </button>
              </div>
              <Select value={storeId} onValueChange={handleStoreChange} required>
                <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue placeholder="Select Shop" /></SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.store_name} ({s.store_code}) — {s.owner_info?.name || "Shopkeeper"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Geofence Radar Distance Verification Badge */}
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
              isVerified
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : geofenceDistance !== null && geofenceDistance > 100
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              <div className="flex items-center gap-2.5">
                {isVerified ? (
                  <ShieldCheck className="size-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="size-5 text-rose-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold block text-slate-900">
                    {isVerified ? "GPS Geofence Verified (100m Radius)" : "Out-of-Bounds Geofence Alert"}
                  </span>
                  <span className="text-[11px] text-slate-600">
                    {geofenceDistance !== null
                      ? `Agent distance from shop: ${geofenceDistance} meters`
                      : "Calculating live GPS proximity to shop..."}
                  </span>
                </div>
              </div>

              {geofenceDistance !== null && (
                <Badge
                  variant="outline"
                  className={
                    isVerified
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-mono text-[10px]"
                      : "bg-rose-100 text-rose-800 border-rose-300 font-mono text-[10px]"
                  }
                >
                  {isVerified ? "Verified Pass" : "Flagged Review"}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Visit Purpose</Label>
                <Select value={visitType} onValueChange={setVisitType}>
                  <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled Routine</SelectItem>
                    <SelectItem value="emergency">Emergency Stock</SelectItem>
                    <SelectItem value="follow_up">Payment Follow-up</SelectItem>
                    <SelectItem value="collection">Collection Visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Visit Outcome</Label>
                <Select value={outcome} onValueChange={setOutcome}>
                  <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
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

            <div className="space-y-1.5">
              <Label htmlFor="visit_notes" className="text-xs font-semibold text-slate-700">Visit Feedback & Remarks</Label>
              <Input
                id="visit_notes"
                placeholder="e.g. Discussed new SKU promotion with retailer"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>

            {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer">
                {loading ? "Recording Check-in…" : "Log Visit Check-in"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
