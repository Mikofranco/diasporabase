"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { User, Lock, Layers, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { routes } from "@/lib/routes";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "./ProfileSettingsSection";
import { ChangePasswordSection } from "./ChangePasswordSection";
import { ProfileSettingsSection } from "./ProfileSettingsSection";
import { SkillsetsSection } from "./SkillsetsSection";
import { CreateAdminSection } from "./CreateAdminSection";
import { ManageAdminSection } from "./ManageAdminSection";

type SettingsSection = "password" | "profile" | "skillsets" | "createAdmin" | "manageAdmin";

const NAV_ITEMS: {
  id: SettingsSection;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  { id: "password", label: "Change Password", description: "Update your account password", icon: Lock },
  { id: "profile", label: "Profile Settings", description: "Name, email & notifications", icon: User },
  {
    id: "skillsets",
    label: "Manage Skillsets",
    description: "Add or edit skills & categories",
    icon: Layers,
  },
  { id: "createAdmin", label: "Create Admin", description: "Create admin or super admin user", icon: UserPlus },
  { id: "manageAdmin", label: "Manage Admin", description: "View and remove admin users", icon: Users },
];

function SettingsSkeleton() {
  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <Skeleton className="h-9 w-48 mb-6" />
      <div className="flex flex-col md:flex-row gap-6">
        <nav className="w-full md:w-64 shrink-0" aria-hidden>
          <ul className="space-y-1 rounded-xl border border-gray-200/80 bg-white p-2 shadow-sm ring-1 ring-black/5">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i}>
                <div className="flex items-center gap-4 rounded-lg px-4 py-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex-1 min-w-0">
          <div className="rounded-lg border border-gray-200/80 bg-white shadow-lg overflow-hidden">
            <div className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50 px-6 py-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4 max-w-md">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <Skeleton className="h-10 w-full rounded-md mt-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const AdminSettings: React.FC = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SettingsSection>("password");

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push(routes.login);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, notification_preferences")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        if (!["admin", "super_admin"].includes(profileData.role)) {
          toast.error("You do not have permission to access this page.");
          setLoading(false);
          return;
        }

        setProfile(profileData);
      } catch (err) {
        toast.error("Error fetching profile: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProfile();
  }, [router]);

  const handleProfileUpdated = (updates: Partial<Profile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  // Restrict Create Admin and Manage Admin to super_admin only
  const isSuperAdmin = profile?.role === "super_admin";
  const visibleNavItems = isSuperAdmin
    ? NAV_ITEMS
    : NAV_ITEMS.filter(
        (item) => item.id !== "createAdmin" && item.id !== "manageAdmin"
      );

  // If non–super_admin has a super_admin-only section selected, switch to password
  useEffect(() => {
    if (!profile || isSuperAdmin) return;
    if (activeSection === "createAdmin" || activeSection === "manageAdmin") {
      setActiveSection("password");
      toast.error("Only Super Admins can access this section.");
    }
  }, [profile, isSuperAdmin, activeSection]);

  if (loading) {
    return <SettingsSkeleton />;
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-lg text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <nav className="w-full md:w-64 shrink-0" aria-label="Settings sections">
          <ul className="space-y-1 rounded-xl border border-gray-200/80 bg-white p-2 shadow-sm ring-1 ring-black/5">
            {visibleNavItems.map(({ id, label, description, icon: Icon }) => {
              const isActive = activeSection === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(id)}
                    className={cn(
                      "group w-full flex items-center gap-4 rounded-lg px-4 py-3 text-left transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] focus-visible:ring-offset-2",
                      isActive
                        ? "bg-[#0EA5E9]/10 text-[#0284C7] shadow-sm border-l-4 border-l-[#0284C7]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-l-transparent"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                        isActive
                          ? "bg-[#0EA5E9]/20 text-[#0284C7]"
                          : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-semibold">{label}</span>
                      <span
                        className={cn(
                          "text-xs truncate",
                          isActive ? "text-[#0284C7]/80" : "text-gray-500"
                        )}
                      >
                        {description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex-1 min-w-0">
          {activeSection === "password" && (
            <ChangePasswordSection userEmail={profile.email} />
          )}
          {activeSection === "profile" && (
            <ProfileSettingsSection
              profile={profile}
              onProfileUpdated={handleProfileUpdated}
            />
          )}
          {activeSection === "skillsets" && <SkillsetsSection />}
          {activeSection === "createAdmin" && <CreateAdminSection />}
          {activeSection === "manageAdmin" && (
            <ManageAdminSection currentUserId={profile.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
