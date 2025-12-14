"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string;
  // Add more fields as needed from profiles table
}

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        // Check if super_admin (similar to management page)
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) throw new Error("Not authenticated");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();

        if (profileError || profile?.role !== "super_admin") {
          throw new Error("Access denied");
        }

        // Fetch user details
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (userError || !userData) throw new Error("User not found");

        setUser(userData as User);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [id]);

  if (loading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (error || !user) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <p className="text-lg text-destructive">{error || "User not found"}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        Back to User Management
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Full Name:</strong> {user.full_name || "N/A"}</p>
          <p><strong>Email:</strong> {user.email || "N/A"}</p>
          <p><strong>Role:</strong> {user.role || "N/A"}</p>
          <p><strong>Created At:</strong> {new Date(user.created_at).toLocaleString()}</p>
          {/* Add more fields here as needed */}
        </CardContent>
      </Card>
    </div>
  );
}