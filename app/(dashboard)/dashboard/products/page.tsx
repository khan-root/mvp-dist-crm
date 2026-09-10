export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { getServerApiBaseUrl } from "@/lib/api";
import { ProductsClientView, ProductItem } from "./products-client-view";

async function getProducts() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/products?page=1&limit=10`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return { data: [], total: 0 };
  return res.json() as Promise<{ data: ProductItem[]; total?: number }>;
}

export default async function ProductsPage() {
  const { data: list = [], total = 0 } = await getProducts();
  return <ProductsClientView initialProducts={list} initialTotalRecords={total} />;
}
