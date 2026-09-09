export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { getServerApiBaseUrl } from "@/lib/api";
import { TelematicsClientView } from "./telematics-client-view";

async function getTelematicsData() {
  const cookieStore = await cookies();
  const headers = { Cookie: cookieStore.toString() };

  const res = await fetch(`${getServerApiBaseUrl()}/api/telematics`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      metrics: {
        total_visits_today: 0,
        verified_visits: 0,
        flagged_visits: 0,
        geofence_pass_rate_pct: 100,
        active_agents_count: 0,
        assigned_routes_count: 0,
      },
      agents: [],
      stores: [],
      visits: [],
      routes: [],
    };
  }

  const d = await res.json();
  return d.data;
}

export default async function TelematicsPage() {
  const data = await getTelematicsData();
  return <TelematicsClientView initialData={data} />;
}
