import { cookies } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryForm } from "./category-form";
import { BrandForm } from "./brand-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getServerApiBaseUrl } from "@/lib/api";

async function getCategories() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/categories`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json() as Promise<{ data: Array<{ _id: string; category_name: string; category_code: string; distributor_id: string }> }>;
}

async function getBrands() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/brands`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load brands");
  return res.json() as Promise<{ data: Array<{ _id: string; brand_name: string; brand_code: string; distributor_id: string }> }>;
}

async function getDistributors() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/distributors`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load distributors");
  return res.json() as Promise<{ data: Array<{ _id: string; company_name: string }> }>;
}

export default async function CatalogPage() {
  const [catRes, brandRes, distRes] = await Promise.all([getCategories(), getBrands(), getDistributors()]);
  const categories = catRes.data;
  const brands = brandRes.data;
  const distributors = distRes.data;
  const distMap = Object.fromEntries(distributors.map((d) => [d._id, d.company_name]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Catalog setup</h1>
        <CardDescription>Categories and brands per distributor (required for products)</CardDescription>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Product categories</CardDescription>
            </div>
            <CategoryForm distributors={distributors} trigger={<Button size="sm"><Plus className="size-4" /> Add</Button>} />
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-muted-foreground py-4 text-sm">No categories. Add one to create products.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Distributor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-mono">{c.category_code}</TableCell>
                      <TableCell>{c.category_name}</TableCell>
                      <TableCell>{distMap[c.distributor_id] ?? c.distributor_id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Brands</CardTitle>
              <CardDescription>Product brands</CardDescription>
            </div>
            <BrandForm distributors={distributors} trigger={<Button size="sm"><Plus className="size-4" /> Add</Button>} />
          </CardHeader>
          <CardContent>
            {brands.length === 0 ? (
              <p className="text-muted-foreground py-4 text-sm">No brands. Add one to create products.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Distributor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((b) => (
                    <TableRow key={b._id}>
                      <TableCell className="font-mono">{b.brand_code}</TableCell>
                      <TableCell>{b.brand_name}</TableCell>
                      <TableCell>{distMap[b.distributor_id] ?? b.distributor_id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
