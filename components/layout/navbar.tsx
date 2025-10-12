"use client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdownmenu";
import { LinkWithLoader } from "@/components/link-with-loader";
import { useRouter, usePathname } from "next/navigation";
import { useBusinessSetup } from "@/hooks/useBusinessSetup";
import { AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const { isSetupComplete } = useBusinessSetup();
  const router = useRouter();
  const pathname = usePathname();
  const [hasUserRoleCookie, setHasUserRoleCookie] = useState(false);

  useEffect(() => {
    setHasUserRoleCookie(document.cookie.includes('user_role='));
  }, [pathname]); // Re-check when pathname changes

  const handleLogout = async () => {
    await logout();
  };

  const handleRestrictedClick = (e: React.MouseEvent, href: string) => {
    if (user?.role === "business" && !isSetupComplete && href !== "/" && href !== "/business-setup") {
      e.preventDefault();
      alert("Please complete your business setup before accessing other features.");
      router.push("/business-setup");
    }
  };

  const RestrictedLink = ({ href, children, className }: { 
    href: string; 
    children: React.ReactNode; 
    className?: string;
  }) => (
    <LinkWithLoader 
      href={href} 
      className={className}
      onClick={(e) => handleRestrictedClick(e, href)}
    >
      {children}
    </LinkWithLoader>
  );

  const isAuthPage = pathname === '/signin' || pathname === '/signup';
  const isLandingPage = pathname === '/';
  const isBusinessSetupPage = pathname === '/business-setup';
  
  const shouldUseBlackNavbar = (user && !isLandingPage) || isAuthPage || 
    (hasUserRoleCookie && !isLandingPage);

  if (process.env.NODE_ENV === 'development') {
    console.log('Navbar render:', { 
      user: !!user, 
      role: user?.role, 
      isLandingPage, 
      isBusinessSetupPage,
      hasUserRoleCookie,
      shouldUseBlackNavbar, 
      isSetupComplete,
      pathname
    });
  }

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur ${shouldUseBlackNavbar ? 'bg-black border-b border-gray-800' : 'bg-white border-b border-gray-200'}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <LinkWithLoader href="/" className={`flex items-center gap-2 text-xl font-bold ${shouldUseBlackNavbar ? 'text-white' : 'text-black'}`}>
          <img src="/logo_invex.ico" alt="Invex Logo" className="w-7 h-7" />
          invex
        </LinkWithLoader>
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className={`w-24 h-6 flex items-center justify-center animate-pulse ${shouldUseBlackNavbar ? 'text-white' : 'text-black'}`}></div>
          ) : user || hasUserRoleCookie ? (
            <>
              <div className="hidden md:flex items-center gap-4">
                {!user && hasUserRoleCookie && isBusinessSetupPage ? (
                  <span className={`text-sm ${shouldUseBlackNavbar ? 'text-white' : 'text-black'}`}>
                    Complete Setup
                  </span>
                ) : user?.role === "business" ? (
                  <>
                    <RestrictedLink href="/business" className={`text-sm ${shouldUseBlackNavbar ? 'text-white hover:text-gray-200' : 'text-black hover:text-gray-700'}`}>
                      Dashboard
                    </RestrictedLink>
                    <RestrictedLink href="/business/my-pitches" className={`text-sm ${shouldUseBlackNavbar ? 'text-white hover:text-gray-200' : 'text-black hover:text-gray-700'}`}>
                      My pitches
                    </RestrictedLink>
                    <RestrictedLink href="/business/other-pitches" className={`text-sm ${shouldUseBlackNavbar ? 'text-white hover:text-gray-200' : 'text-black hover:text-gray-700'}`}>
                      Other pitches
                    </RestrictedLink>
                  </>
                ) : (
                  <>
                    <LinkWithLoader href="/investor" className={`text-sm ${shouldUseBlackNavbar ? 'text-white hover:text-gray-200' : 'text-black hover:text-gray-700'}`}>
                      Home
                    </LinkWithLoader>
                    <LinkWithLoader href="/investor/browse-pitches" className={`text-sm ${shouldUseBlackNavbar ? 'text-white hover:text-gray-200' : 'text-black hover:text-gray-700'}`}>
                      Browse Pitches
                    </LinkWithLoader>
                    <LinkWithLoader href="/investor/portfolio" className={`text-sm ${shouldUseBlackNavbar ? 'text-white hover:text-gray-200' : 'text-black hover:text-gray-700'}`}>
                      Portfolio
                    </LinkWithLoader>
                  </>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className={`h-8 w-8 ${!shouldUseBlackNavbar ? 'ring-2 ring-black' : ''}`}>
                      <AvatarFallback>{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  {user && (
                    <DropdownMenuItem className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {user?.role === "business" ? (
                    <>
                      <DropdownMenuItem asChild>
                        <RestrictedLink href="/business">Dashboard</RestrictedLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <RestrictedLink href="/business/my-pitches">My Pitches</RestrictedLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <RestrictedLink href="/business/other-pitches">Other Pitches</RestrictedLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <RestrictedLink href="/business/settings">Settings</RestrictedLink>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <LinkWithLoader href="/investor">Home</LinkWithLoader>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <LinkWithLoader href="/investor/browse-pitches">Browse Pitches</LinkWithLoader>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <LinkWithLoader href="/investor/portfolio">Portfolio</LinkWithLoader>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <LinkWithLoader href="/investor/settings">Settings</LinkWithLoader>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <LinkWithLoader href="/signin">
              <Button className={shouldUseBlackNavbar ? "bg-white text-black hover:bg-gray-100" : ""}>Get Started</Button>
            </LinkWithLoader>
          )}
        </div>
      </div>
      {user?.role === "business" && !isSetupComplete && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="container mx-auto flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Complete your business setup to access all features.
            </span>
            <LinkWithLoader 
              href="/business-setup" 
              className="ml-2 text-sm text-yellow-900 underline hover:text-yellow-700"
            >
              Complete Setup
            </LinkWithLoader>
          </div>
        </div>
      )}
    </nav>
  );
}