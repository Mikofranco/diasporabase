// // app/dashboard/layout.tsx
// "use client";

// import type React from "react";
// import { useState, useEffect } from "react";
// import { createClient } from "@/lib/supabase/client";
// import {
//   getUnreadNotificationCount,
//   getUserId,
//   signOutUser,
// } from "@/lib/utils";
// import {
//   SidebarProvider,
//   SidebarInset,
// } from "@/components/ui/sidebar";
// import { AppSidebar } from "@/components/app-sidebar";
// import { DashboardHeader } from "@/components/dashboard-header";
// import { toast } from "sonner";
// import { useRouter } from "next/navigation";
// import { routes } from "@/lib/routes";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";

// const supabase = createClient();

// interface Profile {
//   full_name: string;
//   profile_picture: string | null;
// }

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
//   const [userRole, setUserRole] = useState<string | null>(null);

//   const router = useRouter();

//   useEffect(() => {
//     const fetchUnreadNotifications = async () => {
//       const { data } = await getUnreadNotificationCount();
//       setUnreadNotifications(data || 0);
//     };

//     const fetchProfile = async () => {
//       setLoading(true);
//       try {
//         const { data: userId, error: userIdError } = await getUserId();
//         if (userIdError) throw new Error(userIdError);
//         if (!userId) throw new Error("Please log in to view the dashboard.");

//         const { data: profileData, error: profileError } = await supabase
//           .from("profiles")
//           .select("full_name, profile_picture, role")
//           .eq("id", userId)
//           .single();

//         if (profileError)
//           throw new Error("Error fetching profile: " + profileError.message);
//         if (!profileData) throw new Error("Profile not found.");

//         setProfile({
//           full_name: profileData.full_name || "User",
//           profile_picture: profileData.profile_picture || null,
//         });
//         setUserRole(profileData.role);
//         localStorage.setItem("disporabase_fullName", profileData.full_name || "");
//       } catch (err: any) {
//         toast.error(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUnreadNotifications();
//     fetchProfile();
//   }, []);

//   const [isSigningOut, setIsSigningOut] = useState(false);
//   const [showLogoutDialog, setShowLogoutDialog] = useState(false);

//   const handleLogout = async () => {
//     if (isSigningOut) return;
//     setIsSigningOut(true);
//     const result = await signOutUser();
//     if (!result.success) {
//       toast.error("Error signing out: " + (result.error ?? "Please try again."));
//     }
//     router.push(routes.login);
//     setIsSigningOut(false);
//   };

//   return (
//     <SidebarProvider defaultOpen={true}>
//       <AppSidebar onSignOutClick={() => setShowLogoutDialog(true)} />
//       <SidebarInset>
//         <DashboardHeader
//           profile={profile}
//           loading={loading}
//           unreadNotifications={unreadNotifications}
//           userRole={userRole}
//           onSignOutClick={() => setShowLogoutDialog(true)}
//         />

//         <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-[#F0F9FF]">
//           {children}
//         </main>

//         {/* Shared sign-out confirmation (matches sidebar experience) */}
//         <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
//           <AlertDialogContent className="max-w-sm sm:max-w-md rounded-xl border border-gray-200 shadow-lg bg-white py-7 px-7">
//             <AlertDialogHeader>
//               <div className="flex flex-col items-center gap-2 w-full">
//                 <div className="bg-gradient-to-tr from-red-100 to-pink-100 rounded-full p-3 shadow-inner mb-3">
//                   {/* Modernized LogOut SVG, color-matched for red brand consistency */}
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-7 w-7 text-red-500"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                     strokeWidth="1.7"
//                   >
//                     <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M18 12H9" strokeLinecap="round" strokeLinejoin="round"/>
//                     <path d="M15 15l3-3-3-3" strokeLinecap="round" strokeLinejoin="round"/>
//                   </svg>
//                 </div>
//                 <AlertDialogTitle className="text-xl font-semibold text-gray-900 text-center">
//                   Ready to log out?
//                 </AlertDialogTitle>
//               </div>
//               <AlertDialogDescription className="mt-1 text-gray-600 text-center max-w-xs mx-auto">
//                 You’ll be safely signed out and redirected to the login page. Your session will end securely.
//               </AlertDialogDescription>
//             </AlertDialogHeader>
//             <AlertDialogFooter className="mt-6 flex flex-row gap-3 w-full">
//               <AlertDialogCancel
//                 disabled={isSigningOut}
//                 className="flex-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition text-gray-700 font-medium py-2 shadow-sm"
//               >
//                 Stay logged in
//               </AlertDialogCancel>
//               <AlertDialogAction
//                 onClick={handleLogout}
//                 disabled={isSigningOut}
//                 className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 transition text-white font-semibold py-2 shadow-sm"
//               >
//                 {isSigningOut ? (
//                   <span className="flex items-center justify-center">
//                     <svg
//                       className="inline-block mr-2 w-4 h-4 animate-spin text-white opacity-70"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                     >
//                       <circle
//                         className="opacity-20"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="4"
//                       />
//                       <path
//                         className="opacity-70"
//                         fill="currentColor"
//                         d="M4 12a8 8 0 018-8v8z"
//                       />
//                     </svg>
//                     Logging out...
//                   </span>
//                 ) : (
//                   "Log out"
//                 )}
//               </AlertDialogAction>
//             </AlertDialogFooter>
//           </AlertDialogContent>
//         </AlertDialog>
//       </SidebarInset>
//     </SidebarProvider>
//   );
// }

// app/dashboard/layout.tsx
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getUnreadNotificationCount,
  getUserId,
  signOutUser,
} from "@/lib/utils";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const initialize = async () => {
      try {
        // Run both fetches in parallel — neither depends on the other
        const [{ data: userId, error: userIdError }, { data: unreadCount }] =
          await Promise.all([
            getUserId(),
            getUnreadNotificationCount(),
          ]);

        if (signal.aborted) return;

        if (userIdError || !userId) {
          throw new Error(userIdError ?? "Please log in to view the dashboard.");
        }

        setUnreadNotifications(unreadCount ?? 0);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, profile_picture, role")
          .eq("id", userId)
          .abortSignal(signal)
          .single();

        if (signal.aborted) return;

        if (profileError || !profileData) {
          throw new Error(profileError?.message ?? "Profile not found.");
        }

        // Write to sessionStorage instead of localStorage to avoid blocking
        // the UI thread during active navigations (e.g. agency dashboard redirects)
        sessionStorage.setItem(
          "disporabase_fullName",
          profileData.full_name ?? "",
        );

        setProfile({
          full_name: profileData.full_name ?? "User",
          profile_picture: profileData.profile_picture ?? null,
        });
        setUserRole(profileData.role);
      } catch (err) {
        if (signal.aborted) return;
        toast.error(
          err instanceof Error ? err.message : "An unexpected error occurred.",
        );
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    initialize();

    return () => controller.abort();
  }, []);

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    const result = await signOutUser();

    if (!result.success) {
      toast.error("Error signing out: " + (result.error ?? "Please try again."));
      setIsSigningOut(false);
      return;
    }

    router.push(routes.login);
    // Note: don't reset isSigningOut here — the component will unmount on navigation
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar onSignOutClick={() => setShowLogoutDialog(true)} />
      <SidebarInset>
        <DashboardHeader
          profile={profile}
          loading={loading}
          unreadNotifications={unreadNotifications}
          userRole={userRole}
          onSignOutClick={() => setShowLogoutDialog(true)}
        />

        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-[#F0F9FF]">
          {children}
        </main>

        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent className="max-w-sm sm:max-w-md rounded-xl border border-gray-200 shadow-lg bg-white py-7 px-7">
            <AlertDialogHeader>
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="bg-gradient-to-tr from-red-100 to-pink-100 rounded-full p-3 shadow-inner mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path
                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M18 12H9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 15l3-3-3-3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <AlertDialogTitle className="text-xl font-semibold text-gray-900 text-center">
                  Ready to log out?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="mt-1 text-gray-600 text-center max-w-xs mx-auto">
                You&apos;ll be safely signed out and redirected to the login
                page. Your session will end securely.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6 flex flex-row gap-3 w-full">
              <AlertDialogCancel
                disabled={isSigningOut}
                className="flex-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition text-gray-700 font-medium py-2 shadow-sm"
              >
                Stay logged in
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                disabled={isSigningOut}
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 transition text-white font-semibold py-2 shadow-sm"
              >
                {isSigningOut ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="inline-block mr-2 w-4 h-4 animate-spin text-white opacity-70"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-20"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-70"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Logging out...
                  </span>
                ) : (
                  "Log out"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
