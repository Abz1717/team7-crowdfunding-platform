"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Edit,
  Save,
  LogOut,
  Shield,
  Bell,
  Camera,
  Key,
  Smartphone,
  Settings,
  CreditCard,
  Download,
  Trash2,
  Wallet,
  Plus,
  Minus,
} from "lucide-react";
import {
  getCurrentUser,
  getCurrentBusinessUser,
  updateUserProfile,
  updateBusinessUserProfile,
  signOut,
} from "@/lib/action";
import type { User as UserType, BusinessUser } from "@/lib/types/user";
import { DepositDialog } from "@/components/settings/deposit-dialog";
import { WithdrawDialog } from "@/components/settings/withdraw-dialog";
import { TransactionHistory } from "@/components/settings/transaction-history";
import { useInvestorSafe } from "@/context/InvestorContext";
import { useBusinessSafe } from "@/context/BusinessContext";
import { useAuth } from "@/lib/auth";

export function AccountSettings() {
  const { user: authUser } = useAuth();
  const searchParams = useSearchParams();

  // Use safe versions that don't throw errors
  const investorContext = useInvestorSafe();
  const businessContext = useBusinessSafe();

  // Determine which context to use based on user role
  let cachedUserProfile: UserType | null = null;
  let cachedBusinessUserProfile: BusinessUser | null = null;
  let refreshUserProfileFromContext: (() => Promise<void>) | null = null;
  let cachedAccountBalance = 0;

  // Use the appropriate context based on user role
  if (authUser?.role === "investor" && investorContext) {
    cachedUserProfile = investorContext.userProfile;
    cachedBusinessUserProfile = investorContext.businessUserProfile;
    refreshUserProfileFromContext = investorContext.refreshUserProfile;
    cachedAccountBalance = investorContext.accountBalance;
  } else if (authUser?.role === "business" && businessContext) {
    cachedUserProfile = businessContext.userProfile;
    cachedBusinessUserProfile = businessContext.businessUserProfile;
    refreshUserProfileFromContext = businessContext.refreshUserProfile;
    cachedAccountBalance = businessContext.accountBalance;
  }

  const [user, setUser] = useState<UserType | null>(cachedUserProfile);
  const [businessUser, setBusinessUser] = useState<BusinessUser | null>(
    cachedBusinessUserProfile
  );
  const [loading, setLoading] = useState(!cachedUserProfile);
  const [editingUser, setEditingUser] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (
      tab &&
      ["profile", "security", "notifications", "billing", "data"].includes(tab)
    ) {
      setActiveSection(tab);
    }
  }, [searchParams]);

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
    security: true,
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

  // User form data
  const [userFormData, setUserFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  // Business form data
  const [businessFormData, setBusinessFormData] = useState({
    business_name: "",
    description: "",
    website: "",
    logo_url: "",
    phone_number: "",
    location: "",
  });

  // Sync with cached data from InvestorContext
  useEffect(() => {
    if (cachedUserProfile) {
      setUser(cachedUserProfile);
      setUserFormData({
        first_name: cachedUserProfile.first_name,
        last_name: cachedUserProfile.last_name,
        email: cachedUserProfile.email,
      });
    }
    if (cachedBusinessUserProfile) {
      setBusinessUser(cachedBusinessUserProfile);
      setBusinessFormData({
        business_name: cachedBusinessUserProfile.business_name,
        description: cachedBusinessUserProfile.description,
        website: cachedBusinessUserProfile.website || "",
        logo_url: cachedBusinessUserProfile.logo_url || "",
        phone_number: cachedBusinessUserProfile.phone_number || "",
        location: cachedBusinessUserProfile.location,
      });
    }
  }, [cachedUserProfile, cachedBusinessUserProfile]);

  useEffect(() => {
    if (!cachedUserProfile) {
      loadUserData();
    }
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const userResult = await getCurrentUser();
      if (userResult.success && userResult.data) {
        setUser(userResult.data);
        setUserFormData({
          first_name: userResult.data.first_name,
          last_name: userResult.data.last_name,
          email: userResult.data.email,
        });

        if (userResult.data.account_type === "business") {
          const businessResult = await getCurrentBusinessUser();
          if (businessResult.success && businessResult.data) {
            setBusinessUser(businessResult.data);
            setBusinessFormData({
              business_name: businessResult.data.business_name,
              description: businessResult.data.description,
              website: businessResult.data.website || "",
              logo_url: businessResult.data.logo_url || "",
              phone_number: businessResult.data.phone_number || "",
              location: businessResult.data.location,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserInputChange = (field: string, value: string) => {
    setUserFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBusinessInputChange = (field: string, value: string) => {
    setBusinessFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveUser = async () => {
    setSaving(true);
    try {
      const result = await updateUserProfile(userFormData);
      if (result.success) {
        setEditingUser(false);
        // Refresh from context if available, otherwise fetch directly
        if (refreshUserProfileFromContext) {
          await refreshUserProfileFromContext();
        } else {
          await loadUserData();
        }
      } else {
        console.error("Error updating user profile:", result.error);
      }
    } catch (error) {
      console.error("Error saving user profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    setSaving(true);
    try {
      const result = await updateBusinessUserProfile({
        ...businessFormData,
        website: businessFormData.website || null,
        logo_url: businessFormData.logo_url || null,
        phone_number: businessFormData.phone_number || null,
      });
      if (result.success) {
        setEditingBusiness(false);
        // Refresh from context if available, otherwise fetch directly
        if (refreshUserProfileFromContext) {
          await refreshUserProfileFromContext();
        } else {
          await loadUserData();
        }
      } else {
        console.error("Error updating business profile:", result.error);
      }
    } catch (error) {
      console.error("Error saving business profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const cancelUserEdit = () => {
    setEditingUser(false);
    if (user) {
      setUserFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      });
    }
  };

  const cancelBusinessEdit = () => {
    setEditingBusiness(false);
    if (businessUser) {
      setBusinessFormData({
        business_name: businessUser.business_name,
        description: businessUser.description,
        website: businessUser.website || "",
        logo_url: businessUser.logo_url || "",
        phone_number: businessUser.phone_number || "",
        location: businessUser.location,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-sm text-muted-foreground">
          Loading account settings...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-sm text-destructive">Failed to load user data</div>
      </div>
    );
  }

  const sidebarSections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "data", label: "Data & Privacy", icon: Download },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <div className="w-64 bg-sidebar border-r border-sidebar-border p-6 flex flex-col h-screen">
          <div>
            <div className="mb-8">
              <h1 className="text-xl font-semibold text-foreground">
                Settings
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your account preferences
              </p>
            </div>
            <nav className="space-y-2">
              {sidebarSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === section.id
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
            <Separator className="my-6" />
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Profile Section */}
            {activeSection === "profile" && (
              <>
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="/professional-profile.png" />
                      <AvatarFallback className="text-lg">
                        {user.first_name[0]}
                        {user.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {user.first_name} {user.last_name}
                    </h2>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">
                        Online
                      </span>
                    </div>
                  </div>
                </div>

                {/* Personal Information Card */}
                <Card className="border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Personal Information
                      </CardTitle>
                      {!editingUser && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(true)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editingUser ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="first_name">First Name</Label>
                            <Input
                              id="first_name"
                              value={userFormData.first_name}
                              onChange={(e) =>
                                handleUserInputChange(
                                  "first_name",
                                  e.target.value
                                )
                              }
                              className="bg-input border-border"
                            />
                          </div>
                          <div>
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input
                              id="last_name"
                              value={userFormData.last_name}
                              onChange={(e) =>
                                handleUserInputChange(
                                  "last_name",
                                  e.target.value
                                )
                              }
                              className="bg-input border-border"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={userFormData.email}
                            onChange={(e) =>
                              handleUserInputChange("email", e.target.value)
                            }
                            className="bg-input border-border"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveUser} disabled={saving}>
                            <Save className="h-4 w-4 mr-1" />
                            {saving ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button variant="outline" onClick={cancelUserEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-muted-foreground">
                              Full Name
                            </Label>
                            <p className="text-foreground font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">
                              Email Address
                            </Label>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <p className="text-foreground">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-muted-foreground">
                              Account Type
                            </Label>
                            <p className="text-foreground font-medium capitalize">
                              {user.account_type}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">
                              Account Balance
                            </Label>
                            <p className="text-foreground font-medium">
                              £
                              {user.account_balance.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Business Information Card */}
                {user.account_type === "business" && businessUser && (
                  <Card className="border-border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          Business Information
                        </CardTitle>
                        {!editingBusiness && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingBusiness(true)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {editingBusiness ? (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="business_name">Business Name</Label>
                            <Input
                              id="business_name"
                              value={businessFormData.business_name}
                              onChange={(e) =>
                                handleBusinessInputChange(
                                  "business_name",
                                  e.target.value
                                )
                              }
                              className="bg-input border-border"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={businessFormData.description}
                              onChange={(e) =>
                                handleBusinessInputChange(
                                  "description",
                                  e.target.value
                                )
                              }
                              rows={3}
                              className="bg-input border-border"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="location">Location</Label>
                              <Input
                                id="location"
                                value={businessFormData.location}
                                onChange={(e) =>
                                  handleBusinessInputChange(
                                    "location",
                                    e.target.value
                                  )
                                }
                                className="bg-input border-border"
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone_number">Phone Number</Label>
                              <Input
                                id="phone_number"
                                value={businessFormData.phone_number}
                                onChange={(e) =>
                                  handleBusinessInputChange(
                                    "phone_number",
                                    e.target.value
                                  )
                                }
                                className="bg-input border-border"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="website">Website</Label>
                            <Input
                              id="website"
                              type="url"
                              value={businessFormData.website}
                              onChange={(e) =>
                                handleBusinessInputChange(
                                  "website",
                                  e.target.value
                                )
                              }
                              placeholder="https://example.com"
                              className="bg-input border-border"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveBusiness}
                              disabled={saving}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              {saving ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={cancelBusinessEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-muted-foreground">
                                Business Name
                              </Label>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <p className="text-foreground font-medium">
                                  {businessUser.business_name}
                                </p>
                              </div>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">
                                Description
                              </Label>
                              <p className="text-foreground">
                                {businessUser.description}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">
                                Location
                              </Label>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <p className="text-foreground">
                                  {businessUser.location}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            {businessUser.website && (
                              <div>
                                <Label className="text-muted-foreground">
                                  Website
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                  <a
                                    href={businessUser.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline"
                                  >
                                    {businessUser.website}
                                  </a>
                                </div>
                              </div>
                            )}
                            {businessUser.phone_number && (
                              <div>
                                <Label className="text-muted-foreground">
                                  Phone
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-foreground">
                                    {businessUser.phone_number}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {activeSection === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Security
                  </h2>
                  <p className="text-muted-foreground">
                    Manage your account security and authentication settings
                  </p>
                </div>

                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Password & Authentication
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">Password</Label>
                        <p className="text-sm text-muted-foreground">
                          Last changed 3 months ago
                        </p>
                      </div>
                      <Button variant="outline">Change Password</Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">
                          Two-Factor Authentication
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch
                        checked={twoFactorEnabled}
                        onCheckedChange={setTwoFactorEnabled}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Connected Devices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="text-foreground font-medium">
                              Current Device
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Chrome on macOS • Last active now
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Notifications
                  </h2>
                  <p className="text-muted-foreground">
                    Choose what notifications you want to receive
                  </p>
                </div>

                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({
                            ...prev,
                            email: checked,
                          }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">
                          Push Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications in your browser
                        </p>
                      </div>
                      <Switch
                        checked={notifications.push}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({
                            ...prev,
                            push: checked,
                          }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">
                          Marketing Communications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates about new features and promotions
                        </p>
                      </div>
                      <Switch
                        checked={notifications.marketing}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({
                            ...prev,
                            marketing: checked,
                          }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">
                          Security Alerts
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Important security notifications (recommended)
                        </p>
                      </div>
                      <Switch
                        checked={notifications.security}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({
                            ...prev,
                            security: checked,
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "billing" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Wallet & Billing
                  </h2>
                  <p className="text-muted-foreground">
                    Manage your account balance
                  </p>
                </div>

                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Account Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-3xl font-bold text-foreground">
                          £
                          {user.account_balance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Available balance
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setDepositDialogOpen(true)}
                          className="flex-1"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Deposit
                        </Button>
                        <Button
                          onClick={() => setWithdrawDialogOpen(true)}
                          variant="outline"
                          className="flex-1"
                        >
                          <Minus className="h-4 w-4 mr-2" />
                          Withdraw
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <TransactionHistory />
              </div>
            )}

            {activeSection === "data" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Data & Privacy
                  </h2>
                  <p className="text-muted-foreground">
                    Control your data and privacy settings
                  </p>
                </div>

                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Data Export
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Download a copy of your data including profile information
                      and activity history.
                    </p>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-destructive/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <Trash2 className="h-5 w-5" />
                      Delete Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Permanently delete your account and all associated data.
                      This action cannot be undone.
                    </p>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <DepositDialog
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        onSuccess={async () => {
          if (investorContext) {
            await investorContext.refreshUserProfile();
            await investorContext.refreshTransactions();
          } else if (businessContext) {
            await businessContext.refreshUserProfile();
            await businessContext.refreshTransactions();
          } else {
            await loadUserData();
          }
        }}
      />
      <WithdrawDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
        onSuccess={async () => {
          if (investorContext) {
            await investorContext.refreshUserProfile();
            await investorContext.refreshTransactions();
          } else if (businessContext) {
            await businessContext.refreshUserProfile();
            await businessContext.refreshTransactions();
          } else {
            await loadUserData();
          }
        }}
        currentBalance={user.account_balance}
      />
    </div>
  );
}
