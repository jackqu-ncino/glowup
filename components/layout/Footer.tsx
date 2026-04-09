import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
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
  );
}
