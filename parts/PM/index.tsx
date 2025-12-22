"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  UserCheck,
  MapPin,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getProjectManagers } from "@/services/projects";
import { useSendMail } from "@/services/mail";

const supabase = createClient();

interface Volunteer {
  id: string;
  full_name: string;
  profile_picture?: string;
  skills: string[];
  residence_country: string;
  residence_state?: string | null;
  experience?: string | null;
}

interface AssignProjectManagerProps {
  projectId: string;
  currentManagerId?: string | null;
  onManagerAssigned?: () => void;
}

export default function AssignProjectManager({
  projectId,
  currentManagerId,
  onManagerAssigned,
}: AssignProjectManagerProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [confirmVolunteer, setConfirmVolunteer] = useState<Volunteer | null>(
    null
  );
  const [currentManager, setCurrentManager] = useState<Volunteer | null>(null);

  // Fetch current manager when dialog opens
  useEffect(() => {
    if (currentManagerId && open) {
      const fetchCurrent = async () => {
        const { data } = await supabase
          .from("profiles")
          .select(
            "id, full_name, profile_picture, residence_country, residence_state"
          )
          .eq("id", currentManagerId)
          .single();

        if (data) setCurrentManager(data);
      };
      fetchCurrent();
    } else {
      setCurrentManager(null);
    }
  }, [currentManagerId, open]);
  useEffect(() => {
    searchVolunteers();
  }, [projectId]);

  const searchVolunteers = async () => {
    setLoading(true);
    const { data, error } = await getProjectManagers();
    if (error) {
      toast.error("Error fetching volunteers: " + error.message);
      setVolunteers([]);
    } else {
      console.log("Fetched volunteers:", data);
      const filtered = data?.filter((v) => v.id !== currentManagerId) || []; //@ts-ignore
      setVolunteers(filtered);
    }
    setLoading(false);
  };

  const assignManager = async (volunteerId: string) => {
    setAssigningId(volunteerId);
    if (currentManagerId === volunteerId) {
      toast.error("This volunteer is already the project manager.");
      setAssigningId(null);
      setConfirmVolunteer(null);
      return;
    }
    const { error } = await supabase
      .from("projects")
      .update({ project_manager_id: volunteerId })
      .eq("id", projectId);

    await useSendMail({
      to: confirmVolunteer?.full_name || "",
      subject: "You have been assigned as Project Manager",
      html: `Dear ${confirmVolunteer?.full_name},\n\nYou have been assigned as the Project Manager for project ID: ${projectId}.\n\nBest regards,\nDiasporaBase Team`,
    })

    if (error) {
      toast.error("Assignment failed: " + error.message);
    } else {
      toast.success("Project manager assigned successfully!");
      setOpen(false);
      setConfirmVolunteer(null);
      onManagerAssigned?.();
    }
    setAssigningId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant={currentManagerId ? "outline" : "default"}
            className={
              currentManagerId
                ? "border-orange-400 text-orange-800 hover:bg-orange-50 hover:border-orange-500"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            }
          >
            <UserCheck className="mr-2 h-4 w-4" />
            {currentManagerId
              ? "Change Project Manager"
              : "Assign Project Manager"}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Assign Project Manager
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to assign{" "}
              <strong>{confirmVolunteer?.full_name}</strong> as the Project
              Manager?
              {currentManager && (
                <span className="block mt-2">
                  This will replace the current manager:{" "}
                  <strong>{currentManager.full_name}</strong>.
                </span>
              )}
            </DialogDescription>

            {currentManager && (
              <Alert className="mt-4 border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Current Manager:</strong> {currentManager.full_name} (
                  {currentManager.residence_state ||
                    currentManager.residence_country}
                  )
                </AlertDescription>
              </Alert>
            )}
          </DialogHeader>

          <div className="mt-6 space-y-6">
            {/* Search */}
            <div>
              <Label htmlFor="search">Search Available Project Managers</Label>
              <div className="flex gap-3 mt-2">
                <Input
                  id="search"
                  placeholder="Type volunteer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchVolunteers()}
                  className="flex-1"
                />
                <Button onClick={searchVolunteers} disabled={loading} className="action-btn">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Only volunteers with <strong>project_management</strong> skill
                are shown.
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}

            {/* No results */}
            {!loading && searchTerm && volunteers.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    No project managers found for "{searchTerm}"
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Try a different name or partial match.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Table Results */}
            {!loading && volunteers.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Volunteer</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Relevant Skills</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {volunteers.map((volunteer) => (
                      <TableRow key={volunteer.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={volunteer.profile_picture || undefined}
                              />
                              <AvatarFallback>
                                {volunteer.full_name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {volunteer.full_name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            {[
                              volunteer.residence_state,
                              volunteer.residence_country,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {volunteer.skills
                              .filter(
                                (s) =>
                                  s.toLowerCase().includes("project") ||
                                  s.toLowerCase().includes("manage")
                              )
                              .slice(0, 3)
                              .map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {skill.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            {volunteer.skills.filter(
                              (s) =>
                                s.toLowerCase().includes("project") ||
                                s.toLowerCase().includes("manage")
                            ).length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                + more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs">
                          {volunteer.experience ? (
                            <p className="line-clamp-2">
                              {volunteer.experience}
                            </p>
                          ) : (
                            <span className="text-gray-400 italic">
                              No experience listed
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => setConfirmVolunteer(volunteer)}
                            disabled={assigningId === volunteer.id}
                          >
                            {assigningId === volunteer.id
                              ? "Assigning..."
                              : "Assign"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!confirmVolunteer}
        onOpenChange={() => setConfirmVolunteer(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Assignment</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to assign{" "}
            <strong>{confirmVolunteer?.full_name}</strong> as the Project
            Manager for this project?
            {currentManager && (
              <span className="block mt-2 text-sm">
                This will replace the current manager:{" "}
                <strong>{currentManager.full_name}</strong>.
              </span>
            )}
          </DialogDescription>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setConfirmVolunteer(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                confirmVolunteer && assignManager(confirmVolunteer.id)
              }
              disabled={assigningId !== null}
            >
              {assigningId ? "Assigning..." : "Yes, Assign Manager"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
