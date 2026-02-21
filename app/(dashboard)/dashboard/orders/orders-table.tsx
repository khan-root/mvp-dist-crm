"use client";

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

type StoreRef = { _id: string; store_code?: string; store_name?: string };
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

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
        <CardTitle>Orders ({total})</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={status || "_all"} onValueChange={(v) => setFilter("status", v)}>
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All status</SelectItem>
              {STATUS_OPTIONS.filter(Boolean).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={deliveryStatus || "_all"} onValueChange={(v) => setFilter("delivery_status", v)}>
            <SelectTrigger className="w-[150px] h-8">
              <SelectValue placeholder="Delivery" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All delivery</SelectItem>
              {DELIVERY_OPTIONS.filter(Boolean).map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={agentId || "_all"} onValueChange={(v) => setFilter("agent_id", v)}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All agents</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a._id} value={a._id}>{a.agent_code} · {[a.first_name, a.last_name].filter(Boolean).join(" ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={storeId || "_all"} onValueChange={(v) => setFilter("store_id", v)}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All stores</SelectItem>
              {stores.map((s) => (
                <SelectItem key={s._id} value={s._id}>{s.store_code} · {s.store_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(status || agentId || storeId || deliveryStatus) && (
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/orders")}>Clear</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">No orders match.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o._id}>
                  <TableCell className="font-mono">{o.order_number}</TableCell>
                  <TableCell>
                    {o.store_id && typeof o.store_id === "object"
                      ? `${(o.store_id as StoreRef).store_code || ""} · ${(o.store_id as StoreRef).store_name || ""}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {o.agent_id && typeof o.agent_id === "object"
                      ? `${(o.agent_id as AgentRef).agent_code || ""} · ${[(o.agent_id as AgentRef).first_name, (o.agent_id as AgentRef).last_name].filter(Boolean).join(" ")}`
                      : "—"}
                  </TableCell>
                  <TableCell>{o.order_date ? new Date(o.order_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>Rs.{o.grand_total?.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="secondary">{o.status}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{o.delivery_status || "pending"}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{o.payment_status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
