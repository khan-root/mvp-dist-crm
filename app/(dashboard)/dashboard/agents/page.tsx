export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { AgentsClientView } from "./agents-client-view";
import { getServerApiBaseUrl } from "@/lib/api";

async function getAgents() {
  const cookieStore = await cookies();
  const res = await fetch(`${getServerApiBaseUrl()}/api/agents`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return { data: [] };
  return res.json() as Promise<{
    data: Array<{
      _id: string;
      agent_code: string;
      first_name: string;
      last_name: string;
      personal_info?: { email: string; phone: string };
    }>;
  }>;
}

export default async function AgentsPage() {
  const { data: list } = await getAgents();

  return (
    <div className="space-y-6 w-full">
      <AgentsClientView agents={list || []} />
    </div>
  );
}
