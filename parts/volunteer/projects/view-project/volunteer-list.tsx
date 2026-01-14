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
import { Users, CalendarDays, Mail } from "lucide-react";
import { Volunteer } from "@/lib/types";
import VolunteerInfoModal from "@/components/modals/voulunteer-modal";
import { useState } from "react";



interface VolunteersListProps {
  volunteers: Volunteer[];
}

export default function VolunteersList({ volunteers }: VolunteersListProps) {
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
            {volunteers.map((v) => (
              <TableRow key={v.id} data-modal-trigger="volunteer-info-modal" onClick={()=> setSelectedVolunteer(v)}>
                <TableCell>
                  <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center shrink-0">
                    {v.avatar_url ? (
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
                <TableCell className="font-medium">{v.full_name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate max-w-xs">{v.email}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center justify-end gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {format(new Date(v.joined_at), "MMM d, yyyy") || "N/A"}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Volunteer Info Modal */}
      {selectedVolunteer && (
        <VolunteerInfoModal
          showAll={true}
          volunteer={selectedVolunteer}
        />
      ) }
    </Card>
  );
}