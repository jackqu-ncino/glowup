"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import StepIndicator from "@/components/ui/StepIndicator";
import AvatarUpload from "@/components/profile/AvatarUpload";

export default function OnboardingStep1() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleNext = async () => {
    setSaving(true);
    setError("");

    // Update avatar on users table
    if (avatarUrl) {
      await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
    }

    // Create or update provider_profiles
    const { error: profileError } = await supabase
      .from("provider_profiles")
      .upsert(
        {
          user_id: user.id,
          business_name: businessName || null,
          bio: bio || null,
          zip_code: "00000", // placeholder, set in step 3
        },
        { onConflict: "user_id" }
      );

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    router.push("/step-2");
  };

  return (
    <>
      <StepIndicator currentStep={1} />
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-1">Tell us about yourself</h2>
        <p className="text-sm text-muted mb-6">
          This info will appear on your public profile.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <AvatarUpload
            userId={user.id}
            currentUrl={user.avatar_url}
            fullName={user.full_name}
            onUploaded={setAvatarUrl}
          />

          <div>
            <label className="block text-sm font-medium mb-1">
              Business Name{" "}
              <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Nails by Sarah"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">About You</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Tell potential clients about yourself, your experience, and what makes your services special..."
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleNext}
            disabled={saving}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Next: Services"}
          </button>
        </div>
      </div>
    </>
  );
}
