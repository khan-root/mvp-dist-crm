export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { getServerApiBaseUrl } from "@/lib/api";
import { DistributorsClientView, DistributorItem } from "./distributors-client-view";

async function getDistributors() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/distributors?page=1&limit=10`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return { data: [], total: 0 };
  return res.json() as Promise<{ data: DistributorItem[]; total?: number }>;
}

export default async function DistributorsPage() {
  const { data: list = [], total = 0 } = await getDistributors();
  return <DistributorsClientView initialDistributors={list} initialTotalRecords={total} />;
}
