"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Globe, Phone, MapPin, Image } from "lucide-react";
import { createBusinessUser } from "@/lib/action";

export function BusinessSetupForm() {
  const [formData, setFormData] = useState({
    businessName: "",
    description: "",
    website: "",
    logoUrl: "",
    phoneNumber: "",
    location: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Business Information
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form action={createBusinessUser} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              name="businessName"
              type="text"
              placeholder="Your Company Name"
              value={formData.businessName}
              onChange={(e) =>
                handleInputChange("businessName", e.target.value)
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Business Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Tell us about your business, what you do, and your mission..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </Label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://yourcompany.com"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phoneNumber}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Logo URL
            </Label>
            <Input
              id="logoUrl"
              name="logoUrl"
              type="url"
              placeholder="https://example.com/logo.png"
              value={formData.logoUrl}
              onChange={(e) => handleInputChange("logoUrl", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location *
            </Label>
            <Input
              id="location"
              name="location"
              type="text"
              placeholder="City, State, Country"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            Complete Business Setup
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
