"use client";
import { createClient } from "@/lib/supabase/client";
import { formatLocation, getUserId } from "@/lib/utils";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MapPin,
  User,
  Briefcase,
  Calendar,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { startLoading, stopLoading } from "@/lib/loading";

const supabase = createClient();

interface Request {
  id: string;
  project_id: string;
  project_title: string;
  organization_name: string;
  project_status?: string | null;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  request_type: "volunteer" | "agency";
  volunteer_name?: string;
  profile_picture?: string;
  organization_profile_picture?: string;
}

const VolunteerRequests: React.FC = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState<
    "" | "pending" | "accepted" | "rejected"
  >("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<
    "" | "active" | "pending" | "completed" | "cancelled"
  >("");
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "from_me" | "from_organization"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      startLoading();

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to view requests.");

        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();
        if (profileError)
          throw new Error(
            "Error fetching user profile: " + profileError.message
          );
        setUserRole(userProfile.role);

        let volunteerData: any[] = [];
        let agencyData: any[] = [];

        if (
          userProfile.role === "admin" ||
          userProfile.role === "super_admin"
        ) {
          const { data: vData, error: vError } = await supabase.from(
            "volunteer_requests"
          ).select(`
              id, 
              project_id, 
              volunteer_id,
              status, 
              projects(
                title,
                organization_name,
                description,
                location,
                start_date,
                end_date,
                status,
                organization:profiles!organization_id (profile_picture)
              ), 
              profiles!volunteer_id (full_name, profile_picture)
            `);
          if (vError)
            throw new Error(
              "Error fetching volunteer requests: " + vError.message
            );
          volunteerData = vData;

          const { data: aData, error: aError } = await supabase.from(
            "agency_requests"
          ).select(`
              id, 
              project_id, 
              volunteer_id,
              status, 
              projects(
                title,
                organization_name,
                description,
                location,
                start_date,
                end_date,
                status,
                organization:profiles!organization_id (profile_picture)
              ), 
              profiles!volunteer_id (full_name, profile_picture)
            `);
          if (aError)
            throw new Error(
              "Error fetching agency requests: " + aError.message
            );
          agencyData = aData;
        } else {
          // Volunteers see only their requests
          const { data: vData, error: vError } = await supabase
            .from("volunteer_requests")
            .select(
              `
              id, 
              project_id, 
              status, 
              projects(
                title,
                organization_name,
                description,
                location,
                start_date,
                end_date,
                status,
                organization:profiles!organization_id (profile_picture)
              )
            `
            )
            .eq("volunteer_id", userId);
          if (vError)
            throw new Error(
              "Error fetching volunteer requests: " + vError.message
            );
          volunteerData = vData;

          const { data: aData, error: aError } = await supabase
            .from("agency_requests")
            .select(
              `
              id, 
              project_id, 
              status, 
              projects(
                title,
                organization_name,
                description,
                location,
                start_date,
                end_date,
                status,
                organization:profiles!organization_id (profile_picture)
              )
            `
            )
            .eq("volunteer_id", userId);
          if (aError)
            throw new Error(
              "Error fetching agency requests: " + aError.message
            );
          agencyData = aData;
        }

        // Combine requests
        const combinedRequests: Request[] = [
          ...(volunteerData?.map((item: any) => ({
            id: item.id,
            project_id: item.project_id,
            project_title: item.projects.title,
            project_status: item.projects.status,
            organization_name: item.projects.organization_name,
            description: item.projects.description,
            location: formatLocation(item.projects.location),
            start_date: item.projects.start_date,
            end_date: item.projects.end_date,
            status: item.status,
            request_type: "volunteer" as const,
            volunteer_name: item.profiles?.full_name,
            profile_picture: item.profiles?.profile_picture,
            organization_profile_picture:
              item.projects.organization?.profile_picture,
          })) || []),
          ...(agencyData?.map((item: any) => ({
            id: item.id,
            project_id: item.project_id,
            project_title: item.projects.title,
            project_status: item.projects.status,
            organization_name: item.projects.organization_name,
            description: item.projects.description,
            location: formatLocation(item.projects.location),
            start_date: item.projects.start_date,
            end_date: item.projects.end_date,
            status: item.status,
            request_type: "agency" as const,
            volunteer_name: item.profiles?.full_name,
            profile_picture: item.profiles?.profile_picture,
            organization_profile_picture:
              item.projects.organization?.profile_picture,
          })) || []),
        ];

        setRequests(combinedRequests);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
        stopLoading();
      }
    };

    fetchRequests();
  }, []);

  const handleAcceptRequest = async (
    requestId: string,
    projectId: string,
    requestType: "volunteer" | "agency"
  ) => {
    try {
      startLoading();
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to accept requests.");

      // Check if volunteer is already assigned
      const { data: existingAssignment, error: assignmentError } =
        await supabase
          .from("project_volunteers")
          .select("project_id")
          .eq("project_id", projectId)
          .eq("volunteer_id", userId)
          .single();

      if (assignmentError && assignmentError.code !== "PGRST116")
        throw new Error(
          "Error checking assignment: " + assignmentError.message
        );
      if (existingAssignment) {
        toast.info("You are already assigned to this project.");
        return;
      }

      // Check project volunteer limit
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("volunteers_registered, volunteers_needed")
        .eq("id", projectId)
        .single();

      if (projectError)
        throw new Error("Error fetching project: " + projectError.message);
      if (project.volunteers_registered >= project.volunteers_needed) {
        toast.info("Volunteer limit reached for this project.");
        return;
      }

      // Insert into project_volunteers
      const { error: assignError } = await supabase
        .from("project_volunteers")
        .insert([
          {
            project_id: projectId,
            volunteer_id: userId,
          },
        ]);

      if (assignError)
        throw new Error("Error assigning volunteer: " + assignError.message);

      // Increment volunteers_registered
      const { error: projectUpdateError } = await supabase
        .from("projects")
        .update({ volunteers_registered: project.volunteers_registered + 1 })
        .eq("id", projectId);

      if (projectUpdateError)
        throw new Error(
          "Error updating project: " + projectUpdateError.message
        );

      // Update request status to accepted
      const table =
        requestType === "volunteer" ? "volunteer_requests" : "agency_requests";
      const { error: updateError } = await supabase
        .from(table)
        .update({ status: "accepted" })
        .eq("id", requestId)
        .eq("volunteer_id", userId);

      if (updateError)
        throw new Error(
          `Error accepting ${requestType} request: ${updateError.message}`
        );

      setRequests(
        requests.map((r) =>
          r.id === requestId ? { ...r, status: "accepted" } : r
        )
      );
      toast.success("Request accepted and volunteer assigned!");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      stopLoading();
    }
  };

  const handleRejectRequest = async (
    requestId: string,
    requestType: "volunteer" | "agency"
  ) => {
    try {
      startLoading();
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to reject requests.");

      const table =
        requestType === "volunteer" ? "volunteer_requests" : "agency_requests";
      const { error } = await supabase
        .from(table)
        .update({ status: "rejected" })
        .eq("id", requestId)
        .eq("volunteer_id", userId);

      if (error)
        throw new Error(
          `Error rejecting ${requestType} request: ${error.message}`
        );

      setRequests(
        requests.map((r) =>
          r.id === requestId ? { ...r, status: "rejected" } : r
        )
      );
      toast.success("Request rejected.");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      stopLoading();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getProjectStatusBadge = (status?: string | null) => {
    if (!status) {
      return <Badge variant="outline">Unknown</Badge>;
    }

    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-emerald-50 text-emerald-700">
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
            Pending
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive" className="bg-red-50 text-red-700">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRequestTypeLabel = (type: "volunteer" | "agency") => {
    return type === "volunteer" ? "Volunteer-Initiated" : "Agency-Initiated";
  };

  const handleRowClick = (request: Request) => {
    if (userRole === "admin") {
      router.push(routes.adminViewProject(request.project_id));
      return;
    }

    if (userRole === "super_admin") {
      router.push(routes.superAdminViewProject(request.project_id));
      return;
    }

    router.push(
      `${routes.volunteerViewProject(request.project_id)}?from=requests`
    );
  };

  const filteredRequests = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    return requests.filter((request) => {
      if (term) {
        const haystack = `${request.project_title} ${request.organization_name}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      if (requestStatusFilter && request.status !== requestStatusFilter) {
        return false;
      }

      if (
        projectStatusFilter &&
        (request.project_status || "").toLowerCase() !==
          projectStatusFilter.toLowerCase()
      ) {
        return false;
      }

      if (sourceFilter === "from_me" && request.request_type !== "volunteer") {
        return false;
      }

      if (
        sourceFilter === "from_organization" &&
        request.request_type !== "agency"
      ) {
        return false;
      }

      return true;
    });
  }, [requests, searchQuery, requestStatusFilter, projectStatusFilter, sourceFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, requestStatusFilter, projectStatusFilter, sourceFilter, pageSize]);

  const totalPages =
    filteredRequests.length === 0
      ? 1
      : Math.ceil(filteredRequests.length / pageSize);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredRequests.slice(start, end);
  }, [filteredRequests, currentPage, pageSize]);

  const startIndex = (currentPage - 1) * pageSize;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-6 w-16" />
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Requests</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your project requests and invitations.
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {requests.length} total
        </Badge>
      </div>
      {requests.length === 0 ? (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-xs font-semibold mb-2">
              No requests yet
            </h3>
            <p className="text-muted-foreground text-base sm:text-xs mb-4">
              Get started by applying to a project or waiting for invitations.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push(routes.volunteerFindOpportunity)}
            >
              Browse Projects
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardContent className="pt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex flex-col space-y-1.5">
                  <span className="text-xs font-medium text-gray-600">
                    Search
                  </span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Project title or organization..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 rounded-lg border border-gray-200 bg-white pl-9"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <span className="text-xs font-medium text-gray-600">
                    Request status
                  </span>
                  <Select
                    value={requestStatusFilter || "all"}
                    onValueChange={(value) =>
                      setRequestStatusFilter(
                        value === "all"
                          ? ""
                          : (value as "pending" | "accepted" | "rejected")
                      )
                    }
                  >
                    <SelectTrigger className="h-9 rounded-lg border border-gray-200 bg-white">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <span className="text-xs font-medium text-gray-600">
                    Project status
                  </span>
                  <Select
                    value={projectStatusFilter || "all"}
                    onValueChange={(value) =>
                      setProjectStatusFilter(
                        value === "all"
                          ? ""
                          : (value as
                              | "active"
                              | "pending"
                              | "completed"
                              | "cancelled")
                      )
                    }
                  >
                    <SelectTrigger className="h-9 rounded-lg border border-gray-200 bg-white">
                      <SelectValue placeholder="All project statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All project statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <span className="text-xs font-medium text-gray-600">
                    From
                  </span>
                  <Select
                    value={sourceFilter}
                    onValueChange={(value) =>
                      setSourceFilter(
                        value as "all" | "from_me" | "from_organization"
                      )
                    }
                  >
                    <SelectTrigger className="h-9 rounded-lg border border-gray-200 bg-white">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="from_me">From me</SelectItem>
                      <SelectItem value="from_organization">
                        From organizations
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Showing {filteredRequests.length} of {requests.length} requests
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardContent className="pt-4">
              {filteredRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No requests match these filters.
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Organization
                        </TableHead>
                        {(userRole === "admin" || userRole === "super_admin") && (
                          <TableHead className="hidden lg:table-cell">
                            Volunteer
                          </TableHead>
                        )}
                        <TableHead className="hidden sm:table-cell">
                          From
                        </TableHead>
                        <TableHead>Request status</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Project status
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                          Duration
                        </TableHead>
                        <TableHead className="hidden xl:table-cell">
                          Location
                        </TableHead>
                        <TableHead className="w-[140px] text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRequests.map((request) => (
                        <TableRow
                          key={`${request.request_type}-${request.id}`}
                          className="cursor-pointer"
                          onClick={() => handleRowClick(request)}
                        >
                          <TableCell className="max-w-[220px]">
                            <div className="flex flex-col">
                              <span className="font-medium truncate">
                                {request.project_title}
                              </span>
                              <span className="text-xs text-muted-foreground md:hidden">
                                {request.organization_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {request.organization_name}
                          </TableCell>
                          {(userRole === "admin" ||
                            userRole === "super_admin") && (
                            <TableCell className="hidden lg:table-cell">
                              {request.volunteer_name || "N/A"}
                            </TableCell>
                          )}
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {request.request_type === "volunteer" ? (
                                <User className="h-3 w-3" />
                              ) : (
                                <Briefcase className="h-3 w-3" />
                              )}
                              <span>{getRequestTypeLabel(request.request_type)}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {getProjectStatusBadge(request.project_status)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {new Date(request.start_date).toLocaleDateString()}{" "}
                            – {new Date(request.end_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                            {request.location}
                          </TableCell>
                          <TableCell
                            className="w-[140px] text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {request.status === "pending" &&
                            request.request_type === "agency" ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  className="h-8 px-3 bg-green-600 hover:bg-green-700"
                                  onClick={() =>
                                    handleAcceptRequest(
                                      request.id,
                                      request.project_id,
                                      request.request_type
                                    )
                                  }
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 px-3"
                                  onClick={() =>
                                    handleRejectRequest(
                                      request.id,
                                      request.request_type
                                    )
                                  }
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3"
                              >
                                View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {totalPages > 1 && (
                    <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                      <div>
                        Showing{" "}
                        <span className="font-medium">
                          {filteredRequests.length === 0
                            ? 0
                            : startIndex + 1}
                          -
                          {Math.min(
                            startIndex + pageSize,
                            filteredRequests.length
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">
                          {filteredRequests.length}
                        </span>{" "}
                        requests
                      </div>
                      <div className="flex items-center justify-between gap-3 md:justify-end">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">Per page</span>
                          <Select
                            value={String(pageSize)}
                            onValueChange={(value) =>
                              setPageSize(Number(value))
                            }
                          >
                            <SelectTrigger className="h-8 w-[80px] rounded-lg border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[5, 10, 20].map((option) => (
                                <SelectItem
                                  key={option}
                                  value={String(option)}
                                >
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg"
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Previous
                          </Button>
                          <span className="px-2 text-xs">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg"
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(totalPages, prev + 1)
                              )
                            }
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default VolunteerRequests;
