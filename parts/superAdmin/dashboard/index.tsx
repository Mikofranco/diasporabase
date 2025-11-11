"use client";

import React, { useEffect, useState } from "react";
import CardsSection from "./cardsSection";
import { RecentApplicationsTable } from "./table";
import { supabase } from "@/lib/supabase/client";
import { Project } from "@/lib/types";
import { ViewProjectModal } from "./modals/view-project";
import { EditProjectModal } from "./modals/edit-project";

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
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
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
          profiles:organization_id (
            contact_person_first_name,
            contact_person_last_name,
            contact_person_email
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch projects: ${error.message}`);
      }

      // Flatten profiles data to match Project type
      const formattedData =
        data?.map((project: any) => ({
          id: project.id,
          title: project.title,
          contact_person_first_name:
            project.profiles?.contact_person_first_name || "",
          contact_person_last_name:
            project.profiles?.contact_person_last_name || "",
          contact_person_email: project.profiles?.contact_person_email || "",
          status: project.status,
          category: project.category,
          start_date: project.start_date,
        })) || [];

      setProjects(formattedData);
      console.log("Fetched projects:", formattedData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      console.error("Error fetching projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleView = (project: Project) => {
    setSelectedProject(project);
    setViewOpen(true);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setEditOpen(true);
  };

  const handleRefresh = () => {
    fetchProjects();
  };
  if (error) {
    return (
      <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight text-red-600">
            Error Loading Dashboard
          </h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-2xl font-bold tracking-tight">
          Welcome to Admin Dashboard
        </h3>
        <p className="text-sm text-muted-foreground">
          Manage projects, volunteers, and agencies.
        </p>
      </div>
      <CardsSection />
      <RecentApplicationsTable
        data={isLoading ? [] : projects}
        onEdit={handleEdit}
        onView={handleView}
        onRefresh={handleRefresh}
      />

      {/* Modals */}
      <ViewProjectModal
        project={selectedProject}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />

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
