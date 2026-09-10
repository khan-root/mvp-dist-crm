"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoreLocationPickerMap, SelectedLocation } from "@/components/store-location-picker-map";
import { Badge } from "@/components/ui/badge";
import { toastApiError } from "@/lib/utils";
import {
  Store as StoreIcon,
  ArrowLeft,
  MapPin,
  User as UserIcon,
  Phone,
  Mail,
  Route as RouteIcon,
  CheckCircle2,
  Compass,
  Sparkles,
  CreditCard,
  Building2,
  Loader2,
} from "lucide-react";

interface AgentContextData {
  agent: {
    _id: string;
    agent_code: string;
    first_name: string;
    last_name: string;
    distributor_id?: string;
    distributor_name?: string;
    territory_id?: string;
    territory_name?: string;
  };
  routes: Array<{
    _id: string;
    route_name: string;
    route_code: string;
    territory_id?: string;
    territory_name?: string;
    distributor_id?: string;
    distributor_name?: string;
  }>;
  territories: Array<{ _id: string; territory_name: string; territory_code: string }>;
  distributors: Array<{ _id: string; company_name: string; distributor_code: string }>;
  suggested_store_code: string;
}

const STORE_TYPES = [
  { value: "kirana", label: "Kirana / General Store" },
  { value: "supermarket", label: "Supermarket / Mart" },
  { value: "departmental", label: "Departmental Store" },
  { value: "pharmacy", label: "Pharmacy / Medical" },
  { value: "electronics", label: "Electronics Shop" },
  { value: "clothing", label: "Clothing / Apparel" },
  { value: "other", label: "Other Retail Outlet" },
];

export default function AgentNewStorePage() {
  const router = useRouter();
  const [contextLoading, setContextLoading] = useState(true);
  const [contextData, setContextData] = useState<AgentContextData | null>(null);

  const [store_code, setStoreCode] = useState("");
  const [store_name, setStoreName] = useState("");
  const [store_type, setStoreType] = useState<string>("kirana");
  const [assigned_route_id, setAssignedRouteId] = useState("");
  const [distributor_id, setDistributorId] = useState("");
  const [territory_id, setTerritoryId] = useState("");

  const [owner_name, setOwnerName] = useState("");
  const [owner_phone, setOwnerPhone] = useState("");
  const [owner_email, setOwnerEmail] = useState("");

  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState("");
  const [latitude, setLatitude] = useState<number>(33.6844);
  const [longitude, setLongitude] = useState<number>(73.0479);

  const [payment_terms, setPaymentTerms] = useState<string>("cash");
  const [credit_limit, setCreditLimit] = useState("");
  const [credit_days, setCreditDays] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetch("/api/agent/store-context", { credentials: "include" })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.data) {
          const d: AgentContextData = resData.data;
          setContextData(d);
          setStoreCode(d.suggested_store_code || "");
          
          // Auto select first route if available
          if (d.routes.length > 0) {
            const firstR = d.routes[0];
            setAssignedRouteId(firstR._id);
            setDistributorId(firstR.distributor_id || d.agent.distributor_id || (d.distributors[0]?._id || ""));
            setTerritoryId(firstR.territory_id || d.agent.territory_id || (d.territories[0]?._id || ""));
          } else {
            setDistributorId(d.agent.distributor_id || (d.distributors[0]?._id || ""));
            setTerritoryId(d.agent.territory_id || (d.territories[0]?._id || ""));
          }
        }
        setContextLoading(false);
      })
      .catch((err) => {
        console.error("Context fetch error:", err);
        setContextLoading(false);
      });
  }, []);

  function handleRouteSelect(routeId: string) {
    setAssignedRouteId(routeId);
    if (!contextData) return;
    const selectedRoute = contextData.routes.find((r) => r._id === routeId);
    if (selectedRoute) {
      if (selectedRoute.distributor_id) setDistributorId(selectedRoute.distributor_id);
      if (selectedRoute.territory_id) setTerritoryId(selectedRoute.territory_id);
    }
  }

  function handleLocationSelect(loc: SelectedLocation) {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    if (loc.line1) setLine1(loc.line1);
    if (loc.city) setCity(loc.city);
    if (loc.state) setState(loc.state);
    if (loc.pincode) setPincode(loc.pincode);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    if (!distributor_id || !territory_id) {
      const msg = "Distributor and Territory assignment are required.";
      toastApiError(msg);
      setError(msg);
      setLoading(false);
      return;
    }

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
          assigned_agent_id: contextData?.agent._id,
          assigned_route_id: assigned_route_id || undefined,
          owner_info: {
            name: owner_name,
            phone: owner_phone,
            email: owner_email || undefined,
          },
          address: {
            line1: line1 || "Main Market",
            line2: line2 || undefined,
            city: city || "City",
            state: state || "State",
            pincode: pincode || "00000",
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
        toastApiError(data, "Failed to onboard store");
        setError(data.error || "Failed to onboard store");
        return;
      }

      setSuccessMsg(`Store "${store_name}" successfully onboarded!`);
      setTimeout(() => {
        router.push("/agent/shops");
        router.refresh();
      }, 1200);
    } catch (err: any) {
      toastApiError(err, "Network error while saving store");
      setError(err?.message || "Network error while saving store");
    } finally {
      setLoading(false);
    }
  }

  if (contextLoading) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-3">
        <div className="size-10 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-600">Loading Agent Field Onboarding Setup…</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-900">
          <Link href="/agent/shops">
            <ArrowLeft className="size-4 mr-1.5" /> Back to Assigned Outlets
          </Link>
        </Button>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-3 py-1">
          <Sparkles className="size-3.5" />
          <span>Field Onboarding Active</span>
        </Badge>
      </div>

      <Card className="border-slate-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <StoreIcon className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">Onboard New Retail Store</CardTitle>
              <CardDescription className="text-slate-300 text-xs">
                Register a new retail shop discovered on your sales route. GPS location will map the outlet automatically.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="size-4" /> {successMsg}
              </div>
            )}

            {/* Store Basics */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2 text-slate-900 font-semibold text-sm">
                <Building2 className="size-4 text-emerald-600" />
                <span>Store Identity & Classification</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="store_name" className="text-xs font-semibold text-slate-700">
                    Store / Shop Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="store_name"
                    placeholder="e.g. Al-Madina Super Mart"
                    value={store_name}
                    onChange={(e) => setStoreName(e.target.value)}
                    required
                    className="bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="store_code" className="text-xs font-semibold text-slate-700">
                    Store Code <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="store_code"
                    placeholder="e.g. STR-92811"
                    value={store_code}
                    onChange={(e) => setStoreCode(e.target.value)}
                    required
                    className="font-mono text-xs bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Store Category / Type <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={store_type} onValueChange={setStoreType}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {STORE_TYPES.map((st) => (
                        <SelectItem key={st.value} value={st.value}>
                          {st.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Assigned Route <span className="text-slate-400 font-normal">(Optional)</span>
                  </Label>
                  <Select value={assigned_route_id} onValueChange={handleRouteSelect}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white">
                      <SelectValue placeholder="Select Route" />
                    </SelectTrigger>
                    <SelectContent>
                      {contextData?.routes.map((r) => (
                        <SelectItem key={r._id} value={r._id}>
                          <div className="flex items-center gap-1.5">
                            <RouteIcon className="size-3.5 text-emerald-600" />
                            <span>{r.route_name} ({r.route_code})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Owner & Contact Information */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b pb-2 text-slate-900 font-semibold text-sm">
                <UserIcon className="size-4 text-emerald-600" />
                <span>Shop Owner Contact Info</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="owner_name" className="text-xs font-semibold text-slate-700">
                    Owner / Manager Name <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <UserIcon className="size-4 absolute left-3 top-3 text-slate-400" />
                    <Input
                      id="owner_name"
                      placeholder="e.g. Muhammad Aslam"
                      value={owner_name}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                      className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="owner_phone" className="text-xs font-semibold text-slate-700">
                    Phone / Whatsapp <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="size-4 absolute left-3 top-3 text-slate-400" />
                    <Input
                      id="owner_phone"
                      placeholder="e.g. +92 300 1234567"
                      value={owner_phone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      required
                      className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="owner_email" className="text-xs font-semibold text-slate-700">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <Mail className="size-4 absolute left-3 top-3 text-slate-400" />
                    <Input
                      id="owner_email"
                      type="email"
                      placeholder="e.g. store@gmail.com"
                      value={owner_email}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* GPS Location & Map Selector */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                  <MapPin className="size-4 text-emerald-600" />
                  <span>GPS Location & Geofence Coordinates</span>
                </div>
                <Badge variant="secondary" className="text-[11px] font-mono bg-slate-100 text-slate-700">
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </Badge>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200">
                <StoreLocationPickerMap
                  latitude={latitude}
                  longitude={longitude}
                  onLocationSelect={handleLocationSelect}
                  height="300px"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="line1" className="text-xs font-semibold text-slate-700">
                    Address Line 1 <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="line1"
                    placeholder="e.g. Shop # 14, Main Commercial Market"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    required
                    className="bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-semibold text-slate-700">
                    City <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-xs font-semibold text-slate-700">
                    State / Province <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    className="bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pincode" className="text-xs font-semibold text-slate-700">
                    Postal / Zip Code <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="pincode"
                    placeholder="Zip code"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    required
                    className="bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                  <Label htmlFor="landmark" className="text-xs font-semibold text-slate-700">
                    Nearby Landmark <span className="text-slate-400 font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="landmark"
                    placeholder="e.g. Opposite Central Mosque / Near General Bus Stand"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Payment & Credit Terms */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b pb-2 text-slate-900 font-semibold text-sm">
                <CreditCard className="size-4 text-emerald-600" />
                <span>Payment Terms & Credit Limit</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Payment Terms</Label>
                  <Select value={payment_terms} onValueChange={setPaymentTerms}>
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash on Delivery (COD)</SelectItem>
                      <SelectItem value="credit_7">7 Days Credit</SelectItem>
                      <SelectItem value="credit_15">15 Days Credit</SelectItem>
                      <SelectItem value="credit_30">30 Days Credit</SelectItem>
                      <SelectItem value="credit_45">45 Days Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {payment_terms !== "cash" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="credit_limit" className="text-xs font-semibold text-slate-700">
                        Credit Limit (Rs.)
                      </Label>
                      <Input
                        id="credit_limit"
                        type="number"
                        placeholder="e.g. 50000"
                        value={credit_limit}
                        onChange={(e) => setCreditLimit(e.target.value)}
                        className="bg-slate-50 border-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="credit_days" className="text-xs font-semibold text-slate-700">
                        Credit Days Limit
                      </Label>
                      <Input
                        id="credit_days"
                        type="number"
                        placeholder="e.g. 15"
                        value={credit_days}
                        onChange={(e) => setCreditDays(e.target.value)}
                        className="bg-slate-50 border-slate-200"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>

          <div className="flex items-center justify-end gap-3 p-6 bg-slate-50 border-t border-slate-200 rounded-b-xl">
            <Button variant="outline" type="button" asChild disabled={loading}>
              <Link href="/agent/shops">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white min-w-[160px]">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Onboarding Store…</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <span>Save & Onboard Store</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
