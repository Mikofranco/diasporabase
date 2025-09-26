// app/dashboard/volunteer/requests.tsx
"use client";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, User, Briefcase } from "lucide-react";
import { startLoading, stopLoading } from "@/lib/loading";

const supabase = createClient();

interface Request {
  id: string;
  project_id: string;
  project_title: string;
  organization_name: string;
  status: string;
  request_type: "volunteer" | "agency";
}

const VolunteerRequests: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"volunteer" | "agency">("volunteer");

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      startLoading();

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to view requests.");

        // Fetch user role
        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();
        if (profileError) throw new Error("Error fetching user profile: " + profileError.message);
        setUserRole(userProfile.role);

        let volunteerData: any[] = [];
        let agencyData: any[] = [];

        if (userProfile.role === "admin" || userProfile.role === "super_admin") {
          // Admins and super_admins see all requests
          const { data: vData, error: vError } = await supabase
            .from("volunteer_requests")
            .select("id, project_id, volunteer_id, status, projects(title, organization_name), profiles(full_name)");
          if (vError) throw new Error("Error fetching volunteer requests: " + vError.message);
          volunteerData = vData;

          const { data: aData, error: aError } = await supabase
            .from("agency_requests")
            .select("id, project_id, volunteer_id, status, projects(title, organization_name), profiles(full_name)");
          if (aError) throw new Error("Error fetching agency requests: " + aError.message);
          agencyData = aData;
        } else {
          // Volunteers see only their requests
          const { data: vData, error: vError } = await supabase
            .from("volunteer_requests")
            .select("id, project_id, status, projects(title, organization_name)")
            .eq("volunteer_id", userId);
          if (vError) throw new Error("Error fetching volunteer requests: " + vError.message);
          volunteerData = vData;

          const { data: aData, error: aError } = await supabase
            .from("agency_requests")
            .select("id, project_id, status, projects(title, organization_name)")
            .eq("volunteer_id", userId);
          if (aError) throw new Error("Error fetching agency requests: " + aError.message);
          agencyData = aData;
        }

        // Combine requests
        const combinedRequests: Request[] = [
          ...(volunteerData?.map((item: any) => ({
            id: item.id,
            project_id: item.project_id,
            project_title: item.projects.title,
            organization_name: item.projects.organization_name,
            status: item.status,
            request_type: "volunteer" as const,
            volunteer_name: item.profiles?.full_name, // Optional for admins
          })) || []),
          ...(agencyData?.map((item: any) => ({
            id: item.id,
            project_id: item.project_id,
            project_title: item.projects.title,
            organization_name: item.projects.organization_name,
            status: item.status,
            request_type: "agency" as const,
            volunteer_name: item.profiles?.full_name, // Optional for admins
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

  const handleAcceptRequest = async (requestId: string, projectId: string, requestType: "volunteer" | "agency") => {
    try {
      startLoading();
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to accept requests.");

      // Check if volunteer is already assigned
      const { data: existingAssignment, error: assignmentError } = await supabase
        .from("project_volunteers")
        .select("project_id")
        .eq("project_id", projectId)
        .eq("volunteer_id", userId)
        .single();

      if (assignmentError && assignmentError.code !== "PGRST116")
        throw new Error("Error checking assignment: " + assignmentError.message);
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

      if (projectError) throw new Error("Error fetching project: " + projectError.message);
      if (project.volunteers_registered >= project.volunteers_needed) {
        toast.error("Volunteer limit reached for this project.");
        return;
      }

        const { error: assignError } = await supabase.from("project_volunteers").insert([
        {
          project_id: projectId,
          volunteer_id: userId,
        },
      ]);

      if (assignError) throw new Error("Error assigning volunteer: " + assignError.message);

      // Increment volunteers_registered
      const { error: projectUpdateError } = await supabase
        .from("projects")
        .update({ volunteers_registered: project.volunteers_registered + 1 })
        .eq("id", projectId);

      if (projectUpdateError) throw new Error("Error updating project: " + projectUpdateError.message);


      // Update request status to accepted
      const table = requestType === "volunteer" ? "volunteer_requests" : "agency_requests";
      const { error: updateError } = await supabase
        .from(table)
        .update({ status: "accepted" })
        .eq("id", requestId)
        .eq("volunteer_id", userId);

      if (updateError) throw new Error(`Error accepting ${requestType} request: ${updateError.message}`);

      // Add to project_volunteers
    
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

  const handleRejectRequest = async (requestId: string, requestType: "volunteer" | "agency") => {
    try {
      startLoading();
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to reject requests.");

      const table = requestType === "volunteer" ? "volunteer_requests" : "agency_requests";
      const { error } = await supabase
        .from(table)
        .update({ status: "rejected" })
        .eq("id", requestId)
        .eq("volunteer_id", userId);

      if (error) throw new Error(`Error rejecting ${requestType} request: ${error.message}`);

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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 bg-gray-200 rounded"></div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-600">{error}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Volunteer Requests</h1>
      {requests.length === 0 ? (
        <p className="text-gray-600">No requests found.</p>
      ) : (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "volunteer" | "agency")}>
          <TabsList className="mb-4">
            <TabsTrigger value="volunteer" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Volunteer-Initiated
            </TabsTrigger>
            <TabsTrigger value="agency" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Agency-Initiated
            </TabsTrigger>
          </TabsList>
          <TabsContent value="volunteer">
            <div className="grid gap-4 md:grid-cols-2">
              {requests
                .filter((r) => r.request_type === "volunteer")
                .map((request) => (
                  <Card
                    key={`${request.request_type}-${request.id}`}
                    className="bg-blue-50 border-blue-200"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        {request.project_title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p><strong>Organization:</strong> {request.organization_name}</p>
                      {userRole === "admin" || userRole === "super_admin" ? (//@ts-ignore
                        <p><strong>Volunteer:</strong> {request.volunteer_name || "N/A"}</p>
                      ) : null}
                      <p><strong>Request Type:</strong> Volunteer-Initiated</p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span
                          className={`${
                            request.status === "pending"
                              ? "text-yellow-600"
                              : request.status === "accepted"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </p>
                      {request.status === "pending" && (
                        <div className="mt-4 flex gap-2">
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAcceptRequest(request.id, request.project_id, request.request_type)}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRejectRequest(request.id, request.request_type)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
            {requests.filter((r) => r.request_type === "volunteer").length === 0 && (
              <p className="text-gray-600">No volunteer-initiated requests found.</p>
            )}
          </TabsContent>
          <TabsContent value="agency">
            <div className="grid gap-4 md:grid-cols-2">
              {requests
                .filter((r) => r.request_type === "agency")
                .map((request) => (
                  <Card
                    key={`${request.request_type}-${request.id}`}
                    className="bg-green-50 border-green-200"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-green-600" />
                        {request.project_title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p><strong>Organization:</strong> {request.organization_name}</p>
                      {userRole === "admin" || userRole === "super_admin" ? (//@ts-ignore
                        <p><strong>Volunteer:</strong> {request.volunteer_name || "N/A"}</p>
                      ) : null}
                      <p><strong>Request Type:</strong> Agency-Initiated</p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span
                          className={`${
                            request.status === "pending"
                              ? "text-yellow-600"
                              : request.status === "accepted"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </p>
                      {request.status === "pending" && (
                        <div className="mt-4 flex gap-2">
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAcceptRequest(request.id, request.project_id, request.request_type)}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRejectRequest(request.id, request.request_type)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
            {requests.filter((r) => r.request_type === "agency").length === 0 && (
              <p className="text-gray-600">No agency-initiated requests found.</p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default VolunteerRequests;