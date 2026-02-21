import { cookies } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { TerritoryForm } from "./territory-form";

async function getTerritories() {
  const cookieStore = await cookies();
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/territories`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load territories");
  return res.json() as Promise<{ data: Array<{ _id: string; territory_name: string; territory_code: string; description?: string }> }>;
}

export default async function TerritoriesPage() {
  const { data: list } = await getTerritories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Territories</h1>
          <CardDescription>Define sales territories for agents and stores</CardDescription>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All territories</CardTitle>
          <TerritoryForm trigger={<Button size="sm"><Plus className="size-4" /> Add territory</Button>} />
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No territories yet. Add one to assign to agents and stores.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((t) => (
                  <TableRow key={t._id}>
                    <TableCell className="font-mono">{t.territory_code}</TableCell>
                    <TableCell>{t.territory_name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.description || "—"}</TableCell>
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
