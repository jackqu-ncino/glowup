"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

const PROVIDER_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "My Profile" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/messages", label: "Messages" },
  { href: "/reviews", label: "Reviews" },
  { href: "/settings", label: "Settings" },
];

const CUSTOMER_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search", label: "Find Providers" },
  { href: "/messages", label: "Messages" },
  { href: "/reviews", label: "My Reviews" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = user?.user_type === "provider" ? PROVIDER_LINKS : CUSTOMER_LINKS;

  return (
    <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-gray-50 lg:block">
      <nav className="flex flex-col gap-1 p-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === link.href
                ? "bg-primary/10 text-primary"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
