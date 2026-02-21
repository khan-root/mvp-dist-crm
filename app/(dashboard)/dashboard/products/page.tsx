import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

async function getProducts() {
  const cookieStore = await cookies();
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load products");
  return res.json() as Promise<{
    data: Array<{
      _id: string;
      product_code: string;
      product_name: string;
      sku: string;
      unit_of_measure: string;
      pricing?: { mrp: number; base_cost: number };
      inventory?: { current_stock: number };
    }>;
  }>;
}

export default async function ProductsPage() {
  const { data: list } = await getProducts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <CardDescription>Product catalog</CardDescription>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All products</CardTitle>
          <Button asChild size="sm">
            <Link href="/dashboard/products/new">
              <Plus className="size-4" />
              Add product
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No products yet. Add categories and brands first, then products.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="font-mono">{p.product_code}</TableCell>
                    <TableCell>{p.product_name}</TableCell>
                    <TableCell className="font-mono">{p.sku}</TableCell>
                    <TableCell>{p.unit_of_measure}</TableCell>
                    <TableCell>Rs.{p.pricing?.mrp?.toLocaleString()}</TableCell>
                    <TableCell>{p.inventory?.current_stock ?? 0}</TableCell>
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
