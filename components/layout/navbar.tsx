"use client"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdownmenu"
import Link from "next/link"
import { useRouter } from "next/navigation"


export function Navbar() {

  const { user, logout } = useAuth()

  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur 
                    supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-primary">
            VentureFL
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-4">
                {user.role === "business" ? (
                  <Link href="/business" 
                        className="text-sm text-muted-foreground hover:text-foreground">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/investor" 
                                className= "text-sm text-muted-foreground hover:text-foreground">
                      Dashboard
                    </Link>
                    <Link href="/investor/portfolio" 
                            className="text-sm text-muted-foreground hover:text-foreground">
                      Portfolio
                    </Link>
                  </>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
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
                    
                    <DropdownMenuItem asChild>
                      <Link href="/business">Business Portal</Link>
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/investor">Dashboard</Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link href="/investor/portfolio">Portfolio</Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (

            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
