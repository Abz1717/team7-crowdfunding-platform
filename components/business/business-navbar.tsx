"use client";

import { Button } from "@/components/ui/button";

export function BusinessNavbar() {
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
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                My Pitches
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
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
