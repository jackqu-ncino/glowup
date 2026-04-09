"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";

interface AvatarUploadProps {
  userId: string;
  currentUrl: string | null;
  fullName: string;
  onUploaded: (url: string) => void;
}

export default function AvatarUpload({
  userId,
  currentUrl,
  fullName,
  onUploaded,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (error) {
      alert("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    setPreview(publicUrl);
    onUploaded(publicUrl);
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold overflow-hidden cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          getInitials(fullName || "U")
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-sm font-medium text-primary hover:text-primary-dark"
        >
          {uploading ? "Uploading..." : "Upload Photo"}
        </button>
        <p className="text-xs text-muted mt-1">JPG, PNG. Max 5 MB.</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
