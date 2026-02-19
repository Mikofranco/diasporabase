"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Edit,
  Users,
  Calendar,
  Tag,
  MapPin,
  FileText,
  Building2,
} from "lucide-react";
import ProjectRecommendation from "@/parts/agency/projects/project-recommendation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import DocumentViewer from "@/components/document-viewer";
import { Dialog } from "@/components/ui/dialog";
import { RejectProjectDialog } from "@/components/dialogues/reject-project";
import { useSendMail } from "@/services/mail";
import { Profile } from "@/lib/types";
import { projectRejectedHtml } from "@/lib/email-templates/rejectProject";
import { projectApprovedHtml } from "@/lib/email-templates/approveProject";
import { truncate } from "fs";

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
  status: "active" | "pending" | "completed" | "cancelled";
  category: string;
  required_skills: string[];
  country: string;
  state: string;
  lga: string;
  created_at: string;
  updated_at: string;
  documents?: Array<{ title: string; url: string }>;
  organization?: Profile | null; // Assuming you join with profiles to get organization details
}

const ViewProject = () => {
  const { projectId } = useParams();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isApprovingProject, setIsApprovingProject] = useState(false)

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
      } catch (err: any) {
        setError(err.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, router]);

  const isAdmin = ["admin", "super_admin"].includes(userRole || "");

  const handleEditSection = (section: string) => {
    router.push(`/${userRole}/projects/${projectId}/edit?section=${section}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
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

  return (
    <div className="min-h-screen bg-gray-50/40 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {project.title}
            </h1>
            <div className="mt-2 flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                <span>{project.organization_name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag className="h-4 w-4" />
                <span className="capitalize">{project.category}</span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <Button
              onClick={() =>
                router.push(routes.superAdminEditProject(projectId as string))
              }
              className="action-btn"
            >
              Edit Project
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 1. Overview Card */}
          <div className="md:col-span-2 lg:col-span-3 bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-diaspora-darkBlue" />
                Project Overview
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {project.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* 2. Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Basic Information</h3>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span
                  className={cn(
                    "font-medium px-3 py-1 rounded-full text-xs",
                    project.status === "active"
                      ? "bg-green-100 text-green-800"
                      : project.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : project.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800",
                  )}
                >
                  {project.status.charAt(0).toUpperCase() +
                    project.status.slice(1)}
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

          {/* 3. Dates & Location */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Timeline & Location
              </h3>
            </div>
            <div className="p-6 space-y-4 text-sm">
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
                    {/* {locationForma(project.country, project.state, project.lga)} */}
                    {project.country}
                    {project.state && `, ${project.state}`}
                    {project.lga && `, ${project.lga}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Volunteers */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Volunteers</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <Users className="h-7 w-7 text-diaspora-darkBlue" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {project.volunteers_registered} /{" "}
                    {project.volunteers_needed}
                  </p>
                  <p className="text-gray-600">volunteers joined</p>
                </div>
              </div>

              <div className="mt-6 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (project.volunteers_registered /
                        project.volunteers_needed) *
                        100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* 5. Skills */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Required Skills</h3>
            </div>
            <div className="p-6">
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

          {/* 6. Documents (if exists) */}
          {project.documents && project.documents.length > 0 && (
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="px-6 py-5 border-b">
                <h3 className="font-semibold text-gray-900">
                  Supporting Documents
                </h3>
              </div>
              <div className="p-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {/* {project.documents.map((doc, index) => (
                    <a
                      key={index}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate group-hover:text-blue-600">
                          {doc.title}
                        </p>
                        <p className="text-xs text-gray-500">View document</p>
                      </div>

                      
                    </a>
                    
                  ))} */}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-10">
          <DocumentViewer documents={project.documents || []} />
        </div>

        {/* Recommendation section */}
        <div className="mt-10">
          <ProjectRecommendation
            projectId={projectId as string}
            volunteersNeeded={project.volunteers_needed}
            volunteersRegistered={project.volunteers_registered}
          />
        </div>
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-6xl flex items-center justify-end gap-3">
        <Button
          variant="outline"
          disabled={isApprovingProject}
          onClick={approveProject} // You can replace this with actual approve logic
          className="bg-green-600 text-white hover:text-white hover:bg-green-700"
        >
          {isApprovingProject ? "Approving...": "Approve Project"}
        </Button>
        <Button
          variant="destructive"
          onClick={() => setShowRejectDialog(true)}
          className="ml-3"
        >
          Reject Project
        </Button>
      </div>
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
