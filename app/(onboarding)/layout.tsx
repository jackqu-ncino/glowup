import { AuthProvider } from "@/components/auth/AuthProvider";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-3">
            <Link href="/" className="text-xl font-bold text-primary">
              {APP_NAME}
            </Link>
          </div>
        </nav>
        <div className="mx-auto max-w-3xl px-4 py-8">{children}</div>
      </div>
    </AuthProvider>
  );
}
