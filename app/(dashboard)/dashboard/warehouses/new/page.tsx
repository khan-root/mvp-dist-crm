"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toastApiError } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function NewWarehousePage() {
  const router = useRouter();
  const [distributors, setDistributors] = useState<Array<{ _id: string; company_name: string }>>([]);
  const [distributor_id, setDistributorId] = useState("");
  const [warehouse_code, setWarehouseCode] = useState("");
  const [warehouse_name, setWarehouseName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [manager_name, setManagerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/distributors", { credentials: "include" }).then((r) => r.json()).then((d) => setDistributors(d.data || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          distributor_id,
          warehouse_code,
          warehouse_name,
          address: { line1, line2: line2 || undefined, city, state, pincode: pincode || undefined },
          contact: manager_name || phone || email ? { manager_name: manager_name || undefined, phone: phone || undefined, email: email || undefined } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastApiError(data, "Failed to create warehouse");
        setError(data.error || "Failed to create warehouse");
        return;
      }
      router.push("/dashboard/warehouses");
      router.refresh();
    } catch (err: any) {
      toastApiError(err, "Network error occurred");
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Add warehouse</CardTitle>
          <CardDescription>Create a new warehouse for a distributor</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse_code">Warehouse code</Label>
                <Input id="warehouse_code" value={warehouse_code} onChange={(e) => setWarehouseCode(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse_name">Warehouse name</Label>
                <Input id="warehouse_name" value={warehouse_name} onChange={(e) => setWarehouseName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Line 1" value={line1} onChange={(e) => setLine1(e.target.value)} required />
              <Input placeholder="Line 2" value={line2} onChange={(e) => setLine2(e.target.value)} />
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
                <Input placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contact (optional)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Manager name" value={manager_name} onChange={(e) => setManagerName(e.target.value)} />
                <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create"
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/warehouses">Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
