"use client";
import { createClient } from "@/lib/supabase/client";
import { formatLocation, getUserId } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { MapPin, User, Briefcase, Calendar, Users } from "lucide-react";
import { startLoading, stopLoading } from "@/lib/loading";

const supabase = createClient();

interface Request {
  id: string;
  project_id: string;
  project_title: string;
  organization_name: string;
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
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "volunteer" | "agency">(
    "all"
  );

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
        toast.error("You are already assigned to this project.");
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
        toast.error("Volunteer limit reached for this project.");
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

  const getRequestTypeLabel = (type: "volunteer" | "agency") => {
    return type === "volunteer" ? "Volunteer-Initiated" : "Agency-Initiated";
  };

  const renderRequestCard = (request: Request, index: number) => (
    <Card
      key={`${request.request_type}-${request.id}`}
      className={`transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-l-4 hover:bg-gray-50 ${
        request.request_type === "volunteer"
          ? "border-blue-500 bg-blue-50/50"
          : "border-green-500 bg-green-50/50"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
            {request.request_type === "volunteer" ? (
              <User className="h-4 w-4" />
            ) : (
              <Briefcase className="h-4 w-4" />
            )}
            {request.project_title}
          </CardTitle>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agency/Org Info */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={request.organization_profile_picture}
              alt={request.organization_name}
            />
            <AvatarFallback className="bg-muted">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="font-medium">{request.organization_name}</h4>
            <p className="text-sm text-muted-foreground">Organization</p>
          </div>
        </div>

        {/* Volunteer Info for Admins */}
        {userRole === "admin" || userRole === "super_admin" ? (
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={request.profile_picture}
                alt={request.volunteer_name}
              />
              <AvatarFallback className="bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h4 className="font-medium">{request.volunteer_name || "N/A"}</h4>
              <p className="text-sm text-muted-foreground">Volunteer</p>
            </div>
          </div>
        ) : null}

        {/* Description */}
        <CardDescription className="text-sm bg-gray-50 rounded-md border p-2">
          {request.description}
        </CardDescription>

        {/* Meta Info */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 fill-blue-300" />
            <span className="text-muted-foreground">{request.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 fill-blue-300" />
            <span className="text-muted-foreground">
              {new Date(request.start_date).toLocaleDateString()} –{" "}
              {new Date(request.end_date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0 fill-blue-300" />
            <span className="text-muted-foreground capitalize">
              {getRequestTypeLabel(request.request_type)}
            </span>
          </div>
        </div>

        {/* Actions */}
        {request.status === "pending" && request.request_type === "agency" && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
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
              className="flex-1"
              onClick={() =>
                handleRejectRequest(request.id, request.request_type)
              }
            >
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded-md animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-muted rounded-full" />
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-32" />
                    <div className="h-2 bg-muted rounded w-48" />
                  </div>
                </div>
                <div className="h-20 bg-muted rounded" />
                <div className="flex space-x-2">
                  <div className="h-4 bg-muted rounded w-16" />
                  <div className="h-4 bg-muted rounded w-16" />
                </div>
              </div>
            </Card>
          ))}
        </div>
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

  const volunteerRequests = requests.filter(
    (r) => r.request_type === "volunteer"
  );
  const agencyRequests = requests.filter((r) => r.request_type === "agency");

  const getFilteredRequests = () => {
    switch (activeTab) {
      case "all":
        return requests;
      case "volunteer":
        return volunteerRequests;
      case "agency":
        return agencyRequests;
      default:
        return requests;
    }
  };

  const filteredRequests = getFilteredRequests();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">My Requests</h1>
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
            <Button variant="outline">Browse Projects</Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "all" | "volunteer" | "agency")
          }
          className="w-full text-base sm:text-xs"
        >
          <TabsList className="grid w-full grid-cols-3 h-10 bg-white rounded-t-lg border-b">
            <TabsTrigger
              value="all"
              className="justify-center gap-2 data-[state=active]:bg-sky-500 data-[state=active]:text-white hover:bg-gray-100 rounded-md h-8 text-sm w-40 p-4"
            >
              All ({requests.length})
            </TabsTrigger>
            <TabsTrigger
              value="volunteer"
              className="justify-center gap-2 data-[state=active]:bg-sky-500 data-[state=active]:text-white hover:bg-gray-100 rounded-md h-8 text-sm w-40 p-4"
            >
              <User className="h-3 w-3" /> From Me ({volunteerRequests.length})
            </TabsTrigger>
            <TabsTrigger
              value="agency"
              className="justify-center gap-2 data-[state=active]:bg-sky-500 data-[state=active]:text-white hover:bg-gray-100 rounded-md h-8 text-sm w-40 p-4"
            >
              <Briefcase className="h-3 w-3" /> From Organizations (
              {agencyRequests.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="all"
            className="mt-0 bg-white rounded-b-lg p-4 space-y-4"
          >
            {filteredRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No requests match this filter.
              </p>
            ) : (
              filteredRequests.map((request, index) =>
                renderRequestCard(request, index)
              )
            )}
          </TabsContent>
          <TabsContent
            value="volunteer"
            className="mt-0 bg-white rounded-b-lg p-4 space-y-4"
          >
            {volunteerRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No requests from you yet.
              </p>
            ) : (
              volunteerRequests.map((request, index) =>
                renderRequestCard(request, index)
              )
            )}
          </TabsContent>
          <TabsContent
            value="agency"
            className="mt-0 bg-white rounded-b-lg p-4 space-y-4"
          >
            {agencyRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No invitations from organizations yet.
              </p>
            ) : (
              agencyRequests.map((request, index) =>
                renderRequestCard(request, index)
              )
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default VolunteerRequests;
