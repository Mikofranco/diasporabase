"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Mail, Calendar, Star, Phone } from "lucide-react";

/** Format date string to "Month Day" (e.g. "March 15") for display only. */
function formatMonthDay(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}

interface Volunteer {
  volunteer_id: string;
  full_name: string;
  email: string;
  profile_picture?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  skills: string[];
  availability: string;
  experience?: string | null;
  residence_country: string;
  residence_state?: string | null;
  volunteer_countries: string[];
  volunteer_states: string[];
  volunteer_lgas: string[];
  average_rating: number;
  anonymous?: boolean;
}

interface AssignedVolunteersTableProps {
  volunteers: Volunteer[];
}

export function AssignedVolunteersTable({ volunteers }: AssignedVolunteersTableProps) {
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);

  if (volunteers.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
        <p className="text-gray-500 text-lg">No volunteers assigned yet</p>
        <p className="text-sm text-gray-400 mt-2">Volunteers will appear here once they join the project</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Volunteer</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead className="text-right">Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {volunteers.map((volunteer) => (
              <TableRow
                key={volunteer.volunteer_id}
                className="hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedVolunteer(volunteer)}
              >
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={volunteer.profile_picture || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {volunteer.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{volunteer.full_name}</p>
                      <p className="text-sm text-muted-foreground">{volunteer.email}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>
                      {[volunteer.residence_state, volunteer.residence_country]
                        .filter(Boolean)
                        .join(", ") || "Not specified"}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {volunteer.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill.replace(/_/g, " ")}
                      </Badge>
                    ))}
                    {volunteer.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{volunteer.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {volunteer.availability || "N/A"}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="font-medium">{volunteer.average_rating.toFixed(1)}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Volunteer Details Modal – agency always sees full info for assigned volunteers */}
      <Dialog open={!!selectedVolunteer} onOpenChange={() => setSelectedVolunteer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedVolunteer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-diaspora-blue/20 shrink-0">
                    <AvatarImage src={selectedVolunteer.profile_picture || undefined} alt="" />
                    <AvatarFallback className="text-2xl bg-diaspora-blue/10 text-diaspora-darkBlue">
                      {selectedVolunteer.full_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <span className="block truncate">{selectedVolunteer.full_name}</span>
                    <p className="text-sm font-normal text-muted-foreground mt-1">Assigned volunteer</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Personal & contact info – always shown for assigned (agency) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${selectedVolunteer.email}`}
                      className="flex items-center gap-2 text-diaspora-blue hover:underline break-all"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      {selectedVolunteer.email}
                    </a>
                  </div>
                  {selectedVolunteer.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a
                        href={`tel:${selectedVolunteer.phone}`}
                        className="flex items-center gap-2 text-diaspora-blue hover:underline"
                      >
                        <Phone className="h-4 w-4 shrink-0" />
                        {selectedVolunteer.phone}
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Date of birth</p>
                    <p className="flex items-center gap-2 text-foreground">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatMonthDay(selectedVolunteer.date_of_birth)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Availability</p>
                    <Badge variant="outline" className="capitalize mt-1">
                      {selectedVolunteer.availability}
                    </Badge>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Location</p>
                  <div className="flex items-center gap-2 text-base">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span>
                      {[selectedVolunteer.residence_state, selectedVolunteer.residence_country]
                        .filter(Boolean)
                        .join(", ") || "Not specified"}
                    </span>
                  </div>
                </div>

                {/* Experience */}
                {selectedVolunteer.experience && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Experience</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap rounded-md bg-muted/50 p-3">
                      {selectedVolunteer.experience}
                    </p>
                  </div>
                )}

                {/* Skills */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedVolunteer.skills.map((skill) => (
                      <Badge key={skill} className="bg-diaspora-blue/10 text-diaspora-darkBlue border-diaspora-blue/20">
                        {skill.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <span className="text-2xl font-bold">{selectedVolunteer.average_rating.toFixed(1)}</span>
                  </div>
                  <p className="text-muted-foreground">Average rating</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}