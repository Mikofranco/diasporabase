// app/dashboard/volunteer-projects/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

import ProjectView from "./project-view";
import { Project } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import MilestonesView from "./milestones-view";
import DeliverablesView from "./deliverables-view";
import VolunteersList from "./volunteer-list";

export default function ViewProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Array.isArray(id)) return;

    async function fetchAll() {
      try {
        // Fetch project
        const { data: proj } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();
        if (!proj) throw new Error("Project not found");
        setProject(proj as Project);

        // Fetch related data in parallel
        const [miles, dels, vols] = await Promise.all([
          supabase.from("milestones").select("*").eq("project_id", id),
          supabase.from("deliverables").select("*").eq("project_id", id),
          supabase
            .from("project_volunteers")
            .select(
              "volunteer_id, created_at, profiles!volunteer_id(full_name, profile_picture)"
            )
            .eq("project_id", id)
            .eq("status", "approved"),
        ]);

        setMilestones(miles.data || []);
        setDeliverables(dels.data || []);
        setVolunteers(
          (vols.data || []).map((v: any) => ({
            id: v.volunteer_id,
            full_name: v.profiles?.full_name || "Anonymous",
            email: v.profiles?.email || "",
            profile_picture: v.profiles?.profile_picture,
            joined_at: v.created_at,
          }))
        );
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [id]);

  if (loading)
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  if (error || !project)
    return (
      <div className="container mx-auto p-6 text-center py-20 text-destructive">
        <AlertCircle className="h-12 w-12 mx-auto mb-4" />
        {error || "Project not found"}
      </div>
    );

  return (
    <div className="container p-6 space-y-16 pb-20 bg-white mx-auto rounded-2xl">
      <section>
        <ProjectView project={project} />
      </section>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-8">
          <h2 className="text-3xl font-bold mb-8">
            Volunteers ({volunteers.length})
          </h2>
          <VolunteersList volunteers={volunteers} />
        </section>

        <div>
          <section>
            <h2 className="font-bold mb-2">Milestones</h2>
            <MilestonesView milestones={milestones} />
          </section>

          <Separator />

          <section>
            <h2 className="font-bold mb-2">Deliverables</h2>
            <DeliverablesView deliverables={deliverables} />
          </section>
        </div>
      </div>

      <Separator />
    </div>
  );
}
