"use client";

import { useState, useEffect, useMemo } from "react";
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
import { CITIES_DATA } from "@/lib/data/citiesData";
import { UserCheck, ShieldCheck, MapPin, Briefcase, CreditCard, ArrowLeft, Target } from "lucide-react";

const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
];

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-Time Employee" },
  { value: "part_time", label: "Part-Time Contractor" },
  { value: "contract", label: "Third-Party / Agency Contract" },
];

export default function NewAgentPage() {
  const router = useRouter();

  // Reference options
  const [distributors, setDistributors] = useState<Array<{ _id: string; company_name: string }>>([]);
  const [territories, setTerritories] = useState<Array<{ _id: string; territory_name: string }>>([]);

  // Section 1: Identification & Org
  const [distributor_id, setDistributorId] = useState("");
  const [territory_id, setTerritoryId] = useState("");
  const [agent_code, setAgentCode] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");

  // Section 2: Contact & Auth
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [alternate_phone, setAlternatePhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Section 3: Geo & Address
  const [province, setProvince] = useState("Punjab");
  const [selectedCity, setSelectedCity] = useState("Lahore");
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState("");
  const [line1, setLine1] = useState("");
  const [pincode, setPincode] = useState("");

  // Section 4: Employment & Targets
  const [employment_type, setEmploymentType] = useState("full_time");
  const [joining_date, setJoiningDate] = useState("");
  const [designation, setDesignation] = useState("Order Booker");
  const [monthly_sales, setMonthlySales] = useState("");
  const [monthly_orders, setMonthlyOrders] = useState("");
  const [monthly_visits, setMonthlyVisits] = useState("20");
  const [commission_rate, setCommissionRate] = useState("");

  // Section 5: Bank Settlement
  const [bank_name, setBankName] = useState("");
  const [account_holder_name, setAccountHolderName] = useState("");
  const [account_number, setAccountNumber] = useState("");

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

  // Filter cities by selected province
  const filteredCities = useMemo(() => {
    return CITIES_DATA.filter(
      (c) => c.province.toLowerCase() === province.toLowerCase()
    );
  }, [province]);

  const activeCityName = isCustomCity ? customCity : selectedCity;

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
    if (!distributor_id) {
      setError("Please select a distributor");
      return;
    }
    if (!territory_id) {
      setError("Please select a territory");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          distributor_id,
          territory_id,
          agent_code,
          first_name,
          last_name,
          personal_info: {
            phone,
            email,
            alternate_phone: alternate_phone || undefined,
          },
          address: {
            line1: line1 || undefined,
            city: activeCityName || undefined,
            province,
            state: province,
            pincode: pincode || undefined,
            country: "Pakistan",
          },
          employment: {
            joining_date: joining_date || new Date().toISOString().slice(0, 10),
            employment_type,
            designation: designation || undefined,
            commission_rate: commission_rate ? Number(commission_rate) : 0,
          },
          targets: {
            monthly_sales: monthly_sales ? Number(monthly_sales) : 0,
            monthly_orders: monthly_orders ? Number(monthly_orders) : 0,
            monthly_visits: monthly_visits ? Number(monthly_visits) : 20,
          },
          bank_details: bank_name
            ? {
                bank_name,
                account_holder_name: account_holder_name || undefined,
                account_number: account_number || undefined,
              }
            : undefined,
          ...(password ? { password } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create agent");
        return;
      }
      router.push("/dashboard/agents");
      router.refresh();
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header & Back Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/agents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Onboard Field Agent</h1>
          <CardDescription>
            Register a domain-agnostic, geo-aware field booking representative
          </CardDescription>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: ORGANIZATIONAL CONTEXT & AGENT ID */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">1. Agent Identification & Assignment</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assigned Distributor Hub *</Label>
                <Select value={distributor_id} onValueChange={setDistributorId} required>
                  <SelectTrigger><SelectValue placeholder="Select Distributor" /></SelectTrigger>
                  <SelectContent>
                    {distributors.map((d) => (
                      <SelectItem key={d._id} value={d._id}>{d.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assigned Sales Territory *</Label>
                <Select value={territory_id} onValueChange={setTerritoryId} required>
                  <SelectTrigger><SelectValue placeholder="Select Territory" /></SelectTrigger>
                  <SelectContent>
                    {territories.map((t) => (
                      <SelectItem key={t._id} value={t._id}>{t.territory_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent_code">Agent Unique Code *</Label>
              <Input
                id="agent_code"
                placeholder="e.g. AGT-LHR-001"
                value={agent_code}
                onChange={(e) => setAgentCode(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  placeholder="First name"
                  value={first_name}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  placeholder="Last name"
                  value={last_name}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: CONTACT & MOBILE APP CREDENTIALS */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">2. Contact & Mobile App Credentials</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Official Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="agent@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternate_phone">Alternate Phone</Label>
                <Input
                  id="alternate_phone"
                  type="tel"
                  placeholder="Emergency contact"
                  value={alternate_phone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="password">Login Password (Optional)</Label>
                <Input
                  id="password"
                  type="password"
                  minLength={6}
                  placeholder="Password for field app access"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  If set, agent can log in to the field app using email + password.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: GEOGRAPHIC LOCATION & COVERAGE */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">3. Location & Geo-Aware Coverage</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Province / Territory *</Label>
                <Select
                  value={province}
                  onValueChange={(val) => {
                    setProvince(val);
                    const matching = CITIES_DATA.filter(
                      (c) => c.province.toLowerCase() === val.toLowerCase()
                    );
                    if (matching.length > 0) {
                      setSelectedCity(matching[0].name);
                      setIsCustomCity(false);
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select Province" /></SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>City / District Hub *</Label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCity(!isCustomCity)}
                    className="text-xs text-emerald-600 hover:underline font-medium"
                  >
                    {isCustomCity ? "Select from list" : "+ Type custom city"}
                  </button>
                </div>
                {isCustomCity ? (
                  <Input
                    placeholder="Enter unlisted city name"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    required
                  />
                ) : (
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger><SelectValue placeholder="Select City" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {filteredCities.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.name} {c.capital ? "★ (Capital)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="line1">Residential Address</Label>
                <Input
                  id="line1"
                  placeholder="e.g. House #12, Street 4, Sector G-9"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Postal / Zip Code</Label>
                <Input
                  id="pincode"
                  placeholder="e.g. 54000"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: EMPLOYMENT & PERFORMANCE TARGETS */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">4. Employment & Sales Performance Targets</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Employment Contract *</Label>
                <Select value={employment_type} onValueChange={setEmploymentType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  placeholder="e.g. Order Booker / Sales Rep"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="joining_date">Joining Date</Label>
                <Input
                  id="joining_date"
                  type="date"
                  value={joining_date}
                  onChange={(e) => setJoiningDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="monthly_sales" className="flex items-center gap-1">
                  <Target className="h-3.5 w-3.5 text-emerald-600" /> Target Sales (Rs.)
                </Label>
                <Input
                  id="monthly_sales"
                  type="number"
                  placeholder="e.g. 500000"
                  value={monthly_sales}
                  onChange={(e) => setMonthlySales(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_orders">Monthly Orders</Label>
                <Input
                  id="monthly_orders"
                  type="number"
                  placeholder="e.g. 150"
                  value={monthly_orders}
                  onChange={(e) => setMonthlyOrders(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_visits">Monthly Market Visits</Label>
                <Input
                  id="monthly_visits"
                  type="number"
                  placeholder="e.g. 20"
                  value={monthly_visits}
                  onChange={(e) => setMonthlyVisits(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.5"
                  value={commission_rate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 5: BANK SETTLEMENT DETAILS */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">5. Bank Settlement & Disbursement Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  placeholder="e.g. HBL / Meezan / Easypaisa"
                  value={bank_name}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_holder_name">Account Title</Label>
                <Input
                  id="account_holder_name"
                  placeholder="Account Holder Name"
                  value={account_holder_name}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_number">Account # / IBAN / Wallet ID</Label>
                <Input
                  id="account_number"
                  placeholder="PK36MEZN000123456789"
                  value={account_number}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/agents">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]">
              {loading ? "Creating Agent…" : "Onboard Field Agent"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
