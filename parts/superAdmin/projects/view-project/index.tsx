"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Users,
  Calendar,
  Tag,
  MapPin,
  FileText,
  Building2,
  Mail,
  User,
  Pencil,
  X,
} from "lucide-react";
// import ProjectRecommendation from "@/parts/agency/projects/project-recommendation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import DocumentViewer from "@/components/document-viewer";
import { RejectProjectDialog } from "@/components/dialogues/reject-project";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSendMail } from "@/services/mail";
import { CheckboxReactHookFormMultiple } from "@/components/renderedItems";
import { expertiseData } from "@/data/expertise";
import { Profile } from "@/lib/types";
import { projectRejectedHtml } from "@/lib/email-templates/rejectProject";
import { projectApprovedHtml } from "@/lib/email-templates/approveProject";
import { getProjectStatusStyle } from "../filters";

// You can expand this type based on your full projects table schema
interface Project {
  id: string;
  title: string;
  description: string;
  organization_id: string;
  organization_name: string;
  location: { country: string; state: string; lga: string } | null;
  start_date: string;
  end_date: string;
  volunteers_registered: number;
  volunteers_needed: number;
  status: string;
  category: string;
  required_skills: string[];
  country: string;
  state: string;
  lga: string;
  created_at: string;
  updated_at: string;
  documents?: Array<{ title: string; url: string }>;
  organization?: Profile | null;
}

interface VolunteerRow {
  id: string;
  full_name: string;
  email: string;
  joined_at: string;
}

const ViewProject = () => {
  const { projectId } = useParams();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [volunteers, setVolunteers] = useState<VolunteerRow[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isApprovingProject, setIsApprovingProject] = useState(false);
  const [showEditSkillsModal, setShowEditSkillsModal] = useState(false);
  const [editingSkills, setEditingSkills] = useState<string[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);

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

        // Get user role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setUserId(user.id);
        setUserRole(profile?.role || null);

        // Get project
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
  `,
          )
          .eq("id", projectId as string)
          .single();

        if (projectErr) throw projectErr;
        if (!projectData) throw new Error("Project not found");

        setProject(projectData);

        // Volunteers: fetch via API so profiles are read server-side with service role
        // (project_volunteers -> volunteer_id, then profiles by id)
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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, router]);

  const isAdmin = ["admin", "super_admin"].includes(userRole || "");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl space-y-6">
          {/* Breadcrumb skeleton */}
          <nav className="flex items-center gap-2 text-sm">
            <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
            <span className="text-gray-300">/</span>
            <div className="h-4 w-48 rounded bg-gray-200 animate-pulse" />
          </nav>

          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="h-8 w-3/4 max-w-md rounded bg-gray-200 animate-pulse" />
              <div className="flex gap-4">
                <div className="h-4 w-40 rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-28 rounded bg-gray-100 animate-pulse" />
              </div>
            </div>
            <div className="h-10 w-28 rounded-xl bg-gray-200 animate-pulse shrink-0" />
          </div>

          <div className="space-y-5">
            {/* Overview card skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-gray-200 animate-pulse" />
                <div className="h-5 w-40 rounded bg-gray-200 animate-pulse" />
              </div>
              <div className="p-5 space-y-2">
                <div className="h-3 w-full rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-full rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-5/6 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
              </div>
            </div>

            {/* Basic Info + Timeline skeletons - side by side on lg */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="h-4 w-36 rounded bg-gray-200 animate-pulse" />
                </div>
                <div className="p-5 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
                      <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex gap-3">
                    <div className="h-5 w-5 rounded bg-gray-100 animate-pulse shrink-0" />
                    <div className="space-y-1 flex-1">
                      <div className="h-4 w-48 rounded bg-gray-100 animate-pulse" />
                      <div className="h-3 w-12 rounded bg-gray-100 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-5 w-5 rounded bg-gray-100 animate-pulse shrink-0" />
                    <div className="h-4 w-36 rounded bg-gray-100 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Volunteers card skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
                <div className="h-4 w-12 rounded bg-gray-100 animate-pulse" />
              </div>
              <div className="p-5 space-y-4">
                <div className="h-2 w-full rounded-full bg-gray-100 animate-pulse" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-32 rounded bg-gray-200 animate-pulse" />
                        <div className="h-3 w-40 rounded bg-gray-100 animate-pulse" />
                      </div>
                      <div className="h-3 w-16 rounded bg-gray-100 animate-pulse shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Required Skills skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
              </div>
              <div className="p-5 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-6 rounded-full bg-gray-100 animate-pulse"
                    style={{ width: `${60 + (i % 3) * 24}px` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom actions skeleton */}
          <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="h-10 w-32 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-10 w-28 rounded-lg bg-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
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
    console.log(
      "Rejecting project:",
      project,
      "Reason:",
      reason,
      "Internal Note:",
      internalNote,
    );
    try {
      const { error } = await supabase.from("rejection_reasons").insert({
        project_id: project.id,
        rejected_by: userId,
        reason_text: reason,
        internal_note: internalNote,
        organization_id: project.organization_id,
      });

      if (error) throw error;

      await supabase
        .from("projects")
        .update({ status: "rejected" })
        .eq("id", project.id);

      await useSendMail({
        to:
          project.organization?.contact_person_email ||
          project.organization?.email ||
          "",
        subject: `Update on Your Project: ${project.title}`,
        html: projectRejectedHtml(
          project.organization?.contact_person_first_name || "there",
          project.title,
          reason,
        ),
      });

      router.refresh();
    } catch (err: any) {
      console.error(err.message || "Failed to reject project");
    }
  };

  const approveProject = async () => {
    setIsApprovingProject(true)
    try {
      await supabase
        .from("projects")
        .update({ status: "active" })
        .eq("id", project.id);

      await useSendMail({
        to:
          project.organization?.contact_person_email ||
          project.organization?.email ||
          "",

        subject: `Your Project Has Been Approved!`,
        html: projectApprovedHtml(
          project.organization?.contact_person_first_name || "there",
          project.title,
          `${window.location.origin}/agency/projects/${projectId}`,
        ),
      });

      router.refresh();
      setIsApprovingProject(false)
    } catch (err: any) {
      console.log(err);
      setIsApprovingProject(false)
    }
  };

  const handleSaveSkills = async () => {
    setSavingSkills(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          required_skills: editingSkills,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id);

      if (error) throw error;
      setProject((prev) => prev ? { ...prev, required_skills: editingSkills } : null);
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={projectsHref}>Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground truncate max-w-[200px] sm:max-w-md">
                {project.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header - admin cannot edit agency-provided content */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {project.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 shrink-0 text-gray-500" />
                <span>{project.organization_name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag className="h-4 w-4 shrink-0 text-gray-500" />
                <span className="capitalize">{project.category}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* 1. Overview Card - full width */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-diaspora-blue" />
              <h2 className="text-lg font-semibold text-gray-900">
                Project Overview
              </h2>
            </div>
            <div className="p-5">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                {project.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* 2 & 3. Basic Info + Timeline & Location - side by side on lg */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Basic Information</h3>
              </div>
              <div className="p-5 space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span
                    className={cn(
                      "font-medium px-2.5 py-1 rounded-lg text-xs border",
                      statusStyle.className,
                    )}
                  >
                    {statusStyle.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium">{project.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">
                  Timeline & Location
                </h3>
              </div>
              <div className="p-5 space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">
                      {new Date(project.start_date).toLocaleDateString()} —{" "}
                      {new Date(project.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(project.end_date) < new Date()
                        ? "Ended"
                        : "Ongoing"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {project.country}
                      {project.state && `, ${project.state}`}
                      {project.lga && `, ${project.lga}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Volunteers - full width, stands alone */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Volunteers</h3>
              <span className="text-sm font-medium text-gray-600">
                {project.volunteers_registered} / {project.volunteers_needed}
              </span>
            </div>
            <div className="p-5">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-diaspora-blue transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(
                      project.volunteers_needed
                        ? (project.volunteers_registered / project.volunteers_needed) * 100
                        : 0,
                      100,
                    )}%`,
                  }}
                />
              </div>
              {volunteers.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No volunteers joined yet
                </p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {volunteers.map((vol) => (
                    <li
                      key={vol.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50/80 border border-gray-100"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-diaspora-blue/10 text-diaspora-blue">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {vol.full_name}
                        </p>
                        {vol.email && (
                          <p className="flex items-center gap-1 text-xs text-gray-500 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            {vol.email}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(vol.joined_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 5. Required Skills - full width; admin can edit only this via modal */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Required Skills</h3>
              {isAdmin && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-gray-500 hover:text-diaspora-blue hover:bg-diaspora-blue/5"
                  onClick={() => {
                    setEditingSkills([...(project.required_skills || [])]);
                    setShowEditSkillsModal(true);
                  }}
                  aria-label="Edit required skills"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="p-5">
              {project.required_skills?.length ? (
                <div className="flex flex-wrap gap-2">
                  {project.required_skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full border border-gray-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  No specific skills required
                </p>
              )}
            </div>
          </div>

          {/* 6. Supporting Documents - same block style as other sections */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-diaspora-blue" />
              <h3 className="font-semibold text-gray-900">Supporting Documents</h3>
            </div>
            <div className="p-5">
              <DocumentViewer
                documents={(project.documents || []).map((d) => ({
                  url: d.url,
                  name: d.title,
                }))}
                title=""
                emptyMessage="No documents uploaded yet."
                className="shadow-none border-0 p-0 bg-transparent min-h-0"
              />
            </div>
          </div>
        </div>

        {/* Recommendation section - commented out */}
        {/* <div className="mt-10">
          <ProjectRecommendation
            projectId={projectId as string}
            volunteersNeeded={project.volunteers_needed}
            volunteersRegistered={project.volunteers_registered}
          />
        </div> */}
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <Button
            disabled={isApprovingProject}
            onClick={approveProject}
            className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isApprovingProject ? "Approving…" : "Approve Project"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowRejectDialog(true)}
            className="rounded-lg"
          >
            Reject Project
          </Button>
        </div>
      </div>
      <Dialog open={showEditSkillsModal} onOpenChange={setShowEditSkillsModal}>
        <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] rounded-xl flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>Edit required skills</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 px-6 pb-3 shrink-0">
            Select skills from the category list below. Only admins can edit this section.
          </p>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
            {showEditSkillsModal && (
              <CheckboxReactHookFormMultiple
                key="edit-skills-modal"
                items={expertiseData}
                initialValues={editingSkills}
                onChange={(selected: string[]) => setEditingSkills(selected)}
              />
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0 px-6 py-4 border-t border-gray-100 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditSkillsModal(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveSkills}
              disabled={savingSkills}
              className="rounded-lg bg-diaspora-blue hover:bg-diaspora-blue/90"
            >
              {savingSkills ? "Saving…" : "Save skills"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RejectProjectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        projectTitle={project.title}
        projectId={project.id}
        onConfirmReject={confirmReject}
      />
    </div>
  );
};

export default ViewProject;
