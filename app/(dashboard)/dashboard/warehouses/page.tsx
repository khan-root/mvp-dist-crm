import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { getServerApiBaseUrl } from "@/lib/api";

async function getWarehouses() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/warehouses`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load warehouses");
  return res.json() as Promise<{
    data: Array<{
      _id: string;
      warehouse_code: string;
      warehouse_name: string;
      address?: { city: string; state: string };
      contact?: { phone: string; manager_name: string };
    }>;
  }>;
}

export default async function WarehousesPage() {
  const { data: list } = await getWarehouses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Warehouses</h1>
          <CardDescription>Manage warehouses for inventory and delivery</CardDescription>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/warehouses/new">
            <Plus className="size-4" />
            Add warehouse
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All warehouses</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No warehouses yet. Add one to manage inventory.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((w) => (
                  <TableRow key={w._id}>
                    <TableCell className="font-mono">{w.warehouse_code}</TableCell>
                    <TableCell>{w.warehouse_name}</TableCell>
                    <TableCell>{[w.address?.city, w.address?.state].filter(Boolean).join(", ") || "—"}</TableCell>
                    <TableCell>{w.contact?.manager_name ?? w.contact?.phone ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
