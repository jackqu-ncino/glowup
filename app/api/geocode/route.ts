import { NextResponse } from "next/server";
import { lookupZip, isValidZip } from "@/lib/geocoding";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get("zip");

  if (!zip || !isValidZip(zip)) {
    return NextResponse.json({ error: "Invalid zip code" }, { status: 400 });
  }

  const result = lookupZip(zip);
  if (!result) {
    return NextResponse.json({ error: "Zip code not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
