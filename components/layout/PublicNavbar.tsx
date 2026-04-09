"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";

export default function PublicNavbar() {
  const { user, loading } = useAuth();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/">
          <Image src="/logo.svg" alt={APP_NAME} width={140} height={36} />
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/search"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Find Providers
          </Link>
          {loading ? null : user ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
