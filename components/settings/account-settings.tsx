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
import { useInvestorProfile, useInvestorPortfolio, useInvestorProfitPayouts, useInvestorTransactions } from "@/hooks/useInvestorData";
import { useBusinessUser, useBusinessAccountBalance, useBusinessFundingBalance } from "@/hooks/useBusinessData";
import { useAuth } from "@/lib/auth";

export function AccountSettings() {
  const { user: authUser } = useAuth();
  const searchParams = useSearchParams();

  // swr hooks for investor data
  const { data: investorProfileData, isLoading: loadingInvestorProfile } = useInvestorProfile();
  const { data: investorPortfolioData, isLoading: loadingPortfolio } = useInvestorPortfolio(authUser?.id);
  const { data: investorProfitPayouts, isLoading: loadingPayouts } = useInvestorProfitPayouts(authUser?.id);
  const { data: investorTransactions, isLoading: loadingTransactions } = useInvestorTransactions();
  const { data: businessUserData } = useBusinessUser();
  const { data: businessAccountBalance } = useBusinessAccountBalance();
  const { data: businessFundingBalance } = useBusinessFundingBalance();

  // user and businessUser from SWR data
  let user: UserType | null = null;
  let businessUser: BusinessUser | null = null;
  if (authUser?.role === "investor") {
    user = investorProfileData?.user ?? null;
  } else if (authUser?.role === "business") {
    businessUser = businessUserData ?? null;
  }
  const loading = authUser?.role === "investor" ? loadingInvestorProfile : false;
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
  const [fundingWithdrawDialogOpen, setFundingWithdrawDialogOpen] = useState(false);
  const [billingTab, setBillingTab] = useState<'account' | 'funding'>('account');

  const [userFormData, setUserFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  const [businessFormData, setBusinessFormData] = useState({
    business_name: "",
    description: "",
    website: "",
    logo_url: "",
    phone_number: "",
    location: "",
  });


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
    if (businessUser) {
      setUserFormData({
        first_name: "",
        last_name: "",
        email: authUser?.email || "",
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


  if (!user && !businessUser) {
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

  // Calculate portfolio stats for investors
  const portfolio = investorPortfolioData;
  const totalInvested = portfolio?.totalInvested ?? 0;
  const overallROI = portfolio?.overallROI ?? 0;
  const totalReturns = portfolio?.totalReturns ?? 0;
  const accountBalance =
    authUser?.role === "business"
      ? (typeof businessAccountBalance === "number" ? businessAccountBalance : 0)
      : portfolio?.accountBalance ?? (user ? user.account_balance : 0) ?? 0;

  const fundingBalance = authUser?.role === "business"
    ? (typeof businessFundingBalance === "number" ? businessFundingBalance : 0)
    : (user?.funding_balance ?? 0);

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
                        {user
                          ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`
                          : businessUser?.business_name?.[0] ?? "?"}
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
                      {user
                        ? `${user.first_name} ${user.last_name}`
                        : businessUser?.business_name}
                    </h2>
                    <p className="text-muted-foreground">
                      {user ? user.email : authUser?.email}
                    </p>
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
                        {user ? (
                          <>
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
                          </>
                        ) : businessUser ? (
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
                        ) : null}
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
                              {user
                                ? `${user.first_name} ${user.last_name}`
                                : businessUser?.business_name}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">
                              Email Address
                            </Label>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <p className="text-foreground">
                                {user ? user.email : authUser?.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-muted-foreground">
                              Account Type
                            </Label>
                            <p className="text-foreground font-medium capitalize">
                              {user
                                ? user.account_type
                                : "business"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">
                              Account Balance
                            </Label>
                            <p className="text-foreground font-medium">
                              £
                              {accountBalance?.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                          {authUser?.role === "investor" && (
                            <>
                              <div>
                                <Label className="text-muted-foreground">
                                  Total Invested
                                </Label>
                                <p className="text-foreground font-medium">
                                  £{totalInvested?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">
                                  Total Returns
                                </Label>
                                <p className="text-foreground font-medium">
                                  £{totalReturns?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">
                                  Overall ROI
                                </Label>
                                <p className="text-foreground font-medium">
                                  {overallROI?.toFixed(2)}%
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Business Information Card */}
                {(user?.account_type === "business" || businessUser) && businessUser && (
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

                {authUser?.role === "business" && (
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={billingTab === 'account' ? 'default' : 'outline'}
                      onClick={() => setBillingTab('account')}
                    >
                      Account Balance
                    </Button>
                    <Button
                      variant={billingTab === 'funding' ? 'default' : 'outline'}
                      onClick={() => setBillingTab('funding')}
                    >
                      Funding Balance
                    </Button>
                  </div>
                )}

                {(authUser?.role !== "business" || billingTab === 'account') && (
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
                            {accountBalance?.toLocaleString(undefined, {
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
                )}

                {authUser?.role === "business" && billingTab === 'funding' && (
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Funding Balance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-3xl font-bold text-foreground">
                            £
                            {fundingBalance?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Funds available for withdrawal only
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => setFundingWithdrawDialogOpen(true)}
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
                )}

                {authUser?.role === "investor" && (
                  <>
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-2">Profit Payouts</h3>
                      <div className="space-y-2">
                        {loadingPayouts ? (
                          <div>Loading profit payouts...</div>
                        ) : investorProfitPayouts && investorProfitPayouts.length > 0 ? (
                          investorProfitPayouts.map((payout: any, idx: number) => (
                            <div key={idx} className="border p-3 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between">
                              <div>
                                <div className="font-medium">{payout.pitch?.title || 'Pitch'}</div>
                                <div className="text-sm text-muted-foreground">Distribution Date: {new Date(payout.distribution.distribution_date).toLocaleDateString()}</div>
                              </div>
                              <div className="text-right mt-2 md:mt-0">
                                <span className="font-semibold">£{payout.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <span className="ml-2 text-xs text-muted-foreground">({payout.userSharePercent?.toFixed(2)}% share)</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div>No profit payouts yet.</div>
                        )}
                      </div>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
                      <div className="space-y-2">
                        {loadingTransactions ? (
                          <div>Loading transactions...</div>
                        ) : investorTransactions?.data && investorTransactions.data.length > 0 ? (
                          investorTransactions.data.map((transaction: any) => (
                            <div key={transaction.id} className="border p-3 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between">
                              <div>
                                <span className="font-medium capitalize">{transaction.type}</span>
                                <span className="ml-2 text-xs text-muted-foreground">{new Date(transaction.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="text-right mt-2 md:mt-0">
                                <span className={transaction.type === "deposit" ? "text-green-600 font-semibold" : "text-blue-600 font-semibold"}>
                                  {transaction.type === "deposit" ? "+" : "-"}£{Number(transaction.amount).toFixed(2)}
                                </span>
                                <span className="ml-2 text-xs">{transaction.status}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div>No recent activity.</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {/* Transaction history for business users (account tab only) */}
                {authUser?.role === "business" && billingTab === 'account' && <TransactionHistory />}
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
        onSuccess={() => {}}
      />
      <WithdrawDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
        onSuccess={() => {}}
        currentBalance={accountBalance}
      />
      <WithdrawDialog
        open={fundingWithdrawDialogOpen}
        onOpenChange={setFundingWithdrawDialogOpen}
        onSuccess={() => {}}
        currentBalance={fundingBalance}
        fundingOnly
      />
    </div>
  );
}
