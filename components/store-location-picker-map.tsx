"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Crosshair, CheckCircle2, Store as StoreIcon } from "lucide-react";

export interface SelectedLocation {
  latitude: number;
  longitude: number;
  address?: string;
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface StoreLocationPickerMapProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (loc: SelectedLocation) => void;
  height?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export function StoreLocationPickerMap({
  latitude,
  longitude,
  onLocationSelect,
  height = "360px",
}: StoreLocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [selectedAddr, setSelectedAddr] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Load Google Maps JS SDK
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
    } else {
      script.addEventListener("load", () => setMapsLoaded(true));
    }
  }, []);

  // Detect GPS location on mount
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
      },
      (err) => console.log("GPS info:", err.message),
      { timeout: 5000, enableHighAccuracy: true }
    );
  }, []);

  // Reverse Geocode coordinates to address components
  function extractAddressAndNotify(lat: number, lng: number, placeObj?: any) {
    const defaultData: SelectedLocation = {
      latitude: lat,
      longitude: lng,
      line1: "",
      city: "",
      state: "",
      pincode: "",
    };

    if (placeObj && placeObj.address_components) {
      let streetNumber = "";
      let routeName = "";

      placeObj.address_components.forEach((c: any) => {
        const types = c.types || [];
        if (types.includes("street_number")) streetNumber = c.long_name;
        if (types.includes("route")) routeName = c.long_name;
        if (types.includes("sublocality") || types.includes("neighborhood") || types.includes("locality")) {
          if (!defaultData.city) defaultData.city = c.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          defaultData.state = c.long_name;
        }
        if (types.includes("postal_code")) {
          defaultData.pincode = c.long_name;
        }
      });

      const line1Part = [streetNumber, routeName].filter(Boolean).join(" ");
      defaultData.line1 = line1Part || placeObj.formatted_address?.split(",")?.[0] || placeObj.name || "";
      defaultData.address = placeObj.formatted_address || placeObj.name || `${lat}, ${lng}`;
      setSelectedAddr(defaultData.address || "");
      onLocationSelect(defaultData);
      return;
    }

    // Fallback using Geocoder
    if (window.google?.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        if (status === "OK" && results && results[0]) {
          const first = results[0];
          let streetNumber = "";
          let routeName = "";

          first.address_components.forEach((c: any) => {
            const types = c.types || [];
            if (types.includes("street_number")) streetNumber = c.long_name;
            if (types.includes("route")) routeName = c.long_name;
            if (types.includes("sublocality") || types.includes("neighborhood") || types.includes("locality")) {
              if (!defaultData.city) defaultData.city = c.long_name;
            }
            if (types.includes("administrative_area_level_1")) {
              defaultData.state = c.long_name;
            }
            if (types.includes("postal_code")) {
              defaultData.pincode = c.long_name;
            }
          });

          const line1Part = [streetNumber, routeName].filter(Boolean).join(" ");
          defaultData.line1 = line1Part || first.formatted_address.split(",")[0];
          defaultData.address = first.formatted_address;
          setSelectedAddr(first.formatted_address);
          onLocationSelect(defaultData);
        } else {
          onLocationSelect(defaultData);
        }
      });
    } else {
      onLocationSelect(defaultData);
    }
  }

  // Update marker position & center map
  function setMapPosition(lat: number, lng: number, placeObj?: any) {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat, lng });
      mapInstanceRef.current.setZoom(13);
    }
    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
    }
    extractAddressAndNotify(lat, lng, placeObj);
  }

  // Search Address by text query
  function searchLocation(query: string) {
    if (!query.trim()) return;
    setIsSearching(true);

    if (window.google?.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: query.trim() }, (results: any[], status: string) => {
        setIsSearching(false);
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          const lat = parseFloat(loc.lat().toFixed(6));
          const lng = parseFloat(loc.lng().toFixed(6));
          setMapPosition(lat, lng, results[0]);
        } else {
          alert(`Address "${query}" not found. Try clicking directly on the map.`);
        }
      });
    } else {
      setIsSearching(false);
    }
  }

  // Use GPS location button
  function useGPSLocation(e?: React.SyntheticEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const applyCoords = (lat: number, lng: number) => {
      setMapPosition(lat, lng);
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

  // Initialize Google Map
  useEffect(() => {
    if (!mapsLoaded || !mapContainerRef.current || mapInstanceRef.current) return;
    const google = window.google;
    if (!google || !google.maps) return;

    const initialLat = latitude || userLocation?.lat || 33.6844;
    const initialLng = longitude || userLocation?.lng || 73.0479;

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

    // Draggable Store Marker
    const marker = new google.maps.Marker({
      position: { lat: initialLat, lng: initialLng },
      map,
      draggable: true,
      title: "Store Location Pin",
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: "#10B981", // Emerald Store pin
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
        scale: 8,
      },
    });

    markerRef.current = marker;

    // Marker drag event
    marker.addListener("dragend", (e: any) => {
      const lat = parseFloat(e.latLng.lat().toFixed(6));
      const lng = parseFloat(e.latLng.lng().toFixed(6));
      extractAddressAndNotify(lat, lng);
    });

    // Map click event
    map.addListener("click", (e: any) => {
      const lat = parseFloat(e.latLng.lat().toFixed(6));
      const lng = parseFloat(e.latLng.lng().toFixed(6));
      setMapPosition(lat, lng);
    });

    // Google Places Autocomplete
    if (google.maps.places && searchInputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current);
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          const lat = parseFloat(place.geometry.location.lat().toFixed(6));
          const lng = parseFloat(place.geometry.location.lng().toFixed(6));
          setMapPosition(lat, lng, place);
        }
      });
    }
  }, [mapsLoaded]);

  return (
    <div className="space-y-3">
      {/* Search & Location Controls Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900 text-white shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
            <StoreIcon className="size-4 text-emerald-400" />
            <span>Search & Pin Store Address from Google Map</span>
          </label>

          <button
            type="button"
            onClick={useGPSLocation}
            className="text-[11px] text-emerald-300 hover:underline flex items-center gap-1 font-semibold"
          >
            <Crosshair className="size-3 text-emerald-400" /> Use Current GPS Location
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              ref={searchInputRef}
              placeholder="Search store building, market, or street address (e.g. Shop 12 Blue Area Islamabad)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  searchLocation(searchQuery);
                }
              }}
              className="pl-9 text-sm bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 h-10"
            />
          </div>
          <Button
            type="button"
            disabled={isSearching}
            onClick={() => searchLocation(searchQuery)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-10 px-4 font-semibold"
          >
            {isSearching ? "Searching…" : "Find on Map"}
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{ height, width: "100%" }}
        className="rounded-xl border border-slate-300 shadow-sm z-0 relative overflow-hidden bg-slate-100"
      />

      {/* Selected Address Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-800 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <div>
            <span className="font-semibold text-slate-900">Selected Store Address: </span>
            {selectedAddr ? (
              <span className="font-bold text-emerald-950">{selectedAddr}</span>
            ) : (
              <span className="text-slate-500 italic">Click map or search to pick store position</span>
            )}
          </div>
        </div>

        <Badge variant="outline" className="bg-emerald-100 text-emerald-900 border-emerald-300 font-mono text-[11px]">
          Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
        </Badge>
      </div>
    </div>
  );
}
