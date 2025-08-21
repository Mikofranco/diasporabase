"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  Briefcase,
  Settings,
  Search,
  User,
  BarChart,
  LogOut,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Mountain,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client"; //@ts-ignore
import debounce from "lodash.debounce";
import Image from "next/image";

type UserRole = "admin" | "volunteer" | "agency" | "super_admin" | null;

interface Profile {
  role: UserRole;
  full_name: string | null;
}

const ROUTES = {
  admin: {
    dashboard: "/dashboard/admin",
    projects: "/dashboard/admin/projects",
    volunteers: "/dashboard/admin/volunteers",
    agencies: "/dashboard/admin/agencies",
    settings: "/dashboard/admin/settings",
    profile: "/dashboard/admin/profile", // Added for consistency
  },
  super_admin: {
    dashboard: "/dashboard/admin",
    projects: "/dashboard/admin/projects",
    volunteers: "/dashboard/admin/volunteers",
    agencies: "/dashboard/admin/agencies",
    settings: "/dashboard/super_admin/settings", // Updated to a specific super admin settings path
    profile: "/dashboard/super_admin/profile", // Added for super admin
    invite_admin: "/dashboard/super_admin/invite_admin",
  },
  volunteer: {
    dashboard: "/dashboard/volunteer",
    projects: "/dashboard/volunteer/projects",
    profile: "/dashboard/volunteer/profile",
    findOpportunity: "/dashboard/volunteer/find-opportunity",
    settings: "/dashboard/volunteer/settings",
    requests: "/dashboard/volunteer/requests",
  },
  agency: {
    dashboard: "/dashboard/agency",
    projects: "/dashboard/agency/projects",
    profile: "/dashboard/agency/profile",
    analytics: "/dashboard/agency/analytics",
    settings: "/dashboard/agency/settings",
  },
  guest: {
    home: "/",
    login: "/login",
  },
};

const MENU_ITEMS = {
  admin: [
    { path: ROUTES.admin.dashboard, label: "Dashboard", icon: LayoutDashboard },
    { path: ROUTES.admin.projects, label: "Projects", icon: Briefcase },
    { path: ROUTES.admin.volunteers, label: "Volunteers", icon: Users },
    { path: ROUTES.admin.agencies, label: "Agencies", icon: Home },
    { path: ROUTES.admin.settings, label: "Settings", icon: Settings },
  ],
  super_admin: [
    { path: ROUTES.admin.dashboard, label: "Dashboard", icon: LayoutDashboard },
    { path: ROUTES.admin.projects, label: "Projects", icon: Briefcase },
    { path: ROUTES.admin.volunteers, label: "Volunteers", icon: Users },
    { path: ROUTES.admin.agencies, label: "Agencies", icon: Home },
    { path: ROUTES.admin.settings, label: "Settings", icon: Settings },
    { path: ROUTES.super_admin.invite_admin, label: "Invite Admin", icon: Settings },
  ],
  volunteer: [
    {
      path: ROUTES.volunteer.dashboard,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    { path: ROUTES.volunteer.projects, label: "My Projects", icon: Briefcase },
    { path: ROUTES.volunteer.profile, label: "Profile", icon: User },
    { path: ROUTES.volunteer.requests, label: "requests", icon: User },
    {
      path: ROUTES.volunteer.findOpportunity,
      label: "Find Opportunity",
      icon: Search,
    },
    { path: ROUTES.volunteer.settings, label: "Settings", icon: Settings },
  ],
  agency: [
    {
      path: ROUTES.agency.dashboard,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    { path: ROUTES.agency.projects, label: "Projects", icon: Briefcase },
    { path: ROUTES.agency.profile, label: "Profile", icon: User },
    { path: ROUTES.agency.analytics, label: "Analytics", icon: BarChart },
    { path: ROUTES.agency.settings, label: "Settings", icon: Settings },
  ],
  guest: [
    { path: ROUTES.guest.home, label: "Home", icon: Home },
    { path: ROUTES.guest.login, label: "Login", icon: LogOut },
  ],
};

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [userRole, setUserRole] = React.useState<UserRole>(null);
  const [userName, setUserName] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      // Only log actual errors, not null sessions (which are normal for unauthenticated users)
      if (sessionError) {
        console.error("Session error:", sessionError);
      }

      if (!session) {
        // No session is normal for unauthenticated users - don't treat as error
        setUserRole(null);
        setUserName(null);
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = (await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", session.user.id)
        .single()) as { data: Profile | null; error: any };

      if (profileError || !profile) {
        console.error("Profile error:", profileError);
        setUserRole(null);
        setUserName(null);
      } else {
        setUserRole(profile.role || null);
        setUserName(profile.full_name);
      }
      setLoading(false);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      //@ts-ignore
      (_event, session) => {
        if (session) {
          fetchUser();
        } else {
          setUserRole(null);
          setUserName(null);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = debounce(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push(ROUTES.guest.home);
    } else {
      console.error("Logout error:", error);
    }
    setLoading(false);
  }, 300);

  const getMenuItems = (role: UserRole) => {
    const items = MENU_ITEMS[role || "guest"];
    return (
      <SidebarGroup>
        <SidebarGroupLabel>
          {role
            ? `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`
            : "Navigation"}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  className={
                    pathname === item.path || pathname.startsWith(item.path)
                      ? "sidebar-menu-button-active"
                      : ""
                  }
                >
                  <Link href={item.path}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              {/* <DropdownMenuTrigger asChild> */}
              <SidebarMenuButton>
                <Image
                  src="/svg/logo.svg"
                  alt="Diaspora Logo"
                  width={32}
                  height={32}
                  className="rounded-full mr-2"
                />
                <span className="hidden md:inline text-[20px] font-bold">
                  DiasporaBase
                </span>
                {/* <ChevronDown className="ml-auto" /> */}
              </SidebarMenuButton>
              {/* </DropdownMenuTrigger> */}
              <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem>
                  <span>About Us</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Contact</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {loading ? (
          <SidebarGroup>
            <SidebarGroupLabel>Loading...</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({
                  length: MENU_ITEMS[userRole || "guest"].length,
                }).map((_, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton>
                      <div className="h-4 w-4 rounded-full bg-muted" />
                      <div className="h-4 w-24 rounded bg-muted" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          getMenuItems(userRole)
        )}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User /> {userName || "Guest"}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                {userRole && (
                  <>
                    <DropdownMenuItem>
                      <Link // @ts-ignore
                        href={ROUTES[userRole].profile}
                        className="w-full"
                      >
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href={ROUTES[userRole].settings} className="w-full">
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} disabled={loading}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </>
                )}
                {!userRole && (
                  <DropdownMenuItem>
                    <Link href={ROUTES.guest.login} className="w-full">
                      <span>Login</span>
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
