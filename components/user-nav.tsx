"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { User } from "lucide-react"

export function UserNav() {
  const { data: session } = useSession()

  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="ghost" asChild className="rounded-lg">
            <a href="/login">Sign In</a>
          </Button>
          <Button asChild className="rounded-lg">
            <a href="/signup">Sign Up</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200 group">
            <Avatar className="h-9 w-9 transition-transform duration-200 group-hover:scale-105">
              <AvatarImage 
                src="" 
                alt={session.user?.name || "User avatar"} 
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {session.user?.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-64 p-2 shadow-lg border-border/50 bg-card/95 backdrop-blur-sm" 
          align="end" 
          sideOffset={4}
          forceMount
        >
          <DropdownMenuLabel className="font-normal p-3 bg-muted/30 rounded-lg mb-2">
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-semibold leading-none text-foreground">
                {session.user?.name || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {session.user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuItem className="cursor-pointer rounded-lg p-3 focus:bg-primary/10 focus:text-primary transition-colors duration-200">
            <a href="/" className="w-full flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                🚀
              </span>
              <div className="flex flex-col">
                <span className="font-medium">Start New Quiz</span>
                <span className="text-xs text-muted-foreground">Create and take quizzes</span>
              </div>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer rounded-lg p-3 focus:bg-primary/10 focus:text-primary transition-colors duration-200">
            <a href="/dashboard" className="w-full flex items-center gap-3">
              <span className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                📈
              </span>
              <div className="flex flex-col">
                <span className="font-medium">Dashboard</span>
                <span className="text-xs text-muted-foreground">View your progress</span>
              </div>
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuItem
            className="cursor-pointer rounded-lg p-3 focus:bg-destructive/10 focus:text-destructive transition-colors duration-200"
            onSelect={(event) => {
              event.preventDefault()
              signOut()
            }}
          >
            <div className="w-full flex items-center gap-3">
              <span className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                😪
              </span>
              <div className="flex flex-col">
                <span className="font-medium">Sign Out</span>
                <span className="text-xs text-muted-foreground">End your session</span>
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}