"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getFirstTwoWordsShort } from "@/lib/utils";

interface Profile {
  full_name: string;
  profile_picture: string | null;
}

interface DashboardHeaderProps {
  profile: Profile | null;
  loading: boolean;
  unreadNotifications: number;
  userRole: string | null;
  onSignOutClick: () => void;
}

export function DashboardHeader({
  profile,
  loading,
  unreadNotifications,
  userRole,
  onSignOutClick,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleRouteToNotifications = () => {
    if (userRole) {
      const rolePath = userRole === "super_admin" ? "super-admin" : userRole;
      router.push(`/${rolePath}/notifications`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
      </div>
      <div className="flex items-center gap-4">
        {loading ? (
          <>
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </>
        ) : profile ? (
          <>
            <div className="relative">
              <Bell
                className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-900 transition"
                onClick={handleRouteToNotifications}
              />
              {unreadNotifications > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                >
                  {unreadNotifications}
                </Badge>
              )}
            </div>

            <DropdownMenu
              open={isUserMenuOpen}
              onOpenChange={setIsUserMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-gray-200 px-2 py-1 hover:bg-gray-50 transition"
                >
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {getFirstTwoWordsShort(profile.full_name)}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profile.profile_picture || ""}
                      alt={profile.full_name}
                    />
                    <AvatarFallback>
                      {getFirstTwoWordsShort(profile.full_name)
                        .split(/\s+/)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || profile.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isUserMenuOpen ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    onSignOutClick();
                  }}
                  className="flex items-center gap-2 text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <span className="text-sm text-gray-500">Guest</span>
        )}
      </div>
    </header>
  );
}
