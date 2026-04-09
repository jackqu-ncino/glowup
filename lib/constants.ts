export const APP_NAME = "GlowUp";
export const APP_DESCRIPTION =
  "Find independent beauty providers near you — hair, nails, brows, lashes, and more.";

export const DEFAULT_SEARCH_RADIUS_MILES = 25;
export const MAX_SEARCH_RADIUS_MILES = 50;
export const MIN_SEARCH_RADIUS_MILES = 5;

export const MAX_GALLERY_IMAGES = 20;
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  home_studio: "Home Studio",
  separate_studio: "Separate Studio",
  mobile: "Mobile (Comes to You)",
};

export const SORT_OPTIONS = [
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Highest Rated" },
  { value: "reviews", label: "Most Reviews" },
  { value: "price_low", label: "Price: Low to High" },
] as const;

export const US_CENTER = { lat: 39.8283, lng: -98.5795 };
export const DEFAULT_ZOOM = 4;
export const SEARCH_ZOOM = 11;
