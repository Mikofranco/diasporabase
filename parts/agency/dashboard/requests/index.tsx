import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import RequestSlate from "./request-slate";
import { toast } from "sonner";
import { useSendMail } from "@/services/mail";
import { volunteerApplicationStatusHtml } from "@/lib/email-templates/volunteerApplicationStatus";
import { ChevronRight } from "lucide-react";

interface VolunteerRequest {
  id: string;
  organization_id: string;
  volunteer_id: string;
  project_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  applicant_name: string;
  project_title: string;
  applicant_email: string;
}

interface AgencyRequestFromVolunteerProps {
  className?: string;
  /** Optional organization/user id; when provided we avoid extra getUserId() calls */
  userId?: string;
  /** When set, show only this many requests and show "View all" link. */
  limitRows?: number;
  viewAllHref?: string;
}

const AgencyRequestFromVolunteer: React.FC<AgencyRequestFromVolunteerProps> = ({
  className = "",
  userId,
  limitRows,
  viewAllHref,
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
        .select(
          `
          id,
          organization_id,
          volunteer_id,
          project_id,
          status,
          created_at,
          profiles:volunteer_id (full_name, email),
          projects:project_id (title)
        `,
        )
        .eq("organization_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error("Error fetching requests: " + error.message);
      }

      const formattedRequests: VolunteerRequest[] = volunteerRequestData.map(
        (request: any) => ({
          id: request.id,
          organization_id: request.organization_id,
          volunteer_id: request.volunteer_id,
          project_id: request.project_id,
          status: request.status,
          created_at: request.created_at,
          applicant_name: request.profiles?.full_name || "Unknown",
          project_title: request.projects?.title || "Unknown Project",
          applicant_email: request.profiles?.email || "",
        }),
      );

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
      // Prefer the userId passed from parent; fall back to getUserId only if needed
      const orgId =
        userId ?? (await getUserId()).data ??
        undefined;

      if (!orgId) {
        throw new Error("Failed to identify organization");
      }

      const { error } = await supabase
        .from("volunteer_requests")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", requestId)
        .eq("organization_id", orgId);

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
      if(request){
        await supabase.from("project_volunteers").insert({
          project_id: request.project_id,
          volunteer_id: request.volunteer_id,
        });
      }
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

      await useSendMail({
        to: requests.find((req) => req.id === requestId)?.applicant_email || "",
        subject: "Volunteer Request Accepted",
        html: volunteerApplicationStatusHtml(
          requests.find((req) => req.id === requestId)?.applicant_name ||
            "Volunteer",
          "DiasporaBase", // organization name
          requests.find((req) => req.id === requestId)?.project_id || "",
          "accepted",
          requests.find((req) => req.id === requestId)?.project_title || "",
        ),
        onSuccess() {
          console.log("Accept email sent successfully");
        },
      });
    } catch (err: any) {
      toast.error(err.message, { position: "top-right" });
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      const orgId =
        userId ?? (await getUserId()).data ??
        undefined;

      if (!orgId) {
        throw new Error("Failed to identify organization");
      }

      const { error } = await supabase
        .from("volunteer_requests")
        .update({ status: "declined", updated_at: new Date().toISOString() })
        .eq("id", requestId)
        .eq("organization_id", orgId);

      if (error) {
        throw new Error("Error declining request: " + error.message);
      }

      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "declined" } : req,
        ),
      );

      await useSendMail({
        to: requests.find((req) => req.id === requestId)?.applicant_email || "",
        subject: "Volunteer Request Declined",
        html: volunteerApplicationStatusHtml(
          requests.find((req) => req.id === requestId)?.applicant_name ||
            "Volunteer",
          "DiasporaBase", // organization name
          requests.find((req) => req.id === requestId)?.project_id || "",
          "declined",
          requests.find((req) => req.id === requestId)?.project_title || "",
        ),
        onSuccess() {
          console.log("Decline email sent successfully");
        },
      });
      toast.success("Request declined successfully!", {
        position: "top-right",
      });

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
      // If parent already passed userId, use it directly
      if (userId) {
        await fetchRequests(userId);
        return;
      }

      const { data: resolvedUserId, error: userError } = await getUserId();
      if (userError || !resolvedUserId) {
        setError("Failed to authenticate user");
        toast.error("Please log in to view requests", {
          position: "top-right",
        });
        setIsLoading(false);
        return;
      }
      await fetchRequests(resolvedUserId);
    };
    initialize();
  }, [userId]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    }).format(date);
  };

  const displayRequests = limitRows != null && limitRows > 0
    ? requests.slice(0, limitRows)
    : requests;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4 ${className}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold text-lg text-slate-900">
          Volunteer Requests
        </h2>
        {viewAllHref && requests.length > 0 && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-3 text-diaspora-blue hover:text-diaspora-blue/90 hover:bg-diaspora-blue/10 transition-colors"
          >
            View all
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        )}
      </div>

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

      {!isLoading && !error && displayRequests.length > 0 && (
        <div className="space-y-4">
          {displayRequests.map((request) => (
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
