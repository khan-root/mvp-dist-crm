import { cookies } from "next/headers";
import { getServerApiBaseUrl } from "@/lib/api";
import { InventoryClientView } from "./inventory-client-view";

async function getInventory() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/inventory`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) {
    return {
      data: {
        summary: {
          total_skus: 0,
          total_units: 0,
          low_stock_count: 0,
          out_of_stock_count: 0,
          total_valuation: 0,
        },
        items: [],
        recent_movements: [],
      },
    };
  }
  return res.json();
}

export default async function InventoryPage() {
  const { data } = await getInventory();
  return (
    <InventoryClientView
      initialSummary={data.summary}
      initialItems={data.items}
      initialMovements={data.recent_movements}
    />
  );
}
