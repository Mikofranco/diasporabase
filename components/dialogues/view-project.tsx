"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { Project } from "@/lib/types";
import { toast } from "sonner";
import {
  Type,
  MapPin,
  Calendar,
  Tag,
  FileText,
  Milestone,
  Package,
  Clipboard,
  X,
} from "lucide-react";

// Define status badge variants
const statusVariants = {
  Done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

interface ViewProjectDialogueProps {
  project?: Project & {
    milestones?: { id: string; title: string; description?: string; due_date: string; status: string }[];
    deliverables?: { id: string; title: string; description?: string; status: string }[];
  };
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ViewProjectDialogue: React.FC<ViewProjectDialogueProps> = ({ project, isOpen, setIsOpen }) => {
  const [fullProject, setFullProject] = useState(project);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch project details if not provided
  useEffect(() => {
    if (isOpen && project?.id && (!project.milestones || !project.deliverables)) {
      const fetchProjectData = async () => {
        try {
          setIsFetching(true);
          const { data, error } = await supabase
            .from("projects")
            .select("*, milestones(*), deliverables(*)")
            .eq("id", project.id)
            .single();

          if (error) {
            throw new Error(`Failed to fetch project: ${error.message}`);
          }

          setFullProject(data);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
        } finally {
          setIsFetching(false);
        }
      };

      fetchProjectData();
    }
  }, [isOpen, project]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <AnimatePresence>
        {isOpen && (
          <DialogContent
            className="max-w-4xl sm:max-w-[95vw] p-8 bg-white dark:bg-gray-900 rounded-xl shadow-2xl"
            as={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Type className="h-6 w-6 text-[#0284C7] dark:text-blue-400" aria-hidden="true" />
                {fullProject?.title || "Project Details"}
              </DialogTitle>
              <DialogDescription id="dialog-description" className="text-gray-600 dark:text-gray-400">
                View details of the project, including milestones and deliverables.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-8">
              {isFetching ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[...Array(6)].map((_, index) => (
                    <Skeleton key={index} className="h-10 w-full rounded-md" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Type className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
                    <div>
                      <Label className="font-semibold text-gray-700 dark:text-gray-300">Title</Label>
                      <p className="text-gray-900 dark:text-gray-100">{fullProject?.title || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
                    <div>
                      <Label className="font-semibold text-gray-700 dark:text-gray-300">Category</Label>
                      <p className="text-gray-900 dark:text-gray-100 capitalize">{fullProject?.category || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
                    <div>
                      <Label className="font-semibold text-gray-700 dark:text-gray-300">Location</Label>
                      <p className="text-gray-900 dark:text-gray-100">{fullProject?.location || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
                    <div>
                      <Label className="font-semibold text-gray-700 dark:text-gray-300">Status</Label>
                      <Badge
                        className={`${
                          statusVariants[fullProject?.status as keyof typeof statusVariants] || "bg-gray-100 text-gray-800"
                        } capitalize`}
                      >
                        {fullProject?.status || "N/A"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
                    <div>
                      <Label className="font-semibold text-gray-700 dark:text-gray-300">Start Date</Label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {fullProject?.start_date
                          ? new Intl.DateTimeFormat("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "2-digit",
                            }).format(new Date(fullProject.start_date))
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
                    <div>
                      <Label className="font-semibold text-gray-700 dark:text-gray-300">End Date</Label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {fullProject?.end_date
                          ? new Intl.DateTimeFormat("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "2-digit",
                            }).format(new Date(fullProject.end_date))
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
                    <div>
                      <Label className="font-semibold text-gray-700 dark:text-gray-300">Description</Label>
                      <p className="text-gray-900 dark:text-gray-100">{fullProject?.description || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Milestones Section */}
              <Accordion type="single" collapsible className="mt-6">
                <AccordionItem value="milestones" className="border-none">
                  <AccordionTrigger className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-4 flex items-center gap-2">
                    <Milestone className="h-5 w-5 text-[#0284C7] dark:text-blue-400" aria-hidden="true" />
                    Milestones
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    {isFetching ? (
                      <div className="space-y-4">
                        {[...Array(2)].map((_, index) => (
                          <Skeleton key={index} className="h-20 w-full rounded-md" />
                        ))}
                      </div>
                    ) : fullProject?.milestones && fullProject.milestones.length > 0 ? (
                      <div className="space-y-4">
                        {fullProject.milestones.map((milestone) => (
                          <motion.div
                            key={milestone.id}
                            className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="grid gap-3">
                              <div className="flex items-start gap-3">
                                <Clipboard className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
                                <div>
                                  <Label className="font-semibold text-gray-700 dark:text-gray-300">Title</Label>
                                  <p className="text-gray-900 dark:text-gray-100">{milestone.title}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
                                <div>
                                  <Label className="font-semibold text-gray-700 dark:text-gray-300">Description</Label>
                                  <p className="text-gray-900 dark:text-gray-100">{milestone.description || "N/A"}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
                                <div>
                                  <Label className="font-semibold text-gray-700 dark:text-gray-300">Due Date</Label>
                                  <p className="text-gray-900 dark:text-gray-100">
                                    {new Intl.DateTimeFormat("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "2-digit",
                                    }).format(new Date(milestone.due_date))}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <Tag className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
                                <div>
                                  <Label className="font-semibold text-gray-700 dark:text-gray-300">Status</Label>
                                  <Badge
                                    className={`${statusVariants[milestone.status as keyof typeof statusVariants]} capitalize`}
                                  >
                                    {milestone.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">No milestones found.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Deliverables Section */}
              <Accordion type="single" collapsible className="mt-6">
                <AccordionItem value="deliverables" className="border-none">
                  <AccordionTrigger className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#0284C7] dark:text-blue-400" aria-hidden="true" />
                    Deliverables
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    {isFetching ? (
                      <div className="space-y-4">
                        {[...Array(2)].map((_, index) => (
                          <Skeleton key={index} className="h-20 w-full rounded-md" />
                        ))}
                      </div>
                    ) : fullProject?.deliverables && fullProject.deliverables.length > 0 ? (
                      <div className="space-y-4">
                        {fullProject.deliverables.map((deliverable) => (
                          <motion.div
                            key={deliverable.id}
                            className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="grid gap-3">
                              <div className="flex items-start gap-3">
                                <Clipboard className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
                                <div>
                                  <Label className="font-semibold text-gray-700 dark:text-gray-300">Title</Label>
                                  <p className="text-gray-900 dark:text-gray-100">{deliverable.title}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
                                <div>
                                  <Label className="font-semibold text-gray-700 dark:text-gray-300">Description</Label>
                                  <p className="text-gray-900 dark:text-gray-100">{deliverable.description || "N/A"}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <Tag className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true" />
                                <div>
                                  <Label className="font-semibold text-gray-700 dark:text-gray-300">Status</Label>
                                  <Badge
                                    className={`${statusVariants[deliverable.status as keyof typeof statusVariants]} capitalize`}
                                  >
                                    {deliverable.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">No deliverables found.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <DialogFooter className="mt-8">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                asChild
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                  Close
                </motion.button>
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default ViewProjectDialogue;