"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store as StoreIcon, ShoppingCart, MapPin, ArrowLeft, Phone, User as UserIcon, Plus } from "lucide-react";
import { LogVisitDialog } from "@/components/log-visit-dialog";

interface AssignedStore {
  _id: string;
  store_code: string;
  store_name: string;
  store_type?: string;
  owner_info?: { name?: string; phone?: string };
  latitude?: number;
  longitude?: number;
  address?: { city?: string; state?: string; latitude?: number; longitude?: number } | any;
}

export default function AgentShopsPage() {
  const [stores, setStores] = useState<AssignedStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agent/assigned-stores", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setStores(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/agent">
            <ArrowLeft className="size-4 mr-1.5" /> Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">My Assigned Market Outlets & Shops</CardTitle>
            <CardDescription>
              Select any shopkeeper outlet to book an order on their behalf or log a market visit check-in.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs">
              <Link href="/agent/shops/new">
                <Plus className="size-4" /> Add New Store
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/agent/place-order">
                <ShoppingCart className="size-4" /> Quick Order
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500 py-6 text-center">Loading assigned market outlets…</p>
          ) : stores.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="size-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <StoreIcon className="size-6" />
              </div>
              <p className="text-slate-800 font-semibold text-base">No shops assigned yet.</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You haven't been assigned any retail shops yet, or you discovered a new outlet on your route. Click below to onboard a new store directly!
              </p>
              <div className="pt-2">
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                  <Link href="/agent/shops/new">
                    <Plus className="size-4" /> Onboard First Store
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {stores.map((s) => (
                <div
                  key={s._id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                        <StoreIcon className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{s.store_name}</h3>
                        <p className="text-xs text-slate-500 font-mono">Code: {s.store_code}</p>
                      </div>
                    </div>
                    {s.store_type && (
                      <Badge variant="outline" className="capitalize text-xs bg-slate-50">
                        {s.store_type}
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="flex items-center gap-1.5">
                      <UserIcon className="size-3.5 text-slate-400" />
                      <span className="font-medium text-slate-900">Owner:</span> {s.owner_info?.name || "Shopkeeper"}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-slate-400" />
                      <span className="font-medium text-slate-900">Phone:</span> {s.owner_info?.phone || "N/A"}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-slate-400" />
                      <span className="font-medium text-slate-900">Location:</span> {[s.address?.city, s.address?.state].filter(Boolean).join(", ") || "Market Outlet"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button size="sm" className="flex-1 bg-slate-900 text-white hover:bg-slate-800 text-xs gap-1.5" asChild>
                      <Link href={`/agent/place-order?store_id=${s._id}`}>
                        <ShoppingCart className="size-3.5" /> Book Order for Shop
                      </Link>
                    </Button>

                    <LogVisitDialog
                      stores={stores}
                      initialStoreId={s._id}
                      trigger={
                        <Button size="sm" variant="outline" className="text-xs gap-1">
                          <MapPin className="size-3.5 text-emerald-600" /> Log Visit
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
