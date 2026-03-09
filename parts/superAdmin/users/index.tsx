// app/dashboard/super-admin/user-management/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Eye, Trash, Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { deleteUser } from "@/lib/superAdmin";
import DeleteUserDialog from "@/components/modals/delete-user";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "agency", label: "Agency" },
  { value: "volunteer", label: "Volunteer" },
] as const;

const ROLE_BADGE_STYLES: Record<string, string> = {
  super_admin: "bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-100",
  admin: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  agency: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  volunteer: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const TABLE_ROW_SKELETON_COUNT = 10;

function UsersListSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-8 w-52" />
        </div>
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-9 w-[180px] rounded-lg" />
          </div>
        </div>
        <Skeleton className="mt-3 h-3 w-40" />
      </div>

      {/* Table card */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b bg-muted/40 px-4 py-3">
          <div className="flex gap-4">
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20 ml-auto" />
          </div>
        </div>
        <div className="divide-y">
          {Array.from({ length: TABLE_ROW_SKELETON_COUNT }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <div className="ml-auto flex gap-1">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-44" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-8 w-[72px] rounded-lg" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-14 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) throw new Error("Failed to fetch role");
        setCurrentRole(profile.role);

        if (profile.role !== "super_admin") {
          throw new Error("Access denied: Only super admins can view this page");
        }

        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, created_at")
          .order("created_at", { ascending: false });

        if (usersError) throw usersError;

        const excludeAdminRoles = (usersData || []).filter(
          (u: User) => u.role !== "admin" && u.role !== "super_admin"
        );
        setUsers(excludeAdminRoles);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter logic using useMemo for performance
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !searchQuery ||
        (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesRole = selectedRole === "all" || user.role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRole]);

  // Pagination: reset to page 1 when filters change
  const totalFiltered = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const effectivePage = Math.min(page, totalPages) || 1;

  const paginatedUsers = useMemo(() => {
    const from = (effectivePage - 1) * pageSize;
    return filteredUsers.slice(from, from + pageSize);
  }, [filteredUsers, effectivePage, pageSize]);

  const paginationFrom = totalFiltered === 0 ? 0 : (effectivePage - 1) * pageSize + 1;
  const paginationTo = Math.min(effectivePage * pageSize, totalFiltered);

  const handlePageChange = (newPage: number) => setPage(Math.max(1, Math.min(newPage, totalPages)));
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedRole]);

  const handleRowClick = (userId: string) => {
    router.push(routes.superAdminViewUser(userId));
  };

  const handleDeleteClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setSelectedUserId(userId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUserId) return;

    setIsDeleting(true);
    const result = await deleteUser(selectedUserId);

    if (result.success) {
      toast.success("User deleted successfully");
      setUsers((prev) => prev.filter((u) => u.id !== selectedUserId));
      setDeleteDialogOpen(false);
    } else {
      toast.error(result.error || "Failed to delete user");
    }

    setIsDeleting(false);
    setSelectedUserId(null);
  };

  if (loading) {
    return <UsersListSkeleton />;
  }

  if (error || currentRole !== "super_admin") {
    return (
      <div className="container mx-auto p-6 text-center py-20">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <p className="text-lg text-destructive">{error || "Access denied"}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            User Management
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          View, search, and manage all platform users
        </p>
      </div>

      {/* Filters & Search Bar */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 rounded-lg border-gray-200 bg-background"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Role:</span>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[180px] h-9 rounded-lg border-gray-200">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {(searchQuery || selectedRole !== "all") && (
          <p className="mt-3 text-xs text-muted-foreground">
            {totalFiltered} user{totalFiltered !== 1 ? "s" : ""} match your filters
            {users.length !== totalFiltered && ` (of ${users.length} total)`}
          </p>
        )}
      </div>

      {/* Table card */}
      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
                <TableHead className="w-14 font-semibold">#</TableHead>
                <TableHead className="font-semibold">Full Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="w-[120px] text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    {filteredUsers.length === 0 && users.length > 0
                      ? "No users match your filters. Try changing search or role."
                      : "No users found."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user, index) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-gray-100"
                    onClick={() => handleRowClick(user.id)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {(effectivePage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium capitalize",
                          user.role ? ROLE_BADGE_STYLES[user.role] : "bg-gray-100 text-gray-700 border-gray-200"
                        )}
                      >
                        {(user.role || "N/A").replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleRowClick(user.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDeleteClick(e, user.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

        {/* Pagination bar */}
        {totalFiltered > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{paginationFrom}</span>–
                <span className="font-medium text-foreground">{paginationTo}</span> of{" "}
                <span className="font-medium text-foreground">{totalFiltered}</span> users
                {totalFiltered !== users.length && ` (filtered from ${users.length})`}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Per page</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => handlePageSizeChange(Number(v))}
                >
                  <SelectTrigger className="h-8 w-[72px] rounded-lg border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg"
                disabled={effectivePage <= 1}
                onClick={() => handlePageChange(effectivePage - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="min-w-[100px] text-center text-sm text-muted-foreground">
                Page {effectivePage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg"
                disabled={effectivePage >= totalPages}
                onClick={() => handlePageChange(effectivePage + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}