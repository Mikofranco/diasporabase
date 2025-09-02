"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Initialize Supabase client
const supabase = createClient();

// Define TypeScript interfaces based on schema
interface Profile {
  id: string;
  role: "super_admin" | "admin" | "volunteer" | "agency";
}

interface Project {
  title: string;
}

interface Notification {
  id: string;
  user_id: string;
  message: string;
  type:
    | "request_status_change"
    | "project_approval"
    | "new_agency"
    | "new_project";
  is_read: boolean;
  created_at: string;
  related_id: string | null;
  project?: Project; // Optional, joined for related_id
}

const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<
    | "all"
    | "request_status_change"
    | "project_approval"
    | "new_agency"
    | "new_project"
  >("all");
  const [filterReadStatus, setFilterReadStatus] = useState<
    "all" | "read" | "unread"
  >("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = 10;
  const [user, setUser] = useState<any>(null); // Replace with Supabase's User type if available
  const router = useRouter();

  // Check user authentication and role
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !["admin", "super_admin"].includes(profile.role)) {
        router.push("/unauthorized");
        return;
      }
      setUser(user);
    };

    fetchUser();
  }, [router]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);

      let query = supabase.from("notifications").select(
        `
          id,
          user_id,
          message,
          type,
          is_read,
          created_at,
          related_id,
          project:projects!public_notifications_related_id_fkey (title)
        `,
        { count: "exact" }
      );

      // Filter by type
      if (filterType !== "all") {
        query = query.eq("type", filterType);
      }

      // Filter by read status
      if (filterReadStatus !== "all") {
        query = query.eq("is_read", filterReadStatus === "read");
      }

      // For admins, show all notifications or filter by their user_id
      // Adjust based on your requirements (e.g., only admin-related notifications)
      if (user && user.role !== "super_admin") {
        query = query.eq("user_id", user.id);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) {
        setError("Failed to fetch notifications");
        console.error(error);
      } else {
        setNotifications(data as Notification[]);
        setTotalPages(Math.ceil((count || 0) / pageSize));
      }
      setLoading(false);
    };

    if (user) {
      fetchNotifications();
    }

    // Real-time subscription
    const subscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [filterType, filterReadStatus, page, user]);

  // Filter notifications by search query
  useEffect(() => {
    const filtered = notifications.filter((notification) =>
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredNotifications(filtered);
  }, [notifications, searchQuery]);

  // Handle mark as read/unread
  const handleReadStatus = async (notificationId: string, isRead: boolean) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: !isRead })
      .eq("id", notificationId);

    if (error) {
      toast.error(
        `Failed to mark notification as ${isRead ? "unread" : "read"}`
      );
      console.error(error);
    } else {
      toast.success(`Notification marked as ${isRead ? "unread" : "read"}`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: !isRead } : notif
        )
      );
    }
  };

  // View related entity (e.g., project or agency profile)
  const viewRelatedEntity = (notification: Notification) => {
    if (notification.related_id) {
      if (
        notification.type === "new_project" ||
        notification.type === "project_approval"
      ) {
        router.push(`/project/${notification.related_id}`);
      } else if (
        notification.type === "new_agency" ||
        notification.type === "request_status_change"
      ) {
        router.push(`/profile/${notification.related_id}`);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Notification Management</h1>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label htmlFor="search" className="text-sm font-medium mb-1 block">
            Search
          </label>
          <Input
            id="search"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-[180px]">
          <label
            htmlFor="type-filter"
            className="text-sm font-medium mb-1 block"
          >
            Filter by Type
          </label>
          <Select value={filterType}//@ts-ignore
           onValueChange={setFilterType}>
            <SelectTrigger id="type-filter">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="request_status_change">
                Request Status
              </SelectItem>
              <SelectItem value="project_approval">Project Approval</SelectItem>
              <SelectItem value="new_agency">New Agency</SelectItem>
              <SelectItem value="new_project">New Project</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-[180px]">
          <label
            htmlFor="read-filter"
            className="text-sm font-medium mb-1 block"
          >
            Filter by Read Status
          </label>
          <Select value={filterReadStatus} //@ts-ignore
          onValueChange={setFilterReadStatus}>
            <SelectTrigger id="read-filter">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No notifications found.</p>
          <Button
            variant="link"
            onClick={() => {
              setFilterType("all");
              setFilterReadStatus("all");
              setSearchQuery("");
            }}
            className="mt-2"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Related</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>{notification.message}</TableCell>
                    <TableCell>{notification.type}</TableCell>
                    <TableCell>
                      {notification.project?.title ||
                        (notification.related_id ? "View Details" : "-")}
                    </TableCell>
                    <TableCell>
                      {notification.is_read ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" /> Read
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" /> Unread
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(notification.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        onClick={() =>
                          handleReadStatus(
                            notification.id,
                            notification.is_read
                          )
                        }
                        variant="outline"
                        size="sm"
                        aria-label={
                          notification.is_read
                            ? "Mark as unread"
                            : "Mark as read"
                        }
                      >
                        {notification.is_read ? "Mark Unread" : "Mark Read"}
                      </Button>
                      {notification.related_id && (
                        <Button
                          onClick={() => viewRelatedEntity(notification)}
                          variant="outline"
                          size="sm"
                          aria-label="View related entity"
                        >
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))} //@ts-ignore
                    disabled={page === 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        onClick={() => setPage(p)}
                        isActive={p === page}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages))
                    } //@ts-ignore
                    disabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationManagement;
