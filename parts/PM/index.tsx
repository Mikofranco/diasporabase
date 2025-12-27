"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  UserCheck,
  MapPin,
  BadgeCheck,
  AlertCircle,
  Loader2,
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
import { createAgencyRequest } from "@/services/requests";

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
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [confirmVolunteer, setConfirmVolunteer] = useState<Volunteer | null>(null);
  const [currentManager, setCurrentManager] = useState<Volunteer | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("diaspobase_userId");
    setOrganizationId(userId);
  }, []);

  // Fetch current manager when dialog opens
  useEffect(() => {
    if (currentManagerId && open) {
      const fetchCurrent = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, profile_picture, residence_country, residence_state")
          .eq("id", currentManagerId)
          .single();

        if (data) setCurrentManager(data);
      };
      fetchCurrent();
    } else {
      setCurrentManager(null);
    }
  }, [currentManagerId, open]);

  const searchVolunteers = async () => {
    setSearching(true);
    try {
      const { data, error } = await getProjectManagers();
      if (error) {
        toast.error("Failed to load volunteers");
        setVolunteers([]);
      } else {//@ts-ignore
        const filtered = (data || []).filter((v: Volunteer) => v.id !== currentManagerId);
        
        const results = searchTerm //@ts-ignore
          ? filtered.filter((v: Volunteer) =>
              v.full_name.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : filtered;//@ts-ignore
        setVolunteers(results);
      }
    } catch (err) {
      toast.error("Error searching volunteers");
    } finally {
      setSearching(false);
    }
  };

  // Initial load when dialog opens
  useEffect(() => {
    if (open && volunteers.length === 0) {
      searchVolunteers();
    }
  }, [open]);

  const handleAssign = async () => {
    if (!confirmVolunteer || !organizationId) return;

    setAssigning(true);
    try {
      await createAgencyRequest({
        projectId,
        volunteerId: confirmVolunteer.id,
        requesterId: organizationId,
      });

      toast.success(`"${confirmVolunteer.full_name}" has been invited as Project Manager!`);
      setOpen(false);
      setConfirmVolunteer(null);
      onManagerAssigned?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant={currentManagerId ? "outline" : "default"}
            className={currentManagerId
              ? "border-orange-500 text-orange-700 hover:bg-orange-50"
              : "bg-emerald-600 hover:bg-emerald-700"
            }
          >
            <UserCheck className="mr-2 h-4 w-4" />
            {currentManagerId ? "Change Manager" : "Assign Manager"}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Assign Project Manager
            </DialogTitle>
            <DialogDescription className="text-base">
              Search and select a qualified volunteer to manage this project.
            </DialogDescription>

            {currentManager && (
              <Alert className="mt-4 border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Current Manager:</strong> {currentManager.full_name}
                  <span className="text-sm block mt-1">
                    Location: {currentManager.residence_state || currentManager.residence_country}
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </DialogHeader>

          <div className="mt-8 space-y-6">
            {/* Search Bar */}
            <div className="space-y-3">
              <Label htmlFor="search" className="text-base font-medium">
                Find Project Managers
              </Label>
              <div className="flex gap-3">
                <Input
                  id="search"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchVolunteers()}
                  className="text-base"
                  disabled={searching}
                />
                <Button 
                  onClick={searchVolunteers} 
                  disabled={searching}
                  className="px-6 action-btn"
                >
                  {searching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Only volunteers with project management skills are shown.
              </p>
            </div>

            {/* Loading State */}
            {searching && (
              <div className="space-y-4 py-8">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!searching && volunteers.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="text-center py-16">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg text-gray-600 font-medium">
                    {searchTerm ? `No volunteers found for "${searchTerm}"` : "No qualified volunteers available"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Try adjusting your search or check back later.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Results Table */}
            {!searching && volunteers.length > 0 && (
              <div className="border rounded-xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Volunteer</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Key Skills</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {volunteers.map((volunteer) => (
                      <TableRow 
                        key={volunteer.id} 
                        className="hover:bg-gray-50/70 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={volunteer.profile_picture || undefined} />
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                                {volunteer.full_name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-base">{volunteer.full_name}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span>
                              {[volunteer.residence_state, volunteer.residence_country]
                                .filter(Boolean)
                                .join(", ") || "Location not specified"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {volunteer.skills
                              .filter(s => s.toLowerCase().includes("project") || s.toLowerCase().includes("manage"))
                              .slice(0, 4)
                              .map(skill => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill.replace(/_/g, " ")}
                                </Badge>
                              ))}
                          </div>
                        </TableCell>

                        <TableCell className="max-w-xs">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {volunteer.experience || <em className="text-gray-400">No experience listed</em>}
                          </p>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => setConfirmVolunteer(volunteer)}
                            variant="outline"
                            className="text-diaspora-darkBlue hover:bg-diaspora-blue/10 border-diaspora-darkBlue"
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Invite
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
      <Dialog open={!!confirmVolunteer} onOpenChange={() => setConfirmVolunteer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Invitation</DialogTitle>
            <DialogDescription className="text-base">
              Send a project manager invitation to:
            </DialogDescription>
          </DialogHeader>

          {confirmVolunteer && (
            <div className="flex items-center gap-4 py-4 px-6 bg-gray-50 rounded-lg">
              <Avatar className="h-14 w-14">
                <AvatarImage src={confirmVolunteer.profile_picture || undefined} />
                <AvatarFallback className="text-lg">
                  {confirmVolunteer.full_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{confirmVolunteer.full_name}</p>
                <p className="text-sm text-gray-600">
                  {confirmVolunteer.residence_state && `${confirmVolunteer.residence_state}, `}
                  {confirmVolunteer.residence_country}
                </p>
              </div>
            </div>
          )}

          <DialogDescription className="pt-2">
            This will send an official invitation. They can accept or decline from their dashboard.
            {currentManager && (
              <span className="block mt-3 text-amber-700 font-medium">
                Note: This will replace the current manager ({currentManager.full_name}).
              </span>
            )}
          </DialogDescription>

          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => setConfirmVolunteer(null)}
              disabled={assigning}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={assigning}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {assigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}