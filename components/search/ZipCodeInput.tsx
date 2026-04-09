"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ZipCodeInput({ initialZip = "" }: { initialZip?: string }) {
  const [zip, setZip] = useState(initialZip);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (zip.length === 5) {
      router.push(`/search?zip=${zip}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <input
        type="text"
        maxLength={5}
        value={zip}
        onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
        className="w-36 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Zip Code"
      />
      <button
        type="submit"
        disabled={zip.length !== 5}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
