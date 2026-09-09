"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Crosshair, CheckCircle2, Store as StoreIcon } from "lucide-react";

export interface LatLngPoint {
  name?: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export interface StorePoint {
  _id: string;
  store_code: string;
  store_name: string;
  owner_name?: string;
  owner_phone?: string;
  latitude: number;
  longitude: number;
  city?: string;
}

export interface AgentPoint {
  _id: string;
  agent_code?: string;
  name: string;
  phone?: string;
  territory_name?: string;
  latitude: number;
  longitude: number;
}

export interface VisitPoint {
  _id: string;
  store_name: string;
  store_code?: string;
  owner_name?: string;
  owner_phone?: string;
  check_in_time?: string;
  latitude: number;
  longitude: number;
  store_latitude?: number;
  store_longitude?: number;
  distance_meters?: number;
  is_geofence_verified?: boolean;
  is_flagged?: boolean;
  flag_reason?: string;
  notes?: string;
}

interface RouteGoogleMapProps {
  startPoint?: LatLngPoint | null;
  endPoint?: LatLngPoint | null;
  waypoints?: LatLngPoint[];
  stores?: StorePoint[];
  agents?: AgentPoint[];
  visits?: VisitPoint[];
  onPointsChange?: (data: {
    start: LatLngPoint | null;
    end: LatLngPoint | null;
    waypoints: LatLngPoint[];
    distanceKm: number;
  }) => void;
  readOnly?: boolean;
  isOpen?: boolean;
  height?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export function RouteGoogleMap({
  startPoint: initialStart = null,
  endPoint: initialEnd = null,
  stores = [],
  agents = [],
  visits = [],
  onPointsChange,
  readOnly = false,
  isOpen = true,
  height = "400px",
}: RouteGoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const mapInstanceRef = useRef<any>(null);
  const areaMarkerRef = useRef<any>(null);
  const areaCircleRef = useRef<any>(null);

  const storeMarkersRef = useRef<any[]>([]);
  const agentMarkersRef = useRef<any[]>([]);
  const visitMarkersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);

  // Selected Area state (derived from startPoint or initial area)
  const [selectedArea, setSelectedArea] = useState<LatLngPoint | null>(initialStart || initialEnd || null);
  const [searchQuery, setSearchQuery] = useState<string>(initialStart?.name || initialEnd?.name || "");
  const [isSearching, setIsSearching] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Sync initial props
  useEffect(() => {
    const active = initialStart || initialEnd;
    if (active) {
      setSelectedArea(active);
      if (active.name) setSearchQuery(active.name);
    }
  }, [initialStart, initialEnd]);

  // Load Google Maps SDK
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google && window.google.maps) {
      setMapsLoaded(true);
      return;
    }

    const rawApiKey = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();
    const apiKey = rawApiKey || "AIzaSyDQ5csDpZbI4g7G5YX07OtXzX5gQ_R6vj0";
    const scriptId = "google-maps-js-sdk";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapsLoaded(true);
      document.body.appendChild(script);
    } else if (!window.google || !window.google.maps) {
      script.addEventListener("load", () => setMapsLoaded(true));
    }
  }, []);

  // Get user GPS location on mount
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        if (mapInstanceRef.current && !initialStart && stores.length === 0) {
          mapInstanceRef.current.setCenter(coords);
          mapInstanceRef.current.setZoom(12);
        }
      },
      (err) => console.log("GPS info:", err.message),
      { timeout: 5000, enableHighAccuracy: true }
    );
  }, [initialStart, stores.length]);

  // Select a new area location
  const selectAreaLocation = (point: LatLngPoint) => {
    setSelectedArea(point);
    setSearchQuery(point.name || `${point.latitude}, ${point.longitude}`);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: point.latitude, lng: point.longitude });
      mapInstanceRef.current.setZoom(12);
    }

    if (onPointsChange) {
      onPointsChange({
        start: point,
        end: point,
        waypoints: [],
        distanceKm: 0,
      });
    }
  };

  // Search Area by name (e.g. "Blue Area", "F-6", "Downtown")
  function searchArea(query: string) {
    if (!query.trim()) return;

    const coordMatch = query.trim().match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      const point: LatLngPoint = {
        name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        latitude: lat,
        longitude: lng,
      };
      selectAreaLocation(point);
      return;
    }

    setIsSearching(true);

    if (window.google?.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: query.trim() }, (results: any[], status: string) => {
        setIsSearching(false);
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          const lat = parseFloat(loc.lat().toFixed(6));
          const lng = parseFloat(loc.lng().toFixed(6));
          const name = results[0].formatted_address.split(",")[0];

          selectAreaLocation({
            name,
            address: results[0].formatted_address,
            latitude: lat,
            longitude: lng,
          });
        } else {
          fallbackOsmSearch(query);
        }
      });
    } else {
      fallbackOsmSearch(query);
    }
  }

  async function fallbackOsmSearch(query: string) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(parseFloat(first.lat).toFixed(6));
        const lng = parseFloat(parseFloat(first.lon).toFixed(6));
        const name = first.display_name.split(",")[0];

        selectAreaLocation({
          name,
          address: first.display_name,
          latitude: lat,
          longitude: lng,
        });
      } else {
        alert(`Location area "${query}" not found.`);
      }
    } catch {
      alert("Error searching location area.");
    } finally {
      setIsSearching(false);
    }
  }

  function useGPSArea(e?: React.SyntheticEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const applyCoords = (lat: number, lng: number) => {
      const pt: LatLngPoint = {
        name: `Current Area (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        latitude: lat,
        longitude: lng,
      };
      selectAreaLocation(pt);
    };

    if (userLocation) {
      applyCoords(userLocation.lat, userLocation.lng);
    } else {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        applyCoords(coords.lat, coords.lng);
      });
    }
  }

  // Initialize Map
  useEffect(() => {
    if (!mapsLoaded || !mapContainerRef.current || mapInstanceRef.current) return;
    const google = window.google;
    if (!google || !google.maps) return;

    const initialLat = selectedArea?.latitude || stores[0]?.latitude || visits[0]?.latitude || userLocation?.lat || 33.6844;
    const initialLng = selectedArea?.longitude || stores[0]?.longitude || visits[0]?.longitude || userLocation?.lng || 73.0479;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: initialLat, lng: initialLng },
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeControl: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    if (google.maps.places && searchInputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current);
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          const lat = parseFloat(place.geometry.location.lat().toFixed(6));
          const lng = parseFloat(place.geometry.location.lng().toFixed(6));
          const name = place.name || place.formatted_address;

          selectAreaLocation({
            name,
            address: place.formatted_address,
            latitude: lat,
            longitude: lng,
          });
        }
      });
    }

    if (!readOnly) {
      map.addListener("click", (e: any) => {
        const lat = parseFloat(e.latLng.lat().toFixed(6));
        const lng = parseFloat(e.latLng.lng().toFixed(6));
        const name = `Selected Area (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        selectAreaLocation({ name, latitude: lat, longitude: lng });
      });
    }

    setTimeout(() => {
      if (google.maps.event && mapInstanceRef.current) {
        google.maps.event.trigger(mapInstanceRef.current, "resize");
      }
    }, 300);
  }, [mapsLoaded, readOnly]);

  // Modal open resize trigger
  useEffect(() => {
    if (isOpen && mapInstanceRef.current && window.google?.maps?.event) {
      const t1 = setTimeout(() => {
        if (mapInstanceRef.current) window.google.maps.event.trigger(mapInstanceRef.current, "resize");
      }, 100);
      const t2 = setTimeout(() => {
        if (mapInstanceRef.current) window.google.maps.event.trigger(mapInstanceRef.current, "resize");
      }, 350);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isOpen]);

  // Render Markers & Area Highlight
  useEffect(() => {
    if (!mapsLoaded || !mapInstanceRef.current || !window.google?.maps) return;
    const google = window.google;
    const map = mapInstanceRef.current;

    // Clear old area marker & circle & custom markers
    if (areaMarkerRef.current) areaMarkerRef.current.setMap(null);
    if (areaCircleRef.current) areaCircleRef.current.setMap(null);
    storeMarkersRef.current.forEach((m) => m.setMap(null));
    storeMarkersRef.current = [];
    agentMarkersRef.current.forEach((m) => m.setMap(null));
    agentMarkersRef.current = [];
    visitMarkersRef.current.forEach((m) => m.setMap(null));
    visitMarkersRef.current = [];
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let validPointsCount = 0;

    // 1. Render Selected Area Marker & Highlight Circle
    if (selectedArea) {
      const pos = { lat: selectedArea.latitude, lng: selectedArea.longitude };

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: selectedArea.name || "Selected Area",
        label: { text: "📍", fontSize: "16px" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#0284C7",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 3,
          scale: 14,
        },
      });

      const circle = new google.maps.Circle({
        strokeColor: "#0284C7",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#38BDF8",
        fillOpacity: 0.25,
        map,
        center: pos,
        radius: 1200,
      });

      const info = new google.maps.InfoWindow({
        content: `
          <div style="font-family:sans-serif; padding:6px; color:#0f172a;">
            <b style="font-size:14px; color:#0284C7;">📍 Selected Market Area</b><br/>
            <span style="font-size:12px; font-weight:bold;">${selectedArea.name || "Target Area"}</span><br/>
            <span style="font-size:11px; color:#64748b;">${selectedArea.address || ""}</span>
          </div>
        `,
      });

      marker.addListener("click", () => info.open(map, marker));

      areaMarkerRef.current = marker;
      areaCircleRef.current = circle;
      bounds.extend(pos);
      validPointsCount++;
    }

    // 2. Render Store Markers (🏪 Distinct Store Pin)
    stores.forEach((store) => {
      if (!store.latitude || !store.longitude) return;
      const pos = { lat: store.latitude, lng: store.longitude };

      const storeSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="38" height="44" viewBox="0 0 38 44">
          <path d="M19 0C8.5 0 0 8.5 0 19c0 14.2 19 25 19 25s19-10.8 19-25C38 8.5 29.5 0 19 0z" fill="#0F172A" stroke="#10B981" stroke-width="2.5"/>
          <text x="19" y="21" font-size="16" text-anchor="middle" dominant-baseline="central">🏪</text>
        </svg>`;

      const storeMarker = new google.maps.Marker({
        position: pos,
        map,
        title: `🏪 Store: ${store.store_name}`,
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(storeSvg),
          anchor: new google.maps.Point(19, 44),
        },
      });

      const info = new google.maps.InfoWindow({
        content: `
          <div style="font-family: sans-serif; padding: 6px; color: #0f172a;">
            <div style="font-size: 11px; font-weight: bold; color: #10b981; margin-bottom: 2px;">🏪 Retail Store Outlet</div>
            <b style="font-size: 14px;">${store.store_name}</b><br/>
            <span style="font-size: 11px; font-family: monospace; color: #64748b;">Code: ${store.store_code}</span><br/>
            <span style="font-size: 11px; color: #334155;">👤 Owner: ${store.owner_name || "Shopkeeper"} (${store.owner_phone || "N/A"})</span>
          </div>
        `,
      });

      storeMarker.addListener("click", () => info.open(map, storeMarker));
      storeMarkersRef.current.push(storeMarker);
      bounds.extend(pos);
      validPointsCount++;
    });

    // 3. Render Order Booker Agents (🚴 Agent Pin)
    agents.forEach((agent) => {
      if (!agent.latitude || !agent.longitude) return;
      const pos = { lat: agent.latitude, lng: agent.longitude };

      const agentSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="46" viewBox="0 0 40 46">
          <path d="M20 0C9 0 0 9 0 20c0 15 20 26 20 26s20-11 20-26C40 9 31 0 20 0z" fill="#1E1B4B" stroke="#3B82F6" stroke-width="2.5"/>
          <text x="20" y="21" font-size="18" text-anchor="middle" dominant-baseline="central">🚴</text>
        </svg>`;

      const agentMarker = new google.maps.Marker({
        position: pos,
        map,
        title: `🚴 Order Booker: ${agent.name}`,
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(agentSvg),
          anchor: new google.maps.Point(20, 46),
        },
      });

      const info = new google.maps.InfoWindow({
        content: `
          <div style="font-family: sans-serif; padding: 6px; color: #0f172a;">
            <div style="font-size: 11px; font-weight: bold; color: #3b82f6; margin-bottom: 2px;">🚴 Order Booker / Agent Pin</div>
            <b style="font-size: 14px;">${agent.name}</b> (${agent.agent_code || "AGT"})<br/>
            <span style="font-size: 11px; color: #64748b;">Territory: ${agent.territory_name || "Market Area"}</span><br/>
            <span style="font-size: 11px; color: #334155;">📞 Phone: ${agent.phone || "N/A"}</span>
          </div>
        `,
      });

      agentMarker.addListener("click", () => info.open(map, agentMarker));
      agentMarkersRef.current.push(agentMarker);
      bounds.extend(pos);
      validPointsCount++;
    });

    // 4. Render Logged Visit Check-in Insert Locations (📍 Check-in Pin)
    visits.forEach((visit) => {
      if (!visit.latitude || !visit.longitude) return;
      const pos = { lat: visit.latitude, lng: visit.longitude };

      const isVerified = visit.is_geofence_verified ?? (visit.distance_meters ? visit.distance_meters <= 100 : true);
      const isFlagged = visit.is_flagged || !isVerified;
      const iconEmoji = isFlagged ? "🚨" : "🟢";
      const pinColor = isFlagged ? "#991B1B" : "#065F46";
      const strokeColor = isFlagged ? "#EF4444" : "#34D399";

      const checkInSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="46" viewBox="0 0 40 46">
          <path d="M20 0C9 0 0 9 0 20c0 15 20 26 20 26s20-11 20-26C40 9 31 0 20 0z" fill="${pinColor}" stroke="${strokeColor}" stroke-width="2.5"/>
          <text x="20" y="21" font-size="18" text-anchor="middle" dominant-baseline="central">${iconEmoji}</text>
        </svg>`;

      const visitMarker = new google.maps.Marker({
        position: pos,
        map,
        title: `Check-in Logged Location (${isFlagged ? "Flagged Out-of-Bounds" : "Verified 100m Pass"})`,
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(checkInSvg),
          anchor: new google.maps.Point(20, 46),
        },
      });

      const distText = visit.distance_meters ? `${visit.distance_meters.toLocaleString()} meters away from shop` : "GPS Logged";
      const info = new google.maps.InfoWindow({
        content: `
          <div style="font-family: sans-serif; padding: 6px; color: #0f172a; max-width: 260px;">
            <div style="font-size: 11px; font-weight: bold; color: ${isFlagged ? "#ef4444" : "#10b981"}; margin-bottom: 2px;">
              ${isFlagged ? "🚨 OUT-OF-BOUNDS CHECK-IN LOGGED HERE" : "🟢 VERIFIED CHECK-IN LOGGED HERE"}
            </div>
            <b style="font-size: 14px;">Shop: ${visit.store_name}</b><br/>
            <span style="font-size: 11px; font-weight: bold; color: ${isFlagged ? "#b91c1c" : "#047857"};">
              Proximity Distance: ${distText}
            </span><br/>
            <span style="font-size: 11px; color: #64748b;">
              Log Time: ${visit.check_in_time ? new Date(visit.check_in_time).toLocaleTimeString() : "Recent"}
            </span><br/>
            ${visit.flag_reason ? `<span style="font-size: 11px; color: #ef4444; font-weight: bold;">Flag: ${visit.flag_reason}</span>` : ""}
          </div>
        `,
      });

      visitMarker.addListener("click", () => info.open(map, visitMarker));
      visitMarkersRef.current.push(visitMarker);

      // Polyline connecting check-in location pin to store location pin if available
      if (visit.store_latitude && visit.store_longitude) {
        const storePos = { lat: visit.store_latitude, lng: visit.store_longitude };
        const line = new google.maps.Polyline({
          path: [pos, storePos],
          geodesic: true,
          strokeColor: isFlagged ? "#EF4444" : "#10B981",
          strokeOpacity: 0.7,
          strokeWeight: 2,
          map,
        });
        polylinesRef.current.push(line);
      }

      // Extend bounds if valid coordinates
      if (Math.abs(visit.latitude) <= 90 && Math.abs(visit.longitude) <= 180) {
        bounds.extend(pos);
        validPointsCount++;
      }
    });

    if (validPointsCount > 0 && !bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
      const listener = google.maps.event.addListenerOnce(map, "idle", () => {
        if (map.getZoom() > 12) {
          map.setZoom(12);
        }
      });
    }
  }, [selectedArea, stores, agents, visits, mapsLoaded]);

  return (
    <div className="space-y-3">
      {/* Search & Area Selection Toolbar */}
      {!readOnly && (
        <div className="p-4 rounded-xl bg-slate-900 text-white shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="size-4 text-sky-400" />
              <span>Search & Select Market Area (e.g. Blue Area, F-6, Gulberg)</span>
            </label>

            <button
              type="button"
              onClick={useGPSArea}
              className="text-[11px] text-sky-300 hover:underline flex items-center gap-1 font-semibold"
            >
              <Crosshair className="size-3 text-sky-400" /> My Current Location
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                ref={searchInputRef}
                placeholder="Type area name (e.g., Blue Area Islamabad, Gulberg Lahore)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    searchArea(searchQuery);
                  }
                }}
                className="pl-9 text-sm bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 h-10"
              />
            </div>
            <Button
              type="button"
              disabled={isSearching}
              onClick={() => searchArea(searchQuery)}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs h-10 px-4 font-semibold"
            >
              {isSearching ? "Searching Area…" : "Select Area"}
            </Button>
          </div>
        </div>
      )}

      {/* Quick Select Nearby Stores */}
      {!readOnly && stores.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs">
          <span className="text-slate-500 font-medium shrink-0">Quick Area Focus:</span>
          {stores.slice(0, 5).map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() =>
                selectAreaLocation({
                  name: s.store_name,
                  latitude: s.latitude,
                  longitude: s.longitude,
                })
              }
              className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-800 shrink-0 font-medium flex items-center gap-1"
            >
              <StoreIcon className="size-3 text-emerald-600" /> {s.store_name}
            </button>
          ))}
        </div>
      )}

      {/* Google Maps Canvas Container */}
      <div
        ref={mapContainerRef}
        style={{ height, width: "100%" }}
        className="rounded-xl border border-slate-300 shadow-sm z-0 relative overflow-hidden bg-slate-100"
      />

      {/* Selected Area Summary Card */}
      <div className="flex items-center justify-between text-xs text-slate-800 bg-sky-50/70 p-3 rounded-xl border border-sky-200">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-sky-600 shrink-0" />
          <div>
            <span className="font-semibold text-slate-900">Active Market Area: </span>
            {selectedArea ? (
              <span className="font-bold text-sky-900">{selectedArea.name || "Target Area Zone"}</span>
            ) : (
              <span className="text-slate-400 italic">No area selected yet (Search "Blue Area" or click map)</span>
            )}
          </div>
        </div>

        {selectedArea && (
          <Badge variant="outline" className="bg-sky-100 text-sky-800 border-sky-300 font-mono text-[11px]">
            {selectedArea.latitude.toFixed(4)}, {selectedArea.longitude.toFixed(4)}
          </Badge>
        )}
      </div>
    </div>
  );
}

// Re-export as RouteLeafletMap for backward compatibility
export const RouteLeafletMap = RouteGoogleMap;
