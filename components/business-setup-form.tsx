"use client";

import type React from "react";
import { useState, useRef } from "react";
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const uploadLogoToSupabase = async (file: File): Promise<string | null> => {
    const { createClient } = await import("@/utils/supabase/client");
    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `business-logos/${fileName}`;
    const { data, error } = await supabase.storage.from("Pitch_image").upload(filePath, file);
    if (error) {
      alert("Failed to upload logo: " + error.message);
      return null;
    }
    const { data: urlData } = supabase.storage.from("Pitch_image").getPublicUrl(filePath);
    return urlData?.publicUrl || null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let logoUrl = formData.logoUrl;
    if (logoFile) {
      setIsUploading(true);
      const uploadedUrl = await uploadLogoToSupabase(logoFile);
      setIsUploading(false);
      if (uploadedUrl) {
        logoUrl = uploadedUrl;
      }
    }
    const submitData = new FormData();
    submitData.set("businessName", formData.businessName);
    submitData.set("description", formData.description);
    submitData.set("website", formData.website);
    submitData.set("logoUrl", logoUrl);
    submitData.set("phoneNumber", formData.phoneNumber);
    submitData.set("location", formData.location);
    await createBusinessUser(submitData);
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
        <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="+44 7242 827218"
                value={formData.phoneNumber}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value)
                }
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center text-left font-medium text-sm text-black gap-2">
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <circle cx="8.5" cy="10.5" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M21 19l-5.5-7-4.5 6-3-4-4 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              <span>Business Logo</span>
            </div>
            {logoFile ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={URL.createObjectURL(logoFile)}
                  alt="Selected logo"
                  className="w-24 h-24 object-contain rounded border border-gray-200 bg-gray-50"
                />
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-primary mt-2 hover:text-primary/80"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Logo
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} onClick={(e) => { e.stopPropagation(); setLogoFile(null); }} style={{ cursor: 'pointer' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label htmlFor="logoFile" className="block w-full">
                <button
                  type="button"
                  className="w-full border border-gray-300 rounded-md bg-white text-gray-500 py-2 px-4 text-center font-medium text-xs transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Logo
                </button>
              </label>
            )}
            <input
              id="logoFile"
              name="logoFile"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleLogoChange}
              style={{ display: 'none' }}
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