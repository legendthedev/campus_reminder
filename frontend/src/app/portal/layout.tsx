"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  ShoppingBag,
  User,
  Package,
  Store,
  BarChart3,
  Truck,
  MapPin,
  MessageCircle,
  LogOut,
  Home,
  Scissors,
  ClipboardList,
} from "lucide-react";
import clsx from "clsx";

const navItems = {
  client: [
    { href: "/portal/client", label: "Dashboard", icon: Home },
    { href: "/portal/client/marketplace", label: "Marketplace", icon: ShoppingBag },
    { href: "/portal/client/orders", label: "My Orders", icon: Package },
    { href: "/portal/client/profile", label: "Profile", icon: User },
    { href: "/chat", label: "Messages", icon: MessageCircle },
  ],
  tailor: [
    { href: "/portal/tailor", label: "Dashboard", icon: Home },
    { href: "/portal/tailor/storefront", label: "Storefront", icon: Store },
    { href: "/portal/tailor/orders", label: "Orders", icon: ClipboardList },
    { href: "/portal/tailor/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/chat", label: "Messages", icon: MessageCircle },
  ],
  logistics: [
    { href: "/portal/logistics", label: "Dashboard", icon: Home },
    { href: "/portal/logistics/available", label: "Available", icon: Package },
    { href: "/portal/logistics/deliveries", label: "My Deliveries", icon: Truck },
    { href: "/portal/logistics/tracking", label: "Tracking", icon: MapPin },
    { href: "/chat", label: "Messages", icon: MessageCircle },
  ],
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const items = navItems[user.role] || navItems.client;
  const roleIcon =
    user.role === "tailor" ? Scissors : user.role === "logistics" ? Truck : ShoppingBag;
  const RoleIcon = roleIcon;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-50">
          <Link href="/" className="text-lg font-bold tracking-tight">
            BESPOKE<span className="text-gray-400">MARKET</span>
          </Link>
        </div>

        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center">
              <RoleIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                "text-gray-600 hover:bg-gray-50 hover:text-black"
              )}
            >
              <item.icon className="h-4 w-4" strokeWidth={1.5} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-50">
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}
