"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RouteGoogleMap } from "@/components/route-google-map";
import { PermissionGuard } from "@/components/permission-guard";
import {
  ShieldCheck,
  MapPin,
  Users,
  AlertTriangle,
  RefreshCw,
  Navigation,
  Compass,
  CheckCircle2,
  Clock,
  Radio,
  Store as StoreIcon,
} from "lucide-react";

interface TelematicsData {
  metrics: {
    total_visits_today: number;
    verified_visits: number;
    flagged_visits: number;
    geofence_pass_rate_pct: number;
    active_agents_count: number;
    assigned_routes_count: number;
  };
  agents: Array<{
    _id: string;
    agent_code: string;
    name: string;
    phone: string;
    territory_name: string;
    latitude: number;
    longitude: number;
  }>;
  stores: Array<{
    _id: string;
    store_code: string;
    store_name: string;
    owner_name: string;
    owner_phone: string;
    latitude: number;
    longitude: number;
    city: string;
  }>;
  visits: Array<{
    _id: string;
    store_name: string;
    store_code: string;
    owner_name: string;
    owner_phone: string;
    check_in_time: string;
    latitude: number;
    longitude: number;
    distance_meters: number;
    is_geofence_verified: boolean;
    is_flagged: boolean;
    flag_reason?: string;
    notes?: string;
  }>;
  routes: Array<{
    _id: string;
    route_name: string;
    route_code: string;
    distance_km: number;
  }>;
}

export function TelematicsClientView({ initialData }: { initialData: TelematicsData }) {
  const [data, setData] = useState<TelematicsData>(initialData);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/telematics", { credentials: "include" });
      const d = await res.json();
      if (d.data) setData(d.data);
    } catch {
      // Graceful catch
    } finally {
      setRefreshing(false);
    }
  }

  const { metrics, agents, stores, visits } = data;

  return (
    <PermissionGuard module="agents">
      <div className="space-y-8 w-full">
        {/* Banner Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-md">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Radio className="size-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Live Telematics & Geofence Heatmap Radar</h1>
                <p className="text-sm text-slate-300">
                  Real-time GPS validation, anti-fraud visit monitoring, and field force movement telemetry.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1 gap-2 font-mono text-xs">
              <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Radar Sync</span>
            </Badge>

            <Button
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Updating Telematics…" : "Refresh Radar"}</span>
            </Button>
          </div>
        </div>

        {/* Operational Telematics KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Geofence Pass Rate</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <ShieldCheck className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">{metrics.geofence_pass_rate_pct}%</div>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Verified within 100m radius</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Flagged Out-of-Bounds</CardTitle>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
                <AlertTriangle className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">{metrics.flagged_visits}</div>
              <p className="text-xs text-rose-600 font-semibold mt-1">Check-ins outside 100m threshold</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Store Visits Today</CardTitle>
              <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
                <MapPin className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">{metrics.total_visits_today}</div>
              <p className="text-xs text-slate-500 mt-1">Recorded field agent check-ins</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Field Fleet</CardTitle>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                <Users className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">{metrics.active_agents_count}</div>
              <p className="text-xs text-slate-500 mt-1">On-duty agents on assigned routes</p>
            </CardContent>
          </Card>
        </div>

        {/* Live Heatmap Radar Map Card */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Compass className="size-5 text-emerald-600" />
                Live Fleet Telematics & Visit Heatmap Radar
              </CardTitle>
              <CardDescription>
                Real-time position markers for market outlets (🏪), verified visits (🟢), and flagged out-of-bounds check-ins (🚨).
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <Badge variant="outline" className="bg-slate-900 text-slate-100 border-slate-700 gap-1">
                <span>🏪 Retail Store</span>
              </Badge>
              <Badge variant="outline" className="bg-indigo-950 text-sky-300 border-indigo-700 gap-1">
                <span>🚴 Order Booker Agent</span>
              </Badge>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 gap-1">
                <span>🟢 Verified Log Pin (&le;100m)</span>
              </Badge>
              <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-300 gap-1">
                <span>🚨 Out-of-Bounds Log Pin</span>
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <RouteGoogleMap
              stores={stores}
              agents={agents}
              visits={visits}
              readOnly={true}
              height="450px"
            />
          </CardContent>
        </Card>

        {/* Real-time Visit Audit Feed Table */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-600" />
              Field Visit Verification & Anti-Fraud Audit Log
            </CardTitle>
            <CardDescription>
              Inspection log recording exact check-in distance in meters, GPS validation badges, and route deviation flags.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {visits.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No market store visits recorded today yet.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Shopkeeper Outlet</TableHead>
                    <TableHead>Check-in Time</TableHead>
                    <TableHead>GPS Proximity Distance</TableHead>
                    <TableHead>Geofence Status</TableHead>
                    <TableHead>Remarks / Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((v) => (
                    <TableRow key={v._id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">{v.store_name}</span>
                          <span className="text-xs text-slate-500 font-mono">{v.store_code} · {v.owner_name} ({v.owner_phone})</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-slate-400" />
                          <span>{new Date(v.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-bold text-slate-900">
                        {v.distance_meters} meters
                      </TableCell>

                      <TableCell>
                        {v.is_geofence_verified ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs">
                            <CheckCircle2 className="size-3 text-emerald-600" /> Verified Pass
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1 text-xs">
                            <AlertTriangle className="size-3 text-rose-600" /> Out-of-Bounds Flagged
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                        {v.flag_reason || v.notes || "Standard Routine Visit Check-in"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
