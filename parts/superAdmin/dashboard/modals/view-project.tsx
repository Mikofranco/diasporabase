// components/modals/ViewProjectModal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/lib/types";
import { format } from "date-fns";
import Logo from "@/components/logo";

interface ViewProjectModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewProjectModal({ project, open, onOpenChange }: ViewProjectModalProps) {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
            <Logo/>
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
                  ? "bg-gray-100 text-gray-800"
                  : project.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {project.status}
            </Badge>
          </div>

          {/* Contact */}
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
              <h4 className="font-medium text-gray-700">Start Date</h4>
              <p>{format(new Date(project.start_date), "MMMM d, yyyy")}</p>
            </div>
            {project.end_date && (
              <div>
                <h4 className="font-medium text-gray-700">End Date</h4>
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
                <p>{project.location}</p>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}