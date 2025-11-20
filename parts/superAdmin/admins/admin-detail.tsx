// app/super_admin/admins/[id]/page.tsx
import { supabase } from "@/lib/supabase/client";
import { redirect, useParams } from "next/navigation";
import AdminDetailsClient from "./adminDetailClient";

export const dynamic = "force-dynamic";

export default async function AdminDetailsPage() {
    const {id} = useParams()
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Optional: Check if current user is super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Fetch the target admin
  const { data: admin, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, avatar_url, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !admin) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Admin Not Found</h1>
        <p className="text-muted-foreground mt-2">The requested admin could not be found.</p>
      </div>
    );
  }

  return <AdminDetailsClient initialAdmin={admin} />;
}