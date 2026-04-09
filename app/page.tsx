"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";

const CATEGORIES = [
  { name: "Hair", slug: "hair", emoji: "✂️" },
  { name: "Nails", slug: "nails", emoji: "💅" },
  { name: "Brows", slug: "brows", emoji: "🤨" },
  { name: "Lashes", slug: "lashes", emoji: "✨" },
  { name: "Makeup", slug: "makeup", emoji: "🎨" },
  { name: "Skincare", slug: "skincare", emoji: "💧" },
  { name: "Waxing", slug: "waxing", emoji: "⭐" },
  { name: "Barbering", slug: "barbering", emoji: "💈" },
];

export default function HomePage() {
  const [zip, setZip] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (zip.length === 5) {
      router.push(`/search?zip=${zip}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Image src="/logo.svg" alt={APP_NAME} width={140} height={36} priority />
          <div className="flex items-center gap-4">
            <Link href="/search" className="text-sm text-gray-600 hover:text-gray-900">
              Find Providers
            </Link>
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Find beauty providers{" "}
            <span className="text-primary">near you</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-8">
            Discover talented independent beauty artists in your area — hair stylists,
            nail technicians, brow artists, lash techs, and more. Support local.
            Look amazing.
          </p>

          <form onSubmit={handleSearch} className="flex justify-center gap-3 max-w-md mx-auto">
            <input
              type="text"
              maxLength={5}
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
              className="w-40 rounded-lg border border-gray-300 px-4 py-3 text-lg text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Zip Code"
            />
            <button
              type="submit"
              disabled={zip.length !== 5}
              className="rounded-lg bg-primary px-8 py-3 text-lg font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors shadow-lg shadow-primary/25"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center mb-8">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/search?category=${cat.slug}`}
                className="flex flex-col items-center rounded-xl border border-gray-200 p-6 hover:border-primary hover:shadow-md transition-all"
              >
                <span className="text-3xl mb-2">{cat.emoji}</span>
                <span className="text-sm font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center mb-10">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                1
              </div>
              <h3 className="font-semibold mb-1">Search</h3>
              <p className="text-sm text-muted">
                Enter your zip code and browse providers near you. Filter by
                category, tags, and more.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                2
              </div>
              <h3 className="font-semibold mb-1">Connect</h3>
              <p className="text-sm text-muted">
                View profiles, portfolios, and reviews. Message providers
                directly to discuss your needs.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                3
              </div>
              <h3 className="font-semibold mb-1">Book</h3>
              <p className="text-sm text-muted">
                Arrange your appointment — at their studio, your home, or
                wherever works best for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Provider CTA */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold mb-3">
            Are you a beauty provider?
          </h2>
          <p className="text-muted mb-6">
            Join {APP_NAME} for free. Create your profile, showcase your work,
            and connect with clients in your area. No salon needed — just your
            talent.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-lg bg-accent px-8 py-3 text-lg font-semibold text-white hover:bg-purple-700 transition-colors shadow-lg shadow-accent/25"
          >
            Join as a Provider
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted">
              &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/search" className="text-sm text-muted hover:text-gray-900">
                Find Providers
              </Link>
              <Link href="/signup" className="text-sm text-muted hover:text-gray-900">
                Become a Provider
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
