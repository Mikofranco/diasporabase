import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import RequestSlate from "./request-slate";
import { toast } from "sonner";

interface VolunteerRequest {
  id: string;
  organization_id: string;
  volunteer_id: string;
  project_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  applicant_name: string;
  project_title: string;
}

interface AgencyRequestFromVolunteerProps {
  className?: string;
}

const AgencyRequestFromVolunteer: React.FC<AgencyRequestFromVolunteerProps> = ({
  className = "",
}) => {
  const [requests, setRequests] = useState<VolunteerRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: volunteerRequestData, error } = await supabase
        .from("volunteer_requests")
        .select(`
          id,
          organization_id,
          volunteer_id,
          project_id,
          status,
          created_at,
          profiles:volunteer_id (full_name),
          projects:project_id (title)
        `)
        .eq("organization_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error("Error fetching requests: " + error.message);
      }
      console.log("Raw request data:", volunteerRequestData);

      const formattedRequests: VolunteerRequest[] = volunteerRequestData.map((request: any) => ({
        id: request.id,
        organization_id: request.organization_id,
        volunteer_id: request.volunteer_id,
        project_id: request.project_id,
        status: request.status,
        created_at: request.created_at,
        applicant_name: request.profiles?.full_name || "Unknown",
        project_title: request.projects?.title || "Unknown Project",
      }));

      setRequests(formattedRequests);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message, { position: "top-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("volunteer_requests")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", requestId)
        .eq("organization_id", (await getUserId()).data);

      if (error) {
        throw new Error("Error accepting request: " + error.message);
      }

      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "accepted" } : req
        )
      );
      toast.success("Request accepted successfully!", { position: "top-right" });

      const request = requests.find((req) => req.id === requestId);
      if (request) {
        await supabase.from("notifications").insert({
          user_id: request.volunteer_id,
          message: `Your volunteer request for ${request.project_title} has been accepted!`,
          type: "request_status_change",
          is_read: false,
          // created_at: new Date().toISOString(),
          related_id: requestId,
          project_id: request.project_id,
        });
      }
    } catch (err: any) {
      toast.error(err.message, { position: "top-right" });
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("volunteer_requests")
        .update({ status: "declined", updated_at: new Date().toISOString() })
        .eq("id", requestId)
        .eq("organization_id", (await getUserId()).data);

      if (error) {
        throw new Error("Error declining request: " + error.message);
      }

      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "declined" } : req
        )
      );
      toast.success("Request declined successfully!", { position: "top-right" });

      const request = requests.find((req) => req.id === requestId);
      if (request) {
        await supabase.from("notifications").insert({
          user_id: request.volunteer_id,
          message: `Your volunteer request for ${request.project_title} has been declined.`,
          type: "request_status_change",
          is_read: false,
          created_at: new Date().toISOString(),
          related_id: requestId,
          project_id: request.project_id,
        });
      }
    } catch (err: any) {
      toast.error(err.message, { position: "top-right" });
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const { data: userId, error: userError } = await getUserId();
      if (userError || !userId) {
        setError("Failed to authenticate user");
        toast.error("Please log in to view requests", { position: "top-right" });
        setIsLoading(false);
        return;
      }
      await fetchRequests(userId);
    };
    initialize();
  }, []);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    }).format(date);
  };

  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-md space-y-4 mt-8 ${className}`}
    >
      <h2 className="font-semibold text-xl text-gray-800">Volunteer Requests </h2>

      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <svg
            className="animate-spin h-8 w-8 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && requests.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No pending volunteer requests found.
        </div>
      )}

      {!isLoading && !error && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestSlate
              key={request.id}
              requestId={request.id}
              applicantName={request.applicant_name}
              projectTitle={request.project_title}
              createdAt={formatDate(request.created_at)}
              status={request.status}
              onAccept={() => handleAccept(request.id)}
              onDecline={() => handleDecline(request.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AgencyRequestFromVolunteer;