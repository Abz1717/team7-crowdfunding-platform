"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TrendingUp, Building2 } from "lucide-react";
import { signup } from "@/lib/action"; // server action

export function SignUpForm() {
  const [accountType, setAccountType] = useState<"investor" | "business">(
    "investor"
  );
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <CardTitle className="text-xl">Account Type</CardTitle>
        <RadioGroup
          value={accountType}
          onValueChange={(value) =>
            setAccountType(value as "investor" | "business")
          }
          className="grid grid-cols-2 gap-4"
        >
          <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
            <RadioGroupItem value="investor" id="investor" />
            <Label
              htmlFor="investor"
              className="flex items-center gap-2 cursor-pointer"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Investor</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
            <RadioGroupItem value="business" id="business" />
            <Label
              htmlFor="business"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="h-4 w-4" />
              <span>Business</span>
            </Label>
          </div>
        </RadioGroup>
      </CardHeader>

      <CardContent>
        <form action={signup} className="space-y-4">
          <input type="hidden" name="accountType" value={accountType} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            Sign Up
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
