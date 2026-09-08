"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NewAgentPage() {
  const router = useRouter();
  const [distributors, setDistributors] = useState<Array<{ _id: string; company_name: string }>>([]);
  const [territories, setTerritories] = useState<Array<{ _id: string; territory_name: string }>>([]);
  const [agent_code, setAgentCode] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [distributor_id, setDistributorId] = useState("");
  const [territory_id, setTerritoryId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [joining_date, setJoiningDate] = useState("");
  const [designation, setDesignation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/distributors", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setDistributors(d.data || []));
    fetch("/api/territories", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setTerritories(d.data || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          agent_code,
          first_name,
          last_name,
          distributor_id,
          territory_id,
          personal_info: { email, phone },
          employment: { joining_date: joining_date || new Date().toISOString().slice(0, 10), designation },
          ...(password ? { password } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create");
        return;
      }
      router.push("/dashboard/agents");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Add agent</CardTitle>
          <CardDescription>Register a new field agent</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Distributor</Label>
                <Select value={distributor_id} onValueChange={setDistributorId} required>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {distributors.map((d) => (
                      <SelectItem key={d._id} value={d._id}>{d.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Territory</Label>
                <Select value={territory_id} onValueChange={setTerritoryId} required>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {territories.map((t) => (
                      <SelectItem key={t._id} value={t._id}>{t.territory_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent_code">Agent code</Label>
              <Input id="agent_code" value={agent_code} onChange={(e) => setAgentCode(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First name</Label>
                <Input id="first_name" value={first_name} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input id="last_name" value={last_name} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Login password (optional)</Label>
                <Input id="password" type="password" minLength={6} placeholder="Agent will use email + this to sign in" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="joining_date">Joining date</Label>
                <Input id="joining_date" type="date" value={joining_date} onChange={(e) => setJoiningDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input id="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create"}</Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/agents">Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
