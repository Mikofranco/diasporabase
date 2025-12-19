// app/dashboard/layout.tsx
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  checkIfAgencyIsActive,
  getUnreadNotificationCount,
  getUserId,
} from "@/lib/utils";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, LogOut } from "lucide-react"; // Added LogOut icon
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button"; // For the logout button
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const supabase = createClient();

interface Profile {
  full_name: string;
  profile_picture: string | null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [userRole, setUserRole] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      const { data } = await getUnreadNotificationCount();
      setUnreadNotifications(data || 0);
    };

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to view the dashboard.");

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, profile_picture, role")
          .eq("id", userId)
          .single();

        if (profileError)
          throw new Error("Error fetching profile: " + profileError.message);
        if (!profileData) throw new Error("Profile not found.");

        setProfile({
          full_name: profileData.full_name || "User",
          profile_picture: profileData.profile_picture || null,
        });
        setUserRole(profileData.role);
        localStorage.setItem("disporabase_fullName", profileData.full_name || "");
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadNotifications();
    fetchProfile();
  }, []);

  const handleRouteToNotifications = () => {
    if (userRole) {
      router.push(`/dashboard/${userRole}/notifications`);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out: " + error.message);
    } else {
      toast.success("Logged out successfully");
      router.push("/login"); // Redirect to login page after logout
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
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

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                      {profile.full_name}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={profile.profile_picture || ""}
                        alt={profile.full_name}
                      />
                      <AvatarFallback>
                        {profile.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Log out button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Log out</span>
                  </Button>
                </div>
              </>
            ) : (
              <span className="text-sm text-gray-500">Guest</span>
            )}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-[#F0F9FF]">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}