"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Activity, LayoutDashboard, MapPin, BarChart3, PlusCircle, LogIn, LogOut } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Interactive Map", href: "/map", icon: MapPin },
    { name: "Report Issue", href: "/report", icon: PlusCircle },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-slate-800" />
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Civic<span className="text-slate-600">Pulse</span> <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200 font-semibold">AI</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links - Visible if user is logged in */}
          {user && (
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User Profile / Auth State */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-sm font-medium text-slate-900">{user.displayName}</span>
                  <span className="text-xs text-slate-500 truncate max-w-[150px]">{user.email}</span>
                </div>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User Profile"}
                    className="h-8 w-8 rounded-full border border-slate-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {user.displayName?.charAt(0) || "U"}
                  </div>
                )}
                <button
                  onClick={() => logout()}
                  className="flex items-center space-x-1 px-3 py-1.5 border border-slate-200 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="flex items-center space-x-1.5 bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
              >
                <LogIn className="h-4 w-4" />
                <span>Portal Login</span>
              </Link>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation Links - Shown at bottom of header if logged in */}
        {user && (
          <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 overflow-x-auto space-x-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "text-slate-900 bg-slate-50 border border-slate-200"
                      : "text-slate-500 hover:text-slate-950"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 sm:mr-1" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
