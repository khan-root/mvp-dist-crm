import { StateCreator } from "zustand";

export interface DistributorItem {
  _id: string;
  company_name: string;
  distributor_code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  region?: string;
  city?: string;
  status?: string;
}

export interface AgentItem {
  _id: string;
  agent_name: string;
  phone?: string;
  email?: string;
  distributor_id?: string;
  territory_id?: string;
  status?: string;
}

export interface DistributorsSlice {
  distributors: DistributorItem[];
  agents: AgentItem[];
  setDistributors: (distributors: DistributorItem[]) => void;
  addDistributor: (distributor: DistributorItem) => void;
  updateDistributor: (distributor: DistributorItem) => void;
  setAgents: (agents: AgentItem[]) => void;
  addAgent: (agent: AgentItem) => void;
  updateAgent: (agent: AgentItem) => void;
}

export const createDistributorsSlice: StateCreator<DistributorsSlice, [], [], DistributorsSlice> = (set) => ({
  distributors: [],
  agents: [],

  setDistributors: (distributors) => set({ distributors }),
  addDistributor: (distributor) => set((state) => ({ distributors: [distributor, ...state.distributors] })),
  updateDistributor: (distributor) =>
    set((state) => ({
      distributors: state.distributors.map((d) => (d._id === distributor._id ? distributor : d)),
    })),

  setAgents: (agents) => set({ agents }),
  addAgent: (agent) => set((state) => ({ agents: [agent, ...state.agents] })),
  updateAgent: (agent) =>
    set((state) => ({
      agents: state.agents.map((a) => (a._id === agent._id ? agent : a)),
    })),
});
