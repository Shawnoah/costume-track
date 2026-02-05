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
    <header className="h-16 border-b border-zinc-800 bg-zinc-900 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Building2 className="w-5 h-5 text-zinc-500" />
        <span className="text-sm font-medium text-zinc-300">
          {user?.organizationName || "Organization"}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 outline-none">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-zinc-200">{user?.name}</p>
            <p className="text-xs text-zinc-500">{user?.email}</p>
          </div>
          <Avatar className="h-9 w-9 border border-zinc-700">
            <AvatarFallback className="bg-purple-600/20 text-purple-400 text-sm">
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
