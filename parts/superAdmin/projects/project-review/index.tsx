// app/dashboard/projects/review/[projectId]/page.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

const supabase = createClient();

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  organization_name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
}

const ProjectReviewPage: React.FC = () => {
  const { projectId } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();
        if (error) throw error;
        setProject(data);
      } catch (err: any) {
        toast.error("Error fetching project: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [projectId]);

  const handleProjectAction = async (status: "active" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status })
        .eq("id", projectId);
      if (error) throw error;
      toast.success(`Project ${status === "active" ? "approved" : "rejected"} successfully`);
      router.push("/dashboard/notifications");
    } catch (err: any) {
      toast.error(`Error updating project: ${err.message}`);
    }
  };

  if (loading) return <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>;
  if (!project) return <p className="text-sm text-gray-600 dark:text-gray-400">Project not found</p>;

  return (
    <Card className="max-w-2xl mx-auto bg-white dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Review Project: {project.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Organization</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{project.organization_name}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Category</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{project.category}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Description</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{project.description}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Location</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{project.location}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Start Date</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{project.start_date}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">End Date</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{project.end_date}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-[#0284C7] hover:bg-blue-700 text-white text-xs"
            onClick={() => handleProjectAction("active")}
          >
            <Check className="mr-2 h-4 w-4" />
            Approve
          </Button>
          <Button
            variant="destructive"
            className="text-xs"
            onClick={() => handleProjectAction("cancelled")}
          >
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectReviewPage;