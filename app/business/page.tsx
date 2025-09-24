"use client";

import { BusinessNavbar } from "@/components/business/business-navbar";

export default function BusinessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BusinessNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to your business dashboard</p>
      </div>
    </div>
  );
}
