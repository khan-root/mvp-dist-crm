export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { getServerApiBaseUrl } from "@/lib/api";
import { DistributorsClientView, DistributorItem } from "./distributors-client-view";

async function getDistributors() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/distributors`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load distributors");
  return res.json() as Promise<{ data: DistributorItem[] }>;
}

export default async function DistributorsPage() {
  const { data: list } = await getDistributors();
  return <DistributorsClientView distributors={list} />;
}
