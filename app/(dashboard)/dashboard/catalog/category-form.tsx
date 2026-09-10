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

import { useStore } from "@/lib/store/useStore";

export function CategoryForm({
  distributors,
  trigger,
}: {
  distributors: Array<{ _id: string; company_name: string }>;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const addCategoryToStore = useStore((state) => state.addCategory);

  const [open, setOpen] = useState(false);
  const [distributor_id, setDistributorId] = useState("");
  const [category_name, setCategoryName] = useState("");
  const [category_code, setCategoryCode] = useState("");
  const [industry_domain, setIndustryDomain] = useState("fmcg");
  const [default_gst_rate, setDefaultGstRate] = useState("18");
  const [default_margin_percentage, setDefaultMarginPercentage] = useState("15");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          distributor_id,
          category_name,
          category_code,
          industry_domain,
          default_gst_rate: default_gst_rate ? Number(default_gst_rate) : undefined,
          default_margin_percentage: default_margin_percentage ? Number(default_margin_percentage) : undefined,
          description: description || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = getApiErrorMessage(data, "Failed to create category");
        setError(msg);
        toastApiError(toast, data, "Failed to create category");
        return;
      }
      if (data.data) {
        addCategoryToStore(data.data);
      }
      toast.success("Category saved successfully");
      setOpen(false);
      setCategoryName("");
      setCategoryCode("");
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
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>Create a multi-domain category with default GST tax & margin presets</DialogDescription>
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
              <Label htmlFor="category_name">Category Name *</Label>
              <Input
                id="category_name"
                placeholder="e.g. Dairy & Beverages"
                value={category_name}
                onChange={(e) => setCategoryName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 min-w-0">
              <Label htmlFor="category_code">Category Code *</Label>
              <Input
                id="category_code"
                placeholder="e.g. CAT-BEV-01"
                value={category_code}
                onChange={(e) => setCategoryCode(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 min-w-0">
              <Label htmlFor="default_gst_rate">Default GST Tax %</Label>
              <Input
                id="default_gst_rate"
                type="number"
                placeholder="18"
                value={default_gst_rate}
                onChange={(e) => setDefaultGstRate(e.target.value)}
              />
            </div>
            <div className="space-y-2 min-w-0">
              <Label htmlFor="default_margin">Trade Margin %</Label>
              <Input
                id="default_margin"
                type="number"
                placeholder="15"
                value={default_margin_percentage}
                onChange={(e) => setDefaultMarginPercentage(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Optional notes or sub-category info"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                "Save Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
