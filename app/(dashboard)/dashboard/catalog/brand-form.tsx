"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage, toastApiError } from "@/lib/utils";

const DOMAINS = [
  { value: "fmcg", label: "FMCG / Packaged Consumer Goods" },
  { value: "pharma", label: "Pharmaceuticals & Healthcare" },
  { value: "electronics", label: "Electronics & Tech" },
  { value: "apparel", label: "Apparel & Fashion" },
  { value: "hardware", label: "Hardware, Electrical & Plumbing" },
  { value: "auto_parts", label: "Auto Spare Parts & Lubricants" },
  { value: "cosmetics", label: "Cosmetics & Personal Care" },
  { value: "agriculture", label: "Agriculture & Fertilizers" },
  { value: "general", label: "General Multi-Domain" },
];

const COUNTRIES = ["Pakistan", "Japan", "Germany", "China", "United States", "United Kingdom", "South Korea", "Turkey", "UAE"];

import { useStore } from "@/lib/store/useStore";

export function BrandForm({
  distributors,
  trigger,
}: {
  distributors: Array<{ _id: string; company_name: string }>;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const addBrandToStore = useStore((state) => state.addBrand);

  const [open, setOpen] = useState(false);
  const [distributor_id, setDistributorId] = useState("");
  const [brand_name, setBrandName] = useState("");
  const [brand_code, setBrandCode] = useState("");
  const [industry_domain, setIndustryDomain] = useState("fmcg");
  const [principal_owner, setPrincipalOwner] = useState("");
  const [country_of_origin, setCountryOfOrigin] = useState("Pakistan");
  const [certifications, setCertifications] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          distributor_id,
          brand_name,
          brand_code,
          industry_domain,
          principal_owner: principal_owner || undefined,
          brand_details: {
            country_of_origin,
            certifications: certifications ? certifications.split(",").map((c) => c.trim()) : undefined,
          },
          description: description || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = getApiErrorMessage(data, "Failed to create brand");
        setError(msg);
        toastApiError(toast, data, "Failed to create brand");
        return;
      }
      if (data.data) {
        addBrandToStore(data.data);
      }
      toast.success("Brand saved successfully");
      setOpen(false);
      setBrandName("");
      setBrandCode("");
      setDescription("");
      setDistributorId("");
      router.refresh();
    } catch {
      setError("Network error");
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add Brand</DialogTitle>
          <DialogDescription>Create a manufacturer or principal brand for your domain catalog</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Distributor Hub *</Label>
            <Select value={distributor_id} onValueChange={setDistributorId} required>
              <SelectTrigger><SelectValue placeholder="Select distributor" /></SelectTrigger>
              <SelectContent>
                {distributors.map((d) => (
                  <SelectItem key={d._id} value={d._id}>{d.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 min-w-0">
              <Label htmlFor="brand_name">Brand Name *</Label>
              <Input
                id="brand_name"
                placeholder="e.g. Nestlé / Samsung"
                value={brand_name}
                onChange={(e) => setBrandName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 min-w-0">
              <Label htmlFor="brand_code">Brand Code *</Label>
              <Input
                id="brand_code"
                placeholder="e.g. BRD-NES-01"
                value={brand_code}
                onChange={(e) => setBrandCode(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 min-w-0">
              <Label>Industry Domain *</Label>
              <Select value={industry_domain} onValueChange={setIndustryDomain}>
                <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 min-w-0">
              <Label>Country of Origin</Label>
              <Select value={country_of_origin} onValueChange={setCountryOfOrigin}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="principal_owner">Principal Brand Owner / Manufacturer</Label>
            <Input
              id="principal_owner"
              placeholder="e.g. Nestlé Pakistan S.A."
              value={principal_owner}
              onChange={(e) => setPrincipalOwner(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications (comma separated)</Label>
            <Input
              id="certifications"
              placeholder="e.g. DRAP Approved, ISO 9001, Halal Certified"
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer">
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-4 animate-spin" /> Saving...
                </span>
              ) : (
                "Save Brand"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
