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
import { Compass, MapPin, Globe2, Edit3, X } from "lucide-react";
import { PAKISTAN_REGIONS } from "@/components/global-geo-filter";
import { getCitiesByProvince } from "@/lib/data/citiesData";

export function TerritoryForm({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [territory_name, setTerritoryName] = useState("");
  const [territory_code, setTerritoryCode] = useState("");
  const [province_region, setProvinceRegion] = useState("KPK");
  const [city, setCity] = useState("Peshawar");
  const [customCity, setCustomCity] = useState("");
  const [isCustomCityMode, setIsCustomCityMode] = useState(false);
  const [country, setCountry] = useState("Pakistan");
  const [pincodesStr, setPincodesStr] = useState("");
  const [target_stores, setTargetStores] = useState("50");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleRegionChange(newRegion: string) {
    setProvinceRegion(newRegion);
    const citiesList = getCitiesByProvince(newRegion);
    const defaultCity = citiesList[0] || "Peshawar";
    setCity(defaultCity);
    setIsCustomCityMode(false);
    setCustomCity("");
    if (territory_name === "" || territory_code === "") {
      const codePrefix = newRegion.substring(0, 3).toUpperCase();
      const randNum = Math.floor(100 + Math.random() * 900);
      setTerritoryCode(`TR-${codePrefix}-${randNum}`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const activeCity = isCustomCityMode ? customCity.trim() : city;
    if (!activeCity) {
      setError("Please select or type a city name.");
      setLoading(false);
      return;
    }

    const pincodes = pincodesStr
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/territories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          territory_name,
          territory_code,
          province_region,
          city: activeCity,
          country,
          pincodes: pincodes.length > 0 ? pincodes : undefined,
          cities: [activeCity],
          states: [province_region],
          target_stores: Number(target_stores) || 0,
          description: description || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create territory");
        return;
      }

      setOpen(false);
      setTerritoryName("");
      setTerritoryCode("");
      setDescription("");
      setPincodesStr("");
      setCustomCity("");
      setIsCustomCityMode(false);
      router.refresh();
    } catch {
      setError("Network error while creating territory");
    } finally {
      setLoading(false);
    }
  }

  const availableCities = getCitiesByProvince(province_region);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2 text-slate-900">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Compass className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Add Geographic Territory</DialogTitle>
              <DialogDescription className="text-xs">
                Configure territory bounds, province (KPK, Punjab, Sindh, etc.), city center & outlet targets.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="territory_name" className="text-xs font-semibold text-slate-700">
                Territory Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="territory_name"
                placeholder="e.g. Peshawar Central Market / Saddar Zone"
                value={territory_name}
                onChange={(e) => setTerritoryName(e.target.value)}
                required
                className="bg-slate-50 border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="territory_code" className="text-xs font-semibold text-slate-700">
                Territory Code <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="territory_code"
                placeholder="e.g. TR-KPK-PEW-01"
                value={territory_code}
                onChange={(e) => setTerritoryCode(e.target.value)}
                required
                className="font-mono text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Country <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Province / Region <span className="text-rose-500">*</span>
              </Label>
              <Select value={province_region} onValueChange={handleRegionChange}>
                <SelectTrigger className="text-xs bg-slate-50 border-slate-200">
                  <div className="flex items-center gap-1.5 truncate">
                    <Globe2 className="size-3.5 text-emerald-600 shrink-0" />
                    <SelectValue placeholder="Select Province" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {PAKISTAN_REGIONS.filter((r) => r.value !== "all").map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-xs">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">
                  City / District <span className="text-rose-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCityMode(!isCustomCityMode);
                    if (!isCustomCityMode) setCustomCity("");
                  }}
                  className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1"
                >
                  {isCustomCityMode ? "Select from list" : "+ Type custom city"}
                </button>
              </div>

              {isCustomCityMode ? (
                <div className="relative">
                  <Input
                    placeholder="Type custom city name…"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    required
                    className="text-xs bg-emerald-50/50 border-emerald-300 focus:bg-white"
                  />
                </div>
              ) : (
                <Select value={city} onValueChange={(val) => {
                  if (val === "__custom__") {
                    setIsCustomCityMode(true);
                  } else {
                    setCity(val);
                  }
                }}>
                  <SelectTrigger className="text-xs bg-slate-50 border-slate-200">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="size-3.5 text-sky-600 shrink-0" />
                      <SelectValue placeholder="Select City" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="__custom__" className="text-xs font-bold text-emerald-700 bg-emerald-50">
                      ✏️ Type Custom City…
                    </SelectItem>
                    {availableCities.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pincodes" className="text-xs font-semibold text-slate-700">
                Postal / Zip Codes <span className="text-slate-400 font-normal">(Comma separated)</span>
              </Label>
              <Input
                id="pincodes"
                placeholder="e.g. 25000, 25100"
                value={pincodesStr}
                onChange={(e) => setPincodesStr(e.target.value)}
                className="text-xs bg-slate-50 border-slate-200 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="target_stores" className="text-xs font-semibold text-slate-700">
                Target Retail Outlets Count
              </Label>
              <Input
                id="target_stores"
                type="number"
                placeholder="e.g. 50"
                value={target_stores}
                onChange={(e) => setTargetStores(e.target.value)}
                className="text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
                Territory Description & Coverage Scope
              </Label>
              <Input
                id="description"
                placeholder="e.g. Covers Saddar Bazaar, Khyber Bazaar and University Road retail hubs."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 border-t mt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800 gap-1.5">
              {loading ? "Creating Territory…" : "Save & Add Territory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
