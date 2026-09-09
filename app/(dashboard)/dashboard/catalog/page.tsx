import { cookies } from "next/headers";
import { getServerApiBaseUrl } from "@/lib/api";
import { CatalogClientView } from "./catalog-client-view";

async function getCategories() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/categories`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

async function getBrands() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/brands`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load brands");
  return res.json();
}

async function getDistributors() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/distributors`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load distributors");
  return res.json();
}

export default async function CatalogPage() {
  const [catRes, brandRes, distRes] = await Promise.all([getCategories(), getBrands(), getDistributors()]);
  return (
    <CatalogClientView
      categories={catRes.data}
      brands={brandRes.data}
      distributors={distRes.data}
    />
  );
}
