"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import StepIndicator from "@/components/ui/StepIndicator";
import { lookupZip, isValidZip } from "@/lib/geocoding";
import { LOCATION_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { LocationType } from "@/types";

export default function OnboardingStep3() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [radius, setRadius] = useState(10);
  const [locationType, setLocationType] = useState<LocationType>("home_studio");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [zipError, setZipError] = useState("");

  const handleZipChange = (value: string) => {
    setZipCode(value);
    setZipError("");

    if (value.length === 5 && isValidZip(value)) {
      const result = lookupZip(value);
      if (result) {
        setCity("");
        setState("");
        // Zip found — we'll geocode on save
      } else {
        setZipError("Zip code not found. Please check and try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleNext = async () => {
    if (!isValidZip(zipCode)) {
      setError("Please enter a valid 5-digit zip code.");
      return;
    }

    const coords = lookupZip(zipCode);
    if (!coords) {
      setError("Zip code not found.");
      return;
    }

    setSaving(true);
    setError("");

    // Update profile with location data
    // PostGIS point: ST_MakePoint(lng, lat) — note lng comes first
    const { error: updateError } = await supabase
      .from("provider_profiles")
      .update({
        zip_code: zipCode,
        city: city || null,
        state: state || null,
        location: `SRID=4326;POINT(${coords.lng} ${coords.lat})`,
        service_radius_miles: radius,
        location_type: locationType,
      })
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push("/step-4");
  };

  return (
    <>
      <StepIndicator currentStep={3} />
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-1">Where are you located?</h2>
        <p className="text-sm text-muted mb-6">
          This helps customers find you when searching nearby.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Zip Code */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Zip Code <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              maxLength={5}
              value={zipCode}
              onChange={(e) => handleZipChange(e.target.value.replace(/\D/g, ""))}
              className="block w-40 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. 78701"
            />
            {zipError && (
              <p className="mt-1 text-xs text-danger">{zipError}</p>
            )}
          </div>

          {/* City / State (optional manual entry) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                City <span className="text-muted font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Austin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                State <span className="text-muted font-normal">(optional)</span>
              </label>
              <input
                type="text"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. TX"
              />
            </div>
          </div>

          {/* Service Radius */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Service Radius: {radius} miles
            </label>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>5 mi</span>
              <span>50 mi</span>
            </div>
          </div>

          {/* Location Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Where do you work?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.entries(LOCATION_TYPE_LABELS) as [LocationType, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLocationType(value)}
                    className={cn(
                      "rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors",
                      locationType === value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.push("/step-2")}
            className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={saving}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Next: Portfolio"}
          </button>
        </div>
      </div>
    </>
  );
}
