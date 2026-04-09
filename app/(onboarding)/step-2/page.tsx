"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import StepIndicator from "@/components/ui/StepIndicator";
import { cn } from "@/lib/utils";
import type { Category, Tag } from "@/types";

interface NewService {
  category_id: string;
  name: string;
  price_min: string;
  duration_minutes: string;
}

export default function OnboardingStep2() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [services, setServices] = useState<NewService[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      const [catRes, tagRes] = await Promise.all([
        supabase.from("categories").select("*").order("display_order"),
        supabase.from("tags").select("*").order("display_order"),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (tagRes.data) setTags(tagRes.data);
    }
    loadData();
  }, [supabase]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const addService = () => {
    setServices([
      ...services,
      { category_id: selectedCategories[0] || "", name: "", price_min: "", duration_minutes: "" },
    ]);
  };

  const updateService = (index: number, field: keyof NewService, value: string) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
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

  const handleNext = async () => {
    if (selectedCategories.length === 0) {
      setError("Please select at least one category.");
      return;
    }

    setSaving(true);
    setError("");

    // Get profile
    const { data: profile } = await supabase
      .from("provider_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      setError("Profile not found. Please go back to step 1.");
      setSaving(false);
      return;
    }

    // Clear existing and insert new categories
    await supabase.from("provider_categories").delete().eq("profile_id", profile.id);
    await supabase.from("provider_categories").insert(
      selectedCategories.map((category_id) => ({
        profile_id: profile.id,
        category_id,
      }))
    );

    // Clear existing and insert new tags
    await supabase.from("provider_tags").delete().eq("profile_id", profile.id);
    if (selectedTags.length > 0) {
      await supabase.from("provider_tags").insert(
        selectedTags.map((tag_id) => ({
          profile_id: profile.id,
          tag_id,
        }))
      );
    }

    // Insert services
    if (services.length > 0) {
      const validServices = services.filter((s) => s.name && s.category_id);
      if (validServices.length > 0) {
        await supabase.from("services").insert(
          validServices.map((s, i) => ({
            profile_id: profile.id,
            category_id: s.category_id,
            name: s.name,
            price_min: s.price_min ? parseFloat(s.price_min) : null,
            duration_minutes: s.duration_minutes ? parseInt(s.duration_minutes) : null,
            display_order: i,
          }))
        );
      }
    }

    router.push("/step-3");
  };

  return (
    <>
      <StepIndicator currentStep={2} />
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-1">What do you offer?</h2>
        <p className="text-sm text-muted mb-6">
          Select your categories, add services, and choose identity tags.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Categories */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Categories <span className="text-danger">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
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

        {/* Services */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Services</label>
          {services.map((service, index) => (
            <div key={index} className="mb-3 flex gap-2 items-start">
              <select
                value={service.category_id}
                onChange={(e) => updateService(index, "category_id", e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-2 text-sm w-32"
              >
                <option value="">Category</option>
                {categories
                  .filter((c) => selectedCategories.includes(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <input
                type="text"
                placeholder="Service name"
                value={service.name}
                onChange={(e) => updateService(index, "name", e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Price $"
                value={service.price_min}
                onChange={(e) => updateService(index, "price_min", e.target.value)}
                className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Min"
                value={service.duration_minutes}
                onChange={(e) => updateService(index, "duration_minutes", e.target.value)}
                className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeService(index)}
                className="text-danger hover:text-red-700 px-2 py-2 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addService}
            disabled={selectedCategories.length === 0}
            className="text-sm text-primary hover:text-primary-dark disabled:text-gray-400"
          >
            + Add Service
          </button>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Identity Tags{" "}
            <span className="text-muted font-normal">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
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

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.push("/step-1")}
            className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={saving}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Next: Location"}
          </button>
        </div>
      </div>
    </>
  );
}
