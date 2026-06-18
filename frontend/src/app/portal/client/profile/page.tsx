"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import clsx from "clsx";

export default function ClientProfilePage() {
  const { user, token } = useAuth();
  const [gender, setGender] = useState(user?.gender || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [latitude, setLatitude] = useState(user?.latitude?.toString() || "");
  const [longitude, setLongitude] = useState(user?.longitude?.toString() || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await api("/api/client/profile", {
        method: "PUT",
        token,
        body: {
          gender: gender || undefined,
          phone: phone || undefined,
          address: address || undefined,
          latitude: latitude ? parseFloat(latitude) : undefined,
          longitude: longitude ? parseFloat(longitude) : undefined,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // handle error silently
    } finally {
      setSaving(false);
    }
  };

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "unisex", label: "Non-binary / Other" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Personalize your experience
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Gender Preference</h2>
          <p className="text-xs text-gray-500">
            This helps us show relevant apparel options
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {genderOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGender(opt.value)}
                className={clsx(
                  "py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all",
                  gender === opt.value
                    ? "border-black bg-gray-50"
                    : "border-gray-100 hover:border-gray-200"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Contact & Delivery</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            id="phone"
            label="Phone"
            placeholder="+1 234 567 8900"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            id="address"
            label="Delivery Address"
            placeholder="123 Main St, City, Country"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="lat"
              label="Latitude"
              type="number"
              step="any"
              placeholder="e.g. 40.7128"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
            <Input
              id="lng"
              label="Longitude"
              type="number"
              step="any"
              placeholder="e.g. -74.0060"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? "Saving..." : "Save Profile"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600">Profile updated!</span>
        )}
      </div>
    </div>
  );
}
