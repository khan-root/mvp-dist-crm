"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentOption {
  _id: string;
  agent_code: string;
  first_name: string;
  last_name: string;
}

interface AssignAgentDropdownProps {
  storeId: string;
  currentAgentId: string | null;
  agents: AgentOption[];
}

export function AssignAgentDropdown({ storeId, currentAgentId, agents }: AssignAgentDropdownProps) {
  const router = useRouter();
  const [value, setValue] = useState<string>(currentAgentId || "_none");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(currentAgentId || "_none");
  }, [currentAgentId]);

  async function onSelect(newValue: string) {
    const agentId = newValue === "_none" ? null : newValue;
    setLoading(true);
    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ assigned_agent_id: agentId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update");
      }
      setValue(newValue);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Select value={value} onValueChange={onSelect} disabled={loading}>
      <SelectTrigger className="w-[200px] h-8">
        <SelectValue placeholder="Assign agent" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_none">— None —</SelectItem>
        {agents.map((a) => (
          <SelectItem key={a._id} value={a._id}>
            {a.agent_code} · {[a.first_name, a.last_name].filter(Boolean).join(" ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
