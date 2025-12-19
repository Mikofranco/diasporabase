// components/modals/ViewProjectModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/lib/types";
import { format } from "date-fns";
import Logo from "@/components/logo";
import { getMileStonesAndDeliverablesForProject } from "@/services/projects";
import { formatLocation } from "@/lib/utils";

interface ViewProjectModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  status: string;
  deliverables?: Array<{
    id: string;
    title: string;
    description?: string;
    due_date: string;
    status: string;
  }>;
}

export function ViewProjectModal({ project, open, onOpenChange }: ViewProjectModalProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);

  // ← All hooks must be at the top, unconditionally

  useEffect(() => {
    if (!open || !project?.id) {
      setMilestones([]);
      return;
    }

    const fetchMilestones = async () => {
      setLoadingMilestones(true);
      try {
        const data = await getMileStonesAndDeliverablesForProject(project.id);
        console.log("Fetching milestones for project:", project.id);
        console.log("Milestones and Deliverables fetched:", data);

        if (Array.isArray(data)) {
          setMilestones(data);
        } else if (data?.milestones) {
          setMilestones(data.milestones);
        } else {
          console.warn("Unexpected data format from service:", data);
          setMilestones([]);
        }
      } catch (error) {
        console.error("Failed to fetch milestones:", error);
        setMilestones([]);
      } finally {
        setLoadingMilestones(false);
      }
    };

    fetchMilestones();
  }, [project?.id, open]);

  // ← Early return AFTER hooks
  if (!project) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <Logo />
          <DialogTitle className="text-2xl">{project.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-700">Status:</span>
            <Badge
              variant="outline"
              className={
                project.status === "active"
                  ? "bg-blue-100 text-blue-800"
                  : project.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : project.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
            </Badge>
          </div>

          {/* Contact Person */}
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Contact Person</h4>
            <p>
              {project.contact_person_first_name} {project.contact_person_last_name}
            </p>
            <p className="text-sm text-muted-foreground">{project.contact_person_email}</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700">Target Start Date</h4>
              <p>{format(new Date(project.start_date), "MMMM d, yyyy")}</p>
            </div>
            {project.end_date && (
              <div>
                <h4 className="font-medium text-gray-700">Target End Date</h4>
                <p>{format(new Date(project.end_date), "MMMM d, yyyy")}</p>
              </div>
            )}
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700">Category</h4>
              <p className="capitalize">{project.category}</p>
            </div>
            {project.location && (
              <div>
                <h4 className="font-medium text-gray-700">Location</h4>
                <p>{formatLocation(project.location)}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {project.description && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{project.description}</p>
            </div>
          )}

          {/* Milestones & Deliverables */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Milestones & Deliverables</h4>

            {loadingMilestones ? (
              <p className="text-sm text-gray-500">Loading milestones...</p>
            ) : milestones.length === 0 ? (
              <p className="text-sm text-gray-500">No milestones defined yet.</p>
            ) : (
              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold">{milestone.title}</h5>
                      <Badge variant="secondary">{milestone.status}</Badge>
                    </div>

                    {milestone.description && (
                      <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                    )}

                    <p className="text-xs text-gray-500">
                      Due: {format(new Date(milestone.due_date), "MMM d, yyyy")}
                    </p>

                    {milestone.deliverables && milestone.deliverables.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-gray-300">
                        <p className="text-sm font-medium mb-2">Deliverables:</p>
                        {milestone.deliverables.map((del) => (
                          <div key={del.id} className="mb-2 text-sm">
                            <span className="font-medium">• {del.title}</span>
                            {del.status && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {del.status}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}