"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { Settings, LogOut, Building2 } from "lucide-react";
import Link from "next/link";
import { MobileNav } from "./sidebar";

export function Header() {
  const { data: session } = useSession();
  const user = session?.user;

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <header className="h-14 lg:h-16 border-b border-zinc-800 bg-zinc-900 px-4 lg:px-6 flex items-center justify-between">
      {/* Left side - Mobile nav + Org name */}
      <div className="flex items-center gap-3">
        <MobileNav />
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 lg:w-5 lg:h-5 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-300 truncate max-w-[150px] sm:max-w-none">
            {user?.organizationName || "Organization"}
          </span>
        </div>
      </div>

      {/* Right side - User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 lg:gap-3 outline-none">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-zinc-200">{user?.name}</p>
            <p className="text-xs text-zinc-500">{user?.email}</p>
          </div>
          <Avatar className="h-8 w-8 lg:h-9 lg:w-9 border border-zinc-700">
            <AvatarFallback className="bg-purple-600/20 text-purple-400 text-xs lg:text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
          <DropdownMenuLabel className="text-zinc-300">My Account</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem asChild className="text-zinc-400 focus:text-zinc-100 focus:bg-zinc-800">
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-zinc-400 focus:text-zinc-100 focus:bg-zinc-800"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
