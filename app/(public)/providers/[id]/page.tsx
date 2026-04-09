"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import StarRating from "@/components/reviews/StarRating";
import ReviewForm from "@/components/reviews/ReviewForm";
import { LOCATION_TYPE_LABELS } from "@/lib/constants";
import { formatCurrency, formatDuration, getInitials } from "@/lib/utils";
import type { ProviderProfileFull, Review, User } from "@/types";

export default function ProviderPublicProfile() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const profileId = params.id as string;
  const [profile, setProfile] = useState<ProviderProfileFull | null>(null);
  const [reviews, setReviews] = useState<(Review & { reviewer: Pick<User, "full_name" | "avatar_url"> })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const loadData = async () => {
    const { data: profileData } = await supabase
      .from("provider_profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }

    const [userRes, catRes, tagRes, pmRes, svcRes, galRes, revRes] = await Promise.all([
      supabase.from("users").select("full_name, avatar_url, email").eq("id", profileData.user_id).single(),
      supabase.from("provider_categories").select("categories(*)").eq("profile_id", profileId),
      supabase.from("provider_tags").select("tags(*)").eq("profile_id", profileId),
      supabase.from("provider_payment_methods").select("payment_methods(*)").eq("profile_id", profileId),
      supabase.from("services").select("*").eq("profile_id", profileId).eq("is_active", true).order("display_order"),
      supabase.from("gallery_images").select("*").eq("profile_id", profileId).order("display_order"),
      supabase.from("reviews").select("*, reviewer:users!reviewer_id(full_name, avatar_url)").eq("provider_profile_id", profileId).order("created_at", { ascending: false }),
    ]);

    setProfile({
      ...profileData,
      user: userRes.data || { full_name: "", avatar_url: null, email: "" },
      categories: catRes.data?.map((c: any) => c.categories) || [],
      tags: tagRes.data?.map((t: any) => t.tags) || [],
      payment_methods: pmRes.data?.map((p: any) => p.payment_methods) || [],
      services: svcRes.data || [],
      gallery_images: galRes.data || [],
    });
    setReviews(revRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [profileId]);

  const handleMessage = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!profile) return;

    // Check for existing conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("customer_id", user.id)
      .eq("provider_id", profile.user_id)
      .single();

    if (existing) {
      router.push(`/messages/${existing.id}`);
      return;
    }

    // Create new conversation
    const { data: newConv } = await supabase
      .from("conversations")
      .insert({ customer_id: user.id, provider_id: profile.user_id })
      .select("id")
      .single();

    if (newConv) {
      router.push(`/messages/${newConv.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold mb-2">Provider not found</h2>
        <p className="text-muted">This profile may have been removed or unpublished.</p>
      </div>
    );
  }

  // Group services by category
  const servicesByCategory = profile.services.reduce(
    (acc, svc) => {
      const cat = profile.categories.find((c) => c.id === svc.category_id);
      const catName = cat?.name || "Other";
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(svc);
      return acc;
    },
    {} as Record<string, typeof profile.services>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="rounded-xl bg-white p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-24 w-24 shrink-0 rounded-full overflow-hidden bg-primary/10">
            {profile.user.avatar_url ? (
              <img src={profile.user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-primary text-2xl font-bold">
                {getInitials(profile.user.full_name)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {profile.business_name || profile.user.full_name}
            </h1>
            {profile.business_name && (
              <p className="text-muted">{profile.user.full_name}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={profile.average_rating} size="sm" />
              <span className="text-sm text-muted">
                {profile.average_rating > 0
                  ? `${profile.average_rating.toFixed(1)} (${profile.review_count} review${profile.review_count !== 1 ? "s" : ""})`
                  : "No reviews yet"}
              </span>
            </div>
            <p className="text-sm text-muted mt-1">
              {profile.city && profile.state
                ? `${profile.city}, ${profile.state}`
                : profile.zip_code}{" "}
              &middot; {LOCATION_TYPE_LABELS[profile.location_type]}
            </p>

            {/* Tags */}
            {profile.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {profile.tags.map((tag) => (
                  <span key={tag.id} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 sm:items-end">
            <button
              onClick={handleMessage}
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
            >
              Message Provider
            </button>

            {/* Social links */}
            <div className="flex gap-2">
              {profile.instagram_url && (
                <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-muted hover:text-gray-900 hover:border-gray-300 transition-colors">
                  Instagram
                </a>
              )}
              {profile.tiktok_url && (
                <a href={profile.tiktok_url} target="_blank" rel="noopener noreferrer" className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-muted hover:text-gray-900 hover:border-gray-300 transition-colors">
                  TikTok
                </a>
              )}
              {profile.facebook_url && (
                <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-muted hover:text-gray-900 hover:border-gray-300 transition-colors">
                  Facebook
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
        )}
      </div>

      {/* Payment Methods */}
      {profile.payment_methods.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm mb-6">
          <h2 className="font-semibold mb-3">Accepted Payments</h2>
          <div className="flex flex-wrap gap-2">
            {profile.payment_methods.map((pm) => (
              <span key={pm.id} className="rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
                {pm.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {profile.services.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm mb-6">
          <h2 className="font-semibold mb-4">Services</h2>
          {Object.entries(servicesByCategory).map(([catName, services]) => (
            <div key={catName} className="mb-4 last:mb-0">
              <h3 className="text-sm font-medium text-muted mb-2">{catName}</h3>
              <div className="space-y-2">
                {services.map((svc) => (
                  <div key={svc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{svc.name}</p>
                      {svc.description && <p className="text-xs text-muted">{svc.description}</p>}
                      {svc.duration_minutes && (
                        <p className="text-xs text-muted">{formatDuration(svc.duration_minutes)}</p>
                      )}
                    </div>
                    {svc.price_min && (
                      <span className="text-sm font-semibold">
                        {formatCurrency(svc.price_min)}
                        {svc.price_max ? ` - ${formatCurrency(svc.price_max)}` : "+"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gallery */}
      {profile.gallery_images.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm mb-6">
          <h2 className="font-semibold mb-4">Portfolio</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {profile.gallery_images.map((img) => (
              <img
                key={img.id}
                src={img.image_url}
                alt={img.caption || "Portfolio image"}
                className="h-40 w-full rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightboxImage(img.image_url)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="rounded-xl bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">
            Reviews ({profile.review_count})
          </h2>
          {user && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="text-sm font-medium text-primary hover:text-primary-dark"
            >
              Write a Review
            </button>
          )}
        </div>

        {showReviewForm && user && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <ReviewForm
              profileId={profileId}
              reviewerId={user.id}
              onSubmitted={() => {
                setShowReviewForm(false);
                loadData();
              }}
              onCancel={() => setShowReviewForm(false)}
            />
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-muted">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                    {review.reviewer?.avatar_url ? (
                      <img src={review.reviewer.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted">
                        {getInitials(review.reviewer?.full_name || "U")}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{review.reviewer?.full_name}</p>
                    <div className="flex items-center gap-1">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs text-muted">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Gallery"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:opacity-80"
          >
            x
          </button>
        </div>
      )}
    </div>
  );
}
