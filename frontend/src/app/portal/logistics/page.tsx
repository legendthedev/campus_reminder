"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Package,
  MapPin,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface Order {
  id: string;
  status: string;
  total_price: number;
  delivery_fee: number;
  waybill_number: string | null;
  created_at: string;
}

export default function LogisticsDashboard() {
  const { user, token } = useAuth();
  const [available, setAvailable] = useState<Order[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Order[]>([]);

  useEffect(() => {
    if (!token) return;
    api<Order[]>("/api/logistics/available-orders", { token })
      .then(setAvailable)
      .catch(() => {});
    api<Order[]>("/api/logistics/my-deliveries", { token })
      .then(setMyDeliveries)
      .catch(() => {});
  }, [token]);

  const active = myDeliveries.filter(
    (d) => d.status === "shipped" || d.status === "in_transit"
  );
  const completed = myDeliveries.filter((d) => d.status === "delivered");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Logistics Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {user?.company_name || "Set up your company profile"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{available.length}</p>
              <p className="text-xs text-gray-500">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{active.length}</p>
              <p className="text-xs text-gray-500">In Transit</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completed.length}</p>
              <p className="text-xs text-gray-500">Delivered</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{myDeliveries.length}</p>
              <p className="text-xs text-gray-500">Total Jobs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Available for Pickup</h2>
            <Link href="/portal/logistics/available">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {available.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              No orders available for pickup right now
            </p>
          ) : (
            <div className="space-y-3">
              {available.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      ${order.delivery_fee.toFixed(2)} fee
                    </span>
                    <Badge variant="success">Ready</Badge>
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
