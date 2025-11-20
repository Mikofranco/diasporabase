"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Users, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  title: string;
  description: string;
  organization_name: string;
  location: string;
  start_date: string;
  end_date: string;
  volunteers_needed: number;
  volunteers_registered: number;
  status: string;
  category: string;
}

interface Volunteer {
  volunteer_id: string;
  full_name: string;
  email: string;
}

export default function VolunteerProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [showVolunteers, setShowVolunteers] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndProjects = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchProjects(user.id);
      } else {
        setProjects([]);
        setVolunteers([]);
        setLoading(false);
      }
    };

    fetchUserAndProjects();
  }, []);

const fetchProjects = async (userId: string) => {
  console.log("Fetching projects for user:", userId); 

  const { data, error } = await supabase
    .from("project_volunteers")
    .select(`
      project_id,
      projects!inner(
        id,
        title,
        description,
        organization_name,
        location,
        start_date,
        end_date,
        volunteers_needed,
        volunteers_registered,
        status,
        category
      )
    `)
    .eq("volunteer_id", userId)  
    .eq("projects.status", "active")
    .order("created_at", { ascending: false });

  console.log("Raw project_volunteers data:", data); 

  if (error) {
    console.error("Error fetching projects:", error);
    setProjects([]);
  } else {
    const mappedProjects = (data || []).map((item: any) => ({
      id: item.projects.id,
      title: item.projects.title,
      description: item.projects.description,
      organization_name: item.projects.organization_name,
      location: item.projects.location,
      start_date: item.projects.start_date,
      end_date: item.projects.end_date,
      volunteers_needed: item.projects.volunteers_needed,
      volunteers_registered: item.projects.volunteers_registered,
      status: item.projects.status,
      category: item.projects.category,
    }));
    setProjects(mappedProjects);
  }
  setLoading(false);
};

  const fetchVolunteers = async (projectId: string) => {
    if (!userId) {
      setVolunteers([]);
      return;
    }

    // Fetch volunteers for the project, excluding the current user
    const { data, error } = await supabase
      .from("project_volunteers")
      .select(
        `
        volunteer_id,
        profiles!inner(full_name, email)
      `
      )
      .eq("project_id", projectId)
      .neq("volunteer_id", userId);

    if (error) {
      console.error("Error fetching volunteers:", error);
      setVolunteers([]);
    } else {
      // Map data to match Volunteer interface
      const mappedVolunteers = data.map((item: any) => ({
        volunteer_id: item.volunteer_id,
        full_name: item.profiles.full_name,
        email: item.profiles.email,
      }));
      setVolunteers(mappedVolunteers || []);
    }
  };

  const handleLeaveProject = async () => {
    if (!selectedProject || !leaveReason.trim() || !userId) {
      alert("Please provide a reason for leaving the project.");
      return;
    }

    setSubmitting(true);

    // Remove volunteer from project_volunteers
    const { error: deleteError } = await supabase
      .from("project_volunteers")
      .delete()
      .eq("project_id", selectedProject.id)
      .eq("volunteer_id", userId);

    if (deleteError) {
      console.error("Error leaving project:", deleteError);
      alert("Error leaving project. Please try again.");
      setSubmitting(false);
      return;
    }

    // Record the reason for leaving (assuming project_leave_reasons table)
    const { error: reasonError } = await supabase
      .from("project_leave_reasons")
      .insert({
        project_id: selectedProject.id,
        volunteer_id: userId,
        reason: leaveReason.trim(),
        created_at: new Date().toISOString(),
      });

    if (reasonError) {
      console.error("Error submitting leave reason:", reasonError);
      alert("Error submitting leave reason. Please try again.");
    } else {
      // Refresh projects and reset state
      setLeaveReason("");
      setShowLeaveForm(false);
      setSelectedProject(null);
      setShowVolunteers(false);
      setOpenDialog(false);
      if (userId) {
        await fetchProjects(userId);
      }
    }

    setSubmitting(false);
  };

  const handleRouteToViewProject = () => {
    router.push("/dashboard/volunteer/find-opportunity");
  };

  const handleViewVolunteers = () => {
    if (selectedProject) {
      setShowVolunteers(true);
      fetchVolunteers(selectedProject.id);
    }
  };

  const handleRouteToSelectedProject=(projectId:string)=>{
    router.push(`/dashboard/volunteer/projects/${projectId}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-2">Volunteer Projects</h1>
          <Button className="action-btn" onClick={handleRouteToViewProject}>
            View Ongoing Projects
          </Button>
        </div>
      </div>

      {!selectedProject ? (
        projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <CardDescription>{project.organization_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {project.description}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(project.start_date).toLocaleDateString()} -{" "}
                        {new Date(project.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {project.volunteers_registered}/
                        {project.volunteers_needed} volunteers
                      </span>
                    </div>
                    <Badge variant="secondary">{project.category}</Badge>
                  </div>
                  <Button
                    className="w-full mt-4 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90"
                    onClick={()=>handleRouteToSelectedProject(project.id)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>
              No volunteer projects found. Please join a project to get started.
            </p>
          </div>
        )
      ) : (
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            className="mb-6 bg-transparent"
            onClick={() => {
              setSelectedProject(null);
              setShowVolunteers(false);
              setShowLeaveForm(false);
            }}
          >
            ← Back to Projects
          </Button>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Project Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {selectedProject.title}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {selectedProject.organization_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>{selectedProject.description}</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-2">Project Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(
                              selectedProject.start_date
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(
                              selectedProject.end_date
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {selectedProject.volunteers_registered}/
                            {selectedProject.volunteers_needed} volunteers
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {selectedProject.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      className="mt-4 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90"
                      onClick={handleViewVolunteers}
                    >
                      View Volunteers
                    </Button>
                    {userId && (
                      <Button
                        className="mt-4 bg-gradient-to-r from-[#EF4444] to-[#B91C1C] hover:from-[#EF4444]/90 hover:to-[#B91C1C]/90"
                        onClick={() => setShowLeaveForm(true)}
                      >
                        Leave Project
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Volunteers Table */}
              {showVolunteers && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Other Volunteers</CardTitle>
                    <CardDescription>
                      Volunteers currently assigned to this project
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {volunteers.length > 0 ? (
                          volunteers.map((volunteer) => (
                            <TableRow key={volunteer.volunteer_id}>
                              <TableCell>{volunteer.full_name}</TableCell>
                              <TableCell>{volunteer.email}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={2}
                              className="text-center text-muted-foreground"
                            >
                              No other volunteers found for this project.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Leave Project Form */}
            {userId && showLeaveForm && (
              <div>
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle>Leave Project</CardTitle>
                    <CardDescription>
                      Please provide a reason for leaving the project.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="leave-reason">Reason for Leaving</Label>
                      <Textarea
                        id="leave-reason"
                        placeholder="Please explain why you are leaving this project..."
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full bg-gradient-to-r from-[#EF4444] to-[#B91C1C] hover:from-[#EF4444]/90 hover:to-[#B91C1C]/90"
                          disabled={submitting || !leaveReason.trim()}
                        >
                          {submitting
                            ? "Submitting..."
                            : "Submit Leave Request"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Leaving Project</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to leave{" "}
                            <strong>{selectedProject.title}</strong>? This
                            action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setOpenDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="bg-gradient-to-r from-[#EF4444] to-[#B91C1C] hover:from-[#EF4444]/90 hover:to-[#B91C1C]/90"
                            onClick={handleLeaveProject}
                            disabled={submitting}
                          >
                            Confirm
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowLeaveForm(false)}
                    >
                      Cancel
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}