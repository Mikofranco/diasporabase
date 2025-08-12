// app/dashboard/volunteer/requests/page.tsx
"use client";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const supabase = createClient();

interface Request {
  id: string;
  project_id: string;
  project_title: string;
  organization_name: string;
  status: string;
}

const VolunteerRequests: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to view requests.");

        const { data, error } = await supabase
          .from("volunteer_requests")
          .select("id, project_id, status, projects(title, organization_name)")
          .eq("volunteer_id", userId);

        if (error) throw new Error("Error fetching requests: " + error.message);

        setRequests(
          data?.map((item: any) => ({
            id: item.id,
            project_id: item.project_id,
            project_title: item.projects.title,
            organization_name: item.projects.organization_name,
            status: item.status,
          })) || []
        );
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleAcceptRequest = async (requestId: string, projectId: string) => {
    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to accept requests.");

      // Update request status to accepted
      const { error: updateError } = await supabase
        .from("volunteer_requests")
        .update({ status: "accepted" })
        .eq("id", requestId)
        .eq("volunteer_id", userId);

      if (updateError) throw new Error("Error accepting request: " + updateError.message);

      // Check project volunteer limit
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("volunteers_needed, volunteers_registered")
        .eq("id", projectId)
        .single();

      if (projectError) throw new Error("Error fetching project: " + projectError.message);
      if (project.volunteers_registered >= project.volunteers_needed) {
        toast.error("Volunteer limit reached for this project.");
        return;
      }

      // Add to project_volunteers
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

      // Update local state
      setRequests(
        requests.map((r) =>
          r.id === requestId ? { ...r, status: "accepted" } : r
        )
      );
      toast.success("Request accepted and volunteer assigned!");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to reject requests.");

      const { error } = await supabase
        .from("volunteer_requests")
        .update({ status: "rejected" })
        .eq("id", requestId)
        .eq("volunteer_id", userId);

      if (error) throw new Error("Error rejecting request: " + error.message);

      setRequests(
        requests.map((r) =>
          r.id === requestId ? { ...r, status: "rejected" } : r
        )
      );
      toast.success("Request rejected.");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  if (loading) return <div className="container mx-auto p-6">Loading...</div>;
  if (error) return <div className="container mx-auto p-6 text-red-500 bg-red-100 rounded-md">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Volunteer Requests</h1>
      {requests.length === 0 ? (
        <p className="text-gray-600">No requests found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <CardTitle>{request.project_title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>Organization:</strong> {request.organization_name}</p>
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
                      onClick={() => handleAcceptRequest(request.id, request.project_id)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VolunteerRequests;