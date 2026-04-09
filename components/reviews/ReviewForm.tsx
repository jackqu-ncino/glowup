"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import StarRating from "./StarRating";

interface ReviewFormProps {
  profileId: string;
  reviewerId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}

export default function ReviewForm({
  profileId,
  reviewerId,
  onSubmitted,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }

    setSaving(true);
    setError("");

    const { error: insertError } = await supabase.from("reviews").insert({
      provider_profile_id: profileId,
      reviewer_id: reviewerId,
      rating,
      comment: comment || null,
    });

    if (insertError) {
      if (insertError.message.includes("duplicate")) {
        setError("You have already reviewed this provider.");
      } else {
        setError(insertError.message);
      }
      setSaving(false);
      return;
    }

    onSubmitted();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Your Rating</label>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Comment <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Share your experience..."
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {saving ? "Submitting..." : "Submit Review"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
