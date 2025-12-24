"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { formatLocation, getUserId } from "@/lib/utils"; // Assuming this returns { data: userId }
import BackButton from "@/components/back-button";

const supabase = createClient();

interface Project {
  id: string;
  title: string;
  description: string;
  organization_name: string;
  start_date: string;
  end_date: string;
  status: string;
  volunteers_registered: number;
  volunteers_needed: number;
  category: string;
  country: string;
  state?: string | null;
  lga?: string | null; // Local Government Area
  project_manager_id: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  status: string;
}

interface Deliverable {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  status: string;
  milestone_id?: string;
}

export default function ProjectManagementScreen() {
  const { id: projectId } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert country code to full name
  const getCountryName = (code: string): string => {
    if (!code || code.length !== 2) return code;
    try {
      return (
        new Intl.DisplayNames(["en"], { type: "region" }).of(
          code.toUpperCase()
        ) || code
      );
    } catch {
      return code;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "in progress":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "completed":
      case "done":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const getVolunteerProgress = () => {
    if (!project?.volunteers_needed || project.volunteers_needed === 0)
      return 0;
    return Math.round(
      (project.volunteers_registered / project.volunteers_needed) * 100
    );
  };

  useEffect(() => {
    if (!projectId) {
      setError("Invalid project ID");
      setLoading(false);
      return;
    }

    const fetchProjectData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get current user
        const userResult = await getUserId();
        if (!userResult.data) {
          toast.error("You must be logged in to manage projects");
          setError("Authentication required");
          return;
        }

        const userId = userResult.data;

        // Fetch project
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select(
            `
            id, title, description, organization_name,
            start_date, end_date, status,
            volunteers_registered, volunteers_needed,
            category, country, state, lga,
            project_manager_id
          `
          )
          .eq("id", projectId)
          .single();

        if (projectError) throw projectError;
        if (!projectData) throw new Error("Project not found");

        // Authorization check
        if (projectData.project_manager_id !== userId) {
          throw new Error(
            "You are not the assigned project manager for this project"
          );
        }

        setProject(projectData);

        // Fetch milestones
        const { data: milestoneData } = await supabase
          .from("milestones")
          .select("id, title, description, due_date, status")
          .eq("project_id", projectId)
          .order("due_date", { ascending: true });

        // Fetch deliverables
        const { data: deliverableData } = await supabase
          .from("deliverables")
          .select("id, title, description, due_date, status, milestone_id")
          .eq("project_id", projectId)
          .order("due_date", { ascending: true });

        setMilestones(milestoneData || []);
        setDeliverables(deliverableData || []);
      } catch (err: any) {
        const message = err.message || "Failed to load project data";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl space-y-8">
        <Skeleton className="h-10 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-red-200">
          <CardContent className="flex flex-col items-center text-center py-16">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 max-w-md">
              {error ||
                "Project not found or you don't have permission to manage it."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white shadow-md rounded-lg space-y-8">
      {/* Header */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {project.title}
          </h1>
          <BackButton/>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>{project.organization_name}</span>
          </div>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
          <span className="text-sm">• You are the Project Manager</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Volunteers</p>
                <p className="text-3xl font-bold">
                  {project.volunteers_registered}
                  {project.volunteers_needed > 0 && (
                    <span className="text-lg text-muted-foreground">
                      {" "}
                      / {project.volunteers_needed}
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {getVolunteerProgress()}% filled
                </p>
              </div>
              <Users className="h-12 w-12 text-[#0284C7]" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-[#0284C7] h-3 rounded-full transition-all duration-500"
                style={{ width: `${getVolunteerProgress()}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="text-2xl font-semibold">
                {format(new Date(project.start_date), "MMM d, yyyy")}
              </p>
            </div>
            <Calendar className="h-12 w-12 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="text-2xl font-semibold">
                {format(new Date(project.end_date), "MMM d, yyyy")}
              </p>
            </div>
            <Clock className="h-12 w-12 text-orange-600" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">
            Milestones ({milestones.length})
          </TabsTrigger>
          <TabsTrigger value="deliverables">
            Deliverables ({deliverables.length})
          </TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab project={project} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <MilestonesTab
            milestones={milestones}
            setMilestones={setMilestones}
            projectId={projectId}
            getStatusColor={getStatusColor}
          />
        </TabsContent>

        <TabsContent value="deliverables" className="mt-6">
          <DeliverablesTab
            deliverables={deliverables}
            setDeliverables={setDeliverables}
            milestones={milestones}
            projectId={projectId}
            getStatusColor={getStatusColor}
          />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <TeamTab project={project} projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface OverviewTabProps {
  project: Project;
}

function OverviewTab({ project }: OverviewTabProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {project.description || "No description provided."}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{formatLocation(project)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {project.category}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

interface MilestonesTabProps {
  milestones: Milestone[];
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
  projectId: string;
  getStatusColor: (status: string) => string;
}

function MilestonesTab({
  milestones,
  setMilestones,
  projectId,
  getStatusColor,
}: MilestonesTabProps) {
  // TODO: Add form for adding/editing milestones here
  // For example, use a dialog or form component to create/edit milestones
  // On submit, use supabase to insert/update in "milestones" table and update state

  if (milestones.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <p className="text-gray-500 text-lg">No milestones defined yet.</p>
          {/* Add button to create new milestone */}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add button to create new milestone */}
      {milestones.map((milestone) => (
        <Card key={milestone.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{milestone.title}</CardTitle>
                {milestone.description && (
                  <CardDescription className="mt-2">
                    {milestone.description}
                  </CardDescription>
                )}
              </div>
              <Badge className={getStatusColor(milestone.status)}>
                {milestone.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Due: {format(new Date(milestone.due_date), "MMMM d, yyyy")}
            </div>
            {/* Add edit button for this milestone */}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface DeliverablesTabProps {
  deliverables: Deliverable[];
  setDeliverables: React.Dispatch<React.SetStateAction<Deliverable[]>>;
  milestones: Milestone[];
  projectId: string;
  getStatusColor: (status: string) => string;
}

function DeliverablesTab({
  deliverables,
  setDeliverables,
  milestones,
  projectId,
  getStatusColor,
}: DeliverablesTabProps) {
  // TODO: Add form for adding/editing deliverables here
  // Allow associating with a milestone_id from milestones list
  // On submit, use supabase to insert/update in "deliverables" table and update state

  if (deliverables.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <p className="text-gray-500 text-lg">No deliverables defined yet.</p>
          {/* Add button to create new deliverable */}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Add button to create new deliverable */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead> {/* For edit */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliverables.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.title}</TableCell>
                <TableCell>
                  {format(new Date(d.due_date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(d.status)}>{d.status}</Badge>
                </TableCell>
                <TableCell>
                  {/* Add edit button for this deliverable */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface TeamTabProps {
  project: Project;
  projectId: string;
}

function TeamTab({ project, projectId }: TeamTabProps) {
  // TODO: Fetch and display volunteers from "project_volunteers" and "profiles" tables
  // Add features like approve/reject requests from "volunteer_requests" or "agency_requests"
  // Track hours from "volunteer_hours", add messaging, etc.

  return (
    <Card>
      <CardContent className="py-16 text-center">
        <Users className="h-20 w-20 text-gray-400 mx-auto mb-6" />
        <h3 className="text-2xl font-semibold mb-3">
          {project.volunteers_registered} Volunteer
          {project.volunteers_registered !== 1 ? "s" : ""} Registered
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          View volunteer profiles, approve requests, track hours, and
          communicate with your team.
        </p>
        {/* Future: Add volunteer list, requests, messaging */}
      </CardContent>
    </Card>
  );
}
