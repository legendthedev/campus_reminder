"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";

interface Order {
  id: string;
  status: string;
  total_price: number;
  delivery_fee: number;
  delivery_address: string | null;
  waybill_number: string | null;
  estimated_delivery: string | null;
  created_at: string;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "info"> = {
  shipped: "info",
  in_transit: "warning",
  delivered: "success",
};

export default function MyDeliveriesPage() {
  const { token } = useAuth();
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = () => {
    if (!token) return;
    api<Order[]>("/api/logistics/my-deliveries", { token })
      .then(setDeliveries)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDeliveries();
  }, [token]);

  const advanceDelivery = async (orderId: string, currentStatus: string) => {
    if (!token) return;
    const endpoint =
      currentStatus === "shipped"
        ? `/api/logistics/orders/${orderId}/transit`
        : `/api/logistics/orders/${orderId}/delivered`;
    try {
      await api(endpoint, { method: "PUT", token });
      fetchDeliveries();
    } catch {
      // silently handle
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Deliveries</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track and manage your active deliveries
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-16">
          <Truck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No deliveries yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map((d) => (
            <Card key={d.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">
                        {d.waybill_number || `#${d.id.slice(0, 8)}`}
                      </p>
                      <Badge variant={statusVariant[d.status] || "default"}>
                        {d.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {d.delivery_address && (
                      <p className="text-xs text-gray-500">
                        To: {d.delivery_address}
                      </p>
                    )}
                    {d.estimated_delivery && (
                      <p className="text-xs text-gray-400">
                        Est:{" "}
                        {new Date(d.estimated_delivery).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold">
                      ${d.delivery_fee.toFixed(2)}
                    </span>
                    {(d.status === "shipped" || d.status === "in_transit") && (
                      <Button
                        size="sm"
                        onClick={() => advanceDelivery(d.id, d.status)}
                      >
                        {d.status === "shipped"
                          ? "Start Transit"
                          : "Mark Delivered"}
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
