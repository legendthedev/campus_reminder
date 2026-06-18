"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Scissors,
  ShoppingBag,
  Truck,
  MessageCircle,
  Shield,
  Globe,
  ArrowRight,
  Ruler,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { user } = useAuth();

  const portalPath = user
    ? `/portal/${user.role}`
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            BESPOKE<span className="text-gray-400">MARKET</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-500">
                  {user.full_name}
                </span>
                <Link href={portalPath || "/portal/client"}>
                  <Button size="sm">Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-black leading-[1.1]">
            Fashion,
            <br />
            <span className="text-gray-300">Made For You</span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Connect with independent tailors worldwide. Browse ready-made pieces
            or submit your exact measurements for truly bespoke clothing —
            delivered to your door.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/register?role=tailor">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Join as Tailor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Three Portals */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Three Portals, One Platform
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Role-based access ensures every participant gets a tailored
            experience with strict data isolation.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShoppingBag,
                title: "Client Portal",
                desc: "Browse tailors, order ready-made or bespoke clothing, track deliveries, and manage your wardrobe.",
                features: [
                  "Gender-based apparel browsing",
                  "Custom body measurements",
                  "AI-verified sizing",
                  "Real-time order tracking",
                ],
              },
              {
                icon: Scissors,
                title: "Tailor Portal",
                desc: "Manage your digital storefront, process orders, and track revenue with real-time analytics.",
                features: [
                  "Digital storefront management",
                  "Instant order alerts",
                  "Revenue analytics dashboard",
                  "Production timeline tracking",
                ],
              },
              {
                icon: Truck,
                title: "Logistics Portal",
                desc: "Coordinate shipping, generate waybills, and provide live tracking for seamless delivery.",
                features: [
                  "Automated waybill generation",
                  "Route optimization",
                  "Live delivery tracking",
                  "Distance-based pricing",
                ],
              },
            ].map((portal) => (
              <div
                key={portal.title}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <portal.icon className="h-10 w-10 mb-4" strokeWidth={1.5} />
                <h3 className="text-xl font-semibold mb-2">{portal.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{portal.desc}</p>
                <ul className="space-y-2">
                  {portal.features.map((f) => (
                    <li
                      key={f}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-black mt-2 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Built for Scale
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: "Secure Auth",
                desc: "Email & Google OAuth with role-based access control",
              },
              {
                icon: Ruler,
                title: "AI Sizing",
                desc: "Automated measurement verification with anomaly detection",
              },
              {
                icon: MessageCircle,
                title: "Real-time Chat",
                desc: "WebSocket-powered messaging across all portals",
              },
              {
                icon: Globe,
                title: "Global Delivery",
                desc: "Coordinate-based fee calculation & live tracking",
              },
              {
                icon: Sparkles,
                title: "AI Recommendations",
                desc: "Personalized clothing suggestions by category & fit",
              },
              {
                icon: Scissors,
                title: "Bespoke Orders",
                desc: "Submit exact measurements for custom tailoring",
              },
              {
                icon: ShoppingBag,
                title: "Ready-Made Store",
                desc: "Browse and buy listed items from verified tailors",
              },
              {
                icon: Truck,
                title: "Waybill System",
                desc: "Automated waybill generation & transit tracking",
              },
            ].map((feature) => (
              <div key={feature.title} className="p-5 rounded-xl hover:bg-gray-50 transition-colors">
                <feature.icon
                  className="h-8 w-8 mb-3 text-gray-800"
                  strokeWidth={1.5}
                />
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-black text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8">
            Join the marketplace connecting fashion creators with customers
            worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-100 w-full sm:w-auto"
              >
                Create Account
              </Button>
            </Link>
            <Link href="/auth/register?role=logistics">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-black w-full sm:w-auto"
              >
                Partner as Logistics
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold tracking-tight">
            BESPOKE<span className="text-gray-400">MARKET</span>
          </span>
          <p className="text-xs text-gray-400">
            Bespoke fashion marketplace — built with Next.js, FastAPI &
            SQLAlchemy
          </p>
        </div>
      </footer>
    </div>
  );
}
