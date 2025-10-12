"use client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdownmenu";
import { LinkWithLoader } from "@/components/link-with-loader";
import { useRouter, usePathname } from "next/navigation";

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isAuthPage = pathname === '/signin' || pathname === '/signup';
  const isLandingPage = pathname === '/';
  const shouldUseBlackNavbar = (user && !isLandingPage) || isAuthPage;

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
          ) : user ? (
            <>
              <div className="hidden md:flex items-center gap-4">
                {user.role === "business" ? (
                  <>
                    <LinkWithLoader href="/business" className={`text-sm ${shouldUseBlackNavbar ? 'text-white hover:text-gray-200' : 'text-black hover:text-gray-700'}`}>
                      Dashboard
                    </LinkWithLoader>
                    <LinkWithLoader href="/business/my-pitches" className={`text-sm ${shouldUseBlackNavbar ? 'text-white hover:text-gray-200' : 'text-black hover:text-gray-700'}`}>
                      My pitches
                    </LinkWithLoader>
                    <LinkWithLoader href="/business/other-pitches" className={`text-sm ${shouldUseBlackNavbar ? 'text-white hover:text-gray-200' : 'text-black hover:text-gray-700'}`}>
                      Other pitches
                    </LinkWithLoader>
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
                      <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : ""}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuItem>
                  {user.role === "business" ? (
                                        <>
                      <DropdownMenuItem asChild>
                        <LinkWithLoader href="/business">Dashboard</LinkWithLoader>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <LinkWithLoader href="/business/my-pitches">My Pitches</LinkWithLoader>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <LinkWithLoader href="/business/other-pitches">Other Pitches</LinkWithLoader>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <LinkWithLoader href="/business/settings">Settings</LinkWithLoader>
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
    </nav>
  );
}