"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CITIES_DATA } from "@/lib/data/citiesData";
import { toastApiError } from "@/lib/utils";
import { Building2, Globe2, ShieldCheck, MapPin, CreditCard, ArrowLeft, Loader2 } from "lucide-react";

const INDUSTRY_DOMAINS = [
  { value: "fmcg", label: "FMCG / Packaged Consumer Goods" },
  { value: "pharma", label: "Pharmaceuticals & Healthcare" },
  { value: "electronics", label: "Electronics & Tech Appliances" },
  { value: "apparel", label: "Apparel & Footwear" },
  { value: "hardware", label: "Hardware, Electrical & Plumbing" },
  { value: "auto_parts", label: "Auto Spare Parts & Lubricants" },
  { value: "cosmetics", label: "Cosmetics & Personal Care" },
  { value: "agriculture", label: "Agriculture & Seeds / Fertilizers" },
  { value: "general", label: "General Wholesale & Multi-Category" },
];

const OPERATING_MODELS = [
  { value: "distributor", label: "Authorized Primary Distributor" },
  { value: "super_stockist", label: "Super Stockist" },
  { value: "cf_agent", label: "C&F Agent (Carrying & Forwarding)" },
  { value: "importer", label: "Sole Importer / National Agent" },
  { value: "master_wholesaler", label: "Master Wholesaler" },
];

const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
];

export default function NewDistributorPage() {
  const router = useRouter();
  const [company_name, setCompanyName] = useState("");
  const [distributor_code, setDistributorCode] = useState("");
  const [industry_domain, setIndustryDomain] = useState("fmcg");
  const [operating_model, setOperatingModel] = useState("distributor");
  const [gst_number, setGstNumber] = useState("");
  const [ntn_number, setNtnNumber] = useState("");
  const [strn_number, setStrnNumber] = useState("");
  const [drug_license_number, setDrugLicenseNumber] = useState("");
  const [business_license, setBusinessLicense] = useState("");
  
  // Geo & Address
  const [province, setProvince] = useState("Punjab");
  const [selectedCity, setSelectedCity] = useState("Lahore");
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState("");
  const [line1, setLine1] = useState("");
  const [pincode, setPincode] = useState("");

  // Contact & Bank
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [account_holder_name, setAccountHolderName] = useState("");
  const [bank_name, setBankName] = useState("");
  const [account_number, setAccountNumber] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Available cities based on selected province
  const filteredCities = useMemo(() => {
    return CITIES_DATA.filter(
      (c) => c.province.toLowerCase() === province.toLowerCase()
    );
  }, [province]);

  const activeCityName = isCustomCity ? customCity : selectedCity;

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
          industry_domain,
          operating_model,
          gst_number,
          tax_registration: {
            ntn_number: ntn_number || undefined,
            strn_number: strn_number || undefined,
            drug_license_number: drug_license_number || undefined,
          },
          business_license: business_license || undefined,
          address: {
            line1: line1 || undefined,
            city: activeCityName,
            province,
            pincode: pincode || undefined,
            country: "Pakistan",
          },
          contact: { phone, email, website: website || undefined },
          bank_details: bank_name ? {
            account_holder_name: account_holder_name || undefined,
            bank_name,
            account_number: account_number || undefined,
          } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastApiError(data, "Failed to create distributor");
        setError(data.error || "Failed to create distributor");
        return;
      }
      router.push("/dashboard/distributors");
      router.refresh();
    } catch (err: any) {
      toastApiError(err, "Network error occurred");
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/distributors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Onboard New Distributor</h1>
          <CardDescription>Setup a domain-specific, geo-aware distribution hub</CardDescription>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: DOMAIN & OPERATING MODEL */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">1. Industry Domain & Business Model</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company / Firm Name *</Label>
                <Input
                  id="company_name"
                  placeholder="e.g. Khyber Allied Distribution Ltd"
                  value={company_name}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distributor_code">Distributor Unique Code *</Label>
                <Input
                  id="distributor_code"
                  placeholder="e.g. DST-KPK-001"
                  value={distributor_code}
                  onChange={(e) => setDistributorCode(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Industry Domain (Vertical) *</Label>
                <Select value={industry_domain} onValueChange={setIndustryDomain}>
                  <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_DOMAINS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Operating Model *</Label>
                <Select value={operating_model} onValueChange={setOperatingModel}>
                  <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                  <SelectContent>
                    {OPERATING_MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: TAX & REGULATORY COMPLIANCE */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">2. Tax & Compliance Registration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST / Sales Tax Reg # *</Label>
                <Input
                  id="gst_number"
                  placeholder="e.g. 07-01-2800-001-55"
                  value={gst_number}
                  onChange={(e) => setGstNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ntn_number">FBR NTN Number</Label>
                <Input
                  id="ntn_number"
                  placeholder="e.g. 1234567-8"
                  value={ntn_number}
                  onChange={(e) => setNtnNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="strn_number">STRN Number</Label>
                <Input
                  id="strn_number"
                  placeholder="e.g. 327787615243"
                  value={strn_number}
                  onChange={(e) => setStrnNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drug_license_number">Drug / Trade License # (Pharma/FMCG)</Label>
                <Input
                  id="drug_license_number"
                  placeholder="e.g. DRAP-LIC-2024-99"
                  value={drug_license_number}
                  onChange={(e) => setDrugLicenseNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_license">General Business License</Label>
                <Input
                  id="business_license"
                  placeholder="e.g. KCCI-REG-8821"
                  value={business_license}
                  onChange={(e) => setBusinessLicense(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: GEOGRAPHIC COVERAGE */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">3. Location & Regional Coverage</CardTitle>
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
                    className="text-xs text-primary hover:underline font-medium"
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
                <Label htmlFor="line1">Warehouse / Office Address</Label>
                <Input
                  id="line1"
                  placeholder="e.g. Plot 45-B, Industrial Estate Phase II"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Postal Zip Code</Label>
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

        {/* SECTION 4: CONTACT & BANK SETTLEMENT */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">4. Contact & Bank Settlement Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Official Phone *</Label>
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
                <Label htmlFor="email">Official Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="distributor@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://company.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  placeholder="e.g. HBL / Meezan Bank"
                  value={bank_name}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_holder_name">Account Title</Label>
                <Input
                  id="account_holder_name"
                  placeholder="Account Title Name"
                  value={account_holder_name}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account # / IBAN</Label>
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
              <Link href="/dashboard/distributors">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[140px]">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Hub…
                </>
              ) : (
                "Create Distributor Hub"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
