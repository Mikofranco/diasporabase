"use client";

import React, { useEffect, useState } from "react";
import CardsSection from "./cardsSection";
import { RecentApplicationsTable } from "./table";
import { supabase } from "@/lib/supabase/client";
import { Project } from "@/lib/types";
import { ViewProjectModal } from "./modals/view-project";
import { EditProjectModal } from "./modals/edit-project";
import { PendingAgenciesModal } from "@/components/modals/pending-agencies";

export interface AdminProjectProps {
  id: string;
  title: string;
  contact_person_first_name: string;
  contact_person_last_name: string;
  contact_person_email: string;
  status: string;
  category: string;
  start_date: string;
}

const AdminDashboard = () => {
  const [projects, setProjects] = useState<AdminProjectProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const fetchProjects = async () => {
    console.log("Fetching projects..."); // ← Should appear immediately

    try {
      setIsLoading(true);
      setError(null);

      const { data, error, status, statusText } = await supabase
        .from("projects")
        .select(
          `
          id,
          title,
          description,
          organization_name,
          location,
          start_date,
          end_date,
          status,
          category,
          created_at,
          profiles!organization_id (
            contact_person_first_name,
            contact_person_last_name,
            contact_person_email
          )
        `
        )
        .order("created_at", { ascending: false });

      // Enhanced logging
      console.log("Supabase response status:", status, statusText);
      console.log("Raw data from Supabase:", data);
      console.log("Supabase error (if any):", error);

      if (error) {
        console.error("Supabase threw an error:", error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.warn("No projects found. Is there data in the 'projects' table?");
        setProjects([]);
        return;
      }

      const formattedData = data.map((project: any) => {
        console.log("Processing project:", project); // See each project

        return {
          id: project.id,
          title: project.title || "No Title",
          description: project.description || "",
          organization_name: project.organization_name || "Unknown",
          location: project.location || "",
          start_date: project.start_date || "",
          status: project.status || "pending",
          category: project.category || "General",
          contact_person_first_name:
            project.profiles?.contact_person_first_name || "N/A",
          contact_person_last_name:
            project.profiles?.contact_person_last_name || "N/A",
          contact_person_email:
            project.profiles?.contact_person_email || "N/A",
        };
      });

      console.log("Final formatted projects:", formattedData);
      setProjects(formattedData);
    } catch (err: any) {
      console.error("Caught error in fetchProjects:", err);
      setError(err.message || "Failed to load projects");
    } finally {
      setIsLoading(false);
      console.log("fetchProjects completed. isLoading:", false);
    }
  };

  useEffect(() => {
    console.log("AdminDashboard mounted – calling fetchProjects");
    fetchProjects();
  }, []);

  // Rest of your handlers...
  const handleView = (project: Project) => {
    setSelectedProject(project);
    setViewOpen(true);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setEditOpen(true);
  };

  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    fetchProjects();
  };

  if (error) {
    return (
      <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm">
        <h3 className="text-2xl font-bold text-red-600">Error Loading Dashboard</h3>
        <p>{error}</p>
        <button onClick={handleRefresh} className="px-4 py-2 bg-blue-600 text-white rounded">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm">
      <div className="text-center">
        <h3 className="text-2xl font-bold">Welcome to Admin Dashboard</h3>
        <p className="text-sm text-muted-foreground">
          Manage projects, volunteers, and agencies.
        </p>
      </div>

      <CardsSection />

      <div>
        <p className="text-sm text-gray-500 mb-2">
          Total projects loaded: {projects.length} {isLoading && "(loading...)"}
        </p>
        <RecentApplicationsTable //@ts-ignore
          data={projects}
          onEdit={handleEdit}
          onView={handleView}
          onRefresh={handleRefresh}
        />
      </div>
      <PendingAgenciesModal/>

      <ViewProjectModal project={selectedProject} open={viewOpen} onOpenChange={setViewOpen} />
      <EditProjectModal
        project={selectedProject}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default AdminDashboard;