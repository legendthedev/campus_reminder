"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin } from "lucide-react";

interface TrackingResult {
  id: string;
  status: string;
  waybill_number: string;
  delivery_address: string | null;
  delivery_fee: number;
  estimated_delivery: string | null;
  created_at: string;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "info"> = {
  shipped: "info",
  in_transit: "warning",
  delivered: "success",
};

export default function TrackingPage() {
  const [waybill, setWaybill] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!waybill.trim()) return;
    setError("");
    setResult(null);
    setSearching(true);
    try {
      const data = await api<TrackingResult>(
        `/api/logistics/tracking/${waybill}`
      );
      setResult(data);
    } catch {
      setError("Waybill not found");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Track Shipment</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter a waybill number to track delivery status
        </p>
      </div>

      <Card>
        <CardContent className="py-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Enter waybill number (e.g. WB-A1B2C3D4)"
                value={waybill}
                onChange={(e) => setWaybill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? "Searching..." : "Track"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{result.waybill_number}</h2>
              <Badge variant={statusVariant[result.status] || "default"}>
                {result.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.delivery_address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Delivery Address</p>
                  <p className="text-xs text-gray-500">
                    {result.delivery_address}
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-gray-500">Delivery Fee</p>
                <p className="font-semibold">
                  ${result.delivery_fee.toFixed(2)}
                </p>
              </div>
              {result.estimated_delivery && (
                <div>
                  <p className="text-xs text-gray-500">Est. Delivery</p>
                  <p className="font-semibold">
                    {new Date(result.estimated_delivery).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Order Date</p>
                <p className="font-semibold">
                  {new Date(result.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
