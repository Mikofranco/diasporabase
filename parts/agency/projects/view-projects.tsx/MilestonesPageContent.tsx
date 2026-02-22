"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Plus, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { routes } from "@/lib/routes";
import type { MilestoneSectionMilestone, MilestoneSectionDeliverable, MilestoneRole } from "./milestone-types";
import { milestoneStatusLabel } from "./milestone-types";
import { MilestoneCard } from "./MilestoneCard";
import { DeliverableRow } from "./DeliverableRow";
import { CreateDeliverableModal } from "./CreateDeliverableModal";
import type { Volunteer } from "@/lib/types";

const supabase = createClient();

export type DeliverableFilter = "all" | "mine" | "unassigned" | "completed";

interface MilestonesPageContentProps {
  projectId: string;
  projectTitle: string;
  role: MilestoneRole;
  projectStatus: string;
  volunteers: Volunteer[];
  currentUserId: string | null;
  backHref: string;
  isAgency: boolean;
}

export function MilestonesPageContent({
  projectId,
  projectTitle,
  role,
  projectStatus,
  volunteers,
  currentUserId,
  backHref,
  isAgency,
}: MilestonesPageContentProps) {
  const searchParams = useSearchParams();
  const highlightMilestoneId = searchParams.get("milestone");

  const [milestones, setMilestones] = useState<MilestoneSectionMilestone[]>([]);
  const [assigneeNames, setAssigneeNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DeliverableFilter>("all");
  const [createMilestoneOpen, setCreateMilestoneOpen] = useState(false);
  const [createDeliverableOpen, setCreateDeliverableOpen] = useState(false);
  const [deliverableModalMilestoneId, setDeliverableModalMilestoneId] = useState<string | null>(null);
  const [editingDeliverable, setEditingDeliverable] = useState<MilestoneSectionDeliverable | null>(null);
  const [savingMilestone, setSavingMilestone] = useState(false);

  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    due_date: "",
    status: "Pending" as const,
  });

  const canAddMilestone = isAgency && ["pending", "approved", "active"].includes(projectStatus.toLowerCase());
  const canEditDeliverables = true;

  const fetchMilestones = useCallback(async () => {
    const { data: milestonesData } = await supabase
      .from("milestones")
      .select("*")
      .eq("project_id", projectId)
      .order("due_date");

    if (!milestonesData?.length) {
      setMilestones([]);
      setAssigneeNames({});
      return;
    }

    const milestoneIds = milestonesData.map((m: { id: string }) => m.id);
    const { data: deliverablesData } = await supabase
      .from("deliverables")
      .select("*")
      .in("milestone_id", milestoneIds);

    const deliverablesMap = (deliverablesData || []).reduce(
      (acc: Record<string, MilestoneSectionDeliverable[]>, d: any) => {
        if (!acc[d.milestone_id]) acc[d.milestone_id] = [];
        acc[d.milestone_id].push(d);
        return acc;
      },
      {},
    );

    const fullMilestones: MilestoneSectionMilestone[] = milestonesData.map((m: any) => ({
      ...m,
      deliverables: deliverablesMap[m.id] || [],
    }));
    setMilestones(fullMilestones);

    const assignedIds = [...new Set((deliverablesData || []).map((d: any) => d.assigned_to).filter(Boolean))];
    if (assignedIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", assignedIds);
      const names: Record<string, string> = {};
      (profiles || []).forEach((p: { id: string; full_name: string | null }) => {
        names[p.id] = p.full_name || "Unknown";
      });
      setAssigneeNames(names);
    } else {
      setAssigneeNames({});
    }
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    fetchMilestones().finally(() => setLoading(false));
  }, [fetchMilestones]);

  const openAddDeliverable = (milestoneId: string) => {
    setEditingDeliverable(null);
    setDeliverableModalMilestoneId(milestoneId);
    setCreateDeliverableOpen(true);
  };

  const openEditDeliverable = (d: MilestoneSectionDeliverable, milestoneId: string) => {
    setEditingDeliverable(d);
    setDeliverableModalMilestoneId(milestoneId);
    setCreateDeliverableOpen(true);
  };

  const deleteDeliverable = async (id: string) => {
    if (!confirm("Delete this deliverable?")) return;
    const { error } = await supabase.from("deliverables").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete deliverable");
    } else {
      toast.success("Deliverable deleted");
      fetchMilestones();
    }
  };

  const filterDeliverables = (list: MilestoneSectionDeliverable[]) => {
    if (filter === "all") return list;
    if (filter === "completed") return list.filter((d) => d.status === "Done");
    if (filter === "unassigned") return list.filter((d) => !d.assigned_to);
    if (filter === "mine" && currentUserId) return list.filter((d) => d.assigned_to === currentUserId);
    return list;
  };

  const handleCreateMilestone = async () => {
    if (!milestoneForm.title.trim() || !milestoneForm.due_date) {
      toast.error("Title and due date are required");
      return;
    }
    setSavingMilestone(true);
    const { error } = await supabase.from("milestones").insert({
      project_id: projectId,
      title: milestoneForm.title.trim(),
      description: milestoneForm.description.trim() || null,
      due_date: milestoneForm.due_date,
      status: milestoneForm.status,
    });
    setSavingMilestone(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Milestone created");
    setCreateMilestoneOpen(false);
    setMilestoneForm({ title: "", description: "", due_date: "", status: "Pending" });
    fetchMilestones();
  };

  const totalDeliverables = milestones.reduce((acc, m) => acc + (m.deliverables?.length ?? 0), 0);
  const completedDeliverables = milestones.reduce(
    (acc, m) => acc + (m.deliverables?.filter((d) => d.status === "Done")?.length ?? 0),
    0,
  );

  // Scroll highlighted milestone into view
  useEffect(() => {
    if (!highlightMilestoneId) return;
    const el = document.getElementById(highlightMilestoneId);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [highlightMilestoneId, milestones.length]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-4xl">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-4xl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={backHref}>{isAgency ? "Projects" : "My projects"}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={backHref} className="truncate max-w-[180px] sm:max-w-md inline-block">
                {projectTitle}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium">Milestones</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Milestones &amp; Deliverables</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {totalDeliverables} deliverable{totalDeliverables !== 1 ? "s" : ""}
            {totalDeliverables > 0 && ` · ${completedDeliverables} completed`}
          </p>
        </div>
        {canAddMilestone && (
          <Button
            onClick={() => setCreateMilestoneOpen(true)}
            className="shrink-0 border-diaspora-darkBlue text-diaspora-darkBlue hover:bg-diaspora-darkBlue/10"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Milestone
          </Button>
        )}
      </div>

      {milestones.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No milestones yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {canAddMilestone
                ? "Create a milestone to start adding deliverables."
                : "No milestones have been added to this project yet."}
            </p>
            {canAddMilestone && (
              <Button
                onClick={() => setCreateMilestoneOpen(true)}
                variant="outline"
                className="border-diaspora-darkBlue text-diaspora-darkBlue hover:bg-diaspora-darkBlue/10"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Milestone
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as DeliverableFilter)}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="mine">My Deliverables</TabsTrigger>
              <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-8">
            {milestones.map((milestone) => {
              const filtered = filterDeliverables(milestone.deliverables ?? []);
              const completedCount = (milestone.deliverables ?? []).filter((d) => d.status === "Done").length;
              const totalCount = milestone.deliverables?.length ?? 0;
              const isHighlighted = highlightMilestoneId === milestone.id;

              return (
                <Card
                  key={milestone.id}
                  id={milestone.id}
                  className={`scroll-mt-4 ${isHighlighted ? "ring-2 ring-diaspora-darkBlue/50" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-xl">{milestone.title}</CardTitle>
                        {milestone.description && (
                          <CardDescription className="mt-1">{milestone.description}</CardDescription>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                          {milestone.due_date && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(milestone.due_date), "MMM d, yyyy")}
                            </span>
                          )}
                          <Badge variant="secondary">{milestoneStatusLabel(milestone.status)}</Badge>
                          <span>
                            {completedCount} / {totalCount} deliverables
                          </span>
                        </div>
                      </div>
                      {(canAddMilestone || role === "volunteer") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAddDeliverable(milestone.id!)}
                          className="shrink-0 border-diaspora-darkBlue text-diaspora-darkBlue hover:bg-diaspora-darkBlue/10"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Deliverable
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {filtered.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No deliverables match the current filter.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {filtered.map((d) => (
                          <DeliverableRow
                            key={d.id}
                            deliverable={d}
                            assignedToName={d.assigned_to ? assigneeNames[d.assigned_to] ?? null : null}
                            canEdit={canEditDeliverables}
                            onEdit={() => openEditDeliverable(d, milestone.id!)}
                            onDelete={() => d.id && deleteDeliverable(d.id)}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <CreateDeliverableModal
        open={createDeliverableOpen}
        onOpenChange={(open) => {
          setCreateDeliverableOpen(open);
          if (!open) {
            setDeliverableModalMilestoneId(null);
            setEditingDeliverable(null);
          }
        }}
        projectId={projectId}
        milestoneId={deliverableModalMilestoneId ?? ""}
        role={role}
        volunteers={volunteers}
        currentUserId={currentUserId}
        initialData={editingDeliverable}
        onSuccess={fetchMilestones}
      />

      <Dialog open={createMilestoneOpen} onOpenChange={setCreateMilestoneOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Milestone title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={milestoneForm.description}
                onChange={(e) => setMilestoneForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input
                type="date"
                value={milestoneForm.due_date}
                onChange={(e) => setMilestoneForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={milestoneForm.status}
                onValueChange={(v) => setMilestoneForm((f) => ({ ...f, status: v as "Pending" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Done">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateMilestoneOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMilestone} disabled={savingMilestone} className="action-btn">
              {savingMilestone && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
