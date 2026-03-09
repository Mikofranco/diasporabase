// components/project/VolunteersList.tsx
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CalendarDays, Mail } from "lucide-react";
import { Volunteer } from "@/lib/types";
import VolunteerInfoModal, { VolunteerViewerRole } from "@/components/modals/voulunteer-modal";
import { useState } from "react";

interface VolunteersListProps {
  volunteers: Volunteer[];
  /** Same-project volunteers see name/email/skills (no DOB); public respects anonymous. */
  viewerRole?: VolunteerViewerRole;
  /** Volunteer IDs who are Project Managers for this project; show PM badge when provided. */
  projectManagerIds?: string[];
}

export default function VolunteersList({ volunteers, viewerRole = "volunteer_same_project", projectManagerIds = [] }: VolunteersListProps) {
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  if (volunteers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No volunteers registered yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableCaption className="text-left pl-6 pb-4">
            A list of all volunteers currently registered for this project.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Joined Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {volunteers.map((v) => {
              const anonym = viewerRole === "public" && v.anonymous === true;
              const isPm = projectManagerIds.includes(v.volunteer_id ?? v.id ?? "");
              return (
              <TableRow key={v.id ?? v.volunteer_id} data-modal-trigger="volunteer-info-modal" onClick={()=> setSelectedVolunteer(v)}>
                <TableCell>
                  <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center shrink-0">
                    {!anonym && v.avatar_url ? (
                      <img
                        src={v.avatar_url}
                        alt={v.full_name}
                        className="rounded-full object-cover w-full h-full"
                      />
                    ) : (
                      <Users className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{anonym ? "Volunteer" : v.full_name}</span>
                    {isPm && (
                      <Badge variant="secondary" className="text-xs bg-diaspora-blue/15 text-diaspora-darkBlue border-diaspora-blue/30">
                        PM
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {!anonym && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate max-w-xs">{v.email}</span>
                  </div>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center justify-end gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {format(new Date(v.joined_at), "MMM d, yyyy") || "N/A"}
                  </div>
                </TableCell>
              </TableRow>
            );})}
          </TableBody>
        </Table>
      </CardContent>

      {/* Volunteer Info Modal */}
      {selectedVolunteer && (
        <VolunteerInfoModal
          showAll={viewerRole === "admin"}
          viewerRole={viewerRole}
          volunteer={selectedVolunteer}
        />
      ) }
    </Card>
  );
}