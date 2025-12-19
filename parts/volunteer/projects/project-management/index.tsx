"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

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
  lga?: string | null;
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

interface ProjectManagementScreenProps {
  userId: string | null;      // The volunteer/project manager's user ID
  projectId: string;   // The specific project to manage
}

export default function ProjectManagementScreen({ userId, projectId }: ProjectManagementScreenProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !projectId) return;

    const fetchProjectData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch project details and verify user is the project manager
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (projectError) throw projectError;
        if (!projectData) throw new Error("Project not found");
        if (projectData.project_manager_id !== userId) {
          throw new Error("You are not assigned as the manager of this project");
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
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [userId, projectId]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "done": return "bg-green-100 text-green-800";
      case "in progress": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getProgress = () => {
    if (!project?.volunteers_needed) return 0;
    return Math.min(100, (project.volunteers_registered / project.volunteers_needed) * 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <Skeleton className="h-12 w-96 mb-6" />
        <Skeleton className="h-64 w-full rounded-lg mb-6" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              {error || "Project not found or you are not the assigned project manager."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {project.organization_name}
          </div>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
          <span>•</span>
          <span>You are the Project Manager</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Volunteers</p>
                <p className="text-2xl font-bold">
                  {project.volunteers_registered}{" "}
                  {project.volunteers_needed ? `/ ${project.volunteers_needed}` : ""}
                </p>
              </div>
              <Users className="h-10 w-10 text-[#0284C7]" />
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#0284C7] h-2 rounded-full transition-all"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="text-xl font-semibold">
                  {format(new Date(project.start_date), "MMM d, yyyy")}
                </p>
              </div>
              <Calendar className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">End Date</p>
                <p className="text-xl font-semibold">
                  {format(new Date(project.end_date), "MMM d, yyyy")}
                </p>
              </div>
              <Clock className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones ({milestones.length})</TabsTrigger>
          <TabsTrigger value="deliverables">Deliverables ({deliverables.length})</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Location</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-5 w-5 text-gray-500" />
                <span>
                  {[project.lga, project.state, project.country].filter(Boolean).join(", ") || "Not specified"}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-sm">
                  {project.category}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          {milestones.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No milestones defined for this project yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {milestones.map((m) => (
                <Card key={m.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{m.title}</CardTitle>
                      <Badge className={getStatusColor(m.status)}>{m.status}</Badge>
                    </div>
                    {m.description && <CardDescription>{m.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      Due: {format(new Date(m.due_date), "MMMM d, yyyy")}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deliverables" className="mt-6">
          {deliverables.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No deliverables defined yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliverables.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell>{format(new Date(d.due_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(d.status)}>{d.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {project.volunteers_registered} Volunteers Registered
              </h3>
              <p className="text-gray-600 mb-6">
                Manage volunteer requests, hours, and team communication here.
              </p>
              {/* You can expand this tab later with actual volunteer list, requests, etc. */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}