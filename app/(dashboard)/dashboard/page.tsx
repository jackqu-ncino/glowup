"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">Please sign in to access your dashboard.</p>
        <Link href="/login" className="text-primary hover:underline mt-2 inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">
        Welcome back, {user.full_name}
      </h1>

      {user.user_type === "provider" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/profile"
            className="rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold mb-1">My Profile</h3>
            <p className="text-sm text-muted">View and edit your provider profile</p>
          </Link>
          <Link
            href="/services"
            className="rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold mb-1">Services</h3>
            <p className="text-sm text-muted">Manage your service offerings</p>
          </Link>
          <Link
            href="/gallery"
            className="rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold mb-1">Gallery</h3>
            <p className="text-sm text-muted">Upload portfolio images</p>
          </Link>
          <Link
            href="/messages"
            className="rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold mb-1">Messages</h3>
            <p className="text-sm text-muted">Chat with customers</p>
          </Link>
          <Link
            href="/reviews"
            className="rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold mb-1">Reviews</h3>
            <p className="text-sm text-muted">See what customers are saying</p>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/search"
            className="rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold mb-1">Find Providers</h3>
            <p className="text-sm text-muted">Search for beauty providers near you</p>
          </Link>
          <Link
            href="/messages"
            className="rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold mb-1">Messages</h3>
            <p className="text-sm text-muted">Chat with providers</p>
          </Link>
          <Link
            href="/reviews"
            className="rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold mb-1">My Reviews</h3>
            <p className="text-sm text-muted">Reviews you&apos;ve left for providers</p>
          </Link>
        </div>
      )}
    </div>
  );
}
