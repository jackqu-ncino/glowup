import usZips from "us-zips";

interface ZipLookupResult {
  lat: number;
  lng: number;
  zip: string;
}

export function lookupZip(zip: string): ZipLookupResult | null {
  const data = (usZips as Record<string, { latitude: number; longitude: number }>)[zip];
  if (!data) return null;
  return {
    lat: data.latitude,
    lng: data.longitude,
    zip,
  };
}

export function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}
