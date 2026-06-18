"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

interface Order {
  id: string;
  status: string;
  total_price: number;
  delivery_fee: number;
  delivery_address: string | null;
  created_at: string;
}

export default function AvailableOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchOrders = () => {
    if (!token) return;
    api<Order[]>("/api/logistics/available-orders", { token })
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const claimOrder = async (orderId: string) => {
    if (!token) return;
    setClaiming(orderId);
    try {
      await api(`/api/logistics/orders/${orderId}/claim`, {
        method: "POST",
        token,
      });
      fetchOrders();
    } catch {
      // silently handle
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Available Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Claim orders ready for pickup and delivery
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
          <p className="text-gray-500">No orders available</p>
          <p className="text-sm text-gray-400 mt-1">
            Check back soon for new pickups
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    {order.delivery_address && (
                      <p className="text-xs text-gray-500">
                        To: {order.delivery_address}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold">
                        ${order.delivery_fee.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">delivery fee</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => claimOrder(order.id)}
                      disabled={claiming === order.id}
                    >
                      {claiming === order.id ? "Claiming..." : "Claim"}
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
