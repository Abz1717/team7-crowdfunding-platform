"use client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdownmenu";
import { LinkWithLoader } from "@/components/link-with-loader";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <LinkWithLoader href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <img src="/logo_invex.ico" alt="Invex Logo" className="w-7 h-7" />
          invex
        </LinkWithLoader>
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="w-24 h-6 flex items-center justify-center animate-pulse text-muted-foreground">Loading...</div>
          ) : user ? (
            <>
              <div className="hidden md:flex items-center gap-4">
                {user.role === "business" ? (
                  <>
                    <LinkWithLoader href="/business" className="text-sm text-muted-foreground hover:text-foreground">
                      Dashboard
                    </LinkWithLoader>
                    <LinkWithLoader href="/business/my-pitches" className="text-sm text-muted-foreground hover:text-foreground">
                      My pitches
                    </LinkWithLoader>
                    <LinkWithLoader href="/business/other-pitches" className="text-sm text-muted-foreground hover:text-foreground">
                      Other pitches
                    </LinkWithLoader>
                  </>
                ) : (
                  <>
                    <LinkWithLoader href="/investor/browse-pitches" className="text-sm text-muted-foreground hover:text-foreground">
                      Browse Pitches
                    </LinkWithLoader>
                    <LinkWithLoader href="/investor/portfolio" className="text-sm text-muted-foreground hover:text-foreground">
                      Portfolio
                    </LinkWithLoader>
                  </>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
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
              <Button>Get Started</Button>
            </LinkWithLoader>
          )}
        </div>
      </div>
    </nav>
  );
}