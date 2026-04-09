"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";
import { getInitials } from "@/lib/utils";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

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
          <Link
            href="/messages"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Messages
          </Link>

          {user && (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-white"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  getInitials(user.full_name)
                )}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
