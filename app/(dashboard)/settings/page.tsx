"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSuccess("");

    await supabase
      .from("users")
      .update({ full_name: fullName })
      .eq("id", user.id);

    setSuccess("Settings saved!");
    setSaving(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-muted"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Account Type</label>
          <p className="text-sm text-muted capitalize">{user.user_type}</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
