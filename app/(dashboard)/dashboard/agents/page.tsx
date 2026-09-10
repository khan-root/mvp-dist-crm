export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { AgentsClientView } from "./agents-client-view";
import { getServerApiBaseUrl } from "@/lib/api";

async function getAgents() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/agents?page=1&limit=10`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return { data: [], total: 0 };
  return res.json() as Promise<{
    data: Array<{
      _id: string;
      agent_code: string;
      first_name: string;
      last_name: string;
      personal_info?: { email: string; phone: string };
    }>;
    total?: number;
  }>;
}

export default async function AgentsPage() {
  const { data: list, total = 0 } = await getAgents();

  return (
    <div className="space-y-6 w-full">
      <AgentsClientView initialAgents={list || []} initialTotalRecords={total} />
    </div>
  );
}
