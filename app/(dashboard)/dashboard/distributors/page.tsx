import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

async function getDistributors() {
  const cookieStore = await cookies();
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/distributors`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load distributors");
  return res.json() as Promise<{ data: Array<{ _id: string; company_name: string; distributor_code: string; gst_number: string; contact: { email: string; phone: string } }> }>;
}

export default async function DistributorsPage() {
  const { data: list } = await getDistributors();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Distributors</h1>
          <CardDescription>Manage your distributor network</CardDescription>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All distributors</CardTitle>
          <Button asChild size="sm">
            <Link href="/dashboard/distributors/new">
              <Plus className="size-4" />
              Add distributor
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No distributors yet. Add one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((d) => (
                  <TableRow key={d._id}>
                    <TableCell className="font-mono">{d.distributor_code}</TableCell>
                    <TableCell>{d.company_name}</TableCell>
                    <TableCell>{d.gst_number}</TableCell>
                    <TableCell>
                      {d.contact?.email} / {d.contact?.phone}
                    </TableCell>
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
