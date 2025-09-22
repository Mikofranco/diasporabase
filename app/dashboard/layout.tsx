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
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [unreadNotifications, setUnredNotifications] = useState<number>(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);

  const router = useRouter();

  useEffect(() => {
   
    const fetchedUnreadNotifications = getUnreadNotificationCount().then(
      ({ data }) => setUnredNotifications(data || 0)
    );
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
        localStorage.setItem("disporabase_fullName", profileData.full_name);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleRouteToNotifications = () => {
    router.push(`/dashboard/${userRole}/notifications`);
  };
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            {/* <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1> */}
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
                    className="h-5 w-5 text-gray-600 cursor-pointer"
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
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
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
