"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CardsSection from "./cardsSection";
import { RecentApplicationsTable } from "./table";
import { PendingAgenciesSection } from "./pending-agencies-section";
import { OverviewCharts } from "./overview-charts";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { supabase } from "@/lib/supabase/client";
import { Project } from "@/lib/types";
import { ViewProjectModal } from "./modals/view-project";
import { EditProjectModal } from "./modals/edit-project";
import { routes } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Building2, Users, FileCheck, ChevronRight } from "lucide-react";

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
  const pathname = usePathname();
  const isSuperAdmin = pathname?.startsWith("/super-admin");
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
          profiles!organization_id (
            contact_person_first_name,
            contact_person_last_name,
            contact_person_email
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        setProjects([]);
        return;
      }

      const formattedData = data.map((project: any) => ({
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
      }));

      setProjects(formattedData);
    } catch (err: any) {
      console.error("Caught error in fetchProjects:", err);
      setError(err.message || "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
    fetchProjects();
  };

  if (error) {
    return (
      <div className="space-y-4 p-4 sm:p-6 bg-white rounded-lg shadow-sm max-w-xl">
        <h3 className="text-xl sm:text-2xl font-bold text-red-600">Error Loading Dashboard</h3>
        <p className="text-sm sm:text-base text-muted-foreground">{error}</p>
        <button onClick={handleRefresh} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-[60vh] bg-muted/30 overflow-x-hidden">
      <div className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8 space-y-6 sm:space-y-7 lg:space-y-8">
        {/* Dashboard header */}
        <header className="border-b border-gray-200/80 pb-4 sm:pb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage projects, volunteers, and agencies.
          </p>
        </header>

        {/* Stats cards */}
        <section>
          <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 sm:mb-4">
            Overview
          </h2>
          <CardsSection />
        </section>

        {/* Platform overview charts + Quick links */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="lg:col-span-3 min-w-0">
            <OverviewCharts />
          </div>
          <Card className="border border-gray-200/80 shadow-sm min-w-0">
            <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-sm sm:text-base font-semibold">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0.5 px-4 sm:px-6 pb-4 sm:pb-6">
              <Link
                href={isSuperAdmin ? routes.superAdminProjects : routes.adminProjects}
                className="flex items-center justify-between rounded-lg px-3 py-3 sm:py-2.5 text-sm hover:bg-muted/50 transition-colors group min-h-[44px] sm:min-h-0"
              >
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  Projects
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href={isSuperAdmin ? routes.superAdminAgencies : routes.adminAgencies}
                className="flex items-center justify-between rounded-lg px-3 py-3 sm:py-2.5 text-sm hover:bg-muted/50 transition-colors group min-h-[44px] sm:min-h-0"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  Agencies
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href={isSuperAdmin ? routes.superAdminVolunteers : routes.adminVolunteers}
                className="flex items-center justify-between rounded-lg px-3 py-3 sm:py-2.5 text-sm hover:bg-muted/50 transition-colors group min-h-[44px] sm:min-h-0"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  Volunteers
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              {isSuperAdmin && (
                <Link
                  href={routes.superAdminUsers}
                  className="flex items-center justify-between rounded-lg px-3 py-3 sm:py-2.5 text-sm hover:bg-muted/50 transition-colors group min-h-[44px] sm:min-h-0"
                >
                  <span className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    Users
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Two tables side-by-side */}
        <section className="min-w-0">
          <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 sm:mb-4">
            Recent activity
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 min-w-0">
            <PendingAgenciesSection />
            <RecentApplicationsTable
              data={projects as Project[]}
              onEdit={handleEdit}
              onView={handleView}
              onRefresh={handleRefresh}
            />
          </div>
        </section>
      </div>

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