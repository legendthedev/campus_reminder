"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

interface Order {
  id: string;
  tailor_id: string;
  order_type: string;
  status: string;
  total_price: number;
  delivery_fee: number;
  delivery_address: string | null;
  waybill_number: string | null;
  estimated_delivery: string | null;
  notes: string | null;
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

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api<Order[]>("/api/client/orders", { token })
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track all your orders in one place
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">
                        {order.order_type === "bespoke"
                          ? "Bespoke Order"
                          : "Ready-Made Order"}
                      </p>
                      <Badge variant={statusVariant[order.status] || "default"}>
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">
                      Order #{order.id.slice(0, 8)} &middot;{" "}
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    {order.waybill_number && (
                      <p className="text-xs text-gray-500">
                        Waybill: {order.waybill_number}
                      </p>
                    )}
                    {order.estimated_delivery && (
                      <p className="text-xs text-gray-500">
                        Est. delivery:{" "}
                        {new Date(order.estimated_delivery).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      ${order.total_price.toFixed(2)}
                    </p>
                    {order.delivery_fee > 0 && (
                      <p className="text-xs text-gray-400">
                        + ${order.delivery_fee.toFixed(2)} delivery
                      </p>
                    )}
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
