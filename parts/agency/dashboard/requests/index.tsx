import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import { toast } from "sonner";
import { useSendMail } from "@/services/mail";
import { volunteerApplicationStatusHtml } from "@/lib/email-templates/volunteerApplicationStatus";
import { ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, MapPin, Calendar, Star, Phone } from "lucide-react";
import { useSkillLabels } from "@/hooks/useSkillLabels";

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
  applicant_profile_picture?: string | null;
  applicant_phone?: string | null;
  applicant_date_of_birth?: string | null;
  applicant_skills: string[];
  applicant_availability: string;
  applicant_experience?: string | null;
  applicant_residence_country?: string | null;
  applicant_residence_state?: string | null;
  applicant_average_rating?: number | null;
  anonymous?: boolean;
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
  const [selectedRequest, setSelectedRequest] = useState<VolunteerRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { getLabel } = useSkillLabels();

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
          profiles:volunteer_id (full_name, email, profile_picture, phone, date_of_birth, skills, availability, experience, residence_country, residence_state, average_rating, anonymous),
          projects:project_id (title)
        `,
        )
        .eq("organization_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error("Error fetching requests: " + error.message);
      }

      // Normalize profile: Supabase may return relation as object or single-element array
      const getProfile = (request: any) => {
        const p = request.profiles;
        return Array.isArray(p) ? p[0] : p;
      };

      const formattedRequests: VolunteerRequest[] = volunteerRequestData.map(
        (request: any) => {
          const profile = getProfile(request);
          const rawSkills = profile?.skills;
          const skills = Array.isArray(rawSkills)
            ? rawSkills
            : typeof rawSkills === "string"
              ? [rawSkills]
              : [];
          return {
            id: request.id,
            organization_id: request.organization_id,
            volunteer_id: request.volunteer_id,
            project_id: request.project_id,
            status: request.status,
            created_at: request.created_at,
            applicant_name: profile?.full_name || "Unknown",
            project_title: request.projects?.title || "Unknown Project",
            applicant_email: profile?.email || "",
            applicant_profile_picture: profile?.profile_picture ?? null,
            applicant_phone: profile?.phone ?? null,
            applicant_date_of_birth: profile?.date_of_birth ?? null,
            applicant_skills: skills,
            applicant_availability:
              profile?.availability ?? "N/A",
            applicant_experience: profile?.experience ?? null,
            applicant_residence_country: profile?.residence_country ?? null,
            applicant_residence_state: profile?.residence_state ?? null,
            applicant_average_rating:
              profile?.average_rating != null
                ? Number(profile.average_rating)
                : null,
            anonymous: !!profile?.anonymous,
          };
        },
      );

      setRequests(formattedRequests);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
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

      setRequests((prev) => prev.filter((req) => req.id !== requestId));
      setSelectedRequest(null);
      setDetailsOpen(false);
      toast.success("Request accepted successfully!");

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
      toast.error(err.message);
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

      setRequests((prev) => prev.filter((req) => req.id !== requestId));
      setSelectedRequest(null);
      setDetailsOpen(false);

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
      toast.success("Request declined successfully!");

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
      toast.error(err.message);
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
        toast.error("Please log in to view requests");
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

  const formatMonthDay = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    } catch {
      return "—";
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

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
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRequests.map((request) => (
                <TableRow
                  key={request.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedRequest(request);
                    setDetailsOpen(true);
                  }}
                >
                  <TableCell className="font-medium">
                    {request.anonymous ? "Volunteer" : request.applicant_name}
                  </TableCell>
                  <TableCell>{request.project_title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(request.created_at)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        request.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : request.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {request.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogContent
              className="max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedRequest && (() => {
                const hidePersonal = selectedRequest.anonymous === true;
                const displayName = hidePersonal
                  ? "Volunteer"
                  : selectedRequest.applicant_name;
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-diaspora-blue/20 shrink-0">
                          {!hidePersonal && (
                            <AvatarImage
                              src={
                                selectedRequest.applicant_profile_picture ||
                                undefined
                              }
                              alt=""
                            />
                          )}
                          <AvatarFallback className="text-2xl bg-diaspora-blue/10 text-diaspora-darkBlue">
                            {hidePersonal
                              ? "?"
                              : getInitials(selectedRequest.applicant_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <span className="block truncate">{displayName}</span>
                          <p className="text-sm font-normal text-muted-foreground mt-1">
                            Application for {selectedRequest.project_title}
                          </p>
                          <Badge
                            variant={
                              selectedRequest.status === "accepted"
                                ? "default"
                                : selectedRequest.status === "declined"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="mt-1.5"
                          >
                            {selectedRequest.status}
                          </Badge>
                        </div>
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                      {/* Contact & basic info – hidden when anonymous */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {!hidePersonal && (
                          <>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Email
                              </p>
                              <a
                                href={`mailto:${selectedRequest.applicant_email}`}
                                className="flex items-center gap-2 text-diaspora-blue hover:underline break-all mt-1"
                              >
                                <Mail className="h-4 w-4 shrink-0" />
                                {selectedRequest.applicant_email || "—"}
                              </a>
                            </div>
                            {selectedRequest.applicant_phone && (
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Phone
                                </p>
                                <a
                                  href={`tel:${selectedRequest.applicant_phone}`}
                                  className="flex items-center gap-2 text-diaspora-blue hover:underline mt-1"
                                >
                                  <Phone className="h-4 w-4 shrink-0" />
                                  {selectedRequest.applicant_phone}
                                </a>
                              </div>
                            )}
                          </>
                        )}
                        {hidePersonal && (
                          <p className="text-sm text-muted-foreground sm:col-span-2">
                            This volunteer has chosen to remain anonymous.
                          </p>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Applied
                          </p>
                          <p className="flex items-center gap-2 text-foreground mt-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(selectedRequest.created_at)}
                          </p>
                        </div>
                        {!hidePersonal &&
                          selectedRequest.applicant_date_of_birth && (
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Date of birth
                              </p>
                              <p className="flex items-center gap-2 text-foreground mt-1">
                                {formatMonthDay(
                                  selectedRequest.applicant_date_of_birth,
                                )}
                              </p>
                            </div>
                          )}
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Availability
                          </p>
                          <Badge
                            variant="outline"
                            className="capitalize mt-1"
                          >
                            {selectedRequest.applicant_availability || "—"}
                          </Badge>
                        </div>
                      </div>

                      {/* Location */}
                      {(selectedRequest.applicant_residence_country ||
                        selectedRequest.applicant_residence_state) && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Location
                          </p>
                          <div className="flex items-center gap-2 text-base">
                            <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                            <span>
                              {[
                                selectedRequest.applicant_residence_state,
                                selectedRequest.applicant_residence_country,
                              ]
                                .filter(Boolean)
                                .join(", ") || "Not specified"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Experience */}
                      {selectedRequest.applicant_experience && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Experience
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-wrap rounded-md bg-muted/50 p-3">
                            {selectedRequest.applicant_experience}
                          </p>
                        </div>
                      )}

                      {/* Skills */}
                      {selectedRequest.applicant_skills?.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Skills
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedRequest.applicant_skills.map((skill) => (
                              <Badge
                                key={skill}
                                className="bg-diaspora-blue/10 text-diaspora-darkBlue border-diaspora-blue/20 cursor-default hover:bg-diaspora-blue/10"
                              >
                                {getLabel(skill)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rating */}
                      {selectedRequest.applicant_average_rating != null && (
                        <div className="flex items-center gap-3 pt-4 border-t">
                          <div className="flex items-center gap-1">
                            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                            <span className="text-2xl font-bold">
                              {Number(
                                selectedRequest.applicant_average_rating,
                              ).toFixed(1)}
                            </span>
                          </div>
                          <p className="text-muted-foreground">
                            Average rating
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedRequest.status === "pending" && (
                      <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
                        <Button
                          variant="outline"
                          onClick={() => handleDecline(selectedRequest.id)}
                        >
                          Decline
                        </Button>
                        <Button
                          onClick={() => handleAccept(selectedRequest.id)}
                          className="action-btn"
                        >
                          Accept
                        </Button>
                      </DialogFooter>
                    )}
                  </>
                );
              })()}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default AgencyRequestFromVolunteer;
