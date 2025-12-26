"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Mail,
  Globe,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";

const supabase = createClient();

interface PendingAgency {
  id: string;
  organization_name: string;
  contact_person_first_name: string;
  contact_person_last_name: string;
  contact_person_email: string;
  contact_person_phone?: string | null;
  website?: string | null;
  organization_type?: string | null;
  description?: string | null;
  focus_areas?: string[] | null;
  created_at: string;
}

export function PendingAgenciesModal() {
  const [agencies, setAgencies] = useState<PendingAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<PendingAgency | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchPendingAgencies = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          organization_name,
          contact_person_first_name,
          contact_person_last_name,
          contact_person_email,
          contact_person_phone,
          website,
          organization_type,
          description,
          focus_areas,
          created_at
        `)
        .eq("role", "agency")
        .neq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pending agencies:", error);
        toast.error("Failed to load pending agencies");
      } else {
        const pending = data || [];
        setAgencies(pending);
        setOpen(pending.length > 0);
      }

      setLoading(false);
    };

    fetchPendingAgencies();
  }, []);

  const handleConfirmAction = async () => {
    if (!selectedAgency) return;

    if (confirmAction === "approve") {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: true })
        .eq("id", selectedAgency.id);

      if (error) {
        toast.error("Failed to approve agency");
      } else {
        toast.success(`"${selectedAgency.organization_name}" has been approved and activated!`);
        setAgencies((prev) => prev.filter((a) => a.id !== selectedAgency.id));
        if (agencies.length === 1) setOpen(false);
      }
    } else if (confirmAction === "reject") {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("id", selectedAgency.id);

      if (error) {
        toast.error("Failed to reject agency");
      } else {
        toast.success(`"${selectedAgency.organization_name}" registration has been rejected.`);
        setAgencies((prev) => prev.filter((a) => a.id !== selectedAgency.id));
        if (agencies.length === 1) setOpen(false);
      }
    }

    setConfirmOpen(false);
    setConfirmAction(null);
    setSelectedAgency(null);
  };

  const openConfirmDialog = (action: "approve" | "reject", agency: PendingAgency) => {
    setConfirmAction(action);
    setSelectedAgency(agency);
    setConfirmOpen(true);
  };

  // Don't render if no pending agencies
  if (agencies.length === 0 && !loading) return null;

  return (
    <>
      {/* Main Modal - Pending Agencies List */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold flex items-center gap-4">
              <Building2 className="h-10 w-10 text-blue-600" />
              Pending Agency Approvals
            </DialogTitle>
            <DialogDescription className="text-lg mt-2">
              {agencies.length} agenc{agencies.length === 1 ? "y" : "ies"} awaiting activation
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8">
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Focus Areas</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agencies.map((agency) => (
                    <TableRow
                      key={agency.id}
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/super_admin/agencies/${agency.id}`)}
                    >
                      <TableCell className="font-medium max-w-sm">
                        <p className="font-semibold text-lg">{agency.organization_name}</p>
                        {agency.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                            {agency.description}
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {agency.contact_person_first_name} {agency.contact_person_last_name}
                          </p>
                          <a
                            href={`mailto:${agency.contact_person_email}`}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail className="h-3.5 w-3.5" />
                            {agency.contact_person_email}
                          </a>
                          {agency.contact_person_phone && (
                            <p className="text-sm text-muted-foreground">
                              {agency.contact_person_phone}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-2 text-sm">
                          {agency.organization_type && (
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                              <span>{agency.organization_type}</span>
                            </div>
                          )}
                          {agency.website && (
                            <a
                              href={agency.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Globe className="h-3.5 w-3.5" />
                              Website
                            </a>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {agency.focus_areas && agency.focus_areas.length > 0 ? (
                            agency.focus_areas.slice(0, 4).map((area, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {area}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">Not specified</span>
                          )}
                          {agency.focus_areas && agency.focus_areas.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{agency.focus_areas.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {new Date(agency.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </TableCell>

                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-3">
                          <Button
                            size="sm"
                            onClick={() => openConfirmDialog("approve", agency)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openConfirmDialog("reject", agency)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="mt-10 flex justify-end">
            <Button variant="outline" size="lg" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Approve/Reject */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "approve" ? "Approve Agency?" : "Reject Agency?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "approve" ? (
                <>
                  You are about to <strong>approve and activate</strong> the agency:
                  <br />
                  <span className="font-semibold text-lg mt-2 block">
                    {selectedAgency?.organization_name}
                  </span>
                  <br />
                  They will immediately gain full access to create projects and manage volunteers.
                </>
              ) : (
                <>
                  You are about to <strong>reject</strong> the agency registration:
                  <br />
                  <span className="font-semibold text-lg mt-2 block">
                    {selectedAgency?.organization_name}
                  </span>
                  <br />
                  They will not be able to log in or access the platform.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                confirmAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-destructive hover:bg-destructive/90"
              }
            >
              {confirmAction === "approve" ? "Yes, Approve Agency" : "Yes, Reject Agency"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}