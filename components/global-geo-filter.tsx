"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Filter, RefreshCw, Building2, Globe2, Layers } from "lucide-react";
import { getCitiesByProvince } from "@/lib/data/citiesData";

export interface GeoFilterState {
  region: string;
  city: string;
  domain: string;
  territoryId: string;
  distributorId: string;
  search: string;
}

export const PAKISTAN_REGIONS = [
  { value: "all", label: "All Provinces & Regions" },
  { value: "Punjab", label: "Punjab" },
  { value: "Sindh", label: "Sindh" },
  { value: "KPK", label: "KPK (Khyber Pakhtunkhwa)" },
  { value: "Balochistan", label: "Balochistan" },
  { value: "Islamabad (ICT)", label: "Islamabad (ICT)" },
  { value: "Gilgit-Baltistan", label: "Gilgit-Baltistan" },
  { value: "AJK", label: "Azad Kashmir (AJK)" },
];

export const INDUSTRY_DOMAINS = [
  { value: "all", label: "All Industry Domains" },
  { value: "fmcg", label: "FMCG / Packaged Consumer Goods" },
  { value: "pharma", label: "Pharmaceuticals & Healthcare" },
  { value: "electronics", label: "Electronics & Tech Appliances" },
  { value: "apparel", label: "Apparel & Footwear" },
  { value: "hardware", label: "Hardware, Electrical & Plumbing" },
  { value: "auto_parts", label: "Auto Spare Parts & Lubricants" },
  { value: "cosmetics", label: "Cosmetics & Personal Care" },
  { value: "agriculture", label: "Agriculture & Fertilizers" },
  { value: "general", label: "General Wholesale" },
];

interface GlobalGeoFilterProps {
  onFilterChange: (filters: GeoFilterState) => void;
  territories?: Array<{ _id: string; territory_name: string; territory_code: string }>;
  distributors?: Array<{ _id: string; company_name: string; distributor_code: string }>;
  placeholderSearch?: string;
  showDomainFilter?: boolean;
  initialFilters?: Partial<GeoFilterState>;
}

export function GlobalGeoFilter({
  onFilterChange,
  territories = [],
  distributors = [],
  placeholderSearch = "Search by code, title, area or keyword…",
  showDomainFilter = true,
  initialFilters,
}: GlobalGeoFilterProps) {
  const [region, setRegion] = useState(initialFilters?.region || "all");
  const [city, setCity] = useState(initialFilters?.city || "all");
  const [domain, setDomain] = useState(initialFilters?.domain || "all");
  const [customCity, setCustomCity] = useState("");
  const [territoryId, setTerritoryId] = useState(initialFilters?.territoryId || "all");
  const [distributorId, setDistributorId] = useState(initialFilters?.distributorId || "all");
  const [search, setSearch] = useState(initialFilters?.search || "");

  const activeCities = getCitiesByProvince(region);

  useEffect(() => {
    const activeCityVal = customCity.trim() !== "" ? customCity.trim() : city === "All Cities" ? "all" : city;
    onFilterChange({
      region,
      city: activeCityVal,
      domain,
      territoryId,
      distributorId,
      search,
    });
  }, [region, city, domain, customCity, territoryId, distributorId, search]);

  function resetFilters() {
    setRegion("all");
    setCity("all");
    setDomain("all");
    setCustomCity("");
    setTerritoryId("all");
    setDistributorId("all");
    setSearch("");
  }

  const hasActiveFilters =
    region !== "all" || city !== "all" || domain !== "all" || customCity !== "" || territoryId !== "all" || distributorId !== "all" || search !== "";

  return (
    <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wider">
          <Filter className="size-3.5 text-primary" />
          <span>Regional & Geographic Filter Bar</span>
          {hasActiveFilters && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
              Filters Active
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1">
            <RefreshCw className="size-3" /> Reset Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder={placeholderSearch}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-muted/40 border-border focus:bg-background"
          />
        </div>

        {/* Region / Province Filter */}
        <div>
          <Select
            value={region}
            onValueChange={(val) => {
              setRegion(val);
              setCity("all");
              setCustomCity("");
            }}
          >
            <SelectTrigger className="text-xs h-9 bg-muted/40 border-border focus:bg-background">
              <div className="flex items-center gap-1.5 truncate">
                <Globe2 className="size-3.5 text-primary shrink-0" />
                <SelectValue placeholder="Province / Region" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {PAKISTAN_REGIONS.map((r) => (
                <SelectItem key={r.value} value={r.value} className="text-xs">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City Filter or Custom City Input */}
        <div>
          {customCity !== "" ? (
            <div className="relative flex items-center">
              <MapPin className="size-3.5 absolute left-2.5 text-primary" />
              <Input
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                placeholder="Type custom city…"
                className="pl-8 text-xs h-9 bg-primary/5 border-primary/30 focus:bg-background"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-1.5 text-[10px] text-muted-foreground absolute right-1"
                onClick={() => setCustomCity("")}
              >
                Clear
              </Button>
            </div>
          ) : (
            <Select
              value={city}
              onValueChange={(val) => {
                if (val === "__custom__") {
                  setCustomCity("Custom City");
                } else {
                  setCity(val);
                }
              }}
            >
              <SelectTrigger className="text-xs h-9 bg-muted/40 border-border focus:bg-background">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="size-3.5 text-sky-600 shrink-0" />
                  <SelectValue placeholder="Select City" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all" className="text-xs font-semibold text-foreground">
                  All Cities
                </SelectItem>
                <SelectItem value="__custom__" className="text-xs font-bold text-primary bg-primary/5">
                  ✏️ Type Custom City…
                </SelectItem>
                {activeCities.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Industry Domain Filter */}
        {showDomainFilter && (
          <div>
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger className="text-xs h-9 bg-muted/40 border-border focus:bg-background">
                <div className="flex items-center gap-1.5 truncate">
                  <Layers className="size-3.5 text-violet-600 shrink-0" />
                  <SelectValue placeholder="Industry Domain" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_DOMAINS.map((d) => (
                  <SelectItem key={d.value} value={d.value} className="text-xs">
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Territory Filter (Optional) */}
        {territories.length > 0 && (
          <div>
            <Select value={territoryId} onValueChange={setTerritoryId}>
              <SelectTrigger className="text-xs h-9 bg-muted/40 border-border focus:bg-background">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="size-3.5 text-amber-600 shrink-0" />
                  <SelectValue placeholder="Territory" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Territories</SelectItem>
                {territories.map((t) => (
                  <SelectItem key={t._id} value={t._id} className="text-xs">
                    {t.territory_name} ({t.territory_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
