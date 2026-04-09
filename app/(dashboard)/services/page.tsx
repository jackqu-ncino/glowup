"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import type { Service, Category } from "@/types";

export default function ServicesPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New service form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [profileRes, catRes] = await Promise.all([
        supabase.from("provider_profiles").select("id").eq("user_id", user!.id).single(),
        supabase.from("categories").select("*").order("display_order"),
      ]);

      if (catRes.data) setCategories(catRes.data);

      if (profileRes.data) {
        setProfileId(profileRes.data.id);
        const { data } = await supabase
          .from("services")
          .select("*")
          .eq("profile_id", profileRes.data.id)
          .order("display_order");
        setServices(data || []);
      }
      setLoading(false);
    }
    load();
  }, [user, supabase]);

  const resetForm = () => {
    setName("");
    setCategoryId("");
    setPriceMin("");
    setPriceMax("");
    setDuration("");
    setDescription("");
    setEditingId(null);
    setShowForm(false);
  };

  const editService = (svc: Service) => {
    setName(svc.name);
    setCategoryId(svc.category_id);
    setPriceMin(svc.price_min?.toString() || "");
    setPriceMax(svc.price_max?.toString() || "");
    setDuration(svc.duration_minutes?.toString() || "");
    setDescription(svc.description || "");
    setEditingId(svc.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!profileId || !name || !categoryId) return;
    setSaving(true);

    const serviceData = {
      profile_id: profileId,
      category_id: categoryId,
      name,
      description: description || null,
      price_min: priceMin ? parseFloat(priceMin) : null,
      price_max: priceMax ? parseFloat(priceMax) : null,
      duration_minutes: duration ? parseInt(duration) : null,
    };

    if (editingId) {
      const { data } = await supabase
        .from("services")
        .update(serviceData)
        .eq("id", editingId)
        .select()
        .single();
      if (data) {
        setServices((prev) => prev.map((s) => (s.id === editingId ? data : s)));
      }
    } else {
      const { data } = await supabase
        .from("services")
        .insert({ ...serviceData, display_order: services.length })
        .select()
        .single();
      if (data) {
        setServices((prev) => [...prev, data]);
      }
    }

    setSaving(false);
    resetForm();
  };

  const deleteService = async (id: string) => {
    await supabase.from("services").delete().eq("id", id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Services</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
          >
            Add Service
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-xl bg-white p-6 shadow-sm mb-6">
          <h3 className="font-semibold mb-4">
            {editingId ? "Edit Service" : "New Service"}
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Gel Manicure" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Select</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Min Price ($)</label>
                <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Price ($)</label>
                <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (min)</label>
                <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Optional description" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving || !name || !categoryId} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
                {saving ? "Saving..." : editingId ? "Update" : "Add Service"}
              </button>
              <button onClick={resetForm} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service List */}
      {services.length === 0 ? (
        <div className="text-center py-10 rounded-xl border-2 border-dashed border-gray-300">
          <p className="text-muted">No services yet. Add your first service above.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm divide-y divide-gray-100">
          {services.map((svc) => (
            <div key={svc.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{svc.name}</p>
                <p className="text-sm text-muted">
                  {categories.find((c) => c.id === svc.category_id)?.name}
                  {svc.duration_minutes ? ` · ${svc.duration_minutes} min` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {svc.price_min && (
                  <span className="text-sm font-medium">
                    {formatCurrency(svc.price_min)}
                    {svc.price_max ? ` - ${formatCurrency(svc.price_max)}` : "+"}
                  </span>
                )}
                <button onClick={() => editService(svc)} className="text-xs text-primary hover:text-primary-dark">
                  Edit
                </button>
                <button onClick={() => deleteService(svc.id)} className="text-xs text-danger hover:text-red-700">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
