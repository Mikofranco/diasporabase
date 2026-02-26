"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { routes } from "@/lib/routes";
import { RejectProjectDialog } from "@/components/dialogues/reject-project";
import { useSendMail } from "@/services/mail";
import { toast } from "sonner";
import { projectRejectedHtml } from "@/lib/email-templates/rejectProject";
import { projectApprovedHtml } from "@/lib/email-templates/approveProject";
import { getProjectStatusStyle } from "../filters";
import { logSystemEvent } from "@/lib/system-log";
import {
  type Project,
  type RejectionReasonRow,
  type VolunteerRow,
  type MilestoneRow,
  type MilestoneDeliverableRow,
  type MilestoneWithDeliverables,
} from "./types";
import { MAX_REJECTIONS, THIRD_REJECTION_CANCEL_REASON } from "./constants";
import { ViewProjectSkeleton } from "./ViewProjectSkeleton";
import { EditSkillsModal } from "./EditSkillsModal";
import { CancelProjectDialog } from "./CancelProjectDialog";
import {
  ViewProjectHeader,
  ProjectOverviewSection,
  BasicInfoSection,
  TimelineLocationSection,
  VolunteersSection,
  RequiredSkillsSection,
  MilestonesSection,
  RejectionReasonsSection,
  CancellationSection,
  SupportingDocumentsSection,
  ProjectActionBar,
} from "./sections";

const ViewProject = () => {
  const { projectId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAgencyId = searchParams.get("from_agency");

  const [project, setProject] = useState<Project | null>(null);
  const [fromAgency, setFromAgency] = useState<{ name: string; listHref: string; viewHref: string } | null>(null);
  const [volunteers, setVolunteers] = useState<VolunteerRow[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isApprovingProject, setIsApprovingProject] = useState(false);
  const [isCancellingProject, setIsCancellingProject] = useState(false);
  const [showEditSkillsModal, setShowEditSkillsModal] = useState(false);
  const [editingSkills, setEditingSkills] = useState<string[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState<RejectionReasonRow[]>([]);
  const [milestones, setMilestones] = useState<MilestoneWithDeliverables[]>([]);
  const [cancelledByName, setCancelledByName] = useState<string | null>(null);
  const [approvedByName, setApprovedByName] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push(routes.login);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setUserId(user.id);
        setUserRole(profile?.role || null);

        if (fromAgencyId && (profile?.role === "admin" || profile?.role === "super_admin")) {
          try {
            const { data: agencyProfile } = await supabase
              .from("profiles")
              .select("organization_name")
              .eq("id", fromAgencyId)
              .eq("role", "agency")
              .single();
            const name = agencyProfile?.organization_name?.trim() || "Agency";
            const listHref =
              profile?.role === "super_admin" ? routes.superAdminAgencies : routes.adminAgencies;
            const viewHref =
              profile?.role === "super_admin"
                ? routes.superAdminViewAgency(fromAgencyId)
                : routes.adminViewAgency(fromAgencyId);
            setFromAgency({ name, listHref, viewHref });
          } catch {
            setFromAgency(null);
          }
        } else {
          setFromAgency(null);
        }

        const { data: projectData, error: projectErr } = await supabase
          .from("projects")
          .select(
            `
            *,
            organization:organization_id (
              email,
              contact_person_phone,
              contact_person_email,
              contact_person_first_name,
              contact_person_last_name
            )
          `
          )
          .eq("id", projectId as string)
          .single();

        if (projectErr) throw projectErr;
        if (!projectData) throw new Error("Project not found");

        setProject(projectData);

        const cancelledBy = (projectData as Project).cancelled_by;
        if (cancelledBy) {
          const { data: cancelProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", cancelledBy)
            .single();
          setCancelledByName(cancelProfile?.full_name?.trim() || "Unknown");
        } else {
          setCancelledByName(null);
        }

        const approvedBy = (projectData as Project).approved_by;
        if (approvedBy) {
          const { data: approveProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", approvedBy)
            .single();
          setApprovedByName(approveProfile?.full_name?.trim() || "Unknown");
        } else {
          setApprovedByName(null);
        }

        const { data: reasonsData } = await supabase
          .from("rejection_reasons")
          .select("id, reason_text, internal_note, created_at, rejected_by")
          .eq("project_id", projectId as string)
          .order("created_at", { ascending: false });

        const reasons = (reasonsData ?? []) as (RejectionReasonRow & {
          rejected_by?: string | null;
        })[];
        const rejectedByIds = [
          ...new Set(reasons.map((r) => r.rejected_by).filter(Boolean)),
        ] as string[];
        let rejectedByNameMap: Record<string, string> = {};
        if (rejectedByIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", rejectedByIds);
          if (profilesData?.length) {
            rejectedByNameMap = profilesData.reduce(
              (
                acc: Record<string, string>,
                p: { id: string; full_name?: string | null }
              ) => {
                acc[p.id] = p.full_name?.trim() || "Unknown";
                return acc;
              },
              {}
            );
          }
        }
        setRejectionReasons(
          reasons.map((r) => ({
            ...r,
            rejected_by_name: r.rejected_by
              ? rejectedByNameMap[r.rejected_by] ?? "Unknown"
              : null,
          }))
        );

        try {
          const res = await fetch(`/api/admin/projects/${projectId}/volunteers`);
          if (res.ok) {
            const { volunteers: list } = await res.json();
            setVolunteers(Array.isArray(list) ? list : []);
          } else {
            setVolunteers([]);
          }
        } catch {
          setVolunteers([]);
        }

        const { data: milesData } = await supabase
          .from("milestones")
          .select("id, title, description, due_date, status, project_id")
          .eq("project_id", projectId as string)
          .order("due_date");

        if (milesData?.length) {
          const milestoneIds = (milesData as MilestoneRow[]).map((m) => m.id);
          const { data: delsData } = await supabase
            .from("deliverables")
            .select("id, title, description, due_date, status, milestone_id")
            .in("milestone_id", milestoneIds)
            .order("due_date");

          const delsByMilestone = (delsData || []).reduce(
            (
              acc: Record<string, MilestoneDeliverableRow[]>,
              d: MilestoneDeliverableRow
            ) => {
              const mid = d.milestone_id;
              if (!acc[mid]) acc[mid] = [];
              acc[mid].push(d);
              return acc;
            },
            {}
          );

          setMilestones(
            (milesData as MilestoneRow[]).map((m) => ({
              ...m,
              deliverables: delsByMilestone[m.id] || [],
            })) as MilestoneWithDeliverables[]
          );
        } else {
          setMilestones([]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, router, fromAgencyId]);

  const isAdmin = ["admin", "super_admin"].includes(userRole || "");

  if (loading) {
    return <ViewProjectSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Project not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const confirmReject = async (reason: string, internalNote?: string) => {
    try {
      const { count: existingCount } = await supabase
        .from("rejection_reasons")
        .select("id", { count: "exact", head: true })
        .eq("project_id", project.id);

      const currentRejections = existingCount ?? 0;
      if (currentRejections >= MAX_REJECTIONS) {
        throw new Error(
          "This project has already been rejected the maximum of 3 times and cannot be rejected again."
        );
      }

      const { error: insertErr } = await supabase
        .from("rejection_reasons")
        .insert({
          project_id: project.id,
          rejected_by: userId,
          reason_text: reason,
          internal_note: internalNote,
          organization_id: project.organization_id,
        });

      if (insertErr) throw insertErr;

      const isThirdRejection = currentRejections + 1 === MAX_REJECTIONS;
      const now = new Date().toISOString();

      if (isThirdRejection) {
        const { error: updateErr } = await supabase
          .from("projects")
          .update({
            status: "cancelled",
            cancelled_reason: THIRD_REJECTION_CANCEL_REASON,
            cancelled_at: now,
            cancelled_by: userId,
            updated_at: now,
          })
          .eq("id", project.id);

        if (updateErr) throw updateErr;
        setProject((prev) =>
          prev
            ? {
                ...prev,
                status: "cancelled",
                cancelled_reason: THIRD_REJECTION_CANCEL_REASON,
                cancelled_at: now,
                cancelled_by: userId,
              }
            : null
        );
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();
        setCancelledByName(profile?.full_name?.trim() || "Unknown");
      } else {
        await supabase
          .from("projects")
          .update({ status: "rejected", updated_at: now })
          .eq("id", project.id);
        setProject((prev) =>
          prev ? { ...prev, status: "rejected" } : null
        );
      }

      await useSendMail({
        to:
          project.organization?.contact_person_email ||
          project.organization?.email ||
          "",
        subject: `Update on Your Project: ${project.title}`,
        html: projectRejectedHtml(
          project.organization?.contact_person_first_name || "there",
          project.title,
          reason
        ),
      });

      await logSystemEvent(supabase, {
        action: "project_rejected",
        entity_type: "project",
        entity_id: project.id,
        details: { title: project.title, reason },
      });

      router.refresh();
      return { isThirdRejection };
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to reject project");
    }
  };

  const approveProject = async () => {
    setIsApprovingProject(true);
    try {
      const now = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from("projects")
        .update({ status: "active", updated_at: now, approved_by: userId })
        .eq("id", project.id);

      if (updateErr) throw updateErr;
      setProject((prev) =>
        prev
          ? { ...prev, status: "active", updated_at: now, approved_by: userId }
          : null
      );
      await logSystemEvent(supabase, {
        action: "project_approved",
        entity_type: "project",
        entity_id: project.id,
        details: { title: project.title },
      });
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();
      setApprovedByName(profile?.full_name?.trim() || "Unknown");

      await useSendMail({
        to:
          project.organization?.contact_person_email ||
          project.organization?.email ||
          "",
        subject: `Your Project Has Been Approved!`,
        html: projectApprovedHtml(
          project.organization?.contact_person_first_name || "there",
          project.title,
          `${window.location.origin}/agency/projects/${projectId}`
        ),
      });

      router.refresh();
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsApprovingProject(false);
    }
  };

  const cancelProject = async (reason: string) => {
    const trimmed = reason?.trim() || "";
    if (!trimmed) return;
    setIsCancellingProject(true);
    try {
      const now = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from("projects")
        .update({
          status: "cancelled",
          cancelled_reason: trimmed,
          cancelled_at: now,
          cancelled_by: userId,
          updated_at: now,
        })
        .eq("id", project.id);

      if (updateErr) throw updateErr;
      setProject((prev) =>
        prev
          ? {
              ...prev,
              status: "cancelled",
              cancelled_reason: trimmed,
              cancelled_at: now,
              cancelled_by: userId,
            }
          : null
      );
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();
      setCancelledByName(profile?.full_name?.trim() || "Unknown");
      setShowCancelDialog(false);
      setCancelReason("");
      toast.success("Project cancelled successfully");
      router.refresh();
    } catch (err: unknown) {
      console.error("Failed to cancel project:", err);
    } finally {
      setIsCancellingProject(false);
    }
  };

  const handleSaveSkills = async () => {
    setSavingSkills(true);
    try {
      const { error: updateErr } = await supabase
        .from("projects")
        .update({
          required_skills: editingSkills,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id);

      if (updateErr) throw updateErr;
      setProject((prev) =>
        prev ? { ...prev, required_skills: editingSkills } : null
      );
      setShowEditSkillsModal(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to update skills:", err);
    } finally {
      setSavingSkills(false);
    }
  };

  const statusStyle = getProjectStatusStyle(project.status);
  const projectsHref =
    userRole === "super_admin" ? routes.superAdminProjects : routes.adminProjects;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="container mx-auto px-3 sm:px-4 lg:px-5 py-6 max-w-6xl space-y-6">
        <ViewProjectHeader
          project={project}
          projectsHref={projectsHref}
          fromAgency={fromAgency}
        />

        <div className="space-y-5">
          <ProjectOverviewSection project={project} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <BasicInfoSection
              project={project}
              statusStyle={statusStyle}
              approvedByName={approvedByName}
            />
            <TimelineLocationSection project={project} />
          </div>

          <VolunteersSection project={project} volunteers={volunteers} userRole={userRole} />

          <RequiredSkillsSection
            project={project}
            isAdmin={isAdmin}
            onEditClick={() => {
              setEditingSkills([...(project.required_skills || [])]);
              setShowEditSkillsModal(true);
            }}
          />

          <MilestonesSection milestones={milestones} />
          <RejectionReasonsSection rejectionReasons={rejectionReasons} />
          <CancellationSection
            project={project}
            cancelledByName={cancelledByName}
          />
          <SupportingDocumentsSection project={project} />
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 lg:px-5 max-w-6xl">
        <ProjectActionBar
          status={project.status}
          isApprovingProject={isApprovingProject}
          isCancellingProject={isCancellingProject}
          onApprove={approveProject}
          onReject={() => setShowRejectDialog(true)}
          onCancel={() => setShowCancelDialog(true)}
        />
      </div>

      <EditSkillsModal
        open={showEditSkillsModal}
        onOpenChange={setShowEditSkillsModal}
        editingSkills={editingSkills}
        onEditingSkillsChange={setEditingSkills}
        onSave={handleSaveSkills}
        saving={savingSkills}
      />

      <RejectProjectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        projectTitle={project.title}
        projectId={project.id}
        onConfirmReject={confirmReject}
      />

      <CancelProjectDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        cancelReason={cancelReason}
        onCancelReasonChange={setCancelReason}
        onConfirm={() => cancelProject(cancelReason)}
        isCancelling={isCancellingProject}
      />
    </div>
  );
};

export default ViewProject;
