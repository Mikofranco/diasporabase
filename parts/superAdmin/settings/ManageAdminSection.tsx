"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteUser } from "@/lib/superAdmin";
import DeleteUserDialog from "@/components/modals/delete-user";

interface AdminProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
}

interface ManageAdminSectionProps {
  currentUserId: string;
}

export function ManageAdminSection({ currentUserId: currentUserIdProp }: ManageAdminSectionProps) {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use session auth for "(you)" so we always match the logged-in user
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    })();
  }, []);

  const loggedInUserId = currentUserId ?? currentUserIdProp;

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .in("role", ["admin", "super_admin"])
        .order("full_name", { ascending: true });

      if (error) throw error;
      setAdmins(data ?? []);
    } catch (err) {
      toast.error("Failed to load admins: " + (err as Error).message);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedAdminId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAdminId) return;
    setIsDeleting(true);
    try {
      const result = await deleteUser(selectedAdminId);
      if (result.success) {
        toast.success("Admin removed successfully.");
        setAdmins((prev) => prev.filter((a) => a.id !== selectedAdminId));
        setDeleteDialogOpen(false);
      } else {
        toast.error(result.error ?? "Failed to delete admin.");
      }
    } finally {
      setIsDeleting(false);
      setSelectedAdminId(null);
    }
  };

  const roleLabel = (role: string | null) =>
    role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : role ?? "—";

  if (loading) {
    return (
      <Card className="shadow-lg border-none overflow-hidden animate-in fade-in-50 duration-200">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
          <div className="flex items-center gap-4">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg border-none overflow-hidden animate-in fade-in-50 duration-200">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0284C7] ring-1 ring-[#0EA5E9]/20">
              <Users className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-xl font-semibold tracking-tight text-gray-900">
                Manage Admin
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View and remove admin users. Deleting removes the user from the profile table and their auth account.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="font-medium text-gray-700">Full name</TableHead>
                  <TableHead className="font-medium text-gray-700">Email</TableHead>
                  <TableHead className="font-medium text-gray-700">Role</TableHead>
                  <TableHead className="w-[80px] font-medium text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No admin users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium">
                        {admin.full_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {admin.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            admin.role === "super_admin"
                              ? "inline-flex items-center rounded-md bg-[#0EA5E9]/10 px-2 py-0.5 text-xs font-medium text-[#0284C7]"
                              : "inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                          }
                        >
                          {roleLabel(admin.role)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {admin.id === loggedInUserId ? (
                          <span className="text-xs text-muted-foreground">(you)</span>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={(e) => handleDeleteClick(e, admin.id)}
                            aria-label={`Delete ${admin.full_name ?? admin.email}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
