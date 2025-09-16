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
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{session.user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{session.user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <a href="/" className="w-full">Start New Quiz</a>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <a href="/dashboard" className="w-full">Dashboard</a>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(event) => {
              event.preventDefault()
              signOut()
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}