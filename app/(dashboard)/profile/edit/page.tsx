"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import AvatarUpload from "@/components/profile/AvatarUpload";
import { lookupZip, isValidZip } from "@/lib/geocoding";
import { LOCATION_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Category, Tag, PaymentMethod, LocationType } from "@/types";

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [profileId, setProfileId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [radius, setRadius] = useState(10);
  const [locationType, setLocationType] = useState<LocationType>("home_studio");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) return;

    async function load() {
      const [catRes, tagRes, pmRes, profileRes] = await Promise.all([
        supabase.from("categories").select("*").order("display_order"),
        supabase.from("tags").select("*").order("display_order"),
        supabase.from("payment_methods").select("*"),
        supabase.from("provider_profiles").select("*").eq("user_id", user!.id).single(),
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (tagRes.data) setTags(tagRes.data);
      if (pmRes.data) setPaymentMethods(pmRes.data);

      if (profileRes.data) {
        const p = profileRes.data;
        setProfileId(p.id);
        setBusinessName(p.business_name || "");
        setBio(p.bio || "");
        setZipCode(p.zip_code || "");
        setCity(p.city || "");
        setState(p.state || "");
        setRadius(p.service_radius_miles || 10);
        setLocationType(p.location_type || "home_studio");
        setInstagramUrl(p.instagram_url || "");
        setTiktokUrl(p.tiktok_url || "");
        setFacebookUrl(p.facebook_url || "");
        setIsPublished(p.is_published || false);

        // Load junction data
        const [selCats, selTags, selPms] = await Promise.all([
          supabase.from("provider_categories").select("category_id").eq("profile_id", p.id),
          supabase.from("provider_tags").select("tag_id").eq("profile_id", p.id),
          supabase.from("provider_payment_methods").select("payment_method_id").eq("profile_id", p.id),
        ]);
        setSelectedCategories(selCats.data?.map((c: any) => c.category_id) || []);
        setSelectedTags(selTags.data?.map((t: any) => t.tag_id) || []);
        setSelectedPayments(selPms.data?.map((p: any) => p.payment_method_id) || []);
      }

      setLoading(false);
    }

    load();
  }, [user, supabase]);

  const handleSave = async () => {
    if (!profileId || !user) return;
    setSaving(true);
    setError("");
    setSuccess("");

    // Update profile fields
    const updateData: Record<string, any> = {
      business_name: businessName || null,
      bio: bio || null,
      zip_code: zipCode,
      city: city || null,
      state: state || null,
      service_radius_miles: radius,
      location_type: locationType,
      instagram_url: instagramUrl || null,
      tiktok_url: tiktokUrl || null,
      facebook_url: facebookUrl || null,
      is_published: isPublished,
    };

    // Geocode zip
    if (isValidZip(zipCode)) {
      const coords = lookupZip(zipCode);
      if (coords) {
        updateData.location = `SRID=4326;POINT(${coords.lng} ${coords.lat})`;
      }
    }

    const { error: updateError } = await supabase
      .from("provider_profiles")
      .update(updateData)
      .eq("id", profileId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    // Update junction tables
    await supabase.from("provider_categories").delete().eq("profile_id", profileId);
    if (selectedCategories.length > 0) {
      await supabase.from("provider_categories").insert(
        selectedCategories.map((category_id) => ({ profile_id: profileId, category_id }))
      );
    }

    await supabase.from("provider_tags").delete().eq("profile_id", profileId);
    if (selectedTags.length > 0) {
      await supabase.from("provider_tags").insert(
        selectedTags.map((tag_id) => ({ profile_id: profileId, tag_id }))
      );
    }

    await supabase.from("provider_payment_methods").delete().eq("profile_id", profileId);
    if (selectedPayments.length > 0) {
      await supabase.from("provider_payment_methods").insert(
        selectedPayments.map((payment_method_id) => ({ profile_id: profileId, payment_method_id }))
      );
    }

    setSuccess("Profile updated successfully!");
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <button
          onClick={() => router.push("/profile")}
          className="text-sm text-muted hover:text-gray-900"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Basic Info</h3>
          <div className="space-y-4">
            <AvatarUpload
              userId={user.id}
              currentUrl={user.avatar_url}
              fullName={user.full_name}
              onUploaded={async (url) => {
                await supabase.from("users").update({ avatar_url: url }).eq("id", user.id);
              }}
            />
            <div>
              <label className="block text-sm font-medium mb-1">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">About You</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setSelectedCategories((prev) =>
                    prev.includes(cat.id) ? prev.filter((c) => c !== cat.id) : [...prev, cat.id]
                  )
                }
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors border",
                  selectedCategories.includes(cat.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Identity Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() =>
                  setSelectedTags((prev) =>
                    prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                  )
                }
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors border",
                  selectedTags.includes(tag.id)
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Location</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Zip Code</label>
                <input type="text" maxLength={5} value={zipCode} onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ""))} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input type="text" maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service Radius: {radius} miles</label>
              <input type="range" min={5} max={50} step={5} value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} className="w-full accent-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location Type</label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(LOCATION_TYPE_LABELS) as [LocationType, string][]).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setLocationType(value)} className={cn("rounded-lg border-2 p-2 text-center text-sm font-medium transition-colors", locationType === value ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Social Links</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-24 text-sm text-muted">Instagram</span>
              <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-24 text-sm text-muted">TikTok</span>
              <input type="url" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-24 text-sm text-muted">Facebook</span>
              <input type="url" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Accepted Payments</h3>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((pm) => (
              <button key={pm.id} type="button" onClick={() => setSelectedPayments((prev) => prev.includes(pm.id) ? prev.filter((p) => p !== pm.id) : [...prev, pm.id])} className={cn("rounded-full px-4 py-2 text-sm font-medium transition-colors border", selectedPayments.includes(pm.id) ? "border-success bg-success/10 text-success" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                {pm.name}
              </button>
            ))}
          </div>
        </div>

        {/* Publish Toggle */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Profile Visibility</h3>
              <p className="text-sm text-muted">When published, your profile appears in search results.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                isPublished ? "bg-success" : "bg-gray-200"
              )}
            >
              <span className={cn("pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform", isPublished ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button onClick={() => router.push("/profile")} className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
