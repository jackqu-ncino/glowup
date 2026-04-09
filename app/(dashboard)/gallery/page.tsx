"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { GalleryImage } from "@/types";

export default function GalleryPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data: profile } = await supabase
        .from("provider_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (profile) {
        setProfileId(profile.id);
        const { data } = await supabase
          .from("gallery_images")
          .select("*")
          .eq("profile_id", profile.id)
          .order("display_order");
        setImages(data || []);
      }
      setLoading(false);
    }
    load();
  }, [user, supabase]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!profileId || files.length === 0) return;

    setUploading(true);
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `gallery/${profileId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from("gallery").upload(path, file);
      if (error) continue;

      const { data: { publicUrl } } = supabase.storage.from("gallery").getPublicUrl(path);

      const { data: newImage } = await supabase
        .from("gallery_images")
        .insert({
          profile_id: profileId,
          image_url: publicUrl,
          storage_path: path,
          display_order: images.length,
        })
        .select()
        .single();

      if (newImage) {
        setImages((prev) => [...prev, newImage]);
      }
    }
    setUploading(false);
  };

  const handleDelete = async (image: GalleryImage) => {
    await supabase.storage.from("gallery").remove([image.storage_path]);
    await supabase.from("gallery_images").delete().eq("id", image.id);
    setImages((prev) => prev.filter((i) => i.id !== image.id));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gallery</h1>
        <label className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark cursor-pointer transition-colors">
          {uploading ? "Uploading..." : "Upload Images"}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-10 rounded-xl border-2 border-dashed border-gray-300">
          <p className="text-muted mb-2">No gallery images yet</p>
          <p className="text-sm text-muted">Upload photos of your work to showcase your talent.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="group relative">
              <img
                src={img.image_url}
                alt={img.caption || "Gallery image"}
                className="h-40 w-full rounded-lg object-cover"
              />
              <button
                onClick={() => handleDelete(img)}
                className="absolute top-2 right-2 rounded-full bg-red-500 text-white w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
