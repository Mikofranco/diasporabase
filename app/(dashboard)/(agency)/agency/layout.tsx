import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClientComponentClient } from "@/lib/supabase/server";
import type React from "react";
import { routes } from "@/lib/routes";

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createServerClientComponentClient(cookieStore);

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;

  if (!session) {
    redirect(routes.login);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (error || profile?.role !== "agency") {
    // Redirect to their actual dashboard or login if not agency
    if (profile?.role) {
      const rolePath =
        profile.role === "super_admin" ? "super-admin" : profile.role;
      redirect(`/${rolePath}/dashboard`);
    } else {
      redirect(routes.login);
    }
  }

  return <>{children}</>;
}
