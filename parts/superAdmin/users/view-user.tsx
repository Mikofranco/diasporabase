"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AlertCircle, User as UserIcon, Mail, Shield, Calendar, Hash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string;
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  super_admin: "bg-violet-100 text-violet-800 border-violet-200",
  admin: "bg-blue-100 text-blue-800 border-blue-200",
  agency: "bg-amber-100 text-amber-800 border-amber-200",
  volunteer: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
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

  const displayName = user?.full_name?.trim() || user?.email || "User";

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-3.5 w-3.5 rounded shrink-0" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>

        {/* Card: profile header + details */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {/* Profile header */}
          <div className="bg-muted/30 px-6 py-8 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
              <div className="space-y-2 min-w-0">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>

          {/* Details section */}
          <div className="px-6 pt-6 pb-2">
            <Skeleton className="h-5 w-14 rounded" />
          </div>
          <div className="p-6 pt-4 pb-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4"
                >
                  <Skeleton className="h-5 w-5 shrink-0 rounded mt-0.5" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto p-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={routes.superAdminUsers}>Users</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>User not found</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-lg font-medium text-destructive">{error || "User not found"}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={routes.superAdminUsers}>Back to Users</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={routes.superAdminUsers}>Users</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-foreground truncate max-w-[200px] sm:max-w-md">
              {displayName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Profile header */}
        <div className="bg-muted/30 px-6 py-8 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-semibold">
              {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">
                {user.full_name || "—"}
              </h1>
              {user.email && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "mt-2 font-medium capitalize",
                  user.role ? ROLE_BADGE_STYLES[user.role] : "bg-gray-100 text-gray-700 border-gray-200"
                )}
              >
                {(user.role || "N/A").replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
              <Hash className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ID</dt>
                <dd className="mt-1 text-sm font-mono break-all">{user.id}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
              <UserIcon className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Full name</dt>
                <dd className="mt-1 text-sm">{user.full_name || "—"}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
              <Mail className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</dt>
                <dd className="mt-1 text-sm break-all">{user.email || "—"}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
              <Shield className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</dt>
                <dd className="mt-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium capitalize",
                      user.role ? ROLE_BADGE_STYLES[user.role] : "bg-gray-100 text-gray-700 border-gray-200"
                    )}
                  >
                    {(user.role || "N/A").replace("_", " ")}
                  </Badge>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4 sm:col-span-2">
              <Calendar className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Joined</dt>
                <dd className="mt-1 text-sm">{new Date(user.created_at).toLocaleString()}</dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </div>
    </div>
  );
}