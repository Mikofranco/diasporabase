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
  LogOut,
  ChevronUp,
  LayoutDashboard,
  Send,
  UserRoundPlus,
  ScrollText,
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
import Image from "next/image";
import { routes } from "@/lib/routes";

type UserRole = "admin" | "volunteer" | "agency" | "super_admin" | null;

interface AppSidebarProps {
  onSignOutClick?: () => void;
}

const ROUTES = {
  admin: {
    dashboard: routes.adminDashboard,
    projects: routes.adminProjects,
    volunteers: routes.adminVolunteers,
    agencies: routes.adminAgencies,
    settings: routes.adminSettings,
    profile: routes.adminProfile,
  },
  super_admin: {
    dashboard: routes.superAdminDashboard,
    projects: routes.superAdminProjects,
    volunteers: routes.superAdminVolunteers,
    agencies: routes.superAdminAgencies,
    settings: routes.superAdminSettings,
    profile: routes.superAdminProfile,
    users: routes.superAdminUsers,
    logs: routes.superAdminLogs,
  },
  volunteer: {
    dashboard: routes.volunteerDashboard,
    projects: routes.volunteerProjects,
    profile: routes.volunteerProfile,
    findOpportunity: routes.volunteerFindOpportunity,
    settings: routes.volunteerSettings,
    requests: routes.volunteerRequests,
  },
  agency: {
    dashboard: routes.agencyDashboard,
    projects: routes.agencyProjects,
    profile: routes.agencyProfile,
    requests: routes.agencyRequests,
    settings: routes.agencySettings,
  },
  guest: {
    home: routes.home,
    login: routes.login,
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
    { path: ROUTES.super_admin.dashboard, label: "Dashboard", icon: LayoutDashboard },
    { path: ROUTES.super_admin.projects, label: "Projects", icon: Briefcase },
    { path: ROUTES.super_admin.volunteers, label: "Volunteers", icon: Users },
    { path: ROUTES.super_admin.agencies, label: "Agencies", icon: Home },
    { path: ROUTES.super_admin.settings, label: "Settings", icon: Settings },
    { path: ROUTES.super_admin.users, label: "User Management", icon: UserRoundPlus },
    { path: ROUTES.super_admin.logs, label: "Logs", icon: ScrollText },
  ],
  volunteer: [
    { path: ROUTES.volunteer.dashboard, label: "Dashboard", icon: LayoutDashboard },
    { path: ROUTES.volunteer.projects, label: "My Projects", icon: Briefcase },
    { path: ROUTES.volunteer.profile, label: "Profile", icon: User },
    { path: ROUTES.volunteer.requests, label: "Requests", icon: Send },
    { path: ROUTES.volunteer.findOpportunity, label: "Find Opportunity", icon: Search },
    { path: ROUTES.volunteer.settings, label: "Settings", icon: Settings },
  ],
  agency: [
    { path: ROUTES.agency.dashboard, label: "Dashboard", icon: LayoutDashboard },
    { path: ROUTES.agency.projects, label: "Projects", icon: Briefcase },
    { path: ROUTES.agency.profile, label: "Profile", icon: User },
    { path: ROUTES.agency.requests, label: "Requests", icon: Send },
    { path: ROUTES.agency.settings, label: "Settings", icon: Settings },
  ],
  guest: [],
};

export function AppSidebar({ onSignOutClick }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [userRole, setUserRole] = React.useState<UserRole>(null);
  const [userName, setUserName] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);

    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    try {
      const storedRole = window.localStorage.getItem("diaspobase_role");
      const storedName = window.localStorage.getItem("diaspobase_fullName");

      const validRoles: Exclude<UserRole, null>[] = [
        "admin",
        "volunteer",
        "agency",
        "super_admin",
      ];

      const role = validRoles.includes(storedRole as Exclude<UserRole, null>)
        ? (storedRole as Exclude<UserRole, null>)
        : null;

      setUserRole(role);
      setUserName(storedName);
    } catch (error) {
      console.error("Error reading user data from localStorage:", error);
      setUserRole(null);
      setUserName(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const isActive = (itemPath: string, currentPath: string) => {
    if (itemPath.includes("dashboard")) return currentPath === itemPath;
    if (itemPath.includes("projects")) return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
    return currentPath === itemPath;
  };

  const getMenuItems = (role: UserRole) => {
    if (!role) return null;
    const items = MENU_ITEMS[role];
    return (
      <SidebarGroup>
          <SidebarGroupLabel className="text-sm text-white dark:text-gray-100 bg-[#0ea5e9] mb-6 mt-2 p-2 rounded">
            {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard
          </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.path}>
                <div>
                  <SidebarMenuButton
                    asChild
                    className={`text-sm transition-colors ${
                      isActive(item.path, pathname)
                        ? "bg-gray-100 dark:bg-gray-800 text-[#0284C7] dark:text-blue-400 font-semibold"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0284C7] dark:hover:text-blue-400"
                    }`}
                    aria-current={isActive(item.path, pathname) ? "page" : undefined}
                  >
                      <Link href={item.path} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 mr-2" />
                        <span>{item.label}</span>
                      </Link>
                  </SidebarMenuButton>
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <>
      <Sidebar className="bg-white dark:bg-gray-900">
        <SidebarHeader onClick={()=>router.push("/")}>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="text-sm">
                    <Image
                      src="/svg/logo.svg"
                      alt="Diaspora Logo"
                      width={24}
                      height={24}
                      className="rounded-full mr-2 cursor-pointer"
                    />
                    <span className="hidden md:inline text-sm font-bold text-gray-900 dark:text-gray-100">
                      DiasporaBase
                    </span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarSeparator className="bg-gray-200 dark:bg-gray-700" />

        <SidebarContent className="px-2">
          {loading ? (
            <SidebarGroup>
              <SidebarGroupLabel className="text-sm text-gray-900 dark:text-gray-100">
              
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {Array.from({
                    length: userRole ? MENU_ITEMS[userRole].length : 0,
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

        <SidebarSeparator className="bg-gray-200 dark:bg-gray-700" />

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="text-sm">
                    <User className="h-4 w-4 mr-2 text-[#0284C7] dark:text-blue-400" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {userName || "User"}
                    </span>
                    <ChevronUp
                      className={`h-4 w-4 ml-auto text-gray-500 dark:text-gray-400 transition-transform ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width] text-xs">
                  {userRole && (
                    <>
                      <DropdownMenuItem>
                        <Link href={ROUTES[userRole].settings} className="w-full">
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          onSignOutClick?.();
                        }}
                        className="flex items-center gap-2 text-red-600 dark:text-red-400"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}

export default AppSidebar;