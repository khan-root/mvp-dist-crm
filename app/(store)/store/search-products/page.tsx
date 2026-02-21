"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";

interface SearchResult {
  _id: string;
  product_name: string;
  product_code: string;
  unit_price: number;
  distributor_id: string;
  distributor_name: string;
  distributor_code?: string;
}

export default function SearchProductsPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/store/products/search?q=${encodeURIComponent(q.trim())}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setResults(data.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/store">← Dashboard</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Search products</CardTitle>
          <CardDescription>
            Search across all distributors (warehouses). See distributor name and price, then order directly—no agent needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="e.g. rice, candy, oil"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              <Search className="size-4" />
              Search
            </Button>
          </form>
          {loading && <p className="text-sm text-muted-foreground">Searching…</p>}
          {searched && !loading && (
            <>
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products found. Try another search.</p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2">Product</th>
                        <th className="text-left p-2">Distributor / Warehouse</th>
                        <th className="text-right p-2">Price</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => (
                        <tr key={r._id} className="border-t">
                          <td className="p-2">
                            <span className="font-medium">{r.product_name}</span>
                            <span className="text-muted-foreground ml-1">({r.product_code})</span>
                          </td>
                          <td className="p-2">{r.distributor_name || "—"}</td>
                          <td className="p-2 text-right">Rs.{r.unit_price.toLocaleString()}</td>
                          <td className="p-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/store/place-order?distributor_id=${r.distributor_id}`}>
                                Order from here
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
