"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RegisterStorePage() {
  const router = useRouter();
  const [store_name, setStoreName] = useState("");
  const [store_type, setStoreType] = useState<string>("kirana");
  const [owner_name, setOwnerName] = useState("");
  const [owner_phone, setOwnerPhone] = useState("");
  const [owner_email, setOwnerEmail] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          store_name,
          store_type,
          owner_info: { name: owner_name, phone: owner_phone, email: owner_email },
          address: { line1, city, state, pincode, latitude, longitude },
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      router.push("/store");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Register your shop</CardTitle>
          <CardDescription>Create your store account and start managing your shop.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store_name">Shop name</Label>
              <Input id="store_name" value={store_name} onChange={(e) => setStoreName(e.target.value)} placeholder="Your shop name" required />
            </div>
            <div className="space-y-2">
              <Label>Shop type</Label>
              <Select value={store_type} onValueChange={setStoreType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kirana">Kirana</SelectItem>
                  <SelectItem value="supermarket">Supermarket</SelectItem>
                  <SelectItem value="departmental">Departmental</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Owner / Contact</Label>
              <Input placeholder="Your name" value={owner_name} onChange={(e) => setOwnerName(e.target.value)} required />
              <div className="grid grid-cols-2 gap-2">
                <Input type="tel" placeholder="Phone" value={owner_phone} onChange={(e) => setOwnerPhone(e.target.value)} required />
                <Input type="email" placeholder="Email" value={owner_email} onChange={(e) => setOwnerEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Address line 1" value={line1} onChange={(e) => setLine1(e.target.value)} required />
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
                <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} required />
                <Input placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" step="any" placeholder="Latitude (optional)" value={latitude || ""} onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : 0)} />
                <Input type="number" step="any" placeholder="Longitude (optional)" value={longitude || ""} onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : 0)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" disabled={loading}>{loading ? "Registering…" : "Register my shop"}</Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account? <Link href="/login" className="text-primary underline">Sign in</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
