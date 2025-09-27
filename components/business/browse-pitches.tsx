"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, Search, Filter, RefreshCw } from "lucide-react";
import { PitchCard } from "@/components/business/pitch-card";
import { getAllActivePitches } from "@/lib/action";
import type { Pitch } from "@/lib/types/pitch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ExtendedPitch = Pitch & {
  business_name?: string;
  business_description?: string | null;
  business_website?: string | null;
  business_logo_url?: string | null;
  business_location?: string | null;
  is_owner?: boolean;
};

export function BrowsePitches() {
  const [pitches, setPitches] = useState<ExtendedPitch[]>([]);
  const [filteredPitches, setFilteredPitches] = useState<ExtendedPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "target_high" | "target_low" | "progress"
  >("newest");
  const [filterBy, setFilterBy] = useState<"all" | "mine" | "others">("all");
  const router = useRouter();

  const loadPitches = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllActivePitches();
      if (result.success && result.data) {
        setPitches(result.data);
        setFilteredPitches(result.data);
      } else {
        setError(result.error || "Failed to load pitches");
        toast.error(result.error || "Failed to load pitches");
      }
    } catch (error) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPitches();
  }, []);

  useEffect(() => {
    let filtered = pitches.filter((pitch) => {
      const matchesSearch =
        pitch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.elevator_pitch.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pitch.business_name &&
          pitch.business_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (pitch.business_description &&
          pitch.business_description
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (pitch.business_location &&
          pitch.business_location
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesFilter =
        filterBy === "all"
          ? true
          : filterBy === "mine"
          ? pitch.is_owner
          : filterBy === "others"
          ? !pitch.is_owner
          : true;

      return matchesSearch && matchesFilter;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "target_high":
          return b.target_amount - a.target_amount;
        case "target_low":
          return a.target_amount - b.target_amount;
        case "progress":
          const progressA =
            a.target_amount > 0
              ? (a.current_amount / a.target_amount) * 100
              : 0;
          const progressB =
            b.target_amount > 0
              ? (b.current_amount / b.target_amount) * 100
              : 0;
          return progressB - progressA;
        default:
          return 0;
      }
    });

    setFilteredPitches(filtered);
  }, [pitches, searchTerm, sortBy, filterBy]);

  const handleViewPitch = (pitchId: string) => {
    router.push(`/business/browse-pitches/${pitchId}`);
  };

  const handleEditPitch = (pitchId: string) => {
    router.push(`/business/my-pitches`); // Redirect to my-pitches where they can edit
    toast.info("Redirected to My Pitches to edit your pitch");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading active pitches...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={loadPitches}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Browse Active Pitches
              </h1>
              <p className="text-gray-600 mt-1">
                Discover investment opportunities from businesses across the
                platform
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPitches}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search pitches, businesses, locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort */}
              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="target_high">Highest Target</SelectItem>
                  <SelectItem value="target_low">Lowest Target</SelectItem>
                  <SelectItem value="progress">Most Funded</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter */}
              <Select
                value={filterBy}
                onValueChange={(value: any) => setFilterBy(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pitches</SelectItem>
                  <SelectItem value="mine">My Pitches</SelectItem>
                  <SelectItem value="others">Others' Pitches</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredPitches.length} of {pitches.length} active pitches
          </p>
        </div>

        {/* Pitches Grid */}
        {filteredPitches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPitches.map((pitch) => (
              <PitchCard
                key={pitch.id}
                pitch={pitch}
                onView={handleViewPitch}
                onEdit={handleEditPitch}
                showBusinessName={true}
                mode="browse"
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No pitches found</h3>
              <p className="text-sm">
                {searchTerm || filterBy !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "There are no active pitches available at the moment"}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
