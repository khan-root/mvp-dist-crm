"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewDistributorPage() {
  const router = useRouter();
  const [company_name, setCompanyName] = useState("");
  const [distributor_code, setDistributorCode] = useState("");
  const [gst_number, setGstNumber] = useState("");
  const [pan_number, setPanNumber] = useState("");
  const [business_license, setBusinessLicense] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/distributors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          company_name,
          distributor_code,
          gst_number,
          pan_number: pan_number || undefined,
          business_license: business_license || undefined,
          contact: { phone, email, website: website || undefined },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create");
        return;
      }
      router.push("/dashboard/distributors");
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
          <CardTitle>Add distributor</CardTitle>
          <CardDescription>Create a new distributor in your network</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company name</Label>
              <Input id="company_name" value={company_name} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distributor_code">Distributor code</Label>
                <Input id="distributor_code" value={distributor_code} onChange={(e) => setDistributorCode(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST number</Label>
                <Input id="gst_number" value={gst_number} onChange={(e) => setGstNumber(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pan_number">PAN number</Label>
                <Input id="pan_number" value={pan_number} onChange={(e) => setPanNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_license">Business license</Label>
                <Input id="business_license" value={business_license} onChange={(e) => setBusinessLicense(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" placeholder="https://" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/distributors">Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
