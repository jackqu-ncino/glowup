"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import StarRating from "@/components/reviews/StarRating";
import { getInitials } from "@/lib/utils";
import type { Review, User } from "@/types";

type ReviewWithUser = Review & {
  reviewer?: Pick<User, "full_name" | "avatar_url">;
  provider_profile?: { business_name: string | null; user: Pick<User, "full_name"> };
};

export default function ReviewsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      if (user!.user_type === "provider") {
        // Load reviews received
        const { data: profile } = await supabase
          .from("provider_profiles")
          .select("id")
          .eq("user_id", user!.id)
          .single();

        if (profile) {
          const { data } = await supabase
            .from("reviews")
            .select("*, reviewer:users!reviewer_id(full_name, avatar_url)")
            .eq("provider_profile_id", profile.id)
            .order("created_at", { ascending: false });
          setReviews(data || []);
        }
      } else {
        // Load reviews given
        const { data } = await supabase
          .from("reviews")
          .select("*, provider_profile:provider_profiles!provider_profile_id(business_name, user:users!user_id(full_name))")
          .eq("reviewer_id", user!.id)
          .order("created_at", { ascending: false });
        setReviews(data || []);
      }
      setLoading(false);
    }

    load();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const isProvider = user?.user_type === "provider";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">
        {isProvider ? "Reviews Received" : "My Reviews"}
      </h1>

      {reviews.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted">
            {isProvider ? "No reviews yet." : "You haven't left any reviews yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                  {isProvider && review.reviewer?.avatar_url ? (
                    <img src={review.reviewer.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted">
                      {getInitials(
                        isProvider
                          ? review.reviewer?.full_name || "U"
                          : (review as any).provider_profile?.business_name ||
                            (review as any).provider_profile?.user?.full_name ||
                            "P"
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {isProvider
                      ? review.reviewer?.full_name
                      : (review as any).provider_profile?.business_name ||
                        (review as any).provider_profile?.user?.full_name}
                  </p>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-xs text-muted">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-700">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
