"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Package,
  Clock,
  CheckCircle2,
  ArrowRight,
  Store,
} from "lucide-react";

interface Analytics {
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  in_production: number;
  average_order_value: number;
}

interface Order {
  id: string;
  order_type: string;
  status: string;
  total_price: number;
  created_at: string;
}

export default function TailorDashboard() {
  const { user, token } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!token) return;
    api<Analytics>("/api/tailor/analytics", { token })
      .then(setAnalytics)
      .catch(() => {});
    api<Order[]>("/api/tailor/orders", { token })
      .then((orders) => setRecentOrders(orders.slice(0, 5)))
      .catch(() => {});
  }, [token]);

  const stats = analytics
    ? [
        {
          label: "Total Revenue",
          value: `$${analytics.total_revenue.toFixed(2)}`,
          icon: DollarSign,
          color: "bg-green-50 text-green-700",
        },
        {
          label: "Total Orders",
          value: analytics.total_orders,
          icon: Package,
          color: "bg-blue-50 text-blue-700",
        },
        {
          label: "Pending",
          value: analytics.pending_orders,
          icon: Clock,
          color: "bg-amber-50 text-amber-700",
        },
        {
          label: "Completed",
          value: analytics.completed_orders,
          icon: CheckCircle2,
          color: "bg-green-50 text-green-700",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tailor Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.business_name || "Set up your business profile"}
          </p>
        </div>
        <Link href="/portal/tailor/storefront">
          <Button>
            <Store className="h-4 w-4 mr-2" />
            Manage Storefront
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-5 flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent Orders</h2>
            <Link href="/portal/tailor/orders">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              No orders yet. List items to start receiving orders.
            </p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.order_type} &middot;{" "}
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      ${order.total_price.toFixed(2)}
                    </span>
                    <Badge>{order.status.replace("_", " ")}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
