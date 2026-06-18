"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth, UserRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scissors, ShoppingBag, Truck } from "lucide-react";
import clsx from "clsx";

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") as UserRole) || "client";

  const [role, setRole] = useState<UserRole>(defaultRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roles: { value: UserRole; label: string; icon: typeof ShoppingBag; desc: string }[] = [
    {
      value: "client",
      label: "Client",
      icon: ShoppingBag,
      desc: "Shop for bespoke fashion",
    },
    {
      value: "tailor",
      label: "Tailor",
      icon: Scissors,
      desc: "Sell your creations",
    },
    {
      value: "logistics",
      label: "Logistics",
      icon: Truck,
      desc: "Deliver packages",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, fullName, role);
      router.push(`/portal/${role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            BESPOKE<span className="text-gray-400">MARKET</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm text-gray-500">
            Choose your role to get started
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I am a...
            </label>
            <div className="grid grid-cols-3 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={clsx(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    role === r.value
                      ? "border-black bg-gray-50"
                      : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  <r.icon
                    className={clsx(
                      "h-6 w-6 mx-auto mb-2",
                      role === r.value ? "text-black" : "text-gray-400"
                    )}
                    strokeWidth={1.5}
                  />
                  <div className="text-sm font-medium">{r.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <Input
            id="fullName"
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-black font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
