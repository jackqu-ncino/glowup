"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import StepIndicator from "@/components/ui/StepIndicator";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

export default function OnboardingStep4() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPaymentMethods() {
      const { data } = await supabase.from("payment_methods").select("*");
      if (data) setPaymentMethods(data);
    }
    loadPaymentMethods();
  }, [supabase]);

  const togglePayment = (id: string) => {
    setSelectedPayments((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setGalleryFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setGalleryPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

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

  const handleFinish = async () => {
    setSaving(true);
    setError("");

    // Get profile
    const { data: profile } = await supabase
      .from("provider_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      setError("Profile not found.");
      setSaving(false);
      return;
    }

    // Update social links
    await supabase
      .from("provider_profiles")
      .update({
        instagram_url: instagramUrl || null,
        tiktok_url: tiktokUrl || null,
        facebook_url: facebookUrl || null,
        is_published: true,
        onboarding_completed: true,
      })
      .eq("id", profile.id);

    // Save payment methods
    await supabase
      .from("provider_payment_methods")
      .delete()
      .eq("profile_id", profile.id);
    if (selectedPayments.length > 0) {
      await supabase.from("provider_payment_methods").insert(
        selectedPayments.map((payment_method_id) => ({
          profile_id: profile.id,
          payment_method_id,
        }))
      );
    }

    // Upload gallery images
    for (let i = 0; i < galleryFiles.length; i++) {
      const file = galleryFiles[i];
      const ext = file.name.split(".").pop();
      const path = `gallery/${profile.id}/${Date.now()}-${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(path, file);

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("gallery").getPublicUrl(path);

        await supabase.from("gallery_images").insert({
          profile_id: profile.id,
          image_url: publicUrl,
          storage_path: path,
          display_order: i,
        });
      }
    }

    router.push("/dashboard");
  };

  return (
    <>
      <StepIndicator currentStep={4} />
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-1">Finishing touches</h2>
        <p className="text-sm text-muted mb-6">
          Add your portfolio, social links, and payment preferences.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Gallery */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Portfolio Gallery
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
              {galleryPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Gallery ${index + 1}`}
                    className="h-24 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute top-1 right-1 rounded-full bg-black/50 text-white w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    x
                  </button>
                </div>
              ))}
              <label className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-primary hover:text-primary transition-colors">
                <span className="text-2xl">+</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGallerySelect}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-muted">
              Upload photos of your work. Max 20 images, 5 MB each.
            </p>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Social Links
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-24 text-sm text-muted">Instagram</span>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 text-sm text-muted">TikTok</span>
                <input
                  type="url"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://tiktok.com/@yourhandle"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 text-sm text-muted">Facebook</span>
                <input
                  type="url"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Accepted Payment Methods
            </label>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => togglePayment(pm.id)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors border",
                    selectedPayments.includes(pm.id)
                      ? "border-success bg-success/10 text-success"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {pm.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => router.push("/step-3")}
            className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleFinish}
            disabled={saving}
            className="rounded-md bg-success px-6 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {saving ? "Publishing..." : "Publish My Profile"}
          </button>
        </div>
      </div>
    </>
  );
}
