"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RouteLeafletMap, StorePoint } from "@/components/route-leaflet-map";
import { StoreLocationPickerMap } from "@/components/store-location-picker-map";
import { MapPin, Store as StoreIcon } from "lucide-react";

export default function NewStorePage() {
  const router = useRouter();
  const [distributors, setDistributors] = useState<Array<{ _id: string; company_name: string }>>([]);
  const [territories, setTerritories] = useState<Array<{ _id: string; territory_name: string }>>([]);
  const [agents, setAgents] = useState<Array<{ _id: string; first_name: string; last_name: string; agent_code: string }>>([]);
  const [routes, setRoutes] = useState<Array<{ _id: string; route_name: string; route_code: string; start_point?: any; end_point?: any }>>([]);
  
  const [store_code, setStoreCode] = useState("");
  const [store_name, setStoreName] = useState("");
  const [store_type, setStoreType] = useState<string>("kirana");
  const [distributor_id, setDistributorId] = useState("");
  const [territory_id, setTerritoryId] = useState("");
  const [assigned_agent_id, setAssignedAgentId] = useState("");
  const [assigned_route_id, setAssignedRouteId] = useState("");
  const [owner_name, setOwnerName] = useState("");
  const [owner_phone, setOwnerPhone] = useState("");
  const [owner_email, setOwnerEmail] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number>(33.6844);
  const [longitude, setLongitude] = useState<number>(73.0479);
  const [landmark, setLandmark] = useState("");
  const [credit_limit, setCreditLimit] = useState("");
  const [credit_days, setCreditDays] = useState("");
  const [payment_terms, setPaymentTerms] = useState<string>("cash");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/distributors", { credentials: "include" }).then((r) => r.json()).then((d) => setDistributors(d.data || []));
    fetch("/api/territories", { credentials: "include" }).then((r) => r.json()).then((d) => setTerritories(d.data || []));
    fetch("/api/agents", { credentials: "include" }).then((r) => r.json()).then((d) => setAgents(d.data || []));
    fetch("/api/routes", { credentials: "include" }).then((r) => r.json()).then((d) => setRoutes(d.data || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          store_code,
          store_name,
          store_type,
          distributor_id,
          territory_id,
          assigned_agent_id: assigned_agent_id || undefined,
          assigned_route_id: assigned_route_id || undefined,
          owner_info: { name: owner_name, phone: owner_phone, email: owner_email || undefined },
          address: {
            line1,
            line2: line2 || undefined,
            city,
            state,
            pincode,
            latitude: Number(latitude) || 0,
            longitude: Number(longitude) || 0,
            landmark: landmark || undefined,
          },
          credit_info:
            credit_limit || credit_days || payment_terms !== "cash"
              ? {
                  credit_limit: credit_limit ? Number(credit_limit) : undefined,
                  credit_days: credit_days ? Number(credit_days) : undefined,
                  payment_terms: payment_terms as "cash" | "credit_7" | "credit_15" | "credit_30" | "credit_45",
                }
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create");
        return;
      }
      router.push("/dashboard/stores");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-slate-900">
            <StoreIcon className="size-5 text-emerald-600" />
            <CardTitle>Onboard New Retail Store & Plot on Google Route Map</CardTitle>
          </div>
          <CardDescription>
            Enter store info and location coordinates. If the store falls along an active sales route, it will automatically plot on the Google map below.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Distributor</Label>
                <Select value={distributor_id} onValueChange={setDistributorId} required>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {distributors.map((d) => (
                      <SelectItem key={d._id} value={d._id}>{d.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Territory</Label>
                <Select value={territory_id} onValueChange={setTerritoryId} required>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {territories.map((t) => (
                      <SelectItem key={t._id} value={t._id}>{t.territory_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigned Sales Route (optional)</Label>
                <Select value={assigned_route_id} onValueChange={setAssignedRouteId}>
                  <SelectTrigger><SelectValue placeholder="Select Route" /></SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r._id} value={r._id}>
                        {r.route_name} ({r.route_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigned Agent (optional)</Label>
                <Select value={assigned_agent_id} onValueChange={setAssignedAgentId}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a._id} value={a._id}>
                        {a.first_name} {a.last_name} ({a.agent_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store_code">Store code</Label>
                <Input id="store_code" value={store_code} onChange={(e) => setStoreCode(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_type">Type</Label>
                <Select value={store_type} onValueChange={setStoreType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kirana">Kirana</SelectItem>
                    <SelectItem value="supermarket">Supermarket</SelectItem>
                    <SelectItem value="departmental">Departmental</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_name">Store name</Label>
              <Input id="store_name" value={store_name} onChange={(e) => setStoreName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Owner Info</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Name" value={owner_name} onChange={(e) => setOwnerName(e.target.value)} required />
                <Input placeholder="Phone" value={owner_phone} onChange={(e) => setOwnerPhone(e.target.value)} required />
                <Input placeholder="Email" type="email" value={owner_email} onChange={(e) => setOwnerEmail(e.target.value)} />
              </div>
            </div>

            {/* Interactive Google Map Store Location & Address Picker */}
            <div className="space-y-2">
              <Label className="font-semibold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="size-4 text-emerald-600" /> Interactive Google Map — Search & Select Store Location
                </span>
                <span className="text-xs text-slate-500 font-normal">Search shop address or click directly on map to set coordinates & auto-fill address</span>
              </Label>
              <StoreLocationPickerMap
                latitude={latitude}
                longitude={longitude}
                height="340px"
                onLocationSelect={(loc) => {
                  setLatitude(loc.latitude);
                  setLongitude(loc.longitude);
                  if (loc.line1) setLine1(loc.line1);
                  if (loc.city) setCity(loc.city);
                  if (loc.state) setState(loc.state);
                  if (loc.pincode) setPincode(loc.pincode);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Address & Location Details (Auto-filled from Map)</Label>
              <Input placeholder="Line 1 (e.g. Shop 14, Commercial Market)" value={line1} onChange={(e) => setLine1(e.target.value)} required />
              <Input placeholder="Line 2 (optional)" value={line2} onChange={(e) => setLine2(e.target.value)} />
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
                <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} required />
                <Input placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="33.7167"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="73.0699"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Landmark</Label>
                  <Input placeholder="Near Metro Station" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Credit Info (optional)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  placeholder="Credit limit"
                  value={credit_limit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Credit days"
                  value={credit_days}
                  onChange={(e) => setCreditDays(e.target.value)}
                />
                <Select value={payment_terms} onValueChange={setPaymentTerms}>
                  <SelectTrigger><SelectValue placeholder="Payment terms" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_7">Credit 7 days</SelectItem>
                    <SelectItem value="credit_15">Credit 15 days</SelectItem>
                    <SelectItem value="credit_30">Credit 30 days</SelectItem>
                    <SelectItem value="credit_45">Credit 45 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={loading}>{loading ? "Creating Store…" : "Create Store & Save Location"}</Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/stores">Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
