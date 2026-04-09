"use client";

import Link from "next/link";
import { formatDistance, formatCurrency, getInitials, cn } from "@/lib/utils";
import { LOCATION_TYPE_LABELS } from "@/lib/constants";
import type { ProviderSearchResult } from "@/types";

interface ProviderCardProps {
  provider: ProviderSearchResult;
  isHighlighted?: boolean;
  onHover?: () => void;
}

export default function ProviderCard({
  provider,
  isHighlighted,
  onHover,
}: ProviderCardProps) {
  return (
    <Link
      href={`/providers/${provider.profile_id}`}
      className={cn(
        "block rounded-lg border p-4 transition-all hover:shadow-md",
        isHighlighted
          ? "border-primary bg-primary/5 shadow-md"
          : "border-gray-200 bg-white"
      )}
      onMouseEnter={onHover}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="h-14 w-14 shrink-0 rounded-full overflow-hidden bg-primary/10">
          {provider.avatar_url ? (
            <img
              src={provider.avatar_url}
              alt={provider.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-primary font-bold">
              {getInitials(provider.full_name)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + Rating */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold truncate">
              {provider.business_name || provider.full_name}
            </h3>
            <span className="shrink-0 text-sm text-muted">
              {formatDistance(provider.distance_miles)}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-0.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={cn(
                    "text-xs",
                    star <= Math.round(provider.average_rating)
                      ? "text-warning"
                      : "text-gray-300"
                  )}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-muted">
              {provider.average_rating > 0
                ? `${provider.average_rating.toFixed(1)} (${provider.review_count})`
                : "New"}
            </span>
          </div>

          {/* Location type */}
          <p className="text-xs text-muted mt-1">
            {provider.city && provider.state
              ? `${provider.city}, ${provider.state}`
              : provider.zip_code}{" "}
            &middot; {LOCATION_TYPE_LABELS[provider.location_type]}
          </p>

          {/* Categories */}
          {provider.categories && provider.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {provider.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          {/* Tags */}
          {provider.tags && provider.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {provider.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Top services */}
          {provider.services && provider.services.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {provider.services.slice(0, 2).map((svc) => (
                <div key={svc.id} className="flex justify-between text-xs">
                  <span className="text-gray-600 truncate">{svc.name}</span>
                  {svc.price_min && (
                    <span className="text-gray-900 font-medium ml-2">
                      {formatCurrency(svc.price_min)}+
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
