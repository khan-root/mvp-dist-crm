export const dynamic = "force-dynamic";

import { dbConnect } from "@/lib/db";
import { Store, Agent, Territory } from "@/lib/models";
import { getCurrentUser } from "@/lib/user";
import { StoresClientView } from "./stores-client-view";

async function getStoresData() {
  await dbConnect();
  const user = await getCurrentUser();
  const tenantId = user?.tenant_id;
  if (!tenantId) return { list: [], agents: [], territories: [] };

  const [stores, agents, territories] = await Promise.all([
    Store.find({ tenant_id: tenantId, is_active: true })
      .sort({ created_at: -1 })
      .populate("assigned_agent_id", "agent_code first_name last_name personal_info")
      .lean(),
    Agent.find({ tenant_id: tenantId, is_active: true })
      .sort({ first_name: 1 })
      .lean(),
    Territory.find({ tenant_id: tenantId, is_active: true })
      .sort({ territory_name: 1 })
      .lean(),
  ]);

  return {
    list: (stores || []).map((s: any) => ({
      _id: s._id.toString(),
      store_code: s.store_code,
      store_name: s.store_name,
      store_type: s.store_type,
      owner_info: s.owner_info,
      address: s.address,
      assigned_agent_id: s.assigned_agent_id
        ? {
            _id: s.assigned_agent_id._id.toString(),
            agent_code: s.assigned_agent_id.agent_code,
            first_name: s.assigned_agent_id.first_name,
            last_name: s.assigned_agent_id.last_name,
          }
        : null,
    })),
    agents: (agents || []).map((a: any) => ({
      _id: a._id.toString(),
      agent_code: a.agent_code,
      first_name: a.first_name,
      last_name: a.last_name,
    })),
    territories: (territories || []).map((t: any) => ({
      _id: t._id.toString(),
      territory_name: t.territory_name,
      territory_code: t.territory_code,
    })),
  };
}

export default async function StoresPage() {
  const { list, agents, territories } = await getStoresData();

  return (
    <div className="space-y-6 w-full">
      <StoresClientView stores={list} agents={agents} territories={territories} />
    </div>
  );
}
