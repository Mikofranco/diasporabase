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
  DialogDescription,
} from "@/components/ui/dialog";
import { MapPin, Mail, Calendar, Star } from "lucide-react";

interface Volunteer {
  volunteer_id: string;
  full_name: string;
  email: string;
  profile_picture?: string;
  skills: string[];
  availability: string;
  residence_country: string;
  residence_state?: string | null;
  volunteer_countries: string[];
  volunteer_states: string[];
  volunteer_lgas: string[];
  average_rating: number;
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

      {/* Volunteer Details Modal */}
      <Dialog open={!!selectedVolunteer} onOpenChange={() => setSelectedVolunteer(null)}>
        <DialogContent className="max-w-2xl">
          {selectedVolunteer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedVolunteer.profile_picture || undefined} />
                    <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
                      {selectedVolunteer.full_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    {selectedVolunteer.full_name}
                    <p className="text-sm font-normal text-muted-foreground mt-1">
                      Volunteer
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${selectedVolunteer.email}`}
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      {selectedVolunteer.email}
                    </a>
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
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span>
                      {[selectedVolunteer.residence_state, selectedVolunteer.residence_country]
                        .filter(Boolean)
                        .join(", ") || "Not specified"}
                    </span>
                  </div>
                </div>

                {/* Willing to Volunteer In */}
                {/* {(selectedVolunteer.volunteer_countries.length > 0 ||
                  selectedVolunteer.volunteer_states.length > 0 ||
                  selectedVolunteer.volunteer_lgas.length > 0) && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Willing to Volunteer In</p>
                    <div className="space-y-2">
                      {selectedVolunteer.volunteer_countries.length > 0 && (
                        <div>
                          <p className="font-medium">Countries</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedVolunteer.volunteer_countries.map((c) => (
                              <Badge key={c} variant="secondary">{c}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedVolunteer.volunteer_states.length > 0 && (
                        <div>
                          <p className="font-medium">States</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedVolunteer.volunteer_states.map((s) => (
                              <Badge key={s} variant="outline">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )} */}

                {/* Skills */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedVolunteer.skills.map((skill) => (
                      <Badge key={skill} className="bg-blue-100 text-blue-800">
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
                  <p className="text-muted-foreground">Average Rating</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}