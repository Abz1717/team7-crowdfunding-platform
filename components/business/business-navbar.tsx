"use client";

import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import Link from "next/link";

export function BusinessNavbar() {
  const pathname = usePathname();

  const linkBase = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const inactive = "text-gray-500 hover:text-blue-600";
  const active = "text-blue-600 font-semibold";

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/business" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Y</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Your Idea</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a
                href="/business"
                className={`${linkBase} ${
                  isActive("/business") ? active : inactive
                }`}
                aria-current={isActive("/business") ? "page" : undefined}
              >
                Dashboard
              </a>
              <a
                href="/business/my-pitches"
                className={`${linkBase} ${
                  isActive("/business/my-pitches") ? active : inactive
                }`}
                aria-current={
                  isActive("/business/my-pitches") ? "page" : undefined
                }
              >
                My Pitches
              </a>
              <a
                href="/business/browse-pitches"
                className={`${linkBase} ${
                  isActive("/business/browse-pitches") ? active : inactive
                }`}
                aria-current={
                  isActive("/business/browse-pitches") ? "page" : undefined
                }
              >
                Browse Pitches
              </a>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center">
            <Link href="/business/settings">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
