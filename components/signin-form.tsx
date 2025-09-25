"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { login } from "@/lib/action"; // import your server action
import { createClient } from "@/utils/supabase/client";

export function SignInForm() {
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Restore rememberMe preference on mount
  useEffect(() => {
    const savedRemember = localStorage.getItem("rememberMe");
    if (savedRemember) {
      setFormData((prev) => ({
        ...prev,
        rememberMe: JSON.parse(savedRemember),
      }));
    }
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Store rememberMe in localStorage
      if (field === "rememberMe") {
        localStorage.setItem("rememberMe", JSON.stringify(value));
      }

      return updated;
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Sign In</CardTitle>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
        )}
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          
          if (!formData.email || !formData.password) {
            setError("Please enter both email and password.");
            return;
          }
          const supabase = createClient();

          const { error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          if (error) {
            setError("Invalid email or password.");
            return;
          }
          const { data: userDetails, error: userError } = await supabase
            .from("user")
            .select("account_type")
            .eq("email", formData.email)
            .single();

          if (userError || !userDetails) {
            setError("Account type not found.");
            return;
          }

          if (userDetails.account_type === "investor") {
            window.location.href = "/investor";
          } else if (userDetails.account_type === "business") {
            window.location.href = "/business";
          } else {
            setError("Unknown account type.");
          }
        }}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked) =>
                  handleInputChange("rememberMe", checked as boolean)
                }
              />
              <Label htmlFor="rememberMe" className="text-sm">
                Remember me
              </Label>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
