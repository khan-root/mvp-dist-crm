"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GlobalGeoFilter, GeoFilterState } from "@/components/global-geo-filter";
import { matchesProvince } from "@/lib/data/citiesData";
import { PaginationControls } from "@/components/ui/pagination-controls";

type StoreRef = { _id: string; store_code?: string; store_name?: string; address?: { city?: string; province?: string } };
type AgentRef = { _id: string; agent_code?: string; first_name?: string; last_name?: string };

interface OrderRow {
  _id: string;
  order_number: string;
  grand_total: number;
  status: string;
  payment_status: string;
  delivery_status?: string;
  order_date: string;
  store_id?: StoreRef | null;
  agent_id?: AgentRef | null;
}

interface OrdersTableProps {
  orders: OrderRow[];
  total: number;
  agents: Array<{ _id: string; agent_code: string; first_name: string; last_name: string }>;
  stores: Array<{ _id: string; store_code: string; store_name: string }>;
}

const STATUS_OPTIONS = ["", "draft", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const DELIVERY_OPTIONS = ["", "pending", "processing", "shipped", "out_for_delivery", "delivered", "failed"];

export function OrdersTable({ orders, total, agents, stores }: OrdersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [geoFilters, setGeoFilters] = useState<GeoFilterState>({
    region: "all",
    city: "all",
    domain: "all",
    territoryId: "all",
    distributorId: "all",
    search: "",
  });

  function updateFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("skip");
    router.push(`/dashboard/orders?${p.toString()}`);
  }

  const status = searchParams.get("status") ?? "";
  const agentId = searchParams.get("agent_id") ?? "";
  const storeId = searchParams.get("store_id") ?? "";
  const deliveryStatus = searchParams.get("delivery_status") ?? "";

  function setFilter(key: string, value: string) {
    updateFilter(key, value === "_all" ? "" : value);
  }

  const filteredOrders = orders.filter((o) => {
    // 1. Search
    if (geoFilters.search) {
      const q = geoFilters.search.toLowerCase();
      const matchNum = o.order_number?.toLowerCase().includes(q);
      const matchStore = o.store_id?.store_name?.toLowerCase().includes(q);
      const matchAgent = `${o.agent_id?.first_name} ${o.agent_id?.last_name}`.toLowerCase().includes(q);
      if (!matchNum && !matchStore && !matchAgent) return false;
    }

    // 2. Region / Province
    if (geoFilters.region !== "all" && o.store_id?.address) {
      if (!matchesProvince(geoFilters.region, o.store_id.address.province, o.store_id.address.city)) {
        return false;
      }
    }

    // 3. City
    if (geoFilters.city !== "all" && o.store_id?.address?.city) {
      if (!o.store_id.address.city.toLowerCase().includes(geoFilters.city.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4 w-full">
      <GlobalGeoFilter
        onFilterChange={(filters) => {
          setGeoFilters(filters);
          setCurrentPage(1);
        }}
        placeholderSearch="Search orders by order #, store name, or agent…"
      />

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b pb-4">
          <CardTitle className="text-lg font-bold text-slate-900">Orders List ({filteredOrders.length} / {total})</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={status || "_all"} onValueChange={(v) => setFilter("status", v)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="_all">All status</SelectItem>
                {STATUS_OPTIONS.filter(Boolean).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={deliveryStatus || "_all"} onValueChange={(v) => setFilter("delivery_status", v)}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Delivery" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="_all">All delivery</SelectItem>
                {DELIVERY_OPTIONS.filter(Boolean).map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={agentId || "_all"} onValueChange={(v) => setFilter("agent_id", v)}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="_all">All agents</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a._id} value={a._id}>{a.agent_code} · {[a.first_name, a.last_name].filter(Boolean).join(" ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={storeId || "_all"} onValueChange={(v) => setFilter("store_id", v)}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Store" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="_all">All stores</SelectItem>
                {stores.map((s) => (
                  <SelectItem key={s._id} value={s._id}>{s.store_code} · {s.store_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(status || agentId || storeId || deliveryStatus) && (
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/orders")} className="h-8 text-xs">Clear</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {filteredOrders.length === 0 ? (
            <p className="text-slate-500 py-8 text-center text-sm">No orders match your filter criteria.</p>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold">Order #</TableHead>
                    <TableHead className="font-semibold">Store Outlet</TableHead>
                    <TableHead className="font-semibold">Sales Agent</TableHead>
                    <TableHead className="font-semibold">Order Date</TableHead>
                    <TableHead className="font-semibold font-mono">Grand Total</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Delivery</TableHead>
                    <TableHead className="font-semibold">Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((o) => (
                    <TableRow key={o._id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-emerald-700">{o.order_number}</TableCell>
                      <TableCell className="font-medium text-sm text-slate-900">
                        {typeof o.store_id === "object" && o.store_id ? o.store_id.store_name ?? o.store_id.store_code : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {typeof o.agent_id === "object" && o.agent_id
                          ? [o.agent_id.first_name, o.agent_id.last_name].filter(Boolean).join(" ")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {new Date(o.order_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-bold text-sm font-mono text-slate-900">Rs. {o.grand_total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs bg-slate-50">
                          {o.delivery_status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={o.payment_status === "paid" ? "success" : "outline"} className="capitalize text-xs">
                          {o.payment_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={filteredOrders.length}
                pageSize={pageSize}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
