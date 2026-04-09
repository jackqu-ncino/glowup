"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LOCATION_TYPE_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { ProviderProfileFull } from "@/types";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProviderProfileFull | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      const { data: profileData } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (!profileData) {
        setLoading(false);
        return;
      }

      const [catRes, tagRes, pmRes, svcRes, galRes] = await Promise.all([
        supabase
          .from("provider_categories")
          .select("category_id, categories(*)")
          .eq("profile_id", profileData.id),
        supabase
          .from("provider_tags")
          .select("tag_id, tags(*)")
          .eq("profile_id", profileData.id),
        supabase
          .from("provider_payment_methods")
          .select("payment_method_id, payment_methods(*)")
          .eq("profile_id", profileData.id),
        supabase
          .from("services")
          .select("*")
          .eq("profile_id", profileData.id)
          .order("display_order"),
        supabase
          .from("gallery_images")
          .select("*")
          .eq("profile_id", profileData.id)
          .order("display_order"),
      ]);

      setProfile({
        ...profileData,
        user: { full_name: user!.full_name, avatar_url: user!.avatar_url, email: user!.email },
        categories: catRes.data?.map((c: any) => c.categories) || [],
        tags: tagRes.data?.map((t: any) => t.tags) || [],
        payment_methods: pmRes.data?.map((p: any) => p.payment_methods) || [],
        services: svcRes.data || [],
        gallery_images: galRes.data || [],
      });
      setLoading(false);
    }

    loadProfile();
  }, [user, supabase]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold mb-2">No profile yet</h2>
        <p className="text-muted mb-4">Set up your provider profile to get started.</p>
        <Link
          href="/step-1"
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Start Onboarding
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Link
          href="/profile/edit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
        >
          Edit Profile
        </Link>
      </div>

      {!profile.is_published && (
        <div className="mb-4 rounded-md bg-warning/10 border border-warning/30 p-3 text-sm text-yellow-800">
          Your profile is not published yet. It won&apos;t appear in search results.
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl bg-white p-6 shadow-sm mb-4">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 rounded-full bg-primary/10 overflow-hidden">
            {profile.user.avatar_url ? (
              <img src={profile.user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-primary text-xl font-bold">
                {profile.user.full_name[0]}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {profile.business_name || profile.user.full_name}
            </h2>
            {profile.business_name && (
              <p className="text-sm text-muted">{profile.user.full_name}</p>
            )}
            <p className="text-sm text-muted mt-1">
              {profile.city && profile.state
                ? `${profile.city}, ${profile.state}`
                : profile.zip_code}{" "}
              &middot; {LOCATION_TYPE_LABELS[profile.location_type]}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>
        {profile.bio && <p className="mt-4 text-sm text-gray-700">{profile.bio}</p>}
      </div>

      {/* Categories */}
      <div className="rounded-xl bg-white p-6 shadow-sm mb-4">
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {profile.categories.map((cat) => (
            <span
              key={cat.id}
              className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              {cat.name}
            </span>
          ))}
        </div>
      </div>

      {/* Services */}
      {profile.services.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm mb-4">
          <h3 className="font-semibold mb-3">Services</h3>
          <div className="space-y-2">
            {profile.services.map((svc) => (
              <div key={svc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium">{svc.name}</p>
                  {svc.duration_minutes && (
                    <p className="text-xs text-muted">{svc.duration_minutes} min</p>
                  )}
                </div>
                {svc.price_min && (
                  <span className="text-sm font-medium">
                    {formatCurrency(svc.price_min)}
                    {svc.price_max ? ` - ${formatCurrency(svc.price_max)}` : "+"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Methods */}
      {profile.payment_methods.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm mb-4">
          <h3 className="font-semibold mb-3">Accepted Payments</h3>
          <div className="flex flex-wrap gap-2">
            {profile.payment_methods.map((pm) => (
              <span
                key={pm.id}
                className="rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success"
              >
                {pm.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gallery */}
      {profile.gallery_images.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm mb-4">
          <h3 className="font-semibold mb-3">Gallery</h3>
          <div className="grid grid-cols-3 gap-2">
            {profile.gallery_images.map((img) => (
              <img
                key={img.id}
                src={img.image_url}
                alt={img.caption || "Gallery image"}
                className="h-32 w-full rounded-lg object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {/* Social Links */}
      {(profile.instagram_url || profile.tiktok_url || profile.facebook_url) && (
        <div className="rounded-xl bg-white p-6 shadow-sm mb-4">
          <h3 className="font-semibold mb-3">Social Media</h3>
          <div className="flex gap-4">
            {profile.instagram_url && (
              <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                Instagram
              </a>
            )}
            {profile.tiktok_url && (
              <a href={profile.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                TikTok
              </a>
            )}
            {profile.facebook_url && (
              <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                Facebook
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
