"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, ShoppingCart } from "lucide-react";

interface AssignedStore {
  _id: string;
  store_code: string;
  store_name: string;
  store_type?: string;
  owner_info?: { name?: string; phone?: string };
  address?: { city?: string; state?: string };
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/agent">← Dashboard</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>My assigned shops</CardTitle>
          <CardDescription>
            Visit these shops, ask if they need products, and place orders on their behalf when they say yes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : stores.length === 0 ? (
            <p className="text-sm text-muted-foreground">No shops assigned yet. Ask your admin to assign shops to you.</p>
          ) : (
            <ul className="space-y-3">
              {stores.map((s) => (
                <li
                  key={s._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Store className="size-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{s.store_name}</span>
                      <span className="text-muted-foreground ml-2">({s.store_code})</span>
                      {s.store_type && (
                        <span className="ml-2 text-sm text-muted-foreground">{s.store_type}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {s.owner_info?.name} · {s.owner_info?.phone}
                    {s.address && ` · ${[s.address.city, s.address.state].filter(Boolean).join(", ")}`}
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/agent/place-order?store_id=${s._id}`}>
                      <ShoppingCart className="size-4" />
                      Place order for this shop
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
