"use client";

import { cn } from "@/lib/utils";
import { SORT_OPTIONS } from "@/lib/constants";
import type { Category, Tag } from "@/types";

interface SearchFiltersProps {
  categories: Category[];
  tags: Tag[];
  selectedCategory: string;
  selectedTag: string;
  sortBy: string;
  radius: number;
  onCategoryChange: (slug: string) => void;
  onTagChange: (slug: string) => void;
  onSortChange: (sort: string) => void;
  onRadiusChange: (radius: number) => void;
}

export default function SearchFilters({
  categories,
  tags,
  selectedCategory,
  selectedTag,
  sortBy,
  radius,
  onCategoryChange,
  onTagChange,
  onSortChange,
  onRadiusChange,
}: SearchFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Categories */}
      <div>
        <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wide">
          Category
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onCategoryChange("")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
              !selectedCategory
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => onCategoryChange(cat.slug === selectedCategory ? "" : cat.slug)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                cat.slug === selectedCategory
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wide">
          Filter by Tag
        </label>
        <select
          value={selectedTag}
          onChange={(e) => onTagChange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">All providers</option>
          {tags.map((tag) => (
            <option key={tag.slug} value={tag.slug}>
              {tag.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sort + Radius */}
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wide">
            Sort by
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wide">
            Radius: {radius} mi
          </label>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={radius}
            onChange={(e) => onRadiusChange(parseInt(e.target.value))}
            className="w-32 accent-primary"
          />
        </div>
      </div>
    </div>
  );
}
