"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";

interface Order {
  id: string;
  client_id: string;
  order_type: string;
  status: string;
  total_price: number;
  notes: string | null;
  created_at: string;
}

const statusFlow = [
  "pending",
  "confirmed",
  "in_production",
  "ready",
];

const statusVariant: Record<string, "default" | "success" | "warning" | "info" | "danger"> = {
  pending: "warning",
  confirmed: "info",
  in_production: "info",
  ready: "success",
  shipped: "success",
  delivered: "success",
  cancelled: "danger",
};

export default function TailorOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    if (!token) return;
    api<Order[]>("/api/tailor/orders", { token })
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const advanceStatus = async (orderId: string, currentStatus: string) => {
    if (!token) return;
    const idx = statusFlow.indexOf(currentStatus);
    if (idx < 0 || idx >= statusFlow.length - 1) return;
    const nextStatus = statusFlow[idx + 1];
    try {
      await api(`/api/tailor/orders/${orderId}/status`, {
        method: "PUT",
        token,
        body: { status: nextStatus },
      });
      fetchOrders();
    } catch {
      // silently handle
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage incoming and active orders
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
          <ClipboardList className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <Badge variant={statusVariant[order.status] || "default"}>
                        {order.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="info">{order.order_type}</Badge>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    {order.notes && (
                      <p className="text-xs text-gray-500">
                        Note: {order.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold">
                      ${order.total_price.toFixed(2)}
                    </span>
                    {statusFlow.includes(order.status) &&
                      statusFlow.indexOf(order.status) < statusFlow.length - 1 && (
                        <Button
                          size="sm"
                          onClick={() =>
                            advanceStatus(order.id, order.status)
                          }
                        >
                          Advance
                        </Button>
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
