"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ShoppingBag } from "lucide-react";
import clsx from "clsx";

interface StorefrontItem {
  id: string;
  tailor_id: string;
  title: string;
  description: string | null;
  category: string;
  gender_target: string;
  price: number;
  currency: string;
  stock_count: number;
  materials: string | null;
  sizes_available: string | null;
}

const categories = [
  { value: "", label: "All" },
  { value: "casual", label: "Casual" },
  { value: "traditional", label: "Traditional" },
  { value: "corporate", label: "Corporate" },
];

export default function MarketplacePage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<StorefrontItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    if (user?.gender) params.set("gender", user.gender);

    api<StorefrontItem[]>(`/api/client/marketplace?${params}`, { token })
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, category, search, user?.gender]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse ready-made items from verified tailors
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={category === cat.value ? "primary" : "secondary"}
              size="sm"
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No items found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your filters or check back later
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} hover>
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-50 rounded-t-xl flex items-center justify-center">
                <ShoppingBag className="h-10 w-10 text-gray-300" />
              </div>
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-400 capitalize">
                      {item.category} &middot; {item.gender_target}
                    </p>
                  </div>
                  <span className="text-lg font-bold">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Badge
                    variant={item.stock_count > 0 ? "success" : "danger"}
                  >
                    {item.stock_count > 0
                      ? `${item.stock_count} in stock`
                      : "Out of stock"}
                  </Badge>
                  <Button
                    size="sm"
                    disabled={item.stock_count === 0}
                  >
                    Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
