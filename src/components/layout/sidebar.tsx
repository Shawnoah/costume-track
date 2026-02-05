"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Shirt,
  Users,
  Theater,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Key,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Shirt },
  { name: "Rentals", href: "/rentals", icon: ClipboardList },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Productions", href: "/productions", icon: Theater },
  { name: "Settings", href: "/settings", icon: Settings },
];

const adminNavigation = [
  { name: "Invite Codes", href: "/admin/invite-codes", icon: Key },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSystemAdmin = session?.user?.isSystemAdmin;

  return (
    <>
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-purple-600/20 text-purple-400 border border-purple-600/30"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}

        {/* Admin Section */}
        {isSystemAdmin && (
          <>
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <Shield className="w-3 h-3" />
                Admin
              </div>
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-orange-600/20 text-orange-400 border border-orange-600/30"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-zinc-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </>
  );
}

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <Image
        src="/CostumeTrack mark fullsize.png"
        alt="CostumeTrack"
        width={36}
        height={36}
        className="w-9 h-9"
      />
      <span className="text-xl font-bold bg-linear-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
        CostumeTrack
      </span>
    </Link>
  );
}

// Desktop Sidebar - hidden on mobile
export function Sidebar() {
  return (
    <div className="hidden lg:flex h-full w-64 flex-col bg-zinc-900 border-r border-zinc-800">
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-zinc-800">
        <Logo />
      </div>
      <NavContent />
    </div>
  );
}

// Mobile Navigation - shown only on mobile
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-zinc-400 hover:text-zinc-100"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-zinc-900 border-zinc-800">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-800">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavContent onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
