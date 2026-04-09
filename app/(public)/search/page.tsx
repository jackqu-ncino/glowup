"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { lookupZip } from "@/lib/geocoding";
import { SEARCH_ZOOM, DEFAULT_SEARCH_RADIUS_MILES } from "@/lib/constants";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  ),
});
import ProviderCard from "@/components/search/ProviderCard";
import SearchFilters from "@/components/search/SearchFilters";
import ZipCodeInput from "@/components/search/ZipCodeInput";
import type { ProviderSearchResult, Category, Tag } from "@/types";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const zipParam = searchParams.get("zip") || "";
  const categoryParam = searchParams.get("category") || "";
  const tagParam = searchParams.get("tag") || "";
  const sortParam = searchParams.get("sort") || "distance";
  const radiusParam = parseInt(searchParams.get("radius") || String(DEFAULT_SEARCH_RADIUS_MILES));

  const [providers, setProviders] = useState<ProviderSearchResult[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [center, setCenter] = useState({ lat: 39.8283, lng: -98.5795 });
  const [zoom, setZoom] = useState(4);
  const [loading, setLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  // Load reference data
  useEffect(() => {
    async function loadRefData() {
      const [catRes, tagRes] = await Promise.all([
        supabase.from("categories").select("*").order("display_order"),
        supabase.from("tags").select("*").order("display_order"),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (tagRes.data) setTags(tagRes.data);
    }
    loadRefData();
  }, [supabase]);

  // Search providers when params change
  useEffect(() => {
    if (!zipParam) return;

    const coords = lookupZip(zipParam);
    if (!coords) return;

    setCenter({ lat: coords.lat, lng: coords.lng });
    setZoom(SEARCH_ZOOM);
    setLoading(true);

    async function search() {
      // Find category/tag IDs from slugs
      let categoryId: string | null = null;
      let tagId: string | null = null;

      if (categoryParam) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", categoryParam)
          .single();
        if (cat) categoryId = cat.id;
      }

      if (tagParam) {
        const { data: tag } = await supabase
          .from("tags")
          .select("id")
          .eq("slug", tagParam)
          .single();
        if (tag) tagId = tag.id;
      }

      const coords = lookupZip(zipParam)!;
      const { data, error } = await supabase.rpc("search_providers_by_location", {
        search_lat: coords.lat,
        search_lng: coords.lng,
        radius_miles: radiusParam,
        category_filter: categoryId,
        tag_filter: tagId,
      });

      if (data && !error) {
        // Enrich results with categories, tags, services
        const enriched = await Promise.all(
          data.map(async (provider: any) => {
            const [catRes, tagRes, svcRes, pmRes] = await Promise.all([
              supabase
                .from("provider_categories")
                .select("categories(*)")
                .eq("profile_id", provider.profile_id),
              supabase
                .from("provider_tags")
                .select("tags(*)")
                .eq("profile_id", provider.profile_id),
              supabase
                .from("services")
                .select("*")
                .eq("profile_id", provider.profile_id)
                .eq("is_active", true)
                .order("display_order")
                .limit(3),
              supabase
                .from("provider_payment_methods")
                .select("payment_methods(*)")
                .eq("profile_id", provider.profile_id),
            ]);

            return {
              ...provider,
              categories: catRes.data?.map((c: any) => c.categories) || [],
              tags: tagRes.data?.map((t: any) => t.tags) || [],
              services: svcRes.data || [],
              payment_methods: pmRes.data?.map((p: any) => p.payment_methods) || [],
            };
          })
        );

        // Sort
        let sorted = [...enriched];
        switch (sortParam) {
          case "rating":
            sorted.sort((a, b) => b.average_rating - a.average_rating);
            break;
          case "reviews":
            sorted.sort((a, b) => b.review_count - a.review_count);
            break;
          case "price_low":
            sorted.sort((a, b) => {
              const aMin = a.services?.[0]?.price_min ?? Infinity;
              const bMin = b.services?.[0]?.price_min ?? Infinity;
              return aMin - bMin;
            });
            break;
          default: // distance (already sorted by RPC)
            break;
        }

        setProviders(sorted);
      }

      setLoading(false);
    }

    search();
  }, [zipParam, categoryParam, tagParam, sortParam, radiusParam, supabase]);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      router.push(`/search?${params.toString()}`);
    },
    [searchParams, router]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-start gap-4">
          <ZipCodeInput initialZip={zipParam} />
          <SearchFilters
            categories={categories}
            tags={tags}
            selectedCategory={categoryParam}
            selectedTag={tagParam}
            sortBy={sortParam}
            radius={radiusParam}
            onCategoryChange={(slug) => updateParams({ category: slug })}
            onTagChange={(slug) => updateParams({ tag: slug })}
            onSortChange={(sort) => updateParams({ sort })}
            onRadiusChange={(r) => updateParams({ radius: String(r) })}
          />

          {/* Mobile map toggle */}
          <button
            onClick={() => setShowMap(!showMap)}
            className="lg:hidden rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            {showMap ? "Hide Map" : "Show Map"}
          </button>
        </div>
      </div>

      {/* Main content: list + map */}
      <div className="flex flex-1 overflow-hidden">
        {/* Provider list */}
        <div className="w-full lg:w-[55%] overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !zipParam ? (
            <div className="text-center py-10">
              <h2 className="text-lg font-semibold mb-2">Search for providers</h2>
              <p className="text-sm text-muted">
                Enter your zip code above to find beauty providers near you.
              </p>
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-10">
              <h2 className="text-lg font-semibold mb-2">No providers found</h2>
              <p className="text-sm text-muted">
                Try increasing your search radius or removing filters.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted">
                {providers.length} provider{providers.length !== 1 ? "s" : ""} found
              </p>
              {providers.map((provider) => (
                <ProviderCard
                  key={provider.profile_id}
                  provider={provider}
                  isHighlighted={highlightedId === provider.profile_id}
                  onHover={() => setHighlightedId(provider.profile_id)}
                />
              ))}
            </>
          )}
        </div>

        {/* Map */}
        <div
          className={`${
            showMap ? "block" : "hidden"
          } lg:block lg:w-[45%] h-full`}
        >
          <MapView
            providers={providers}
            center={center}
            zoom={zoom}
            highlightedId={highlightedId}
            selectedId={selectedId}
            onMarkerClick={(id) => setSelectedId(id === selectedId ? null : id)}
            onMarkerHover={setHighlightedId}
          />
        </div>
      </div>
    </div>
  );
}
