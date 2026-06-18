"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, ShoppingBag, X } from "lucide-react";
import clsx from "clsx";

interface StorefrontItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  gender_target: string;
  price: number;
  currency: string;
  stock_count: number;
  materials: string | null;
  is_active: number;
}

export default function StorefrontPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<StorefrontItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("casual");
  const [genderTarget, setGenderTarget] = useState("unisex");
  const [price, setPrice] = useState("");
  const [materials, setMaterials] = useState("");
  const [stockCount, setStockCount] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchItems = () => {
    if (!token) return;
    api<StorefrontItem[]>("/api/tailor/storefront", { token })
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, [token]);

  const handleCreate = async () => {
    if (!token || !title || !price) return;
    setSaving(true);
    try {
      await api("/api/tailor/storefront", {
        method: "POST",
        token,
        body: {
          title,
          description: description || null,
          category,
          gender_target: genderTarget,
          price: parseFloat(price),
          materials: materials || null,
          stock_count: parseInt(stockCount) || 0,
        },
      });
      setTitle("");
      setDescription("");
      setPrice("");
      setMaterials("");
      setStockCount("");
      setShowForm(false);
      fetchItems();
    } catch {
      // silently handle
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await api(`/api/tailor/storefront/${id}`, { method: "DELETE", token });
      setItems(items.filter((i) => i.id !== id));
    } catch {
      // silently handle
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Storefront</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your items and inventory
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? (
            <>
              <X className="h-4 w-4 mr-2" /> Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </>
          )}
        </Button>
      </div>

      {/* Add Item Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">New Item</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                id="title"
                label="Title"
                placeholder="Item name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Input
                id="price"
                label="Price (USD)"
                type="number"
                step="0.01"
                placeholder="99.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <Input
              id="desc"
              label="Description"
              placeholder="Describe your item"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm"
                >
                  <option value="casual">Casual</option>
                  <option value="traditional">Traditional</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Gender Target
                </label>
                <select
                  value={genderTarget}
                  onChange={(e) => setGenderTarget(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
              <Input
                id="stock"
                label="Stock Count"
                type="number"
                placeholder="0"
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value)}
              />
            </div>
            <Input
              id="materials"
              label="Materials"
              placeholder="Cotton, Silk, etc."
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
            />
            <Button onClick={handleCreate} disabled={saving || !title || !price}>
              {saving ? "Creating..." : "Create Item"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No items in your storefront</p>
          <p className="text-sm text-gray-400 mt-1">
            Add items to start selling
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{item.title}</h3>
                      <p className="text-xs text-gray-400">
                        {item.category} &middot; {item.gender_target} &middot;{" "}
                        {item.stock_count} in stock
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold">
                      ${item.price.toFixed(2)}
                    </span>
                    <Badge variant={item.is_active ? "success" : "default"}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
