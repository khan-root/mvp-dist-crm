export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { getServerApiBaseUrl } from "@/lib/api";
import { ProductsClientView, ProductItem } from "./products-client-view";

async function getProducts() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/products`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load products");
  return res.json() as Promise<{ data: ProductItem[] }>;
}

export default async function ProductsPage() {
  const { data: list } = await getProducts();
  return <ProductsClientView products={list} />;
}
