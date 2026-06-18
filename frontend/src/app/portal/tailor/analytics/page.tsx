"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DollarSign,
  Package,
  Clock,
  CheckCircle2,
  TrendingUp,
  Hammer,
} from "lucide-react";

interface Analytics {
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  in_production: number;
  average_order_value: number;
}

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    if (!token) return;
    api<Analytics>("/api/tailor/analytics", { token })
      .then(setData)
      .catch(() => {});
  }, [token]);

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: "Total Revenue",
      value: `$${data.total_revenue.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-green-50 text-green-700",
      desc: "From completed orders",
    },
    {
      label: "Total Orders",
      value: data.total_orders,
      icon: Package,
      color: "bg-blue-50 text-blue-700",
      desc: "All time",
    },
    {
      label: "Pending Orders",
      value: data.pending_orders,
      icon: Clock,
      color: "bg-amber-50 text-amber-700",
      desc: "Awaiting confirmation",
    },
    {
      label: "In Production",
      value: data.in_production,
      icon: Hammer,
      color: "bg-purple-50 text-purple-700",
      desc: "Currently being made",
    },
    {
      label: "Completed",
      value: data.completed_orders,
      icon: CheckCircle2,
      color: "bg-green-50 text-green-700",
      desc: "Successfully delivered",
    },
    {
      label: "Avg Order Value",
      value: `$${data.average_order_value.toFixed(2)}`,
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-700",
      desc: "Per completed order",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Revenue and order metrics at a glance
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${metric.color}`}
                >
                  <metric.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{metric.label}</p>
                  <p className="text-3xl font-bold mt-1">{metric.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{metric.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Breakdown Bar */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Order Pipeline</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: "Pending", count: data.pending_orders, color: "bg-amber-500" },
              { label: "In Production", count: data.in_production, color: "bg-purple-500" },
              { label: "Completed", count: data.completed_orders, color: "bg-green-500" },
            ].map((stage) => {
              const pct =
                data.total_orders > 0
                  ? (stage.count / data.total_orders) * 100
                  : 0;
              return (
                <div key={stage.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{stage.label}</span>
                    <span className="font-medium">
                      {stage.count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${stage.color}`}
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
