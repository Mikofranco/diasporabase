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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import AgencyList from "./agency-table";
import { Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Initialize Supabase client
const supabase = createClient();

// Define TypeScript interfaces
interface Profile {
  id: string;
  full_name: string | null;
  organization_name: string | null;
  email: string | null;
  role: "super_admin" | "admin" | "volunteer" | "agency";
}

interface Project {
  title: string;
}

interface AgencyRequest {
  id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  project: Project;
  volunteer: Profile;
  requester: Profile;
  volunteer_id: string;
  project_id: string;
}

const AgencyManagement: React.FC = () => {
  const [agencyRequests, setAgencyRequests] = useState<AgencyRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AgencyRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "accepted" | "rejected"
  >("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = 10;
  const [user, setUser] = useState<any>(null);
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

  // Fetch agency requests
  useEffect(() => {
    const fetchAgencyRequests = async () => {
      setLoading(true);
      setError(null);

      let query = supabase.from("agency_requests").select(
        `
          id,
          status,
          created_at,
          project:projects!agency_requests_project_id_fkey (title),
          volunteer:profiles!agency_requests_volunteer_id_fkey (full_name, organization_name, email, role),
          requester:profiles!agency_requests_requester_id_fkey (full_name),
          volunteer_id,
          project_id
        `,
        { count: "exact" }
      );

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      // Ensure only agency role volunteers are fetched
      query = query.eq("volunteer.role", "agency");

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) {
        setError("Failed to fetch agency requests");
        console.error(error);
      } else {
        setAgencyRequests(data as AgencyRequest[]);
        setTotalPages(Math.ceil((count || 0) / pageSize));
      }
      setLoading(false);
    };

    if (user) {
      fetchAgencyRequests();
    }

    // Real-time subscription
    const subscription = supabase
      .channel("agency_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agency_requests" },
        () => fetchAgencyRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [filterStatus, page, user]);

  // Filter requests by search query
  useEffect(() => {
    const filtered = agencyRequests.filter(
      (request) =>
        request.project.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (
          request.volunteer.organization_name ||
          request.volunteer.full_name ||
          ""
        )
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
    setFilteredRequests(filtered);
  }, [agencyRequests, searchQuery]);

  // Handle approve/reject actions
  const handleRequestAction = async (
    requestId: string,
    newStatus: "accepted" | "rejected"
  ) => {
    const { error: updateError } = await supabase
      .from("agency_requests")
      .update({ status: newStatus })
      .eq("id", requestId);

    if (updateError) {
      toast.error("Failed to update request status");
      console.error(updateError);
      return;
    }

    const { data: request } = await supabase
      .from("agency_requests")
      .select("volunteer_id, project_id")
      .eq("id", requestId)
      .single();

    if (newStatus === "accepted" && request) {
      const { error: volunteerError } = await supabase
        .from("project_volunteers")
        .insert({
          project_id: request.project_id,
          volunteer_id: request.volunteer_id,
        });

      if (volunteerError) {
        toast.error("Failed to assign volunteer to project");
        console.error(volunteerError);
        return;
      }
    }

    const message = `Your agency request has been ${newStatus} for the project.`;
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: request?.volunteer_id,
        message,
        type: "request_status_change",
        related_id: requestId,
      });

    if (notificationError) {
      toast.error("Failed to send notification");
      console.error(notificationError);
    } else {
      toast.success(`Request ${newStatus} successfully`);
    }

    setAgencyRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: newStatus } : req
      )
    );
  };

  // View agency profile
  const viewAgencyProfile = (volunteerId: string) => {
    router.push(`/profile/${volunteerId}`);
  };

  if (!user) return null;

  return (
    <div className="container mx-auto p-6">
      <AgencyList />
    </div>
  );
};

export default AgencyManagement;
