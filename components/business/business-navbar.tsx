"use client";

import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

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
            <h1 className="text-xl font-bold text-blue-600">CrowdFund Pro</h1>
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
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Business Account
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
