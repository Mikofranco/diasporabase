"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Mail,
  Calendar,
  Star,
  Phone,
  StarOff,
  UserCheck,
  Loader2,
  UserMinus,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import { useSkillLabels } from "@/hooks/useSkillLabels";
import {
  createProjectManagerRequest,
  removeProjectManager,
} from "@/services/projects";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSendMail } from "@/services/mail";
import { volunteerRequestProjectManagerHtml } from "@/lib/email-templates/pmRequest";
import { createNotification } from "@/services/notification";

/** Skill IDs that qualify a volunteer as project manager (same access as project_management). */
const PROJECT_MANAGEMENT_SKILLS = ["project_management", "project_mgt"];

/** Volunteer has project management skill (can be assigned as PM). */
function hasProjectManagementSkill(skills: string[]): boolean {
  if (!skills?.length) return false;
  return PROJECT_MANAGEMENT_SKILLS.some((s) => skills.includes(s));
}

/** Format date string to "Month Day" (e.g. "March 15") for display only. */
function formatMonthDay(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}

interface Volunteer {
  volunteer_id: string;
  full_name: string;
  email: string;
  profile_picture?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  skills: string[];
  availability: string;
  experience?: string | null;
  residence_country: string;
  residence_state?: string | null;
  volunteer_countries: string[];
  volunteer_states: string[];
  volunteer_lgas: string[];
  average_rating: number;
  anonymous?: boolean;
}

const MAX_PROJECT_MANAGERS = 2;

interface AssignedVolunteersTableProps {
  projectId: string;
  volunteers: Volunteer[];
  organizationId: string;
  projectManagerIds: string[];
  pendingPmVolunteerIds: string[];
  canAssignManager?: boolean;
  onRatingSubmitted?: () => void;
  onManagerAssigned?: () => void;
  /** Call when a PM request was just sent so UI can show "Pending Request" without waiting for refetch */
  onPmRequestSent?: (volunteerId: string) => void;
  projectTitle: string;
  organizationName: string;
}

export function AssignedVolunteersTable({
  projectId,
  volunteers,
  organizationId,
  projectManagerIds,
  pendingPmVolunteerIds,
  canAssignManager = false,
  onRatingSubmitted,
  onManagerAssigned,
  onPmRequestSent,
  organizationName,
  projectTitle,
}: AssignedVolunteersTableProps) {
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(
    null,
  );
  const [ratingsMap, setRatingsMap] = useState<
    Record<string, { rating: number; comment?: string | null }>
  >({});
  const [averageRatingsMap, setAverageRatingsMap] = useState<
    Record<string, number>
  >({});
  const [rateModalVolunteer, setRateModalVolunteer] =
    useState<Volunteer | null>(null);
  const [rateValue, setRateValue] = useState(0);
  const [rateComment, setRateComment] = useState("");
  const [rateLoading, setRateLoading] = useState(false);
  const [assignPmVolunteer, setAssignPmVolunteer] = useState<Volunteer | null>(
    null,
  );
  const [assignPmLoading, setAssignPmLoading] = useState(false);
  const [removePmLoading, setRemovePmLoading] = useState(false);
  const [removePmConfirmVolunteer, setRemovePmConfirmVolunteer] =
    useState<Volunteer | null>(null);
  const { toast } = useToast();
  const { getLabel } = useSkillLabels();

  useEffect(() => {
    if (!projectId || volunteers.length === 0) return;
    const loadRatings = async () => {
      const [{ data: projectRatings }, { data: allRatings }] =
        await Promise.all([
          supabase
            .from("volunteer_ratings")
            .select("volunteer_id, rating, comment")
            .eq("project_id", projectId),
          supabase
            .from("volunteer_ratings")
            .select("volunteer_id, rating")
            .in(
              "volunteer_id",
              volunteers.map((v) => v.volunteer_id),
            ),
        ]);

      const map: Record<string, { rating: number; comment?: string | null }> =
        {};
      (projectRatings ?? []).forEach(
        (r: {
          volunteer_id: string;
          rating: number;
          comment?: string | null;
        }) => {
          map[r.volunteer_id] = { rating: r.rating, comment: r.comment };
        },
      );
      setRatingsMap(map);

      const totals: Record<string, { sum: number; count: number }> = {};
      (allRatings ?? []).forEach(
        (r: { volunteer_id: string; rating: number }) => {
          if (!totals[r.volunteer_id])
            totals[r.volunteer_id] = { sum: 0, count: 0 };
          totals[r.volunteer_id].sum += r.rating;
          totals[r.volunteer_id].count += 1;
        },
      );

      const avgMap: Record<string, number> = {};
      volunteers.forEach((v) => {
        const t = totals[v.volunteer_id];
        avgMap[v.volunteer_id] =
          t && t.count > 0 ? t.sum / t.count : v.average_rating;
      });
      setAverageRatingsMap(avgMap);
    };
    loadRatings();
  }, [projectId, volunteers]);

  const handleOpenRateModal = (v: Volunteer, e: React.MouseEvent) => {
    e.stopPropagation();
    setRateModalVolunteer(v);
    setRateValue(ratingsMap[v.volunteer_id]?.rating ?? 0);
    setRateComment(ratingsMap[v.volunteer_id]?.comment ?? "");
  };

  const handleSubmitRating = async () => {
    if (!rateModalVolunteer || rateValue < 1) {
      toast({ title: "Select a rating (1–5 stars)", variant: "destructive" });
      return;
    }
    setRateLoading(true);
    try {
      const { data: userId } = await getUserId();
      if (!userId) throw new Error("Please log in.");

      const { error } = await supabase.from("volunteer_ratings").upsert(
        {
          project_id: projectId,
          volunteer_id: rateModalVolunteer.volunteer_id,
          rater_id: userId,
          rating: rateValue,
          comment: rateComment.trim() || null,
        },
        { onConflict: "project_id,volunteer_id" },
      );
      if (error) throw error;

      setRatingsMap((prev) => ({
        ...prev,
        [rateModalVolunteer.volunteer_id]: {
          rating: rateValue,
          comment: rateComment.trim() || null,
        },
      }));
      const { data: volunteerRatings } = await supabase
        .from("volunteer_ratings")
        .select("rating")
        .eq("volunteer_id", rateModalVolunteer.volunteer_id);
      if (volunteerRatings && volunteerRatings.length > 0) {
        const avg =
          volunteerRatings.reduce(
            (sum: number, r: { rating: number }) => sum + r.rating,
            0,
          ) / volunteerRatings.length;
        setAverageRatingsMap((prev) => ({
          ...prev,
          [rateModalVolunteer.volunteer_id]: avg,
        }));
      }
      setRateModalVolunteer(null);
      toast({
        title: "Rating submitted",
        description: `Rated ${rateModalVolunteer.full_name}`,
      });
      onRatingSubmitted?.();
    } catch (err: any) {
      toast({
        title: "Failed to submit rating",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setRateLoading(false);
    }
  };

  const handleAssignAsProjectManager = async () => {
    if (!assignPmVolunteer || !organizationId) return;
    setAssignPmLoading(true);
    try {
      await createProjectManagerRequest({
        projectId,
        volunteerId: assignPmVolunteer.volunteer_id,
        requesterId: organizationId,
      });

      await createNotification({
        userId: assignPmVolunteer.volunteer_id,
        type: "project_manager_request",
        message: `You have a new Project Manager role request for "${projectTitle}".`,
        projectId,
        relatedId: organizationId,
      });

      await useSendMail({
        to: assignPmVolunteer.email,
        subject: `Project Manager Role Invitation for ${selectedVolunteer?.full_name}`,
        html: volunteerRequestProjectManagerHtml(
          assignPmVolunteer.full_name,
          organizationName,
          projectTitle,
          `${window.location.origin}/volunteer/requests`
        ),
        onError(error) {
          toast({
            title: "Failed to send email notification",
            description: "PM role request was created, but failed to send email notification to the volunteer. They may not see the request in time.",
            variant: "destructive",
          });
        },
      });
      toast({
        title: "PM role request sent",
        description: `${assignPmVolunteer.full_name} can accept or reject the Project Manager role from their requests.`,
      });
      const sentVolunteerId = assignPmVolunteer.volunteer_id;
      setAssignPmVolunteer(null);
      setSelectedVolunteer(null);
      onPmRequestSent?.(sentVolunteerId);
      onManagerAssigned?.();
    } catch (err: any) {
      toast({
        title: "Failed to send PM request",
        description: err?.message ?? "Something went wrong",
        variant: "destructive",
      });
      setAssignPmVolunteer(null);
    } finally {
      setAssignPmLoading(false);
    }
  };

  const handleConfirmRemovePm = async () => {
    if (!removePmConfirmVolunteer) return;
    const volunteer = removePmConfirmVolunteer;
    setRemovePmLoading(true);
    try {
      await removeProjectManager(projectId, volunteer.volunteer_id);
      toast({
        title: "PM role removed",
        description: `${volunteer.full_name} is no longer a Project Manager. You can assign another volunteer from the list.`,
      });
      setRemovePmConfirmVolunteer(null);
      setSelectedVolunteer(null);
      onManagerAssigned?.();
    } catch (err: any) {
      toast({
        title: "Failed to remove PM",
        description: err?.message ?? "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setRemovePmLoading(false);
    }
  };

  const isPendingPm = (volunteerId: string) =>
    pendingPmVolunteerIds.includes(volunteerId);
  const isAlreadyPm = (volunteerId: string) =>
    projectManagerIds.includes(volunteerId);
  const isReplaceMode = projectManagerIds.length >= MAX_PROJECT_MANAGERS;
  const getAssignPmButtonState = (v: Volunteer) => {
    if (!canAssignManager || !hasProjectManagementSkill(v.skills)) return null;
    if (isAlreadyPm(v.volunteer_id)) return "already_pm";
    if (isPendingPm(v.volunteer_id)) return "pending";
    if (isReplaceMode) return "replace";
    return "assign";
  };

  if (volunteers.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
        <p className="text-gray-500 text-lg">No volunteers assigned yet</p>
        <p className="text-sm text-gray-400 mt-2">
          Volunteers will appear here once they join the project
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Volunteer</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead className="text-right">Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {volunteers.map((volunteer) => (
              <TableRow
                key={volunteer.volunteer_id}
                className="hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedVolunteer(volunteer)}
              >
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={volunteer.profile_picture || undefined}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {volunteer.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{volunteer.full_name}</p>
                        {isAlreadyPm(volunteer.volunteer_id) && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-diaspora-blue/15 text-diaspora-darkBlue border-diaspora-blue/30"
                          >
                            PM
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {volunteer.email}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>
                      {[volunteer.residence_state, volunteer.residence_country]
                        .filter(Boolean)
                        .join(", ") || "Not specified"}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {volunteer.skills.slice(0, 3).map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-xs"
                      >
                        {getLabel(skill)}
                      </Badge>
                    ))}
                    {volunteer.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{volunteer.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {volunteer.availability || "N/A"}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    variant={
                      ratingsMap[volunteer.volunteer_id]
                        ? "secondary"
                        : "outline"
                    }
                    size="sm"
                    onClick={(e) => handleOpenRateModal(volunteer, e)}
                    className="gap-1"
                  >
                    {ratingsMap[volunteer.volunteer_id] ? (
                      <>
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        {ratingsMap[volunteer.volunteer_id].rating}/5
                      </>
                    ) : (
                      <>
                        <StarOff className="h-4 w-4" />
                        Rate
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Volunteer Details Modal – agency always sees full info for assigned volunteers */}
      <Dialog
        open={!!selectedVolunteer}
        onOpenChange={() => setSelectedVolunteer(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedVolunteer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-diaspora-blue/20 shrink-0">
                    <AvatarImage
                      src={selectedVolunteer.profile_picture || undefined}
                      alt=""
                    />
                    <AvatarFallback className="text-2xl bg-diaspora-blue/10 text-diaspora-darkBlue">
                      {selectedVolunteer.full_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <span className="block truncate">
                      {selectedVolunteer.full_name}
                    </span>
                    <p className="text-sm font-normal text-muted-foreground mt-1">
                      Assigned volunteer
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Personal & contact info – always shown for assigned (agency) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${selectedVolunteer.email}`}
                      className="flex items-center gap-2 text-diaspora-blue hover:underline break-all"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      {selectedVolunteer.email}
                    </a>
                  </div>
                  {selectedVolunteer.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a
                        href={`tel:${selectedVolunteer.phone}`}
                        className="flex items-center gap-2 text-diaspora-blue hover:underline"
                      >
                        <Phone className="h-4 w-4 shrink-0" />
                        {selectedVolunteer.phone}
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Date of birth
                    </p>
                    <p className="flex items-center gap-2 text-foreground">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatMonthDay(selectedVolunteer.date_of_birth)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Availability
                    </p>
                    <Badge variant="outline" className="capitalize mt-1">
                      {selectedVolunteer.availability}
                    </Badge>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Location</p>
                  <div className="flex items-center gap-2 text-base">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span>
                      {[
                        selectedVolunteer.residence_state,
                        selectedVolunteer.residence_country,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Not specified"}
                    </span>
                  </div>
                </div>

                {/* Experience */}
                {selectedVolunteer.experience && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Experience
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap rounded-md bg-muted/50 p-3">
                      {selectedVolunteer.experience}
                    </p>
                  </div>
                )}

                {/* Skills */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedVolunteer.skills.map((skill) => (
                      <Badge
                        key={skill}
                        className="bg-diaspora-blue/10 text-diaspora-darkBlue border-diaspora-blue/20"
                      >
                        {getLabel(skill)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <span className="text-2xl font-bold">
                      {(
                        averageRatingsMap[selectedVolunteer.volunteer_id] ??
                        selectedVolunteer.average_rating
                      ).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">Average rating</p>
                </div>

                {/* Assign / Pending / Replace PM – only for volunteers with PM skill, already on project */}
                {(() => {
                  const state = getAssignPmButtonState(selectedVolunteer);
                  if (!state) return null;
                  if (state === "already_pm") {
                    return (
                      <div className="pt-4 border-t space-y-2">
                        <p className="text-sm text-muted-foreground">
                          This volunteer is a Project Manager.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-amber-600 text-amber-700 hover:bg-amber-50"
                          onClick={() =>
                            setRemovePmConfirmVolunteer(selectedVolunteer)
                          }
                          disabled={removePmLoading}
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove as PM
                        </Button>
                      </div>
                    );
                  }
                  if (state === "pending") {
                    return (
                      <div className="pt-4 border-t">
                        <Button
                          variant="outline"
                          disabled
                          className="w-full sm:w-auto"
                        >
                          Pending Request
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          A Project Manager role request has been sent. They can
                          accept or reject from their requests.
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto border-diaspora-darkBlue text-diaspora-darkBlue hover:bg-diaspora-blue/10"
                        onClick={() => setAssignPmVolunteer(selectedVolunteer)}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        {state === "replace"
                          ? "Replace Manager"
                          : "Assign as Project Manager"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        {state === "replace"
                          ? "When they accept, they will become a Project Manager (max 2 per project)."
                          : "They will be able to create milestones, deliverables, and invite other volunteers to the project."}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Assign / Replace PM */}
      <AlertDialog
        open={!!assignPmVolunteer}
        onOpenChange={(open) =>
          !open && !assignPmLoading && setAssignPmVolunteer(null)
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {assignPmVolunteer && isReplaceMode
                ? "Replace Manager"
                : "Assign as Project Manager"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Send a Project Manager role request to{" "}
              {assignPmVolunteer?.full_name}. They are already on the project;
              this only assigns the PM role. They can accept or reject from
              their requests. Once accepted, they can create milestones,
              deliverables, and invite other volunteers.
              {assignPmVolunteer && isReplaceMode && (
                <span className="block mt-2 text-amber-700 font-medium">
                  This project already has 2 PMs. When they accept, they will
                  take the second PM slot.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={assignPmLoading}>
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={handleAssignAsProjectManager}
              disabled={assignPmLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {assignPmLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Remove as PM */}
      <AlertDialog
        open={!!removePmConfirmVolunteer}
        onOpenChange={(open) =>
          !open && !removePmLoading && setRemovePmConfirmVolunteer(null)
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove as Project Manager?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              {removePmConfirmVolunteer?.full_name} as Project Manager? They
              will no longer be able to manage milestones and deliverables for
              this project. You can assign another volunteer as PM from the
              list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removePmLoading}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmRemovePm}
              disabled={removePmLoading}
            >
              {removePmLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove as PM"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rate Volunteer Modal */}
      <Dialog
        open={!!rateModalVolunteer}
        onOpenChange={() => !rateLoading && setRateModalVolunteer(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate {rateModalVolunteer?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium mb-2">Rating (required)</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRateValue(n)}
                    className="p-2 rounded-md border hover:bg-muted transition-colors"
                  >
                    <Star
                      className={`h-8 w-8 ${rateValue >= n ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {rateValue}/5 stars
              </p>
            </div>
            <div>
              <label htmlFor="rate-comment" className="text-sm font-medium">
                Comment (optional)
              </label>
              <Textarea
                id="rate-comment"
                placeholder="Share feedback about this volunteer..."
                value={rateComment}
                onChange={(e) => setRateComment(e.target.value)}
                rows={3}
                className="mt-1 resize-none"
                disabled={rateLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRateModalVolunteer(null)}
              disabled={rateLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={rateLoading || rateValue < 1}
              className="action-btn"
            >
              {rateLoading ? "Saving..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
