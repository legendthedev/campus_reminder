"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Package, Sparkles, ArrowRight } from "lucide-react";

interface Order {
  id: string;
  order_type: string;
  status: string;
  total_price: number;
  created_at: string;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "info" | "danger"> = {
  pending: "warning",
  confirmed: "info",
  in_production: "info",
  ready: "success",
  shipped: "info",
  in_transit: "warning",
  delivered: "success",
  cancelled: "danger",
  disputed: "danger",
};

export default function ClientDashboard() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [recommendations, setRecommendations] = useState<
    { type: string; tip: string; recommended_size?: string }[]
  >([]);

  useEffect(() => {
    if (!token) return;
    api<Order[]>("/api/client/orders", { token }).then(setOrders).catch(() => {});
    const gender = user?.gender || "male";
    api<{ type: string; tip: string }[]>(
      `/api/ai/recommendations?gender=${gender}`,
      { token }
    )
      .then(setRecommendations)
      .catch(() => {});
  }, [token, user?.gender]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.full_name?.split(" ")[0]}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {!user?.gender
            ? "Complete your profile to see personalized recommendations"
            : "Here's your fashion overview"}
        </p>
      </div>

      {/* Quick Actions */}
      {!user?.gender && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Complete your profile</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Select your gender to see personalized apparel options
              </p>
            </div>
            <Link href="/portal/client/profile">
              <Button size="sm">Update Profile</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-xs text-gray-500">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {orders.filter((o) => o.status === "in_transit" || o.status === "shipped").length}
              </p>
              <p className="text-xs text-gray-500">In Transit</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {orders.filter((o) => o.order_type === "bespoke").length}
              </p>
              <p className="text-xs text-gray-500">Bespoke Orders</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent Orders</h2>
            <Link href="/portal/client/orders">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No orders yet</p>
              <Link href="/portal/client/marketplace" className="mt-2 inline-block">
                <Button size="sm" variant="outline">
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {order.order_type === "bespoke" ? "Bespoke Order" : "Ready-Made Order"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      ${order.total_price.toFixed(2)}
                    </span>
                    <Badge variant={statusVariant[order.status] || "default"}>
                      {order.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Recommendations
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              {recommendations.slice(0, 6).map((rec, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <p className="font-medium text-sm">{rec.type}</p>
                  <p className="text-xs text-gray-500 mt-1">{rec.tip}</p>
                  {rec.recommended_size && (
                    <Badge className="mt-2">Size: {rec.recommended_size}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
